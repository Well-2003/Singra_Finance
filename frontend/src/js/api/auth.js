/* Singra - chamadas de conta e sessão
   Cadastro, login, recuperação de senha e a conferência do token.

   Cadastro e login já guardam a sessão quando dão certo, para nenhuma tela
   precisar lembrar de fazer isso. Requer o cliente.js e o sessao.js. */

window.ApiAuth = (function (global) {
    "use strict";

    async function guardando(chamada) {
        var resposta = await chamada;
        if (resposta.ok && resposta.token) global.Sessao.entrar(resposta);
        return resposta;
    }

    function cadastro(nome, email, senha) {
        return guardando(global.Api.post("/api/auth/cadastro", {
            nome: nome, email: email, senha: senha,
        }));
    }

    function login(email, senha) {
        return guardando(global.Api.post("/api/auth/login", {
            email: email, senha: senha,
        }));
    }

    function recuperarSenha(email) {
        return global.Api.post("/api/auth/recuperar-senha", { email: email });
    }

    // Entra direto depois de trocar a senha: pedir para logar de novo com a
    // senha recém-criada seria um passo a mais sem motivo
    function redefinirSenha(token, senha) {
        return guardando(global.Api.post("/api/auth/redefinir-senha", {
            token: token, senha: senha,
        }));
    }

    /* Confere o token e traz o usuário atualizado. É o primeiro pedido de
       toda página protegida, e por isso o que mostra a espera do cold
       start, depois dele, a API já está acordada. */
    async function eu() {
        var resposta = await global.Api.pedirComEspera("GET", "/api/auth/eu");
        if (resposta.ok && resposta.usuario) {
            global.Sessao.atualizarUsuario(resposta.usuario);
        }
        return resposta;
    }

    return {
        cadastro: cadastro,
        login: login,
        recuperarSenha: recuperarSenha,
        redefinirSenha: redefinirSenha,
        eu: eu,
    };
})(window);
