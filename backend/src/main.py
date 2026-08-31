"""Singra - o servidor da API.

Não gera nenhuma página: só recebe pedidos do frontend e devolve JSON. O
frontend mora em outro domínio (GitHub Pages), então duas coisas precisam
estar certas aqui, o CORS, que autoriza esse outro endereço a chamar a API,
e o token, que substitui o cookie de sessão.

Rodar em desenvolvimento, de dentro de backend/:
    python -m src.main

Em produção, no Render, o comando de inicialização é:
    gunicorn --chdir backend "src.main:criar_app()"
"""

import logging

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS

from src.api import rotas
from src.config import Config
from src.db import conexao


def criar_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Só as origens listadas podem chamar a API, e só sob /api. O
    # Authorization entra nos cabeçalhos permitidos porque é por ele que o
    # token viaja em toda requisição.
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.ORIGENS}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        max_age=86400,
    )

    rotas.registrar(app)
    registrar_erros(app)
    app.teardown_appcontext(conexao.fechar_conexao)

    @app.get("/")
    @app.get("/api")
    def raiz():
        """Cartão de visitas e alvo do ping que tira o Render da hibernação."""
        return jsonify({
            "ok": True,
            "servico": "Singra API",
            "versao": 2,
            "banco": "ok" if conexao.esta_disponivel() else "indisponivel",
        })

    return app


def registrar_erros(app):
    """Erros explicam o que fazer, nunca só o que deu errado.

    Tudo sai em JSON, inclusive o 404 e o 500: quem chama esta API é
    JavaScript, e uma página de erro em HTML só viraria ruído no console.
    """

    @app.errorhandler(404)
    def nao_encontrado(_erro):
        return jsonify({
            "ok": False,
            "mensagem": f"Não existe nada em {request.path}.",
        }), 404

    @app.errorhandler(405)
    def metodo_errado(_erro):
        return jsonify({
            "ok": False,
            "mensagem": "Esse endereço não aceita esse tipo de pedido.",
        }), 405

    @app.errorhandler(mysql.connector.Error)
    def banco_fora(erro):
        app.logger.error("Erro de banco: %s", erro)
        return jsonify({
            "ok": False,
            "mensagem": "Não conseguimos falar com o banco de dados agora. "
                        "Tente de novo em instantes.",
        }), 503

    @app.errorhandler(Exception)
    def erro_inesperado(erro):
        app.logger.exception("Erro inesperado: %s", erro)
        return jsonify({
            "ok": False,
            "mensagem": "Algo deu errado do nosso lado. Tente de novo.",
        }), 500


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    aplicacao = criar_app()

    # Em desenvolvimento, deixa o banco pronto na primeira subida. No
    # Render isso é feito uma vez pelo comando de build, e não a cada
    # reinício causado pela hibernação.
    with aplicacao.app_context():
        from src.db.models import preparar_banco
        try:
            print("Banco:", preparar_banco())
        except mysql.connector.Error as erro:
            print("Não foi possível preparar o banco:", erro)

    aplicacao.run(debug=True, host="127.0.0.1", port=5000)
