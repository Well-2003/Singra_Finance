/* Singra - a conversa com a API
   Todo pedido ao backend passa por aqui. Um lugar só para decidir o
   endereço, anexar o token, tratar sessão expirada e transformar qualquer
   falha em uma mensagem que dá para mostrar na tela.

   Requer o sessao.js e o carregando.js, carregados antes deste arquivo. */

window.Api = (function (global) {
    "use strict";

    /* O endereço da API em produção, o único lugar do frontend que sabe
       onde o backend mora. Vazio faz as páginas abertas fora da máquina
       avisarem que a API não foi configurada, em vez de falharem caladas. */
    var API_PRODUCAO = "https://singra-api.onrender.com";

    var API_LOCAL = "http://127.0.0.1:5000";
    var HOSTS_LOCAIS = ["localhost", "127.0.0.1", ""];

    /* Uma chamada que passa disto provavelmente pegou o backend hibernando.
       O plano gratuito do Render dorme após 15 minutos sem uso. */
    var SEGUNDOS_ATE_DESISTIR = 60;

    function descobrirEndereco() {
        // Permite apontar para outro backend sem editar este arquivo
        if (global.SINGRA_API) return global.SINGRA_API;
        if (HOSTS_LOCAIS.indexOf(global.location.hostname) !== -1) return API_LOCAL;
        return API_PRODUCAO;
    }

    var BASE = descobrirEndereco();

    function configurada() {
        return Boolean(BASE);
    }

    // O pedido

    function cabecalhos() {
        var lista = { "Content-Type": "application/json" };
        var token = global.Sessao ? global.Sessao.token() : null;
        if (token) lista.Authorization = "Bearer " + token;
        return lista;
    }

    function temToken() {
        return Boolean(global.Sessao && global.Sessao.token());
    }

    /* Sempre devolve um objeto com ok e mensagem, mesmo quando a rede cai ou
       a resposta não é JSON. Quem chama nunca precisa de try/catch e nunca
       fica sem texto para mostrar. */
    async function pedir(metodo, caminho, dados) {
        if (!configurada()) {
            return {
                ok: false,
                mensagem: "O endereço da API ainda não foi configurado. " +
                          "Veja API_PRODUCAO em src/js/api/cliente.js.",
            };
        }

        // Guardado antes do pedido: é o que separa "sessão venceu" de
        // "a senha que você digitou não confere" quando vier um 401
        var enviouToken = temToken();

        var controle = new AbortController();
        var relogio = setTimeout(function () { controle.abort(); },
                                 SEGUNDOS_ATE_DESISTIR * 1000);
        var resposta;

        try {
            resposta = await fetch(BASE + caminho, {
                method: metodo,
                headers: cabecalhos(),
                body: dados ? JSON.stringify(dados) : undefined,
                signal: controle.signal,
            });
        } catch (erro) {
            clearTimeout(relogio);
            if (erro.name === "AbortError") {
                return {
                    ok: false,
                    mensagem: "O servidor está demorando mais que o normal. " +
                              "Tente de novo em alguns instantes.",
                };
            }
            return {
                ok: false,
                mensagem: "Parece que a internet caiu. Tente de novo em instantes.",
            };
        }
        clearTimeout(relogio);

        /* Um 401 tem dois significados, e confundi-los daria a mensagem
           errada nos dois casos:

           - com token enviado, quer dizer que ele venceu ou foi adulterado.
             Esquece a sessão e volta para o login.
           - sem token, é uma tentativa de entrar que não conferiu. A
             mensagem do backend já explica isso, e deve passar direto. */
        if (resposta.status === 401 && enviouToken) {
            if (global.Sessao) global.Sessao.sair();
            if (!/login\.html/.test(global.location.pathname)) {
                global.location.replace("login.html?expirou=1");
            }
            return { ok: false, mensagem: "Sua sessão expirou. Entre de novo, por favor." };
        }

        try {
            return await resposta.json();
        } catch (erro) {
            return { ok: false, mensagem: "Algo deu errado do nosso lado. Tente de novo." };
        }
    }

    /* Mesma coisa, mas mostrando a espera do cold start enquanto isso.
       Usado no primeiro pedido de cada página, que é o que pode pegar o
       backend dormindo. */
    async function pedirComEspera(metodo, caminho, dados) {
        if (global.Carregando) global.Carregando.mostrar();
        var resposta = await pedir(metodo, caminho, dados);
        if (global.Carregando) {
            if (resposta.ok) global.Carregando.esconder();
            else global.Carregando.falhou(resposta.mensagem);
        }
        return resposta;
    }

    // Atalhos

    function get(caminho) { return pedir("GET", caminho); }
    function post(caminho, dados) { return pedir("POST", caminho, dados || {}); }
    function put(caminho, dados) { return pedir("PUT", caminho, dados || {}); }
    function remover(caminho, dados) { return pedir("DELETE", caminho, dados || {}); }

    /* Monta a querystring pulando o que estiver vazio, para a URL não
       encher de parâmetros sem valor. */
    function query(parametros) {
        var partes = Object.keys(parametros || {})
            .filter(function (chave) {
                var v = parametros[chave];
                return v !== null && v !== undefined && v !== "";
            })
            .map(function (chave) {
                return encodeURIComponent(chave) + "=" + encodeURIComponent(parametros[chave]);
            });
        return partes.length ? "?" + partes.join("&") : "";
    }

    return {
        base: BASE,
        configurada: configurada,
        pedir: pedir,
        pedirComEspera: pedirComEspera,
        get: get,
        post: post,
        put: put,
        remover: remover,
        query: query,
    };
})(window);
