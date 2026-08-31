/* Singra - painel "Adicionar gasto/ganho"
   Valor, categoria, confirmar. A tela mais importante do produto: é o que a
   pessoa abre todo dia, muitas vezes em pé e com uma mão só.

   O painel é montado uma vez por página e vive escondido, porque o botão
   pêssego existe em todas as telas internas. O mesmo painel corrige um
   registro quando aberto pelo Histórico.

   Requer cliente.js, transacoes.js, planejamento.js, painel.js, avisos.js,
   icones.js e format.js. */

window.PainelAdicionar = (function (global) {
    "use strict";

    var ID = "painel-adicionar";
    var LIMITE_CENTAVOS = 99999999999;

    var estado = null;
    var painel = null;

    // Guardados na primeira abertura: não mudam durante a visita
    var categorias = null;
    var cartoes = null;

    var aoSalvar = null;   // a página avisa que precisa se atualizar

    function icone(nome, classe) {
        return global.SingraIcones.icone(nome, classe);
    }

    function bolha(nomeIcone, cor) {
        return '<span class="bolha" style="--cor-cat: ' + (cor || "#B5B5A8") + '">' +
               icone(nomeIcone || "outros") + "</span>";
    }

    function novoEstado() {
        return {
            id: null,          // preenchido só no modo de correção
            grupo: null,       // grupo das parcelas, quando for compra parcelada
            tipo: "gasto",
            centavos: 0,
            categoria: null,
            cartaoId: null,
            passo: 1,
        };
    }

    // Montagem

    function montar() {
        if (document.getElementById(ID)) return;

        var fundo = document.createElement("div");
        fundo.className = "fundo-escuro";
        fundo.setAttribute("data-fundo", ID);
        fundo.hidden = true;

        painel = document.createElement("div");
        painel.className = "painel";
        painel.id = ID;
        painel.setAttribute("role", "dialog");
        painel.setAttribute("aria-modal", "true");
        painel.setAttribute("aria-labelledby", "titulo-adicionar");
        painel.hidden = true;
        painel.innerHTML = marcacao();

        document.body.appendChild(fundo);
        document.body.appendChild(painel);
        ligar();
    }

    function marcacao() {
        var teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(function (t) {
            return '<button type="button" class="tecla" data-tecla="' + t + '">' + t + "</button>";
        }).join("");

        var formas = Object.keys(global.Formato.FORMAS).map(function (chave) {
            return '<button type="button" class="chip" data-forma="' + chave + '" ' +
                   'aria-pressed="' + (chave === "pix") + '">' +
                   global.Formato.FORMAS[chave] + "</button>";
        }).join("");

        return '' +
        '<div class="painel-alca"></div>' +

        '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
            '<h2 id="titulo-adicionar" style="margin:0">Adicionar gasto</h2>' +
            '<button type="button" class="botao botao-texto" data-fechar-painel="' + ID + '" ' +
                'aria-label="Fechar sem salvar">' + icone("fechar") + "</button>" +
        "</div>" +

        '<div class="passos" aria-hidden="true">' +
            '<span class="passo-marca feito" data-marca="1"></span>' +
            '<span class="passo-marca" data-marca="2"></span>' +
            '<span class="passo-marca" data-marca="3"></span>' +
        "</div>" +

        // Passo 1: quanto foi
        '<section data-passo="1">' +
            '<div class="alternador" role="group" aria-label="Tipo do registro">' +
                '<button type="button" data-tipo="gasto" aria-pressed="true">Gasto</button>' +
                '<button type="button" data-tipo="ganho" aria-pressed="false">Ganho</button>' +
            "</div>" +

            '<div class="mostrador" style="margin-top:var(--e2)">' +
                '<span class="legenda" data-rotulo-valor>Quanto foi?</span>' +
                '<div class="mostrador-valor mostrador-vazio" data-valor ' +
                    'role="status" aria-live="polite">R$ 0,00</div>' +
            "</div>" +

            // Teclado próprio, com teclas grandes, em vez do teclado do sistema
            '<div class="teclado">' + teclas +
                '<button type="button" class="tecla" data-tecla="00">00</button>' +
                '<button type="button" class="tecla" data-tecla="0">0</button>' +
                '<button type="button" class="tecla tecla-apagar" data-tecla="apagar" ' +
                    'aria-label="Apagar último número">' + icone("apagar-tecla") + "</button>" +
            "</div>" +

            '<button type="button" class="botao botao-acao botao-largo" data-avancar="2" ' +
                'style="margin-top:var(--e2)">Continuar</button>' +
            '<p class="aviso-campo" data-erro="valor" hidden></p>' +
        "</section>" +

        // Passo 2: em que foi
        '<section data-passo="2" hidden>' +
            '<p class="legenda" data-rotulo-categoria style="margin-bottom:var(--e1)">' +
                "Em que você gastou?</p>" +
            '<div data-grade-rapidas class="grade-categorias"></div>' +
            '<details class="recolhivel" style="margin-top:var(--e2)">' +
                "<summary>Mais categorias</summary>" +
                '<div class="recolhivel-corpo">' +
                    '<div data-grade-todas class="grade-categorias"></div>' +
                "</div>" +
            "</details>" +
            '<div class="linha" style="margin-top:var(--e3)">' +
                '<button type="button" class="botao botao-suave" data-voltar="1">' +
                    icone("voltar") + " Voltar</button>" +
            "</div>" +
        "</section>" +

        // Passo 3: confirmar
        '<section data-passo="3" hidden>' +
            '<div class="cartao cartao-compacto linha" style="margin-bottom:var(--e2)">' +
                "<span data-resumo-bolha>" + bolha("outros") + "</span>" +
                '<span class="crescer">' +
                    '<span class="item-titulo" data-resumo-categoria>Categoria</span><br>' +
                    '<span class="item-apoio" data-resumo-tipo>Gasto</span>' +
                "</span>" +
                "<strong data-resumo-valor>R$ 0,00</strong>" +
                '<button type="button" class="botao botao-texto" data-voltar="1">Mudar</button>' +
            "</div>" +

            '<div class="campo">' +
                '<label for="add-descricao">O que foi? (opcional)</label>' +
                '<input type="text" id="add-descricao" maxlength="120" autocomplete="off" ' +
                    'placeholder="Almoço com a equipe">' +
            "</div>" +

            '<div class="campo">' +
                '<label for="add-data">Quando foi?</label>' +
                '<input type="date" id="add-data">' +
            "</div>" +

            /* "Como você pagou?" não cabe num ganho: dinheiro que entrou
               não foi pago por ninguém. A pergunta, e o vínculo com cartão
               que depende dela, existem só do lado do gasto. */
            '<fieldset data-so-gasto style="border:0;padding:0;margin:0 0 var(--e2)">' +
                '<legend class="rotulo">Como você pagou?</legend>' +
                '<div class="chips" data-formas>' + formas + "</div>" +
            "</fieldset>" +

            /* O vínculo só aparece se a pessoa cadastrou algum cartão ou
               conta. Quem não usa o recurso nunca vê este campo. */
            '<fieldset data-area-cartao hidden style="border:0;padding:0;margin:0 0 var(--e2)">' +
                '<legend class="rotulo">Vincular a um cartão ou conta</legend>' +
                '<div class="chips" data-cartoes></div>' +
            "</fieldset>" +

            '<label class="interruptor" data-so-gasto>' +
                "<span>Esse gasto se repete todo mês?</span>" +
                '<input type="checkbox" id="add-fixa">' +
                '<span class="interruptor-trilha"></span>' +
            "</label>" +

            '<label class="interruptor" data-so-gasto data-linha-parcelado>' +
                "<span>Foi parcelado?</span>" +
                '<input type="checkbox" id="add-parcelado">' +
                '<span class="interruptor-trilha"></span>' +
            "</label>" +

            '<div class="campo" data-area-parcelas hidden>' +
                '<label for="add-parcelas">Em quantas vezes?</label>' +
                '<input type="number" id="add-parcelas" min="2" max="60" step="1" ' +
                    'value="2" inputmode="numeric">' +
                '<span class="dica-campo" data-dica-parcelas></span>' +
            "</div>" +

            '<button type="button" class="botao botao-acao botao-largo" data-salvar ' +
                'style="margin-top:var(--e2)">Salvar</button>' +
            '<p class="aviso-campo" data-erro="geral" hidden></p>' +

            '<div data-area-apagar hidden style="margin-top:var(--e2);text-align:center">' +
                '<button type="button" class="botao botao-texto" data-apagar>' +
                    icone("lixeira") + " Apagar esse registro</button>" +
            "</div>" +
        "</section>";
    }

    // Passos

    function mostrarPasso(numero) {
        estado.passo = numero;
        painel.querySelectorAll("[data-passo]").forEach(function (secao) {
            secao.hidden = Number(secao.dataset.passo) !== numero;
        });
        painel.querySelectorAll("[data-marca]").forEach(function (marca) {
            marca.classList.toggle("feito", Number(marca.dataset.marca) <= numero);
        });
        if (numero === 3) desenharResumo();
    }

    // Passo 1: o valor

    /* O valor é guardado em centavos e cada tecla empurra um dígito, como
       na maquininha do cartão: quem digita 4590 vê R$ 45,90 se formando,
       sem precisar acertar onde fica a vírgula. */
    function emReais() {
        return estado.centavos / 100;
    }

    function desenharValor() {
        var visor = painel.querySelector("[data-valor]");
        visor.textContent = global.Formato.moeda(emReais());
        visor.classList.toggle("mostrador-vazio", estado.centavos === 0);
    }

    /* Cada tecla empurra o número uma casa para a esquerda e encaixa o
       dígito novo na direita: 45 vira 45 * 10 + 9 = 459. Apagar faz o
       contrário, dividindo por 10 e descartando o resto com Math.floor.
       Math.min contra o LIMITE_CENTAVOS impede que segurar o dedo numa
       tecla gere um número maior do que a coluna do banco aguenta. */
    function digitar(tecla) {
        if (tecla === "apagar") {
            estado.centavos = Math.floor(estado.centavos / 10);
        } else if (tecla === "00") {
            estado.centavos = Math.min(estado.centavos * 100, LIMITE_CENTAVOS);
        } else {
            estado.centavos = Math.min(estado.centavos * 10 + Number(tecla), LIMITE_CENTAVOS);
        }
        esconderErros();
        desenharValor();
    }

    function trocarTipo(tipo) {
        estado.tipo = tipo;
        painel.querySelectorAll("[data-tipo]").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b.dataset.tipo === tipo));
        });
        // Forma de pagamento, cartão, repetir todo mês e parcelar não
        // existem para um ganho
        painel.querySelectorAll("[data-so-gasto]").forEach(function (bloco) {
            bloco.hidden = tipo !== "gasto";
        });
        if (tipo === "ganho") {
            painel.querySelector("[data-area-cartao]").hidden = true;
            estado.cartaoId = null;
        } else {
            atualizarAreaCartao(formaEscolhida());
        }
        painel.querySelector("#titulo-adicionar").textContent =
            (estado.id ? "Corrigir " : "Adicionar ") + (tipo === "gasto" ? "gasto" : "ganho");
        painel.querySelector("[data-rotulo-valor]").textContent =
            tipo === "gasto" ? "Quanto foi?" : "Quanto entrou?";
        painel.querySelector("[data-rotulo-categoria]").textContent =
            tipo === "gasto" ? "Em que você gastou?" : "De onde veio?";

        // A categoria escolhida era da outra lista e deixou de valer
        if (estado.categoria && estado.categoria.tipo !== tipo) estado.categoria = null;
        desenharCategorias();
    }

    // Passo 2: as categorias

    function botaoCategoria(c) {
        var marcada = estado.categoria && estado.categoria.id === c.id;
        return '<button type="button" class="categoria-alvo" aria-pressed="' + marcada + '" ' +
               'data-categoria="' + c.id + '">' + bolha(c.icone, c.cor) +
               " " + global.Formato.escapar(c.nome) + "</button>";
    }

    function desenharCategorias() {
        if (!categorias) return;
        var rapidas = categorias.rapidas[estado.tipo] || [];
        var todas = categorias.itens.filter(function (c) { return c.tipo === estado.tipo; });

        painel.querySelector("[data-grade-rapidas]").innerHTML =
            rapidas.map(botaoCategoria).join("");
        painel.querySelector("[data-grade-todas]").innerHTML =
            todas.map(botaoCategoria).join("");
    }

    function escolherCategoria(id) {
        var achada = categorias.itens.filter(function (c) { return c.id === id; })[0];
        if (!achada) return;
        estado.categoria = achada;
        desenharCategorias();
        // Avança sozinho: escolher a categoria é o terceiro e último toque
        mostrarPasso(3);
    }

    // Passo 3: confirmar

    function desenharResumo() {
        var c = estado.categoria;
        painel.querySelector("[data-resumo-bolha]").innerHTML =
            bolha(c ? c.icone : "outros", c ? c.cor : null);
        painel.querySelector("[data-resumo-categoria]").textContent =
            c ? c.nome : "Escolha uma categoria";
        painel.querySelector("[data-resumo-tipo]").textContent =
            estado.tipo === "gasto" ? "Gasto" : "Ganho";
        painel.querySelector("[data-resumo-valor]").textContent =
            global.Formato.moeda(emReais());
        atualizarDicaParcelas();
    }

    function escolherForma(chave) {
        painel.querySelectorAll("[data-forma]").forEach(function (chip) {
            chip.setAttribute("aria-pressed", String(chip.dataset.forma === chave));
        });
        // Guarda a escolha: no próximo registro ela já vem selecionada
        try { localStorage.setItem("singra:forma", chave); } catch (e) { /* segue */ }
        atualizarAreaCartao(chave);
    }

    function formaEscolhida() {
        var marcado = painel.querySelector('[data-forma][aria-pressed="true"]');
        return marcado ? marcado.dataset.forma : "pix";
    }

    /* Pix, débito, crédito e boleto saem de alguma conta ou cartão, então
       todos podem ser vinculados. Dinheiro em espécie é o único que não sai
       de lugar nenhum, e é o único sem o campo. */
    function atualizarAreaCartao(forma) {
        var area = painel.querySelector("[data-area-cartao]");
        var podeVincular = forma !== "dinheiro";
        var temCartoes = cartoes && cartoes.length;

        area.hidden = !(podeVincular && temCartoes);
        if (area.hidden) {
            estado.cartaoId = null;
            return;
        }
        desenharCartoes();
    }

    function desenharCartoes() {
        // "Não vincular a nenhum" vem selecionada: o recurso é opcional e
        // ninguém precisa preencher para seguir
        var partes = ['<button type="button" class="chip" data-cartao="" aria-pressed="' +
                      String(!estado.cartaoId) + '">Não vincular a nenhum</button>'];

        cartoes.forEach(function (c) {
            partes.push('<button type="button" class="chip" data-cartao="' + c.id + '" ' +
                        'aria-pressed="' + String(estado.cartaoId === c.id) + '">' +
                        '<span class="ponto-cor" style="background:' + c.cor + '"></span> ' +
                        global.Formato.escapar(c.nome) + "</button>");
        });
        painel.querySelector("[data-cartoes]").innerHTML = partes.join("");
    }

    function escolherCartao(valor) {
        estado.cartaoId = valor ? Number(valor) : null;
        desenharCartoes();
    }

    // Mostra o valor de cada parcela, para não restar dúvida se o número
    // digitado era o total da compra ou o da parcela
    function atualizarDicaParcelas() {
        var quantidade = Math.max(2, Number(painel.querySelector("#add-parcelas").value) || 2);
        painel.querySelector("[data-dica-parcelas]").textContent =
            "O valor informado é o total da compra: " + quantidade + " vezes de " +
            global.Formato.moeda(emReais() / quantidade) + ".";
    }

    // Erros

    function esconderErros() {
        painel.querySelectorAll("[data-erro]").forEach(function (e) { e.hidden = true; });
    }

    // Além de mostrar a mensagem, volta ao passo em que o problema está
    function mostrarErro(mensagem, campo) {
        var alvo = painel.querySelector('[data-erro="' + (campo === "valor" ? "valor" : "geral") + '"]');
        alvo.textContent = mensagem;
        alvo.hidden = false;
        if (campo === "valor") mostrarPasso(1);
        else if (campo === "categoria_id") mostrarPasso(2);
    }

    // Abrir

    async function carregarApoio() {
        if (!categorias) {
            var r = await global.ApiTransacoes.categorias();
            if (r.ok) categorias = { itens: r.itens, rapidas: r.rapidas };
        }
        if (!cartoes) {
            var c = await global.ApiPlanejamento.listarCartoes();
            cartoes = c.ok ? c.itens : [];
        }
    }

    /* Sem argumento, abre em branco no passo 1 para um registro novo. Com
       os dados de uma transação, abre no passo 3 em modo de correção. */
    async function abrir(dados) {
        montar();
        estado = novoEstado();
        esconderErros();

        painel.querySelector("#add-descricao").value = "";
        painel.querySelector("#add-data").value = global.Formato.hojeISO();
        painel.querySelector("#add-fixa").checked = false;
        painel.querySelector("#add-parcelado").checked = false;
        painel.querySelector("#add-parcelas").value = 2;
        painel.querySelector("[data-area-parcelas]").hidden = true;
        painel.querySelector("[data-area-apagar]").hidden = true;
        // Parcelar uma transação que já existe mudaria as outras parcelas
        painel.querySelector("[data-linha-parcelado]").hidden = Boolean(dados);

        var forma = "pix";
        try { forma = localStorage.getItem("singra:forma") || "pix"; } catch (e) { /* segue */ }

        if (dados) {
            estado.id = dados.id;
            estado.grupo = dados.grupo_parcela || null;
            estado.centavos = Math.round(Number(dados.valor) * 100);
            estado.cartaoId = dados.cartao_id || null;
            painel.querySelector("#add-descricao").value = dados.descricao || "";
            painel.querySelector("#add-data").value = dados.data || global.Formato.hojeISO();
            painel.querySelector("#add-fixa").checked = Boolean(dados.fixa);
            painel.querySelector("[data-area-apagar]").hidden = false;
            forma = dados.forma_pagamento || "pix";
        }

        global.Painel.abrir(ID);
        await carregarApoio();

        if (dados && categorias) {
            estado.categoria = categorias.itens.filter(function (c) {
                return c.id === dados.categoria_id;
            })[0] || null;
        }

        trocarTipo(dados ? dados.tipo : "gasto");
        escolherForma(forma);
        desenharValor();
        mostrarPasso(dados ? 3 : 1);
    }

    // Salvar e apagar

    async function salvar(botao) {
        esconderErros();

        // Confere antes de enviar, para o erro aparecer sem esperar a rede
        if (estado.centavos <= 0) return mostrarErro("Falta só o valor. Quanto foi?", "valor");
        if (!estado.categoria) {
            return mostrarErro("Escolha uma categoria para continuar.", "categoria_id");
        }

        var dados = {
            tipo: estado.tipo,
            valor: emReais(),
            categoria_id: estado.categoria.id,
            descricao: painel.querySelector("#add-descricao").value.trim(),
            data: painel.querySelector("#add-data").value,
            fixa: estado.tipo === "gasto" && painel.querySelector("#add-fixa").checked,
        };

        // Num ganho esses dois campos não foram perguntados. Mandá-los
        // seria gravar uma resposta que ninguém deu
        if (estado.tipo === "gasto") {
            dados.forma_pagamento = formaEscolhida();
            dados.cartao_id = estado.cartaoId;
        }

        if (!estado.id && estado.tipo === "gasto" &&
            painel.querySelector("#add-parcelado").checked) {
            dados.parcelas = Math.max(2, Number(painel.querySelector("#add-parcelas").value) || 2);
        }

        global.Carregando.ocupado(botao, true, "Salvando…");
        var resposta = estado.id
            ? await global.ApiTransacoes.editar(estado.id, dados)
            : await global.ApiTransacoes.criar(dados);
        global.Carregando.ocupado(botao, false);

        if (!resposta.ok) {
            return mostrarErro(resposta.mensagem, resposta.campo);
        }

        global.Avisos.mostrar(resposta.mensagem);
        global.Painel.fechar(ID);
        if (aoSalvar) aoSalvar(resposta);
    }

    function apagar() {
        var parcelado = Boolean(estado.grupo);
        global.Painel.confirmar({
            titulo: parcelado ? "Apagar a compra inteira?" : "Apagar esse registro?",
            texto: parcelado
                ? "As parcelas dos outros meses também somem. Não dá para desfazer."
                : "Não dá para desfazer.",
            confirmar: "Apagar",
            aoConfirmar: async function () {
                var r = await global.ApiTransacoes.apagar(estado.id, parcelado);
                global.Avisos.daResposta(r);
                if (r.ok) {
                    global.Painel.fechar(ID);
                    if (aoSalvar) aoSalvar(r);
                }
            },
        });
    }

    // Ligações

    /* Um ouvinte só, no painel inteiro: as categorias e os cartões são
       redesenhados a cada abertura, e assim nada precisa ser religado. */
    function ligar() {
        painel.addEventListener("click", function (evento) {
            var alvo = evento.target;

            var tecla = alvo.closest("[data-tecla]");
            if (tecla) return digitar(tecla.dataset.tecla);

            var tipo = alvo.closest("[data-tipo]");
            if (tipo) return trocarTipo(tipo.dataset.tipo);

            var avancar = alvo.closest("[data-avancar]");
            if (avancar) {
                if (estado.centavos <= 0) {
                    return mostrarErro("Falta só o valor. Quanto foi?", "valor");
                }
                esconderErros();
                return mostrarPasso(Number(avancar.dataset.avancar));
            }

            var voltar = alvo.closest("[data-voltar]");
            if (voltar) return mostrarPasso(Number(voltar.dataset.voltar));

            var categoria = alvo.closest("[data-categoria]");
            if (categoria) return escolherCategoria(Number(categoria.dataset.categoria));

            var forma = alvo.closest("[data-forma]");
            if (forma) return escolherForma(forma.dataset.forma);

            var cartao = alvo.closest("[data-cartao]");
            if (cartao) return escolherCartao(cartao.dataset.cartao);

            var botaoSalvar = alvo.closest("[data-salvar]");
            if (botaoSalvar) return salvar(botaoSalvar);

            if (alvo.closest("[data-apagar]")) return apagar();
        });

        painel.querySelector("#add-parcelado").addEventListener("change", function (e) {
            painel.querySelector("[data-area-parcelas]").hidden = !e.target.checked;
            if (e.target.checked) atualizarDicaParcelas();
        });

        painel.querySelector("#add-parcelas").addEventListener("input", atualizarDicaParcelas);

        // Teclado físico no passo 1, para quem está no computador
        document.addEventListener("keydown", function (evento) {
            if (!painel || painel.hidden || !estado || estado.passo !== 1) return;
            if (evento.key >= "0" && evento.key <= "9") digitar(evento.key);
            else if (evento.key === "Backspace") digitar("apagar");
            else if (evento.key === "Enter" && estado.centavos > 0) mostrarPasso(2);
        });
    }

    // O botão pêssego existe em todas as telas internas
    document.addEventListener("click", function (evento) {
        if (evento.target.closest("[data-abrir-adicionar]")) abrir(null);
        var editar = evento.target.closest("[data-editar]");
        if (editar) abrir(JSON.parse(editar.dataset.editar));
    });

    return {
        abrir: abrir,
        // A página diz o que fazer depois de salvar: recarregar sua lista
        aoSalvar: function (funcao) { aoSalvar = funcao; },
    };
})(window);
