/* Singra - página de gráficos
   Sete desenhos, cada um com um título em forma de pergunta e uma frase
   embaixo que responde. Os números chegam prontos do backend; aqui só se
   desenha.

   Dois gráficos aparecem só quando fazem sentido, o de cartões, se houver
   algum cadastrado, e o do guardado, se houver meta de investimento. Sem
   isso, ficariam na tela como blocos zerados.

   Requer o Chart.js, carregado antes deste arquivo. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;

    /* O Chart.js desenha os rótulos dentro do canvas, e a varredura do
       idioma só alcança texto do documento. Aqui a tradução é pedida
       diretamente, palavra por palavra. */
    var T = function (texto) { return global.Idioma.t(texto); };
    var alvo = document.querySelector("[data-conteudo]");
    var cabecalho = document.querySelector("[data-navegador-mes]");

    // As cores vêm das variáveis CSS: trocar a paleta muda os gráficos junto
    var estilo = getComputedStyle(document.documentElement);
    function cor(nome) { return estilo.getPropertyValue(nome).trim(); }

    var desenhados = [];   // para destruir antes de redesenhar

    function janela() {
        var meses = Number(new URLSearchParams(global.location.search).get("meses"));
        return meses === 12 ? 12 : 6;
    }

    function configurarChart() {
        Chart.defaults.font.family = "Nunito, system-ui, sans-serif";
        Chart.defaults.font.size = 14;
        Chart.defaults.color = cor("--cor-texto-suave");
    }

    // Eixos sem grade vertical e com poucas marcas: o gráfico precisa ser
    // lido de relance, não medido
    function eixos() {
        return {
            x: { grid: { display: false }, border: { color: cor("--cor-borda") },
                 ticks: { font: { weight: 700 } } },
            y: { grid: { color: cor("--cor-borda") }, border: { display: false },
                 ticks: { callback: function (v) { return F.moedaCurta(v); },
                          maxTicksLimit: 5 } },
        };
    }

    function dicaMoeda() {
        return { callbacks: { label: function (c) {
            var v = c.parsed.y !== undefined ? c.parsed.y : c.parsed;
            return " " + (c.dataset.label || c.label) + ": " + F.moeda(v);
        } } };
    }

    /* No mês em que saiu mais do que entrou, o saldo é negativo, e dizer
       "Sobrou R$ -408,32" é o contrário do que aconteceu. A palavra muda com
       o sinal, e o número aparece sem ele. */
    function dicaSaldo() {
        return { callbacks: { label: function (c) {
            var v = c.parsed.y;
            return " " + T(v < 0 ? "Faltou" : "Sobrou") + ": " + F.moeda(Math.abs(v));
        } } };
    }

    function caixa(id, altura) {
        return '<div class="grafico-caixa"' +
               (altura ? ' style="height:' + altura + 'px"' : "") +
               '><canvas id="' + id + '"></canvas></div>';
    }

    function frase(f) {
        return f ? '<p class="frase-grafico">' + F.escapar(global.Idioma.frase(f)) + "</p>" : "";
    }

    function secao(titulo, corpo, textoFrase, largura) {
        return '<section class="cartao' + (largura ? " largura-total" : "") + '">' +
               "<h2>" + titulo + "</h2>" + corpo + frase(textoFrase) + "</section>";
    }

    // Desenho

    function desenhar(d) {
        desenhados.forEach(function (c) { c.destroy(); });
        desenhados = [];

        var meses = janela();
        var cartoes = d.cartoes.disponivel ? d.cartoes : null;
        var investimento = d.investimento.disponivel ? d.investimento : null;

        var comparacao = "";
        if (d.resumo.comparacao) {
            var c = d.resumo.comparacao;
            var seta = c.sentido === "menos" ? "&darr;" : c.sentido === "mais" ? "&uarr;" : "&rarr;";
            comparacao = '<section class="comparacao' +
                (c.sentido === "mais" ? " comparacao-mais" : "") +
                '" style="margin-bottom:var(--e2)">' +
                '<span class="comparacao-seta" aria-hidden="true">' + seta + "</span>" +
                "<span>" + F.escapar(global.Idioma.frase(c)) + "</span></section>";
        }

        // Alternador da janela de 6 ou 12 meses
        function chipJanela(n) {
            var busca = new URLSearchParams(global.location.search);
            busca.set("meses", n);
            return '<a class="chip' + (meses === n ? " ativo" : "") + '" href="' +
                   global.location.pathname + "?" + busca.toString() + '">Últimos ' +
                   n + " meses</a>";
        }

        var planejado = d.orcamento.itens.length
            ? d.orcamento.itens.map(function (i) {
                  var classe = i.estado === "estourou" ? " barra-estourou"
                             : i.estado === "atencao" ? " barra-atencao" : "";
                  /* O nome fica sozinho na primeira linha e os valores
                     descem para a segunda. Lado a lado, "Alimentação" e
                     "R$ 863,46 de R$ 700,00" disputavam a mesma largura e
                     os dois saíam picados no celular. */
                  return '<div class="linha-orcamento linha-resumo">' +
                      '<span class="bolha" style="--cor-cat: ' + i.cor + '">' +
                          global.SingraIcones.icone(i.icone) + "</span>" +
                      '<strong class="orcamento-nome">' + F.escapar(i.nome) + "</strong>" +
                      '<span class="orcamento-valores">' +
                          '<strong class="' +
                          (i.estado === "estourou" ? "valor-gasto" : "") + '">' +
                          F.moeda(i.gasto) + "</strong> <span>de</span> " +
                          F.moeda(i.planejado) + "</span>" +
                      '<div class="barra' + classe + '"><span class="barra-trilha" ' +
                          'style="width:' + Math.min(i.pct, 100) + '%"></span></div>' +
                      '<span class="apoio">' +
                          (i.restante >= 0 ? "Ainda cabem " + F.moeda(i.restante)
                                           : "Passou " + F.moeda(Math.abs(i.restante)) +
                                             " do planejado") +
                      "</span></div>";
              }).join("")
            : '<div class="vazio">' +
              '<svg class="vazio-figura" aria-hidden="true">' +
                  '<use href="#i-vazio-planejamento"></use></svg>' +
              "<h3>Você ainda não definiu limites</h3>" +
              "<p>Escolher quanto quer gastar em cada categoria ajuda a não se assustar " +
              'no fim do mês.</p><a class="botao botao-acao" href="orcamento.html">' +
              "Montar meu planejamento</a></div>";

        var legendaCategorias = d.categorias.itens.length
            ? '<ul class="legenda-lista" style="margin-top:var(--e2)">' +
              d.categorias.itens.slice(0, 6).map(function (i) {
                  return '<li><span class="legenda-cor" style="--cor-cat: ' + i.cor +
                      '"></span><span class="crescer">' + F.escapar(i.nome) + "</span>" +
                      "<strong>" + F.moeda(i.valor) + "</strong>" +
                      '<span class="legenda">' + i.pct + "%</span></li>";
              }).join("") + "</ul>"
            : "";

        alvo.className = "";
        alvo.innerHTML = comparacao +
            '<div class="chips" style="margin-bottom:var(--e2)">' +
                chipJanela(6) + chipJanela(12) + "</div>" +
            '<div class="grade-graficos">' +
                secao("Para onde foi meu dinheiro?",
                      d.categorias.itens.length
                          ? caixa("gr-categorias") + legendaCategorias
                          : '<div class="vazio">' +
                            '<svg class="vazio-figura" aria-hidden="true">' +
                                '<use href="#i-vazio-graficos"></use></svg>' +
                            "<h3>Sem gastos neste mês</h3>" +
                            "<p>Registre alguns gastos e este desenho aparece.</p>" +
                            '<button type="button" class="botao botao-acao" ' +
                            'data-abrir-adicionar>+ Adicionar gasto</button></div>',
                      d.categorias.frase) +

                secao("Estou gastando mais do que ganho?", caixa("gr-entrou-saiu"),
                      d.evolucao.frase) +

                secao("Quanto sobrou a cada mês?", caixa("gr-saldo"),
                      d.evolucao.frase_saldo, true) +

                (investimento
                    ? secao("Estou guardando o que combinei?", caixa("gr-investimento"),
                            investimento.frase, true)
                    : "") +

                (cartoes
                    ? secao("Em que cartão eu gastei?", caixa("gr-cartoes"),
                            cartoes.frase)
                    : "") +

                secao("Quanto do meu dinheiro já estava comprometido?",
                      d.fixos.total > 0
                          ? caixa("gr-fixos", 240)
                          : '<p class="legenda">Marque os gastos que se repetem todo mês ' +
                            "para ver esta divisão.</p>",
                      d.fixos.frase) +

                secao("Estou dentro do que combinei comigo?", planejado,
                      d.orcamento.frase, true) +
            "</div>";

        // Os desenhos, depois de os canvas existirem no documento
        configurarChart();

        if (d.categorias.itens.length) {
            desenhados.push(new Chart(document.getElementById("gr-categorias"), {
                type: "doughnut",
                data: {
                    labels: d.categorias.itens.map(function (i) { return i.nome; }),
                    datasets: [{
                        data: d.categorias.itens.map(function (i) { return i.valor; }),
                        // Cada categoria carrega a própria cor desde o banco
                        backgroundColor: d.categorias.itens.map(function (i) { return i.cor; }),
                        borderWidth: 3, borderColor: cor("--cor-superficie"), hoverOffset: 10,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: "62%",
                    plugins: {
                        // A legenda própria do Chart.js sai: a página já
                        // mostra a lista com valor e porcentagem embaixo
                        legend: { display: false },
                        tooltip: { callbacks: { label: function (ctx) {
                            var i = d.categorias.itens[ctx.dataIndex];
                            return " " + i.nome + ": " + F.moeda(i.valor) + " (" + i.pct + "%)";
                        } } },
                    },
                },
            }));
        }

        desenhados.push(new Chart(document.getElementById("gr-entrou-saiu"), {
            type: "bar",
            data: {
                labels: d.evolucao.itens.map(function (i) { return i.rotulo; }),
                datasets: [
                    { label: T("Entrou"), data: d.evolucao.itens.map(function (i) { return i.ganhos; }),
                      backgroundColor: cor("--cor-primaria"), borderRadius: 8, maxBarThickness: 26 },
                    { label: T("Saiu"), data: d.evolucao.itens.map(function (i) { return i.gastos; }),
                      backgroundColor: cor("--cor-gasto"), borderRadius: 8, maxBarThickness: 26 },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false, scales: eixos(),
                plugins: { legend: { position: "bottom",
                                     labels: { boxWidth: 14, usePointStyle: true } },
                           tooltip: dicaMoeda() },
            },
        }));

        desenhados.push(new Chart(document.getElementById("gr-saldo"), {
            type: "line",
            data: {
                labels: d.evolucao.itens.map(function (i) { return i.rotulo; }),
                datasets: [{
                    label: T("Saldo do mês"),
                    data: d.evolucao.itens.map(function (i) { return i.saldo; }),
                    borderColor: cor("--cor-primaria-escura"),
                    backgroundColor: "rgba(156, 175, 136, 0.22)",
                    borderWidth: 3, fill: true,
                    // A curva suave evita os bicos que fazem uma variação
                    // pequena parecer despencada
                    tension: 0.35, pointRadius: 5,
                    pointBackgroundColor: cor("--cor-superficie"), pointBorderWidth: 3,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false, scales: eixos(),
                plugins: { legend: { display: false }, tooltip: dicaSaldo() },
            },
        }));

        if (investimento) {
            desenhados.push(new Chart(document.getElementById("gr-investimento"), {
                type: "line",
                data: {
                    labels: investimento.itens.map(function (i) { return i.rotulo; }),
                    datasets: [
                        { label: T("Guardado"),
                          data: investimento.itens.map(function (i) { return i.guardado; }),
                          borderColor: cor("--cor-primaria-escura"),
                          backgroundColor: "rgba(156, 175, 136, 0.22)",
                          borderWidth: 3, fill: true, tension: 0.3, pointRadius: 5,
                          pointBackgroundColor: cor("--cor-superficie"), pointBorderWidth: 3 },
                        // A meta entra como linha tracejada: é referência,
                        // não um segundo valor a comparar
                        { label: T("Sua meta"),
                          data: investimento.itens.map(function () { return investimento.alvo; }),
                          borderColor: cor("--cor-acao"), borderWidth: 2,
                          borderDash: [6, 5], pointRadius: 0, fill: false },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, scales: eixos(),
                    plugins: { legend: { position: "bottom",
                                         labels: { boxWidth: 14, usePointStyle: true } },
                               tooltip: dicaMoeda() },
                },
            }));
        }

        if (cartoes) {
            desenhados.push(new Chart(document.getElementById("gr-cartoes"), {
                type: "doughnut",
                data: {
                    labels: cartoes.itens.map(function (i) { return i.nome; }),
                    datasets: [{
                        data: cartoes.itens.map(function (i) { return i.valor; }),
                        backgroundColor: cartoes.itens.map(function (i) { return i.cor; }),
                        borderWidth: 3, borderColor: cor("--cor-superficie"), hoverOffset: 10,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: "62%",
                    plugins: {
                        legend: { position: "bottom",
                                  labels: { boxWidth: 14, usePointStyle: true } },
                        tooltip: { callbacks: { label: function (ctx) {
                            var i = cartoes.itens[ctx.dataIndex];
                            return " " + i.nome + ": " + F.moeda(i.valor) + " (" + i.pct + "%)";
                        } } },
                    },
                },
            }));
        }

        if (d.fixos.total > 0) {
            desenhados.push(new Chart(document.getElementById("gr-fixos"), {
                type: "doughnut",
                data: {
                    labels: ["Já comprometido (se repete)", "Onde você tem escolha"],
                    datasets: [{
                        data: [d.fixos.fixos, d.fixos.variaveis],
                        backgroundColor: [cor("--cat-moradia"), cor("--cor-primaria")],
                        borderWidth: 3, borderColor: cor("--cor-superficie"),
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: "62%",
                    plugins: {
                        legend: { position: "bottom",
                                  labels: { boxWidth: 14, usePointStyle: true } },
                        tooltip: { callbacks: { label: function (c) {
                            return " " + c.label + ": " + F.moeda(c.parsed);
                        } } },
                    },
                },
            }));
        }
    }

    async function carregar() {
        var mes = global.Mes.daURL();
        var resumo = await global.Api.pedirComEspera("GET", "/api/resumo" +
            global.Api.query({ ano: mes.ano, mes: mes.mes }));
        if (!resumo.ok) return;

        global.Mes.desenhar(cabecalho, resumo.mes);

        var graficos = await global.ApiGraficos.todos(mes.ano, mes.mes, janela());
        graficos.resumo = resumo;
        desenhar(graficos);
    }

    global.PainelAdicionar.aoSalvar(carregar);
    // As frases dos gráficos só existem depois de montadas: trocar de
    // idioma pede um novo desenho
    document.addEventListener("singra:idioma", carregar);

    carregar();
})(window);
