"""Singra - gastos e ganhos.

Truque usado nas consultas por mês: como o mês financeiro começa no dia
escolhido pelo usuário, subtrair (dia_inicio - 1) dias da data faz o mês do
calendário coincidir com o mês financeiro. Assim um GROUP BY comum já agrupa
pelo período certo, sem precisar de uma consulta por mês.
"""

from datetime import date

from src.db import conexao

# Colunas devolvidas em toda leitura. A categoria vem junto em todas elas
# porque a tela sempre mostra ícone e cor. O cartão vem quando existe.
CAMPOS = """
    t.id, t.usuario_id, t.categoria_id, t.cartao_id, t.tipo, t.valor,
    t.descricao, t.data, t.forma_pagamento, t.fixa,
    t.parcela_atual, t.parcela_total, t.grupo_parcela,
    c.nome AS categoria_nome, c.icone AS categoria_icone,
    c.cor AS categoria_cor, c.essencial AS categoria_essencial,
    b.nome AS cartao_nome, b.cor AS cartao_cor
"""

DE = """
    FROM transacoes t
    JOIN categorias c ON c.id = t.categoria_id
    LEFT JOIN cartoes_bancos b ON b.id = t.cartao_id
"""


def _deslocamento(dia_inicio):
    """Quantos dias subtrair da data para o GROUP BY cair no mês certo."""
    return max(int(dia_inicio or 1), 1) - 1


# Escrita
def criar(usuario_id, categoria_id, tipo, valor, data, descricao=None,
          forma_pagamento="pix", fixa=False, cartao_id=None,
          parcela_atual=None, parcela_total=None, grupo_parcela=None,
          commit=True):
    return conexao.executar(
        """
        INSERT INTO transacoes
            (usuario_id, categoria_id, cartao_id, tipo, valor, descricao, data,
             forma_pagamento, fixa, parcela_atual, parcela_total, grupo_parcela)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (usuario_id, categoria_id, cartao_id, tipo, valor, descricao, data,
         forma_pagamento, bool(fixa), parcela_atual, parcela_total, grupo_parcela),
        commit=commit,
    )


def criar_lote(linhas, commit=True):
    """Várias transações de uma vez, usado pelo parcelamento."""
    return conexao.executar_muitos(
        """
        INSERT INTO transacoes
            (usuario_id, categoria_id, cartao_id, tipo, valor, descricao, data,
             forma_pagamento, fixa, parcela_atual, parcela_total, grupo_parcela)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        linhas,
        commit=commit,
    )


def atualizar(usuario_id, transacao_id, **campos):
    """Muda só os campos recebidos.

    A lista de permitidos existe para que a requisição não consiga alterar
    o usuario_id nem os dados do parcelamento de uma transação já gravada.
    """
    permitidos = ("categoria_id", "cartao_id", "tipo", "valor", "descricao",
                  "data", "forma_pagamento", "fixa")
    partes = []
    parametros = []
    for nome in permitidos:
        if nome in campos:
            partes.append(f"{nome} = %s")
            parametros.append(campos[nome])
    if not partes:
        return 0
    parametros.extend([transacao_id, usuario_id])
    return conexao.afetadas(
        f"UPDATE transacoes SET {', '.join(partes)} WHERE id = %s AND usuario_id = %s",
        tuple(parametros),
    )


def apagar(usuario_id, transacao_id):
    return conexao.afetadas(
        "DELETE FROM transacoes WHERE id = %s AND usuario_id = %s",
        (transacao_id, usuario_id),
    )


def apagar_grupo(usuario_id, grupo_parcela):
    """Apaga todas as parcelas de uma mesma compra."""
    return conexao.afetadas(
        "DELETE FROM transacoes WHERE grupo_parcela = %s AND usuario_id = %s",
        (grupo_parcela, usuario_id),
    )


# Leitura
def por_id(usuario_id, transacao_id):
    return conexao.consultar_um(
        f"SELECT {CAMPOS} {DE} WHERE t.id = %s AND t.usuario_id = %s",
        (transacao_id, usuario_id),
    )


def listar(usuario_id, inicio=None, fim=None, tipo=None, categoria_id=None,
           forma_pagamento=None, cartao_id=None, limite=None):
    """Lista com os filtros do histórico, todos opcionais.

    A consulta é montada por partes, mas os valores continuam entrando como
    parâmetros: o que cresce é só o texto fixo do SQL.
    """
    sql = f"SELECT {CAMPOS} {DE} WHERE t.usuario_id = %s"
    parametros = [usuario_id]
    if inicio:
        sql += " AND t.data >= %s"
        parametros.append(inicio)
    if fim:
        sql += " AND t.data <= %s"
        parametros.append(fim)
    if tipo in ("gasto", "ganho"):
        sql += " AND t.tipo = %s"
        parametros.append(tipo)
    if categoria_id:
        sql += " AND t.categoria_id = %s"
        parametros.append(categoria_id)
    if forma_pagamento:
        sql += " AND t.forma_pagamento = %s"
        parametros.append(forma_pagamento)
    if cartao_id:
        sql += " AND t.cartao_id = %s"
        parametros.append(cartao_id)
    # O desempate pelo id mantém a ordem estável entre registros do mesmo dia
    sql += " ORDER BY t.data DESC, t.id DESC"
    if limite:
        sql += " LIMIT %s"
        parametros.append(int(limite))
    return conexao.consultar(sql, tuple(parametros))


def ultimas(usuario_id, limite=5, ate=None):
    """Os últimos registros já acontecidos, para o cartão do painel Início.

    O corte em hoje existe por causa das compras parceladas: as parcelas dos
    meses seguintes já estão gravadas, e sem o corte apareceriam no topo da
    lista como se fossem as movimentações mais recentes.
    """
    return listar(usuario_id, fim=ate or date.today(), limite=limite)


