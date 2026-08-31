/* Singra - meu perfil
   A página mais longa do site, e por isso a mais dividida: cada assunto
   fica no seu próprio cartão, e os que quase ninguém abre (categorias,
   cartões, senha, apagar a conta) ficam recolhidos até serem pedidos.

   Duas coisas aqui não são configuração, são direito da pessoa sobre os
   dados dela: baixar tudo em CSV e apagar a conta. Elas aparecem por
   último, com o mesmo peso visual do resto, sem esconder nem assustar. */

(function (global) {
    "use strict";

    if (!global.Sessao.exigirLogin()) return;

    var F = global.Formato;
    var icone = global.SingraIcones.icone;
    var alvo = document.querySelector("[data-conteudo]");

    var estado = { usuario: {}, categorias: [], cartoes: [] };

    // Os ícones e as cores que a pessoa pode escolher ao criar uma
    // categoria. É o mesmo conjunto das categorias que já vêm prontas: uma
    // categoria nova não deveria destoar das outras na tela.
    var ICONES = [
        "moradia", "alimentacao", "transporte", "saude", "contas", "educacao",
        "dividas", "lazer", "delivery", "compras", "assinaturas", "beleza",
        "viagens", "pets", "salario", "renda-extra", "presente", "reembolso",
        "rendimento", "estudo", "casa-nova", "coracao", "reserva", "outros",
    ];

    var CORES = [
        "#8FA3B8", "#C9A86A", "#7FA9A3", "#D9A0A8", "#A99BC0", "#8FB0A0",
        "#A88F86", "#F4A27A", "#E0B15A", "#B88C9E", "#9CB0C8", "#C9909E",
        "#7FB0BF", "#C4A484", "#9CAF88", "#B5B5A8",
    ];

    var IDIOMAS = [
        ["pt", "Português"],
        ["en", "English"],
        ["es", "Español"],
    ];

    // Blocos da página

    function meusDados(u) {
        return '<section class="cartao"><h2>Seus dados</h2>' +
            "<form data-form-dados>" +
                '<div class="campo"><label for="perfil-nome">Seu nome</label>' +
                    '<input type="text" id="perfil-nome" maxlength="100" required ' +
                        'value="' + F.escapar(u.nome) + '"></div>' +

                '<div class="campo"><label for="perfil-apelido">Como quer ser chamado?</label>' +
                    '<input type="text" id="perfil-apelido" maxlength="40" value="' +
                        F.escapar(u.apelido || "") + '">' +
                    '<span class="dica-campo">É esse nome que aparece na saudação ' +
                        "do painel.</span></div>" +

                '<div class="campo"><label for="perfil-email">Seu e-mail</label>' +
                    '<input type="email" id="perfil-email" value="' +
                        F.escapar(u.email) + '" disabled>' +
                    '<span class="dica-campo">O e-mail é o seu login e não muda ' +
                        "por aqui.</span></div>" +

                '<div class="campo">' +
                    '<label for="perfil-renda">Quanto costuma entrar por mês?</label>' +
                    '<input type="text" id="perfil-renda" inputmode="decimal" ' +
                        'placeholder="0,00" value="' +
                        (u.renda_estimada > 0
                            ? F.numero(u.renda_estimada) : "") + '">' +
                    '<span class="dica-campo">Serve para sugerir seu planejamento. ' +
                        "Pode deixar em branco.</span></div>" +

                '<label class="interruptor"><span>Minha renda varia de mês para mês</span>' +
                    '<input type="checkbox" id="perfil-renda-variavel"' +
                        (u.renda_variavel ? " checked" : "") + ">" +
                    '<span class="interruptor-trilha"></span></label>' +

                '<div class="campo" style="margin-top:var(--e2)">' +
                    '<label for="perfil-dia">Meu mês financeiro começa no dia</label>' +
                    '<input type="number" id="perfil-dia" min="1" max="28" value="' +
                        (u.dia_inicio_mes || 1) + '">' +
                    '<span class="dica-campo">Quem recebe no dia 5 costuma preferir o ' +
                        "dia 5: assim o mês do Singra acompanha o seu salário.</span></div>" +

                '<button type="submit" class="botao botao-acao">Salvar meus dados</button>' +
            "</form></section>";
    }

    /* Os dois botões vivem num bloco próprio, e não soltos na linha: no
       celular eles descem para baixo do nome em vez de espremê-lo. Antes,
       com tudo na mesma linha, sobravam 39px para o nome e "Moradia" saía
       quebrado em "Mor/adia". */
    function linhaCategoria(c) {
        return '<div class="linha-categoria' + (c.oculta ? " oculta" : "") + '">' +
            '<span class="bolha" style="--cor-cat: ' + c.cor + '">' +
                icone(c.icone) + "</span>" +
            '<span class="crescer"><span class="item-titulo">' + F.escapar(c.nome) +
                "</span><br>" +
                '<span class="item-apoio">' + (c.tipo === "ganho" ? "ganho" : "gasto") +
                (c.essencial ? " &middot; essencial" : "") + "</span></span>" +
            '<div class="acoes">' +
                /* O rótulo diz de qual categoria é o botão. Na tela o nome
                   está ao lado e "Renomear" basta, mas quem navega por
                   leitor pula de botão em botão e ouviria vinte iguais. */
                '<button type="button" class="botao botao-texto" data-renomear="' + c.id +
                    '" data-nome="' + F.escapar(c.nome) + '" ' +
                    'aria-label="Renomear ' + F.escapar(c.nome) + '">Renomear</button>' +
                '<button type="button" class="botao botao-texto" data-ocultar="' + c.id +
                    '" data-estado="' + (c.oculta ? "1" : "0") + '" ' +
                    'aria-label="' + (c.oculta ? "Mostrar " : "Esconder ") +
                    F.escapar(c.nome) + '">' +
                    (c.oculta ? "Mostrar" : "Esconder") + "</button>" +
            "</div></div>";
    }

    function blocoCategorias(lista) {
        var visiveis = lista.filter(function (c) { return !c.oculta; });
        var escondidas = lista.filter(function (c) { return c.oculta; });

        return '<details class="recolhivel" style="margin-top:var(--e2)">' +
            "<summary><span>Minhas categorias</span> (" + visiveis.length +
             ")</summary>" +
            '<div class="recolhivel-corpo">' +
                '<p class="legenda">Categorias não são apagadas, e sim escondidas: ' +
                    "os gastos que você já registrou precisam continuar apontando para " +
                    "alguma delas. Uma categoria escondida some das telas de registro, " +
                    "mas o histórico dela fica.</p>" +
                '<div style="margin:var(--e2) 0">' +
                    visiveis.map(linhaCategoria).join("") + "</div>" +
                (escondidas.length
                    ? "<h3>Escondidas</h3>" +
                      '<div style="margin-bottom:var(--e2)">' +
                      escondidas.map(linhaCategoria).join("") + "</div>"
                    : "") +
                '<button type="button" class="botao botao-suave" ' +
                    'data-abrir-painel="painel-categoria">+ Criar categoria</button>' +
            "</div></details>";
    }

    function blocoCartoes(lista) {
        var itens = lista.length
            ? lista.map(function (c) {
                  return '<div class="linha-categoria">' +
                      '<span class="ponto-cor" style="background:' + c.cor + '"></span>' +
                      '<span class="crescer item-titulo">' + F.escapar(c.nome) + "</span>" +
                      '<div class="acoes">' +
                          '<button type="button" class="botao botao-texto" ' +
                              'data-editar-cartao="' + c.id + '" data-nome="' +
                              F.escapar(c.nome) + '" data-cor="' + c.cor + '" ' +
                              'aria-label="Editar ' + F.escapar(c.nome) +
                              '">Editar</button>' +
                          '<button type="button" class="botao botao-texto" ' +
                              'data-apagar-cartao="' + c.id + '" data-nome="' +
                              F.escapar(c.nome) + '" aria-label="Remover ' +
                              F.escapar(c.nome) + '">' + icone("lixeira") + "</button>" +
                      "</div></div>";
              }).join("")
            : '<div class="vazio"><h3>Nenhum cartão cadastrado</h3>' +
              "<p>Cadastrar seus cartões é opcional. Serve só para você saber depois " +
              "em qual deles gastou mais.</p></div>";

        return '<details class="recolhivel" style="margin-top:var(--e2)">' +
            "<summary><span>Meus cartões e bancos</span> (" + lista.length +
             ")</summary>" +
            '<div class="recolhivel-corpo">' + itens +
                '<button type="button" class="botao botao-suave" ' +
                    'style="margin-top:var(--e2)" data-novo-cartao>' +
                    "+ Cadastrar cartão</button>" +
            "</div></details>";
    }

    function blocoIdioma(atual) {
        return '<section class="cartao" style="margin-top:var(--e2)"><h2>' +
                icone("idioma") + " Idioma</h2>" +
            '<p class="legenda">A escolha fica na sua conta, e não neste aparelho: ' +
                "vale em qualquer lugar em que você fizer login.</p>" +
            '<div class="chips" style="margin-top:var(--e2)">' +
                IDIOMAS.map(function (i) {
                    return '<button type="button" class="chip' +
                        (i[0] === atual ? " ativo" : "") + '" data-idioma="' + i[0] +
                        '">' + i[1] + "</button>";
                }).join("") + "</div></section>";
    }

    function blocoSenha() {
        return '<details class="recolhivel" style="margin-top:var(--e2)">' +
            "<summary>Trocar minha senha</summary>" +
            '<div class="recolhivel-corpo"><form data-form-senha>' +
                '<div class="campo"><label for="senha-atual">Sua senha de agora</label>' +
                    '<input type="password" id="senha-atual" required ' +
                        'autocomplete="current-password"></div>' +
                '<div class="campo"><label for="senha-nova">Sua nova senha</label>' +
                    '<input type="password" id="senha-nova" required minlength="8" ' +
                        'autocomplete="new-password" data-forca-senha>' +
                    '<span class="forca-senha" data-medidor>' +
                        '<span class="forca-marca"></span>' +
                        '<span class="forca-marca"></span>' +
                        '<span class="forca-marca"></span></span>' +
                    '<span class="dica-campo" data-texto-forca></span>' +
                    '<button type="button" class="botao botao-texto" ' +
                        'data-mostrar-senha="senha-nova">Mostrar senha</button></div>' +
                '<button type="submit" class="botao botao-acao">Trocar senha</button>' +
                '<p class="aviso-campo" data-erro-senha hidden></p>' +
            "</form></div></details>";
    }

    function blocoDados() {
        return '<section class="cartao" style="margin-top:var(--e2)">' +
            "<h2>Seus dados são seus</h2>" +
            '<p class="legenda">Baixe tudo o que você registrou em uma planilha. ' +
                "O arquivo abre no Excel e no Google Planilhas.</p>" +
            '<button type="button" class="botao botao-suave" ' +
                'style="margin-top:var(--e2)" data-exportar>' +
                icone("baixar") + " Baixar meus dados (CSV)</button></section>";
    }

    function blocoPerigo() {
        return '<section class="cartao zona-perigo" style="margin-top:var(--e2)">' +
            "<h2>Apagar minha conta</h2>" +
            '<p class="legenda">Apaga a conta e tudo o que está nela: gastos, ganhos, ' +
                "metas, contas e planejamento. Não dá para voltar atrás. Se quiser " +
                "guardar seu histórico, baixe o CSV antes.</p>" +
            '<button type="button" class="botao botao-contorno" ' +
                'style="margin-top:var(--e2)" data-abrir-painel="painel-apagar">' +
                "Quero apagar minha conta</button></section>";
    }

    function desenhar() {
        alvo.className = "";
        alvo.innerHTML =
            meusDados(estado.usuario) +
            blocoCategorias(estado.categorias) +
            blocoCartoes(estado.cartoes) +
            blocoIdioma(estado.usuario.idioma) +
            blocoSenha() +
            blocoDados() +
            blocoPerigo();
    }

    // Painéis: categoria nova, cartão e a confirmação de apagar a conta

    // Os nomes existem para o leitor de tela: "Cor 7" não diz nada a quem
    // não está vendo a tela
    var NOMES_CORES = [
        "azul", "mostarda", "verde-água", "rosa", "lilás", "verde-menta",
        "marrom", "pêssego", "amarelo", "vinho", "azul-claro", "framboesa",
        "azul-piscina", "areia", "sálvia", "cinza",
    ];

    function escolhaDeCor(grupo) {
        return '<div class="paleta">' + CORES.map(function (cor, i) {
            var id = grupo + "-" + i;
            return '<span><input type="radio" name="' + grupo + '" id="' + id +
                '" value="' + cor + '"' + (i === 0 ? " checked" : "") + ">" +
                '<label for="' + id + '" style="--cor-escolha: ' + cor + '" ' +
                'aria-label="Cor ' + (NOMES_CORES[i] || i + 1) + '"></label></span>';
        }).join("") + "</div>";
    }

    function painelCategoria() {
        return '<div class="fundo-escuro" data-fundo="painel-categoria" hidden></div>' +
        '<div class="painel" id="painel-categoria" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-categoria" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-categoria" style="margin:0">Nova categoria</h2>' +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-categoria" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            "<form data-form-categoria>" +
                '<div class="campo"><label for="cat-nome">Nome</label>' +
                    '<input type="text" id="cat-nome" maxlength="60" required ' +
                        'placeholder="Academia"></div>' +

                '<div class="campo"><span class="rotulo">É gasto ou ganho?</span>' +
                    '<div class="alternador" role="radiogroup" aria-label="Tipo">' +
                        '<button type="button" class="chip ativo" data-tipo-cat="gasto" ' +
                            'role="radio" aria-checked="true">Gasto</button>' +
                        '<button type="button" class="chip" data-tipo-cat="ganho" ' +
                            'role="radio" aria-checked="false">Ganho</button>' +
                    "</div></div>" +

                '<label class="interruptor"><span>É uma despesa essencial?</span>' +
                    '<input type="checkbox" id="cat-essencial">' +
                    '<span class="interruptor-trilha"></span></label>' +

                '<fieldset class="campo" style="border:0;padding:0;margin-top:var(--e2)">' +
                    '<legend class="rotulo">Escolha um desenho</legend>' +
                    '<div class="grade-icones">' +
                        ICONES.map(function (nome, i) {
                            return '<span><input type="radio" name="cat-icone" id="ic-' +
                                nome + '" value="' + nome + '"' +
                                (i === 0 ? " checked" : "") + ">" +
                                '<label for="ic-' + nome + '" aria-label="' + nome + '">' +
                                icone(nome) + "</label></span>";
                        }).join("") + "</div></fieldset>" +

                '<fieldset class="campo" style="border:0;padding:0">' +
                    '<legend class="rotulo">E uma cor</legend>' +
                    escolhaDeCor("cat-cor") + "</fieldset>" +

                '<button type="submit" class="botao botao-acao botao-largo">' +
                    "Criar categoria</button>" +
                '<p class="aviso-campo" data-erro-categoria hidden></p>' +
            "</form></div>";
    }

    // O mesmo painel serve para criar e para editar um cartão: o que muda é
    // o título e o id escondido no formulário
    function painelCartao() {
        return '<div class="fundo-escuro" data-fundo="painel-cartao" hidden></div>' +
        '<div class="painel" id="painel-cartao" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-cartao" hidden>' +
            '<div class="painel-alca"></div>' +
            '<div class="linha-entre" style="margin-bottom:var(--e2)">' +
                '<h2 id="titulo-cartao" style="margin:0" data-titulo-cartao>' +
                    "Novo cartão</h2>" +
                '<button type="button" class="botao botao-texto" ' +
                    'data-fechar-painel="painel-cartao" aria-label="Fechar">' +
                    icone("fechar") + "</button></div>" +
            "<form data-form-cartao>" +
                '<input type="hidden" data-cartao-id value="">' +
                '<div class="campo">' +
                    '<label for="cartao-nome">Como você chama esse cartão?</label>' +
                    '<input type="text" id="cartao-nome" maxlength="60" required ' +
                        'placeholder="Nubank">' +
                    '<span class="dica-campo">Só o apelido. O Singra não pede nem ' +
                        "guarda número de cartão.</span></div>" +
                '<fieldset class="campo" style="border:0;padding:0">' +
                    '<legend class="rotulo">Cor para reconhecer de relance</legend>' +
                    escolhaDeCor("cartao-cor") + "</fieldset>" +
                '<button type="submit" class="botao botao-acao botao-largo">' +
                    "Salvar</button>" +
                '<p class="aviso-campo" data-erro-cartao hidden></p>' +
            "</form></div>";
    }

    /* Apagar a conta pede a senha, e não um "tem certeza?". Um clique a mais
       não protege ninguém; a senha protege de quem pegou o celular
       destravado na mesa. */
    function painelApagar() {
        return '<div class="fundo-escuro" data-fundo="painel-apagar" hidden></div>' +
        '<div class="painel" id="painel-apagar" role="dialog" aria-modal="true" ' +
             'aria-labelledby="titulo-apagar" hidden>' +
            '<div class="painel-alca"></div>' +
            '<h2 id="titulo-apagar">Apagar a conta de vez</h2>' +
            '<p class="legenda">Some tudo: gastos, ganhos, metas, contas e ' +
                "planejamento. Não temos como recuperar depois.</p>" +
            '<form data-form-apagar style="margin-top:var(--e2)">' +
                '<div class="campo">' +
                    '<label for="apagar-senha">Digite sua senha para confirmar</label>' +
                    '<input type="password" id="apagar-senha" required ' +
                        'autocomplete="current-password"></div>' +
                '<button type="submit" class="botao botao-contorno botao-largo">' +
                    "Apagar minha conta</button>" +
                '<button type="button" class="botao botao-texto botao-largo" ' +
                    'data-fechar-painel="painel-apagar">Mudei de ideia</button>' +
                '<p class="aviso-campo" data-erro-apagar hidden></p>' +
            "</form></div>";
    }

    document.body.insertAdjacentHTML(
        "beforeend", painelCategoria() + painelCartao() + painelApagar());

    // Carregar

    async function carregar() {
        var respostas = await Promise.all([
            global.ApiPerfil.ler(),
            global.ApiTransacoes.categorias(true),
            global.ApiPlanejamento.listarCartoes(),
        ]);
        if (!respostas[0].ok) return;

        estado.usuario = respostas[0].usuario;
        estado.categorias = respostas[1].ok ? respostas[1].itens : [];
        estado.cartoes = respostas[2].ok ? respostas[2].itens : [];
        desenhar();
    }

    // Formulários

    document.addEventListener("submit", async function (evento) {
        var form = evento.target;

        if (form.matches("[data-form-dados]")) {
            evento.preventDefault();
            var renda = F.paraNumero(document.getElementById("perfil-renda").value);
            var botaoDados = form.querySelector("[type=submit]");

            global.Carregando.ocupado(botaoDados, true, "Salvando…");
            var d = await global.ApiPerfil.atualizar({
                nome: document.getElementById("perfil-nome").value.trim(),
                apelido: document.getElementById("perfil-apelido").value.trim(),
                dia_inicio_mes: Number(document.getElementById("perfil-dia").value) || 1,
                renda: renda === null ? 0 : renda,
                renda_variavel: document.getElementById("perfil-renda-variavel").checked,
            });
            global.Carregando.ocupado(botaoDados, false);
            global.Avisos.daResposta(d);
            if (d.ok) estado.usuario = d.usuario;
            return;
        }

        if (form.matches("[data-form-senha]")) {
            evento.preventDefault();
            var avisoSenha = document.querySelector("[data-erro-senha]");
            avisoSenha.hidden = true;

            var nova = document.getElementById("senha-nova").value;
            if (nova.length < 8) {
                avisoSenha.textContent =
                    "A nova senha precisa de pelo menos 8 caracteres.";
                avisoSenha.hidden = false;
                return;
            }

            var botaoSenha = form.querySelector("[type=submit]");
            global.Carregando.ocupado(botaoSenha, true, "Trocando…");
            var s = await global.ApiPerfil.trocarSenha(
                document.getElementById("senha-atual").value, nova);
            global.Carregando.ocupado(botaoSenha, false);

            if (!s.ok) {
                avisoSenha.textContent = s.mensagem;
                avisoSenha.hidden = false;
                return;
            }
            form.reset();
            global.Avisos.mostrar(s.mensagem);
            return;
        }

        if (form.matches("[data-form-categoria]")) {
            evento.preventDefault();
            var avisoCat = document.querySelector("[data-erro-categoria]");
            avisoCat.hidden = true;

            var botaoCat = form.querySelector("[type=submit]");
            global.Carregando.ocupado(botaoCat, true, "Criando…");
            var c = await global.ApiPerfil.criarCategoria({
                nome: document.getElementById("cat-nome").value.trim(),
                tipo: form.querySelector("[data-tipo-cat].ativo").dataset.tipoCat,
                essencial: document.getElementById("cat-essencial").checked,
                icone: form.querySelector("[name=cat-icone]:checked").value,
                cor: form.querySelector("[name=cat-cor]:checked").value,
            });
            global.Carregando.ocupado(botaoCat, false);

            if (!c.ok) {
                avisoCat.textContent = c.mensagem;
                avisoCat.hidden = false;
                return;
            }
            global.Painel.fechar("painel-categoria");
            global.Avisos.mostrar(c.mensagem);
            form.reset();
            carregar();
            return;
        }

        if (form.matches("[data-form-cartao]")) {
            evento.preventDefault();
            var avisoCartao = document.querySelector("[data-erro-cartao]");
            avisoCartao.hidden = true;

            var id = form.querySelector("[data-cartao-id]").value;
            var nomeCartao = document.getElementById("cartao-nome").value.trim();
            var corCartao = form.querySelector("[name=cartao-cor]:checked").value;

            var botaoCartao = form.querySelector("[type=submit]");
            global.Carregando.ocupado(botaoCartao, true, "Salvando…");
            var r = id
                ? await global.ApiPlanejamento.editarCartao(
                      Number(id), nomeCartao, corCartao)
                : await global.ApiPlanejamento.criarCartao(nomeCartao, corCartao);
            global.Carregando.ocupado(botaoCartao, false);

            if (!r.ok) {
                avisoCartao.textContent = r.mensagem;
                avisoCartao.hidden = false;
                return;
            }
            global.Painel.fechar("painel-cartao");
            global.Avisos.mostrar(r.mensagem);
            carregar();
            return;
        }

        if (form.matches("[data-form-apagar]")) {
            evento.preventDefault();
            var avisoApagar = document.querySelector("[data-erro-apagar]");
            avisoApagar.hidden = true;

            var botaoApagar = form.querySelector("[type=submit]");
            global.Carregando.ocupado(botaoApagar, true, "Apagando…");
            var a = await global.ApiPerfil.apagarConta(
                document.getElementById("apagar-senha").value);

            if (!a.ok) {
                global.Carregando.ocupado(botaoApagar, false);
                avisoApagar.textContent = a.mensagem;
                avisoApagar.hidden = false;
                return;
            }
            // A sessão já foi encerrada dentro do apagarConta
            global.location.href = "index.html";
        }
    });

    // Cliques

    document.addEventListener("click", async function (evento) {
        var tipoCat = evento.target.closest("[data-tipo-cat]");
        if (tipoCat) {
            tipoCat.parentElement.querySelectorAll("[data-tipo-cat]").forEach(
                function (b) {
                    b.classList.toggle("ativo", b === tipoCat);
                    b.setAttribute("aria-checked", b === tipoCat ? "true" : "false");
                });
            return;
        }

        var idioma = evento.target.closest("[data-idioma]");
        if (idioma) {
            if (idioma.classList.contains("ativo")) return;
            var i = await global.ApiPerfil.salvarIdioma(idioma.dataset.idioma);
            if (!i.ok) return global.Avisos.problema(i.mensagem);

            /* A tela troca de língua na hora, sem recarregar: o Idioma
               guardou o original de cada texto e refaz a passagem por cima
               do que já está na tela. */
            global.Idioma.definir(idioma.dataset.idioma);
            alvo.querySelectorAll("[data-idioma]").forEach(function (botao) {
                botao.classList.toggle("ativo", botao === idioma);
            });
            global.Avisos.mostrar(i.mensagem);
            return;
        }

        var renomear = evento.target.closest("[data-renomear]");
        if (renomear) {
            var novoNome = global.prompt("Novo nome da categoria:",
                                         renomear.dataset.nome);
            if (novoNome === null || !novoNome.trim()) return;
            var rn = await global.ApiPerfil.editarCategoria(
                Number(renomear.dataset.renomear), { nome: novoNome.trim() });
            global.Avisos.daResposta(rn);
            if (rn.ok) carregar();
            return;
        }

        var ocultar = evento.target.closest("[data-ocultar]");
        if (ocultar) {
            var esconder = ocultar.dataset.estado === "0";
            var oc = await global.ApiPerfil.editarCategoria(
                Number(ocultar.dataset.ocultar), { oculta: esconder });
            global.Avisos.daResposta(oc);
            if (oc.ok) carregar();
            return;
        }

        var novoCartao = evento.target.closest("[data-novo-cartao]");
        if (novoCartao) {
            document.querySelector("[data-titulo-cartao]").textContent = "Novo cartão";
            document.querySelector("[data-cartao-id]").value = "";
            document.getElementById("cartao-nome").value = "";
            global.Painel.abrir("painel-cartao");
            return;
        }

        var editarCartao = evento.target.closest("[data-editar-cartao]");
        if (editarCartao) {
            document.querySelector("[data-titulo-cartao]").textContent = "Editar cartão";
            document.querySelector("[data-cartao-id]").value =
                editarCartao.dataset.editarCartao;
            document.getElementById("cartao-nome").value = editarCartao.dataset.nome;
            var marcada = document.querySelector(
                '[name=cartao-cor][value="' + editarCartao.dataset.cor + '"]');
            if (marcada) marcada.checked = true;
            global.Painel.abrir("painel-cartao");
            return;
        }

        var apagarCartao = evento.target.closest("[data-apagar-cartao]");
        if (apagarCartao) {
            global.Painel.confirmar({
                titulo: "Remover o cartão " + apagarCartao.dataset.nome + "?",
                texto: "Os gastos feitos nele continuam no histórico, só passam a " +
                       "contar como sem cartão vinculado.",
                confirmar: "Remover",
                aoConfirmar: async function () {
                    var ac = await global.ApiPlanejamento.apagarCartao(
                        Number(apagarCartao.dataset.apagarCartao));
                    global.Avisos.daResposta(ac);
                    if (ac.ok) carregar();
                },
            });
            return;
        }

        var exportar = evento.target.closest("[data-exportar]");
        if (exportar) {
            global.Carregando.ocupado(exportar, true, "Preparando…");
            var ex = await global.ApiPerfil.exportarCSV();
            global.Carregando.ocupado(exportar, false);
            global.Avisos.daResposta(ex);
        }
    });

    carregar();
})(window);
