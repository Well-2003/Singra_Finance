"""Singra - gera a documentação a partir do código, e não à mão.

Dois arquivos saem daqui, os dois em `docs/`.

O api-swagger.json traz a lista de rotas, lida do próprio Flask. Uma rota
nova aparece nele sem ninguém precisar lembrar de anotá-la, e o que se
escreve à mão é só a descrição de cada uma, logo abaixo.

O diagrama_banco.svg traz as tabelas e as chaves estrangeiras, lidas do DDL
em src/db/models.py.

Documentação escrita à mão envelhece calada. Gerada do código, ela erra alto:
uma rota sem descrição vira "sem descrição" no arquivo, à vista de todos.

O diagrama sai em SVG, e não em PNG como pedia a documentação do produto.
SVG é texto, então cabe no diff de um commit, abre em qualquer navegador e
não perde nitidez quando alguém dá zoom para ler o nome de uma coluna.
"""

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))

DESTINO = RAIZ.parent / "docs"

# O que cada rota faz, em uma linha. A chave é "MÉTODO caminho".
DESCRICOES = {
    "GET /": "Diz se a API está de pé e se o banco respondeu.",
    "GET /api": "Diz se a API está de pé e se o banco respondeu.",
    "POST /api/auth/forca-senha":
        "Avalia a força de uma senha, com a mesma régua usada na tela.",
    "POST /api/auth/cadastro": "Cria a conta e devolve o token de acesso.",
    "POST /api/auth/login": "Confere e-mail e senha e devolve o token.",
    "POST /api/auth/recuperar-senha":
        "Gera o link de redefinição de senha para o e-mail informado.",
    "POST /api/auth/redefinir-senha":
        "Troca a senha a partir do token recebido no link.",
    "GET /api/auth/eu": "Devolve quem está logado, para conferir o token.",

    "GET /api/perfil": "Lê nome, apelido, renda, dia de início do mês e idioma.",
    "PUT /api/perfil": "Atualiza os dados do perfil, inclusive o idioma.",
    "PUT /api/perfil/senha": "Troca a senha, exigindo a senha atual.",
    "GET /api/perfil/exportar": "Baixa todas as transações em CSV.",
    "DELETE /api/perfil": "Apaga a conta e tudo o que está nela.",
    "POST /api/onboarding": "Guarda as respostas do primeiro acesso.",

    "GET /api/categorias": "Lista as categorias do usuário e as mais usadas.",
    "POST /api/categorias": "Cria uma categoria.",
    "PUT /api/categorias/<int:categoria_id>":
        "Renomeia, troca ícone e cor, esconde ou mostra a categoria.",

    "POST /api/transacoes": "Registra um gasto ou um ganho, parcelando se pedido.",
    "PUT /api/transacoes/<int:transacao_id>": "Corrige um registro.",
    "DELETE /api/transacoes/<int:transacao_id>":
        "Apaga um registro ou a compra parcelada inteira.",
    "GET /api/transacoes": "Histórico, com os filtros da tela.",
    "GET /api/painel": "Tudo o que a tela Início mostra, em uma requisição só.",
    "GET /api/resumo": "Ganhos, gastos, disponível, taxa de poupança e guardado.",

    "GET /api/graficos/categorias": "Gastos por categoria no mês.",
    "GET /api/graficos/evolucao": "Ganhos, gastos e saldo dos últimos meses.",
    "GET /api/graficos/orcamento": "Planejado contra realizado, por categoria.",
    "GET /api/graficos/fixos-variaveis":
        "Divisão entre gastos fixos e variáveis.",
    "GET /api/graficos/cartoes":
        'Gastos por cartão ou banco, com a fatia "sem cartão vinculado".',
    "GET /api/graficos/investimento": "Quanto foi guardado em cada período.",

    "GET /api/orcamentos": "Limites do mês, categoria por categoria.",
    "PUT /api/orcamentos": "Define o limite de uma categoria no mês.",
    "POST /api/orcamentos/sugerir": "Monta um planejamento pela regra 50/30/20.",
    "POST /api/orcamentos/copiar": "Copia os limites do mês anterior.",

    "GET /api/metas": "Metas, meta de investimento e reserva sugerida.",
    "POST /api/metas": "Cria uma meta comum.",
    "POST /api/metas/investimento": "Cria ou edita a meta de investimento.",
    "PUT /api/metas/<int:meta_id>": "Edita nome, valor, prazo ou ícone.",
    "DELETE /api/metas/<int:meta_id>": "Apaga a meta e os aportes dela.",
    "POST /api/metas/<int:meta_id>/aportes": "Guarda dinheiro em uma meta.",

    "GET /api/contas":
        "Contas do mês, mais as recorrentes previstas e o já comprometido.",
    "POST /api/contas": "Cadastra uma conta a pagar.",
    "DELETE /api/contas/<int:conta_id>": "Apaga uma conta a pagar.",
    "POST /api/contas/<int:conta_id>/pagar":
        "Marca como paga, registra o gasto e renova a conta recorrente.",
    "POST /api/contas/<int:conta_id>/desfazer-pagamento":
        "Volta a conta para a pagar e apaga o gasto criado.",

    "GET /api/cartoes": "Lista os cartões e bancos do usuário.",
    "POST /api/cartoes": "Cadastra um cartão ou banco.",
    "PUT /api/cartoes/<int:cartao_id>": "Renomeia ou troca a cor.",
    "DELETE /api/cartoes/<int:cartao_id>":
        "Remove o cartão. Os gastos dele continuam no histórico.",
}

