/* Singra - orçamento
   Um limite por categoria, editado direto na lista. Não há botão de salvar:
   sair do campo já grava, e o campo pisca em verde confirmando. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");
    var cabecalho = document.querySelector("[data-navegador-mes]");

    var mesAberto = {};   // preenchido com o que o backend devolver

    function linha(item, temLimite) {
        var pct = temLimite ? item.pct : 0;
        var classe = item.estado === "estourou" ? " barra-estourou"
                   : item.estado === "atencao" ? " barra-atencao" : "";

        var apoio = temLimite
            ? F.moeda(item.gasto) + " <span>de</span> " + F.moeda(item.planejado) +
              (item.restante < 0
                  ? " &middot; passou " + F.moeda(Math.abs(item.restante))
                  : "")
            : "Coloque um valor para entrar no planejamento";

        return '<div class="linha-orcamento">' +
            '<span class="bolha" style="--cor-cat: ' + item.cor + '">' +
                icone(item.icone) + "</span>" +
            '<span class="crescer"><strong>' + F.escapar(item.nome) + "</strong><br>" +
                '<span class="item-apoio">' +
                (item.essencial ? "essencial" : "escolha sua") + "</span></span>" +
            '<label class="so-leitor" for="limite-' + item.categoria_id + '">' +
                "Quanto quero gastar em " + F.escapar(item.nome) + "</label>" +
            '<input class="entrada-limite" id="limite-' + item.categoria_id + '" ' +
                'inputmode="decimal" data-limite="' + item.categoria_id + '" ' +
                'value="' + (temLimite ? F.numero(item.planejado) : "") + '" ' +
                'placeholder="0,00">' +
            '<div class="barra' + classe + '" role="img" aria-label="' + pct + ' por cento">' +
                '<span class="barra-trilha" style="width:' + Math.min(pct, 100) + '%"></span></div>' +
            '<span class="apoio">' + apoio + "</span></div>";
    }

    function desenhar(dados, semLimite, renda) {
        mesAberto = { ano: dados.mes.ano, mes: dados.mes.mes };
        global.Mes.desenhar(cabecalho, dados.mes);

        var o = dados.orcamento;
        var temPlanejamento = o.itens.length > 0;

        var acoes = '<div class="linha" style="flex-wrap:wrap;margin-bottom:var(--e3)">' +
            (temPlanejamento ? "" :
                '<button type="button" class="botao ' +
                (renda ? "botao-acao" : "botao-suave") + '" data-sugerir' +
                (renda ? "" : " disabled") + ">Sugerir planejamento (50/30/20)</button>") +
            '<button type="button" class="botao botao-suave" data-copiar>' +
                "Copiar do mês anterior</button></div>";

        var avisoRenda = (!renda && !temPlanejamento)
            ? '<div class="aviso aviso-atencao" style="margin-bottom:var(--e2)">' +
              icone("alerta") + "<span>Para sugerir um planejamento, precisamos saber " +
              'quanto entra por mês. <a href="perfil.html">Informe no seu perfil</a> ou ' +
              "preencha os limites na mão aqui embaixo.</span></div>"
            : "";

        var comLimite = temPlanejamento
            ? '<section class="cartao"><h2>Categorias com limite</h2>' +
              o.itens.map(function (i) { return linha(i, true); }).join("") +
              '<p class="legenda" style="margin-top:var(--e2)">Toque no valor para mudar. ' +
              "A gente salva sozinho. Zerar um valor tira a categoria do planejamento.</p>" +
              "</section>"
            : "";

        var disponiveis = semLimite.length
            ? '<section class="cartao" style="margin-top:var(--e2)"><h2>' +
              (temPlanejamento ? "Incluir mais categorias" : "Escolha por onde começar") +
              "</h2>" +
              '<p class="legenda">Coloque um valor para a categoria entrar no planejamento.</p>' +
              semLimite.map(function (c) {
                  return linha({
                      categoria_id: c.id, nome: c.nome, icone: c.icone, cor: c.cor,
                      essencial: c.essencial, planejado: 0, gasto: 0, restante: 0,
                      pct: 0, estado: "tranquilo",
                  }, false);
              }).join("") + "</section>"
            : "";

        alvo.className = "";
        alvo.innerHTML =
            '<section class="cartao cartao-destaque" style="margin-bottom:var(--e2)">' +
                '<div class="linha-entre"><div>' +
                    '<span class="legenda"><span>Planejado para</span> ' +
                        F.escapar(F.mesExtenso(dados.mes.ano, dados.mes.mes)) +
                        "</span>" +
                    '<strong class="valor-grande" data-total-planejado>' +
                        F.moedaCurta(o.total_planejado) + "</strong></div>" +
                '<div class="direita"><span class="legenda">Já gasto</span><br>' +
                    "<strong data-total-gasto>" + F.moeda(o.total_gasto) +
                    "</strong></div></div>" +
                '<p class="legenda" style="margin-top:var(--e1)">' +
                    F.escapar(global.Idioma.frase(o.frase)) + "</p></section>" +
            acoes + avisoRenda + comLimite + disponiveis;
    }

    async function carregar() {
        var mes = global.Mes.daURL();
        var respostas = await Promise.all([
            global.Api.pedirComEspera("GET", "/api/resumo" +
                global.Api.query({ ano: mes.ano, mes: mes.mes })),
            global.ApiGraficos.orcamento(mes.ano, mes.mes),
            global.ApiTransacoes.categorias(),
        ]);
        if (!respostas[0].ok || !respostas[1].ok) return;

        var orcamento = respostas[1];
        var comLimite = orcamento.itens.map(function (i) { return i.categoria_id; });
        var semLimite = (respostas[2].ok ? respostas[2].itens : []).filter(function (c) {
            return c.tipo === "gasto" && comLimite.indexOf(c.id) === -1;
        });

        desenhar(
            { mes: respostas[0].mes, orcamento: orcamento },
            semLimite,
            (global.Sessao.usuario() || {}).renda_estimada
        );
    }

    // Salvar ao sair do campo

    async function salvarLimite(campo) {
        var valor = F.paraNumero(campo.value);
        if (valor === null || valor < 0) {
            campo.value = "";
            return global.Avisos.problema("Esse valor não deu para entender. Tente só números.");
        }

        var r = await global.ApiPlanejamento.salvarLimite(
            Number(campo.dataset.limite), valor, mesAberto.ano, mesAberto.mes);
        if (!r.ok) return global.Avisos.problema(r.mensagem);

        campo.value = valor > 0
            ? valor.toLocaleString("pt-BR", { minimumFractionDigits: 2,
                                              maximumFractionDigits: 2 })
            : "";
        campo.classList.add("salvo");
        setTimeout(function () { campo.classList.remove("salvo"); }, 1200);

        // Mudar um limite muda os totais e a cor das barras
        document.querySelector("[data-total-planejado]").textContent =
            F.moedaCurta(r.orcamento.total_planejado);
        document.querySelector("[data-total-gasto]").textContent =
            F.moeda(r.orcamento.total_gasto);
        r.orcamento.itens.forEach(function (item) {
            var alvoCampo = document.querySelector('[data-limite="' + item.categoria_id + '"]');
            var barra = alvoCampo && alvoCampo.closest(".linha-orcamento").querySelector(".barra");
            if (!barra) return;
            barra.classList.toggle("barra-atencao", item.estado === "atencao");
            barra.classList.toggle("barra-estourou", item.estado === "estourou");
            barra.querySelector(".barra-trilha").style.width = Math.min(item.pct, 100) + "%";
        });
    }

    /* O blur não sobe na árvore, então o ouvinte é registrado na fase de
       captura para alcançar qualquer campo da lista. */
    document.addEventListener("blur", function (evento) {
        var campo = evento.target.closest && evento.target.closest("[data-limite]");
        if (campo) salvarLimite(campo);
    }, true);

    // Enter salva sem sair do campo, tirando o foco e caindo no blur acima
    document.addEventListener("keydown", function (evento) {
        var campo = evento.target.closest && evento.target.closest("[data-limite]");
        if (campo && evento.key === "Enter") {
            evento.preventDefault();
            campo.blur();
        }
    });

    document.addEventListener("click", async function (evento) {
        var sugerir = evento.target.closest("[data-sugerir]");
        if (sugerir) {
            global.Carregando.ocupado(sugerir, true, "Montando…");
            var r = await global.ApiPlanejamento.sugerirOrcamento(mesAberto.ano, mesAberto.mes);
            global.Carregando.ocupado(sugerir, false);
            global.Avisos.daResposta(r);
            if (r.ok) carregar();
            return;
        }

        var copiar = evento.target.closest("[data-copiar]");
        if (copiar) {
            global.Carregando.ocupado(copiar, true, "Copiando…");
            var c = await global.ApiPlanejamento.copiarOrcamento(mesAberto.ano, mesAberto.mes);
            global.Carregando.ocupado(copiar, false);
            global.Avisos.daResposta(c);
            if (c.ok && c.copiadas) carregar();
        }
    });

    global.PainelAdicionar.aoSalvar(carregar);
    // As frases dos gráficos só existem depois de montadas: trocar de
    // idioma pede um novo desenho
    document.addEventListener("singra:idioma", carregar);

    carregar();
})(window);
