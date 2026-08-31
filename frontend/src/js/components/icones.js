/* Singra - sprite de ícones
   Traço arredondado e desenho simples, sem biblioteca externa. O sprite é
   escrito no documento por JavaScript, e não carregado de um arquivo .svg,
   porque uma página aberta direto do disco (protocolo file://) não consegue
   buscar arquivos, e a documentação prevê abrir as páginas assim.

   Uso: <svg class="icone"><use href="#i-inicio"></use></svg>
   Para acrescentar um ícone, coloque mais um <symbol> na lista abaixo. */

(function (global) {
    "use strict";

    var SPRITE = [
        // Marca
        '<symbol id="i-logo" viewBox="0 0 24 24">',
        '<path d="M12 3v11"/><path d="M12 5.5 18.5 14H12"/>',
        '<path d="M3 18c1.5 1.6 3 1.6 4.5 0s3-1.6 4.5 0 3 1.6 4.5 0 3-1.6 4.5 0"/>',
        '</symbol>',

        // Navegação
        '<symbol id="i-inicio" viewBox="0 0 24 24">',
        '<path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
        '</symbol>',
        '<symbol id="i-historico" viewBox="0 0 24 24">',
        '<path d="M4.5 7h15M4.5 12h15M4.5 17h9"/>',
        '</symbol>',
        '<symbol id="i-graficos" viewBox="0 0 24 24">',
        '<path d="M5 20V11M12 20V4M19 20v-6"/>',
        '</symbol>',
        '<symbol id="i-orcamento" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/>',
        '</symbol>',
        '<symbol id="i-meta" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
        '<circle cx="12" cy="12" r="1"/>',
        '</symbol>',
        '<symbol id="i-calendario" viewBox="0 0 24 24">',
        '<path d="M4.5 6h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
        '<path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/>',
        '</symbol>',
        '<symbol id="i-ajuda" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8.5"/>',
        '<path d="M9.6 9.8A2.5 2.5 0 0 1 14.5 10c0 1.7-2.5 2-2.5 3.5"/><path d="M12 17h.01"/>',
        '</symbol>',
        '<symbol id="i-perfil" viewBox="0 0 24 24">',
        '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.6-3.6 4.1-5 7-5s5.4 1.4 7 5"/>',
        '</symbol>',
        '<symbol id="i-sair" viewBox="0 0 24 24">',
        '<path d="M14 8.5V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.5"/>',
        '<path d="M10 12h10M17 9l3 3-3 3"/>',
        '</symbol>',

        // Ações
        '<symbol id="i-mais" viewBox="0 0 24 24">',
        '<path d="M12 5.5v13M5.5 12h13"/>',
        '</symbol>',
        '<symbol id="i-menu" viewBox="0 0 24 24">',
        '<path d="M4 7h16M4 12h16M4 17h16"/>',
        "</symbol>",
        '<symbol id="i-mais-menu" viewBox="0 0 24 24">',
        '<circle cx="5.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/>',
        '<circle cx="18.5" cy="12" r="1.5"/>',
        '</symbol>',
        '<symbol id="i-fechar" viewBox="0 0 24 24">',
        '<path d="m6 6 12 12M18 6 6 18"/>',
        '</symbol>',
        '<symbol id="i-voltar" viewBox="0 0 24 24">',
        '<path d="m14.5 6-6 6 6 6"/>',
        '</symbol>',
        '<symbol id="i-avancar" viewBox="0 0 24 24">',
        '<path d="m9.5 6 6 6-6 6"/>',
        '</symbol>',
        '<symbol id="i-ok" viewBox="0 0 24 24">',
        '<path d="m5 13 4.5 4.5L19 7"/>',
        '</symbol>',
        '<symbol id="i-coracao" viewBox="0 0 24 24">',
        '<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"/>',
        '</symbol>',
        '<symbol id="i-alerta" viewBox="0 0 24 24">',
        '<path d="M12 4.5 21 20H3z"/><path d="M12 10.5v4M12 17.5h.01"/>',
        '</symbol>',
        '<symbol id="i-lupa" viewBox="0 0 24 24">',
        '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
        '</symbol>',
        '<symbol id="i-filtro" viewBox="0 0 24 24">',
        '<path d="M4 6h16l-6 7v6l-4-2v-4z"/>',
        '</symbol>',
        '<symbol id="i-lixeira" viewBox="0 0 24 24">',
        '<path d="M4.5 7h15M9.5 7V5h5v2"/><path d="M6.5 7 7.5 20h9L17.5 7"/>',
        '</symbol>',
        '<symbol id="i-baixar" viewBox="0 0 24 24">',
        '<path d="M12 4v11M8 11.5l4 4 4-4"/><path d="M4.5 19.5h15"/>',
        '</symbol>',
        '<symbol id="i-apagar-tecla" viewBox="0 0 24 24">',
        '<path d="M20 6H9.5L4 12l5.5 6H20a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/>',
        '<path d="m17 10-4 4M13 10l4 4"/>',
        '</symbol>',
        '<symbol id="i-toque" viewBox="0 0 24 24">',
        '<path d="M9 11V6.5a2 2 0 0 1 4 0V12"/>',
        '<path d="M13 10.5a2 2 0 0 1 4 0V16a5 5 0 0 1-5 5h-1a5 5 0 0 1-4.3-2.5L5 15l1-1.5 3 1.5"/>',
        '</symbol>',
        '<symbol id="i-cartao" viewBox="0 0 24 24">',
        '<path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
        '<path d="M3 10h18M7 14.5h3"/>',
        '</symbol>',
        '<symbol id="i-idioma" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/>',
        '<path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5z"/>',
        '</symbol>',

        // Categorias de gasto
        '<symbol id="i-moradia" viewBox="0 0 24 24">',
        '<path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
        '</symbol>',
        '<symbol id="i-alimentacao" viewBox="0 0 24 24">',
        '<path d="M4 9h16l-1.4 9.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8z"/>',
        '<path d="m9 9 3-6 3 6"/><path d="M10 13v3M14 13v3"/>',
        '</symbol>',
        '<symbol id="i-transporte" viewBox="0 0 24 24">',
        '<path d="M5 5h14a1 1 0 0 1 1 1v10H4V6a1 1 0 0 1 1-1z"/><path d="M4 11h16"/>',
        '<circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/>',
        '</symbol>',
        '<symbol id="i-saude" viewBox="0 0 24 24">',
        '<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"/>',
        '<path d="M12 11v3M10.5 12.5h3"/>',
        '</symbol>',
        '<symbol id="i-contas" viewBox="0 0 24 24">',
        '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9.5 8h5M9.5 12h5"/>',
        '</symbol>',
        '<symbol id="i-educacao" viewBox="0 0 24 24">',
        '<path d="m12 4 9 4-9 4-9-4z"/><path d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5"/>',
        '</symbol>',
        '<symbol id="i-dividas" viewBox="0 0 24 24">',
        '<path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
        '<path d="M3 10h18M7 14.5h3"/>',
        '</symbol>',
        '<symbol id="i-lazer" viewBox="0 0 24 24">',
        '<path d="M9 17V6l10-2v11"/><circle cx="7" cy="17.5" r="2.2"/>',
        '<circle cx="17" cy="15.5" r="2.2"/>',
        '</symbol>',
        '<symbol id="i-delivery" viewBox="0 0 24 24">',
        '<path d="M4 12h16a8 8 0 0 1-16 0z"/>',
        '<path d="M8 8.5c0-1 1-1.2 1-2.3M12 8.5c0-1 1-1.2 1-2.3M16 8.5c0-1 1-1.2 1-2.3"/>',
        '</symbol>',
        '<symbol id="i-compras" viewBox="0 0 24 24">',
        '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
        '</symbol>',
        '<symbol id="i-assinaturas" viewBox="0 0 24 24">',
        '<path d="M17 3.5 20 6.5l-3 3"/><path d="M20 6.5H9a4 4 0 0 0 0 8"/>',
        '<path d="M7 20.5 4 17.5l3-3"/><path d="M4 17.5h11a4 4 0 0 0 0-8"/>',
        '</symbol>',
        '<symbol id="i-beleza" viewBox="0 0 24 24">',
        '<path d="m11 3 1.7 4.3L17 9l-4.3 1.7L11 15l-1.7-4.3L5 9l4.3-1.7z"/>',
        '<path d="m17.5 14 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
        '</symbol>',
        '<symbol id="i-viagens" viewBox="0 0 24 24">',
        '<path d="M21 12 3 20l3-8-3-8z"/><path d="M6 12h15"/>',
        '</symbol>',
        '<symbol id="i-pets" viewBox="0 0 24 24">',
        '<circle cx="7" cy="9" r="1.9"/><circle cx="11" cy="6.5" r="1.9"/>',
        '<circle cx="16" cy="8" r="1.9"/>',
        '<path d="M8.5 15c1.2-2.2 5.3-2.2 6.5 0 1 1.9.3 4.5-1.7 4.5h-3.1C8.2 19.5 7.5 16.9 8.5 15z"/>',
        '</symbol>',
        '<symbol id="i-outros" viewBox="0 0 24 24">',
        '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/>',
        '<circle cx="18" cy="12" r="1.6"/>',
        '</symbol>',

        // Categorias de ganho
        '<symbol id="i-salario" viewBox="0 0 24 24">',
        '<path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>',
        '<path d="M3 8V6.5A2 2 0 0 1 5 4.5h11"/><circle cx="16.5" cy="13" r="1.2"/>',
        '</symbol>',
        '<symbol id="i-renda-extra" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8"/><path d="M12 8.5v7M8.5 12h7"/>',
        '</symbol>',
        '<symbol id="i-presente" viewBox="0 0 24 24">',
        '<path d="M4.5 11h15v8.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"/>',
        '<path d="M3.5 7.5h17V11h-17z"/><path d="M12 7.5v13"/>',
        '<path d="M12 7.5S10.6 3.6 8.6 4.5 9.6 7.5 12 7.5zM12 7.5s1.4-3.9 3.4-3-.6 3-3.4 3z"/>',
        '</symbol>',
        '<symbol id="i-reembolso" viewBox="0 0 24 24">',
        '<circle cx="12" cy="12" r="8"/><path d="M15 12H9M11.5 9 9 12l2.5 3"/>',
        '</symbol>',
        '<symbol id="i-rendimento" viewBox="0 0 24 24">',
        '<path d="m3 17 6-6 4 4 8-8"/><path d="M16 7h5v5"/>',
        '</symbol>',

        // Ícones de meta
        '<symbol id="i-reserva" viewBox="0 0 24 24">',
        '<path d="M12 3.5 20 6.5v6c0 5-3.6 8.2-8 9.2-4.4-1-8-4.2-8-9.2v-6z"/>',
        '<path d="m9 12 2.2 2.2L15.5 10"/>',
        '</symbol>',
        '<symbol id="i-casa-nova" viewBox="0 0 24 24">',
        '<path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>',
        '<path d="M10 21v-5h4v5"/>',
        '</symbol>',
        '<symbol id="i-estudo" viewBox="0 0 24 24">',
        '<path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/>',
        '<path d="M8 19.5a3 3 0 0 1 0-6h10"/>',
        '</symbol>',

        /* Figuras das telas vazias. Maiores e mais soltas que os ícones:
           não são botão nem rótulo, são o desenho que ocupa o lugar do que
           ainda não existe. Uma tela vazia com um desenho parece um começo;
           sem ele, parece defeito. */
        '<symbol id="i-vazio-registros" viewBox="0 0 48 48">',
        '<path d="M11 8h20l6 6v26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/>',
        '<path d="M31 8v6h6"/><path d="M15 24h14M15 31h9"/>',
        '<circle cx="35" cy="33" r="7"/><path d="M35 30v6M32 33h6"/>',
        '</symbol>',
        '<symbol id="i-vazio-metas" viewBox="0 0 48 48">',
        '<circle cx="24" cy="26" r="14"/><circle cx="24" cy="26" r="7.5"/>',
        '<circle cx="24" cy="26" r="1.6"/>',
        '<path d="M24 26 39 11M34 8l5 3 -3 5"/>',
        '</symbol>',
        '<symbol id="i-vazio-contas" viewBox="0 0 48 48">',
        '<path d="M9 12h30a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"/>',
        '<path d="M16 7v8M32 7v8M7 21h34"/><path d="m19 30 3.5 3.5L30 26"/>',
        '</symbol>',
        '<symbol id="i-vazio-graficos" viewBox="0 0 48 48">',
        '<path d="M9 9v30h30"/>',
        '<path d="M16 32V24M24 32V14M32 32v-5M40 32V19"/>',
        '<path d="M14 19 24 9l7 7 9-9"/>',
        '</symbol>',
        '<symbol id="i-vazio-planejamento" viewBox="0 0 48 48">',
        '<circle cx="24" cy="24" r="15"/>',
        '<path d="M24 9v15l10 7"/>',
        '<path d="M39 24h-4M13 24H9M24 39v-4"/>',
        '</symbol>',
        '<symbol id="i-vazio-busca" viewBox="0 0 48 48">',
        '<circle cx="21" cy="21" r="13"/><path d="m30.5 30.5 9 9"/>',
        '<path d="M15 21h12"/>',
        '</symbol>',
    ].join("");

    /* Monta um <svg><use></use></svg> apontando para um símbolo do sprite.
       O ícone é sempre decorativo: quem lê a tela recebe o texto ao lado,
       e quando não há texto quem chama passa um rótulo. */
    function icone(nome, classe, rotulo) {
        var atributos = rotulo
            ? 'role="img" aria-label="' + rotulo + '"'
            : 'aria-hidden="true" focusable="false"';
        return '<svg class="' + (classe || "icone") + '" ' + atributos +
               '><use href="#i-' + nome + '"></use></svg>';
    }

    function instalar() {
        if (document.getElementById("sprite-singra")) return;
        var caixa = document.createElement("div");
        caixa.id = "sprite-singra";
        caixa.setAttribute("aria-hidden", "true");
        caixa.style.display = "none";
        caixa.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg"><defs>' + SPRITE + "</defs></svg>";
        document.body.insertBefore(caixa, document.body.firstChild);
    }

    global.SingraIcones = { icone: icone, instalar: instalar };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", instalar);
    } else {
        instalar();
    }
})(window);
