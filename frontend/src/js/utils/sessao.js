/* Singra - a sessão no navegador
   Guarda o token que a API devolveu no login e o envia de volta a cada
   chamada. Um cookie de sessão não serviria aqui: cookies são presos a um
   domínio, e o frontend e a API moram em domínios diferentes.

   O token fica no localStorage, e não no sessionStorage, porque a caixa
   "manter conectado" vem marcada: quem usa o Singra todo dia não deveria
   digitar a senha toda vez.

   O que é guardado aqui: o token e o nome de quem entrou, para a saudação
   aparecer antes mesmo de a API responder. Nenhum valor financeiro fica no
   navegador, esses vêm da API a cada visita. */

window.Sessao = (function (global) {
    "use strict";

    var CHAVE_TOKEN = "singra:token";
    var CHAVE_USUARIO = "singra:usuario";

    // Navegador com armazenamento bloqueado não pode derrubar a página
    function ler(chave) {
        try {
            return localStorage.getItem(chave);
        } catch (erro) {
            return null;
        }
    }

    function gravar(chave, valor) {
        try {
            if (valor === null) localStorage.removeItem(chave);
            else localStorage.setItem(chave, valor);
        } catch (erro) {
            /* segue sem lembrar */
        }
    }

    function token() {
        return ler(CHAVE_TOKEN);
    }

    function logado() {
        return Boolean(token());
    }

    function usuario() {
        try {
            return JSON.parse(ler(CHAVE_USUARIO) || "null");
        } catch (erro) {
            return null;
        }
    }

    function entrar(dados) {
        gravar(CHAVE_TOKEN, dados.token);
        gravar(CHAVE_USUARIO, JSON.stringify(dados.usuario || {}));
    }

    // Guarda o usuário atualizado sem mexer no token
    function atualizarUsuario(dados) {
        gravar(CHAVE_USUARIO, JSON.stringify(dados || {}));
    }

    function sair() {
        gravar(CHAVE_TOKEN, null);
        gravar(CHAVE_USUARIO, null);
    }

    function apelido() {
        var u = usuario();
        if (!u) return "";
        return u.apelido || (u.nome || "").split(" ")[0] || "";
    }

    /* Chamado no começo de toda página protegida. Sem token, manda para o
       login antes de a tela mostrar qualquer coisa, e guarda para onde a
       pessoa queria ir, para voltar lá depois de entrar. */
    function exigirLogin() {
        if (logado()) return true;
        var destino = global.location.pathname.split("/").pop() || "dashboard.html";
        global.location.replace("login.html?proximo=" + encodeURIComponent(destino));
        return false;
    }

    /* O contrário: quem já está logado não precisa ver login nem cadastro */
    function seJaLogadoIrParaPainel() {
        if (!logado()) return false;
        global.location.replace("dashboard.html");
        return true;
    }

    // Para onde voltar depois do login, se veio de uma página protegida
    function destinoDepoisDoLogin() {
        var busca = new URLSearchParams(global.location.search);
        var proximo = busca.get("proximo") || "";
        // Só aceita nome de arquivo do próprio site: um endereço completo
        // aqui viraria um desvio para fora do Singra disfarçado de retorno
        return /^[a-z0-9-]+\.html$/i.test(proximo) ? proximo : "dashboard.html";
    }

    /* Sair é do lado do cliente: o token é assinado e carrega o próprio
       conteúdo, então não há sessão no servidor para encerrar. Basta
       esquecer o token e voltar para a entrada. */
    function ligarBotoesSair() {
        document.addEventListener("click", function (evento) {
            var botao = evento.target.closest("[data-sair]");
            if (!botao) return;
            evento.preventDefault();
            sair();
            global.location.href = "login.html";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ligarBotoesSair);
    } else {
        ligarBotoesSair();
    }

    return {
        token: token,
        logado: logado,
        usuario: usuario,
        apelido: apelido,
        entrar: entrar,
        atualizarUsuario: atualizarUsuario,
        sair: sair,
        exigirLogin: exigirLogin,
        seJaLogadoIrParaPainel: seJaLogadoIrParaPainel,
        destinoDepoisDoLogin: destinoDepoisDoLogin,
    };
})(window);
