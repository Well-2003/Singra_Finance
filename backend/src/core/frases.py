"""Singra - as frases que explicam cada gráfico.

Um gráfico bonito ainda pede interpretação, e o público do Singra é
justamente quem não quer interpretar tabela. Cada função aqui lê os dados e
diz, em uma linha, o que eles significam.

A interface existe em três idiomas, mas quem sabe qual frase cabe é o
backend, que tem os números. Por isso a saída não é um texto pronto, e sim
um descritor: uma chave e os valores que entram nela.

    {"chave": "frase.categorias.maior",
     "valores": {"nome": "Alimentação", "valor": 640.0, "pct": 27},
     "texto": "Alimentação foi seu maior gasto: R$ 640,00 (27% do mês)."}

O frontend procura a chave no arquivo do idioma escolhido e monta a frase
ali. O campo `texto` é a versão em português, usada como reserva enquanto
uma chave nova ainda não foi traduzida, assim uma frase nova nunca aparece
em branco na tela.

Regra de tom: nunca culpar, nunca exagerar, nunca usar ponto de exclamação
para dar bronca. Quando o número é ruim, a frase sugere um próximo passo.
"""

from decimal import Decimal

from src.core.formato import moeda


def _frase(chave, texto, **valores):
    return {"chave": chave, "texto": texto, "valores": valores}


def _d(valor):
    return Decimal(str(valor or 0))


def categorias(dados):
    if not dados["itens"]:
        return _frase(
            "frase.categorias.vazio",
            "Assim que você registrar alguns gastos, mostramos aqui para onde "
            "o dinheiro está indo.",
        )
    maior = dados["itens"][0]
    return _frase(
        "frase.categorias.maior",
        f"{maior['nome']} foi seu maior gasto: "
        f"{moeda(maior['valor'])} ({maior['pct']}% do mês).",
        nome=maior["nome"], valor=maior["valor"], pct=maior["pct"],
    )


def cartoes(dados):
    if not dados or not dados["itens"]:
        return _frase(
            "frase.cartoes.vazio",
            "Vincule seus gastos a um cartão ou conta para ver esta divisão.",
        )
    maior = dados["itens"][0]
    if not maior["vinculado"]:
        return _frase(
            "frase.cartoes.sem_vinculo",
            f"A maior parte dos seus gastos ({maior['pct']}%) ainda não está "
            "vinculada a nenhum cartão.",
            pct=maior["pct"],
        )
    return _frase(
        "frase.cartoes.maior",
        f"{maior['nome']} concentrou {moeda(maior['valor'])} "
        f"({maior['pct']}% dos seus gastos do mês).",
        nome=maior["nome"], valor=maior["valor"], pct=maior["pct"],
    )


def evolucao(dados):
    itens = dados["itens"]
    if len(itens) < 2:
        return _frase(
            "frase.evolucao.poucos_meses",
            "Com mais de um mês registrado, dá para comparar a evolução aqui.",
        )
    atual = itens[-1]
    if atual["ganhos"] == 0 and atual["gastos"] == 0:
        return _frase("frase.evolucao.mes_vazio",
                      "Ainda não há registros neste mês.")
    if atual["ganhos"] >= atual["gastos"]:
        sobra = _d(atual["ganhos"]) - _d(atual["gastos"])
        return _frase(
            "frase.evolucao.sobrou",
            f"Neste mês entrou mais do que saiu: sobraram {moeda(sobra)}.",
            valor=float(sobra),
        )
    falta = _d(atual["gastos"]) - _d(atual["ganhos"])
    return _frase(
        "frase.evolucao.faltou",
        f"Neste mês saiu {moeda(falta)} a mais do que entrou. "
        "Vale olhar as categorias que mais pesaram.",
        valor=float(falta),
    )


