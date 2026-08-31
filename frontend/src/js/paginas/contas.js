/* Singra - contas a pagar
   Agrupadas por situação, da mais urgente para a menos. Marcar como paga
   cria o gasto no histórico e, se a conta se repete, já deixa a do mês
   seguinte cadastrada.

   A página anda no calendário, e avançar o mês mostra três coisas
   diferentes.

   As contas daquele mês existem no banco e podem ser pagas. As previstas
   são as que se repetem todo mês, projetadas para um mês que ainda não
   chegou, e por isso não têm botão. O já comprometido são parcelas e
   gastos fixos lançados naquele mês, que já pesam no "quanto posso gastar"
   dele e portanto aparecem só para leitura. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");
    var cabecalho = document.querySelector("[data-navegador-mes]");

    // A ordem desta lista é a ordem em que os grupos aparecem na tela
    var GRUPOS = [
        ["atrasada", "Passou do vencimento"],
        ["hoje", "Vence hoje"],
        ["proxima", "Próximos 7 dias"],
        ["futura", "Mais para frente"],
        ["paga", "Já pagas"],
    ];

    function cartaoConta(c) {
        var quando = c.estado === "paga" ? "Paga em " + F.dataBR(c.paga_em)
            : c.estado === "hoje" ? "Vence hoje"
            : c.estado === "atrasada" ? "Venceu em " + F.dataBR(c.vencimento)
            : "Vence em " + F.dataBR(c.vencimento);

        /* "Já paguei", e não "Marcar como paga": o pagamento acontece no
           banco, fora daqui, e o que a pessoa faz nesta tela é confirmar
           que já fez. O rótulo longo carrega o nome da conta, porque numa
           lista de dez boletos dez botões iguais não dizem qual é qual. */
        var acao = c.estado === "paga"
            ? '<button type="button" class="botao botao-texto" data-desfazer="' + c.id +
              '" data-nome="' + F.escapar(c.descricao) + '" ' +
              'aria-label="Desfazer o pagamento de ' + F.escapar(c.descricao) + '">' +
              "Desfazer</button>"
            : '<button type="button" class="botao botao-acao" data-pagar="' + c.id + '" ' +
              'aria-label="Confirmar que já paguei ' + F.escapar(c.descricao) + '">' +
              icone("ok") + " Já paguei</button>";

        /* Cada pedaço é filho direto do cartão, e não um bloco só: assim a
           grade pode pôr o nome e o valor lado a lado e deixar a linha de
           apoio ocupar a largura inteira embaixo, em vez de espremê-la ao
           lado do valor. */
        return '<article class="cartao cartao-compacto cartao-conta">' +
            '<span class="bolha" style="--cor-cat: ' + c.categoria_cor + '">' +
                icone(c.categoria_icone) + "</span>" +
            '<strong class="conta-nome">' + F.escapar(c.descricao) + "</strong>" +
            '<strong class="conta-valor">' + F.moeda(c.valor) + "</strong>" +
            '<span class="item-apoio conta-apoio">' + quando +
                (c.recorrente ? " &middot; se repete todo mês" : "") + "</span>" +
            '<div class="acoes">' + acao +
                '<button type="button" class="botao botao-texto" data-apagar-conta="' + c.id +
                    '" data-nome="' + F.escapar(c.descricao) + '" ' +
                    'aria-label="Apagar ' + F.escapar(c.descricao) + '">' +
                    icone("lixeira") + "</button></div></article>";
    }

    /* Uma linha de leitura: sem botão de pagar, porque não há o que pagar
       ainda. Serve para a pessoa saber com o que contar. */
    function linhaPrevista(c, quando) {
        return '<article class="cartao cartao-compacto cartao-conta">' +
            '<span class="bolha" style="--cor-cat: ' + c.categoria_cor + '">' +
                icone(c.categoria_icone) + "</span>" +
            '<strong class="conta-nome">' + F.escapar(c.descricao) + "</strong>" +
            '<strong class="conta-valor">' + F.moeda(c.valor) + "</strong>" +
            '<span class="item-apoio conta-apoio">' + quando + "</span></article>";
    }

    function blocoPrevistas(dados) {
        if (!dados.previstas.length) return "";
        return '<section class="grupo-contas">' +
            '<h2 class="grupo-titulo"><span class="bolinha bolinha-futura"></span> ' +
                "Previstas para este mês</h2>" +
            '<p class="legenda">Contas que se repetem todo mês. Elas são criadas ' +
                "de verdade quando a do mês anterior é paga.</p>" +
            '<div class="empilhado" style="margin-top:var(--e2)">' +
                dados.previstas.map(function (c) {
                    return linhaPrevista(c, "Deve vencer em " + F.dataBR(c.vencimento));
                }).join("") + "</div></section>";
    }

    function blocoComprometido(dados) {
        if (!dados.comprometido.length) return "";
        return '<section class="grupo-contas">' +
            '<h2 class="grupo-titulo"><span class="bolinha bolinha-paga"></span> ' +
                "Já comprometido</h2>" +
            '<p class="legenda">Parcelas e gastos fixos já lançados neste mês. ' +
                "Não precisam ser marcados como pagos: eles já contam no seu " +
                "planejamento do mês.</p>" +
            '<div class="empilhado" style="margin-top:var(--e2)">' +
                dados.comprometido.map(function (t) {
                    return linhaPrevista({
                        descricao: t.descricao || t.categoria_nome,
                        valor: t.valor,
                        categoria_cor: t.categoria_cor,
                        categoria_icone: t.categoria_icone,
                    }, F.dataBR(t.data) +
                       (t.parcela_total
                            ? " &middot; parcela " + t.parcela_atual + "/" + t.parcela_total
                            : " &middot; se repete todo mês"));
                }).join("") + "</div></section>";
    }

    var mesNaTela = {};   // o que o backend respondeu, para comparar depois

    function desenhar(dados, categorias) {
        mesNaTela = { ano: dados.mes.ano, mes: dados.mes.mes };
        global.Mes.desenhar(cabecalho, dados.mes);

        var porGrupo = {};
        dados.itens.forEach(function (c) {
            (porGrupo[c.estado] = porGrupo[c.estado] || []).push(c);
        });

        var temAlgoAdiante = dados.previstas.length > 0 ||
                             dados.comprometido.length > 0;

        var lista = dados.itens.length
            ? GRUPOS.filter(function (g) { return porGrupo[g[0]]; }).map(function (g) {
                  return '<section class="grupo-contas">' +
                      '<h2 class="grupo-titulo"><span class="bolinha bolinha-' + g[0] +
                          '"></span> ' + g[1] + "</h2>" +
                      '<div class="empilhado">' +
                          porGrupo[g[0]].map(cartaoConta).join("") + "</div></section>";
              }).join("") +
              '<p class="legenda" style="margin-top:var(--e3)">Ao confirmar que pagou, ' +
              "a gente registra o gasto no seu histórico automaticamente.</p>"
            : '<div class="cartao"><div class="vazio">' +
              '<svg class="vazio-figura" aria-hidden="true">' +
                  '<use href="#i-vazio-contas"></use></svg>' +
              (temAlgoAdiante
                  ? "<h3>Nenhuma conta cadastrada neste mês</h3>" +
                    "<p>O que já está reservado para ele aparece logo abaixo.</p>"
                  : "<h3>Nenhuma conta cadastrada</h3>" +
                    "<p>Cadastre o aluguel, a luz, a internet. A gente lembra você " +
                    "antes do vencimento.</p>" +
                    '<button type="button" class="botao botao-acao" ' +
                    'data-abrir-painel="painel-conta">' +
                    "Cadastrar minha primeira conta</button>") +
              "</div></div>";

        var reservado = dados.total_previsto + dados.total_comprometido;
        var total = "";

        if (dados.total_aberto > 0) {
            total = '<section class="cartao cartao-destaque" ' +
                'style="margin-bottom:var(--e3)">' +
                '<span class="legenda">Ainda falta pagar</span>' +
                '<strong class="valor-grande">' + F.moedaCurta(dados.total_aberto) +
                "</strong>" +
                (reservado > 0
                    ? '<p class="legenda" style="margin-top:var(--e1)">' +
                      "<span>Mais</span> " + F.moeda(reservado) +
                      " <span>já reservados em parcelas e contas que se repetem</span>" +
                      "</p>"
                    : "") +
                "</section>";
        } else if (reservado > 0) {
            // Num mês que ainda não chegou não há o que pagar. O que
            // existe é o que já está reservado
            total = '<section class="cartao cartao-destaque" ' +
                'style="margin-bottom:var(--e3)">' +
                '<span class="legenda">Já reservado para este mês</span>' +
                '<strong class="valor-grande">' + F.moedaCurta(reservado) +
                "</strong></section>";
        }

        alvo.className = "";
        alvo.innerHTML = total + lista + blocoPrevistas(dados) +
                         blocoComprometido(dados);

        // A lista de categorias do formulário só muda quando o perfil muda
        var seletor = document.getElementById("conta-categoria");
        if (seletor && !seletor.options.length) {
            seletor.innerHTML = categorias.filter(function (c) {
                return c.tipo === "gasto";
            }).map(function (c) {
                // "Contas da casa" já vem escolhida: é onde cai a maioria dos boletos
                return '<option value="' + c.id + '"' +
                       (c.icone === "contas" ? " selected" : "") + ">" +
                       F.escapar(c.nome) + "</option>";
            }).join("");
        }
    }

    function painelNovaConta() {
        var daquiUmaSemana = new Date();
        daquiUmaSemana.setDate(daquiUmaSemana.getDate() + 7);
        var padrao = daquiUmaSemana.toISOString().slice(0, 10);

        return '<div class="fundo-escuro" data-fundo="painel-conta" hidden></div>' +
        '<div class="painel" id="painel-conta" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-conta" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-conta" style="margin:0">Nova conta</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-conta" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            '<form data-form-conta>' +
                '<div class="campo"><label for="conta-descricao">Que conta é essa?</label>' +
                    '<input type="text" id="conta-descricao" maxlength="100" required ' +
                        'placeholder="Conta de luz"></div>' +
                '<div class="campo"><label for="conta-valor">Quanto é?</label>' +
                    '<input type="text" id="conta-valor" inputmode="decimal" required ' +
                        'placeholder="180,00"></div>' +
                '<div class="campo"><label for="conta-vencimento">Quando vence?</label>' +
                    '<input type="date" id="conta-vencimento" required value="' + padrao + '"></div>' +
                '<div class="campo"><label for="conta-categoria">De que categoria?</label>' +
                    '<select id="conta-categoria" required></select></div>' +
                '<label class="interruptor"><span>Se repete todo mês?</span>' +
                    '<input type="checkbox" id="conta-recorrente">' +
                    '<span class="interruptor-trilha"></span></label>' +
                '<button type="submit" class="botao botao-acao botao-largo" ' +
                    'style="margin-top:var(--e2)">Cadastrar conta</button>' +
                '<p class="aviso-campo" data-erro-conta hidden></p>' +
            "</form></div>";
    }

    document.body.insertAdjacentHTML("beforeend", painelNovaConta());

    async function carregar() {
        var mes = global.Mes.daURL();
        var respostas = await Promise.all([
            global.ApiPlanejamento.listarContas(mes.ano, mes.mes),
            global.ApiTransacoes.categorias(),
        ]);
        if (!respostas[0].ok) return;
        desenhar(respostas[0], respostas[1].ok ? respostas[1].itens : []);
    }

    document.addEventListener("submit", async function (evento) {
        var form = evento.target.closest("[data-form-conta]");
        if (!form) return;
        evento.preventDefault();

        var aviso = document.querySelector("[data-erro-conta]");
        aviso.hidden = true;

        var valor = F.paraNumero(document.getElementById("conta-valor").value);
        if (!valor || valor <= 0) {
            aviso.textContent = "Quanto é essa conta?";
            aviso.hidden = false;
            return;
        }

        var botao = form.querySelector("[type=submit]");
        global.Carregando.ocupado(botao, true, "Cadastrando…");
        var vencimento = document.getElementById("conta-vencimento").value;
        var r = await global.ApiPlanejamento.criarConta({
            descricao: document.getElementById("conta-descricao").value.trim(),
            valor: valor,
            vencimento: vencimento,
            categoria_id: Number(document.getElementById("conta-categoria").value),
            recorrente: document.getElementById("conta-recorrente").checked,
        });
        global.Carregando.ocupado(botao, false);

        if (!r.ok) {
            aviso.textContent = r.mensagem;
            aviso.hidden = false;
            return;
        }

        global.Painel.fechar("painel-conta");
        global.Avisos.mostrar(r.mensagem);
        form.reset();

        /* A conta pode vencer em outro mês, e vence com frequência, porque
           a data sugerida é daqui a uma semana, o que no fim do mês já cai
           no mês seguinte. Sem isto ela era salva e sumia da tela, como se
           o cadastro tivesse falhado. */
        var venceEm = F.paraData(vencimento);
        var naTela = global.Mes.daURL();
        var mesmoMes = naTela.ano
            ? (venceEm.getFullYear() === naTela.ano &&
               venceEm.getMonth() + 1 === naTela.mes)
            : (venceEm.getFullYear() === mesNaTela.ano &&
               venceEm.getMonth() + 1 === mesNaTela.mes);

        if (mesmoMes) {
            carregar();
        } else {
            global.location.href = global.Mes.endereco(
                venceEm.getFullYear(), venceEm.getMonth() + 1);
        }
    });

    document.addEventListener("click", async function (evento) {
        var pagar = evento.target.closest("[data-pagar]");
        if (pagar) {
            global.Carregando.ocupado(pagar, true, "Pagando…");
            var r = await global.ApiPlanejamento.pagarConta(Number(pagar.dataset.pagar));
            global.Carregando.ocupado(pagar, false);
            global.Avisos.daResposta(r);
            if (r.ok) carregar();
            return;
        }

        var desfazer = evento.target.closest("[data-desfazer]");
        if (desfazer) {
            // Avisa que o gasto será apagado junto, para não ser surpresa
            global.Painel.confirmar({
                titulo: "Voltar " + desfazer.dataset.nome + " para a pagar?",
                texto: "O gasto que criamos no histórico será apagado junto.",
                confirmar: "Desfazer pagamento",
                aoConfirmar: async function () {
                    var d = await global.ApiPlanejamento.desfazerPagamento(
                        Number(desfazer.dataset.desfazer));
                    global.Avisos.daResposta(d);
                    if (d.ok) carregar();
                },
            });
            return;
        }

        var apagar = evento.target.closest("[data-apagar-conta]");
        if (apagar) {
            global.Painel.confirmar({
                titulo: "Apagar a conta " + apagar.dataset.nome + "?",
                texto: "Ela some do calendário. Gastos já registrados continuam no histórico.",
                confirmar: "Apagar",
                aoConfirmar: async function () {
                    var a = await global.ApiPlanejamento.apagarConta(
                        Number(apagar.dataset.apagarConta));
                    global.Avisos.daResposta(a);
                    if (a.ok) carregar();
                },
            });
        }
    });

    global.PainelAdicionar.aoSalvar(carregar);
    carregar();
})(window);
