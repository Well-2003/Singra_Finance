"""Singra - a inteligência do produto.

Tudo o que vira número grande, barra ou gráfico na tela sai daqui. As
funções recebem o dicionário do usuário, para saber em que dia o mês dele
começa, e devolvem dados prontos para virar JSON. Nenhuma escreve no banco:
são só leitura e conta.

O disponível e o guardado são coisas distintas. Guardar nunca acontece
sozinho: a meta de investimento não desconta do disponível quando o período
começa, e sim quando a pessoa registra um aporte. Assim o número continua
fiel ao saldo real da conta, o que importa sobretudo para quem tem renda
variável e não pode ver menos dinheiro do que realmente tem.
"""

from datetime import date, timedelta
from decimal import Decimal

from src.config import Config
from src.core import periodo
from src.core.formato import mes_curto, mes_extenso, numero, porcentagem
from src.db.repositorios import cartoes, contas, metas, orcamentos, transacoes

# Faixas em que a barra do orçamento muda de cor
LIMITE_ATENCAO = 80    # a partir daqui a barra fica mel
LIMITE_ESTOURO = 100   # acima daqui fica terracota

# A partir de quanto do período decorrido o alerta de sobra aparece.
# Antes disso ainda há mês pela frente, e sugerir guardar seria apressado.
PERIODO_PARA_ALERTAR = 60

ROTULO_SEM_CARTAO = "Sem cartão vinculado"
COR_SEM_CARTAO = "#B5B5A8"


# Contexto do mês escolhido
def contexto_mes(usuario, ano=None, mes=None, hoje=None):
    """Reúne tudo o que a barra de navegação de meses precisa saber.

    Sem ano e mês, assume o mês corrente do usuário. É o ponto de partida de
    quase todo endpoint, que passa esse contexto adiante.
    """
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    hoje = hoje or date.today()
    ano_atual, mes_atual = periodo.mes_atual(dia_inicio, hoje)
    ano = ano or ano_atual
    mes = mes or mes_atual
    inicio, fim = periodo.intervalo_mes(ano, mes, dia_inicio)
    anterior = periodo.mes_anterior(ano, mes)
    proximo = periodo.proximo_mes(ano, mes)
    e_mes_atual = (ano, mes) == (ano_atual, mes_atual)
    return {
        "ano": ano,
        "mes": mes,
        "inicio": inicio,
        "fim": fim,
        "rotulo": mes_extenso(ano, mes),
        "e_mes_atual": e_mes_atual,
        "anterior": {"ano": anterior[0], "mes": anterior[1],
                     "rotulo": mes_extenso(*anterior)},
        "proximo": {"ano": proximo[0], "mes": proximo[1],
                    "rotulo": mes_extenso(*proximo)},
        # Mês passado já acabou, então aparece cheio na barra de progresso
        "progresso": periodo.progresso_do_mes(inicio, fim, hoje) if e_mes_atual else 100,
    }


def contexto_json(ctx):
    """A parte do contexto que o frontend precisa, com datas em texto."""
    return {
        "ano": ctx["ano"],
        "mes": ctx["mes"],
        "rotulo": ctx["rotulo"],
        "inicio": ctx["inicio"].isoformat(),
        "fim": ctx["fim"].isoformat(),
        "e_mes_atual": ctx["e_mes_atual"],
        "progresso": ctx["progresso"],
        "anterior": ctx["anterior"],
        "proximo": ctx["proximo"],
    }


# Meta de investimento
def investimento_do_periodo(usuario, hoje=None):
    """Estado da meta de investimento no período atual da cadência.

    Devolve None quando a pessoa nunca criou essa meta, e o frontend usa
    isso para esconder o cartão, a seção e o gráfico. Um espaço zerado é
    lido pelo público-alvo como erro ou como algo que falta preencher.
    """
    meta = metas.investimento(usuario["id"])
    if not meta:
        return None

    hoje = hoje or date.today()
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    cadencia = meta["cadencia"] or "mensal"
    inicio, fim = periodo.intervalo_cadencia(cadencia, dia_inicio, hoje)

    alvo = Decimal(str(meta["valor_alvo"]))
    guardado = Decimal(str(metas.guardado_no_periodo(meta["id"], inicio, fim)))

    return {
        "meta_id": meta["id"],
        "nome": meta["nome"],
        "cadencia": cadencia,
        "rotulo_periodo": periodo.rotulo_cadencia(cadencia),
        "alvo": numero(alvo),
        "guardado": numero(guardado),
        "falta": numero(max(alvo - guardado, Decimal("0"))),
        "pct": min(porcentagem(guardado, alvo), 100),
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
        "progresso_periodo": periodo.progresso_do_mes(inicio, fim, hoje),
        "total_guardado": numero(meta["guardado"]),
    }


