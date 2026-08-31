/* Singra - o seletor de mês e a rosca desenhada à mão
   Dois pedaços que aparecem em mais de uma tela.

   O seletor guarda o mês na querystring, e não em memória: assim atualizar
   a página ou compartilhar o endereço leva para o mesmo mês.

   A rosca é SVG puro. O painel Início precisa de um gráfico pequeno, e
   carregar o Chart.js só por causa dele custaria 205 KB numa tela que a
   pessoa abre todo dia. */

window.Mes = (function (global) {
    "use strict";

    // Seletor de mês

    /* Lê o mês do endereço. Sem nada na URL, devolve vazio e o backend
       assume o mês corrente do usuário, que pode não ser o do calendário,
       para quem recebe no dia 5. */
    function daURL() {
        var busca = new URLSearchParams(global.location.search);
        var ano = Number(busca.get("ano"));
        var mes = Number(busca.get("mes"));
        if (!ano || !mes || mes < 1 || mes > 12) return {};
        return { ano: ano, mes: mes };
    }

    function endereco(ano, mes) {
        return global.location.pathname + "?ano=" + ano + "&mes=" + mes;
    }

    /* Desenha a barra do mês: seta para trás, nome do mês, seta para
       frente. O contexto vem do backend já com o mês anterior e o seguinte
       calculados, inclusive na virada de ano.

       O nome do mês, porém, é montado aqui: o backend fala português, e
       quem escolheu inglês ou espanhol não deveria ver "Agosto de 2026" no
       meio de uma tela traduzida. */
    function nomeDoMes(parte) {
        return global.Formato.mesExtenso(parte.ano, parte.mes);
    }

    /* Qual é o mês financeiro de hoje, pela mesma régua do backend: quem
       diz que o mês começa no dia 5 ainda está em julho no dia 3 de agosto.
       Serve para não oferecer meses no futuro, que estariam vazios. */
    function mesDeHoje() {
        var usuario = (global.Sessao && global.Sessao.usuario()) || {};
        var corte = Math.min(Math.max(Number(usuario.dia_inicio_mes) || 1, 1), 28);
        var hoje = new Date();
        if (hoje.getDate() >= corte) {
            return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
        }
        var mes = hoje.getMonth();   // getMonth() é 0-based: já é o anterior
        return mes === 0
            ? { ano: hoje.getFullYear() - 1, mes: 12 }
            : { ano: hoje.getFullYear(), mes: mes };
    }

    function depoisDeHoje(ano, mes) {
        var limite = mesDeHoje();
        return ano > limite.ano || (ano === limite.ano && mes > limite.mes);
    }

    var mesNaTela = null;   // o que o backend respondeu, para marcar na grade

    function desenhar(alvo, contexto) {
        if (!alvo || !contexto) return;
        var icone = global.SingraIcones.icone;
        mesNaTela = { ano: contexto.ano, mes: contexto.mes };

        alvo.innerHTML =
            '<a href="' + endereco(contexto.anterior.ano, contexto.anterior.mes) + '" ' +
                'aria-label="Ver ' + nomeDoMes(contexto.anterior) + '">' +
                icone("voltar") + "</a>" +
            /* O nome do mês abre a escolha direta. Voltar a dezembro do ano
               passado eram doze cliques na seta; agora são dois. */
            '<button type="button" class="mes-atual" data-abrir-meses ' +
                'aria-haspopup="dialog" aria-current="true">' +
                global.Formato.escapar(nomeDoMes(contexto)) + "</button>" +
            '<a href="' + endereco(contexto.proximo.ano, contexto.proximo.mes) + '" ' +
                // Não há gasto futuro para consultar: a seta fica apagada
                'class="' + (contexto.e_mes_atual ? "desativado" : "") + '" ' +
                'aria-label="Ver ' + nomeDoMes(contexto.proximo) + '">' +
                icone("avancar") + "</a>";
    }

    /* O PAINEL DE ESCOLHA DO MÊS

       Doze botões e um ano que anda para trás e para frente. É montado na
       primeira vez que alguém abre, e não junto com a página: a maioria das
       visitas nunca sai do mês corrente. */

    var ID_MESES = "painel-meses";
    var anoAberto = null;

    function garantirPainel() {
        if (document.getElementById(ID_MESES)) return;

        var fundo = document.createElement("div");
        fundo.className = "fundo-escuro";
        fundo.setAttribute("data-fundo", ID_MESES);
        fundo.hidden = true;

        var painel = document.createElement("div");
        painel.className = "painel";
        painel.id = ID_MESES;
        painel.setAttribute("role", "dialog");
        painel.setAttribute("aria-modal", "true");
        painel.setAttribute("aria-labelledby", "titulo-meses");
        painel.hidden = true;
        painel.innerHTML =
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-meses" style="margin:0">Escolher mês</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="' + ID_MESES + '" aria-label="Fechar">' +
                    global.SingraIcones.icone("fechar") + "</button></div>" +
            '<div class="seletor-ano">' +
                '<button type="button" class="botao botao-texto" data-ano="-1" ' +
                    'aria-label="Ano anterior">' +
                    global.SingraIcones.icone("voltar") + "</button>" +
                '<strong data-rotulo-ano aria-live="polite"></strong>' +
                '<button type="button" class="botao botao-texto" data-ano="1" ' +
                    'aria-label="Próximo ano">' +
                    global.SingraIcones.icone("avancar") + "</button>" +
            "</div>" +
            '<div class="grade-meses" data-grade-meses></div>' +
            '<button type="button" class="botao botao-suave botao-largo" ' +
                'style="margin-top:var(--e2)" data-mes-hoje>Ir para o mês atual</button>';

        document.body.appendChild(fundo);
        document.body.appendChild(painel);
    }

    function desenharGrade() {
        var grade = document.querySelector("[data-grade-meses]");
        /* Sem query string a URL não diz que mês é: quem sabe é a resposta
           que o backend acabou de dar, guardada no desenho do seletor. */
        var atual = mesNaTela || daURL();
        var partes = [];

        for (var mes = 1; mes <= 12; mes += 1) {
            var futuro = depoisDeHoje(anoAberto, mes);
            var marcado = atual.ano === anoAberto && atual.mes === mes;
            partes.push(
                '<a class="mes-opcao' + (marcado ? " ativo" : "") + '" href="' +
                endereco(anoAberto, mes) + '"' +
                // Mês que ainda não chegou não tem o que mostrar
                (futuro ? ' aria-disabled="true" tabindex="-1"' : "") + ">" +
                global.Formato.mesExtenso(anoAberto, mes).split(" ")[0] + "</a>");
        }

        grade.innerHTML = partes.join("");
        document.querySelector("[data-rotulo-ano]").textContent = anoAberto;
    }

    function abrirEscolha() {
        garantirPainel();
        var atual = daURL();
        anoAberto = atual.ano || (mesNaTela && mesNaTela.ano) || mesDeHoje().ano;
        desenharGrade();
        global.Painel.abrir(ID_MESES);
    }

    document.addEventListener("click", function (evento) {
        if (evento.target.closest("[data-abrir-meses]")) {
            evento.preventDefault();
            return abrirEscolha();
        }

        var ano = evento.target.closest("[data-ano]");
        if (ano) {
            anoAberto += Number(ano.dataset.ano);
            desenharGrade();
            return undefined;
        }

        if (evento.target.closest("[data-mes-hoje]")) {
            global.location.href = global.location.pathname;
            return undefined;
        }

        // Um mês futuro fica na lista, mas apagado e sem levar a lugar nenhum
        var opcao = evento.target.closest('.mes-opcao[aria-disabled="true"]');
        if (opcao) evento.preventDefault();
        return undefined;
    });

    // Rosca em SVG

    var VOLTA = 282.74;   // 2 x pi x 45, o comprimento da borda do círculo

    /* A rosca são vários círculos empilhados, todos do mesmo tamanho, cada
       um mostrando só um pedaço da própria borda.

       Quem faz isso é o stroke-dasharray, que transforma a borda em
       tracejado: o primeiro número é o tamanho do traço e o segundo o do
       espaço. Dando à fatia o tamanho que ela vale e ao espaço a volta
       inteira, sobra na tela um arco só. O stroke-dashoffset gira esse arco
       até o ponto onde a fatia anterior parou. */
    function rosca(itens, total, rotulo) {
        var partes = ['<circle cx="60" cy="60" r="45" stroke="var(--cor-borda)"></circle>'];
        var inicio = 0;

        if (total > 0) {
            itens.forEach(function (item) {
                var fatia = (item.valor / total) * VOLTA;
                partes.push('<circle cx="60" cy="60" r="45" stroke="' + item.cor + '" ' +
                            'stroke-dasharray="' + fatia.toFixed(2) + " " + VOLTA + '" ' +
                            'stroke-dashoffset="' + (-inicio).toFixed(2) + '"></circle>');
                inicio += fatia;
            });
        }

        return '<svg class="rosca" viewBox="0 0 120 120" role="img" aria-label="' +
               (rotulo || "Divisão dos gastos") + '">' + partes.join("") + "</svg>";
    }

    // A lista ao lado da rosca, com cor, nome e valor
    function legenda(itens) {
        return '<ul class="legenda-lista">' + itens.map(function (item) {
            return "<li>" +
                '<span class="legenda-cor" style="--cor-cat: ' + item.cor + '"></span>' +
                '<span class="crescer">' + global.Formato.escapar(item.nome) + "</span>" +
                "<strong>" + global.Formato.moeda(item.valor) + "</strong>" +
                "</li>";
        }).join("") + "</ul>";
    }

    return {
        daURL: daURL,
        endereco: endereco,
        desenhar: desenhar,
        abrirEscolha: abrirEscolha,
        rosca: rosca,
        legenda: legenda,
    };
})(window);
