"""Singra - orçamento, metas, contas a pagar e cartões.

As telas em que a pessoa combina alguma coisa consigo mesma: quanto pretende
gastar, o que quer conquistar, o que não pode esquecer de pagar e em que
cartão cada gasto aconteceu.
"""

from datetime import date

from flask import Blueprint, g, request

from src.api.comum import contexto_do_pedido, corpo, erro, ok
from src.core import financas, frases, periodo, planejador
from src.core.formato import para_data, para_decimal, para_inteiro, texto_curto
from src.core.periodo import CADENCIAS
from src.core.seguranca import exigir_login
from src.db import conexao
from src.db.repositorios import (cartoes, categorias, contas, metas,
                                 orcamentos, transacoes)

bp = Blueprint("planejamento", __name__, url_prefix="/api")
bp.before_request(exigir_login)


# Orçamento
@bp.put("/orcamentos")
def salvar_orcamento():
    """Salva o limite de uma categoria, chamado a cada campo editado."""
    dados = corpo()
    ctx = contexto_do_pedido(dados)

    categoria_id = para_inteiro(dados.get("categoria_id"))
    if not categoria_id or not categorias.por_id(g.usuario["id"], categoria_id):
        return erro("Essa categoria não está na sua lista.", "categoria_id")

    valor = para_decimal(dados.get("valor_limite"))
    if valor is None or valor < 0:
        return erro("Coloque quanto você quer gastar nessa categoria.", "valor_limite")

    # Zerar o campo é como a pessoa tira a categoria do planejamento
    if valor == 0:
        orcamentos.apagar(g.usuario["id"], categoria_id, ctx["ano"], ctx["mes"])
    else:
        orcamentos.salvar(g.usuario["id"], categoria_id, ctx["ano"], ctx["mes"], valor)

    return ok(mensagem="Salvo.", orcamento=financas.grafico_orcamento(g.usuario, ctx))


@bp.post("/orcamentos/sugerir")
def sugerir_orcamento():
    dados = corpo()
    ctx = contexto_do_pedido(dados)
    resultado = planejador.sugerir_orcamento(
        g.usuario, ctx["ano"], ctx["mes"], renda=para_decimal(dados.get("renda"))
    )
    if not resultado["ok"]:
        return erro(resultado["mensagem"], "renda")
    return ok(mensagem=resultado["mensagem"], sugestao=resultado,
              orcamento=financas.grafico_orcamento(g.usuario, ctx))


@bp.post("/orcamentos/copiar")
def copiar_orcamento():
    """Traz o planejamento do mês anterior para o mês aberto."""
    ctx = contexto_do_pedido(corpo())
    anterior = periodo.mes_anterior(ctx["ano"], ctx["mes"])
    copiadas = orcamentos.copiar_de(g.usuario["id"], anterior[0], anterior[1],
                                    ctx["ano"], ctx["mes"])
    mensagem = ("Copiamos o planejamento do mês anterior." if copiadas
                else "O mês anterior ainda não tinha planejamento para copiar.")
    return ok(mensagem=mensagem, copiadas=copiadas,
              orcamento=financas.grafico_orcamento(g.usuario, ctx))


# Metas
@bp.get("/metas")
def listar_metas():
    """Metas comuns, a de investimento e a sugestão de reserva."""
    usuario_id = g.usuario["id"]
    lista = [financas.com_progresso(m) for m in metas.listar(usuario_id)]

    sugestao = None
    if not metas.tem_reserva_emergencia(usuario_id):
        calculo = planejador.reserva_sugerida(g.usuario)
        if calculo["disponivel"]:
            sugestao = calculo

    return ok(itens=lista,
              investimento=financas.investimento_do_periodo(g.usuario),
              reserva_sugerida=sugestao)