def _guardado_no_mes(usuario, ctx):
    """Quanto foi para a meta de investimento dentro do mês financeiro.

    É esse valor que sai do "disponível para gastar": dinheiro reservado
    deixou de estar disponível, mas só depois que a pessoa reservou.
    """
    meta = metas.investimento(usuario["id"])
    if not meta:
        return Decimal("0")
    return Decimal(str(metas.guardado_no_periodo(meta["id"], ctx["inicio"], ctx["fim"])))


def alerta_de_sobra(resumo, investimento):
    """Sugere guardar a folga quando o período está acabando.

    Aparece só perto do fim do período e só quando as duas coisas são
    verdade: ainda há folga no disponível e a meta do período não foi
    batida. Os botões agem. O X apenas dispensa, sem mover valor nenhum.
    """
    if not investimento:
        return None
    if investimento["progresso_periodo"] < PERIODO_PARA_ALERTAR:
        return None

    disponivel = Decimal(str(resumo["disponivel"]))
    falta = Decimal(str(investimento["falta"]))
    if disponivel <= 0 or falta <= 0:
        return None

    # Nunca sugere guardar mais do que a pessoa tem sobrando
    sugestao = min(disponivel, falta)
    return {
        "valor_sugerido": numero(sugestao),
        "meta_id": investimento["meta_id"],
        "rotulo_periodo": investimento["rotulo_periodo"],
        "bate_a_meta": sugestao >= falta,
    }


# O número grande: quanto ainda posso gastar
def resumo_do_mes(usuario, ctx):
    """Os números do mês, a taxa de poupança e a comparação com o anterior.

    A regra do "quanto ainda posso gastar" muda conforme a pessoa tenha ou
    não um planejamento: com planejamento a conta parte do limite que ela
    mesma combinou. Sem planejamento, a única referência é o que entrou.
    Dos dois casos ainda sai o que já foi guardado no mês.
    """
    usuario_id = usuario["id"]
    totais = transacoes.totais_do_periodo(usuario_id, ctx["inicio"], ctx["fim"])
    ganhos = Decimal(str(totais["ganho"]))
    gastos = Decimal(str(totais["gasto"]))

    planejado = Decimal(str(orcamentos.total_planejado(usuario_id, ctx["ano"], ctx["mes"])))
    tem_orcamento = planejado > 0
    base = planejado if tem_orcamento else ganhos

    guardado = _guardado_no_mes(usuario, ctx)
    disponivel = base - gastos - guardado

    anterior = ctx["anterior"]
    inicio_ant, fim_ant = periodo.intervalo_mes(
        anterior["ano"], anterior["mes"], usuario.get("dia_inicio_mes") or 1
    )
    gastos_anteriores = Decimal(str(
        transacoes.total(usuario_id, "gasto", inicio_ant, fim_ant)
    ))

    # A taxa de poupança conta o que sobrou mais o que foi guardado: guardar
    # é o objetivo, não uma perda
    sobra = ganhos - gastos

    return {
        "ganhos": numero(ganhos),
        "gastos": numero(gastos),
        "guardado": numero(guardado),
        "sobra": numero(sobra),
        "disponivel": numero(disponivel),
        "planejado": numero(planejado),
        "tem_orcamento": tem_orcamento,
        "usado_pct": porcentagem(gastos + guardado, base),
        "taxa_poupanca": porcentagem(sobra, ganhos) if ganhos > 0 else 0,
        "mes_anterior_gastos": numero(gastos_anteriores),
        "diferenca": numero(gastos - gastos_anteriores),
        # Sem gasto nenhum no mês anterior não há comparação honesta a fazer
        "tem_comparacao": gastos_anteriores > 0,
        "rotulo_mes_anterior": anterior["rotulo"].split(" de ")[0].lower(),
        "sem_dados": ganhos == 0 and gastos == 0,
    }


