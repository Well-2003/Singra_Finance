"""Singra - categorias de gasto e de ganho.

As categorias padrão ficam no banco com usuario_id nulo, funcionando como
modelo. Cada conta nova recebe a própria cópia delas, e é por isso que uma
pessoa pode renomear "Delivery" para "iFood" sem mexer na de mais ninguém.
"""

from src.db import conexao


def clonar_modelos(usuario_id):
    """Copia as categorias modelo do sistema para um usuário novo."""
    return conexao.afetadas(
        """
        INSERT INTO categorias (usuario_id, nome, tipo, essencial, icone, cor, ordem)
        SELECT %s, nome, tipo, essencial, icone, cor, ordem
          FROM categorias
         WHERE usuario_id IS NULL
         ORDER BY tipo, ordem
        """,
        (usuario_id,),
        commit=False,
    )


# Leitura
def listar(usuario_id, tipo=None, incluir_ocultas=False):
    """As categorias do usuário, já na ordem em que aparecem na tela."""
    sql = "SELECT * FROM categorias WHERE usuario_id = %s"
    parametros = [usuario_id]
    if tipo:
        sql += " AND tipo = %s"
        parametros.append(tipo)
    # As ocultas só aparecem no perfil, onde dá para trazê-las de volta
    if not incluir_ocultas:
        sql += " AND oculta = FALSE"
    sql += " ORDER BY tipo, ordem, nome"
    return conexao.consultar(sql, tuple(parametros))


def por_id(usuario_id, categoria_id):
    """Busca conferindo se a categoria é mesmo daquele usuário."""
    return conexao.consultar_um(
        "SELECT * FROM categorias WHERE id = %s AND usuario_id = %s",
        (categoria_id, usuario_id),
    )


def mais_usadas(usuario_id, tipo="gasto", limite=6):
    """As categorias que a pessoa mais usa nos últimos 90 dias.

    Alimenta a grade de 6 ícones da tela de adicionar. Quem ainda não
    registrou nada recebe as primeiras da ordem padrão, para a grade nunca
    aparecer vazia no primeiro uso.
    """
    frequentes = conexao.consultar(
        """
        SELECT c.*, COUNT(t.id) AS usos
          FROM categorias c
          JOIN transacoes t
            ON t.categoria_id = c.id
           AND t.usuario_id = c.usuario_id
           AND t.data >= (CURRENT_DATE - INTERVAL 90 DAY)
         WHERE c.usuario_id = %s AND c.tipo = %s AND c.oculta = FALSE
         GROUP BY c.id
         ORDER BY usos DESC, c.ordem
         LIMIT %s
        """,
        (usuario_id, tipo, limite),
    )
    escolhidas = {c["id"]: c for c in frequentes}
    if len(escolhidas) < limite:
        for categoria in listar(usuario_id, tipo=tipo):
            if categoria["id"] not in escolhidas:
                escolhidas[categoria["id"]] = categoria
            if len(escolhidas) == limite:
                break
    return list(escolhidas.values())[:limite]


def para_conta_paga(usuario_id):
    """Categoria usada quando uma conta a pagar vira gasto.

    Prefere "Contas da casa", que é onde a maioria dos boletos se encaixa,
    e cai na primeira categoria de gasto se ela tiver sido apagada.
    """
    return conexao.consultar_um(
        """
        SELECT * FROM categorias
         WHERE usuario_id = %s AND tipo = 'gasto'
         ORDER BY (icone = 'contas') DESC, ordem
         LIMIT 1
        """,
        (usuario_id,),
    )


# Escrita
def criar(usuario_id, nome, tipo="gasto", essencial=False,
          icone="outros", cor="#B5B5A8"):
    """Cria uma categoria no fim da lista do usuário."""
    ordem = conexao.valor_unico(
        "SELECT COALESCE(MAX(ordem), 0) + 1 FROM categorias WHERE usuario_id = %s AND tipo = %s",
        (usuario_id, tipo),
        padrao=1,
    )
    return conexao.executar(
        """
        INSERT INTO categorias (usuario_id, nome, tipo, essencial, icone, cor, ordem)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (usuario_id, nome, tipo, bool(essencial), icone, cor, ordem),
    )


def atualizar(usuario_id, categoria_id, nome=None, icone=None, cor=None,
              essencial=None):
    campos = []
    parametros = []
    for coluna, valor in (("nome", nome), ("icone", icone), ("cor", cor)):
        if valor is not None:
            campos.append(f"{coluna} = %s")
            parametros.append(valor)
    if essencial is not None:
        campos.append("essencial = %s")
        parametros.append(bool(essencial))
    if not campos:
        return 0
    parametros.extend([categoria_id, usuario_id])
    return conexao.afetadas(
        f"UPDATE categorias SET {', '.join(campos)} WHERE id = %s AND usuario_id = %s",
        tuple(parametros),
    )


def alternar_oculta(usuario_id, categoria_id, oculta):
    """Esconde ou traz de volta uma categoria.

    Categorias são escondidas, nunca apagadas: os gastos já registrados
    nelas precisam continuar apontando para algum lugar.
    """
    return conexao.afetadas(
        "UPDATE categorias SET oculta = %s WHERE id = %s AND usuario_id = %s",
        (bool(oculta), categoria_id, usuario_id),
    )