def primeira_do_grupo(usuario_id, grupo_parcela):
    """A parcela 1 de uma compra parcelada."""
    return conexao.consultar_um(
        f"""
        SELECT {CAMPOS} {DE}
         WHERE t.usuario_id = %s AND t.grupo_parcela = %s
         ORDER BY t.parcela_atual
         LIMIT 1
        """,
        (usuario_id, grupo_parcela),
    )


# Somas
def total(usuario_id, tipo, inicio, fim):
    return conexao.valor_unico(
        """
        SELECT COALESCE(SUM(valor), 0) FROM transacoes
         WHERE usuario_id = %s AND tipo = %s AND data BETWEEN %s AND %s
        """,
        (usuario_id, tipo, inicio, fim),
        padrao=0,
    )


def totais_do_periodo(usuario_id, inicio, fim):
    """{'ganho': x, 'gasto': y} em uma consulta só."""
    linhas = conexao.consultar(
        """
        SELECT tipo, COALESCE(SUM(valor), 0) AS total
          FROM transacoes
         WHERE usuario_id = %s AND data BETWEEN %s AND %s
         GROUP BY tipo
        """,
        (usuario_id, inicio, fim),
    )
    # O dicionário já nasce zerado: mês sem ganho nenhum devolve 0, não None
    resultado = {"ganho": 0, "gasto": 0}
    for linha in linhas:
        resultado[linha["tipo"]] = linha["total"]
    return resultado


def por_categoria(usuario_id, inicio, fim, tipo="gasto"):
    """Soma agrupada por categoria, da maior para a menor."""
    return conexao.consultar(
        """
        SELECT c.id, c.nome, c.icone, c.cor, c.essencial,
               COALESCE(SUM(t.valor), 0) AS total
          FROM transacoes t
          JOIN categorias c ON c.id = t.categoria_id
         WHERE t.usuario_id = %s AND t.tipo = %s AND t.data BETWEEN %s AND %s
         GROUP BY c.id, c.nome, c.icone, c.cor, c.essencial
         ORDER BY total DESC
        """,
        (usuario_id, tipo, inicio, fim),
    )


def por_cartao(usuario_id, inicio, fim):
    """Soma dos gastos agrupada por cartão vinculado.

    Os gastos sem cartão entram com id nulo, e viram a fatia "Sem cartão
    vinculado", sem ela o gráfico não fecharia com o total do mês.
    """
    return conexao.consultar(
        """
        SELECT b.id, b.nome, b.cor, COALESCE(SUM(t.valor), 0) AS total
          FROM transacoes t
          LEFT JOIN cartoes_bancos b ON b.id = t.cartao_id
         WHERE t.usuario_id = %s AND t.tipo = 'gasto' AND t.data BETWEEN %s AND %s
         GROUP BY b.id, b.nome, b.cor
         ORDER BY total DESC
        """,
        (usuario_id, inicio, fim),
    )


def fixos_e_variaveis(usuario_id, inicio, fim):
    """Divide os gastos do mês entre os que se repetem e os demais."""
    linhas = conexao.consultar(
        """
        SELECT fixa, COALESCE(SUM(valor), 0) AS total
          FROM transacoes
         WHERE usuario_id = %s AND tipo = 'gasto' AND data BETWEEN %s AND %s
         GROUP BY fixa
        """,
        (usuario_id, inicio, fim),
    )
    resultado = {"fixos": 0, "variaveis": 0}
    for linha in linhas:
        chave = "fixos" if linha["fixa"] else "variaveis"
        resultado[chave] = linha["total"]
    return resultado


def evolucao(usuario_id, inicio, fim, dia_inicio=1):
    """Ganhos e gastos de cada mês financeiro dentro do intervalo.

    É aqui que o deslocamento explicado no topo do arquivo entra: sem ele,
    quem começa o mês no dia 5 veria os gráficos agrupados pelo calendário.
    """
    return conexao.consultar(
        """
        SELECT YEAR(DATE_SUB(data, INTERVAL %s DAY))  AS ano,
               MONTH(DATE_SUB(data, INTERVAL %s DAY)) AS mes,
               tipo,
               COALESCE(SUM(valor), 0) AS total
          FROM transacoes
         WHERE usuario_id = %s AND data BETWEEN %s AND %s
         GROUP BY ano, mes, tipo
         ORDER BY ano, mes
        """,
        (_deslocamento(dia_inicio), _deslocamento(dia_inicio),
         usuario_id, inicio, fim),
    )


def media_gastos_essenciais(usuario_id, inicio, fim, meses):
    """Média mensal dos gastos essenciais, base do cálculo da reserva."""
    total_essencial = conexao.valor_unico(
        """
        SELECT COALESCE(SUM(t.valor), 0)
          FROM transacoes t
          JOIN categorias c ON c.id = t.categoria_id
         WHERE t.usuario_id = %s AND t.tipo = 'gasto'
           AND c.essencial = TRUE
           AND t.data BETWEEN %s AND %s
        """,
        (usuario_id, inicio, fim),
        padrao=0,
    )
    if not meses:
        return 0
    return total_essencial / meses


def exportar(usuario_id):
    """Todas as transações do usuário, em ordem, para o CSV do perfil."""
    return conexao.consultar(
        """
        SELECT t.data, t.tipo, c.nome AS categoria, t.valor, t.descricao,
               t.forma_pagamento, b.nome AS cartao, t.fixa,
               t.parcela_atual, t.parcela_total
          FROM transacoes t
          JOIN categorias c ON c.id = t.categoria_id
          LEFT JOIN cartoes_bancos b ON b.id = t.cartao_id
         WHERE t.usuario_id = %s
         ORDER BY t.data, t.id
        """,
        (usuario_id,),
    )
