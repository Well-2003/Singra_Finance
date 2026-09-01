/* Singra - painel Início
   Responde "como estou este mês?" em uma olhada. O número grande vem
   primeiro; o resto da tela só o detalha.

   Tudo chega em uma requisição só, porque o backend gratuito hiberna: sete
   chamadas separadas somariam sete vezes o tempo de despertar. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;

    var alvo = document.querySelector("[data-conteudo]");
    var cabecalho = document.querySelector("[data-navegador-mes]");
    var saudacao = document.querySelector("[data-saudacao]");

    function bolha(nomeIcone, cor) {
        return '<span class="bolha" style="--cor-cat: ' + (cor || "#B5B5A8") + '">' +
               icone(nomeIcone || "outros") + "</span>";
    }

    function barra(pct, estado) {
        var classe = estado === "estourou" ? " barra-estourou"
                   : estado === "atencao" ? " barra-atencao" : "";
        return '<div class="barra' + classe + '" role="img" aria-label="' + pct + ' por cento">' +
               '<span class="barra-trilha" style="width:' + Math.min(pct, 100) + '%"></span></div>';
    }

    // Os blocos da tela

    /* O sinal vive no rótulo, e não no número: quem passou do planejado lê
       "Você passou do combinado em R$ 63", nunca "R$ -63". */
    function cartaoPrincipal(p) {
        var r = p.resumo;
        var estado = r.usado_pct > 100 ? "estourou" : (r.usado_pct >= 80 ? "atencao" : "");

        return '<section class="cartao cartao-destaque painel-principal">' +
            '<span class="legenda">' +
                (r.disponivel >= 0 ? "Você ainda pode gastar" : "Você passou do combinado em") +
            "</span>" +
            '<strong class="valor-grande">' + F.moedaCurta(Math.abs(r.disponivel)) + "</strong>" +
            barra(r.usado_pct, estado) +
            '<p class="legenda" style="margin-top:var(--e1)">' +
                F.escapar(global.Idioma.frase(p.frase_disponivel)) + "</p>" +
            '<div class="entrou-saiu">' +
                "<span>Entraram <b>" + F.moeda(r.ganhos) + "</b></span>" +
                "<span>Saíram <b>" + F.moeda(r.gastos) + "</b></span>" +
                (r.guardado > 0 ? "<span>Guardado <b>" + F.moeda(r.guardado) + "</b></span>" : "") +
            "</div></section>";
    }

    /* O CONVITE DE QUEM ACABOU DE CHEGAR

       Quem cria a conta cai direto aqui, num painel ainda zerado. Este é o
       único lugar que diz o que fazer em seguida, e ele aponta para o
       planejamento porque é dali que sai o "quanto ainda posso gastar":
       sem planejamento o número só reage ao que já entrou.

       O convite se dispensa, e dispensar é definitivo: marcar o primeiro
       acesso como concluído na API é o mesmo que a pessoa faria terminando
       as perguntas. Um aviso que volta a cada visita deixa de ser convite. */
    function cartaoBoasVindas(p) {
        if (!p.primeiro_acesso) return "";

        return '<section class="cartao cartao-convite" data-boas-vindas>' +
            '<button type="button" class="alerta-fechar" data-dispensar-convite ' +
                'aria-label="Dispensar este convite">' + icone("fechar") + "</button>" +
            "<h2>Bem-vindo ao Singra 🌱</h2>" +
            "<p>Para o painel saber quanto você ainda pode gastar, ele precisa " +
            "de uma referência. Monte seu planejamento: você diz quanto pretende " +
            "gastar em cada categoria e nós cuidamos do resto.</p>" +
            '<div class="linha" style="margin-top:var(--e2)">' +
                '<a class="botao botao-acao" href="orcamento.html">' +
                    "Montar meu planejamento</a>" +
                '<a class="botao botao-suave" href="onboarding.html">' +
                    "Responder algumas perguntas</a>" +
            "</div></section>";
    }

    /* Só aparece se a pessoa criou a meta de investimento. Sem ela, o
       cartão fica oculto, nunca zerado: um espaço em branco é lido como
       erro ou como algo que falta preencher. */
    function cartaoGuardado(p) {
        var i = p.investimento;
        if (!i) return "";

        var alerta = "";
        if (p.alerta_sobra) {
            alerta =
                '<div class="alerta-sobra" data-alerta-sobra>' +
                    '<button type="button" class="alerta-fechar" data-dispensar-alerta ' +
                        'aria-label="Dispensar aviso">' + icone("fechar") + "</button>" +
                    "<p>Ainda dá pra guardar <strong>" +
                        F.moeda(p.alerta_sobra.valor_sugerido) + "</strong> e bater sua meta " +
                        F.escapar(i.rotulo_periodo) + ".</p>" +
                    '<div class="linha">' +
                        '<button type="button" class="botao botao-acao" data-guardar-agora ' +
                            'data-meta="' + i.meta_id + '" ' +
                            'data-valor="' + p.alerta_sobra.valor_sugerido + '">' +
                            "Guardar agora</button>" +
                        '<a class="botao botao-suave" href="metas.html">Aumentar minha meta</a>' +
                    "</div>" +
                "</div>";
        }

        return '<section class="cartao largura-total cartao-guardado">' +
            '<div class="cartao-titulo"><h2>Guardado ' + F.escapar(i.rotulo_periodo) + "</h2>" +
                '<a class="cartao-link" href="metas.html">Ver meta</a></div>' +
            '<div class="linha">' +
                '<span class="circulo" style="--pct:' + i.pct + '" data-pct="' + i.pct + '%"></span>' +
                '<span class="crescer">' +
                    "<strong>" + F.moeda(i.guardado) + "</strong> <span>de</span> " +
                    F.moeda(i.alvo) +
                    '<br><span class="item-apoio">' +
                    (i.falta > 0 ? "Faltam " + F.moeda(i.falta) : "Meta batida. Muito bem.") +
                    "</span></span>" +
            "</div>" + alerta + "</section>";
    }

    function cartaoContas(p) {
        var corpo;
        if (!p.proximas_contas.length) {
            corpo = '<p class="legenda">Nenhuma conta vencendo nos próximos 7 dias. ' +
                    "Tudo tranquilo.</p>";
        } else {
            corpo = '<ul class="lista-limpa">' + p.proximas_contas.map(function (c) {
                var quando = c.estado === "hoje" ? "Vence hoje"
                    : c.estado === "atrasada" ? "Venceu em " + F.dataBR(c.vencimento)
                    : "Vence em " + F.dataBR(c.vencimento);
                return '<li class="item-lista">' +
                    '<span class="bolinha bolinha-' + c.estado + '"></span>' +
                    '<span class="crescer"><span class="item-titulo">' +
                        F.escapar(c.descricao) + '</span><br><span class="item-apoio">' +
                        quando + "</span></span>" +
                    "<strong>" + F.moeda(c.valor) + "</strong></li>";
            }).join("") + "</ul>";
        }

        return '<section class="cartao"><div class="cartao-titulo">' +
            "<h2>Próximas contas</h2>" +
            '<a class="cartao-link" href="contas.html">Ver todas</a></div>' + corpo + "</section>";
    }

    function cartaoCategorias(p) {
        var c = p.categorias;
        var corpo = c.itens.length
            ? '<div class="linha" style="gap:var(--e3)">' +
                  global.Mes.rosca(c.itens, c.total, "Gastos por categoria") +
                  '<div class="crescer">' + global.Mes.legenda(c.itens) + "</div></div>" +
              '<p class="frase-grafico">' + F.escapar(global.Idioma.frase(p.frase_categorias)) + "</p>"
            : '<p class="legenda">Assim que você registrar alguns gastos, o desenho ' +
              "aparece aqui.</p>";

        return '<section class="cartao"><div class="cartao-titulo">' +
            "<h2>Seus gastos por categoria</h2>" +
            '<a class="cartao-link" href="graficos.html">Ver gráficos</a></div>' +
            corpo + "</section>";
    }

    function cartaoMetas(p) {
        var corpo = p.metas.length
            ? '<ul class="lista-limpa">' + p.metas.map(function (m) {
                  return '<li class="item-lista">' +
                      '<span class="circulo" style="--pct:' + m.pct + '" ' +
                          'data-pct="' + m.pct + '%"></span>' +
                      '<span class="crescer"><span class="item-titulo">' +
                          F.escapar(m.nome) + '</span><br><span class="item-apoio">' +
                          F.moeda(m.guardado) + " <span>de</span> " + F.moeda(m.valor_alvo) +
                      "</span></span></li>";
              }).join("") + "</ul>"
            : '<p class="legenda">Você ainda não tem metas.</p>' +
              '<a class="botao botao-contorno" href="metas.html" ' +
              'style="margin-top:var(--e1)">Criar minha primeira meta</a>';

        return '<section class="cartao"><div class="cartao-titulo"><h2>Suas metas</h2>' +
            '<a class="cartao-link" href="metas.html">Ver todas</a></div>' + corpo + "</section>";
    }

    // Cada registro é um cartão clicável que reabre o painel de adicionar
    function cartaoTransacao(t) {
        // A forma de pagamento e o cartão só valem para gasto: num ganho o
        // dinheiro entrou, não foi pago
        var apoio = [F.escapar(t.categoria_nome)];
        if (t.tipo === "gasto") {
            apoio.push(F.formaPagamento(t.forma_pagamento));
            if (t.cartao_nome) apoio.push(F.escapar(t.cartao_nome));
        }
        if (t.parcela_total) apoio.push("parcela " + t.parcela_atual + "/" + t.parcela_total);
        if (t.fixa) apoio.push("todo mês");

        return '<button type="button" class="cartao-toque cartao-registro" data-editar=\'' +
            F.escapar(JSON.stringify(t)) + "'>" +
            bolha(t.categoria_icone, t.categoria_cor) +
            /* Título, valor e apoio são filhos diretos: assim o nome e o
               valor dividem a primeira linha e a descrição ocupa a largura
               toda embaixo, em vez de escorrer pelo lado do valor. */
            '<span class="item-titulo">' +
                F.escapar(t.descricao || t.categoria_nome) + "</span>" +
            '<span class="' + (t.tipo === "gasto" ? "valor-gasto" : "valor-ganho") + '">' +
                (t.tipo === "gasto" ? "- " : "+ ") + F.moeda(t.valor) + "</span>" +
            '<span class="item-apoio">' + apoio.join(" &middot; ") + "</span></button>";
    }

    function cartaoUltimos(p) {
        var corpo = p.ultimos.length
            ? '<div class="empilhado">' + p.ultimos.map(cartaoTransacao).join("") + "</div>" +
              '<p class="legenda" style="margin-top:var(--e2)">' +
              "Toque em qualquer registro para corrigir ou apagar.</p>"
            : '<div class="vazio">' +
              '<svg class="vazio-figura" aria-hidden="true">' +
                  '<use href="#i-vazio-registros"></use></svg>' +
              "<h3>Ainda não tem nada por aqui</h3>" +
              "<p>Que tal registrar seu primeiro gasto? Leva menos de um minuto.</p>" +
              '<button type="button" class="botao botao-acao" data-abrir-adicionar>' +
              "+ Adicionar gasto</button></div>";

        return '<section class="cartao largura-total"><div class="cartao-titulo">' +
            "<h2>Últimos registros</h2>" +
            '<a class="cartao-link" href="historico.html">Ver histórico</a></div>' +
            corpo + "</section>";
    }

    // Gastar mais que no mês passado é mel, nunca vermelho
    function cartaoComparacao(p) {
        if (!p.comparacao) return "";
        var seta = p.comparacao.sentido === "menos" ? "&darr;"
                 : p.comparacao.sentido === "mais" ? "&uarr;" : "&rarr;";
        return '<section class="comparacao largura-total' +
            (p.comparacao.sentido === "mais" ? " comparacao-mais" : "") + '">' +
            '<span class="comparacao-seta" aria-hidden="true">' + seta + "</span>" +
            "<span>" + F.escapar(global.Idioma.frase(p.comparacao)) + "</span></section>";
    }

    // Desenho e ligações

    function desenhar(p) {
        saudacao.textContent = "Oi, " + (global.Sessao.apelido() || "tudo bem") + " 👋";
        global.Mes.desenhar(cabecalho, p.mes);

        alvo.className = "";
        alvo.innerHTML =
            cartaoBoasVindas(p) +
            cartaoPrincipal(p) +
            '<div class="grade-painel" style="margin-top:var(--e2)">' +
                cartaoGuardado(p) +
                cartaoContas(p) +
                cartaoCategorias(p) +
                cartaoMetas(p) +
                cartaoUltimos(p) +
                cartaoComparacao(p) +
            "</div>";
    }

    async function carregar() {
        var mes = global.Mes.daURL();
        var resposta = await global.ApiTransacoes.painel(mes.ano, mes.mes);
        if (!resposta.ok) return;   // a tela de espera já mostrou o problema
        desenhar(resposta);
    }

    document.addEventListener("click", async function (evento) {
        /* O X apenas dispensa o aviso: não mexe no disponível nem na meta.
           Só o botão "Guardar agora" move dinheiro. */
        if (evento.target.closest("[data-dispensar-alerta]")) {
            var caixa = document.querySelector("[data-alerta-sobra]");
            if (caixa) caixa.remove();
            return;
        }

        if (evento.target.closest("[data-dispensar-convite]")) {
            var convite = document.querySelector("[data-boas-vindas]");
            if (convite) convite.remove();
            // Sai da tela na hora e some de vez no servidor, sem esperar
            await global.ApiPerfil.onboarding({ concluir: true });
            return;
        }

        var guardar = evento.target.closest("[data-guardar-agora]");
        if (guardar) {
            global.Carregando.ocupado(guardar, true, "Guardando…");
            var r = await global.ApiPlanejamento.guardarDinheiro(
                Number(guardar.dataset.meta), Number(guardar.dataset.valor));
            global.Carregando.ocupado(guardar, false);
            global.Avisos.daResposta(r);
            if (r.ok) carregar();
        }
    });

    // Depois de salvar um gasto, o painel volta com os números novos
    global.PainelAdicionar.aoSalvar(carregar);

    // As frases dos gráficos só existem depois de montadas: trocar de
    // idioma pede um novo desenho
    document.addEventListener("singra:idioma", carregar);

    carregar();
})(window);
