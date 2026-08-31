/* Singra - chamadas dos gráficos
   Os números chegam prontos do backend, junto com a frase que os explica.
   Nenhuma conta financeira acontece no navegador.

   Dois deles podem voltar com disponivel = false, cartões e investimento.
   Isso não é erro: quando a pessoa não usa o recurso, a página esconde o
   bloco inteiro, em vez de mostrar um gráfico zerado.

   Requer o cliente.js. */

window.ApiGraficos = (function (global) {
    "use strict";

    var Api = global.Api;

    function categorias(ano, mes) {
        return Api.get("/api/graficos/categorias" + Api.query({ ano: ano, mes: mes }));
    }

    function cartoes(ano, mes) {
        return Api.get("/api/graficos/cartoes" + Api.query({ ano: ano, mes: mes }));
    }

    // A janela de 12 meses existe para quem tem meta de investimento anual,
    // que não fecharia dentro de 6
    function evolucao(ano, mes, meses) {
        return Api.get("/api/graficos/evolucao" +
                       Api.query({ ano: ano, mes: mes, meses: meses }));
    }

    function orcamento(ano, mes) {
        return Api.get("/api/graficos/orcamento" + Api.query({ ano: ano, mes: mes }));
    }

    function fixosVariaveis(ano, mes) {
        return Api.get("/api/graficos/fixos-variaveis" + Api.query({ ano: ano, mes: mes }));
    }

    function investimento(meses) {
        return Api.get("/api/graficos/investimento" + Api.query({ meses: meses }));
    }

    /* Busca os seis de uma vez. A página de gráficos precisa de todos, e
       pedir em paralelo evita somar uma espera atrás da outra. */
    function todos(ano, mes, meses) {
        return Promise.all([
            categorias(ano, mes),
            evolucao(ano, mes, meses),
            orcamento(ano, mes),
            fixosVariaveis(ano, mes),
            cartoes(ano, mes),
            investimento(meses),
        ]).then(function (r) {
            return {
                categorias: r[0], evolucao: r[1], orcamento: r[2],
                fixos: r[3], cartoes: r[4], investimento: r[5],
            };
        });
    }

    return {
        categorias: categorias,
        cartoes: cartoes,
        evolucao: evolucao,
        orcamento: orcamento,
        fixosVariaveis: fixosVariaveis,
        investimento: investimento,
        todos: todos,
    };
})(window);
