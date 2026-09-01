# Singra

Site de finanças pessoais para quem nunca teve paciência com planilha.

Python · Flask · MySQL · HTML5 · CSS3 · JavaScript

Site: https://well-2003.github.io/Singra_Finance/

> Projeto de estudo. A história, a equipe e os números da página "Sobre nós"
> são fictícios.

## O problema

Quem ganha o suficiente e mesmo assim chega ao fim do mês sem saber para
onde o dinheiro foi já tentou resolver isso com planilha. E desistiu na
segunda semana.

A planilha não falha por matemática: ela falha por atrito. Abrir o arquivo,
achar a linha certa, digitar em três colunas e lembrar de fazer isso todo
dia é trabalho demais para uma tarefa que dura trinta segundos. Os
aplicativos de banco resolvem parte do problema, mas mostram extrato, não
decisão: dizem quanto saiu, e não quanto ainda dá para gastar.

O resultado é conhecido. A pessoa passa o mês sem referência, descobre o
estrago quando a fatura chega e conclui que "não tem jeito de se organizar".

## O objetivo

Construir um site que responda a uma pergunta só, e responda bem: **quanto
eu ainda posso gastar este mês?**

Tudo o mais existe para sustentar essa resposta. Registrar um gasto precisa
caber em três toques, nenhuma tela pode repreender quem gastou demais, e
nada pode exigir que a pessoa organize o passado antes de começar.

O critério de sucesso adotado foi direto: se registrar um gasto der mais
trabalho do que anotar num papel, o sistema falhou.

## Público-alvo

* Pessoas que ganham o suficiente, mas não sabem para onde o dinheiro vai.
* Quem já tentou planilha e abandonou por falta de tempo e paciência.
* Autônomos e freelancers, cuja renda varia e cujo mês raramente começa no
  dia 1.
* Quem tem pouca familiaridade com tecnologia e precisa de uma ferramenta
  que se explique sozinha.

## O que o sistema entrega

**Site institucional.** Página inicial com a proposta e uma prévia do
painel, seção Sobre nós e uma central de Ajuda com busca, tutoriais curtos,
perguntas frequentes e um glossário sem economês.

**Acesso e contas.** Cadastro com indicador de força da senha em três
níveis, login e recuperação de senha por link com validade. Senhas gravadas
com hash bcrypt e sessão por token assinado.

**Primeiro acesso.** Quem cria a conta cai direto no painel, com um convite
para montar o planejamento e um atalho para seis perguntas opcionais:
apelido, tipo de renda, renda extra, quanto quer guardar, com que
frequência e se quer um planejamento sugerido. O convite se dispensa e não
volta.

**Registro de gastos e ganhos.** Painel deslizante em três passos, com
teclado numérico próprio. Categoria, data, forma de pagamento, vínculo com
cartão, gasto fixo e parcelamento em até 60 vezes. Gasto e ganho na mesma
tela, separados por um alternador.

**Painel.** O número grande de quanto ainda dá para gastar, seguido do
guardado no mês, das próximas contas, dos gastos por categoria, das metas e
dos últimos registros.

**Histórico.** Lista agrupada por dia, com filtros por período, tipo,
categoria, forma de pagamento e cartão. Tocar em qualquer registro reabre o
painel para corrigir ou apagar.

**Planejamento.** Um limite por categoria, editado direto na lista e salvo
ao sair do campo. Sugestão automática pela regra 50/30/20 e cópia do mês
anterior.

**Metas e contas a pagar.** Metas com círculo de progresso, uma meta especial
de investimento que se renova por período e um calendário de contas que
projeta meses à frente o que já está comprometido.

**Gráficos.** Sete desenhos, cada um com um título em forma de pergunta e
uma frase embaixo respondendo o que ele mostra.

**Perfil.** Categorias, cartões, idioma, dia em que o mês começa, exportação
de tudo em CSV e exclusão da conta.

## Por que ele resolve

**Registro em três toques.** Valor, categoria, confirmar. Data e forma de
pagamento vêm preenchidas e mudar isso é opcional. O teclado é próprio, com
teclas grandes: quem digita 4590 vê "R$ 45,90" se formando, sem precisar
acertar a vírgula.

**O mês é o da pessoa, não o do calendário.** Quem recebe no dia 5 configura
o dia 5 e todos os cálculos passam a seguir esse ciclo. Sem isso, metade do
salário cai num mês e metade no outro, e nenhum número faz sentido.

**Uma pergunta respondida, não um extrato.** O painel abre com um número
grande: quanto ainda dá para gastar. Com planejamento, ele parte do limite
que a pessoa combinou consigo mesma, somado ao que entrou além dele: um
freela inesperado é dinheiro de verdade, e o limite não pode escondê-lo.
Sem planejamento, parte do que entrou.

**Cada gráfico já vem interpretado.** Abaixo do desenho há uma frase escrita
pelo servidor, que tem os números: "Fique de olho em Saúde e Transporte.
Ainda cabe gasto em Delivery e Lazer, ou dá para guardar o que sobrar."

**Nenhuma tela repreende.** Vermelho é proibido na interface inteira. Passar
do planejado aparece em terracota, acompanhado do próximo passo, nunca de
uma bronca. Ninguém aprende a cuidar do próprio dinheiro sendo repreendido.

**Guardar dinheiro nunca acontece sozinho.** A meta de investimento não
desconta do disponível quando o período começa, e sim quando a pessoa manda
guardar. Um app que reserva dinheiro sem avisar perde a confiança de uma vez.

