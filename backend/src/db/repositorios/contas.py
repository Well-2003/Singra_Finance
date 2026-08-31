"""Singra - contas a pagar.

O calendário de vencimentos. Uma conta paga guarda o id do gasto que ela
gerou no histórico, e é esse vínculo que permite desfazer o pagamento
apagando o gasto junto, sem deixar lançamento órfão.
"""

from src.db import conexao

CAMPOS = """
    ct.id, ct.descricao, ct.valor, ct.vencimento, ct.recorrente,
    ct.paga_em, ct.transacao_id, ct.categoria_id,
    c.nome AS categoria_nome, c.icone AS categoria_icone, c.cor AS categoria_cor
"""


# Leitura
def listar(usuario_id, apenas_abertas=False, ate=None):
    """As contas do usuário, com as pagas no fim e as demais por vencimento."""
    sql = f"""
        SELECT {CAMPOS}
          FROM contas_pagar ct
          JOIN categorias c ON c.id = ct.categoria_id
         WHERE ct.usuario_id = %s
    """
    parametros = [usuario_id]
    if apenas_abertas:
        sql += " AND ct.paga_em IS NULL"
    if ate:
        sql += " AND ct.vencimento <= %s"
        parametros.append(ate)
    sql += " ORDER BY (ct.paga_em IS NOT NULL), ct.vencimento, ct.id"
    return conexao.consultar(sql, tuple(parametros))


def do_periodo(usuario_id, inicio, fim, incluir_atrasadas=False):
    """As contas que vencem dentro do período.

    Com incluir_atrasadas, traz junto as que ficaram para trás e continuam
    em aberto: no mês corrente elas são justamente as que importam, e
    escondê-las por estarem fora do intervalo seria esconder a dívida.
    """
    sql = f"""
        SELECT {CAMPOS}
          FROM contas_pagar ct
          JOIN categorias c ON c.id = ct.categoria_id
         WHERE ct.usuario_id = %s
           AND (
                (ct.vencimento BETWEEN %s AND %s)
    """
    parametros = [usuario_id, inicio, fim]
    if incluir_atrasadas:
        sql += " OR (ct.vencimento < %s AND ct.paga_em IS NULL)"
        parametros.append(inicio)
    sql += """
               )
         ORDER BY (ct.paga_em IS NOT NULL), ct.vencimento, ct.id
    """
    return conexao.consultar(sql, tuple(parametros))


def recorrentes_recentes(usuario_id):
    """A ocorrência mais nova de cada conta que se repete todo mês.

    Não existe um "id de família": ao pagar uma conta recorrente, o Singra
    cria a do mês seguinte como um registro novo. O que liga uma à outra é
    a descrição junto da categoria, e é por elas que agrupamos aqui, para
    conseguir projetar a próxima sem inventar uma tabela nova.
    """
    return conexao.consultar(
        f"""
        SELECT {CAMPOS}
          FROM contas_pagar ct
          JOIN categorias c ON c.id = ct.categoria_id
          JOIN (
                SELECT descricao, categoria_id, MAX(vencimento) AS ultimo
                  FROM contas_pagar
                 WHERE usuario_id = %s AND recorrente = TRUE
                 GROUP BY descricao, categoria_id
               ) ultima
            ON ultima.descricao = ct.descricao
           AND ultima.categoria_id = ct.categoria_id
           AND ultima.ultimo = ct.vencimento
         WHERE ct.usuario_id = %s AND ct.recorrente = TRUE
         GROUP BY ct.id
         ORDER BY ct.vencimento
        """,
        (usuario_id, usuario_id),
    )


def proximas(usuario_id, ate, limite=3):
    """Cartão "Próximas contas" do painel Início.

    Traz também as vencidas, que têm data anterior a hoje: são justamente
    as que a pessoa mais precisa ver quando abre o site.
    """
    return conexao.consultar(
        f"""
        SELECT {CAMPOS}
          FROM contas_pagar ct
          JOIN categorias c ON c.id = ct.categoria_id
         WHERE ct.usuario_id = %s AND ct.paga_em IS NULL AND ct.vencimento <= %s
         ORDER BY ct.vencimento
         LIMIT %s
        """,
        (usuario_id, ate, limite),
    )


def por_id(usuario_id, conta_id):
    return conexao.consultar_um(
        f"""
        SELECT {CAMPOS}
          FROM contas_pagar ct
          JOIN categorias c ON c.id = ct.categoria_id
         WHERE ct.id = %s AND ct.usuario_id = %s
        """,
        (conta_id, usuario_id),
    )


# Escrita
def criar(usuario_id, categoria_id, descricao, valor, vencimento, recorrente=False):
    return conexao.executar(
        """
        INSERT INTO contas_pagar
            (usuario_id, categoria_id, descricao, valor, vencimento, recorrente)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (usuario_id, categoria_id, descricao, valor, vencimento, bool(recorrente)),
    )


def atualizar(usuario_id, conta_id, **campos):
    permitidos = ("categoria_id", "descricao", "valor", "vencimento", "recorrente")
    partes = []
    parametros = []
    for nome in permitidos:
        if nome in campos:
            partes.append(f"{nome} = %s")
            parametros.append(campos[nome])
    if not partes:
        return 0
    parametros.extend([conta_id, usuario_id])
    return conexao.afetadas(
        f"UPDATE contas_pagar SET {', '.join(partes)} WHERE id = %s AND usuario_id = %s",
        tuple(parametros),
    )


def apagar(usuario_id, conta_id):
    return conexao.afetadas(
        "DELETE FROM contas_pagar WHERE id = %s AND usuario_id = %s",
        (conta_id, usuario_id),
    )


def marcar_paga(usuario_id, conta_id, paga_em, transacao_id, commit=True):
    """Marca como paga e guarda o gasto que foi criado junto.

    O "paga_em IS NULL" no final impede pagar duas vezes se o botão for
    tocado de novo antes de a tela atualizar.
    """
    return conexao.afetadas(
        """
        UPDATE contas_pagar SET paga_em = %s, transacao_id = %s
         WHERE id = %s AND usuario_id = %s AND paga_em IS NULL
        """,
        (paga_em, transacao_id, conta_id, usuario_id),
        commit=commit,
    )


def desmarcar_paga(usuario_id, conta_id):
    """Devolve a conta para "a pagar", depois de o gasto ser apagado."""
    return conexao.afetadas(
        """
        UPDATE contas_pagar SET paga_em = NULL, transacao_id = NULL
         WHERE id = %s AND usuario_id = %s
        """,
        (conta_id, usuario_id),
    )
