"""Singra - cadastro, login e recuperação de senha.

As três rotas que não exigem token, porque são elas que o emitem. O token
volta no corpo da resposta e o frontend o guarda. Daí em diante ele viaja no
cabeçalho `Authorization: Bearer <token>` de toda chamada.
"""

import re

from flask import Blueprint, current_app, request

from src.api.comum import corpo, erro, ok
from src.core.formato import para_decimal, texto_curto
from src.core.seguranca import (conferir_senha, forca_da_senha, gerar_token,
                                gerar_token_senha, requer_login)
from src.db.repositorios import usuarios

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Validação frouxa de propósito: só barra o que claramente não é e-mail
PADRAO_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")
MIN_SENHA = 8


def _email_valido(email):
    return bool(PADRAO_EMAIL.match((email or "").strip()))


@bp.post("/cadastro")
def cadastro():
    dados = corpo()
    nome = texto_curto(dados.get("nome"), 100, "")
    email = (dados.get("email") or "").strip().lower()
    senha = dados.get("senha") or ""

    if len(nome) < 2:
        return erro("Falta seu nome. Como podemos te chamar?", "nome")
    if not _email_valido(email):
        return erro("Esse e-mail parece incompleto. Confere para a gente?", "email")
    if usuarios.email_existe(email):
        return erro("Já existe uma conta com esse e-mail. Quer entrar?", "email")
    if len(senha) < MIN_SENHA:
        return erro(
            f"A senha precisa de pelo menos {MIN_SENHA} letras ou números.", "senha"
        )

    usuario_id = usuarios.criar(nome, email, senha)
    usuario = usuarios.por_id(usuario_id)
    return ok(
        token=gerar_token(usuario_id),
        usuario=usuarios.publico(usuario),
        mensagem="Conta criada. Bem-vindo ao Singra!",
    )


@bp.post("/login")
def login():
    dados = corpo()
    email = (dados.get("email") or "").strip().lower()
    senha = dados.get("senha") or ""

    conta = usuarios.por_email(email) if email else None
    if not conta or not conferir_senha(senha, conta["senha_hash"]):
        # A mesma mensagem nos dois casos: quem tenta adivinhar não descobre,
        # pela resposta, se aquele e-mail tem conta no site
        return erro(
            "Hmm, esses dados não bateram. Quer tentar de novo ou recuperar a senha?",
            "geral", status=401,
        )

    return ok(
        token=gerar_token(conta["id"]),
        usuario=usuarios.publico(conta),
        mensagem=f"Oi de novo, {conta['apelido'] or conta['nome']}!",
    )


@bp.post("/recuperar-senha")
def recuperar_senha():
    """Gera o link de redefinição.

    A resposta é sempre a mesma, exista ou não a conta, pelo mesmo motivo da
    mensagem única no login. Sem serviço de e-mail configurado, o link vai
    para o log do servidor e só volta na resposta em desenvolvimento.
    """
    email = (corpo().get("email") or "").strip().lower()
    if not _email_valido(email):
        return erro("Esse e-mail parece incompleto. Confere para a gente?", "email")

    link_dev = None
    conta = usuarios.por_email(email)
    if conta:
        token, token_hash = gerar_token_senha()
        usuarios.registrar_token(conta["id"], token_hash)
        origem = request.headers.get("Origin", "").rstrip("/")
        link = f"{origem}/redefinir-senha.html?token={token}"
        current_app.logger.info("Link de recuperação para %s: %s", email, link)
        if current_app.debug:
            link_dev = link

    return ok(
        mensagem="Se existir uma conta com esse e-mail, mandamos um link para "
                 "criar uma senha nova. Ele vale por 2 horas.",
        link_dev=link_dev,
    )


@bp.post("/redefinir-senha")
def redefinir_senha():
    dados = corpo()
    token = (dados.get("token") or "").strip()
    senha = dados.get("senha") or ""

    conta = usuarios.usuario_do_token(token) if token else None
    if not conta:
        return erro(
            "Esse link já foi usado ou passou da validade. Peça um novo, é rapidinho.",
            "token",
        )
    if len(senha) < MIN_SENHA:
        return erro(
            f"A senha precisa de pelo menos {MIN_SENHA} letras ou números.", "senha"
        )

    usuarios.trocar_senha(conta["id"], senha)
    usuarios.consumir_token(token)
    return ok(
        token=gerar_token(conta["id"]),
        usuario=usuarios.publico(conta),
        mensagem="Pronto! Sua senha foi trocada.",
    )


@bp.get("/eu")
@requer_login
def eu():
    """Confere se o token ainda vale e devolve o usuário.

    É o que cada página protegida chama ao carregar, antes de mostrar
    qualquer dado.
    """
    from flask import g
    return ok(usuario=usuarios.publico(g.usuario))


@bp.post("/forca-senha")
def medir_forca():
    """Mesma régua do indicador do cadastro, conferida no servidor."""
    return ok(nivel=forca_da_senha(corpo().get("senha") or ""))
