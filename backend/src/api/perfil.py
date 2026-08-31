"""Singra - perfil, categorias, onboarding e os dados do usuário.

Inclui as duas ações que tratam os dados como propriedade da pessoa: baixar
tudo em CSV e apagar a conta inteira.
"""

import csv
import io
from datetime import date

from flask import Blueprint, Response, g

from src.api.comum import corpo, erro, ok
from src.config import Config
from src.core import periodo, planejador
from src.core.formato import (NOMES_FORMA_PAGAMENTO, data_br, para_decimal,
                              para_inteiro, texto_curto)
from src.core.periodo import CADENCIAS
from src.core.seguranca import conferir_senha, exigir_login
from src.db.repositorios import categorias, metas, transacoes, usuarios

bp = Blueprint("perfil", __name__, url_prefix="/api")
bp.before_request(exigir_login)

MIN_SENHA = 8


# Perfil
@bp.get("/perfil")
def ler_perfil():
    dados = usuarios.publico(g.usuario)
    dados["renda_extra"] = usuarios.renda_extra(g.usuario["id"])
    return ok(usuario=dados)


@bp.put("/perfil")
def atualizar_perfil():
    """Nome, apelido, dia de início do mês e idioma.

    O idioma fica no banco, e não no navegador, para a escolha valer em
    qualquer aparelho em que a pessoa fizer login.
    """
    dados = corpo()
    idioma = dados.get("idioma")
    if idioma is not None and idioma not in Config.IDIOMAS:
        return erro("Esse idioma não está disponível.", "idioma")

    usuarios.atualizar_perfil(
        g.usuario["id"],
        nome=texto_curto(dados.get("nome"), 100),
        apelido=dados.get("apelido"),
        dia_inicio_mes=para_inteiro(dados.get("dia_inicio_mes"), minimo=1, maximo=28),
        idioma=idioma,
    )

    # A renda informada no onboarding pode mudar depois: de emprego, de
    # faixa, de tudo. Zero apaga o valor: é como a pessoa diz que prefere
    # não informar, e o planejamento sugerido volta a ficar indisponível.
    if "renda" in dados:
        renda = para_decimal(dados.get("renda"))
        usuarios.salvar_onboarding(
            g.usuario["id"],
            renda=renda if renda and renda > 0 else 0,
            renda_variavel=bool(dados.get("renda_variavel")),
        )
    return ok(mensagem="Pronto! Seus dados foram salvos.",
              usuario=usuarios.publico(usuarios.por_id(g.usuario["id"])))


@bp.put("/perfil/senha")
def trocar_senha():
    dados = corpo()
    # Pede a senha atual para que uma sessão esquecida aberta em outro
    # aparelho não consiga tomar a conta
    if not conferir_senha(dados.get("senha_atual") or "", g.usuario["senha_hash"]):
        return erro("Hmm, a senha atual não bateu.", "senha_atual")

    nova = dados.get("senha_nova") or ""
    if len(nova) < MIN_SENHA:
        return erro(
            f"A nova senha precisa de pelo menos {MIN_SENHA} caracteres.", "senha_nova"
        )

    usuarios.trocar_senha(g.usuario["id"], nova)
    return ok(mensagem="Pronto! Sua senha foi trocada.")


# Onboarding
@bp.post("/onboarding")
def salvar_onboarding():
    """Guarda as respostas do primeiro acesso, passo a passo.

    Cada passo manda só o que tem, e nenhum é obrigatório: quem quiser pode
    chegar ao painel pulando as seis perguntas.
    """
    dados = corpo()
    usuario_id = g.usuario["id"]

    if "apelido" in dados:
        usuarios.atualizar_perfil(usuario_id, apelido=dados.get("apelido"))

    if "renda" in dados:
        renda = para_decimal(dados.get("renda"))
        usuarios.salvar_onboarding(
            usuario_id,
            renda=renda if renda and renda > 0 else None,
            renda_variavel=bool(dados.get("renda_variavel")),
        )

    # A renda extra é só um rótulo: não soma a cálculo nenhum
    if dados.get("renda_extra_tipo"):
        usuarios.salvar_renda_extra(
            usuario_id, str(dados["renda_extra_tipo"]),
            para_decimal(dados.get("renda_extra_valor")),
        )

    # Meta de investimento: valor e cadência vêm dos passos 4 e 5
    investimento = para_decimal(dados.get("investimento_valor"))
    cadencia = dados.get("investimento_cadencia")
    if investimento and investimento > 0 and cadencia in CADENCIAS:
        if not metas.investimento(usuario_id):
            metas.criar(usuario_id, "Guardar dinheiro", investimento,
                        icone="rendimento", eh_investimento=True,
                        cadencia=cadencia)

    atualizado = usuarios.por_id(usuario_id)

    # Passo 6: monta ou não o planejamento sugerido
    sugestao = None
    if dados.get("sugerir_orcamento"):
        ano, mes = periodo.mes_atual(atualizado["dia_inicio_mes"])
        sugestao = planejador.sugerir_orcamento(atualizado, ano, mes)

    if dados.get("concluir"):
        usuarios.concluir_onboarding(usuario_id)
        atualizado = usuarios.por_id(usuario_id)

    return ok(usuario=usuarios.publico(atualizado), sugestao=sugestao,
              mensagem="Tudo pronto!")


