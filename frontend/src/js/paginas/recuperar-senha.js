/* Singra - pedir o link de senha nova
   A resposta é a mesma exista ou não a conta: assim a tela não vira uma
   forma de descobrir quem tem cadastro no site. */

(function (global) {
    "use strict";

    var form = document.querySelector("[data-form-recuperar]");
    var campo = document.getElementById("email");
    var aviso = document.querySelector('[data-erro="email"]');
    var caixa = document.querySelector('[data-campo="email"]');

    var etapaPedir = document.querySelector('[data-etapa="pedir"]');
    var etapaEnviado = document.querySelector('[data-etapa="enviado"]');
    var textoEnviado = document.querySelector("[data-texto-enviado]");
    var linkDev = document.querySelector("[data-link-dev]");

    function mostrarErro(mensagem) {
        aviso.textContent = mensagem;
        aviso.hidden = false;
        caixa.classList.add("campo-erro");
        campo.focus();
    }

    async function pedir(botao) {
        aviso.hidden = true;
        caixa.classList.remove("campo-erro");

        var email = campo.value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
            return mostrarErro("Esse e-mail parece incompleto. Confere para a gente?");
        }

        global.Carregando.ocupado(botao, true, "Enviando…");
        var resposta = await global.ApiAuth.recuperarSenha(email);
        global.Carregando.ocupado(botao, false);

        if (!resposta.ok) {
            return mostrarErro(resposta.mensagem);
        }

        textoEnviado.textContent = resposta.mensagem;
        etapaPedir.hidden = true;
        etapaEnviado.hidden = false;

        /* O backend só devolve link_dev quando está em desenvolvimento.
           Em produção este bloco nunca aparece. */
        if (resposta.link_dev) {
            linkDev.innerHTML =
                "<span><strong>Modo de desenvolvimento.</strong> Ainda não há " +
                "serviço de e-mail configurado, então o link aparece aqui:<br>" +
                '<a href="' + global.Formato.escapar(resposta.link_dev) + '">' +
                global.Formato.escapar(resposta.link_dev) + "</a></span>";
            linkDev.hidden = false;
        }
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        pedir(form.querySelector("[type=submit]"));
    });
})(window);
