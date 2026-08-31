"""Singra - testes das regras que não dependem do banco.

Cobrem o mês financeiro, os períodos da meta de investimento, o
parcelamento, a leitura do que vem do navegador e o hash de senha. São as
regras em que um erro passa despercebido na tela e só aparece no fim do mês,
quando a conta não bate.

Rodar, de dentro de backend/:
    python -m unittest discover -s tests -t .
"""

import unittest
from datetime import date
from decimal import Decimal

from src.core import parcelamento, periodo, seguranca
from src.core import formato


class TestMesFinanceiro(unittest.TestCase):
    """Quem recebe no dia 5 não vive o mês do calendário."""

    def test_mes_do_calendario_quando_comeca_no_dia_1(self):
        inicio, fim = periodo.intervalo_mes(2026, 8, 1)
        self.assertEqual(inicio, date(2026, 8, 1))
        self.assertEqual(fim, date(2026, 8, 31))

    def test_mes_de_quem_recebe_no_dia_5(self):
        inicio, fim = periodo.intervalo_mes(2026, 8, 5)
        self.assertEqual(inicio, date(2026, 8, 5))
        self.assertEqual(fim, date(2026, 9, 4))

    def test_dia_4_ainda_pertence_ao_mes_anterior(self):
        self.assertEqual(periodo.mes_do_dia(date(2026, 9, 4), 5), (2026, 8))
        self.assertEqual(periodo.mes_do_dia(date(2026, 9, 5), 5), (2026, 9))

    def test_virada_de_ano(self):
        self.assertEqual(periodo.mes_anterior(2026, 1), (2025, 12))
        self.assertEqual(periodo.proximo_mes(2026, 12), (2027, 1))

    def test_ultimos_seis_meses_termina_no_mes_pedido(self):
        meses = periodo.ultimos_meses(2026, 2, 6)
        self.assertEqual(len(meses), 6)
        self.assertEqual(meses[0], (2025, 9))
        self.assertEqual(meses[-1], (2026, 2))

    def test_dia_31_em_fevereiro_vira_o_ultimo_dia(self):
        self.assertEqual(periodo.dia_seguro(2026, 2, 31), date(2026, 2, 28))

    def test_dia_de_inicio_fica_entre_1_e_28(self):
        # Acima de 28 o mês não existiria em fevereiro
        self.assertEqual(periodo.normalizar_dia(0), 1)
        self.assertEqual(periodo.normalizar_dia(31), 28)


class TestCadenciaDoInvestimento(unittest.TestCase):
    """A meta de investimento se renova a cada período da cadência."""

    def test_cadencia_diaria_e_o_proprio_dia(self):
        hoje = date(2026, 8, 26)
        self.assertEqual(periodo.intervalo_cadencia("diaria", 1, hoje), (hoje, hoje))

    def test_cadencia_semanal_vai_de_segunda_a_domingo(self):
        # 26/08/2026 é uma quarta-feira
        inicio, fim = periodo.intervalo_cadencia("semanal", 1, date(2026, 8, 26))
        self.assertEqual(inicio, date(2026, 8, 24))
        self.assertEqual(fim, date(2026, 8, 30))
        self.assertEqual(inicio.weekday(), 0)

    def test_cadencia_mensal_segue_o_mes_financeiro(self):
        inicio, fim = periodo.intervalo_cadencia("mensal", 5, date(2026, 8, 26))
        self.assertEqual(inicio, date(2026, 8, 5))
        self.assertEqual(fim, date(2026, 9, 4))

    def test_cadencia_anual_cobre_o_ano_inteiro(self):
        inicio, fim = periodo.intervalo_cadencia("anual", 1, date(2026, 8, 26))
        self.assertEqual(inicio, date(2026, 1, 1))
        self.assertEqual(fim, date(2026, 12, 31))

    def test_a_janela_de_12_meses_existe_para_a_meta_anual(self):
        periodos = periodo.periodos_da_cadencia("anual", 12, 1, date(2026, 8, 26))
        self.assertEqual(len(periodos), 12)
        self.assertEqual(periodos[-1][2], "2026")


