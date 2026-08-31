"""Singra - o que toda rota da API usa.

Formato das respostas, leitura do corpo e do mês pedido. Sucesso e erro têm
sempre a mesma forma, para o frontend nunca precisar adivinhar o que veio:

    {"ok": true,  "mensagem": "...", ...dados}
    {"ok": false, "mensagem": "...", "campo": "valor"}

O campo `mensagem` já vem escrito para aparecer na tela, e o `campo` diz ao
frontend a qual passo do painel voltar quando algo faltou.
"""

from flask import g, jsonify, request

from src.core import financas
from src.core.formato import para_inteiro


def ok(**dados):
    resposta = {"ok": True}
    resposta.update(dados)
    return jsonify(resposta)


def erro(mensagem, campo=None, status=400):
    return jsonify({"ok": False, "mensagem": mensagem, "campo": campo}), status


def corpo():
    """Aceita JSON e formulário, para a API servir aos dois."""
    return request.get_json(silent=True) or request.form.to_dict() or {}


def contexto_do_pedido(dados=None):
    """Mês pedido na querystring ou no corpo, com o corrente como padrão."""
    origem = dados if dados is not None else request.args
    return financas.contexto_mes(
        g.usuario,
        para_inteiro(origem.get("ano"), minimo=2000, maximo=2100),
        para_inteiro(origem.get("mes"), minimo=1, maximo=12),
    )


def janela_de_meses(padrao=6):
    """Quantos meses os gráficos de evolução devem mostrar.

    Só 6 ou 12: a janela de 12 existe para quem tem meta de investimento
    anual, que não fecharia em uma janela menor.
    """
    meses = para_inteiro(request.args.get("meses"), padrao=padrao)
    return 12 if meses == 12 else 6
