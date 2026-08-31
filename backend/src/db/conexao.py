"""Singra - acesso ao MySQL.

Uma conexão por requisição, guardada em flask.g e devolvida ao pool no fim.
Todas as funções daqui recebem os valores como parâmetros e nunca os
concatenam no texto do SQL, o que fecha a porta para injeção de SQL.

O banco fica fora da máquina do backend (Aiven ou TiDB Cloud), então a
conexão atravessa a internet e vai criptografada quando o provedor exige.
"""

import mysql.connector
from mysql.connector import pooling
from flask import g

from src.config import Config

_pool = None


def _parametros():
    """Monta os parâmetros do conector, incluindo o SSL quando necessário."""
    parametros = dict(Config.DB)
    if Config.SSL_OBRIGATORIO:
        # Sem certificado informado, o conector ainda negocia TLS com o
        # servidor. O certificado só entra quando o provedor fornece um.
        parametros["ssl_disabled"] = False
        if Config.SSL_CA:
            parametros["ssl_ca"] = Config.SSL_CA
    return parametros


def _obter_pool():
    """Cria o pool na primeira consulta e reaproveita depois.

    O pool nasce tarde, e não na importação do módulo, para que o backend
    consiga subir no Render mesmo que o banco demore a responder, quem
    trata a falha é o handler de erro, com mensagem legível.
    """
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="singra",
            pool_size=5,
            pool_reset_session=True,
            **_parametros(),
        )
    return _pool


def conexao():
    """Conexão da requisição atual."""
    if "conexao_db" not in g:
        g.conexao_db = _obter_pool().get_connection()
    return g.conexao_db


def fechar_conexao(_erro=None):
    """Devolve a conexão ao pool no fim de cada requisição.

    Se a requisição terminou por causa de um erro, desfaz o que estava em
    aberto antes de devolver, para a próxima não herdar meia transação.
    """
    con = g.pop("conexao_db", None)
    if con is None:
        return
    try:
        if _erro is not None:
            con.rollback()
    finally:
        con.close()


def esta_disponivel():
    """Diz se dá para falar com o banco, sem levantar exceção."""
    try:
        _obter_pool().get_connection().close()
        return True
    except mysql.connector.Error:
        return False


# Leitura
def consultar(sql, parametros=()):
    """Retorna uma lista de dicionários."""
    cur = conexao().cursor(dictionary=True)
    try:
        cur.execute(sql, parametros)
        return cur.fetchall()
    finally:
        cur.close()


def consultar_um(sql, parametros=()):
    """Retorna o primeiro dicionário, ou None se a consulta não achou nada."""
    cur = conexao().cursor(dictionary=True)
    try:
        cur.execute(sql, parametros)
        return cur.fetchone()
    finally:
        cur.close()


def valor_unico(sql, parametros=(), padrao=None):
    """Retorna a primeira coluna da primeira linha, para somas e contagens."""
    cur = conexao().cursor()
    try:
        cur.execute(sql, parametros)
        linha = cur.fetchone()
        if not linha or linha[0] is None:
            return padrao
        return linha[0]
    finally:
        cur.close()


# Escrita
def executar(sql, parametros=(), commit=True):
    """INSERT, UPDATE, DELETE ou DDL. Devolve o id inserido, ou 0.

    Gravar no banco tem dois tempos: a instrução é executada e depois
    confirmada com commit(). Antes do commit nada é definitivo, e o
    rollback do except desfaz o que já tinha sido escrito. É isso que
    impede o banco de ficar pela metade quando algo falha no meio.

    Passe commit=False para encadear várias gravações na mesma transação e
    confirmar todas de uma vez depois.
    """
    con = conexao()
    cur = con.cursor()
    try:
        cur.execute(sql, parametros)
        if commit:
            con.commit()
        return cur.lastrowid or 0
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()


def executar_muitos(sql, lista_parametros, commit=True):
    """A mesma instrução para várias linhas, usada no parcelamento."""
    con = conexao()
    cur = con.cursor()
    try:
        cur.executemany(sql, lista_parametros)
        if commit:
            con.commit()
        return cur.rowcount
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()


def afetadas(sql, parametros=(), commit=True):
    """Como executar(), mas devolve quantas linhas mudaram.

    É o retorno que interessa quando o UPDATE filtra por usuario_id: zero
    linhas significa que o registro não era daquele usuário.
    """
    con = conexao()
    cur = con.cursor()
    try:
        cur.execute(sql, parametros)
        if commit:
            con.commit()
        return cur.rowcount
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()


def commit():
    conexao().commit()


def rollback():
    conexao().rollback()
