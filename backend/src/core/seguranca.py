"""Singra - senhas e token de autenticação.

O frontend (GitHub Pages) e a API (Render) moram em domínios diferentes, e
por isso a sessão não pode ser um cookie: cada chamada carrega um token no
cabeçalho `Authorization: Bearer <token>`.

O token é assinado e carrega o próprio conteúdo (o id do usuário e a data de
emissão), então o backend não precisa manter uma lista de sessões abertas.
Isso importa em um serviço gratuito que hiberna e perde o que estava na
memória a cada 15 minutos sem uso.
"""

import hashlib
import secrets
from functools import wraps

import bcrypt
from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from src.config import Config

PREFIXO = "Bearer "
_assinador = URLSafeTimedSerializer(Config.SECRET_KEY, salt="singra-sessao")


# Senhas
def gerar_hash_senha(senha):
    """Transforma a senha em hash bcrypt, o que é um caminho só de ida."""
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def conferir_senha(senha, senha_hash):
    """Compara a senha digitada com o hash guardado."""
    if not senha or not senha_hash:
        return False
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
    except ValueError:
        # Hash gravado fora do formato bcrypt: trata como senha errada
        return False


def forca_da_senha(senha):
    """Devolve 'fraca', 'boa' ou 'otima' para o indicador do cadastro.

    Conta tamanho e variedade em vez de exigir símbolos obrigatórios: uma
    frase longa é mais segura e mais fácil de lembrar do que 'S3nh@!'.
    """
    pontos = 0
    if len(senha) >= 8:
        pontos += 1
    if len(senha) >= 12:
        pontos += 1
    if any(c.isdigit() for c in senha) and any(c.isalpha() for c in senha):
        pontos += 1
    if any(not c.isalnum() for c in senha):
        pontos += 1
    if pontos >= 4:
        return "otima"
    if pontos >= 2:
        return "boa"
    return "fraca"


# Token de autenticação
def gerar_token(usuario_id):
    return _assinador.dumps({"id": usuario_id})


def usuario_id_do_token(token):
    """Id do dono do token, ou None se ele foi adulterado ou expirou."""
    try:
        dados = _assinador.loads(token, max_age=Config.TOKEN_HORAS * 3600)
    except (BadSignature, SignatureExpired):
        return None
    return dados.get("id")


def token_do_cabecalho():
    cabecalho = request.headers.get("Authorization", "")
    if not cabecalho.startswith(PREFIXO):
        return None
    return cabecalho[len(PREFIXO):].strip() or None


# Token de redefinição de senha
def gerar_token_senha():
    """Devolve (token que vai no link, hash que fica no banco).

    O banco guarda só o hash, então quem tiver acesso à tabela ainda assim
    não consegue montar um link válido para entrar na conta de alguém.
    """
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# Proteção das rotas
def exigir_login():
    """Confere o token e deixa o usuário em `g.usuario`.

    É de `g.usuario` que sai o `usuario_id` usado em toda consulta, nunca
    de um id enviado pelo frontend, que qualquer pessoa poderia trocar.

    Serve como before_request de um blueprint inteiro (quando todas as
    rotas dele são protegidas) ou por dentro do decorador abaixo.
    Devolve None quando está tudo certo, no formato que o Flask espera.
    """
    from src.db.repositorios import usuarios

    # Antes de uma chamada vinda de outro domínio, o navegador manda sozinho
    # um OPTIONS para perguntar se ela é permitida, o preflight do CORS.
    # Esse pedido nunca carrega o cabeçalho Authorization, porque não é a
    # chamada de verdade. Exigir token aqui faria o preflight responder 401,
    # e o navegador bloquearia a requisição seguinte, que é a que importa.
    # Quem responde ao OPTIONS é o Flask-CORS. A rota real segue
    # protegida pelas linhas abaixo.
    if request.method == "OPTIONS":
        return None

    token = token_do_cabecalho()
    usuario_id = usuario_id_do_token(token) if token else None
    usuario = usuarios.por_id(usuario_id) if usuario_id else None

    if usuario is None:
        return jsonify({
            "ok": False,
            "mensagem": "Sua sessão expirou. Entre de novo, por favor.",
        }), 401

    g.usuario = usuario
    return None


def requer_login(f):
    """Mesma checagem, para proteger uma rota isolada."""

    @wraps(f)
    def envelope(*args, **kwargs):
        problema = exigir_login()
        if problema is not None:
            return problema
        return f(*args, **kwargs)

    return envelope
