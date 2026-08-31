/* Singra - troca de idioma
   A interface existe em português, inglês e espanhol. O português é o
   original: é nele que as telas são escritas, e é ele que serve de chave
   para as outras duas línguas.

   A chave de cada tradução é a própria frase em português. A alternativa
   comum seria dar um nome a cada texto, como "painel.saldo.titulo", e
   escrever o português num arquivo separado. Isso criaria um nome para
   inventar e conferir a cada frase nova, e uma tela em branco toda vez que
   alguém esquecesse de cadastrar a chave. Com a frase como chave, o pior
   caso é ela aparecer em português.

   A troca acontece sobre a tela pronta: as páginas são montadas em
   português e este arquivo passa por cima delas trocando o texto. Cada
   pedaço trocado guarda o original, então mudar de idioma outra vez não
   traduz uma tradução, e sim parte de novo do português. Um observador
   cuida do que aparece depois, como painéis e listas recarregadas.

   Nada do que a pessoa escreveu é traduzido. Nome de categoria, descrição
   de gasto, nome de meta e de cartão são dela, e traduzir mudaria o sentido
   do que ela quis dizer. Por isso o dicionário só contém frases da
   interface, e qualquer trecho marcado com data-sem-traducao fica de fora.

   O dinheiro também não muda: o Singra opera no Brasil, então troca o
   idioma, não a moeda.

   Requer os arquivos de idioma (pt.js, en.js, es.js) carregados antes. */

