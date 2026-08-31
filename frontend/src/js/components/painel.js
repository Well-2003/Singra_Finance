/* Singra - painéis deslizantes e o modal de confirmação
   O painel sobe de baixo no celular e vira modal centralizado no desktop.
   É onde acontecem as tarefas curtas: adicionar um gasto, guardar dinheiro,
   cadastrar uma conta.

   O modal de confirmação substitui o confirm() do navegador, que aparece
   com a cara do sistema operacional, quase sempre em inglês, e não deixa
   nomear o que vai ser apagado. */

window.Painel = (function (global) {
    "use strict";

    // Pilha dos painéis abertos: o Esc fecha sempre o de cima
    var abertos = [];
    var focoAnterior = null;

    function fundoDe(id) {
        return document.querySelector('[data-fundo="' + id + '"]');
    }

    function abrir(id) {
        var painel = document.getElementById(id);
        if (!painel || abertos.indexOf(id) !== -1) return;

        // Guarda de onde a pessoa veio, para devolver o foco ao fechar
        if (!abertos.length) focoAnterior = document.activeElement;

        var fundo = fundoDe(id);
        painel.hidden = false;
        if (fundo) fundo.hidden = false;

        // Um quadro depois, para o navegador registrar o estado inicial e
        // a transição de entrada acontecer
        requestAnimationFrame(function () {
            painel.classList.add("aberto");
            if (fundo) fundo.classList.add("aberto");
        });

        document.body.style.overflow = "hidden";
        abertos.push(id);

        var primeiro = painel.querySelector(
            "input:not([type=hidden]):not([hidden]), button:not([hidden]), select, [href]"
        );
        if (primeiro) setTimeout(function () { primeiro.focus(); }, 140);
    }

    function fechar(id) {
        var painel = document.getElementById(id);
        if (!painel) return;

        var fundo = fundoDe(id);
        painel.classList.remove("aberto");
        if (fundo) fundo.classList.remove("aberto");

        // Espera a transição terminar antes de esconder de verdade
        setTimeout(function () {
            painel.hidden = true;
            if (fundo) fundo.hidden = true;
        }, 240);

        var posicao = abertos.indexOf(id);
        if (posicao !== -1) abertos.splice(posicao, 1);

        if (!abertos.length) {
            document.body.style.overflow = "";
            if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
            focoAnterior = null;
        }
    }

    function fecharTopo() {
        if (abertos.length) fechar(abertos[abertos.length - 1]);
    }

    // Modal de confirmação

    var ID_MODAL = "modal-confirmar";
    var aoConfirmar = null;

    function garantirModal() {
        if (document.getElementById(ID_MODAL)) return;

        var fundo = document.createElement("div");
        fundo.className = "fundo-escuro";
        fundo.setAttribute("data-fundo", ID_MODAL);
        fundo.hidden = true;

        var modal = document.createElement("div");
        modal.className = "painel modal";
        modal.id = ID_MODAL;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "modal-titulo");
        modal.hidden = true;
        modal.innerHTML =
            '<div class="painel-alca"></div>' +
            '<h2 id="modal-titulo" style="margin:0 0 var(--e1)"></h2>' +
            '<p data-modal-texto class="legenda"></p>' +
            '<div class="acoes">' +
            '<button type="button" class="botao botao-suave" data-modal-cancelar>Cancelar</button>' +
            '<button type="button" class="botao botao-acao" data-modal-confirmar></button>' +
            "</div>";

        document.body.appendChild(fundo);
        document.body.appendChild(modal);

        modal.querySelector("[data-modal-cancelar]").addEventListener("click", function () {
            aoConfirmar = null;
            fechar(ID_MODAL);
        });

        modal.querySelector("[data-modal-confirmar]").addEventListener("click", function () {
            var acao = aoConfirmar;
            aoConfirmar = null;
            fechar(ID_MODAL);
            if (acao) acao();
        });
    }

    /* Nomeia o que vai acontecer, em vez de perguntar "tem certeza?".
       "Apagar o gasto Pizza de sexta?" diz o que está em jogo; "tem
       certeza?" faz a pessoa clicar no escuro. */
    function confirmar(opcoes) {
        garantirModal();
        var modal = document.getElementById(ID_MODAL);

        modal.querySelector("#modal-titulo").textContent = opcoes.titulo || "Confirmar";
        modal.querySelector("[data-modal-texto]").textContent = opcoes.texto || "";
        modal.querySelector("[data-modal-confirmar]").textContent =
            opcoes.confirmar || "Confirmar";

        aoConfirmar = opcoes.aoConfirmar || null;
        abrir(ID_MODAL);
    }

    // Ligações

    document.addEventListener("click", function (evento) {
        var abrirAlvo = evento.target.closest("[data-abrir-painel]");
        if (abrirAlvo) {
            abrir(abrirAlvo.dataset.abrirPainel);
            return;
        }

        var fecharAlvo = evento.target.closest("[data-fechar-painel]");
        if (fecharAlvo) {
            fechar(fecharAlvo.dataset.fecharPainel);
            return;
        }

        // Tocar fora do painel também fecha
        var fundo = evento.target.closest("[data-fundo]");
        if (fundo) {
            fechar(fundo.dataset.fundo);
            return;
        }

        if (evento.target.closest("[data-abrir-mais]")) abrir("menu-mais");
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") fecharTopo();
    });

    return {
        abrir: abrir,
        fechar: fechar,
        fecharTopo: fecharTopo,
        confirmar: confirmar,
    };
})(window);
