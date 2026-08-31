"""Singra - sugestões automáticas de planejamento e de reserva.

Ninguém que nunca fez um orçamento sabe quanto colocar em cada linha. Estas
funções preenchem um primeiro palpite razoável, que o usuário ajusta depois.
É ponto de partida, não lei.
"""

from decimal import Decimal

from src.config import Config
from src.core import periodo
from src.db import conexao
from src.db.repositorios import categorias, orcamentos, transacoes

# Regra 50/30/20: metade da renda para o essencial, 30% para o que a pessoa
# gosta, 20% para guardar. Os 20% viram sugestão de meta, não linha de
# orçamento, o Singra nunca trata guardar dinheiro como um gasto.
FATIA_ESSENCIAL = Decimal("0.50")
FATIA_DESEJOS = Decimal("0.30")
FATIA_GUARDAR = Decimal("0.20")

ARREDONDAMENTO = Decimal("10")   # limites saem redondos, de 10 em 10 reais


def _arredondar(valor):
    """Números redondos são mais fáceis de entender: 420, não 417,63."""
    valor = Decimal(str(valor))
    if valor <= 0:
        return Decimal("0.00")
    return (valor / ARREDONDAMENTO).quantize(Decimal("1")) * ARREDONDAMENTO


def _repartir(total, lista_categorias, historico):
    """Divide um bolo entre categorias, seguindo o histórico quando houver.

    Quem já registrou gastos recebe uma divisão parecida com a vida real
    dele. Quem está começando recebe partes iguais, que é o melhor palpite
    possível sem nenhuma informação.
    """
    if not lista_categorias:
        return {}
    peso_total = sum(historico.get(c["id"], Decimal("0")) for c in lista_categorias)
    valores = {}
    if peso_total > 0:
        for c in lista_categorias:
            peso = historico.get(c["id"], Decimal("0"))
            valores[c["id"]] = _arredondar(total * peso / peso_total)
    else:
        fatia = total / len(lista_categorias)
        for c in lista_categorias:
            valores[c["id"]] = _arredondar(fatia)
    # Categoria que ficaria com zero não entra: linha vazia só ocupa espaço
    return {cid: valor for cid, valor in valores.items() if valor > 0}


def _historico_por_categoria(usuario, meses=3):
    """Quanto a pessoa gastou em cada categoria nos últimos meses."""
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    ano, mes = periodo.mes_atual(dia_inicio)
    lista = periodo.ultimos_meses(ano, mes, meses)
    inicio = periodo.intervalo_mes(lista[0][0], lista[0][1], dia_inicio)[0]
    fim = periodo.intervalo_mes(lista[-1][0], lista[-1][1], dia_inicio)[1]
    return {
        linha["id"]: Decimal(str(linha["total"]))
        for linha in transacoes.por_categoria(usuario["id"], inicio, fim)
    }


def sugerir_orcamento(usuario, ano, mes, renda=None, salvar=True):
    """Monta o planejamento 50/30/20 do mês.

    Devolve também quanto ficou reservado para guardar, que a tela de Metas
    usa como sugestão de meta de investimento.
    """
    renda = Decimal(str(
        renda if renda is not None else (usuario.get("renda_estimada") or 0)
    ))
    if renda <= 0:
        return {"ok": False,
                "mensagem": "Precisamos saber quanto entra por mês para sugerir."}

    lista = categorias.listar(usuario["id"], tipo="gasto")
    essenciais = [c for c in lista if c["essencial"]]
    desejos = [c for c in lista if not c["essencial"]]
    historico = _historico_por_categoria(usuario)

    valores = {}
    valores.update(_repartir(renda * FATIA_ESSENCIAL, essenciais, historico))
    valores.update(_repartir(renda * FATIA_DESEJOS, desejos, historico))

    if salvar:
        # Uma transação só: ou o mês inteiro é substituído, ou nada muda
        orcamentos.limpar_mes(usuario["id"], ano, mes, commit=False)
        for categoria_id, valor in valores.items():
            orcamentos.salvar(usuario["id"], categoria_id, ano, mes, valor,
                              commit=False)
        conexao.commit()

    return {
        "ok": True,
        "renda": float(renda),
        "essenciais": float(renda * FATIA_ESSENCIAL),
        "desejos": float(renda * FATIA_DESEJOS),
        "guardar": float(renda * FATIA_GUARDAR),
        "quantidade": len(valores),
        "mensagem": "Pronto! Montamos um planejamento para você ajustar do seu jeito.",
    }


def reserva_sugerida(usuario):
    """Média dos gastos essenciais dos últimos meses, vezes o número de meses.

    Sem histórico suficiente, estima o essencial como metade da renda
    informada. É menos preciso, mas dá um alvo para começar em vez de
    deixar a tela de Metas vazia esperando três meses de uso.
    """
    dia_inicio = usuario.get("dia_inicio_mes") or 1
    ano, mes = periodo.mes_atual(dia_inicio)
    meses = Config.MESES_RESERVA
    lista = periodo.ultimos_meses(ano, mes, meses)
    inicio = periodo.intervalo_mes(lista[0][0], lista[0][1], dia_inicio)[0]
    fim = periodo.intervalo_mes(lista[-1][0], lista[-1][1], dia_inicio)[1]

    media = Decimal(str(transacoes.media_gastos_essenciais(
        usuario["id"], inicio, fim, meses
    )))

    estimada = False
    if media <= 0:
        renda = Decimal(str(usuario.get("renda_estimada") or 0))
        if renda <= 0:
            return {"disponivel": False, "valor": 0.0, "media": 0.0}
        media = renda * FATIA_ESSENCIAL
        estimada = True

    return {
        "disponivel": True,
        "estimada": estimada,
        "media": float(_arredondar(media)),
        "valor": float(_arredondar(media * meses)),
        "meses": meses,
    }
