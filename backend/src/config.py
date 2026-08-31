"""Singra - configuração do backend.

Nenhum segredo mora no código. Em produção, os valores vêm das variáveis de
ambiente cadastradas no painel do Render. Em desenvolvimento, do arquivo
backend/.env, que não vai para o Git.

A conexão com o banco aceita dois formatos, nessa ordem de prioridade:

1. SINGRA_DATABASE_URL, uma URL única, que é o que a Aiven e o TiDB Cloud
   entregam pronta para copiar e colar no painel do Render.
2. As variáveis soltas (SINGRA_DB_HOST, _PORT, _USER, _PASSWORD, _NAME),
   mais confortáveis para quem roda o MySQL na própria máquina.
"""

import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from dotenv import load_dotenv

RAIZ_BACKEND = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ_BACKEND / ".env")


def _booleano(nome, padrao=False):
    valor = os.getenv(nome)
    if valor is None:
        return padrao
    return valor.strip().lower() in ("1", "true", "sim", "yes", "on")


def _lista(nome, padrao):
    """Lê uma variável com vários valores separados por vírgula."""
    valor = os.getenv(nome)
    if not valor:
        return padrao
    return [parte.strip() for parte in valor.split(",") if parte.strip()]


def _banco_da_url(url):
    """Traduz a URL de conexão da Aiven/TiDB para os parâmetros do conector."""
    partes = urlparse(url)
    return {
        "host": partes.hostname or "localhost",
        "port": partes.port or 3306,
        "user": unquote(partes.username or ""),
        "password": unquote(partes.password or ""),
        "database": (partes.path or "/singra").lstrip("/") or "singra",
    }


def _banco_das_variaveis():
    return {
        "host": os.getenv("SINGRA_DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("SINGRA_DB_PORT", "3306")),
        "user": os.getenv("SINGRA_DB_USER", "root"),
        "password": os.getenv("SINGRA_DB_PASSWORD", ""),
        "database": os.getenv("SINGRA_DB_NAME", "singra"),
    }


class Config:
    # Token de autenticação
    SECRET_KEY = os.getenv("SINGRA_SECRET_KEY", "singra-desenvolvimento-trocar")
    TOKEN_HORAS = int(os.getenv("SINGRA_TOKEN_HORAS", "720"))   # 30 dias
    TOKEN_SENHA_HORAS = 2                                        # link de redefinição

    # Origens autorizadas a chamar a API.
    # O frontend roda em outro domínio (GitHub Pages), então o CORS precisa
    # liberar explicitamente cada endereço, e só eles.
    ORIGENS = _lista("SINGRA_ORIGENS", [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ])

    # Banco de dados
    _url = os.getenv("SINGRA_DATABASE_URL", "").strip()
    DB = _banco_da_url(_url) if _url else _banco_das_variaveis()
    DB.update({
        "charset": "utf8mb4",
        "collation": "utf8mb4_unicode_ci",
        # Sem commit automático: quem grava em mais de uma tabela controla a
        # transação e desfaz tudo se algo falhar no meio.
        "autocommit": False,
    })

    # Aiven e TiDB Cloud exigem conexão criptografada. Localmente o MySQL
    # costuma aceitar sem, então o SSL só entra quando pedido.
    SSL_OBRIGATORIO = _booleano("SINGRA_DB_SSL", bool(_url))
    SSL_CA = os.getenv("SINGRA_DB_SSL_CA", "").strip()

    # Regras de negócio que podem mudar sem mexer no código
    MESES_GRAFICO = 6            # janela padrão dos gráficos de evolução
    MESES_RESERVA = 3            # reserva de emergência = 3x os gastos essenciais
    MAX_CATEGORIAS_RAPIDAS = 6   # ícones na primeira tela de adicionar
    IDIOMAS = ("pt", "en", "es")
    IDIOMA_PADRAO = "pt"
