/* Singra - chamadas de perfil, categorias e onboarding
   Inclui as duas ações que tratam os dados como propriedade da pessoa:
   baixar tudo em CSV e apagar a conta.

   Requer o cliente.js e o sessao.js. */

window.ApiPerfil = (function (global) {
    "use strict";

    var Api = global.Api;

    function ler() {
        return Api.pedirComEspera("GET", "/api/perfil");
    }

    async function atualizar(dados) {
        var resposta = await Api.put("/api/perfil", dados);
        // Mantém o que está guardado no navegador igual ao que está no banco
        if (resposta.ok && resposta.usuario) {
            global.Sessao.atualizarUsuario(resposta.usuario);
        }
        return resposta;
    }

    function trocarSenha(atual, nova) {
        return Api.put("/api/perfil/senha", { senha_atual: atual, senha_nova: nova });
    }

    /* O idioma fica no perfil, no banco, e não no navegador: assim a
       escolha vale em qualquer aparelho em que a pessoa fizer login. */
    function salvarIdioma(idioma) {
        return atualizar({ idioma: idioma });
    }

    // Onboarding: cada passo manda só o que tem, e nenhum é obrigatório
    async function onboarding(dados) {
        var resposta = await Api.post("/api/onboarding", dados);
        if (resposta.ok && resposta.usuario) {
            global.Sessao.atualizarUsuario(resposta.usuario);
        }
        return resposta;
    }

    // Categorias

    function criarCategoria(dados) {
        return Api.post("/api/categorias", dados);
    }

    // Esconder, e não apagar: os gastos já registrados precisam continuar
    // apontando para alguma categoria
    function editarCategoria(id, dados) {
        return Api.put("/api/categorias/" + id, dados);
    }

    /* O CSV vem de outro domínio, então o navegador não baixa sozinho por
       um link comum: buscamos o arquivo com o token, viramos um endereço
       temporário na memória e disparamos o download a partir dele. */
    async function exportarCSV() {
        if (!Api.configurada()) {
            return { ok: false, mensagem: "O endereço da API ainda não foi configurado." };
        }
        try {
            var resposta = await fetch(Api.base + "/api/perfil/exportar", {
                headers: { Authorization: "Bearer " + global.Sessao.token() },
            });
            if (!resposta.ok) {
                return { ok: false, mensagem: "Não conseguimos preparar seu arquivo agora." };
            }

            var conteudo = await resposta.blob();
            var endereco = URL.createObjectURL(conteudo);
            var link = document.createElement("a");
            link.href = endereco;
            link.download = "singra-meus-dados.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(endereco);

            return { ok: true, mensagem: "Pronto! Seus dados foram baixados." };
        } catch (erro) {
            return { ok: false, mensagem: "Não conseguimos baixar agora. Tente de novo." };
        }
    }

    async function apagarConta(senha) {
        var resposta = await Api.remover("/api/perfil", { senha: senha });
        if (resposta.ok) global.Sessao.sair();
        return resposta;
    }

    return {
        ler: ler,
        atualizar: atualizar,
        trocarSenha: trocarSenha,
        salvarIdioma: salvarIdioma,
        onboarding: onboarding,
        criarCategoria: criarCategoria,
        editarCategoria: editarCategoria,
        exportarCSV: exportarCSV,
        apagarConta: apagarConta,
    };
})(window);
