"""Singra - compras parceladas.

Uma compra em 10x vira 10 transações, uma por mês, ligadas pelo mesmo
grupo_parcela. O gasto passa a aparecer em cada mês em que ele realmente
pesa no bolso, e apagar uma parcela permite apagar a compra inteira.
"""

import uuid
from decimal import Decimal, ROUND_DOWN

from src.core.periodo import dia_seguro, somar_meses
from src.db.repositorios import transacoes

MAX_PARCELAS = 60


def dividir_valor(total, quantidade):
    """Divide o total em N partes de 2 casas decimais.

    O resto da divisão fica na última parcela. Sem isso, 100 em 3 vezes
    daria 33,33 três vezes e sumiria um centavo do total gasto.
    """
    total = Decimal(str(total)).quantize(Decimal("0.01"))
    parcela = (total / quantidade).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
    partes = [parcela] * quantidade
    partes[-1] = total - parcela * (quantidade - 1)
    return partes


def datas_das_parcelas(primeira_data, quantidade):
    """Mesmo dia nos meses seguintes, respeitando os meses mais curtos."""
    datas = []
    for indice in range(quantidade):
        ano, mes = somar_meses(primeira_data.year, primeira_data.month, indice)
        datas.append(dia_seguro(ano, mes, primeira_data.day))
    return datas


def registrar(usuario_id, categoria_id, tipo, valor_total, data, parcelas,
              descricao=None, forma_pagamento="credito", cartao_id=None):
    """Grava todas as parcelas e devolve (id da primeira, grupo, quantidade).

    O valor_total é o preço cheio da compra: é o que a pessoa lembra e o que
    ela digita. Quem chama converte antes, se receber o valor da parcela.
    """
    quantidade = max(2, min(int(parcelas), MAX_PARCELAS))
    grupo = str(uuid.uuid4())
    partes = dividir_valor(valor_total, quantidade)
    datas = datas_das_parcelas(data, quantidade)

    linhas = []
    for indice in range(quantidade):
        texto = descricao or "Compra parcelada"
        # O "(3/10)" na descrição deixa a parcela reconhecível no histórico
        linhas.append((
            usuario_id, categoria_id, cartao_id, tipo, partes[indice],
            f"{texto} ({indice + 1}/{quantidade})"[:120],
            datas[indice], forma_pagamento, False,
            indice + 1, quantidade, grupo,
        ))

    transacoes.criar_lote(linhas)
    primeira = transacoes.primeira_do_grupo(usuario_id, grupo)
    return (primeira["id"] if primeira else 0), grupo, quantidade