# Categorias
@bp.post("/categorias")
def criar_categoria():
    dados = corpo()
    nome = texto_curto(dados.get("nome"), 60)
    if not nome:
        return erro("Dê um nome para a categoria.", "nome")
    tipo = dados.get("tipo") if dados.get("tipo") in ("gasto", "ganho") else "gasto"
    categoria_id = categorias.criar(
        g.usuario["id"], nome, tipo=tipo,
        essencial=bool(dados.get("essencial")),
        icone=dados.get("icone") or "outros",
        cor=dados.get("cor") or "#B5B5A8",
    )
    return ok(id=categoria_id, mensagem="Categoria criada.")


@bp.put("/categorias/<int:categoria_id>")
def editar_categoria(categoria_id):
    if not categorias.por_id(g.usuario["id"], categoria_id):
        return erro("Essa categoria não está na sua lista.", status=404)
    dados = corpo()

    if "oculta" in dados:
        # Esconder, e não apagar: os gastos já registrados precisam
        # continuar apontando para alguma categoria
        categorias.alternar_oculta(g.usuario["id"], categoria_id,
                                   bool(dados.get("oculta")))

    categorias.atualizar(
        g.usuario["id"], categoria_id,
        nome=texto_curto(dados.get("nome"), 60),
        icone=dados.get("icone"),
        cor=dados.get("cor"),
        essencial=dados.get("essencial") if "essencial" in dados else None,
    )
    return ok(mensagem="Pronto! Categoria atualizada.")


# Exportar e apagar
@bp.get("/perfil/exportar")
def exportar():
    """Baixa todas as transações em CSV.

    Separador ponto e vírgula e vírgula decimal, que é o que o Excel em
    português espera. Sem isso o arquivo abre com tudo em uma coluna só.
    """
    linhas = transacoes.exportar(g.usuario["id"])
    buffer = io.StringIO()
    escritor = csv.writer(buffer, delimiter=";")
    escritor.writerow(["Data", "Tipo", "Categoria", "Valor", "Descrição",
                       "Forma de pagamento", "Cartão", "Se repete", "Parcela"])
    for linha in linhas:
        parcela = ""
        if linha["parcela_total"]:
            parcela = f"{linha['parcela_atual']}/{linha['parcela_total']}"
        escritor.writerow([
            data_br(linha["data"]),
            "Gasto" if linha["tipo"] == "gasto" else "Ganho",
            linha["categoria"],
            f"{linha['valor']:.2f}".replace(".", ","),
            linha["descricao"] or "",
            NOMES_FORMA_PAGAMENTO.get(linha["forma_pagamento"], "Pix"),
            linha["cartao"] or "",
            "Sim" if linha["fixa"] else "Não",
            parcela,
        ])

    # O BOM no começo faz o Excel reconhecer o arquivo como UTF-8 e mostrar
    # os acentos certos, em vez de "AlimentaþÒo"
    conteudo = "﻿" + buffer.getvalue()
    return Response(
        conteudo,
        mimetype="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=singra-meus-dados.csv",
            # O download acontece de outro domínio, então o navegador só
            # deixa o JavaScript ler o nome do arquivo se ele for exposto
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@bp.delete("/perfil")
def apagar_conta():
    """Apaga a conta e tudo o que pertence a ela, sem volta."""
    senha = corpo().get("senha") or ""
    if not conferir_senha(senha, g.usuario["senha_hash"]):
        return erro("A senha não bateu. Sua conta continua aqui.", "senha")
    usuarios.apagar(g.usuario["id"])
    return ok(mensagem="Sua conta foi apagada. Obrigado por ter usado o Singra.")
