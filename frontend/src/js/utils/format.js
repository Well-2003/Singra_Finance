/* Singra - formatação e leitura de valores no navegador
   Dinheiro e datas no padrão brasileiro, mais a função que escapa texto
   antes de ele entrar no HTML.

   A moeda é sempre Real, em qualquer idioma da interface: o Singra opera no
   Brasil, e traduzir o texto da tela não muda o dinheiro de quem usa. */

window.Formato = (function (global) {
    "use strict";

    var MESES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
                 "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    var DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

    // Dinheiro

    function moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
        });
    }

    /* O mesmo número, sem o "R$", para dentro de um campo de digitação: o
       rótulo do campo já diz que é dinheiro, e o símbolo atrapalharia quem
       vai editar o valor. Não dá para tirar o prefixo com um replace: o
       navegador separa o símbolo do número com espaço fixo, e não com o
       espaço comum que estaria escrito no código. */
    function numero(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // Sem centavos, para o número grande do painel: "R$ 870"
    function moedaCurta(valor) {
        return "R$ " + Math.round(Number(valor || 0)).toLocaleString("pt-BR");
    }

    /* Lê o que a pessoa digitou. Aceita "1.234,56", "1234.56" e "R$ 45,90",
       porque cada um digita de um jeito e nenhum deles está errado. */
    function paraNumero(texto) {
        if (typeof texto === "number") return texto;
        var limpo = String(texto || "")
            .replace(/[^\d,.-]/g, "")
            .replace(/\./g, "")
            .replace(",", ".");
        var numero = Number(limpo);
        return Number.isFinite(numero) ? numero : null;
    }

    // Datas

    /* O idioma da interface manda no formato das datas, mas nunca no da
       moeda: o Singra opera no Brasil, e mudar de língua não muda o real
       em que os valores estão. */
    var LOCAIS = { pt: "pt-BR", en: "en-US", es: "es-ES" };

    function localeAtual() {
        var escolhido = global.Idioma && global.Idioma.atual();
        return LOCAIS[escolhido] || "pt-BR";
    }


    function hojeISO() {
        var agora = new Date();
        return [
            agora.getFullYear(),
            String(agora.getMonth() + 1).padStart(2, "0"),
            String(agora.getDate()).padStart(2, "0"),
        ].join("-");
    }

    /* Datas vindas da API são "2026-08-26". Montar com new Date(texto) leria
       como UTC e poderia voltar um dia no fuso do Brasil, então partimos o
       texto e montamos a data local na mão. */
    function paraData(iso) {
        if (!iso) return null;
        if (iso instanceof Date) return iso;
        var partes = String(iso).slice(0, 10).split("-");
        if (partes.length !== 3) return null;
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }

    function dataBR(iso) {
        var d = paraData(iso);
        if (!d) return "";
        return String(d.getDate()).padStart(2, "0") + "/" +
               String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    }

    /* "Hoje" e "Ontem" dizem mais que a data cheia para quem está
       conferindo o que acabou de registrar. */
    function diaAmigavel(iso) {
        var d = paraData(iso);
        if (!d) return "";
        var hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        var diferenca = Math.round((hoje - d) / 86400000);
        if (diferenca === 0) return "Hoje";
        if (diferenca === 1) return "Ontem";
        if (diferenca === -1) return "Amanhã";

        /* Em português a data é montada com as listas daqui, que dão o
           formato exato que o Singra usa. Nos outros idiomas quem monta é o
           próprio navegador: escrever à mão o nome dos meses em inglês e em
           espanhol seria manter três calendários. */
        if (localeAtual() !== "pt-BR") {
            return d.toLocaleDateString(localeAtual(), {
                weekday: "short", day: "numeric", month: "long",
            });
        }
        return DIAS[(d.getDay() + 6) % 7] + ", " + d.getDate() + " de " + MESES[d.getMonth() + 1];
    }

    function mesExtenso(ano, mes) {
        if (localeAtual() !== "pt-BR") {
            return new Date(ano, mes - 1, 1).toLocaleDateString(localeAtual(), {
                month: "long", year: "numeric",
            });
        }
        var nome = MESES[mes];
        return nome.charAt(0).toUpperCase() + nome.slice(1) + " de " + ano;
    }

    // Texto

    /* Escapa antes de qualquer texto entrar no HTML. Como as telas são
       montadas com innerHTML a partir do que a API devolve, uma descrição de
       gasto com "<" viraria marcação executável sem isto. */
    function escapar(valor) {
        if (valor === null || valor === undefined) return "";
        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Tira o acento, para a busca achar "orçamento" quem digitou "orcamento"
    function simplificar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    var FORMAS = {
        pix: "Pix",
        dinheiro: "Dinheiro",
        debito: "Débito",
        credito: "Crédito",
        boleto: "Boleto",
    };

    function formaPagamento(chave) {
        return FORMAS[chave] || "Pix";
    }

    return {
        moeda: moeda,
        moedaCurta: moedaCurta,
        numero: numero,
        paraNumero: paraNumero,
        hojeISO: hojeISO,
        paraData: paraData,
        dataBR: dataBR,
        diaAmigavel: diaAmigavel,
        mesExtenso: mesExtenso,
        escapar: escapar,
        simplificar: simplificar,
        formaPagamento: formaPagamento,
        FORMAS: FORMAS,
    };
})(window);
