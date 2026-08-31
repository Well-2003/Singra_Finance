"""Singra - cartões e contas bancárias.

Recurso totalmente opcional. Quem não cadastrar nenhum nunca vê o campo de
vínculo na tela de adicionar gasto nem o gráfico por cartão, a ausência é
tratada como "esse recurso não existe", e não como uma lista vazia.
"""

from src.db import conexao


# Leitura
def listar(usuario_id):
    return conexao.consultar(
        """
        SELECT id, nome, cor, criado_em
          FROM cartoes_bancos
         WHERE usuario_id = %s
         ORDER BY nome
        """,
        (usuario_id,),
    )


def por_id(usuario_id, cartao_id):
    return conexao.consultar_um(
        "SELECT * FROM cartoes_bancos WHERE id = %s AND usuario_id = %s",
        (cartao_id, usuario_id),
    )


def quantidade(usuario_id):
    """Usada para decidir se o gráfico por cartão aparece."""
    return conexao.valor_unico(
        "SELECT COUNT(*) FROM cartoes_bancos WHERE usuario_id = %s",
        (usuario_id,),
        padrao=0,
    )


# Escrita
def criar(usuario_id, nome, cor="#8FA3B8"):
    return conexao.executar(
        "INSERT INTO cartoes_bancos (usuario_id, nome, cor) VALUES (%s, %s, %s)",
        (usuario_id, nome, cor),
    )


def atualizar(usuario_id, cartao_id, nome=None, cor=None):
    campos = []
    parametros = []
    if nome:
        campos.append("nome = %s")
        parametros.append(nome)
    if cor:
        campos.append("cor = %s")
        parametros.append(cor)
    if not campos:
        return 0
    parametros.extend([cartao_id, usuario_id])
    return conexao.afetadas(
        f"UPDATE cartoes_bancos SET {', '.join(campos)} WHERE id = %s AND usuario_id = %s",
        tuple(parametros),
    )


def apagar(usuario_id, cartao_id):
    """Remove o cartão.

    Os gastos vinculados a ele não são apagados: a chave estrangeira usa
    ON DELETE SET NULL, então eles passam a contar como "sem cartão
    vinculado" no gráfico. Perder o rótulo é aceitável, perder o gasto não.
    """
    return conexao.afetadas(
        "DELETE FROM cartoes_bancos WHERE id = %s AND usuario_id = %s",
        (cartao_id, usuario_id),
    )
