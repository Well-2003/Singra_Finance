"""Singra - metas de economia e a meta especial de investimento.

Quanto já foi guardado nunca é uma coluna: é a soma dos aportes, calculada
na hora da leitura. Assim o valor guardado e o histórico de quando ele foi
guardado nunca discordam entre si.

A meta de investimento é a mesma tabela com `eh_investimento` marcado. Ela
tem cadência em vez de prazo e se renova sozinha a cada período, mas
reaproveita toda a mecânica de aporte e progresso das metas comuns.
"""

from src.db import conexao

# O LEFT JOIN traz a meta mesmo sem nenhum aporte, com guardado igual a zero
CAMPOS = """
    m.id, m.nome, m.valor_alvo, m.prazo, m.icone,
    m.reserva_emergencia, m.eh_investimento, m.cadencia,
    m.concluida_em, m.criado_em,
    COALESCE(SUM(a.valor), 0) AS guardado
"""


# Leitura
def listar(usuario_id, incluir_investimento=False):
    """As metas comuns, com as conquistadas no fim da lista.

    A meta de investimento fica de fora por padrão: ela tem cartão próprio
    na tela, com progresso do período, e apareceria errada em uma lista que
    mostra o total acumulado.
    """
    sql = f"""
        SELECT {CAMPOS}
          FROM metas m
          LEFT JOIN aportes_meta a ON a.meta_id = m.id
         WHERE m.usuario_id = %s
    """
    if not incluir_investimento:
        sql += " AND m.eh_investimento = FALSE"
    sql += """
         GROUP BY m.id
         ORDER BY (m.concluida_em IS NOT NULL), m.criado_em DESC
    """
    return conexao.consultar(sql, (usuario_id,))


def destaques(usuario_id, limite=2):
    """As metas comuns em andamento que aparecem no painel Início."""
    return conexao.consultar(
        f"""
        SELECT {CAMPOS}
          FROM metas m
          LEFT JOIN aportes_meta a ON a.meta_id = m.id
         WHERE m.usuario_id = %s
           AND m.concluida_em IS NULL
           AND m.eh_investimento = FALSE
         GROUP BY m.id
         ORDER BY m.criado_em DESC
         LIMIT %s
        """,
        (usuario_id, limite),
    )


def por_id(usuario_id, meta_id):
    return conexao.consultar_um(
        f"""
        SELECT {CAMPOS}
          FROM metas m
          LEFT JOIN aportes_meta a ON a.meta_id = m.id
         WHERE m.id = %s AND m.usuario_id = %s
         GROUP BY m.id
        """,
        (meta_id, usuario_id),
    )


def investimento(usuario_id):
    """A meta especial de investimento, se existir.

    Só pode haver uma ativa por usuário: dois números de "guardado este mês"
    fragmentariam a resposta que o cartão do Início precisa dar.
    """
    return conexao.consultar_um(
        f"""
        SELECT {CAMPOS}
          FROM metas m
          LEFT JOIN aportes_meta a ON a.meta_id = m.id
         WHERE m.usuario_id = %s AND m.eh_investimento = TRUE
         GROUP BY m.id
         LIMIT 1
        """,
        (usuario_id,),
    )


def tem_reserva_emergencia(usuario_id):
    """Se já existe, a tela de Metas para de sugerir criar uma."""
    return conexao.valor_unico(
        "SELECT COUNT(*) FROM metas WHERE usuario_id = %s AND reserva_emergencia = TRUE",
        (usuario_id,),
        padrao=0,
    ) > 0


def guardado_no_periodo(meta_id, inicio, fim):
    """Quanto foi guardado dentro de um período da cadência.

    É esse o número do cartão "Guardado este mês": o progresso do período
    atual, e não o total acumulado desde que a meta foi criada.
    """
    return conexao.valor_unico(
        "SELECT COALESCE(SUM(valor), 0) FROM aportes_meta WHERE meta_id = %s AND data BETWEEN %s AND %s",
        (meta_id, inicio, fim),
        padrao=0,
    )


def aportes(meta_id, inicio=None, fim=None):
    sql = "SELECT id, valor, data FROM aportes_meta WHERE meta_id = %s"
    parametros = [meta_id]
    if inicio:
        sql += " AND data >= %s"
        parametros.append(inicio)
    if fim:
        sql += " AND data <= %s"
        parametros.append(fim)
    sql += " ORDER BY data DESC, id DESC"
    return conexao.consultar(sql, tuple(parametros))


# Escrita
def criar(usuario_id, nome, valor_alvo, prazo=None, icone="meta",
          reserva_emergencia=False, eh_investimento=False, cadencia=None):
    return conexao.executar(
        """
        INSERT INTO metas
            (usuario_id, nome, valor_alvo, prazo, icone,
             reserva_emergencia, eh_investimento, cadencia)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (usuario_id, nome, valor_alvo, prazo, icone,
         bool(reserva_emergencia), bool(eh_investimento),
         cadencia if eh_investimento else None),
    )


def atualizar(usuario_id, meta_id, nome=None, valor_alvo=None, prazo=None,
              icone=None, cadencia=None):
    campos = []
    parametros = []
    for coluna, valor in (("nome", nome), ("valor_alvo", valor_alvo),
                          ("prazo", prazo), ("icone", icone),
                          ("cadencia", cadencia)):
        if valor is not None:
            campos.append(f"{coluna} = %s")
            parametros.append(valor)
    if not campos:
        return 0
    parametros.extend([meta_id, usuario_id])
    return conexao.afetadas(
        f"UPDATE metas SET {', '.join(campos)} WHERE id = %s AND usuario_id = %s",
        tuple(parametros),
    )


def apagar(usuario_id, meta_id):
    return conexao.afetadas(
        "DELETE FROM metas WHERE id = %s AND usuario_id = %s", (meta_id, usuario_id)
    )


def registrar_aporte(meta_id, valor, data, commit=True):
    """Guarda um valor na meta, com a data em que isso aconteceu."""
    return conexao.executar(
        "INSERT INTO aportes_meta (meta_id, valor, data) VALUES (%s, %s, %s)",
        (meta_id, valor, data),
        commit=commit,
    )


def marcar_conclusao(usuario_id, meta_id, concluida):
    """Guarda ou limpa a data da conquista, conforme o total dos aportes.

    Chamado depois de cada aporte, e só para metas comuns: a de
    investimento nunca "termina", ela recomeça a cada período.
    """
    if concluida:
        return conexao.afetadas(
            """
            UPDATE metas SET concluida_em = NOW()
             WHERE id = %s AND usuario_id = %s
               AND concluida_em IS NULL AND eh_investimento = FALSE
            """,
            (meta_id, usuario_id),
        )
    return conexao.afetadas(
        """
        UPDATE metas SET concluida_em = NULL
         WHERE id = %s AND usuario_id = %s AND concluida_em IS NOT NULL
        """,
        (meta_id, usuario_id),
    )
