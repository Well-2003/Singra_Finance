/* Singra - primeiros passos
   Seis perguntas, uma por tela. Nenhuma é obrigatória: dá para chegar ao
   painel pulando todas.

   As respostas ficam guardadas aqui e só vão para a API no fim, de uma vez.
   São seis passos, e mandar um pedido a cada passo faria a pessoa esperar
   seis vezes o cold start do servidor logo no primeiro acesso, justamente
   o momento em que ela ainda está decidindo se fica. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");
    var barra = document.querySelector("[data-passos]");
    var contador = document.querySelector("[data-contador]");

    var respostas = {};
    var passo = 1;

    var CADENCIAS = [
        ["diaria", "Diária", "todo dia"],
        ["semanal", "Semanal", "toda semana"],
        ["mensal", "Mensal", "todo mês"],
        ["anual", "Anual", "no ano"],
    ];

    var EXTRAS = [
        ["bico", "Bico"],
        ["freela", "Freela"],
        ["venda", "Venda"],
        ["outro", "Outro"],
    ];

    // Telas

    function tela1() {
        var atual = respostas.apelido || global.Sessao.apelido() || "";
        return {
            titulo: "Como você quer ser chamado?",
            apoio: "É o nome que vai aparecer na saudação do painel.",
            corpo: '<div class="campo">' +
                '<label class="so-leitor" for="ob-apelido">Seu apelido</label>' +
                '<input type="text" id="ob-apelido" maxlength="40" ' +
                    'autocomplete="nickname" placeholder="Renata" value="' +
                    F.escapar(atual) + '"></div>',
            aoAvancar: function () {
                var valor = document.getElementById("ob-apelido").value.trim();
                if (valor) respostas.apelido = valor;
            },
        };
    }

    function tela2() {
        var variavel = respostas.renda_variavel === true;
        return {
            titulo: "Como é a sua renda?",
            apoio: "Isso ajuda a sugerir um planejamento no seu tamanho.",
            corpo:
                '<div class="empilhado-largo">' +
                    '<button type="button" class="cartao cartao-toque' +
                        (variavel ? "" : " marcar") + '" data-renda="fixa">' +
                        "<strong>Tenho um valor fixo todo mês</strong>" +
                        '<span class="legenda">Salário, aposentadoria, pensão</span>' +
                    "</button>" +
                    '<button type="button" class="cartao cartao-toque' +
                        (variavel ? " marcar" : "") + '" data-renda="variavel">' +
                        "<strong>Sou autônomo(a), varia</strong>" +
                        '<span class="legenda">Uns meses mais, outros menos</span>' +
                    "</button></div>" +

                '<div class="campo" style="margin-top:var(--e3)">' +
                    '<label for="ob-renda" data-rotulo-renda>' +
                        (variavel ? "Quanto entra, em média, por mês?"
                                  : "Quanto entra por mês?") + "</label>" +
                    '<input type="text" id="ob-renda" inputmode="decimal" ' +
                        'placeholder="0,00" value="' +
                        (respostas.renda ? F.numero(respostas.renda) : "") +
                        '">' +
                    '<span class="dica-campo">Não precisa ser exato, é só para ' +
                        "começar.</span></div>",
            aoAvancar: function () {
                var valor = F.paraNumero(document.getElementById("ob-renda").value);
                if (valor && valor > 0) respostas.renda = valor;
            },
        };
    }

    function tela3() {
        var tem = !!respostas.renda_extra_tipo;
        return {
            titulo: "Você costuma ter alguma renda extra?",
            apoio: "Bico, freela, uma venda de vez em quando.",
            corpo:
                '<div class="chips" data-extra-sim-nao>' +
                    '<button type="button" class="chip' + (tem ? " ativo" : "") +
                        '" data-extra="sim">Sim, tenho</button>' +
                    '<button type="button" class="chip' + (tem ? "" : " ativo") +
                        '" data-extra="nao">Não tenho</button></div>' +

                '<div data-bloco-extra' + (tem ? "" : " hidden") +
                     ' style="margin-top:var(--e3)">' +
                    '<fieldset class="campo" style="border:0;padding:0">' +
                        '<legend class="rotulo">De que tipo?</legend>' +
                        '<div class="chips" data-tipo-extra>' +
                            EXTRAS.map(function (e) {
                                return '<button type="button" class="chip' +
                                    (respostas.renda_extra_tipo === e[0] ? " ativo" : "") +
                                    '" data-extra-tipo="' + e[0] + '">' + e[1] +
                                    "</button>";
                            }).join("") + "</div></fieldset>" +

                    '<div class="campo">' +
                        '<label for="ob-extra-valor">Quanto costuma vir? (opcional)</label>' +
                        '<input type="text" id="ob-extra-valor" inputmode="decimal" ' +
                            'placeholder="0,00" value="' +
                            (respostas.renda_extra_valor
                                ? F.numero(respostas.renda_extra_valor)
                                : "") + '"></div>' +

                    '<p class="legenda">Esse valor é só um lembrete seu. Ele não entra ' +
                        "no cálculo do quanto você pode gastar — a renda extra só conta " +
                        "quando o dinheiro cai de verdade e você registra o ganho.</p>" +
                "</div>",
            aoAvancar: function () {
                var bloco = document.querySelector("[data-bloco-extra]");
                if (bloco.hidden) {
                    delete respostas.renda_extra_tipo;
                    delete respostas.renda_extra_valor;
                    return;
                }
                var marcado = bloco.querySelector("[data-extra-tipo].ativo");
                respostas.renda_extra_tipo = marcado ? marcado.dataset.extraTipo : "outro";
                var valor = F.paraNumero(document.getElementById("ob-extra-valor").value);
                if (valor && valor > 0) respostas.renda_extra_valor = valor;
            },
        };
    }

    function tela4() {
        return {
            titulo: "Quanto você quer guardar ou investir por mês?",
            apoio: "Pode ser pouco. O que importa é começar.",
            corpo: '<div class="campo">' +
                '<label class="so-leitor" for="ob-investir">Valor que quero guardar</label>' +
                '<input type="text" id="ob-investir" inputmode="decimal" ' +
                    'placeholder="0,00" value="' +
                    (respostas.investimento_valor
                        ? F.numero(respostas.investimento_valor)
                        : "") + '">' +
                '<span class="dica-campo">Se pular, a área de investimento nem ' +
                    "aparece no seu painel. Dá para ligar depois em Metas.</span></div>",
            pular: "Ainda não sei, pular por enquanto",
            aoAvancar: function () {
                var valor = F.paraNumero(document.getElementById("ob-investir").value);
                if (valor && valor > 0) {
                    respostas.investimento_valor = valor;
                    // Já deixa uma cadência escolhida: quem pular o passo
                    // seguinte ficaria com um valor sem período nenhum, e a
                    // meta não seria criada
                    respostas.investimento_cadencia =
                        respostas.investimento_cadencia || "mensal";
                } else {
                    delete respostas.investimento_valor;
                    delete respostas.investimento_cadencia;
                }
            },
        };
    }

    function tela5() {
        var escolhida = respostas.investimento_cadencia || "mensal";
        return {
            titulo: "Com que frequência quer acompanhar essa meta?",
            apoio: "Dá para trocar quando quiser, em Metas.",
            corpo: '<div class="chips" data-cadencia>' +
                CADENCIAS.map(function (c) {
                    return '<button type="button" class="chip' +
                        (c[0] === escolhida ? " ativo" : "") + '" data-cadencia-op="' +
                        c[0] + '">' + c[1] + "</button>";
                }).join("") + "</div>" +
                '<p class="legenda" style="margin-top:var(--e2)">Guardar ' +
                    F.moeda(respostas.investimento_valor || 0) + " <span data-quando>" +
                    "todo mês</span>.</p>",
            aoAvancar: function () {
                var marcada = document.querySelector("[data-cadencia-op].ativo");
                respostas.investimento_cadencia = marcada
                    ? marcada.dataset.cadenciaOp : "mensal";
            },
        };
    }

    function tela6() {
        var temRenda = respostas.renda > 0;
        return {
            titulo: "Quer que a gente sugira um planejamento?",
            apoio: temRenda
                ? "A gente divide sua renda em 50% para o essencial, 30% para o que " +
                  "você escolhe e 20% para guardar. Depois é só ajustar."
                : "Para sugerir, a gente precisaria saber quanto entra por mês. " +
                  "Sem problema: você pode montar o seu planejamento na mão, quando " +
                  "quiser, na tela Planejamento.",
            corpo: temRenda
                ? '<div class="empilhado-largo">' +
                      '<button type="button" class="cartao cartao-toque" ' +
                          'data-sugestao="sim"><strong>Sim, pode sugerir</strong>' +
                          '<span class="legenda">Um ponto de partida, não uma ' +
                              "regra</span></button>" +
                      '<button type="button" class="cartao cartao-toque" ' +
                          'data-sugestao="nao"><strong>Não, prefiro montar depois' +
                          "</strong><span class=\"legenda\">Você vai direto para o " +
                          "Início</span></button></div>"
                : "",
            avancar: temRenda ? null : "Ir para o meu painel",
            aoAvancar: function () { respostas.sugerir_orcamento = false; },
        };
    }

    // O passo 5 só existe se a pessoa informou um valor no passo 4
    function telas() {
        var lista = [tela1, tela2, tela3, tela4];
        if (respostas.investimento_valor) lista.push(tela5);
        lista.push(tela6);
        return lista;
    }

    // Desenho

    function desenhar() {
        var lista = telas();
        var total = lista.length;
        if (passo > total) passo = total;
        var tela = lista[passo - 1]();

        barra.innerHTML = "";
        for (var i = 1; i <= total; i += 1) {
            barra.insertAdjacentHTML("beforeend",
                '<span class="passo-marca' + (i <= passo ? " feito" : "") + '"></span>');
        }
        contador.innerHTML = "<span>Passo</span> " + passo +
                            " <span>de</span> " + total;

        alvo.innerHTML =
            "<h1>" + tela.titulo + "</h1>" +
            '<p class="legenda">' + tela.apoio + "</p>" +
            '<div style="margin-top:var(--e3)">' + tela.corpo + "</div>" +
            '<div class="linha" style="margin-top:var(--e3);flex-wrap:wrap">' +
                (passo > 1
                    ? '<button type="button" class="botao botao-texto" data-voltar>' +
                      icone("voltar") + " Voltar</button>"
                    : "") +
                (tela.avancar === null
                    ? ""
                    : '<button type="button" class="botao botao-acao crescer" ' +
                      "data-avancar>" +
                      (tela.avancar || (passo === total ? "Concluir" : "Continuar")) +
                      "</button>") +
            "</div>" +
            '<button type="button" class="botao botao-texto botao-largo" data-pular>' +
                (tela.pular || "Pular esta pergunta") + "</button>" +
            '<button type="button" class="botao botao-texto botao-largo" ' +
                'data-pular-tudo style="margin-top:var(--e1)">' +
                "Pular tudo e ir para o painel</button>" +
            '<p class="aviso-campo" data-erro-onboarding hidden></p>';

        alvo.dataset.passoAtual = passo;
        alvo.aoAvancar = tela.aoAvancar;

        var primeiro = alvo.querySelector("input");
        if (primeiro) primeiro.focus();
    }

    // Envio

    async function concluir(sugerir) {
        var botoes = alvo.querySelectorAll("button");
        botoes.forEach(function (b) { b.disabled = true; });

        var envio = Object.assign({}, respostas, {
            concluir: true,
            sugerir_orcamento: !!sugerir,
        });

        var r = await global.ApiPerfil.onboarding(envio);
        if (!r.ok) {
            botoes.forEach(function (b) { b.disabled = false; });
            var aviso = document.querySelector("[data-erro-onboarding]");
            aviso.textContent = r.mensagem;
            aviso.hidden = false;
            return;
        }

        /* Quem pediu a sugestão vai direto ver o planejamento montado: é o
           único jeito de a pessoa entender o que acabou de acontecer. */
        global.location.href = sugerir ? "orcamento.html" : "dashboard.html";
    }

    function avancar(guardando) {
        if (guardando && alvo.aoAvancar) alvo.aoAvancar();

        // A lista pode ter mudado de tamanho: informar um valor no passo 4
        // faz o passo da cadência aparecer
        if (passo >= telas().length) return concluir(respostas.sugerir_orcamento);

        passo += 1;
        desenhar();
        return undefined;
    }

    // Cliques

    alvo.addEventListener("click", function (evento) {
        var renda = evento.target.closest("[data-renda]");
        if (renda) {
            var variavel = renda.dataset.renda === "variavel";
            respostas.renda_variavel = variavel;
            alvo.querySelectorAll("[data-renda]").forEach(function (b) {
                b.classList.toggle("marcar", b === renda);
            });
            document.querySelector("[data-rotulo-renda]").textContent = variavel
                ? "Quanto entra, em média, por mês?"
                : "Quanto entra por mês?";
            return;
        }

        var extra = evento.target.closest("[data-extra]");
        if (extra) {
            var temExtra = extra.dataset.extra === "sim";
            alvo.querySelectorAll("[data-extra]").forEach(function (b) {
                b.classList.toggle("ativo", b === extra);
            });
            document.querySelector("[data-bloco-extra]").hidden = !temExtra;
            return;
        }

        var tipoExtra = evento.target.closest("[data-extra-tipo]");
        if (tipoExtra) {
            alvo.querySelectorAll("[data-extra-tipo]").forEach(function (b) {
                b.classList.toggle("ativo", b === tipoExtra);
            });
            return;
        }

        var cadencia = evento.target.closest("[data-cadencia-op]");
        if (cadencia) {
            alvo.querySelectorAll("[data-cadencia-op]").forEach(function (b) {
                b.classList.toggle("ativo", b === cadencia);
            });
            var quando = document.querySelector("[data-quando]");
            CADENCIAS.forEach(function (c) {
                if (c[0] === cadencia.dataset.cadenciaOp) quando.textContent = c[2];
            });
            return;
        }

        var sugestao = evento.target.closest("[data-sugestao]");
        if (sugestao) {
            respostas.sugerir_orcamento = sugestao.dataset.sugestao === "sim";
            concluir(respostas.sugerir_orcamento);
            return;
        }

        if (evento.target.closest("[data-avancar]")) return avancar(true);

        if (evento.target.closest("[data-pular]")) return avancar(false);

        if (evento.target.closest("[data-voltar]")) {
            if (alvo.aoAvancar) alvo.aoAvancar();   // não perde o que já foi digitado
            passo = Math.max(1, passo - 1);
            desenhar();
            return undefined;
        }

        if (evento.target.closest("[data-pular-tudo]")) {
            // Pular tudo também conclui: senão a pessoa cairia aqui de novo
            // no próximo login
            return concluir(false);
        }

        return undefined;
    });

    // Enter avança, para quem está preenchendo pelo teclado
    alvo.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" && evento.target.matches("input")) {
            evento.preventDefault();
            avancar(true);
        }
    });

    desenhar();
})(window);
