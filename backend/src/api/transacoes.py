"""Singra - gastos, ganhos e o painel Início.

O caminho mais usado do produto inteiro: é por aqui que passa cada gasto
registrado nos três passos do painel de adicionar.
"""

from datetime import date

from flask import Blueprint, g, request

from src.api.comum import contexto_do_pedido, corpo, erro, ok
from src.core import financas, frases, parcelamento
from src.core.formato import (FORMAS_PAGAMENTO, para_data, para_decimal,
                              para_inteiro, texto_curto)
from src.core.seguranca import requer_login
from src.db.repositorios import cartoes, categorias, transacoes

bp = Blueprint("transacoes", __name__, url_prefix="/api")


def _ler_transacao(dados, exigir_tudo=True):
    """Confere os campos e devolve (campos limpos, erro).

    Com exigir_tudo=False, valida só o que veio: é o modo usado na correção
    de um registro, em que a pessoa pode mudar apenas a descrição.
    """
    campos = {}

    valor = para_decimal(dados.get("valor"))
    if valor is None or valor <= 0:
        if exigir_tudo or "valor" in dados:
            return None, erro("Falta só o valor. Quanto foi?", "valor")
    else:
        campos["valor"] = valor

    tipo = dados.get("tipo")
    if tipo in ("gasto", "ganho"):
        campos["tipo"] = tipo
    elif exigir_tudo:
        campos["tipo"] = "gasto"

    categoria_id = para_inteiro(dados.get("categoria_id"))
    if categoria_id:
        # A categoria precisa ser do usuário: o id vem do navegador
        if not categorias.por_id(g.usuario["id"], categoria_id):
            return None, erro("Essa categoria não está na sua lista.", "categoria_id")
        campos["categoria_id"] = categoria_id
    elif exigir_tudo:
        return None, erro("Escolha uma categoria para continuar.", "categoria_id")

    data = para_data(dados.get("data"))
    if data:
        campos["data"] = data
    elif exigir_tudo:
        campos["data"] = date.today()
    elif "data" in dados:
        return None, erro("Essa data não parece certa. Use dia/mês/ano.", "data")

    forma = dados.get("forma_pagamento")
    if forma in FORMAS_PAGAMENTO:
        campos["forma_pagamento"] = forma
    elif exigir_tudo:
        campos["forma_pagamento"] = "pix"

    # O vínculo com cartão é opcional e existe para toda forma de pagamento
    # que sai de algum lugar: Pix, débito, crédito e boleto saem de uma conta
    # ou de um cartão. Só o dinheiro em espécie não tem de onde sair, e é a
    # única forma que limpa o campo, para não sobrar um cartão marcado num
    # gasto que virou dinheiro vivo na hora da correção.
    if "cartao_id" in dados or "forma_pagamento" in dados:
        cartao_id = para_inteiro(dados.get("cartao_id"))
        forma_final = campos.get("forma_pagamento")
        if cartao_id and forma_final and forma_final != "dinheiro":
            if not cartoes.por_id(g.usuario["id"], cartao_id):
                return None, erro("Esse cartão não está na sua lista.", "cartao_id")
            campos["cartao_id"] = cartao_id
        else:
            campos["cartao_id"] = None

    if "descricao" in dados:
        campos["descricao"] = texto_curto(dados.get("descricao"), 120)

    if "fixa" in dados:
        campos["fixa"] = bool(dados.get("fixa"))
    elif exigir_tudo:
        campos["fixa"] = False

    return campos, None


def _resumo_atual():
    """Resumo do mês corrente, para o painel se atualizar sozinho."""
    ctx = financas.contexto_mes(g.usuario)
    dados = financas.resumo_do_mes(g.usuario, ctx)
    investimento = financas.investimento_do_periodo(g.usuario)
    return {
        "disponivel": dados["disponivel"],
        "ganhos": dados["ganhos"],
        "gastos": dados["gastos"],
        "guardado": dados["guardado"],
        "usado_pct": dados["usado_pct"],
        "tem_orcamento": dados["tem_orcamento"],
        "frase": frases.disponivel(dados),
        "investimento": investimento,
    }


# Transações
@bp.post("/transacoes")
@requer_login
def criar():
    dados = corpo()
    campos, problema = _ler_transacao(dados)
    if problema:
        return problema

    # Compra parcelada vira N transações, e só faz sentido para gasto
    parcelas = para_inteiro(dados.get("parcelas"))
    if parcelas and parcelas > 1 and campos["tipo"] == "gasto":
        transacao_id, grupo, quantidade = parcelamento.registrar(
            g.usuario["id"], campos["categoria_id"], campos["tipo"],
            campos["valor"], campos["data"], parcelas,
            descricao=campos.get("descricao"),
            forma_pagamento=campos.get("forma_pagamento", "credito"),
            cartao_id=campos.get("cartao_id"),
        )
        return ok(id=transacao_id, grupo=grupo,
                  mensagem=f"Pronto! Registramos {quantidade} parcelas.",
                  resumo=_resumo_atual())

    transacao_id = transacoes.criar(
        g.usuario["id"], campos["categoria_id"], campos["tipo"], campos["valor"],
        campos["data"], campos.get("descricao"),
        campos.get("forma_pagamento", "pix"), campos.get("fixa", False),
        cartao_id=campos.get("cartao_id"),
    )
    palavra = "Gasto" if campos["tipo"] == "gasto" else "Ganho"
    return ok(id=transacao_id, mensagem=f"Pronto! {palavra} registrado.",
              resumo=_resumo_atual())


