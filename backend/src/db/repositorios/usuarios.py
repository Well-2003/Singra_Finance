"""Singra - contas de usuário.

Cadastro, perfil, idioma e os tokens de redefinição de senha. As senhas
chegam aqui em texto e saem em hash: nenhuma função deste arquivo grava uma
senha legível no banco.
"""

from datetime import datetime, timedelta

from src.config import Config
from src.db import conexao
from src.db.repositorios import categorias
from src.core.seguranca import gerar_hash_senha, hash_token


# Leitura
def por_id(usuario_id):
    return conexao.consultar_um("SELECT * FROM usuarios WHERE id = %s", (usuario_id,))


def por_email(email):
    return conexao.consultar_um(
        "SELECT * FROM usuarios WHERE email = %s", (email.strip().lower(),)
    )


def email_existe(email):
    return por_email(email) is not None


def publico(usuario):
    """Monta o usuário sem o hash da senha, para devolver ao frontend."""
    if not usuario:
        return None
    return {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "apelido": usuario["apelido"] or usuario["nome"].split(" ")[0],
        "email": usuario["email"],
        "renda_estimada": float(usuario["renda_estimada"] or 0),
        "renda_variavel": bool(usuario["renda_variavel"]),
        "dia_inicio_mes": usuario["dia_inicio_mes"],
        "idioma": usuario["idioma"],
        "onboarding_ok": bool(usuario["onboarding_ok"]),
    }


# Cadastro e perfil
def criar(nome, email, senha):
    """Cria a conta já com as categorias padrão copiadas.

    As duas gravações vão na mesma transação: uma conta sem categoria
    nenhuma não teria como registrar o primeiro gasto.
    """
    usuario_id = conexao.executar(
        """
        INSERT INTO usuarios (nome, apelido, email, senha_hash)
        VALUES (%s, %s, %s, %s)
        """,
        # O apelido começa como o primeiro nome, e a pessoa muda no onboarding
        (nome.strip(), nome.strip().split(" ")[0], email.strip().lower(),
         gerar_hash_senha(senha)),
        commit=False,
    )
    categorias.clonar_modelos(usuario_id)
    conexao.commit()
    return usuario_id


def atualizar_perfil(usuario_id, nome=None, apelido=None, dia_inicio_mes=None,
                     idioma=None):
    campos = []
    parametros = []
    if nome:
        campos.append("nome = %s")
        parametros.append(nome.strip()[:100])
    if apelido is not None:
        campos.append("apelido = %s")
        parametros.append(apelido.strip()[:40] or None)
    if dia_inicio_mes:
        campos.append("dia_inicio_mes = %s")
        # O limite de 28 vale também aqui, e não só na tela, porque o campo
        # pode chegar por uma requisição montada fora do site
        parametros.append(min(max(int(dia_inicio_mes), 1), 28))
    if idioma in Config.IDIOMAS:
        campos.append("idioma = %s")
        parametros.append(idioma)
    if not campos:
        return 0
    parametros.append(usuario_id)
    return conexao.afetadas(
        f"UPDATE usuarios SET {', '.join(campos)} WHERE id = %s", tuple(parametros)
    )


def salvar_onboarding(usuario_id, renda=None, renda_variavel=None):
    """Guarda as respostas de renda do primeiro acesso."""
    campos = []
    parametros = []
    if renda is not None:
        campos.append("renda_estimada = %s")
        parametros.append(renda)
    if renda_variavel is not None:
        campos.append("renda_variavel = %s")
        parametros.append(bool(renda_variavel))
    if not campos:
        return 0
    parametros.append(usuario_id)
    return conexao.afetadas(
        f"UPDATE usuarios SET {', '.join(campos)} WHERE id = %s", tuple(parametros)
    )


def concluir_onboarding(usuario_id):
    return conexao.afetadas(
        "UPDATE usuarios SET onboarding_ok = TRUE WHERE id = %s", (usuario_id,)
    )


def trocar_senha(usuario_id, nova_senha):
    return conexao.afetadas(
        "UPDATE usuarios SET senha_hash = %s WHERE id = %s",
        (gerar_hash_senha(nova_senha), usuario_id),
    )


def apagar(usuario_id):
    """Apaga a conta e tudo o que pertence a ela.

    A ordem importa. Apagar o usuário sozinho não funciona: a cascata
    tentaria remover as categorias dele, mas transacoes e contas_pagar ainda
    apontam para elas, e essas duas chaves estrangeiras não têm cascata, de
    propósito, para que ninguém apague uma categoria que tem gasto dentro.

    Então as tabelas que referenciam categorias saem primeiro, e o DELETE do
    usuário leva o resto pela cascata. Tudo na mesma transação: ou a conta
    some inteira, ou nada muda.
    """
    for tabela in ("contas_pagar", "transacoes", "orcamentos"):
        conexao.executar(f"DELETE FROM {tabela} WHERE usuario_id = %s",
                         (usuario_id,), commit=False)

    removidos = conexao.afetadas("DELETE FROM usuarios WHERE id = %s",
                                 (usuario_id,), commit=False)
    conexao.commit()
    return removidos


# Renda extra: só um rótulo informativo do onboarding
def salvar_renda_extra(usuario_id, tipo, valor_estimado=None):
    """Guarda o tipo de renda extra informado.

    Não entra em cálculo nenhum: o valor é uma estimativa, e tratá-lo como
    dinheiro certo distorceria o "quanto posso gastar" nos meses em que o
    bico não aconteceu.
    """
    conexao.executar("DELETE FROM renda_extra WHERE usuario_id = %s",
                     (usuario_id,), commit=False)
    return conexao.executar(
        "INSERT INTO renda_extra (usuario_id, tipo, valor_estimado) VALUES (%s, %s, %s)",
        (usuario_id, tipo[:40], valor_estimado),
    )


def renda_extra(usuario_id):
    return conexao.consultar_um(
        "SELECT tipo, valor_estimado FROM renda_extra WHERE usuario_id = %s",
        (usuario_id,),
    )


# Redefinição de senha
def registrar_token(usuario_id, token_hash_valor):
    """Guarda o hash do token e invalida os pedidos anteriores.

    Se a pessoa pedir o link duas vezes, só o último vale: um link antigo
    esquecido em uma caixa de e-mail deixa de abrir a conta.
    """
    expira = datetime.now() + timedelta(hours=Config.TOKEN_SENHA_HORAS)
    conexao.executar(
        "UPDATE tokens_senha SET usado_em = NOW() WHERE usuario_id = %s AND usado_em IS NULL",
        (usuario_id,),
        commit=False,
    )
    return conexao.executar(
        "INSERT INTO tokens_senha (usuario_id, token_hash, expira_em) VALUES (%s, %s, %s)",
        (usuario_id, token_hash_valor, expira),
    )


def usuario_do_token(token):
    """Dono do token, se ele existir, não tiver sido usado e ainda valer."""
    return conexao.consultar_um(
        """
        SELECT u.*
          FROM tokens_senha t
          JOIN usuarios u ON u.id = t.usuario_id
         WHERE t.token_hash = %s
           AND t.usado_em IS NULL
           AND t.expira_em > NOW()
        """,
        (hash_token(token),),
    )


def consumir_token(token):
    """Marca o token como usado, para o link não servir uma segunda vez."""
    return conexao.afetadas(
        "UPDATE tokens_senha SET usado_em = NOW() WHERE token_hash = %s AND usado_em IS NULL",
        (hash_token(token),),
    )
