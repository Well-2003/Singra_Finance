"""Singra - definição das tabelas e dos dados iniciais.

Guarda o DDL do banco e a carga das categorias modelo. Roda sozinho na
primeira subida do backend (ver main.py), o que é o que permite publicar no
Render apontando para um banco vazio da Aiven ou do TiDB Cloud sem precisar
abrir um cliente de MySQL para rodar script à mão.

Executar manualmente:  python -m src.db.models
"""

from src.db import conexao

# As tabelas são criadas nesta ordem e removidas na inversa, por causa das
# chaves estrangeiras.
TABELAS = [
    ("usuarios", """
        CREATE TABLE IF NOT EXISTS usuarios (
            id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
            nome            VARCHAR(100)     NOT NULL,
            apelido         VARCHAR(40)      NULL,
            email           VARCHAR(150)     NOT NULL,
            senha_hash      VARCHAR(255)     NOT NULL,
            renda_estimada  DECIMAL(12,2)    NULL,
            renda_variavel  BOOLEAN          NOT NULL DEFAULT FALSE,
            dia_inicio_mes  TINYINT UNSIGNED NOT NULL DEFAULT 1,
            idioma          ENUM('pt','en','es') NOT NULL DEFAULT 'pt',
            onboarding_ok   BOOLEAN          NOT NULL DEFAULT FALSE,
            criado_em       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_usuarios_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # usuario_id nulo marca a categoria modelo do sistema. Cada conta nova
    # recebe a própria cópia, e por isso pode renomear e esconder categorias
    # sem afetar as contas dos outros.
    ("categorias", """
        CREATE TABLE IF NOT EXISTS categorias (
            id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
            usuario_id  INT UNSIGNED     NULL,
            nome        VARCHAR(60)      NOT NULL,
            tipo        ENUM('gasto','ganho') NOT NULL DEFAULT 'gasto',
            essencial   BOOLEAN          NOT NULL DEFAULT FALSE,
            icone       VARCHAR(40)      NOT NULL DEFAULT 'outros',
            cor         CHAR(7)          NOT NULL DEFAULT '#B5B5A8',
            oculta      BOOLEAN          NOT NULL DEFAULT FALSE,
            ordem       TINYINT UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY idx_categorias_usuario (usuario_id, tipo, oculta),
            CONSTRAINT fk_categorias_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # Cartões e contas bancárias. Recurso opcional: quem não cadastrar
    # nenhum nunca vê o campo de vínculo nem o gráfico correspondente.
    ("cartoes_bancos", """
        CREATE TABLE IF NOT EXISTS cartoes_bancos (
            id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
            usuario_id INT UNSIGNED NOT NULL,
            nome       VARCHAR(60)  NOT NULL,
            cor        CHAR(7)      NOT NULL DEFAULT '#8FA3B8',
            criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_cartoes_usuario (usuario_id),
            CONSTRAINT fk_cartoes_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # As parcelas de uma mesma compra compartilham o grupo_parcela, o que
    # permite apagar a compra inteira a partir de qualquer uma delas.
    ("transacoes", """
        CREATE TABLE IF NOT EXISTS transacoes (
            id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
            usuario_id      INT UNSIGNED     NOT NULL,
            categoria_id    INT UNSIGNED     NOT NULL,
            cartao_id       INT UNSIGNED     NULL,
            tipo            ENUM('gasto','ganho') NOT NULL DEFAULT 'gasto',
            valor           DECIMAL(12,2)    NOT NULL,
            descricao       VARCHAR(120)     NULL,
            data            DATE             NOT NULL,
            forma_pagamento ENUM('pix','dinheiro','debito','credito','boleto')
                            NOT NULL DEFAULT 'pix',
            fixa            BOOLEAN          NOT NULL DEFAULT FALSE,
            parcela_atual   TINYINT UNSIGNED NULL,
            parcela_total   TINYINT UNSIGNED NULL,
            grupo_parcela   CHAR(36)         NULL,
            criado_em       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_transacoes_usuario_data (usuario_id, data),
            KEY idx_transacoes_grupo (grupo_parcela),
            CONSTRAINT fk_transacoes_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT fk_transacoes_categoria FOREIGN KEY (categoria_id)
                REFERENCES categorias(id),
            CONSTRAINT fk_transacoes_cartao FOREIGN KEY (cartao_id)
                REFERENCES cartoes_bancos(id) ON DELETE SET NULL,
            CONSTRAINT ck_transacoes_valor CHECK (valor > 0)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # A chave única permite gravar e regravar o mesmo limite em uma
    # instrução só, sem criar linha duplicada.
    ("orcamentos", """
        CREATE TABLE IF NOT EXISTS orcamentos (
            id           INT UNSIGNED      NOT NULL AUTO_INCREMENT,
            usuario_id   INT UNSIGNED      NOT NULL,
            categoria_id INT UNSIGNED      NOT NULL,
            ano          SMALLINT UNSIGNED NOT NULL,
            mes          TINYINT UNSIGNED  NOT NULL,
            valor_limite DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
            PRIMARY KEY (id),
            UNIQUE KEY uq_orcamento (usuario_id, categoria_id, ano, mes),
            CONSTRAINT fk_orcamentos_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT fk_orcamentos_categoria FOREIGN KEY (categoria_id)
                REFERENCES categorias(id) ON DELETE CASCADE,
            CONSTRAINT ck_orcamentos_mes CHECK (mes BETWEEN 1 AND 12)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # eh_investimento marca a meta especial, que tem cadência própria e se
    # renova a cada período em vez de ter prazo. Só uma ativa por usuário.
    ("metas", """
        CREATE TABLE IF NOT EXISTS metas (
            id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
            usuario_id         INT UNSIGNED  NOT NULL,
            nome               VARCHAR(80)   NOT NULL,
            valor_alvo         DECIMAL(12,2) NOT NULL,
            prazo              DATE          NULL,
            icone              VARCHAR(40)   NOT NULL DEFAULT 'meta',
            reserva_emergencia BOOLEAN       NOT NULL DEFAULT FALSE,
            eh_investimento    BOOLEAN       NOT NULL DEFAULT FALSE,
            cadencia           ENUM('diaria','semanal','mensal','anual') NULL,
            concluida_em       DATETIME      NULL,
            criado_em          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_metas_usuario (usuario_id),
            CONSTRAINT fk_metas_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT ck_metas_alvo CHECK (valor_alvo > 0)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # Quanto já foi guardado nunca é uma coluna: é a soma destes registros.
    ("aportes_meta", """
        CREATE TABLE IF NOT EXISTS aportes_meta (
            id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
            meta_id INT UNSIGNED  NOT NULL,
            valor   DECIMAL(12,2) NOT NULL,
            data    DATE          NOT NULL,
            PRIMARY KEY (id),
            KEY idx_aportes_meta (meta_id, data),
            CONSTRAINT fk_aportes_meta FOREIGN KEY (meta_id)
                REFERENCES metas(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # Só um rótulo informativo do onboarding: não entra em cálculo nenhum.
    ("renda_extra", """
        CREATE TABLE IF NOT EXISTS renda_extra (
            id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
            usuario_id     INT UNSIGNED  NOT NULL,
            tipo           VARCHAR(40)   NOT NULL,
            valor_estimado DECIMAL(12,2) NULL,
            PRIMARY KEY (id),
            KEY idx_renda_extra_usuario (usuario_id),
            CONSTRAINT fk_renda_extra_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # transacao_id guarda o gasto criado ao marcar como paga, e é o que
    # permite desfazer o pagamento sem deixar lançamento órfão.
    ("contas_pagar", """
        CREATE TABLE IF NOT EXISTS contas_pagar (
            id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
            usuario_id   INT UNSIGNED  NOT NULL,
            categoria_id INT UNSIGNED  NOT NULL,
            descricao    VARCHAR(100)  NOT NULL,
            valor        DECIMAL(12,2) NOT NULL,
            vencimento   DATE          NOT NULL,
            recorrente   BOOLEAN       NOT NULL DEFAULT FALSE,
            paga_em      DATE          NULL,
            transacao_id INT UNSIGNED  NULL,
            PRIMARY KEY (id),
            KEY idx_contas_usuario_venc (usuario_id, vencimento),
            CONSTRAINT fk_contas_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT fk_contas_categoria FOREIGN KEY (categoria_id)
                REFERENCES categorias(id),
            CONSTRAINT fk_contas_transacao FOREIGN KEY (transacao_id)
                REFERENCES transacoes(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),

    # Guarda o hash do token, nunca o token: quem ler a tabela não consegue
    # montar um link de redefinição válido.
    ("tokens_senha", """
        CREATE TABLE IF NOT EXISTS tokens_senha (
            id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
            usuario_id INT UNSIGNED NOT NULL,
            token_hash CHAR(64)     NOT NULL,
            expira_em  DATETIME     NOT NULL,
            usado_em   DATETIME     NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_token_hash (token_hash),
            CONSTRAINT fk_tokens_usuario FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """),
]

# Categorias modelo do sistema, copiadas para cada conta nova.
# (nome, tipo, essencial, ícone, cor, ordem)
CATEGORIAS_MODELO = [
    ("Moradia",             "gasto", True,  "moradia",     "#8FA3B8",  1),
    ("Alimentação",         "gasto", True,  "alimentacao", "#C9A86A",  2),
    ("Transporte",          "gasto", True,  "transporte",  "#7FA9A3",  3),
    ("Saúde",               "gasto", True,  "saude",       "#D9A0A8",  4),
    ("Contas da casa",      "gasto", True,  "contas",      "#A99BC0",  5),
    ("Educação",            "gasto", True,  "educacao",    "#8FB0A0",  6),
    ("Dívidas e parcelas",  "gasto", True,  "dividas",     "#A88F86",  7),
    ("Lazer",               "gasto", False, "lazer",       "#F4A27A",  8),
    ("Delivery",            "gasto", False, "delivery",    "#E0B15A",  9),
    ("Compras",             "gasto", False, "compras",     "#B88C9E", 10),
    ("Assinaturas",         "gasto", False, "assinaturas", "#9CB0C8", 11),
    ("Beleza",              "gasto", False, "beleza",      "#C9909E", 12),
    ("Viagens",             "gasto", False, "viagens",     "#7FB0BF", 13),
    ("Pets",                "gasto", False, "pets",        "#C4A484", 14),
    ("Outros gastos",       "gasto", False, "outros",      "#B5B5A8", 15),
    ("Salário",             "ganho", False, "salario",     "#9CAF88",  1),
    ("Renda extra",         "ganho", False, "renda-extra", "#8FB0A0",  2),
    ("Presente",            "ganho", False, "presente",    "#D9A0A8",  3),
    ("Reembolso",           "ganho", False, "reembolso",   "#9CB0C8",  4),
    ("Rendimento",          "ganho", False, "rendimento",  "#7FA9A3",  5),
    ("Outros ganhos",       "ganho", False, "outros",      "#B5B5A8",  6),
]


def criar_tabelas():
    """Cria o que ainda não existe. Seguro de rodar em banco já povoado."""
    for nome, ddl in TABELAS:
        conexao.executar(ddl)
    return [nome for nome, _ in TABELAS]


def carregar_categorias_modelo():
    """Recarrega os modelos do sistema sem tocar nas cópias dos usuários."""
    conexao.executar("DELETE FROM categorias WHERE usuario_id IS NULL", commit=False)
    conexao.executar_muitos(
        """
        INSERT INTO categorias (usuario_id, nome, tipo, essencial, icone, cor, ordem)
        VALUES (NULL, %s, %s, %s, %s, %s, %s)
        """,
        CATEGORIAS_MODELO,
        commit=False,
    )
    conexao.commit()
    return len(CATEGORIAS_MODELO)


def preparar_banco():
    """Chamado na subida do backend: deixa o banco pronto para uso."""
    criadas = criar_tabelas()
    modelos = conexao.valor_unico(
        "SELECT COUNT(*) FROM categorias WHERE usuario_id IS NULL", padrao=0
    )
    # Só carrega os modelos quando não há nenhum, para uma reinicialização
    # do Render não desfazer um ajuste feito depois no banco.
    if not modelos:
        modelos = carregar_categorias_modelo()
    return {"tabelas": len(criadas), "categorias_modelo": modelos}


if __name__ == "__main__":
    from src.main import criar_app

    with criar_app().app_context():
        print(preparar_banco())
