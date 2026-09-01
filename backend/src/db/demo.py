"""Singra - conta de exemplo para desenvolvimento local.

Enche um banco de desenvolvimento com três meses de histórico: gráficos com
forma, metas em andamento, contas vencendo e uma compra parcelada no meio do
caminho. Serve para testar telas que só fazem sentido com dados dentro, sem
esperar três meses de uso de verdade.

Não é usada em produção e não é criada por nenhuma parte do sistema. Roda
somente quando alguém digita o comando, e apaga a conta anterior antes de
criar a nova, então nunca duplica.

Os números são sorteados, mas a semente é fixa: rodar de novo produz
exatamente os mesmos dados.
"""

import random
import sys
from datetime import date, timedelta
from decimal import Decimal

from src.core import parcelamento, periodo, planejador
from src.db import conexao
from src.db.repositorios import cartoes, categorias, contas, metas, orcamentos, transacoes
from src.db.repositorios import usuarios

EMAIL = "demo@singra.com.br"
SENHA = "singra1234"
NOME = "Renata Alves"
APELIDO = "Renata"
RENDA = Decimal("3200.00")
META_INVESTIMENTO = Decimal("500.00")

# A rotina de um mês típico da persona:
# (categoria, quantos por mês, valor mínimo, valor máximo, é fixo?)
ROTINA = [
    ("Moradia",        1, 900, 900, True),
    ("Contas da casa", 3,  60, 190, True),
    ("Assinaturas",    2,  20,  55, True),
    ("Alimentação",    5,  70, 260, False),
    ("Transporte",     8,  10,  45, False),
    ("Delivery",       4,  32,  85, False),
    ("Saúde",          1,  40, 160, False),
    ("Lazer",          3,  25, 120, False),
    ("Compras",        1,  60, 240, False),
    ("Beleza",         1,  40,  90, False),
]

# Descrições de verdade deixam o histórico parecido com o de alguém real
DESCRICOES = {
    "Moradia": ["Aluguel"],
    "Contas da casa": ["Conta de luz", "Conta de água", "Internet"],
    "Assinaturas": ["Streaming", "Música", "Nuvem do celular"],
    "Alimentação": ["Mercado do mês", "Feira", "Padaria", "Mercadinho da esquina"],
    "Transporte": ["Ônibus", "Aplicativo", "Recarga do cartão"],
    "Delivery": ["Pizza de sexta", "Marmita", "Lanche", "Café da tarde"],
    "Saúde": ["Farmácia", "Consulta", "Remédio"],
    "Lazer": ["Cinema", "Bar com amigos", "Passeio no parque"],
    "Compras": ["Roupa nova", "Presente", "Coisas de casa"],
    "Beleza": ["Cabelo", "Manicure"],
}

FORMAS = ["pix", "debito", "credito", "dinheiro"]
COM_CARTAO = ("debito", "credito")

CARTOES = [
    ("Nubank", "#B88C9E"),
    ("Conta corrente", "#8FA3B8"),
]


def _valor(sorteio, minimo, maximo):
    """Valor em reais dentro da faixa da categoria.

    Aluguel tem mínimo igual ao máximo, porque é o mesmo todo mês: nesse
    caso não há o que sortear, e randrange recusaria a faixa vazia.
    """
    if minimo >= maximo:
        return Decimal(minimo).quantize(Decimal("0.01"))
    return (Decimal(sorteio.randrange(minimo * 100, maximo * 100)) / 100
            ).quantize(Decimal("0.01"))


def apagar_anterior():
    """A conta antiga sai inteira antes de a nova entrar."""
    antiga = usuarios.por_email(EMAIL)
    if antiga:
        usuarios.apagar(antiga["id"])
        return True
    return False


def criar_usuario():
    usuario_id = usuarios.criar(NOME, EMAIL, SENHA)
    usuarios.atualizar_perfil(usuario_id, apelido=APELIDO)
    usuarios.salvar_onboarding(usuario_id, renda=RENDA, renda_variavel=False)
    usuarios.salvar_renda_extra(usuario_id, "freela", Decimal("300.00"))
    usuarios.concluir_onboarding(usuario_id)
    return usuarios.por_id(usuario_id)


def criar_cartoes(usuario):
    return [cartoes.criar(usuario["id"], nome, cor) for nome, cor in CARTOES]


def criar_transacoes(usuario, sorteio, ids_cartoes):
    """Preenche os três últimos meses financeiros."""
    usuario_id = usuario["id"]
    por_nome = {c["nome"]: c for c in categorias.listar(usuario_id, incluir_ocultas=True)}
    hoje = date.today()
    ano, mes = periodo.mes_atual(usuario["dia_inicio_mes"], hoje)
    total = 0

    for indice in range(3):
        ano_mes, mes_mes = periodo.somar_meses(ano, mes, -(2 - indice))
        inicio, fim = periodo.intervalo_mes(ano_mes, mes_mes, usuario["dia_inicio_mes"])
        dias_no_mes = (fim - inicio).days + 1

        # O salário cai no primeiro dia do mês financeiro
        transacoes.criar(usuario_id, por_nome["Salário"]["id"], "ganho", RENDA,
                         min(inicio, hoje), "Salário do mês", "pix", True)
        total += 1

        # Uma renda extra em dois dos três meses, para o gráfico ter variação
        if indice != 1:
            dia_extra = inicio + timedelta(days=sorteio.randint(5, dias_no_mes - 1))
            if dia_extra <= hoje:
                transacoes.criar(usuario_id, por_nome["Renda extra"]["id"], "ganho",
                                 Decimal(sorteio.randrange(120, 400)), dia_extra,
                                 "Freela de fim de semana", "pix")
                total += 1

        for nome, quantidade, minimo, maximo, fixo in ROTINA:
            for _ in range(quantidade):
                dia = inicio + timedelta(days=sorteio.randint(0, dias_no_mes - 1))
                # O mês corrente ainda não acabou: nada de gasto no futuro
                if dia > hoje:
                    continue

                forma = "boleto" if fixo else sorteio.choice(FORMAS)
                # Só débito e crédito aceitam vínculo com cartão, e nem todo
                # gasto é vinculado: a fatia "sem cartão" precisa existir
                cartao = None
                if forma in COM_CARTAO and sorteio.random() < 0.7:
                    cartao = sorteio.choice(ids_cartoes)

                transacoes.criar(usuario_id, por_nome[nome]["id"], "gasto",
                                 _valor(sorteio, minimo, maximo), dia,
                                 sorteio.choice(DESCRICOES[nome]), forma, fixo,
                                 cartao_id=cartao)
                total += 1

    return total


