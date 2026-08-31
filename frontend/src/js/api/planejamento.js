/* Singra - chamadas de orçamento, metas, contas e cartões
   As quatro áreas em que a pessoa combina alguma coisa consigo mesma.

   Requer o cliente.js. */

window.ApiPlanejamento = (function (global) {
    "use strict";

    var Api = global.Api;

    // Orçamento

    // Valor zero tira a categoria do planejamento, em vez de guardar um limite de R$ 0
    function salvarLimite(categoriaId, valor, ano, mes) {
        return Api.put("/api/orcamentos", {
            categoria_id: categoriaId, valor_limite: valor, ano: ano, mes: mes,
        });
    }

    function sugerirOrcamento(ano, mes, renda) {
        return Api.post("/api/orcamentos/sugerir", { ano: ano, mes: mes, renda: renda });
    }

    function copiarOrcamento(ano, mes) {
        return Api.post("/api/orcamentos/copiar", { ano: ano, mes: mes });
    }

    // Metas

    function listarMetas() {
        return Api.pedirComEspera("GET", "/api/metas");
    }

    function criarMeta(dados) {
        return Api.post("/api/metas", dados);
    }

    /* A meta de investimento é a mesma rota com eh_investimento marcado e
       uma cadência: diária, semanal, mensal ou anual. Só pode haver uma
       ativa, e o backend recusa a segunda. */
    function criarMetaInvestimento(valor, cadencia, nome) {
        return Api.post("/api/metas", {
            eh_investimento: true, valor_alvo: valor, cadencia: cadencia,
            nome: nome || "Guardar dinheiro",
        });
    }

    function editarMeta(id, dados) {
        return Api.put("/api/metas/" + id, dados);
    }

    function apagarMeta(id) {
        return Api.remover("/api/metas/" + id);
    }

    // Na meta de investimento, é este aporte que move dinheiro do
    // "disponível para gastar" para o "guardado"
    function guardarDinheiro(metaId, valor) {
        return Api.post("/api/metas/" + metaId + "/aportes", { valor: valor });
    }

    // Contas a pagar

    function listarContas(ano, mes) {
        return Api.pedirComEspera(
            "GET", "/api/contas" + Api.query({ ano: ano, mes: mes }));
    }

    function criarConta(dados) {
        return Api.post("/api/contas", dados);
    }

    function apagarConta(id) {
        return Api.remover("/api/contas/" + id);
    }

    // Marcar como paga cria o gasto no histórico e, se a conta se repete,
    // já deixa a do mês seguinte cadastrada
    function pagarConta(id) {
        return Api.post("/api/contas/" + id + "/pagar");
    }

    function desfazerPagamento(id) {
        return Api.post("/api/contas/" + id + "/desfazer-pagamento");
    }

    // Cartões e bancos

    function listarCartoes() {
        return Api.get("/api/cartoes");
    }

    function criarCartao(nome, cor) {
        return Api.post("/api/cartoes", { nome: nome, cor: cor });
    }

    function editarCartao(id, nome, cor) {
        return Api.put("/api/cartoes/" + id, { nome: nome, cor: cor });
    }

    // Remover o cartão não apaga os gastos: eles passam a contar como
    // "sem cartão vinculado"
    function apagarCartao(id) {
        return Api.remover("/api/cartoes/" + id);
    }

    return {
        salvarLimite: salvarLimite,
        sugerirOrcamento: sugerirOrcamento,
        copiarOrcamento: copiarOrcamento,
        listarMetas: listarMetas,
        criarMeta: criarMeta,
        criarMetaInvestimento: criarMetaInvestimento,
        editarMeta: editarMeta,
        apagarMeta: apagarMeta,
        guardarDinheiro: guardarDinheiro,
        listarContas: listarContas,
        criarConta: criarConta,
        apagarConta: apagarConta,
        pagarConta: pagarConta,
        desfazerPagamento: desfazerPagamento,
        listarCartoes: listarCartoes,
        criarCartao: criarCartao,
        editarCartao: editarCartao,
        apagarCartao: apagarCartao,
    };
})(window);