# Gráficos
def grafico_categorias(usuario, ctx, tipo="gasto", limite=None):
    """Para onde foi o dinheiro: soma por categoria, da maior para a menor."""
    linhas = transacoes.por_categoria(usuario["id"], ctx["inicio"], ctx["fim"], tipo)
    total = sum(Decimal(str(l["total"])) for l in linhas)
    itens = []
    for linha in linhas:
        valor = Decimal(str(linha["total"]))
        itens.append({
            "id": linha["id"],
            "nome": linha["nome"],
            "icone": linha["icone"],
            "cor": linha["cor"],
            "essencial": bool(linha["essencial"]),
            "valor": numero(valor),
            "pct": porcentagem(valor, total),
        })
    # O limite corta a lista só na exibição: o total continua sendo o do mês
    if limite:
        itens = itens[:limite]
    return {"total": numero(total), "itens": itens}


def grafico_cartoes(usuario, ctx):
    """Gastos por cartão ou banco.

    Devolve None quando não há nenhum cartão cadastrado: sem eles o recurso
    inteiro fica escondido, em vez de mostrar um gráfico de uma fatia só.
    """
    if not cartoes.quantidade(usuario["id"]):
        return None

    linhas = transacoes.por_cartao(usuario["id"], ctx["inicio"], ctx["fim"])
    total = sum(Decimal(str(l["total"])) for l in linhas)
    itens = []
    for linha in linhas:
        valor = Decimal(str(linha["total"]))
        itens.append({
            "id": linha["id"],
            # Gasto sem cartão marcado ganha fatia própria, para o gráfico
            # fechar com o total do mês em vez de parecer incompleto
            "nome": linha["nome"] or ROTULO_SEM_CARTAO,
            "cor": linha["cor"] or COR_SEM_CARTAO,
            "vinculado": linha["id"] is not None,
            "valor": numero(valor),
            "pct": porcentagem(valor, total),
        })
    return {"total": numero(total), "itens": itens}


def grafico_evolucao(usuario, ctx, meses=None):
    """Ganhos, gastos e saldo de cada um dos últimos meses.

    Os meses sem nenhum registro entram zerados, para o gráfico não pular
    períodos e dar a impressão de que o tempo andou mais depressa.
    """
    meses = meses or Config.MESES_GRAFICO
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    lista = periodo.ultimos_meses(ctx["ano"], ctx["mes"], meses)
    inicio = periodo.intervalo_mes(lista[0][0], lista[0][1], dia_inicio)[0]
    fim = periodo.intervalo_mes(lista[-1][0], lista[-1][1], dia_inicio)[1]

    bruto = transacoes.evolucao(usuario["id"], inicio, fim, dia_inicio)
    mapa = {}
    for linha in bruto:
        chave = (int(linha["ano"]), int(linha["mes"]))
        mapa.setdefault(chave, {"ganho": 0, "gasto": 0})
        mapa[chave][linha["tipo"]] = numero(linha["total"])

    itens = []
    for ano, mes in lista:
        valores = mapa.get((ano, mes), {"ganho": 0, "gasto": 0})
        itens.append({
            "ano": ano,
            "mes": mes,
            "rotulo": mes_curto(ano, mes),
            "ganhos": valores["ganho"],
            "gastos": valores["gasto"],
            "saldo": round(valores["ganho"] - valores["gasto"], 2),
        })
    return {"itens": itens, "meses": meses}


def grafico_investimento(usuario, quantidade=6, hoje=None):
    """Quanto foi guardado em cada período da cadência, contra a meta.

    Cada ponto é um período inteiro da cadência escolhida, e não um mês
    fixo: uma meta semanal precisa aparecer semana a semana, e uma anual só
    faz sentido na janela de 12 meses.
    """
    meta = metas.investimento(usuario["id"])
    if not meta:
        return None

    hoje = hoje or date.today()
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    cadencia = meta["cadencia"] or "mensal"
    alvo = numero(meta["valor_alvo"])

    itens = []
    for inicio, fim, rotulo in periodo.periodos_da_cadencia(
        cadencia, quantidade, dia_inicio, hoje
    ):
        guardado = metas.guardado_no_periodo(meta["id"], inicio, fim)
        itens.append({
            "rotulo": rotulo,
            "guardado": numero(guardado),
            "alvo": alvo,
            "bateu": numero(guardado) >= alvo,
        })

    return {"itens": itens, "alvo": alvo, "cadencia": cadencia,
            "nome": meta["nome"]}


