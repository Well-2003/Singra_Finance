/* Singra - tela de entrar
   Confere e-mail e senha, guarda o token e leva ao painel. Quem já tem
   sessão nem chega a ver esta tela. */

(function (global) {
    "use strict";

    // Quem já está logado vai direto para o painel
    if (global.Sessao.seJaLogadoIrParaPainel()) return;

    var form = document.querySelector("[data-form-login]");
    var erro = document.querySelector("[data-erro-geral]");
    var campoEmail = document.getElementById("email");
    var campoSenha = document.getElementById("senha");

    function mostrarErro(mensagem) {
        erro.textContent = mensagem;
        erro.hidden = false;
    }

    function limparErro() {
        erro.hidden = true;
    }

    async function entrar(email, senha, botao) {
        limparErro();

        if (!email || !senha) {
            mostrarErro("Preencha o e-mail e a senha para continuar.");
            return;
        }

        // O primeiro pedido do dia pode pegar o backend hibernando, então o
        // botão avisa que está esperando em vez de parecer travado
        global.Carregando.ocupado(botao, true, "Entrando…");
        var resposta = await global.ApiAuth.login(email, senha);
        global.Carregando.ocupado(botao, false);

        if (!resposta.ok) {
            mostrarErro(resposta.mensagem);
            campoSenha.value = "";
            campoSenha.focus();
            return;
        }

        // Volta para a página de onde a pessoa veio, se ela foi barrada lá
        global.location.href = global.Sessao.destinoDepoisDoLogin();
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        entrar(campoEmail.value.trim().toLowerCase(), campoSenha.value,
               form.querySelector("[type=submit]"));
    });

    // Sessão que venceu enquanto a pessoa usava o site
    if (new URLSearchParams(global.location.search).get("expirou")) {
        mostrarErro("Sua sessão expirou. Entre de novo, por favor.");
    }
})(window);
