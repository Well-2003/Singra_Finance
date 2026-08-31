/* Singra - a espera enquanto o servidor acorda
   O plano gratuito do Render coloca a API para dormir depois de 15 minutos
   sem nenhum pedido. No primeiro acesso do dia, a resposta demora alguns
   segundos enquanto ela acorda, o chamado cold start.

   O atraso é do serviço, não da pessoa. Então a tela nunca fica parada nem
   diz "erro": ela avisa que está preparando as coisas, e só depois de
   alguns segundos explica por que está demorando. Antes disso, uma frase
   sobre servidor gratuito só assustaria quem tocou e viu tudo funcionar em
   meio segundo.

   Uso:
       Carregando.mostrar();            // ao começar a chamada
       Carregando.esconder();           // quando os dados chegarem
       Carregando.falhou("mensagem");   // quando não der certo

   Requer o icones.js, carregado antes deste arquivo. */

(function (global) {
    "use strict";

    // Depois de quanto tempo a espera merece uma explicação
    var SEGUNDOS_ATE_EXPLICAR = 3.5;

    var MENSAGEM = "Só um instante, estamos preparando tudo 🌱";
    var EXPLICACAO =
        "O servidor estava descansando e está acordando agora. " +
        "Só acontece no primeiro acesso depois de um tempo parado.";

    var temporizador = null;

    function area() {
        return document.querySelector("[data-carregando]");
    }

    function montar(alvo) {
        alvo.innerHTML =
            '<div class="carregando-tela" role="status" aria-live="polite">' +
            '<span class="carregando-marca" aria-hidden="true"></span>' +
            '<p class="carregando-mensagem">' + MENSAGEM + "</p>" +
            '<p class="carregando-explicacao legenda" hidden>' + EXPLICACAO + "</p>" +
            "</div>";
    }

    function mostrar() {
        var alvo = area();
        if (!alvo) return;

        montar(alvo);
        alvo.hidden = false;

        // A explicação só entra se a espera realmente se estender
        clearTimeout(temporizador);
        temporizador = setTimeout(function () {
            var explicacao = alvo.querySelector(".carregando-explicacao");
            if (explicacao) explicacao.hidden = false;
        }, SEGUNDOS_ATE_EXPLICAR * 1000);
    }

    function esconder() {
        clearTimeout(temporizador);
        var alvo = area();
        if (!alvo) return;
        alvo.hidden = true;
        alvo.innerHTML = "";
    }

    /* Falha explica o que aconteceu e oferece o próximo passo. Nunca deixa
       a tela parada, e nunca sugere que a culpa foi de quem está usando. */
    function falhou(mensagem) {
        clearTimeout(temporizador);
        var alvo = area();
        if (!alvo) return;

        alvo.hidden = false;
        alvo.innerHTML =
            '<div class="carregando-tela" role="status">' +
            '<p class="carregando-mensagem">' +
            (mensagem || "Não conseguimos carregar seus dados agora.") + "</p>" +
            '<button type="button" class="botao botao-contorno" data-tentar-de-novo>' +
            "Tentar de novo</button></div>";

        var botao = alvo.querySelector("[data-tentar-de-novo]");
        if (botao) {
            botao.addEventListener("click", function () {
                global.location.reload();
            });
        }
    }

    /* Botão ocupado: troca o texto e liga a marca girando do global.css.
       Sem isso, uma chamada lenta faz parecer que o toque não funcionou. */
    function ocupado(botao, ligado, textoOcupado) {
        if (!botao) return;
        if (ligado) {
            botao.dataset.textoOriginal = botao.dataset.textoOriginal || botao.textContent;
            botao.setAttribute("aria-busy", "true");
            botao.disabled = true;
            if (textoOcupado) botao.textContent = textoOcupado;
        } else {
            botao.removeAttribute("aria-busy");
            botao.disabled = false;
            if (botao.dataset.textoOriginal) {
                botao.textContent = botao.dataset.textoOriginal;
            }
        }
    }

    global.Carregando = {
        mostrar: mostrar,
        esconder: esconder,
        falhou: falhou,
        ocupado: ocupado,
    };
})(window);