def grafico_orcamento(usuario, ctx):
    """Planejado x gasto por categoria, com o estado da barra."""
    usuario_id = usuario["id"]
    limites = orcamentos.listar(usuario_id, ctx["ano"], ctx["mes"])
    gastos = {
        linha["id"]: Decimal(str(linha["total"]))
        for linha in transacoes.por_categoria(usuario_id, ctx["inicio"], ctx["fim"])
    }
    itens = []
    for limite in limites:
        planejado = Decimal(str(limite["valor_limite"]))
        gasto = gastos.get(limite["categoria_id"], Decimal("0"))
        pct = porcentagem(gasto, planejado)
        if pct > LIMITE_ESTOURO:
            estado = "estourou"
        elif pct >= LIMITE_ATENCAO:
            estado = "atencao"
        else:
            estado = "tranquilo"
        itens.append({
            "categoria_id": limite["categoria_id"],
            "nome": limite["nome"],
            "icone": limite["icone"],
            "cor": limite["cor"],
            "essencial": bool(limite["essencial"]),
            "planejado": numero(planejado),
            "gasto": numero(gasto),
            "restante": numero(planejado - gasto),
            "pct": pct,
            "estado": estado,
        })
    # As categorias mais apertadas primeiro: são as que pedem atenção
    itens.sort(key=lambda i: i["pct"], reverse=True)
    return {
        "itens": itens,
        "total_planejado": numero(sum(Decimal(str(i["planejado"])) for i in itens)),
        "total_gasto": numero(sum(Decimal(str(i["gasto"])) for i in itens)),
    }


def grafico_fixos_variaveis(usuario, ctx):
    """Quanto do mês já estava comprometido antes de ele começar."""
    dados = transacoes.fixos_e_variaveis(usuario["id"], ctx["inicio"], ctx["fim"])
    fixos = Decimal(str(dados["fixos"]))
    variaveis = Decimal(str(dados["variaveis"]))
    total = fixos + variaveis
    return {
        "fixos": numero(fixos),
        "variaveis": numero(variaveis),
        "total": numero(total),
        "pct_fixos": porcentagem(fixos, total),
        "pct_variaveis": porcentagem(variaveis, total),
    }


# Blocos do painel Início
def com_progresso(linha_meta):
    """Acrescenta à meta o quanto já foi e o quanto falta."""
    alvo = Decimal(str(linha_meta["valor_alvo"]))
    guardado = Decimal(str(linha_meta["guardado"]))
    return {
        "id": linha_meta["id"],
        "nome": linha_meta["nome"],
        "icone": linha_meta["icone"],
        "valor_alvo": numero(alvo),
        "guardado": numero(guardado),
        "prazo": linha_meta["prazo"].isoformat() if linha_meta["prazo"] else None,
        "reserva_emergencia": bool(linha_meta["reserva_emergencia"]),
        # A barra para em 100% mesmo quando a pessoa guarda mais que a meta
        "pct": min(porcentagem(guardado, alvo), 100),
        "falta": numero(max(alvo - guardado, Decimal("0"))),
        "concluida": bool(linha_meta["concluida_em"]) or guardado >= alvo,
    }


def estado_da_conta(linha_conta, hoje=None):
    """Situação de uma conta a pagar, que define a cor da bolinha."""
    hoje = hoje or date.today()
    if linha_conta["paga_em"]:
        return "paga"
    dias = (linha_conta["vencimento"] - hoje).days
    if dias < 0:
        return "atrasada"
    if dias == 0:
        return "hoje"
    if dias <= 7:
        return "proxima"
    return "futura"


def conta_json(linha, hoje=None):
    return {
        "id": linha["id"],
        "descricao": linha["descricao"],
        "valor": numero(linha["valor"]),
        "vencimento": linha["vencimento"].isoformat(),
        "recorrente": bool(linha["recorrente"]),
        "paga_em": linha["paga_em"].isoformat() if linha["paga_em"] else None,
        "categoria_id": linha["categoria_id"],
        "categoria_nome": linha["categoria_nome"],
        "categoria_icone": linha["categoria_icone"],
        "categoria_cor": linha["categoria_cor"],
        "estado": estado_da_conta(linha, hoje),
    }


def _projetar_recorrente(linha, ano, mes):
    """Onde uma conta que se repete cairia no mês pedido.

    Devolve o mesmo formato de conta_json, mas sem id e marcada como
    prevista: ela ainda não existe no banco. A do mês seguinte só nasce
    quando a do mês atual é paga, e é isso que permite ver, hoje, o que
    vai vencer em dezembro sem criar doze registros vazios por conta.
    """
    vencimento = periodo.dia_seguro(ano, mes, linha["vencimento"].day)
    return {
        "id": None,
        "descricao": linha["descricao"],
        "valor": numero(linha["valor"]),
        "vencimento": vencimento.isoformat(),
        "recorrente": True,
        "paga_em": None,
        "categoria_id": linha["categoria_id"],
        "categoria_nome": linha["categoria_nome"],
        "categoria_icone": linha["categoria_icone"],
        "categoria_cor": linha["categoria_cor"],
        "estado": "prevista",
        "prevista": True,
    }