def criar_parcelamento(usuario, ids_cartoes):
    """Uma compra em 6x começada há 40 dias, para o recurso aparecer."""
    por_nome = {c["nome"]: c for c in categorias.listar(usuario["id"])}
    parcelamento.registrar(
        usuario["id"], por_nome["Compras"]["id"], "gasto", Decimal("1200.00"),
        date.today() - timedelta(days=40), 6, "Geladeira nova", "credito",
        cartao_id=ids_cartoes[0],
    )
    return 6


def criar_planejamento(usuario):
    """Monta o 50/30/20 do mês e copia para o anterior.

    O mês anterior também precisa de planejamento para o gráfico de
    planejado x gasto ter o que comparar quando a pessoa voltar um mês.
    """
    ano, mes = periodo.mes_atual(usuario["dia_inicio_mes"])
    resultado = planejador.sugerir_orcamento(usuario, ano, mes, renda=RENDA)
    anterior = periodo.mes_anterior(ano, mes)
    orcamentos.copiar_de(usuario["id"], ano, mes, anterior[0], anterior[1])
    return resultado["quantidade"]


def criar_metas(usuario):
    """Três metas comuns, mais a de investimento com aportes no mês."""
    hoje = date.today()

    celular = metas.criar(usuario["id"], "Celular novo", Decimal("2500.00"),
                          prazo=date(hoje.year, 12, 20), icone="compras")
    for numero in range(4):
        metas.registrar_aporte(celular, Decimal("300.00"),
                               hoje - timedelta(days=30 * (4 - numero)))

    sugestao = planejador.reserva_sugerida(usuario)
    reserva = metas.criar(
        usuario["id"], "Reserva de emergência",
        Decimal(str(sugestao["valor"])) if sugestao["disponivel"] else Decimal("7200.00"),
        icone="reserva", reserva_emergencia=True,
    )
    metas.registrar_aporte(reserva, Decimal("850.00"), hoje - timedelta(days=20))

    viagem = metas.criar(usuario["id"], "Praia em janeiro", Decimal("1500.00"),
                         icone="viagens")
    metas.registrar_aporte(viagem, Decimal("400.00"), hoje - timedelta(days=12))

    # A meta de investimento fica com parte do período guardada, para o
    # cartão do Início mostrar progresso e o alerta de sobra fazer sentido
    investimento = metas.criar(usuario["id"], "Guardar dinheiro", META_INVESTIMENTO,
                               icone="rendimento", eh_investimento=True,
                               cadencia="mensal")
    metas.registrar_aporte(investimento, Decimal("200.00"), hoje - timedelta(days=6))

    return 4


def criar_contas(usuario):
    """Contas em situações diferentes: vencida, vencendo e mais para frente."""
    por_nome = {c["nome"]: c for c in categorias.listar(usuario["id"], tipo="gasto")}
    hoje = date.today()
    linhas = [
        ("Conta de luz",    Decimal("184.30"), hoje + timedelta(days=3),  True,  "Contas da casa"),
        ("Internet",        Decimal("99.90"),  hoje + timedelta(days=6),  True,  "Contas da casa"),
        ("Aluguel",         Decimal("900.00"), hoje + timedelta(days=11), True,  "Moradia"),
        ("Plano de saúde",  Decimal("236.00"), hoje - timedelta(days=2),  True,  "Saúde"),
        ("Curso de inglês", Decimal("189.00"), hoje + timedelta(days=20), False, "Educação"),
    ]
    for descricao, valor, vencimento, recorrente, nome_categoria in linhas:
        contas.criar(usuario["id"], por_nome[nome_categoria]["id"], descricao,
                     valor, vencimento, recorrente)
    return len(linhas)


def gerar():
    """Recria a conta inteira. Devolve um resumo do que foi criado."""
    sorteio = random.Random(20260829)   # semente fixa: sempre os mesmos dados

    substituiu = apagar_anterior()
    usuario = criar_usuario()
    ids_cartoes = criar_cartoes(usuario)

    quantidade = criar_transacoes(usuario, sorteio, ids_cartoes)
    quantidade += criar_parcelamento(usuario, ids_cartoes)

    resumo = {
        "substituiu_anterior": substituiu,
        "email": EMAIL,
        "registros": quantidade,
        "cartoes": len(ids_cartoes),
        "categorias_no_planejamento": criar_planejamento(usuario),
        "metas": criar_metas(usuario),
        "contas": criar_contas(usuario),
    }
    conexao.commit()
    return resumo


if __name__ == "__main__":
    # O terminal do Windows costuma usar cp1252, que não escreve acento
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    from src.main import criar_app

    with criar_app().app_context():
        for chave, valor in gerar().items():
            print(f"  {chave:28} {valor}")
        print()
        print("Entre no site com:")
        print(f"  e-mail: {EMAIL}")
        print(f"  senha:  {SENHA}")
