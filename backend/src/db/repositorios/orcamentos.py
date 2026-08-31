"""Singra - o planejamento do mês.

Guarda quanto o usuário decidiu gastar em cada categoria. Uma linha por
categoria, ano e mês, garantida pela chave única da tabela: é ela que
permite gravar e regravar o mesmo limite sem criar duplicata.
"""

from src.db import conexao


# Leitura
def listar(usuario_id, ano, mes):
    """Os limites do mês, com nome, ícone e cor da categoria junto."""
    return conexao.consultar(
        """
        SELECT o.id, o.categoria_id, o.valor_limite,
               c.nome, c.icone, c.cor, c.essencial
          FROM orcamentos o
          JOIN categorias c ON c.id = o.categoria_id
         WHERE o.usuario_id = %s AND o.ano = %s AND o.mes = %s
         ORDER BY c.ordem, c.nome
        """,
        (usuario_id, ano, mes),
    )


def total_planejado(usuario_id, ano, mes):
    """Soma dos limites. Zero significa que o mês não tem planejamento."""
    return conexao.valor_unico(
        """
        SELECT COALESCE(SUM(valor_limite), 0) FROM orcamentos
         WHERE usuario_id = %s AND ano = %s AND mes = %s
        """,
        (usuario_id, ano, mes),
        padrao=0,
    )


# Escrita
def salvar(usuario_id, categoria_id, ano, mes, valor_limite, commit=True):
    """Cria ou atualiza o limite de uma categoria no mês.

    O ON DUPLICATE KEY é um INSERT que vira UPDATE quando a linha já
    existe. Ele se apoia na chave única (usuario_id, categoria_id, ano,
    mes): se o banco recusar a inserção por causa dela, em vez de dar erro
    ele atualiza a linha que já estava lá.

    A alternativa seria consultar antes para saber se existe e escolher
    entre INSERT e UPDATE, o que são duas idas ao banco e uma janela entre
    elas em que dois pedidos simultâneos criariam duas linhas.
    """
    return conexao.executar(
        """
        INSERT INTO orcamentos (usuario_id, categoria_id, ano, mes, valor_limite)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE valor_limite = VALUES(valor_limite)
        """,
        (usuario_id, categoria_id, ano, mes, valor_limite),
        commit=commit,
    )


def apagar(usuario_id, categoria_id, ano, mes):
    """Tira a categoria do planejamento. É o que zerar o valor na tela faz."""
    return conexao.afetadas(
        """
        DELETE FROM orcamentos
         WHERE usuario_id = %s AND categoria_id = %s AND ano = %s AND mes = %s
        """,
        (usuario_id, categoria_id, ano, mes),
    )


def limpar_mes(usuario_id, ano, mes, commit=True):
    """Apaga o planejamento inteiro do mês, antes de gerar um novo."""
    return conexao.afetadas(
        "DELETE FROM orcamentos WHERE usuario_id = %s AND ano = %s AND mes = %s",
        (usuario_id, ano, mes),
        commit=commit,
    )


def copiar_de(usuario_id, ano_origem, mes_origem, ano_destino, mes_destino):
    """Copia o planejamento de um mês para outro.

    Quem já acertou os limites uma vez raramente quer refazê-los todo mês.
    Devolve quantas linhas vieram: zero significa que a origem estava vazia.
    """
    return conexao.afetadas(
        """
        INSERT INTO orcamentos (usuario_id, categoria_id, ano, mes, valor_limite)
        SELECT usuario_id, categoria_id, %s, %s, valor_limite
          FROM orcamentos
         WHERE usuario_id = %s AND ano = %s AND mes = %s
        ON DUPLICATE KEY UPDATE valor_limite = VALUES(valor_limite)
        """,
        (ano_destino, mes_destino, usuario_id, ano_origem, mes_origem),
    )
