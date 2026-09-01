/* Singra - página de ajuda
   Três coisas pequenas: a busca que filtra o que já está escrito na página,
   o índice que acompanha a rolagem e o formulário de contato.

   A busca não vai à API de propósito. As respostas já estão no HTML, então
   ela responde na hora, funciona com o backend hibernando e continua
   funcionando para quem abriu a página sem conta. */

(function (global) {
    "use strict";

    var campo = document.querySelector("[data-busca]");
    var resultado = document.querySelector("[data-resultado-busca]");
    var semResultado = document.querySelector("[data-sem-resultado]");
    var itens = Array.prototype.slice.call(document.querySelectorAll("[data-item]"));
    var grupos = Array.prototype.slice.call(document.querySelectorAll("[data-grupo]"));

    /* Tira acento e caixa para comparar: quem digita "orcamento" precisa
       achar "orçamento", e quem digita "SENHA" também. */
    function simplificar(texto) {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    // O conteúdo visível mais as palavras extras do data-texto, que existem
    // justamente para os termos que a pessoa usa mas o texto não tem
    itens.forEach(function (item) {
        item.dadosBusca = simplificar(
            (item.textContent || "") + " " + (item.dataset.texto || ""));
    });

    function filtrar(termo) {
        var procurado = simplificar(termo).trim();

        if (!procurado) {
            itens.forEach(function (item) {
                item.hidden = false;
                if (item.tagName === "DETAILS") item.open = false;
            });
            grupos.forEach(function (grupo) { grupo.hidden = false; });
            semResultado.hidden = true;
            resultado.textContent = "";
            return;
        }

        var achados = 0;
        itens.forEach(function (item) {
            var bate = item.dadosBusca.indexOf(procurado) !== -1;
            item.hidden = !bate;
            // Abre o que sobrou: procurar e ainda ter que clicar seria um
            // passo a mais sem motivo
            if (bate && item.tagName === "DETAILS") item.open = true;
            if (bate) achados += 1;
        });

        // Um grupo sem nenhuma resposta some junto com o seu título
        grupos.forEach(function (grupo) {
            var visivel = grupo.querySelector("[data-item]:not([hidden])");
            grupo.hidden = !visivel;
        });

        semResultado.hidden = achados > 0;
        resultado.textContent = achados === 0
            ? "Nenhuma resposta encontrada."
            : achados === 1 ? "1 resposta encontrada." : achados + " respostas encontradas.";
    }

    if (campo) {
        campo.addEventListener("input", function () { filtrar(campo.value); });

        // Enter num campo de busca costuma tentar enviar o formulário da
        // página. Aqui ele não deve fazer nada além do que já foi filtrado
        campo.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") evento.preventDefault();
        });
    }

    /* O índice marca em que assunto a pessoa está. Sem isso, numa página
       longa como esta, o menu lateral vira só uma lista de links parados. */
    function ligarIndice() {
        var links = Array.prototype.slice.call(
            document.querySelectorAll(".ajuda-indice a"));
        if (!links.length || !global.IntersectionObserver) return;

        var observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (!entrada.isIntersecting) return;
                links.forEach(function (link) {
                    link.classList.toggle(
                        "ativo", link.getAttribute("href") === "#" + entrada.target.id);
                });
            });
        }, { rootMargin: "-20% 0px -70% 0px" });

        grupos.forEach(function (grupo) { observador.observe(grupo); });
    }

    ligarIndice();

    /* O formulário abre o programa de e-mail da pessoa em vez de mandar a
       mensagem por conta própria: não existe envio de e-mail no servidor, e
       fingir que a mensagem foi entregue seria pior do que ser direto.
       De quebra, ela fica com a cópia do que escreveu. */
    var contato = document.querySelector("[data-form-contato]");
    if (contato) {
        contato.addEventListener("submit", function (evento) {
            evento.preventDefault();

            var nome = document.getElementById("contato-nome").value.trim();
            var email = document.getElementById("contato-email").value.trim();
            var mensagem = document.getElementById("contato-mensagem").value.trim();

            var corpo = mensagem + "\n\n--\n" + nome + "\n" + email;
            global.location.href = "mailto:suporte@singra.com.br" +
                "?subject=" + encodeURIComponent("Contato pelo site - " + nome) +
                "&body=" + encodeURIComponent(corpo);
        });
    }
})(window);
