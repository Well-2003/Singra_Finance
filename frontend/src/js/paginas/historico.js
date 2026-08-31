/* Singra - histórico
   Lista de cartões agrupada por dia, com os filtros do topo. Tocar em um
   cartão reabre o painel de adicionar, em modo de correção. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");

    // O filtro vive na querystring: atualizar a página mantém a busca
    function filtrosDaURL() {
        var busca = new URLSearchParams(global.location.search);
        return {
            periodo: busca.get("periodo") || "este-mes",
            inicio: busca.get("inicio") || "",
            fim: busca.get("fim") || "",
            tipo: busca.get("tipo") || "",
            categoria_id: busca.get("categoria_id") || "",
            forma_pagamento: busca.get("forma_pagamento") || "",
        };
    }

    function endereco(filtros) {
        var partes = Object.keys(filtros)
            .filter(function (c) { return filtros[c]; })
            .map(function (c) { return c + "=" + encodeURIComponent(filtros[c]); });
        return global.location.pathname + (partes.length ? "?" + partes.join("&") : "");
    }

    /* Traduz o atalho de período em datas. "Mês passado" precisa do mês
       financeiro do usuário, então quem calcula é o backend: aqui só
       mandamos ano e mês, e ele devolve o intervalo certo. */
    function parametros(filtros) {
        var p = {
            tipo: filtros.tipo,
            categoria_id: filtros.categoria_id,
            forma_pagamento: filtros.forma_pagamento,
        };
        if (filtros.periodo === "personalizado") {
            p.inicio = filtros.inicio;
            p.fim = filtros.fim;
        } else if (filtros.periodo === "mes-passado") {
            var hoje = new Date();
            var anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
            p.ano = anterior.getFullYear();
            p.mes = anterior.getMonth() + 1;
        }
        return p;
    }

    function cartaoTransacao(t) {
        // A forma de pagamento e o cartão só valem para gasto: num ganho o
        // dinheiro entrou, não foi pago
        var apoio = [F.escapar(t.categoria_nome)];
        if (t.tipo === "gasto") {
            apoio.push(F.formaPagamento(t.forma_pagamento));
            if (t.cartao_nome) apoio.push(F.escapar(t.cartao_nome));
        }
        if (t.parcela_total) apoio.push("parcela " + t.parcela_atual + "/" + t.parcela_total);
        if (t.fixa) apoio.push("todo mês");

        return '<button type="button" class="cartao-toque cartao-registro" data-editar=\'' +
            F.escapar(JSON.stringify(t)) + "'>" +
            '<span class="bolha" style="--cor-cat: ' + t.categoria_cor + '">' +
                icone(t.categoria_icone) + "</span>" +
            /* Título, valor e apoio são filhos diretos: assim o nome e o
               valor dividem a primeira linha e a descrição ocupa a largura
               toda embaixo, em vez de escorrer pelo lado do valor. */
            '<span class="item-titulo">' +
                F.escapar(t.descricao || t.categoria_nome) + "</span>" +
            '<span class="' + (t.tipo === "gasto" ? "valor-gasto" : "valor-ganho") + '">' +
                (t.tipo === "gasto" ? "- " : "+ ") + F.moeda(t.valor) + "</span>" +
            '<span class="item-apoio">' + apoio.join(" &middot; ") + "</span></button>";
    }

    // Agrupa por dia para o título dizer "Hoje" e "Ontem"
    function porDia(itens) {
        var grupos = [];
        var atual = null;
        itens.forEach(function (t) {
            if (!atual || atual.data !== t.data) {
                atual = { data: t.data, rotulo: F.diaAmigavel(t.data), itens: [] };
                grupos.push(atual);
            }
            atual.itens.push(t);
        });
        return grupos;
    }

    function chips(filtros, categorias) {
        function chip(rotulo, valores, ativo) {
            var novo = Object.assign({}, filtros, valores);
            return '<a class="chip' + (ativo ? " ativo" : "") + '" href="' +
                   endereco(novo) + '">' + rotulo + "</a>";
        }

        var opcoes = function (lista, selecionado, vazio) {
            return '<option value="">' + vazio + "</option>" + lista.map(function (o) {
                return '<option value="' + o.valor + '"' +
                       (String(selecionado) === String(o.valor) ? " selected" : "") +
                       ">" + F.escapar(o.rotulo) + "</option>";
            }).join("");
        };

        return '<div class="chips" style="margin-bottom:var(--e2)">' +
            chip("Este mês", { periodo: "este-mes", inicio: "", fim: "" },
                 filtros.periodo === "este-mes") +
            chip("Mês passado", { periodo: "mes-passado", inicio: "", fim: "" },
                 filtros.periodo === "mes-passado") +
            '<button type="button" class="chip' +
                (filtros.periodo === "personalizado" ? " ativo" : "") + '" data-abrir-filtros>' +
                icone("calendario") + " Escolher período</button>" +
            '<button type="button" class="chip" data-abrir-filtros>' +
                icone("filtro") + " Filtrar</button>" +
        "</div>" +

        '<form class="cartao" data-filtros hidden style="margin-bottom:var(--e2)">' +
            '<input type="hidden" name="periodo" value="personalizado">' +
            '<div class="filtros-avancados">' +
                '<div class="campo" style="margin:0"><label for="f-inicio">De</label>' +
                    '<input type="date" id="f-inicio" name="inicio" value="' +
                        filtros.inicio + '"></div>' +
                '<div class="campo" style="margin:0"><label for="f-fim">Até</label>' +
                    '<input type="date" id="f-fim" name="fim" value="' + filtros.fim + '"></div>' +
                '<div class="campo" style="margin:0"><label for="f-tipo">Tipo</label>' +
                    '<select id="f-tipo" name="tipo">' + opcoes(
                        [{ valor: "gasto", rotulo: "Só gastos" },
                         { valor: "ganho", rotulo: "Só ganhos" }],
                        filtros.tipo, "Gastos e ganhos") + "</select></div>" +
                '<div class="campo" style="margin:0"><label for="f-categoria">Categoria</label>' +
                    '<select id="f-categoria" name="categoria_id">' + opcoes(
                        categorias.map(function (c) {
                            return { valor: c.id, rotulo: c.nome };
                        }), filtros.categoria_id, "Todas") + "</select></div>" +
                '<div class="campo" style="margin:0">' +
                    '<label for="f-forma">Forma de pagamento</label>' +
                    '<select id="f-forma" name="forma_pagamento">' + opcoes(
                        Object.keys(F.FORMAS).map(function (k) {
                            return { valor: k, rotulo: F.FORMAS[k] };
                        }), filtros.forma_pagamento, "Todas") + "</select></div>" +
                '<div><button type="submit" class="botao botao-acao botao-largo">' +
                    "Ver resultados</button></div>" +
            "</div>" +
            '<p style="margin-top:var(--e2)"><a href="' + global.location.pathname +
                '">Limpar filtros</a></p>' +
        "</form>";
    }

    function desenhar(dados, filtros, categorias) {
        var rotuloPeriodo = filtros.periodo === "mes-passado" ? "Mês passado"
            : filtros.periodo === "personalizado" ? "Período escolhido" : "Este mês";

        /* O resumo abre a lista, e não fecha.

           Ele já foi uma barra grudada no rodapé, que acompanhava a
           rolagem. O problema é que ela nunca saía da frente: junto com a
           barra de navegação, que também é fixa, sobravam duas faixas
           permanentes por cima dos cartões, e sempre havia um registro
           escondido atrás de uma delas. No topo o resumo é lido uma vez e
           sai do caminho, como nas outras telas do site. */
        var resumo = dados.itens.length
            ? '<section class="cartao cartao-destaque resumo-periodo">' +
                  "<span><strong>" + F.escapar(rotuloPeriodo) + "</strong></span>" +
                  '<span>Saiu <strong class="valor-gasto">' +
                      F.moeda(dados.total_gastos) + "</strong></span>" +
                  '<span>Entrou <strong class="valor-ganho">' +
                      F.moeda(dados.total_ganhos) + "</strong></span>" +
              "</section>"
            : "";

        var lista = dados.itens.length
            ? porDia(dados.itens).map(function (dia) {
                  return '<h2 class="dia-titulo">' + dia.rotulo + "</h2>" +
                         '<div class="empilhado">' +
                         dia.itens.map(cartaoTransacao).join("") + "</div>";
              }).join("")
            : '<div class="cartao"><div class="vazio">' +
              '<svg class="vazio-figura" aria-hidden="true">' +
                  '<use href="#i-vazio-busca"></use></svg>' +
              "<h3>Nada registrado nesse período</h3>" +
              "<p>Experimente escolher outro período ou registre um gasto agora.</p>" +
              '<button type="button" class="botao botao-acao" data-abrir-adicionar>' +
              "+ Adicionar gasto</button></div></div>";

        alvo.className = "";
        alvo.innerHTML = chips(filtros, categorias) + resumo + lista;

        /* Cada pedaço em seu próprio elemento: o rótulo e a palavra
           "registros" são traduzíveis, o número no meio não é. Grudados num
           texto só, a tradução não teria como separá-los. */
        document.querySelector("[data-legenda-periodo]").innerHTML =
            "<span>" + F.escapar(rotuloPeriodo) + "</span> &middot; " +
            dados.quantidade + " <span>" +
            (dados.quantidade === 1 ? "registro" : "registros") + "</span>";

        // Já abre os filtros se a pessoa chegou com um período escolhido
        if (filtros.periodo === "personalizado") {
            document.querySelector("[data-filtros]").hidden = false;
        }
    }

    async function carregar() {
        var filtros = filtrosDaURL();
        var respostas = await Promise.all([
            global.ApiTransacoes.listar(parametros(filtros)),
            global.ApiTransacoes.categorias(),
        ]);
        if (!respostas[0].ok) return;
        desenhar(respostas[0], filtros, respostas[1].ok ? respostas[1].itens : []);
    }

    document.addEventListener("click", function (evento) {
        if (evento.target.closest("[data-abrir-filtros]")) {
            var form = document.querySelector("[data-filtros]");
            form.hidden = !form.hidden;
            if (!form.hidden) form.querySelector("input").focus();
        }
    });

    document.addEventListener("submit", function (evento) {
        var form = evento.target.closest("[data-filtros]");
        if (!form) return;
        evento.preventDefault();
        var dados = new FormData(form);
        var filtros = {};
        dados.forEach(function (valor, chave) { if (valor) filtros[chave] = valor; });
        global.location.href = endereco(filtros);
    });

    global.PainelAdicionar.aoSalvar(carregar);
    carregar();
})(window);