window.Idioma = (function (global) {
    "use strict";

    var PADRAO = "pt";
    var CHAVE_LOCAL = "singra:idioma";
    var ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];
    var LANG_HTML = { pt: "pt-br", en: "en", es: "es" };

    var pacotes = {
        pt: global.TextosPT || { textos: {}, frases: {} },
        en: global.TextosEN || { textos: {}, frases: {} },
        es: global.TextosES || { textos: {}, frases: {} },
    };

    var atual = PADRAO;
    var observador = null;

    /* O original de cada pedaço já traduzido. WeakMap, e não um atributo no
       elemento: nós de texto não têm atributo, e o que sai da tela precisa
       sair da memória junto. */
    var originais = new WeakMap();

    // Escolha do idioma

    function guardado() {
        try {
            return localStorage.getItem(CHAVE_LOCAL);
        } catch (erro) {
            return null;
        }
    }

    function lembrar(codigo) {
        try {
            localStorage.setItem(CHAVE_LOCAL, codigo);
        } catch (erro) {
            /* segue sem lembrar */
        }
    }

    /* A escolha mora no perfil, no banco, para valer em qualquer aparelho.
       A cópia no navegador serve só para a tela já nascer no idioma certo,
       antes de a API responder, e para as páginas abertas, que não têm
       perfil nenhum para consultar. */
    function escolhido() {
        var usuario = global.Sessao && global.Sessao.usuario();
        if (usuario && pacotes[usuario.idioma]) return usuario.idioma;
        var local = guardado();
        return pacotes[local] ? local : PADRAO;
    }

    // Tradução de um texto solto

    function traduzir(texto) {
        if (atual === PADRAO) return texto;
        var chave = String(texto).trim();
        var traduzido = pacotes[atual].textos[chave];
        if (!traduzido) traduzido = porInicio(chave);
        if (!traduzido) return texto;
        // Devolve com os mesmos espaços em volta: o HTML tem quebras de
        // linha e indentação que fazem parte do desenho da página
        return String(texto).replace(chave, traduzido);
    }

    /* Alguns textos vêm com um valor colado no fim: "Faltam R$ 300,00",
       "Vence em 02/09/2026". O rótulo é da interface e o resto é dado, e
       separá-los em dois elementos só por causa da tradução deixaria o HTML
       das telas pior. Então, quando a frase inteira não está no dicionário,
       procura-se um começo que esteja. */
    var inicios = null;

    function porInicio(texto) {
        if (!inicios) {
            /* Palavras muito curtas ficam de fora daqui. "de" é uma entrada
               legítima do dicionário quando aparece sozinha entre dois
               valores, mas como começo ela casaria com meia língua
               portuguesa e traduziria pela metade. */
            inicios = Object.keys(pacotes[atual].textos)
                .filter(function (chave) { return chave.length >= 5; })
                .sort(function (a, b) { return b.length - a.length; });
        }
        for (var i = 0; i < inicios.length; i += 1) {
            var chave = inicios[i];
            if (texto.length <= chave.length) continue;
            if (texto.indexOf(chave) !== 0) continue;
            // Só vale se o que sobrou começa em espaço: senão "Mais" casaria
            // com "Maisena" e a tradução sairia picada
            var seguinte = texto.charAt(chave.length);
            if (seguinte !== " " && seguinte !== " ") continue;
            return pacotes[atual].textos[chave] + texto.slice(chave.length);
        }
        return null;
    }

    /* As frases dos gráficos vêm do backend como descritor: uma chave, os
       valores que entram nela e a versão em português já pronta. Quem tem
       os números é o servidor; quem sabe a língua é esta função. */
    function frase(descritor) {
        if (!descritor) return "";
        if (atual === PADRAO) return descritor.texto;

        var modelo = pacotes[atual].frases[descritor.chave];
        if (!modelo) return descritor.texto;

        var valores = descritor.valores || {};
        return modelo.replace(/\{(\w+)\}/g, function (tudo, nome) {
            if (!(nome in valores)) return tudo;
            return formatar(nome, valores[nome]);
        });
    }

    // Quem é dinheiro e quem é só número, para a frase sair certa
    var EM_DINHEIRO = ["valor", "ganhos", "gastos", "planejado", "fixos", "guardado"];

    /* Uma lista de categorias vira "a, b e c", e é aqui que ela vira, e
       não no backend, porque a palavra que liga o último item muda com a
       língua: "e", "and", "y". */
    function juntar(nomes) {
        if (nomes.length <= 1) return nomes.join("");
        var conector = pacotes[atual].conector || "e";
        return nomes.slice(0, -1).join(", ") + " " + conector + " " +
               nomes[nomes.length - 1];
    }

    function formatar(nome, valor) {
        if (Array.isArray(valor)) return juntar(valor);
        if (typeof valor !== "number") return valor;
        if (EM_DINHEIRO.indexOf(nome) !== -1 && global.Formato) {
            return global.Formato.moeda(valor);
        }
        return valor;
    }

    // A passagem pela tela

    function podeTraduzir(elemento) {
        if (!elemento) return false;
        if (elemento.closest("script, style, code, [data-sem-traducao]")) return false;
        return true;
    }

    function trocarNo(no) {
        if (!originais.has(no)) originais.set(no, no.nodeValue);
        var original = originais.get(no);
        var novo = traduzir(original);
        if (no.nodeValue !== novo) no.nodeValue = novo;
    }

    function trocarAtributos(elemento) {
        ATRIBUTOS.forEach(function (nome) {
            if (!elemento.hasAttribute(nome)) return;
            var marca = "singraOriginal" + nome.replace(/-/g, "");
            if (!elemento.dataset[marca]) {
                elemento.dataset[marca] = elemento.getAttribute(nome);
            }
            var novo = traduzir(elemento.dataset[marca]);
            if (elemento.getAttribute(nome) !== novo) {
                elemento.setAttribute(nome, novo);
            }
        });
    }

    function aplicar(raiz) {
        var alvo = raiz || document.body;
        if (!alvo) return;

        if (alvo.nodeType === Node.TEXT_NODE) {
            if (podeTraduzir(alvo.parentElement)) trocarNo(alvo);
            return;
        }

        var caminhante = document.createTreeWalker(alvo, NodeFilter.SHOW_TEXT, {
            acceptNode: function (no) {
                if (!no.nodeValue || !no.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                return podeTraduzir(no.parentElement)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        });

        var no;
        while ((no = caminhante.nextNode())) trocarNo(no);

        if (alvo.nodeType === Node.ELEMENT_NODE && podeTraduzir(alvo)) {
            trocarAtributos(alvo);
        }
        var comAtributo = alvo.querySelectorAll
            ? alvo.querySelectorAll("[" + ATRIBUTOS.join("],[") + "]")
            : [];
        Array.prototype.forEach.call(comAtributo, function (elemento) {
            if (podeTraduzir(elemento)) trocarAtributos(elemento);
        });
    }

    /* As telas montam o conteúdo depois, com innerHTML: sem observar, só a
       casca da página seria traduzida. O observador desliga durante a
       própria tradução, senão ele se ouviria mudando o texto. */
    function observar() {
        if (observador || !global.MutationObserver) return;
        observador = new MutationObserver(function (mudancas) {
            observador.disconnect();
            mudancas.forEach(function (mudanca) {
                Array.prototype.forEach.call(mudanca.addedNodes, function (no) {
                    if (no.nodeType === Node.TEXT_NODE ||
                        no.nodeType === Node.ELEMENT_NODE) {
                        aplicar(no);
                    }
                });
            });
            ligar();
        });
        ligar();
    }

    function ligar() {
        if (observador && document.body) {
            observador.observe(document.body, { childList: true, subtree: true });
        }
    }

    // Troca em tempo real, sem recarregar

    /* O título da aba não está no corpo da página, então a varredura não
       passa por ele. Vale traduzir: é o que aparece na aba, no histórico do
       navegador e no favorito. */
    var tituloOriginal = null;

    function trocarTitulo() {
        if (tituloOriginal === null) tituloOriginal = document.title;
        document.title = traduzir(tituloOriginal);
    }

    function definir(codigo) {
        if (!pacotes[codigo]) return atual;
        atual = codigo;
        inicios = null;
        lembrar(codigo);
        document.documentElement.lang = LANG_HTML[codigo] || codigo;
        trocarTitulo();
        aplicar(document.body);

        /* As frases dos gráficos são montadas com os números na hora de
           desenhar, e não dá para traduzi-las depois lendo a tela. As telas
           que têm frase ouvem este aviso e se redesenham. */
        document.dispatchEvent(new CustomEvent("singra:idioma", {
            detail: { idioma: atual },
        }));
        return atual;
    }

    function iniciar() {
        atual = escolhido();
        document.documentElement.lang = LANG_HTML[atual] || atual;
        if (atual !== PADRAO) {
            trocarTitulo();
            aplicar(document.body);
        }
        observar();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

    return {
        t: traduzir,
        frase: frase,
        definir: definir,
        atual: function () { return atual; },
        aplicar: aplicar,
        disponiveis: ["pt", "en", "es"],
    };
})(window);
