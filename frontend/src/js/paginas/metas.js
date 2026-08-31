/* Singra - metas
   Metas comuns, a meta especial de investimento e a sugestão de reserva de
   emergência. Guardar dinheiro atualiza o círculo sem recarregar a página. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");

    var ICONES = ["meta", "reserva", "casa-nova", "viagens", "estudo",
                  "transporte", "presente", "compras"];
    var CADENCIAS = [["diaria", "Diária"], ["semanal", "Semanal"],
                     ["mensal", "Mensal"], ["anual", "Anual"]];

    var metaAtual = null;   // qual meta o painel de guardar está editando

    /* A sugestão de reserva pode ser dispensada de vez.

       Reserva de emergência é conselho, não obrigação: quem já tem a sua
       fora do Singra, ou simplesmente não quer uma agora, não deveria
       reencontrar o mesmo cartão toda vez que abre a tela. A escolha fica
       no navegador, presa ao id de quem entrou, é preferência de tela, não
       dado financeiro, e não vale uma coluna no banco. Quem mudar de ideia
       cria a meta pelo "+ Nova meta", como qualquer outra. */
    var CHAVE_RESERVA = "singra:reserva-dispensada:";

    function chaveReserva() {
        var usuario = global.Sessao.usuario() || {};
        return CHAVE_RESERVA + (usuario.id || "0");
    }

    function reservaDispensada() {
        try {
            return localStorage.getItem(chaveReserva()) === "1";
        } catch (erro) {
            return false;
        }
    }

    function dispensarReserva() {
        try {
            localStorage.setItem(chaveReserva(), "1");
        } catch (erro) {
            /* segue sem lembrar; o cartão volta na próxima visita */
        }
    }

    function cartaoReserva(s) {
        if (!s || reservaDispensada()) return "";
        var explicacao = s.estimada
            ? "Estimamos a partir da renda que você informou: cerca de " +
              F.moeda(s.media) + " por mês de gastos essenciais."
            : "São " + s.meses + " meses dos seus gastos essenciais, que têm dado cerca de " +
              F.moeda(s.media) + " por mês.";

        return '<section class="cartao cartao-destaque alerta-sobra" ' +
            'style="margin-bottom:var(--e2)">' +
            '<button type="button" class="alerta-fechar" data-dispensar-reserva ' +
                'aria-label="Dispensar a sugestão de reserva">' +
                icone("fechar") + "</button>" +
            '<div class="linha" style="align-items:flex-start">' +
                '<span class="bolha bolha-grande" style="--cor-cat: #9CAF88">' +
                    icone("reserva", "icone icone-grande") + "</span>" +
                '<div class="crescer">' +
                    "<h2>Sua reserva de emergência ideal é " + F.moeda(s.valor) + "</h2>" +
                    '<p class="legenda">' + explicacao + " É o dinheiro para imprevistos: " +
                    "perder o emprego, um problema de saúde, o carro quebrar.</p>" +
                    '<button type="button" class="botao botao-acao" data-criar-reserva ' +
                        'data-valor="' + s.valor + '" style="margin-top:var(--e2)">' +
                        "Criar essa meta</button>" +
                "</div></div></section>";
    }

    /* A seção de investimento não aparece zerada: sem a meta, mostra só um
       convite discreto. Um cartão com zeros é lido como erro. */
    function secaoInvestimento(i) {
        if (!i) {
            return '<section class="cartao" style="margin-bottom:var(--e2)">' +
                '<div class="linha"><span class="bolha" style="--cor-cat: #7FA9A3">' +
                    icone("rendimento") + "</span>" +
                '<div class="crescer"><strong>Quer começar a guardar dinheiro ' +
                    "com um objetivo?</strong><br>" +
                    '<span class="item-apoio">Você escolhe quanto e com que frequência. ' +
                    "Nada sai do seu disponível sem você mandar.</span></div>" +
                '<button type="button" class="botao botao-contorno" data-abrir-painel=' +
                    '"painel-investimento">Criar meta de investimento</button></div></section>';
        }

        return '<section class="cartao cartao-destaque" style="margin-bottom:var(--e2)">' +
            '<div class="cartao-titulo"><h2>Investimento</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-abrir-painel="painel-investimento">Editar meta</button></div>' +
            '<div class="linha">' +
                '<span class="circulo" style="--pct:' + i.pct + '" data-pct="' + i.pct + '%"></span>' +
                '<div class="crescer"><strong>' + F.moeda(i.guardado) +
                    "</strong> <span>de</span> " + F.moeda(i.alvo) + " " +
                    F.escapar(i.rotulo_periodo) + "<br>" +
                    '<span class="item-apoio">' +
                    (i.falta > 0 ? "Faltam " + F.moeda(i.falta) : "Meta batida. Muito bem.") +
                    " &middot; total guardado: " + F.moeda(i.total_guardado) + "</span></div>" +
                '<button type="button" class="botao botao-acao" data-guardar="' +
                    i.meta_id + '" data-nome="' + F.escapar(i.nome) + '" ' +
                    'aria-label="Guardar dinheiro na meta de investimento">' +
                    "Guardar dinheiro</button>" +
            "</div></section>";
    }

    function cartaoMeta(m) {
        return '<section class="cartao cartao-meta' +
            (m.concluida ? " meta-conquistada" : "") + '">' +
            '<span class="circulo" style="--pct:' + m.pct + '" data-pct="' + m.pct + '%" ' +
                'data-circulo="' + m.id + '"></span>' +
            '<div class="crescer">' +
                '<div class="linha-entre"><h2 style="margin:0">' + F.escapar(m.nome) + "</h2>" +
                (m.concluida
                    ? '<span class="selo-conquista">' + icone("ok") + " Conquistada 🎉</span>"
                    : "") + "</div>" +
                '<p class="legenda" style="margin:4px 0 0">' +
                    '<strong data-guardado="' + m.id + '">' + F.moeda(m.guardado) +
                    "</strong> <span>de</span> " + F.moeda(m.valor_alvo) +
                    (m.prazo ? " &middot; até " + F.dataBR(m.prazo) : "") + "</p>" +
                (m.concluida ? "" :
                    '<p class="legenda" data-falta="' + m.id + '">Faltam ' +
                        F.moeda(m.falta) + "</p>" +
                    '<button type="button" class="botao botao-acao" ' +
                        'style="margin-top:var(--e1)" data-guardar="' + m.id + '" ' +
                        'data-nome="' + F.escapar(m.nome) + '" ' +
                        'aria-label="Guardar dinheiro em ' + F.escapar(m.nome) + '">' +
                        "Guardar dinheiro</button>") +
                '<div><button type="button" class="botao botao-texto" ' +
                    'data-apagar-meta="' + m.id + '" data-nome="' + F.escapar(m.nome) +
                    '" aria-label="Apagar a meta ' + F.escapar(m.nome) + '">' +
                    "Apagar meta</button></div>" +
            "</div></section>";
    }

    function desenhar(dados) {
        var lista = dados.itens.length
            ? '<div class="grade-2">' + dados.itens.map(cartaoMeta).join("") + "</div>"
            : '<div class="cartao"><div class="vazio">' +
              '<svg class="vazio-figura" aria-hidden="true">' +
                  '<use href="#i-vazio-metas"></use></svg>' +
              "<h3>Você ainda não tem metas</h3>" +
              "<p>Um celular novo, uma viagem, uma reserva para imprevistos. " +
              "O que você quer conquistar?</p>" +
              '<button type="button" class="botao botao-acao" data-abrir-painel="painel-nova-meta">' +
              "Criar minha primeira meta</button></div></div>";

        // Com a lista cheia, o convite para criar sai do estado vazio e vira
        // um botão acima dos cartões: sem ele não haveria por onde criar a
        // segunda meta
        var acao = dados.itens.length
            ? '<div class="linha" style="margin-bottom:var(--e2)">' +
              '<button type="button" class="botao botao-suave" ' +
              'data-abrir-painel="painel-nova-meta">+ Nova meta</button></div>'
            : "";

        alvo.className = "";
        alvo.innerHTML = cartaoReserva(dados.reserva_sugerida) +
                         secaoInvestimento(dados.investimento) + acao + lista;
    }

    async function carregar() {
        var r = await global.ApiPlanejamento.listarMetas();
        if (!r.ok) return;
        desenhar(r);
        // Preenche o painel de investimento com o que já existe
        var i = r.investimento;
        document.getElementById("inv-valor").value = i ? i.alvo : "";
        if (i) {
            document.querySelectorAll("[data-cadencia]").forEach(function (b) {
                b.setAttribute("aria-pressed", String(b.dataset.cadencia === i.cadencia));
            });
        }
        document.querySelector("[data-titulo-investimento]").textContent =
            i ? "Editar meta de investimento" : "Nova meta de investimento";
        document.querySelector("[data-investimento-id]").value = i ? i.meta_id : "";
    }

    // Painéis

    function painelNovaMeta() {
        var icones = ICONES.map(function (chave, indice) {
            return '<input type="radio" name="icone" id="ic-' + chave + '" value="' + chave +
                   '"' + (indice === 0 ? " checked" : "") + ">" +
                   '<label for="ic-' + chave + '">' + icone(chave, "icone icone-grande") +
                   '<span class="so-leitor">' + chave + "</span></label>";
        }).join("");

        return '<div class="fundo-escuro" data-fundo="painel-nova-meta" hidden></div>' +
        '<div class="painel" id="painel-nova-meta" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-nova-meta" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-nova-meta" style="margin:0">Nova meta</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-nova-meta" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            '<form data-form-meta>' +
                '<div class="campo"><label for="meta-nome">O que você quer conquistar?</label>' +
                    '<input type="text" id="meta-nome" maxlength="80" required ' +
                        'placeholder="Celular novo"></div>' +
                '<div class="campo"><label for="meta-valor">Quanto custa?</label>' +
                    '<input type="text" id="meta-valor" inputmode="decimal" required ' +
                        'placeholder="2.500,00"></div>' +
                '<div class="campo"><label for="meta-prazo">Até quando? (opcional)</label>' +
                    '<input type="date" id="meta-prazo"></div>' +
                '<fieldset style="border:0;padding:0;margin:0 0 var(--e2)">' +
                    '<legend class="rotulo">Escolha um desenho</legend>' +
                    '<div class="grade-icones">' + icones + "</div></fieldset>" +
                '<button type="submit" class="botao botao-acao botao-largo">Criar meta</button>' +
                '<p class="aviso-campo" data-erro-meta hidden></p>' +
            "</form></div>";
    }

    function painelInvestimento() {
        var cadencias = CADENCIAS.map(function (c, indice) {
            return '<button type="button" class="chip" data-cadencia="' + c[0] + '" ' +
                   'aria-pressed="' + (indice === 2) + '">' + c[1] + "</button>";
        }).join("");

        return '<div class="fundo-escuro" data-fundo="painel-investimento" hidden></div>' +
        '<div class="painel" id="painel-investimento" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-investimento" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-investimento" data-titulo-investimento style="margin:0">' +
                    "Nova meta de investimento</h2>" +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-investimento" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            '<p class="legenda">Este valor nunca sai do seu disponível sozinho. ' +
                "Ele só se move quando você toca em Guardar dinheiro.</p>" +
            '<form data-form-investimento>' +
                '<input type="hidden" data-investimento-id value="">' +
                '<div class="campo"><label for="inv-valor">Quanto quer guardar por período?' +
                    '</label><input type="text" id="inv-valor" inputmode="decimal" required ' +
                        'placeholder="500,00"></div>' +
                '<fieldset style="border:0;padding:0;margin:0 0 var(--e2)">' +
                    '<legend class="rotulo">Com que frequência?</legend>' +
                    '<div class="chips">' + cadencias + "</div></fieldset>" +
                '<button type="submit" class="botao botao-acao botao-largo">Salvar meta</button>' +
                '<p class="aviso-campo" data-erro-investimento hidden></p>' +
            "</form></div>";
    }

    function painelGuardar() {
        return '<div class="fundo-escuro" data-fundo="painel-guardar" hidden></div>' +
        '<div class="painel" id="painel-guardar" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-guardar" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-guardar" style="margin:0">Guardar dinheiro</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-guardar" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            '<p class="legenda" data-guardar-nome></p>' +
            '<form data-form-guardar>' +
                '<div class="campo"><label for="valor-guardar">Quanto você guardou?</label>' +
                    '<input type="text" id="valor-guardar" inputmode="decimal" required ' +
                        'placeholder="100,00"></div>' +
                '<button type="submit" class="botao botao-acao botao-largo">Guardar</button>' +
                '<p class="aviso-campo" data-erro-guardar hidden></p>' +
            "</form></div>";
    }

    document.body.insertAdjacentHTML("beforeend",
        painelNovaMeta() + painelInvestimento() + painelGuardar());

    // Ações

    function erro(seletor, mensagem) {
        var campo = document.querySelector(seletor);
        campo.textContent = mensagem;
        campo.hidden = false;
    }

    document.addEventListener("submit", async function (evento) {
        var form = evento.target;
        evento.preventDefault();
        var botao = form.querySelector("[type=submit]");

        if (form.matches("[data-form-meta]")) {
            document.querySelector("[data-erro-meta]").hidden = true;
            var valor = F.paraNumero(document.getElementById("meta-valor").value);
            if (!valor || valor <= 0) {
                return erro("[data-erro-meta]", "Quanto custa o que você quer conquistar?");
            }
            global.Carregando.ocupado(botao, true, "Criando…");
            var r = await global.ApiPlanejamento.criarMeta({
                nome: document.getElementById("meta-nome").value.trim(),
                valor_alvo: valor,
                prazo: document.getElementById("meta-prazo").value || null,
                icone: (document.querySelector("[name=icone]:checked") || {}).value || "meta",
            });
            global.Carregando.ocupado(botao, false);
            if (!r.ok) return erro("[data-erro-meta]", r.mensagem);
            global.Painel.fechar("painel-nova-meta");
            global.Avisos.mostrar(r.mensagem);
            form.reset();
            return carregar();
        }

        if (form.matches("[data-form-investimento]")) {
            document.querySelector("[data-erro-investimento]").hidden = true;
            var alvoValor = F.paraNumero(document.getElementById("inv-valor").value);
            var cadencia = (document.querySelector('[data-cadencia][aria-pressed="true"]') || {})
                .dataset;
            if (!alvoValor || alvoValor <= 0) {
                return erro("[data-erro-investimento]", "Quanto você quer guardar por período?");
            }
            var id = document.querySelector("[data-investimento-id]").value;

            global.Carregando.ocupado(botao, true, "Salvando…");
            var resposta = id
                ? await global.ApiPlanejamento.editarMeta(Number(id), {
                      valor_alvo: alvoValor, cadencia: cadencia.cadencia })
                : await global.ApiPlanejamento.criarMetaInvestimento(
                      alvoValor, cadencia.cadencia);
            global.Carregando.ocupado(botao, false);

            if (!resposta.ok) return erro("[data-erro-investimento]", resposta.mensagem);
            global.Painel.fechar("painel-investimento");
            global.Avisos.mostrar(resposta.mensagem);
            return carregar();
        }

        if (form.matches("[data-form-guardar]")) {
            document.querySelector("[data-erro-guardar]").hidden = true;
            var quanto = F.paraNumero(document.getElementById("valor-guardar").value);
            if (!quanto || quanto <= 0) {
                return erro("[data-erro-guardar]", "Quanto você quer guardar?");
            }

            global.Carregando.ocupado(botao, true, "Guardando…");
            var g = await global.ApiPlanejamento.guardarDinheiro(metaAtual, quanto);
            global.Carregando.ocupado(botao, false);
            if (!g.ok) return erro("[data-erro-guardar]", g.mensagem);

            global.Painel.fechar("painel-guardar");
            global.Avisos.mostrar(g.mensagem);
            form.reset();
            carregar();
        }
    });

    document.addEventListener("click", async function (evento) {
        var cadencia = evento.target.closest("[data-cadencia]");
        if (cadencia) {
            document.querySelectorAll("[data-cadencia]").forEach(function (b) {
                b.setAttribute("aria-pressed", String(b === cadencia));
            });
            return;
        }

        var guardar = evento.target.closest("[data-guardar]");
        if (guardar) {
            metaAtual = Number(guardar.dataset.guardar);
            document.querySelector("[data-guardar-nome]").textContent =
                "Meta: " + guardar.dataset.nome;
            document.getElementById("valor-guardar").value = "";
            document.querySelector("[data-erro-guardar]").hidden = true;
            return global.Painel.abrir("painel-guardar");
        }

        if (evento.target.closest("[data-dispensar-reserva]")) {
            dispensarReserva();
            var cartao = evento.target.closest(".cartao");
            if (cartao) cartao.remove();
            return;
        }

        var reserva = evento.target.closest("[data-criar-reserva]");
        if (reserva) {
            global.Carregando.ocupado(reserva, true, "Criando…");
            var r = await global.ApiPlanejamento.criarMeta({
                nome: "Reserva de emergência",
                valor_alvo: Number(reserva.dataset.valor),
                icone: "reserva", reserva_emergencia: true,
            });
            global.Carregando.ocupado(reserva, false);
            global.Avisos.daResposta(r);
            if (r.ok) carregar();
            return;
        }

        var apagar = evento.target.closest("[data-apagar-meta]");
        if (apagar) {
            global.Painel.confirmar({
                titulo: "Apagar a meta " + apagar.dataset.nome + "?",
                texto: "O histórico do que você guardou nela some junto. Não dá para desfazer.",
                confirmar: "Apagar",
                aoConfirmar: async function () {
                    var r = await global.ApiPlanejamento.apagarMeta(
                        Number(apagar.dataset.apagarMeta));
                    global.Avisos.daResposta(r);
                    if (r.ok) carregar();
                },
            });
        }
    });

    carregar();
})(window);