def saldo(dados):
    # Meses zerados são meses sem uso, não meses ruins: ficam de fora da conta
    itens = [i for i in dados["itens"] if i["ganhos"] or i["gastos"]]
    if len(itens) < 2:
        return _frase(
            "frase.saldo.poucos_meses",
            "Depois de alguns meses, esta linha mostra se você está melhorando.",
        )
    positivos = sum(1 for i in itens if i["saldo"] > 0)
    if positivos == len(itens):
        return _frase(
            "frase.saldo.todos_positivos",
            "Você fechou no azul em todos os meses registrados. Continue assim.",
        )
    if positivos == 0:
        return _frase(
            "frase.saldo.nenhum_positivo",
            "Nenhum mês fechou sobrando ainda. Um planejamento pode ajudar a "
            "virar esse jogo.",
        )
    return _frase(
        "frase.saldo.parcial",
        f"Você fechou o mês sobrando dinheiro em {positivos} dos {len(itens)} meses.",
        positivos=positivos, total=len(itens),
    )


def _lista_nomes(itens, limite=3):
    """Os nomes das categorias, no máximo três e com um resumo do resto.

    Citar as dez categorias de um mês cheio daria uma frase que ninguém lê.
    Três é o que cabe numa linha e ainda dá para guardar de cabeça.
    """
    nomes = [i["nome"] for i in itens[:limite]]
    sobra = len(itens) - len(nomes)
    if sobra > 0:
        nomes.append(f"mais {sobra}")
    return nomes


def _juntar(nomes):
    """Junta em português: "a, b e c". As outras línguas juntam por conta."""
    if not nomes:
        return ""
    if len(nomes) == 1:
        return nomes[0]
    return ", ".join(nomes[:-1]) + " e " + nomes[-1]


def orcamento(dados):
    """A frase do planejamento, olhando o mês inteiro.

    Antes ela citava só a categoria que mais estourou, o que, num mês em
    que a pessoa passou do limite em cinco lugares, dizia pouco e ainda
    soava como reclamação de um caso isolado. Agora ela separa o mês em duas
    listas: onde vale segurar e onde ainda cabe gastar. E, quando sobra
    dinheiro, lembra que ele pode virar poupança em vez de gasto.
    """
    itens = dados["itens"]
    if not itens:
        return _frase(
            "frase.orcamento.vazio",
            "Você ainda não definiu quanto quer gastar em cada categoria.",
        )

    # A lista chega ordenada pela porcentagem: as mais apertadas vêm antes
    atencao = [i for i in itens if i["estado"] in ("estourou", "atencao")]
    # Uma categoria com um restinho de troco não é "onde ainda dá para
    # gastar": só entra na lista quem tem pelo menos 10% do limite livre
    folga = [
        i for i in itens
        if i["estado"] == "tranquilo" and i["restante"] > 0 and i["pct"] <= 90
    ]
    folga = sorted(folga, key=lambda i: i["restante"], reverse=True)

    nomes_atencao = _lista_nomes(atencao)
    nomes_folga = _lista_nomes(folga)

    if atencao and folga:
        return _frase(
            "frase.orcamento.atencao_e_folga",
            f"Fique de olho em {_juntar(nomes_atencao)}. "
            f"Ainda cabe gasto em {_juntar(nomes_folga)} — "
            "ou dá para guardar o que sobrar.",
            atencao=nomes_atencao, folga=nomes_folga,
        )

    if atencao:
        # Sem nenhuma categoria com folga, não há "as outras" para citar: a
        # frase diria uma coisa que a tela desmente logo abaixo
        return _frase(
            "frase.orcamento.so_atencao",
            f"Fique de olho em {_juntar(nomes_atencao)}. Nenhuma categoria "
            "está com folga este mês; segurar nos próximos dias reequilibra.",
            atencao=nomes_atencao,
        )

    if folga:
        return _frase(
            "frase.orcamento.tranquilo_com_folga",
            "Todas as categorias estão dentro do que você planejou. Ainda "
            f"cabe gasto em {_juntar(nomes_folga)} — ou dá para guardar o "
            "que sobrar.",
            folga=nomes_folga,
        )

    return _frase("frase.orcamento.tranquilo",
                  "Todas as categorias estão dentro do que você planejou.")


