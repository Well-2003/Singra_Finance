"""Singra - formatação e leitura segura de valores no backend.

O frontend é quem monta o texto que aparece na tela, então aqui ficam só as
duas coisas que a API realmente precisa: ler com segurança o que chegou do
navegador e escrever os poucos textos que o backend ainda gera (as frases
que explicam os gráficos e o CSV de exportação).
"""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation

MESES = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]
MESES_CURTOS = ["", "jan", "fev", "mar", "abr", "mai", "jun",
                "jul", "ago", "set", "out", "nov", "dez"]

FORMAS_PAGAMENTO = ("pix", "dinheiro", "debito", "credito", "boleto")
NOMES_FORMA_PAGAMENTO = {
    "pix": "Pix",
    "dinheiro": "Dinheiro",
    "debito": "Débito",
    "credito": "Crédito",
    "boleto": "Boleto",
}


# Leitura do que vem do navegador
def para_decimal(valor, padrao=None):
    """Lê um valor monetário e devolve Decimal.

    Aceita '1.234,56', '1234.56' e 'R$ 45,90'. Usa Decimal, e nunca float,
    porque centavos em float acumulam erro de arredondamento.
    """
    if valor is None or valor == "":
        return padrao
    if isinstance(valor, Decimal):
        return valor
    if isinstance(valor, (int, float)):
        return Decimal(str(valor))
    texto = str(valor).strip().replace("R$", "").replace(" ", "")
    # Se tem vírgula, ela é o separador decimal e o ponto é de milhar
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return padrao


def para_data(valor, padrao=None):
    """Lê tanto o formato do campo de data quanto o que a pessoa escreveria."""
    if not valor:
        return padrao
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    for formato in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(valor).strip(), formato).date()
        except ValueError:
            continue
    return padrao


def para_inteiro(valor, padrao=None, minimo=None, maximo=None):
    """Lê um número da querystring ou do corpo, com limites.

    Os limites existem para que um valor absurdo vindo do navegador, como
    mes=99, vire o padrão em vez de quebrar a consulta.
    """
    try:
        numero = int(str(valor).strip())
    except (TypeError, ValueError):
        return padrao
    if minimo is not None and numero < minimo:
        return padrao
    if maximo is not None and numero > maximo:
        return padrao
    return numero


def texto_curto(valor, limite, padrao=None):
    """Corta e limpa um texto digitado pelo usuário."""
    if valor is None:
        return padrao
    limpo = str(valor).strip()
    return limpo[:limite] if limpo else padrao


# Saída
def numero(valor):
    """Decimal vira float, porque JSON não sabe transportar Decimal."""
    if valor is None:
        return 0.0
    return float(Decimal(str(valor)))


def porcentagem(parte, total):
    """Devolve 0 a 100 arredondado, tolerando total zerado."""
    parte = Decimal(str(parte or 0))
    total = Decimal(str(total or 0))
    # Período sem nenhum registro: 0% em vez de divisão por zero
    if total <= 0:
        return 0
    return int(round(float(parte / total * 100)))


def moeda(valor):
    """1234.5 vira 'R$ 1.234,50'. Usado nas frases dos gráficos."""
    numero_decimal = Decimal(str(valor or 0)).quantize(Decimal("0.01"))
    # Formata no padrão americano e troca os separadores de lugar, o que
    # dispensa depender de locale instalado no servidor
    texto = f"{numero_decimal:,.2f}".replace(",", "#").replace(".", ",").replace("#", ".")
    return f"R$ {texto}"


def data_br(valor):
    """date vira '15/08/2026'. Usado no CSV de exportação."""
    if not valor:
        return ""
    if isinstance(valor, datetime):
        valor = valor.date()
    return valor.strftime("%d/%m/%Y")


def mes_extenso(ano, mes):
    return f"{MESES[mes].capitalize()} de {ano}"


def mes_curto(ano, mes):
    """Rótulo do eixo dos gráficos: 'ago/26'."""
    return f"{MESES_CURTOS[mes]}/{str(ano)[2:]}"