def contas_do_mes(usuario, ctx):
    """Tudo o que há para pagar num mês, em três listas diferentes.

    As contas são as do calendário: existem no banco e podem ser marcadas
    como pagas.

    As previstas são as recorrentes projetadas para um mês que ainda não
    chegou. Como não existem no banco, não há o que pagar nelas. Servem para
    a pessoa saber com o que já pode contar.

    O comprometido são gastos já registrados naquele mês sem terem
    acontecido: a parcela 3/6 de um celular comprado hoje, os gastos
    marcados como fixos. Eles já entram no "quanto posso gastar" daquele
    mês, então aqui aparecem só para leitura. Marcá-los como pagos criaria o
    mesmo gasto duas vezes.
    """
    hoje = date.today()
    inicio, fim = ctx["inicio"], ctx["fim"]
    # Atrasadas só interessam no mês corrente: num mês futuro elas não são
    # daquele mês, e num mês passado já ficaram para trás de vez
    itens = [
        conta_json(c, hoje)
        for c in contas.do_periodo(usuario["id"], inicio, fim,
                                   incluir_atrasadas=ctx["e_mes_atual"])
    ]

    # Uma recorrente só é projetada se o mês pedido está à frente da última
    # ocorrência que existe, e se aquele mês ainda não tem a conta dela
    ja_tem = {(c["descricao"], c["categoria_id"]) for c in itens}
    previstas = []
    if fim > hoje:
        for linha in contas.recorrentes_recentes(usuario["id"]):
            if (linha["descricao"], linha["categoria_id"]) in ja_tem:
                continue
            if linha["vencimento"] >= inicio:
                continue
            previstas.append(_projetar_recorrente(linha, ctx["ano"], ctx["mes"]))

    # Parcelas e gastos fixos já lançados no mês
    comprometido = [
        transacao_json(t)
        for t in transacoes.listar(usuario["id"], inicio=inicio, fim=fim,
                                   tipo="gasto")
        if t["parcela_total"] or t["fixa"]
    ]

    return {
        "itens": itens,
        "previstas": previstas,
        "comprometido": comprometido,
        "total_aberto": round(sum(c["valor"] for c in itens if not c["paga_em"]), 2),
        "total_previsto": round(sum(c["valor"] for c in previstas), 2),
        "total_comprometido": round(sum(t["valor"] for t in comprometido), 2),
        "hoje": hoje.isoformat(),
    }


def transacao_json(linha):
    return {
        "id": linha["id"],
        "tipo": linha["tipo"],
        "valor": numero(linha["valor"]),
        "descricao": linha["descricao"],
        "data": linha["data"].isoformat(),
        "forma_pagamento": linha["forma_pagamento"],
        "fixa": bool(linha["fixa"]),
        "categoria_id": linha["categoria_id"],
        "categoria_nome": linha["categoria_nome"],
        "categoria_icone": linha["categoria_icone"],
        "categoria_cor": linha["categoria_cor"],
        "cartao_id": linha["cartao_id"],
        "cartao_nome": linha["cartao_nome"],
        "cartao_cor": linha["cartao_cor"],
        "parcela_atual": linha["parcela_atual"],
        "parcela_total": linha["parcela_total"],
        "grupo_parcela": linha["grupo_parcela"],
    }


def painel(usuario, ctx, hoje=None):
    """Junta tudo o que a tela Início mostra, em uma chamada só.

    Uma requisição só, e não sete, porque o backend gratuito hiberna: cada
    chamada extra no primeiro acesso do dia somaria ao tempo de espera.
    """
    hoje = hoje or date.today()
    usuario_id = usuario["id"]

    resumo = resumo_do_mes(usuario, ctx)
    invest = investimento_do_periodo(usuario, hoje)

    return {
        "mes": contexto_json(ctx),
        "resumo": resumo,
        "investimento": invest,
        "alerta_sobra": alerta_de_sobra(resumo, invest),
        "categorias": grafico_categorias(usuario, ctx, limite=4),
        "proximas_contas": [
            conta_json(c, hoje)
            for c in contas.proximas(usuario_id, hoje + timedelta(days=7))
        ],
        "metas": [com_progresso(m) for m in metas.destaques(usuario_id, 2)],
        "ultimos": [transacao_json(t) for t in transacoes.ultimas(usuario_id, 5)],
    }
