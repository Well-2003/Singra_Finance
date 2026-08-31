/* Singra - confirmações e avisos
   Toda ação recebe uma resposta visível, que aparece e some sozinha.

   Os avisos se empilham em vez de um substituir o outro: duas ações
   seguidas, salvar um gasto e apagar outro, precisam das duas
   confirmações, e não só da última.

   Uso:
       Avisos.mostrar("Pronto! Gasto registrado.");
       Avisos.problema("Não conseguimos salvar agora.");
       Avisos.atencao("Essa conta já estava paga.");  */

window.Avisos = (function (global) {
    "use strict";

    var SEGUNDOS_NA_TELA = 3.2;

    function pilha() {
        var caixa = document.querySelector(".pilha-avisos");
        if (!caixa) {
            caixa = document.createElement("div");
            caixa.className = "pilha-avisos";
            // O leitor de tela anuncia sem tirar o foco de onde a pessoa está
            caixa.setAttribute("role", "status");
            caixa.setAttribute("aria-live", "polite");
            document.body.appendChild(caixa);
        }
        return caixa;
    }

    function icone(nome) {
        return global.SingraIcones ? global.SingraIcones.icone(nome) : "";
    }

    function criar(mensagem, tipo, nomeIcone) {
        if (!mensagem) return;

        var aviso = document.createElement("div");
        aviso.className = "aviso-flutuante" + (tipo ? " aviso-flutuante-" + tipo : "");
        aviso.innerHTML = icone(nomeIcone) +
            "<span>" + global.Formato.escapar(mensagem) + "</span>";

        pilha().appendChild(aviso);

        setTimeout(function () {
            aviso.classList.add("saindo");
            // Espera a transição terminar antes de tirar do documento
            setTimeout(function () { aviso.remove(); }, 250);
        }, SEGUNDOS_NA_TELA * 1000);
    }

    function mostrar(mensagem) { criar(mensagem, "", "ok"); }
    function problema(mensagem) { criar(mensagem, "problema", "fechar"); }
    function atencao(mensagem) { criar(mensagem, "atencao", "alerta"); }

    /* Atalho para o retorno da API, que já vem com ok e mensagem prontos:
       acerta sozinho entre confirmação e problema. */
    function daResposta(resposta) {
        if (!resposta || !resposta.mensagem) return;
        if (resposta.ok) mostrar(resposta.mensagem);
        else problema(resposta.mensagem);
    }

    return {
        mostrar: mostrar,
        problema: problema,
        atencao: atencao,
        daResposta: daResposta,
    };
})(window);