def fixos_variaveis(dados):
    if dados["total"] == 0:
        return _frase(
            "frase.fixos.vazio",
            "Marque os gastos que se repetem todo mês para ver esta divisão.",
        )
    return _frase(
        "frase.fixos.divisao",
        f"{dados['pct_fixos']}% dos seus gastos já estavam comprometidos "
        f"({moeda(dados['fixos'])} em contas que se repetem). "
        f"Os outros {dados['pct_variaveis']}% são onde você tem escolha.",
        pct_fixos=dados["pct_fixos"], pct_variaveis=dados["pct_variaveis"],
        fixos=dados["fixos"],
    )


def investimento(dados):
    """Frase do gráfico "Guardado ao longo do tempo"."""
    if not dados or not dados["itens"]:
        return None
    bateram = sum(1 for i in dados["itens"] if i["bateu"])
    total = len(dados["itens"])
    if bateram == total:
        return _frase(
            "frase.investimento.todos",
            "Você bateu sua meta em todos os períodos. Isso é constância.",
        )
    if bateram == 0:
        return _frase(
            "frase.investimento.nenhum",
            "Ainda não bateu a meta em nenhum período. Que tal começar com "
            "um valor menor?",
        )
    return _frase(
        "frase.investimento.parcial",
        f"Você bateu sua meta em {bateram} de {total} períodos.",
        bateram=bateram, total=total,
    )


def comparacao(resumo):
    """Cartão "gastei mais ou menos que mês passado?".

    Devolve também o sentido, que a tela usa para escolher a seta e a cor:
    gastar mais nunca aparece em vermelho, só em mel.
    """
    if not resumo["tem_comparacao"]:
        return None
    diferenca = _d(resumo["diferenca"])
    mes = resumo["rotulo_mes_anterior"]
    if diferenca == 0:
        frase = _frase("frase.comparacao.igual",
                       f"Você gastou o mesmo que em {mes}.", mes=mes)
        frase["sentido"] = "igual"
        return frase
    if diferenca < 0:
        frase = _frase(
            "frase.comparacao.menos",
            f"Você gastou {moeda(abs(diferenca))} a menos que em {mes}.",
            mes=mes, valor=float(abs(diferenca)),
        )
        frase["sentido"] = "menos"
        return frase
    frase = _frase(
        "frase.comparacao.mais",
        f"Você gastou {moeda(diferenca)} a mais que em {mes}.",
        mes=mes, valor=float(diferenca),
    )
    frase["sentido"] = "mais"
    return frase


def disponivel(resumo):
    """Frase de apoio embaixo do número grande do painel."""
    if resumo["sem_dados"]:
        return _frase(
            "frase.disponivel.sem_dados",
            "Ainda não tem nada por aqui. Que tal registrar seu primeiro gasto?",
        )
    if _d(resumo["disponivel"]) < 0:
        if resumo["tem_orcamento"]:
            return _frase(
                "frase.disponivel.passou_planejado",
                "Você passou do que tinha planejado para este mês. "
                "Dá para compensar nos próximos dias.",
            )
        return _frase(
            "frase.disponivel.passou_ganhos",
            "Saiu mais do que entrou este mês. Dê uma olhada nos gastos maiores.",
        )
    if resumo["tem_orcamento"]:
        return _frase(
            "frase.disponivel.do_planejamento",
            f"É o que sobra do seu planejamento de {moeda(resumo['planejado'])}.",
            planejado=resumo["planejado"],
        )
    return _frase(
        "frase.disponivel.entrou_saiu",
        f"Entraram {moeda(resumo['ganhos'])} e saíram {moeda(resumo['gastos'])}.",
        ganhos=resumo["ganhos"], gastos=resumo["gastos"],
    )


def taxa_poupanca(resumo):
    taxa = resumo["taxa_poupanca"]
    if resumo["ganhos"] <= 0:
        return None
    if taxa >= 20:
        return _frase(
            "frase.poupanca.acima",
            f"Você guardou {taxa}% do que entrou. Está acima dos 20% sugeridos.",
            taxa=taxa,
        )
    if taxa > 0:
        return _frase("frase.poupanca.parcial",
                      f"Você guardou {taxa}% do que entrou este mês.", taxa=taxa)
    return _frase(
        "frase.poupanca.zero",
        "Este mês não sobrou nada. Acontece; o próximo pode ser diferente.",
    )
