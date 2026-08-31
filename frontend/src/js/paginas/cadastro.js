/* Singra - tela de criar conta
   Três campos. Quem termina cai direto no onboarding, já logado: pedir para
   fazer login com a senha recém-criada seria um passo a mais sem motivo. */

(function (global) {
    "use strict";

    if (global.Sessao.seJaLogadoIrParaPainel()) return;

    var form = document.querySelector("[data-form-cadastro]");
    var campos = {
        nome: document.getElementById("nome"),
        email: document.getElementById("email"),
        senha: document.getElementById("senha"),
    };

    /* O erro aparece embaixo do campo que o causou, e não em uma faixa no
       topo: quem preencheu três campos precisa saber qual deles voltar. */
    function mostrarErro(campo, mensagem) {
        var aviso = document.querySelector('[data-erro="' + campo + '"]');
        var caixa = document.querySelector('[data-campo="' + campo + '"]');
        if (aviso) {
            aviso.textContent = mensagem;
            aviso.hidden = false;
        }
        if (caixa) caixa.classList.add("campo-erro");
        if (campos[campo]) campos[campo].focus();
    }

    function limparErros() {
        document.querySelectorAll("[data-erro]").forEach(function (a) { a.hidden = true; });
        document.querySelectorAll("[data-campo]").forEach(function (c) {
            c.classList.remove("campo-erro");
        });
    }

    async function cadastrar(botao) {
        limparErros();

        var nome = campos.nome.value.trim();
        var email = campos.email.value.trim().toLowerCase();
        var senha = campos.senha.value;

        // Confere antes de enviar, para o erro aparecer sem esperar a rede
        if (nome.length < 2) {
            return mostrarErro("nome", "Falta seu nome. Como podemos te chamar?");
        }
        if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
            return mostrarErro("email", "Esse e-mail parece incompleto. Confere para a gente?");
        }
        if (senha.length < 8) {
            return mostrarErro("senha", "A senha precisa de pelo menos 8 letras ou números.");
        }

        global.Carregando.ocupado(botao, true, "Criando…");
        var resposta = await global.ApiAuth.cadastro(nome, email, senha);
        global.Carregando.ocupado(botao, false);

        if (!resposta.ok) {
            // O backend diz qual campo falhou. Sem isso, o aviso vai para
            // o e-mail, o único que ele pode recusar por já existir
            mostrarErro(resposta.campo || "email", resposta.mensagem);
            return;
        }

        global.location.href = "onboarding.html";
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        cadastrar(form.querySelector("[type=submit]"));
    });
})(window);