**A parcela pesa no mês em que ela pesa.** Uma compra em 6x vira seis
registros, um por mês. O mês da compra não leva o susto inteiro, e os cinco
seguintes já sabem o que têm pela frente.

**Os dados são de quem os digitou.** Baixar tudo em CSV e apagar a conta
ficam em Meu perfil, com o mesmo peso visual do resto, sem esconder nem
assustar.

**Funciona no celular.** É onde o gasto é registrado, na fila do mercado. A
mesma interface se adapta, com barra inferior no lugar do menu lateral.

## Tecnologias

**Backend**

* Python 3 com Flask, servindo uma API que devolve apenas JSON
* MySQL 8 com `DECIMAL(12,2)` para valores, consultas parametrizadas e
  chaves estrangeiras
* bcrypt e itsdangerous, para o hash das senhas e a assinatura dos tokens
* Flask-CORS, para autorizar o domínio do frontend
* Gunicorn em produção

**Frontend**

* HTML5 e CSS3, com sistema de design em variáveis CSS e layout responsivo
* JavaScript sem frameworks e sem etapa de build
* Chart.js, baixado para dentro do projeto em vez de carregado de um CDN

**Infraestrutura**

* GitHub Pages para o site, publicado por GitHub Actions
* Render para a API, no plano gratuito
* Aiven ou TiDB Cloud para o banco gerenciado

## Arquitetura

O Singra são duas metades publicadas em lugares diferentes, que se falam por
HTTP:

```
frontend/          site estático, sem servidor por trás
  public/          as 15 páginas
  src/css/         global.css, dashboard.css, publico.css
  src/js/          utils, components, api, paginas, i18n
  src/vendor/      Chart.js
backend/           a API em Flask
  src/api/         as rotas, um arquivo por assunto
  src/core/        as regras: mês financeiro, parcelas, frases, planejador
  src/db/          conexão, DDL das tabelas e repositórios
  tests/           24 testes, nenhum precisa de banco
docs/              diagrama do banco e lista de rotas, gerados do código
```

No backend a dependência corre em uma direção só: `api` chama `core`, que
chama `db`. Um arquivo de `core/` não sabe o que é uma requisição HTTP e não
escreve SQL, e é isso que permite testar as regras sem um banco ligado.

## Decisões de engenharia

**Frontend e backend separados.** O plano gratuito do Render hiberna após 15
minutos sem uso. Com o site sendo arquivo estático, ele abre instantâneo
mesmo com a API acordando, e a espera aparece como uma mensagem dentro da
página em vez de uma tela branca.

**Sessão por token, não por cookie.** Cookies são presos a um domínio, e as
duas metades moram em domínios diferentes. O token é assinado e carrega o
próprio conteúdo, então o servidor não guarda lista de sessões, o que
importa num serviço que hiberna e perde o que estava na memória.

**Autorização validada no servidor.** O `usuario_id` de toda consulta vem do
token, nunca de um parâmetro enviado pelo navegador. Ids que chegam do
frontend, como o de uma categoria, são conferidos antes de qualquer uso.

**Dinheiro em `Decimal`, nunca em `float`.** Em ponto flutuante, `0,1 + 0,2`
não dá exatamente `0,3`, e esse resto vira centavo que some do total. O
mesmo cuidado vale no banco, com `DECIMAL(12,2)`.

**Consultas parametrizadas em toda parte.** O texto do SQL e os valores
viajam separados até o banco, o que fecha a porta para injeção de SQL. Nunca
há valor concatenado dentro da consulta.

**Escape antes do HTML.** As telas são montadas com `innerHTML`, então toda
descrição de gasto passa por uma função de escape antes de entrar na página,
fechando a superfície de XSS na listagem.

**O preflight do CORS não exige token.** Antes de uma chamada a outro
domínio, o navegador manda sozinho um `OPTIONS` que não carrega o cabeçalho
`Authorization`. Exigir token nele faz o navegador bloquear a requisição
seguinte, com uma mensagem de erro que não tem relação com a causa.

**Estado da página declarado no HTML.** Cada página informa a própria
identidade em atributos do `<body>`, em vez de o JavaScript deduzir contexto
a partir da URL, que muda conforme o site seja aberto do disco, de um
servidor local ou do GitHub Pages.

**Sem dependências de frontend.** Nenhum framework, nenhuma etapa de build.
O que está no repositório é exatamente o que roda no navegador.

**A chave de tradução é a frase em português.** Esquecer de traduzir mostra
o português na tela, e não um código nem um espaço vazio.

**Documentação gerada do código.** O `gerar_docs.py` lê as rotas do próprio
Flask e o DDL das tabelas. Uma rota nova sem descrição aparece no arquivo
como "sem descrição", à vista de todos.

## Testes

São 24 testes automáticos e nenhum deles precisa de banco de dados ligado,
o que é consequência direta da separação em camadas: as regras que mais
importam moram em `core/`, que é código puro.

Eles cobrem justamente aquilo em que um erro passa despercebido na tela e
só aparece no fim do mês, quando a conta não bate: o mês financeiro que não
começa no dia 1, os períodos da meta de investimento, o parcelamento e seu
arredondamento, a leitura do que vem do navegador e o hash de senha.

## Documentação

A referência da API, com as 46 operações, está em
[docs/api-swagger.json](docs/api-swagger.json). O modelo das 10 tabelas,
com chaves e tipos, está em
[docs/diagrama_banco.svg](docs/diagrama_banco.svg).

Os dois são gerados a partir do código, e não escritos à mão: as rotas são
lidas do próprio Flask e as tabelas do DDL em `src/db/models.py`.