@bp.put("/transacoes/<int:transacao_id>")
@requer_login
def editar(transacao_id):
    if not transacoes.por_id(g.usuario["id"], transacao_id):
        return erro("Não encontramos esse registro.", status=404)

    campos, problema = _ler_transacao(corpo(), exigir_tudo=False)
    if problema:
        return problema
    if not campos:
        return erro("Não havia nada para mudar.")

    transacoes.atualizar(g.usuario["id"], transacao_id, **campos)
    return ok(mensagem="Pronto! Corrigimos para você.", resumo=_resumo_atual())


@bp.delete("/transacoes/<int:transacao_id>")
@requer_login
def apagar(transacao_id):
    """Apaga um registro ou, se pedido, a compra parcelada inteira."""
    registro = transacoes.por_id(g.usuario["id"], transacao_id)
    if not registro:
        return erro("Não encontramos esse registro.", status=404)

    pediu_grupo = str(corpo().get("grupo") or request.args.get("grupo") or "") == "1"
    if pediu_grupo and registro["grupo_parcela"]:
        quantidade = transacoes.apagar_grupo(g.usuario["id"], registro["grupo_parcela"])
        return ok(mensagem=f"Apagamos as {quantidade} parcelas.",
                  resumo=_resumo_atual())

    transacoes.apagar(g.usuario["id"], transacao_id)
    return ok(mensagem="Apagado.", resumo=_resumo_atual())


@bp.get("/transacoes")
@requer_login
def listar():
    """Histórico, com os filtros da tela."""
    ctx = contexto_do_pedido()
    inicio = para_data(request.args.get("inicio")) or ctx["inicio"]
    fim = para_data(request.args.get("fim")) or ctx["fim"]
    # Datas trocadas de lugar devolveriam lista vazia sem explicação
    if fim < inicio:
        inicio, fim = fim, inicio

    lista = transacoes.listar(
        g.usuario["id"],
        inicio=inicio, fim=fim,
        tipo=request.args.get("tipo") or None,
        categoria_id=para_inteiro(request.args.get("categoria_id")),
        forma_pagamento=request.args.get("forma_pagamento") or None,
        cartao_id=para_inteiro(request.args.get("cartao_id")),
    )

    itens = [financas.transacao_json(t) for t in lista]
    gastos = sum(i["valor"] for i in itens if i["tipo"] == "gasto")
    ganhos = sum(i["valor"] for i in itens if i["tipo"] == "ganho")

    return ok(itens=itens, quantidade=len(itens),
              inicio=inicio.isoformat(), fim=fim.isoformat(),
              total_gastos=round(gastos, 2), total_ganhos=round(ganhos, 2))


# Painel e resumo
@bp.get("/painel")
@requer_login
def painel():
    """Tudo o que a tela Início mostra, em uma requisição só."""
    ctx = contexto_do_pedido()
    dados = financas.painel(g.usuario, ctx)
    dados["frase_disponivel"] = frases.disponivel(dados["resumo"])
    dados["frase_categorias"] = frases.categorias(dados["categorias"])
    dados["comparacao"] = frases.comparacao(dados["resumo"])
    return ok(**dados)


@bp.get("/resumo")
@requer_login
def resumo():
    ctx = contexto_do_pedido()
    dados = financas.resumo_do_mes(g.usuario, ctx)
    # O contexto vai inteiro: o seletor de mês do frontend precisa do
    # anterior e do próximo já calculados, inclusive na virada de ano
    return ok(
        mes=financas.contexto_json(ctx),
        **dados,
        investimento=financas.investimento_do_periodo(g.usuario),
        frase=frases.disponivel(dados),
        comparacao=frases.comparacao(dados),
    )


@bp.get("/categorias")
@requer_login
def listar_categorias():
    """As categorias do usuário, mais as 6 que o painel mostra primeiro.

    Com ?ocultas=1 vêm também as escondidas. Só o perfil pede assim: é a
    única tela onde faz sentido vê-las, porque é de lá que dá para trazer
    uma de volta. Nas telas de registro elas continuam fora.
    """
    tipo = request.args.get("tipo")
    if tipo not in ("gasto", "ganho"):
        tipo = None
    incluir_ocultas = request.args.get("ocultas") == "1"

    def simples(c):
        return {"id": c["id"], "nome": c["nome"], "icone": c["icone"],
                "cor": c["cor"], "essencial": bool(c["essencial"]),
                "tipo": c["tipo"], "oculta": bool(c["oculta"])}

    return ok(
        itens=[simples(c) for c in categorias.listar(
            g.usuario["id"], tipo=tipo, incluir_ocultas=incluir_ocultas)],
        rapidas={
            "gasto": [simples(c) for c in categorias.mais_usadas(g.usuario["id"], "gasto")],
            "ganho": [simples(c) for c in categorias.mais_usadas(g.usuario["id"], "ganho")],
        },
    )