class TestParcelamento(unittest.TestCase):
    """Uma compra em N vezes não pode perder nem ganhar centavo."""

    def test_soma_das_parcelas_e_igual_ao_total(self):
        partes = parcelamento.dividir_valor(Decimal("100.00"), 3)
        self.assertEqual(sum(partes), Decimal("100.00"))
        self.assertEqual(partes[0], Decimal("33.33"))
        self.assertEqual(partes[-1], Decimal("33.34"))

    def test_uma_parcela_por_mes(self):
        datas = parcelamento.datas_das_parcelas(date(2026, 8, 15), 3)
        self.assertEqual(datas, [date(2026, 8, 15), date(2026, 9, 15),
                                 date(2026, 10, 15)])

    def test_parcela_do_dia_31_nao_estoura_em_fevereiro(self):
        datas = parcelamento.datas_das_parcelas(date(2026, 1, 31), 2)
        self.assertEqual(datas[1], date(2026, 2, 28))


class TestLeituraDeCampos(unittest.TestCase):
    """O que chega do navegador precisa virar Decimal e date confiáveis."""

    def test_le_valor_digitado_nos_dois_formatos(self):
        self.assertEqual(formato.para_decimal("1.234,56"), Decimal("1234.56"))
        self.assertEqual(formato.para_decimal("1234.56"), Decimal("1234.56"))
        self.assertEqual(formato.para_decimal("R$ 45,90"), Decimal("45.90"))
        self.assertIsNone(formato.para_decimal("abc"))

    def test_data_nos_dois_formatos(self):
        self.assertEqual(formato.para_data("2026-08-15"), date(2026, 8, 15))
        self.assertEqual(formato.para_data("15/08/2026"), date(2026, 8, 15))

    def test_inteiro_fora_da_faixa_vira_o_padrao(self):
        # mes=99 na querystring não pode quebrar a consulta
        self.assertIsNone(formato.para_inteiro("99", minimo=1, maximo=12))
        self.assertEqual(formato.para_inteiro("8", minimo=1, maximo=12), 8)

    def test_porcentagem_tolera_total_zero(self):
        self.assertEqual(formato.porcentagem(10, 0), 0)
        self.assertEqual(formato.porcentagem(50, 200), 25)

    def test_moeda_no_padrao_brasileiro(self):
        self.assertEqual(formato.moeda(1234.5), "R$ 1.234,50")


class TestSeguranca(unittest.TestCase):
    """A senha nunca volta do banco em texto, e o token não se falsifica."""

    def test_senha_vira_hash_e_confere(self):
        hash_gerado = seguranca.gerar_hash_senha("minha senha 123")
        self.assertNotIn("minha senha", hash_gerado)
        self.assertTrue(seguranca.conferir_senha("minha senha 123", hash_gerado))
        self.assertFalse(seguranca.conferir_senha("outra senha", hash_gerado))

    def test_forca_da_senha_em_tres_niveis(self):
        self.assertEqual(seguranca.forca_da_senha("abc"), "fraca")
        self.assertEqual(seguranca.forca_da_senha("segredo123"), "boa")
        self.assertEqual(seguranca.forca_da_senha("Segredo#Longo123"), "otima")

    def test_token_leva_e_traz_o_id_do_usuario(self):
        token = seguranca.gerar_token(42)
        self.assertEqual(seguranca.usuario_id_do_token(token), 42)

    def test_token_adulterado_nao_vale(self):
        token = seguranca.gerar_token(42)
        self.assertIsNone(seguranca.usuario_id_do_token(token + "x"))
        self.assertIsNone(seguranca.usuario_id_do_token("qualquer-coisa"))


if __name__ == "__main__":
    unittest.main()