@bp.post("/metas")
def criar_meta():
    """Cria uma meta comum ou a meta especial de investimento."""
    dados = corpo()
    nome = texto_curto(dados.get("nome"), 80)
    valor = para_decimal(dados.get("valor_alvo"))
    eh_investimento = bool(dados.get("eh_investimento"))

    if not valor or valor <= 0:
        return erro("Quanto custa o que você quer conquistar?", "valor_alvo")

    if eh_investimento:
        # Só uma ativa por vez: dois números de "guardado este mês"
        # fragmentariam a resposta que o cartão do Início precisa dar
        if metas.investimento(g.usuario["id"]):
            return erro(
                "Você já tem uma meta de investimento. Edite a que existe "
                "em vez de criar outra.", "eh_investimento",
            )
        cadencia = dados.get("cadencia")
        if cadencia not in CADENCIAS:
            return erro("Escolha com que frequência quer acompanhar.", "cadencia")
        meta_id = metas.criar(
            g.usuario["id"], nome or "Meta de investimento", valor,
            icone="rendimento", eh_investimento=True, cadencia=cadencia,
        )
        return ok(id=meta_id, mensagem="Pronto! Sua meta de investimento está criada.",
                  investimento=financas.investimento_do_periodo(g.usuario))

    if not nome:
        return erro("Dê um nome para a sua meta.", "nome")

    meta_id = metas.criar(
        g.usuario["id"], nome, valor,
        prazo=para_data(dados.get("prazo")),
        icone=dados.get("icone") or "meta",
        reserva_emergencia=bool(dados.get("reserva_emergencia")),
    )
    return ok(id=meta_id, mensagem="Meta criada. Agora é só ir guardando.")


@bp.put("/metas/<int:meta_id>")
def editar_meta(meta_id):
    if not metas.por_id(g.usuario["id"], meta_id):
        return erro("Não encontramos essa meta.", status=404)
    dados = corpo()
    cadencia = dados.get("cadencia")
    metas.atualizar(
        g.usuario["id"], meta_id,
        nome=texto_curto(dados.get("nome"), 80),
        valor_alvo=para_decimal(dados.get("valor_alvo")),
        prazo=para_data(dados.get("prazo")),
        icone=dados.get("icone"),
        cadencia=cadencia if cadencia in CADENCIAS else None,
    )
    return ok(mensagem="Pronto! Meta atualizada.",
              investimento=financas.investimento_do_periodo(g.usuario))


@bp.delete("/metas/<int:meta_id>")
def apagar_meta(meta_id):
    if not metas.por_id(g.usuario["id"], meta_id):
        return erro("Não encontramos essa meta.", status=404)
    metas.apagar(g.usuario["id"], meta_id)
    return ok(mensagem="Meta apagada.")


@bp.post("/metas/<int:meta_id>/aportes")
def guardar_dinheiro(meta_id):
    """Registra um valor guardado e devolve o progresso já recalculado.

    Na meta de investimento, é este aporte, e só ele, que move dinheiro do
    "disponível para gastar" para o "guardado".
    """
    alvo = metas.por_id(g.usuario["id"], meta_id)
    if not alvo:
        return erro("Não encontramos essa meta.", status=404)

    valor = para_decimal(corpo().get("valor"))
    if valor is None or valor <= 0:
        return erro("Quanto você quer guardar?", "valor")

    metas.registrar_aporte(meta_id, valor,
                           para_data(corpo().get("data")) or date.today())

    # Relê a meta para saber se este aporte foi o que fechou o alvo
    atualizada = financas.com_progresso(metas.por_id(g.usuario["id"], meta_id))
    if not alvo["eh_investimento"]:
        metas.marcar_conclusao(g.usuario["id"], meta_id, atualizada["concluida"])

    mensagem = ("Meta conquistada! Que orgulho."
                if atualizada["concluida"] and not alvo["eh_investimento"]
                else "Pronto! Dinheiro guardado.")

    from src.api.transacoes import _resumo_atual
    return ok(mensagem=mensagem, meta=atualizada, resumo=_resumo_atual())


# Contas a pagar
@bp.get("/contas")
def listar_contas():
    """As contas de um mês, com o que já está comprometido nele.

    Aceita ano e mês: avançar o calendário mostra o que vai vencer lá na
    frente, as parcelas de uma compra dividida e as contas que se repetem
    todo mês, antes de o mês chegar.
    """
    ctx = contexto_do_pedido()
    return ok(mes=financas.contexto_json(ctx),
              **financas.contas_do_mes(g.usuario, ctx))


@bp.post("/contas")
def criar_conta():
    dados = corpo()
    descricao = texto_curto(dados.get("descricao"), 100)
    valor = para_decimal(dados.get("valor"))
    vencimento = para_data(dados.get("vencimento"))
    categoria_id = para_inteiro(dados.get("categoria_id"))

    if not descricao:
        return erro("Que conta é essa?", "descricao")
    if not valor or valor <= 0:
        return erro("Quanto é essa conta?", "valor")
    if not vencimento:
        return erro("Quando ela vence?", "vencimento")
    # O id vem de um <select>, que qualquer pessoa consegue alterar
    if not categoria_id or not categorias.por_id(g.usuario["id"], categoria_id):
        return erro("Escolha uma categoria para a conta.", "categoria_id")

    conta_id = contas.criar(g.usuario["id"], categoria_id, descricao, valor,
                            vencimento, bool(dados.get("recorrente")))
    return ok(id=conta_id, mensagem="Conta cadastrada. A gente lembra você.")


