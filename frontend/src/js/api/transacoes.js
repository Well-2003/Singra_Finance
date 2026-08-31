/* Singra - chamadas de gastos, ganhos e do painel
   O caminho mais usado do produto: é por aqui que passa cada gasto
   registrado nos três passos do painel de adicionar.

   Requer o cliente.js. */

window.ApiTransacoes = (function (global) {
    "use strict";

    var Api = global.Api;

    /* Tudo o que a tela Início mostra, em uma requisição só. Sete chamadas
       separadas somariam sete vezes o tempo de despertar do backend no
       primeiro acesso do dia. */
    function painel(ano, mes) {
        return Api.pedirComEspera("GET", "/api/painel" + Api.query({ ano: ano, mes: mes }));
    }

    function resumo(ano, mes) {
        return Api.get("/api/resumo" + Api.query({ ano: ano, mes: mes }));
    }

    // Histórico, com os filtros da tela. O que vier vazio não vira parâmetro
    function listar(filtros) {
        return Api.pedirComEspera("GET", "/api/transacoes" + Api.query(filtros || {}));
    }

    /* Com incluirOcultas, vêm também as categorias escondidas. Só o perfil
       pede assim: nas telas de registro elas não devem aparecer, mas de lá
       é que dá para trazer uma de volta. */
    function categorias(incluirOcultas) {
        return Api.get("/api/categorias" +
                       (incluirOcultas ? Api.query({ ocultas: 1 }) : ""));
    }

    /* Criar aceita "parcelas" para uma compra parcelada. O valor enviado é
       sempre o total da compra: quem divide é o backend, para o arredonda-
       mento dos centavos acontecer em um lugar só. */
    function criar(dados) {
        return Api.post("/api/transacoes", dados);
    }

    function editar(id, dados) {
        return Api.put("/api/transacoes/" + id, dados);
    }

    // Com grupo = "1", apaga a compra parcelada inteira
    function apagar(id, apagarGrupo) {
        return Api.remover("/api/transacoes/" + id, apagarGrupo ? { grupo: "1" } : {});
    }

    return {
        painel: painel,
        resumo: resumo,
        listar: listar,
        categorias: categorias,
        criar: criar,
        editar: editar,
        apagar: apagar,
    };
})(window);
