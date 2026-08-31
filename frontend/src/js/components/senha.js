/* Singra - campos de senha
   Mostrar e esconder com texto, não só com um ícone, e o indicador de força
   em três níveis.

   O botão diz "Mostrar senha" em palavras porque um ícone de olho sozinho
   não deixa claro se ele mostra ou esconde. É também o que dispensa o campo
   de confirmação de senha no cadastro: quem consegue ler o que digitou não
   precisa digitar duas vezes. */

window.Senha = (function () {
    "use strict";

    /* Mesma régua do backend, em src/core/seguranca.py: conta tamanho e
       variedade, sem exigir símbolo obrigatório. Uma frase longa é mais
       segura e mais fácil de lembrar do que "S3nh@!". */
    function avaliar(senha) {
        var pontos = 0;
        if (senha.length >= 8) pontos += 1;
        if (senha.length >= 12) pontos += 1;
        if (/\d/.test(senha) && /[a-zA-Z]/.test(senha)) pontos += 1;
        if (/[^a-zA-Z0-9]/.test(senha)) pontos += 1;
        if (pontos >= 4) return "otima";
        if (pontos >= 2) return "boa";
        return "fraca";
    }

    // Diz o que fazer para melhorar, em vez de só apontar que está fraca
    var EXPLICACAO = {
        fraca: "Senha fraca. Que tal juntar letras e números?",
        boa: "Senha boa.",
        otima: "Senha ótima!",
    };

    function ligarMostrar() {
        document.addEventListener("click", function (evento) {
            var botao = evento.target.closest("[data-mostrar-senha]");
            if (!botao) return;

            var campo = document.getElementById(botao.dataset.mostrarSenha);
            if (!campo) return;

            var escondida = campo.type === "password";
            campo.type = escondida ? "text" : "password";
            botao.textContent = escondida ? "Esconder senha" : "Mostrar senha";
        });
    }

    /* O ouvinte fica no documento, e não no campo: no perfil o formulário de
       trocar senha só existe depois que os dados chegam da API, e um ouvinte
       preso ao campo teria sido registrado num elemento que ainda nem
       existia. */
    function ligarMedidor() {
        document.addEventListener("input", function (evento) {
            var campo = evento.target.closest && evento.target.closest("[data-forca-senha]");
            if (!campo) return;

            var caixa = campo.closest(".campo") || document;
            var medidor = caixa.querySelector("[data-medidor]");
            var texto = caixa.querySelector("[data-texto-forca]");
            if (!medidor) return;

            medidor.classList.remove("forca-fraca", "forca-boa", "forca-otima");
            if (!campo.value) {
                if (texto) texto.textContent = "";
                return;
            }
            var nivel = avaliar(campo.value);
            medidor.classList.add("forca-" + nivel);
            if (texto) texto.textContent = EXPLICACAO[nivel];
        });
    }

    function iniciar() {
        ligarMostrar();
        ligarMedidor();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

    return { avaliar: avaliar };
})();