SEM_TOKEN = {
    "GET /",
    "GET /api",
    "POST /api/auth/forca-senha",
    "POST /api/auth/cadastro",
    "POST /api/auth/login",
    "POST /api/auth/recuperar-senha",
    "POST /api/auth/redefinir-senha",
}


# API
def caminho_openapi(regra):
    """Troca <int:meta_id> por {meta_id}, que é como o OpenAPI escreve."""
    return re.sub(r"<(?:[^:<>]+:)?([^<>]+)>", r"{\1}", regra)


def parametros(regra):
    nomes = re.findall(r"<(?:[^:<>]+:)?([^<>]+)>", regra)
    return [
        {
            "name": nome,
            "in": "path",
            "required": True,
            "schema": {"type": "integer"},
        }
        for nome in nomes
    ]


def gerar_swagger():
    from src.main import criar_app

    app = criar_app()
    caminhos = {}
    sem_descricao = []

    for regra in sorted(app.url_map.iter_rules(), key=lambda r: str(r)):
        if regra.endpoint == "static":
            continue

        for metodo in sorted(regra.methods - {"HEAD", "OPTIONS"}):
            chave = f"{metodo} {regra.rule}"
            descricao = DESCRICOES.get(chave)
            if descricao is None:
                descricao = "Sem descrição. Falta cadastrar em gerar_docs.py."
                sem_descricao.append(chave)

            operacao = {
                "summary": descricao,
                "tags": [regra.rule.split("/")[2] if regra.rule.count("/") > 2
                         else "geral"],
                "responses": {
                    "200": {"description": "Deu certo."},
                    "400": {"description": "Falta algum campo ou ele veio errado."},
                },
            }

            if parametros(regra.rule):
                operacao["parameters"] = parametros(regra.rule)

            if chave not in SEM_TOKEN:
                operacao["security"] = [{"tokenSingra": []}]
                operacao["responses"]["401"] = {
                    "description": "Sem token, ou com o token vencido."
                }

            caminhos.setdefault(caminho_openapi(regra.rule), {})[metodo.lower()] = (
                operacao
            )

    documento = {
        "openapi": "3.0.3",
        "info": {
            "title": "Singra API",
            "version": "1.0.0",
            "description": (
                "API do Singra. Só JSON: quem desenha as telas é o frontend "
                "estático, publicado à parte. Toda rota que não seja de "
                "autenticação espera o cabeçalho Authorization: Bearer <token>, "
                "e devolve apenas os dados do dono do token."
            ),
        },
        "servers": [
            {"url": "http://127.0.0.1:5000", "description": "Desenvolvimento"},
            {"url": "https://singra-api.onrender.com", "description": "Produção"},
        ],
        "components": {
            "securitySchemes": {
                "tokenSingra": {
                    "type": "http",
                    "scheme": "bearer",
                    "description": (
                        "Token assinado devolvido pelo login. Vale 30 dias."
                    ),
                }
            }
        },
        "paths": caminhos,
    }

    destino = DESTINO / "api-swagger.json"
    destino.write_text(
        json.dumps(documento, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return len(caminhos), sem_descricao


# Diagrama do banco
LARGURA_CAIXA = 250
ALTURA_LINHA = 18
ESPACO_X = 300
ESPACO_Y = 40

CORES = {
    "fundo": "#F6F1E7",
    "caixa": "#FFFDF9",
    "borda": "#E6DFD1",
    "titulo": "#DCE5D3",
    "texto": "#3B3F3A",
    "suave": "#6F756C",
    "chave": "#6F8A62",
    "seta": "#B5B5A8",
}


def ler_tabelas():
    """Lê nome, colunas e chaves estrangeiras direto do DDL."""
    from src.db.models import TABELAS

    tabelas = []
    for nome, ddl in TABELAS:
        colunas = []
        chaves = []
        primaria = ""

        for linha in ddl.splitlines():
            linha = linha.strip().rstrip(",")
            if not linha or linha.startswith(("CREATE", ")", "ENGINE")):
                continue

            if linha.startswith("PRIMARY KEY"):
                primaria = re.search(r"\((.*?)\)", linha).group(1)
                continue
            if linha.startswith(("KEY", "UNIQUE KEY", "CONSTRAINT", "REFERENCES")):
                fk = re.search(r"FOREIGN KEY \((\w+)\)", linha)
                if fk:
                    chaves.append(fk.group(1))
                continue

            partes = linha.split()
            if len(partes) < 2:
                continue

            nome_coluna, tipo = partes[0], partes[1]

            # Linhas que continuam a anterior (um ENUM quebrado em duas, um
            # ON DELETE CASCADE solto) não são colunas: o primeiro pedaço
            # delas é palavra reservada, sempre em maiúsculas
            if not re.match(r"^[a-z_]+$", nome_coluna):
                continue

            # Um ENUM comprido estoura a largura da caixa, e o nome do
            # tipo já diz o que precisa ser dito
            if tipo.upper().startswith("ENUM") and ")" not in tipo:
                tipo = "ENUM"
            if len(tipo) > 22:
                tipo = tipo[:21] + "…"

            colunas.append((nome_coluna, tipo))

        # No DDL a referência costuma cair na linha seguinte ao FOREIGN KEY,
        # então a busca das ligações é feita no texto inteiro, e não linha a
        # linha como o resto
        ligacoes = re.findall(
            r"FOREIGN KEY \((\w+)\)\s*\n?\s*REFERENCES (\w+)", ddl
        )
        tabelas.append({
            "nome": nome,
            "colunas": colunas,
            "primaria": primaria,
            "chaves": chaves,
            "ligacoes": ligacoes,
        })
    return tabelas


def escapar(texto):
    return (texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def gerar_diagrama():
    tabelas = ler_tabelas()

    # Três colunas: cabe numa tela sem virar um fio de espaguete
    posicoes = {}
    x = y = 0
    altura_coluna = [0, 0, 0]
    for indice, tabela in enumerate(tabelas):
        coluna = indice % 3
        x = 40 + coluna * ESPACO_X
        y = 70 + altura_coluna[coluna]
        posicoes[tabela["nome"]] = (x, y)
        altura_coluna[coluna] += 46 + len(tabela["colunas"]) * ALTURA_LINHA + ESPACO_Y

    largura = 40 + 3 * ESPACO_X
    altura = 70 + max(altura_coluna)

    partes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{largura}" '
        f'height="{altura}" viewBox="0 0 {largura} {altura}" '
        f'font-family="Nunito, Segoe UI, system-ui, sans-serif" font-size="12">',
        f'<rect width="100%" height="100%" fill="{CORES["fundo"]}"/>',
        f'<text x="40" y="40" font-size="22" font-weight="700" '
        f'fill="{CORES["texto"]}">Singra &#183; banco de dados</text>',
    ]

    # As ligações primeiro, para ficarem atrás das caixas
    for tabela in tabelas:
        origem = posicoes[tabela["nome"]]
        for _, destino_nome in tabela["ligacoes"]:
            if destino_nome not in posicoes:
                continue
            destino = posicoes[destino_nome]
            partes.append(
                f'<line x1="{origem[0]}" y1="{origem[1] + 14}" '
                f'x2="{destino[0] + LARGURA_CAIXA}" y2="{destino[1] + 14}" '
                f'stroke="{CORES["seta"]}" stroke-width="1.5" '
                f'stroke-dasharray="4 3"/>'
            )

    for tabela in tabelas:
        x, y = posicoes[tabela["nome"]]
        altura_caixa = 30 + len(tabela["colunas"]) * ALTURA_LINHA + 8

        partes.append(
            f'<rect x="{x}" y="{y}" width="{LARGURA_CAIXA}" height="{altura_caixa}" '
            f'rx="10" fill="{CORES["caixa"]}" stroke="{CORES["borda"]}"/>'
        )
        partes.append(
            f'<path d="M{x} {y + 10} a10 10 0 0 1 10-10 h{LARGURA_CAIXA - 20} '
            f'a10 10 0 0 1 10 10 v20 h-{LARGURA_CAIXA} z" '
            f'fill="{CORES["titulo"]}"/>'
        )
        partes.append(
            f'<text x="{x + 12}" y="{y + 21}" font-weight="700" '
            f'fill="{CORES["texto"]}">{escapar(tabela["nome"])}</text>'
        )

        linha_y = y + 30 + 12
        for coluna, tipo in tabela["colunas"]:
            marca = ""
            cor = CORES["texto"]
            if coluna == tabela["primaria"]:
                marca = "PK "
                cor = CORES["chave"]
            elif coluna in tabela["chaves"]:
                marca = "FK "
                cor = CORES["chave"]

            partes.append(
                f'<text x="{x + 12}" y="{linha_y}" fill="{cor}">'
                f'{marca}{escapar(coluna)}</text>'
            )
            partes.append(
                f'<text x="{x + LARGURA_CAIXA - 12}" y="{linha_y}" '
                f'text-anchor="end" fill="{CORES["suave"]}" font-size="11">'
                f'{escapar(tipo)}</text>'
            )
            linha_y += ALTURA_LINHA

    partes.append(
        f'<text x="40" y="{altura - 16}" fill="{CORES["suave"]}" font-size="11">'
        f'Gerado por backend/gerar_docs.py a partir de src/db/models.py</text>'
    )
    partes.append("</svg>")

    destino = DESTINO / "diagrama_banco.svg"
    destino.write_text("\n".join(partes) + "\n", encoding="utf-8")
    return len(tabelas)


def main():
    DESTINO.mkdir(exist_ok=True)

    rotas, sem_descricao = gerar_swagger()
    print(f"docs/api-swagger.json: {rotas} caminhos")
    for chave in sem_descricao:
        print("  sem descrição:", chave)

    tabelas = gerar_diagrama()
    print(f"docs/diagrama_banco.svg: {tabelas} tabelas")


if __name__ == "__main__":
    main()
