"""Singra - servidor estático para desenvolvimento.

O frontend é só arquivo: em produção ele vai para o GitHub Pages e não
precisa de servidor nenhum. Este script existe apenas para abrir o site no
navegador durante o desenvolvimento.

A diferença para o `python -m http.server` puro é uma linha: as respostas
saem com `Cache-Control: no-store`. Sem isso o navegador guarda o CSS e o
JavaScript antigos e uma correção parece não ter funcionado. É o tipo de
tempo perdido que não aparece em lugar nenhum depois.

Uso:

    python frontend/servidor_dev.py [porta]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PASTA = Path(__file__).resolve().parent
PORTA_PADRAO = 5500


class Entregador(SimpleHTTPRequestHandler):
    """Entrega os arquivos sem deixar o navegador guardá-los."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    # O log padrão imprime uma linha por arquivo e enterra o que interessa
    def log_message(self, formato, *args):
        if args and str(args[1]).startswith("2"):
            return
        super().log_message(formato, *args)


def main():
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else PORTA_PADRAO
    handler = partial(Entregador, directory=str(PASTA))
    with ThreadingHTTPServer(("127.0.0.1", porta), handler) as servidor:
        print(f"Singra rodando em http://localhost:{porta}/public/index.html")
        print("Ctrl+C para parar.")
        try:
            servidor.serve_forever()
        except KeyboardInterrupt:
            print("\nAté a próxima.")


if __name__ == "__main__":
    main()
