"""Singra - os dados dos gráficos.

Cada rota devolve os números já calculados e a frase que os explica. O
frontend só desenha: nenhuma conta financeira acontece no navegador, e a
mesma informação alimenta o gráfico e o texto embaixo dele.

Dois gráficos podem devolver `null` em vez de dados: o de cartões e o de
investimento. É intencional. Quando a pessoa não usa o recurso, o frontend
esconde o bloco inteiro em vez de mostrar um gráfico zerado.
"""

from flask import Blueprint, g, request

from src.api.comum import contexto_do_pedido, janela_de_meses, ok
from src.core import financas, frases
from src.core.seguranca import exigir_login

bp = Blueprint("graficos", __name__, url_prefix="/api/graficos")

# Todas as rotas daqui são protegidas, então a checagem vale para o
# blueprint inteiro em vez de repetir o decorador em cada função.
bp.before_request(exigir_login)


@bp.get("/categorias")
def por_categoria():
    ctx = contexto_do_pedido()
    tipo = request.args.get("tipo", "gasto")
    dados = financas.grafico_categorias(
        g.usuario, ctx, tipo if tipo in ("gasto", "ganho") else "gasto"
    )
    return ok(**dados, frase=frases.categorias(dados))


@bp.get("/cartoes")
def por_cartao():
    """Devolve disponivel=False quando não há cartão cadastrado."""
    ctx = contexto_do_pedido()
    dados = financas.grafico_cartoes(g.usuario, ctx)
    if dados is None:
        return ok(disponivel=False, itens=[], total=0)
    return ok(disponivel=True, **dados, frase=frases.cartoes(dados))


@bp.get("/evolucao")
def evolucao():
    ctx = contexto_do_pedido()
    dados = financas.grafico_evolucao(g.usuario, ctx, janela_de_meses())
    return ok(**dados, frase=frases.evolucao(dados), frase_saldo=frases.saldo(dados))


@bp.get("/orcamento")
def orcamento():
    ctx = contexto_do_pedido()
    dados = financas.grafico_orcamento(g.usuario, ctx)
    return ok(**dados, frase=frases.orcamento(dados))


@bp.get("/fixos-variaveis")
def fixos_variaveis():
    ctx = contexto_do_pedido()
    dados = financas.grafico_fixos_variaveis(g.usuario, ctx)
    return ok(**dados, frase=frases.fixos_variaveis(dados))


@bp.get("/investimento")
def investimento():
    """Evolução do guardado contra a meta, período a período da cadência."""
    dados = financas.grafico_investimento(g.usuario, janela_de_meses())
    if dados is None:
        return ok(disponivel=False, itens=[])
    return ok(disponivel=True, **dados, frase=frases.investimento(dados))
