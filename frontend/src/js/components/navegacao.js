/* Singra - navegação das páginas
   Monta o menu a partir de uma lista só, em vez de repetir o mesmo HTML em
   catorze arquivos. Acrescentar uma página é mexer em um lugar.

   Cada página se declara em atributos do <body>:

       <body data-area="sistema" data-pagina="historico">

   É por eles que a navegação sabe qual menu montar e qual item marcar como
   a página atual. O script não deduz nada pela URL, que muda conforme o
   site esteja aberto do disco, de um servidor local ou do GitHub Pages.

   Requer o icones.js, carregado antes deste arquivo. */

(function (global) {
    "use strict";

    /* A ordem desta lista é a ordem do menu lateral.
       [chave, ícone, rótulo, arquivo, rótulo curto]

       O rótulo curto é opcional e existe só para a barra do celular, onde
       cinco itens dividem a largura da tela: "Contas a pagar" quebrava em
       duas linhas e deixava aquele item mais alto que os vizinhos. */
    var ITENS = [
        ["inicio",    "inicio",     "Início",         "dashboard.html"],
        ["historico", "historico",  "Histórico",      "historico.html"],
        ["graficos",  "graficos",   "Gráficos",       "graficos.html"],
        ["orcamento", "orcamento",  "Planejamento",   "orcamento.html"],
        ["metas",     "meta",       "Metas",          "metas.html"],
        ["contas",    "calendario", "Contas a pagar", "contas.html", "Contas"],
        ["ajuda",     "ajuda",      "Ajuda",          "ajuda.html"],
        ["perfil",    "perfil",     "Meu perfil",     "perfil.html"],
    ];

    /* Os três itens que cabem na barra inferior do celular, com o botão de
       adicionar ocupando o meio. O resto vai para "Mais".

       Contas a pagar está aqui e Gráficos não: contas é coisa de todo dia,
       com data marcada, e é o que a pessoa abre o site para conferir. Ver
       gráfico é uma parada mais demorada, que cabe dentro de "Mais". */
    var NA_BARRA = ["inicio", "historico", "contas"];

    var PUBLICAS = [
        ["sobre", "Sobre nós", "sobre.html"],
        ["ajuda", "Ajuda",     "ajuda.html"],
    ];

    function icone(nome, classe) {
        return global.SingraIcones.icone(nome, classe);
    }

    function paginaAtual() {
        return document.body.dataset.pagina || "";
    }

    function atual(chave) {
        return chave === paginaAtual() ? ' aria-current="page"' : "";
    }

    // Menu lateral do desktop
    function montarLateral(alvo) {
        var linhas = ITENS.map(function (item) {
            return '<li><a class="menu-item" href="' + item[3] + '"' + atual(item[0]) +
                   ">" + icone(item[1]) + " " + item[2] + "</a></li>";
        });
        linhas.push('<li><a class="menu-item" href="login.html" data-sair>' +
                    icone("sair") + " Sair</a></li>");
        alvo.innerHTML = linhas.join("");
    }

    // Barra inferior do celular
    function montarBarra(alvo) {
        var partes = [];

        NA_BARRA.forEach(function (chave) {
            var item = ITENS.filter(function (i) { return i[0] === chave; })[0];
            // O nome inteiro fica no rótulo de leitor de tela. Na tela
            // aparece o curto, quando houver
            partes.push('<a class="barra-item" href="' + item[3] + '"' + atual(item[0]) +
                        ' aria-label="' + item[2] + '">' + icone(item[1]) + " " +
                        (item[4] || item[2]) + "</a>");
        });

        // O [+] entra na terceira posição, no centro exato da barra
        partes.splice(2, 0,
            '<button type="button" class="barra-mais" data-abrir-adicionar ' +
            'aria-label="Adicionar gasto ou ganho">' + icone("mais") + "</button>");

        partes.push('<button type="button" class="barra-item" data-abrir-mais ' +
                    'aria-expanded="false" aria-controls="menu-mais">' +
                    icone("mais-menu") + " Mais</button>");

        alvo.innerHTML = partes.join("");
    }

    /* Painel "Mais": as páginas que não couberam na barra inferior.
       Fica escondido até alguém tocar, e o comportamento de abrir vem do
       componente de painéis, em outra etapa. */
    function montarPainelMais(alvo) {
        var linhas = ITENS.filter(function (item) {
            return NA_BARRA.indexOf(item[0]) === -1;
        }).map(function (item) {
            return '<li><a class="menu-item" href="' + item[3] + '"' + atual(item[0]) +
                   ">" + icone(item[1]) + " " + item[2] + "</a></li>";
        });
        linhas.push('<li><a class="menu-item" href="login.html" data-sair>' +
                    icone("sair") + " Sair</a></li>");
        alvo.innerHTML = linhas.join("");
    }

    /* Cabeçalho das páginas abertas.

       No desktop os links ficam em linha. No celular eles não cabem, eram
       quatro botões disputando 390px com o logo, e passam a viver atrás de
       um botão "Menu", que abre a lista logo abaixo do cabeçalho. */
    function montarPublico(alvo) {
        var linhas = PUBLICAS.map(function (item) {
            return '<a class="botao botao-texto" href="' + item[2] + '">' +
                   item[1] + "</a>";
        });

        /* Quem já está logado e caiu numa página aberta, normalmente pela
           Ajuda, que é a mesma para os dois lados, não deveria ser
           convidado a criar uma conta que já tem. */
        if (global.Sessao && global.Sessao.logado()) {
            linhas.push('<a class="botao botao-acao" href="dashboard.html">' +
                        "Ir para o meu painel</a>");
        } else {
            linhas.push('<a class="botao botao-contorno" href="login.html">Entrar</a>');
            linhas.push('<a class="botao botao-acao" href="cadastro.html">' +
                        "Criar conta grátis</a>");
        }

        alvo.innerHTML =
            '<button type="button" class="botao botao-texto topo-abrir" ' +
                'data-abrir-topo aria-expanded="false" aria-controls="menu-topo">' +
                icone("menu") + " Menu</button>" +
            '<div class="topo-itens" id="menu-topo" data-topo-itens>' +
                linhas.join("") + "</div>";
    }

    /* O menu do celular abre e fecha aqui mesmo, sem depender do componente
       de painéis: as páginas abertas não carregam o painel.js, e puxá-lo
       inteiro só para três links custaria mais do que estas linhas. */
    function ligarMenuPublico() {
        document.addEventListener("click", function (evento) {
            var botao = evento.target.closest("[data-abrir-topo]");
            var itens = document.querySelector("[data-topo-itens]");
            if (!itens) return;

            if (botao) {
                var aberto = itens.classList.toggle("aberto");
                botao.setAttribute("aria-expanded", String(aberto));
                return;
            }

            // Tocar em qualquer outro lugar fecha
            if (!evento.target.closest("[data-topo-itens]")) {
                itens.classList.remove("aberto");
                var abrir = document.querySelector("[data-abrir-topo]");
                if (abrir) abrir.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key !== "Escape") return;
            var itens = document.querySelector("[data-topo-itens]");
            if (itens) itens.classList.remove("aberto");
        });
    }

    function montar() {
        var lateral = document.querySelector("[data-menu-lateral]");
        var barra = document.querySelector("[data-barra-inferior]");
        var mais = document.querySelector("[data-menu-mais]");
        var publico = document.querySelector("[data-menu-publico]");

        if (lateral) montarLateral(lateral);
        if (barra) montarBarra(barra);
        if (mais) montarPainelMais(mais);
        if (publico) {
            montarPublico(publico);
            ligarMenuPublico();
        }

        // A marca aparece nas duas áreas e aponta para lugares diferentes
        Array.prototype.forEach.call(
            document.querySelectorAll("[data-marca]"),
            function (elemento) {
                elemento.innerHTML = icone("logo") + " Singra";
            }
        );
    }

    global.SingraNavegacao = { montar: montar, itens: ITENS };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", montar);
    } else {
        montar();
    }
})(window);
