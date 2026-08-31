"""Singra - a porta de entrada da API.

Reúne os blueprints em um lugar só. Cada um cuida de uma área, e todos
respondem sob /api:

    auth          cadastro, login, recuperação de senha
    transacoes    gastos, ganhos, painel Início, histórico, categorias
    graficos      os dados de cada gráfico, já calculados
    planejamento  orçamento, metas, contas a pagar, cartões
    perfil        dados da conta, onboarding, exportação, exclusão
"""

from src.api import auth, graficos, perfil, planejamento, transacoes

BLUEPRINTS = (
    auth.bp,
    transacoes.bp,
    graficos.bp,
    planejamento.bp,
    perfil.bp,
)


def registrar(app):
    for bp in BLUEPRINTS:
        app.register_blueprint(bp)
    return app
