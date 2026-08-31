"""Singra - o mês financeiro e os períodos da meta de investimento.

Quem recebe no dia 5 não vive o mês do calendário: para essa pessoa, agosto
começa no dia 5 de agosto e termina no dia 4 de setembro. O usuário escolhe
esse dia no perfil e todo cálculo do site usa o intervalo dele. Com
dia_inicio = 1, que é o padrão, tudo se comporta como o mês normal.

A meta de investimento acrescenta uma segunda noção de período: a cadência
escolhida pela pessoa (diária, semanal, mensal ou anual). A meta não tem
prazo, ela se renova sozinha a cada novo período.
"""

import calendar
from datetime import date, timedelta

CADENCIAS = ("diaria", "semanal", "mensal", "anual")


def normalizar_dia(dia_inicio):
    """Limita o dia entre 1 e 28.

    Acima de 28 o mês financeiro não existiria em fevereiro, então o limite
    evita ter que tratar essa exceção em todo cálculo daqui para frente.
    """
    try:
        dia = int(dia_inicio or 1)
    except (TypeError, ValueError):
        dia = 1
    return min(max(dia, 1), 28)


# Navegação entre meses
def mes_anterior(ano, mes):
    return (ano - 1, 12) if mes == 1 else (ano, mes - 1)


def proximo_mes(ano, mes):
    return (ano + 1, 1) if mes == 12 else (ano, mes + 1)


def somar_meses(ano, mes, quantidade):
    """Anda para frente ou para trás, atravessando a virada de ano sozinho."""
    total = (ano * 12 + (mes - 1)) + quantidade
    return total // 12, total % 12 + 1


def ultimos_meses(ano, mes, quantidade=6):
    """Lista de (ano, mês) terminando no mês informado, do mais antigo ao mais novo."""
    return [somar_meses(ano, mes, -i) for i in range(quantidade - 1, -1, -1)]


# Limites do mês financeiro
def intervalo_mes(ano, mes, dia_inicio=1):
    """(primeiro dia, último dia) do mês financeiro, ambos incluídos."""
    dia = normalizar_dia(dia_inicio)
    inicio = date(ano, mes, dia)
    ano_seguinte, mes_seguinte = proximo_mes(ano, mes)
    # O mês termina na véspera do dia em que o seguinte começa
    fim = date(ano_seguinte, mes_seguinte, dia) - timedelta(days=1)
    return inicio, fim


def mes_do_dia(dia, dia_inicio=1):
    """Diz em qual mês financeiro uma data cai."""
    corte = normalizar_dia(dia_inicio)
    if dia.day >= corte:
        return dia.year, dia.month
    return mes_anterior(dia.year, dia.month)


def mes_atual(dia_inicio=1, hoje=None):
    return mes_do_dia(hoje or date.today(), dia_inicio)


def dia_seguro(ano, mes, dia):
    """Dia 31 em fevereiro vira o último dia do mês.

    Usado no parcelamento: uma compra feita no dia 31 precisa gerar parcela
    em todos os meses, inclusive nos que não têm dia 31.
    """
    return date(ano, mes, min(dia, calendar.monthrange(ano, mes)[1]))


def progresso_do_mes(inicio, fim, hoje=None):
    """Quanto do mês financeiro já passou, de 0 a 100."""
    hoje = hoje or date.today()
    total = (fim - inicio).days + 1
    if total <= 0:
        return 0
    passados = (hoje - inicio).days + 1
    return min(max(int(round(passados / total * 100)), 0), 100)


# Períodos da meta de investimento
def intervalo_cadencia(cadencia, dia_inicio=1, hoje=None):
    """(início, fim) do período atual da cadência escolhida.

    A cadência mensal e a anual seguem o mês financeiro do usuário, e não o
    calendário: quem recebe no dia 5 fecha o mês de investimento no dia 4,
    junto com o resto das contas.
    """
    hoje = hoje or date.today()

    if cadencia == "diaria":
        return hoje, hoje

    if cadencia == "semanal":
        # A semana começa na segunda-feira
        inicio = hoje - timedelta(days=hoje.weekday())
        return inicio, inicio + timedelta(days=6)

    if cadencia == "anual":
        ano, _ = mes_do_dia(hoje, dia_inicio)
        inicio = intervalo_mes(ano, 1, dia_inicio)[0]
        fim = intervalo_mes(ano, 12, dia_inicio)[1]
        # Antes do primeiro mês financeiro do ano, ainda estamos no anterior
        if hoje < inicio:
            inicio = intervalo_mes(ano - 1, 1, dia_inicio)[0]
            fim = intervalo_mes(ano - 1, 12, dia_inicio)[1]
        return inicio, fim

    ano, mes = mes_do_dia(hoje, dia_inicio)
    return intervalo_mes(ano, mes, dia_inicio)


def rotulo_cadencia(cadencia):
    """Como o período aparece na frase do cartão: "guardados este mês"."""
    return {
        "diaria": "hoje",
        "semanal": "esta semana",
        "mensal": "este mês",
        "anual": "este ano",
    }.get(cadencia, "este mês")


def periodos_da_cadencia(cadencia, quantidade, dia_inicio=1, hoje=None):
    """Os últimos N períodos da cadência, do mais antigo ao mais novo.

    Alimenta o gráfico "Guardado ao longo do tempo": cada ponto é um período
    inteiro da cadência, e não um mês fixo, porque uma meta semanal precisa
    aparecer semana a semana.
    """
    hoje = hoje or date.today()
    periodos = []

    if cadencia == "diaria":
        for passo in range(quantidade - 1, -1, -1):
            dia = hoje - timedelta(days=passo)
            periodos.append((dia, dia, dia.strftime("%d/%m")))
        return periodos

    if cadencia == "semanal":
        segunda = hoje - timedelta(days=hoje.weekday())
        for passo in range(quantidade - 1, -1, -1):
            inicio = segunda - timedelta(weeks=passo)
            periodos.append((inicio, inicio + timedelta(days=6),
                             inicio.strftime("%d/%m")))
        return periodos

    if cadencia == "anual":
        ano = mes_do_dia(hoje, dia_inicio)[0]
        for passo in range(quantidade - 1, -1, -1):
            alvo = ano - passo
            inicio = intervalo_mes(alvo, 1, dia_inicio)[0]
            fim = intervalo_mes(alvo, 12, dia_inicio)[1]
            periodos.append((inicio, fim, str(alvo)))
        return periodos

    ano, mes = mes_do_dia(hoje, dia_inicio)
    from src.core.formato import mes_curto
    for ano_alvo, mes_alvo in ultimos_meses(ano, mes, quantidade):
        inicio, fim = intervalo_mes(ano_alvo, mes_alvo, dia_inicio)
        periodos.append((inicio, fim, mes_curto(ano_alvo, mes_alvo)))
    return periodos
