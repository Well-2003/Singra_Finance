/* Singra - criar a senha nova
   Aberta pelo link que o e-mail traz, com o token na querystring. Sem
   token, nem mostra o formulário: manda pedir outro link. */

(function (global) {
    "use strict";

    var token = new URLSearchParams(global.location.search).get("token") || "";

    var etapaFormulario = document.querySelector('[data-etapa="formulario"]');
    var etapaInvalido = document.querySelector('[data-etapa="invalido"]');
    var textoInvalido = document.querySelector("[data-texto-invalido]");

    function invalidar(mensagem) {
        textoInvalido.textContent = mensagem;
        etapaFormulario.hidden = true;
        etapaInvalido.hidden = false;
    }

    // Sem token na URL não há o que validar: o link veio incompleto
    if (!token) {
        invalidar("O link parece incompleto. Peça um novo, é rapidinho.");
        return;
    }

    var form = document.querySelector("[data-form-redefinir]");
    var campo = document.getElementById("senha");
    var aviso = document.querySelector('[data-erro="senha"]');
    var caixa = document.querySelector('[data-campo="senha"]');

    async function redefinir(botao) {
        aviso.hidden = true;
        caixa.classList.remove("campo-erro");

        if (campo.value.length < 8) {
            aviso.textContent = "A senha precisa de pelo menos 8 letras ou números.";
            aviso.hidden = false;
            caixa.classList.add("campo-erro");
            campo.focus();
            return;
        }

        global.Carregando.ocupado(botao, true, "Salvando…");
        var resposta = await global.ApiAuth.redefinirSenha(token, campo.value);
        global.Carregando.ocupado(botao, false);

        if (!resposta.ok) {
            // Token recusado é problema do link, não do que foi digitado
            if (resposta.campo === "token") {
                return invalidar(resposta.mensagem);
            }
            aviso.textContent = resposta.mensagem;
            aviso.hidden = false;
            caixa.classList.add("campo-erro");
            return;
        }

        // A resposta já traz um token de sessão: entra direto
        global.location.href = "dashboard.html";
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        redefinir(form.querySelector("[type=submit]"));
    });
})(window);