@bp.delete("/contas/<int:conta_id>")
def apagar_conta(conta_id):
    if not contas.por_id(g.usuario["id"], conta_id):
        return erro("Não encontramos essa conta.", status=404)
    contas.apagar(g.usuario["id"], conta_id)
    return ok(mensagem="Conta apagada.")


@bp.post("/contas/<int:conta_id>/pagar")
def pagar_conta(conta_id):
    """Marca a conta como paga e cria o gasto correspondente.

    As duas gravações vão na mesma transação: uma conta marcada como paga
    sem o gasto no histórico deixaria o mês com um buraco.
    """
    linha = contas.por_id(g.usuario["id"], conta_id)
    if not linha:
        return erro("Não encontramos essa conta.", status=404)
    if linha["paga_em"]:
        return erro("Essa conta já estava marcada como paga.")

    pago_em = para_data(corpo().get("data")) or date.today()

    transacao_id = transacoes.criar(
        g.usuario["id"], linha["categoria_id"], "gasto", linha["valor"],
        pago_em, linha["descricao"], "boleto", bool(linha["recorrente"]),
        commit=False,
    )
    contas.marcar_paga(g.usuario["id"], conta_id, pago_em, transacao_id, commit=False)

    # Conta que se repete já deixa a do mês seguinte cadastrada
    proxima_id = None
    if linha["recorrente"]:
        vencimento = linha["vencimento"]
        ano, mes = periodo.proximo_mes(vencimento.year, vencimento.month)
        proxima_id = contas.criar(
            g.usuario["id"], linha["categoria_id"], linha["descricao"],
            linha["valor"], periodo.dia_seguro(ano, mes, vencimento.day), True,
        )

    conexao.commit()

    from src.api.transacoes import _resumo_atual
    return ok(mensagem="Conta paga. Já registramos o gasto para você.",
              transacao_id=transacao_id, proxima_conta_id=proxima_id,
              resumo=_resumo_atual())


@bp.post("/contas/<int:conta_id>/desfazer-pagamento")
def desfazer_pagamento(conta_id):
    """Volta a conta para "a pagar" e apaga o gasto que ela tinha gerado."""
    linha = contas.por_id(g.usuario["id"], conta_id)
    if not linha or not linha["paga_em"]:
        return erro("Essa conta não está marcada como paga.", status=404)

    if linha["transacao_id"]:
        transacoes.apagar(g.usuario["id"], linha["transacao_id"])
    contas.desmarcar_paga(g.usuario["id"], conta_id)

    from src.api.transacoes import _resumo_atual
    return ok(mensagem="Voltamos a conta para 'a pagar'.", resumo=_resumo_atual())


# Cartões e bancos
@bp.get("/cartoes")
def listar_cartoes():
    itens = [
        {"id": c["id"], "nome": c["nome"], "cor": c["cor"]}
        for c in cartoes.listar(g.usuario["id"])
    ]
    return ok(itens=itens)


@bp.post("/cartoes")
def criar_cartao():
    dados = corpo()
    nome = texto_curto(dados.get("nome"), 60)
    if not nome:
        return erro("Como você chama esse cartão ou conta?", "nome")
    cartao_id = cartoes.criar(g.usuario["id"], nome,
                              dados.get("cor") or "#8FA3B8")
    return ok(id=cartao_id, mensagem="Cartão cadastrado.")


@bp.put("/cartoes/<int:cartao_id>")
def editar_cartao(cartao_id):
    if not cartoes.por_id(g.usuario["id"], cartao_id):
        return erro("Não encontramos esse cartão.", status=404)
    dados = corpo()
    cartoes.atualizar(g.usuario["id"], cartao_id,
                      nome=texto_curto(dados.get("nome"), 60),
                      cor=dados.get("cor"))
    return ok(mensagem="Pronto! Cartão atualizado.")


@bp.delete("/cartoes/<int:cartao_id>")
def apagar_cartao(cartao_id):
    """Remove o cartão. Os gastos dele viram "sem cartão vinculado"."""
    if not cartoes.por_id(g.usuario["id"], cartao_id):
        return erro("Não encontramos esse cartão.", status=404)
    cartoes.apagar(g.usuario["id"], cartao_id)
    return ok(mensagem="Cartão removido. Os gastos dele continuam no histórico.")
