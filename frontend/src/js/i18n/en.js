/* Singra - English
   The key of every entry is the Portuguese sentence exactly as it is
   written in the screens. Missing an entry is not a bug that breaks the
   page: the sentence simply stays in Portuguese.

   Two things are never translated here. What the user typed — category
   names, expense descriptions, goal and card names — because translating it
   would change what they meant. And money: Singra works in Brazil, so the
   currency stays in reais no matter the language.

   The tone rules of the product travel with the translation: never blame,
   never exaggerate, and when the number is bad, point at the next step. */

window.TextosEN = {
    codigo: "en",
    nome: "English",
    // Liga o último item de uma lista de categorias
    conector: "and",

    textos: {
        // Navigation and shared chrome
        "Pular para o conteúdo": "Skip to content",
        // Aparece sozinho entre dois valores: "R$ 200,00 de R$ 500,00"
        "de": "of",
        "Adicionar": "Add",
        "Adicionar gasto ou ganho": "Add expense or income",
        "Adicionar gasto": "Add expense",
        "+ Adicionar gasto": "+ Add expense",
        "Adicionar gasto/ganho": "Add expense or income",
        "Início": "Home",
        "Histórico": "History",
        "Gráficos": "Charts",
        "Planejamento": "Planning",
        "Metas": "Goals",
        "Contas": "Bills",
        "Contas a pagar": "Bills",
        "Ajuda": "Help",
        "Meu perfil": "My profile",
        "Sair": "Sign out",
        "Mais": "More",
        "Mais opções": "More options",
        "Menu do Singra": "Singra menu",
        "Menu principal": "Main menu",
        "Fechar": "Close",
        "Voltar": "Back",
        "Continuar": "Continue",
        "Salvar": "Save",
        "Confirmar": "Confirm",
        "Cancelar": "Cancel",
        "Apagar": "Delete",
        "Mudar": "Change",
        "Ver todas": "See all",
        "Ver todos": "See all",
        "Sobre nós": "About us",
        "Criar conta": "Sign up",
        "Criar conta grátis": "Create a free account",
        "Entrar": "Sign in",
        "Ir para o meu painel": "Go to my dashboard",
        "Seu dinheiro, organizado sem planilha.":
            "Your money, sorted out without a spreadsheet.",
        "© 2026 Singra · Todos os direitos reservados":
            "© 2026 Singra · All rights reserved",
        "Links do rodapé": "Footer links",

        // Loading, connection and session
        "Só um instante, estamos preparando tudo 🌱":
            "Just a moment, we are getting things ready 🌱",
        "O servidor estava descansando e está acordando agora.":
            "The server was resting and is waking up now.",
        "O servidor está demorando mais que o normal.":
            "The server is taking longer than usual.",
        "Só acontece no primeiro acesso depois de um tempo parado.":
            "This only happens the first time you come back after a while.",
        "Tente de novo em alguns instantes.": "Please try again in a moment.",
        "Parece que a internet caiu. Tente de novo em instantes.":
            "Looks like the connection dropped. Please try again in a moment.",
        "Sua sessão expirou. Entre de novo, por favor.":
            "Your session has expired. Please sign in again.",
        "Algo deu errado do nosso lado. Tente de novo.":
            "Something went wrong on our side. Please try again.",
        "Não conseguimos salvar agora.": "We could not save that right now.",
        "O endereço da API ainda não foi configurado.":
            "The API address has not been set yet.",
        "Salvando…": "Saving…",
        "Criando…": "Creating…",
        "Entrando…": "Signing in…",
        "Enviando…": "Sending…",
        "Guardando…": "Saving…",
        "Carregando…": "Loading…",

        // Landing page
        "Registre um gasto em três toques e descubra, em uma olhada, quanto você ainda pode gastar este mês.":
            "Log an expense in three taps and see, at a glance, how much you can still spend this month.",
        "Começar agora": "Start now",
        "Já tenho conta": "I already have an account",
        "Grátis. Sem cartão de crédito, sem propaganda de banco.":
            "Free. No credit card, no bank ads.",
        "Feito para quem nunca teve paciência com planilha":
            "Made for people who never had the patience for spreadsheets",
        "Três coisas resolvem quase tudo: registrar rápido, entender para onde o dinheiro foi e ter um lugar guardando o que sobra.":
            "Three things solve almost everything: logging quickly, understanding where the money went, and having a place for what is left over.",
        "Registre em 3 toques": "Log it in 3 taps",
        "Valor, categoria, pronto. Sem formulário comprido, sem campo obrigatório que trava o registro no meio.":
            "Amount, category, done. No long form, no required field that stops you halfway.",
        "Veja para onde vai seu dinheiro": "See where your money goes",
        "Sete gráficos com uma frase embaixo explicando o que cada um está dizendo. Nada de você ter que interpretar sozinho.":
            "Seven charts, each with a sentence underneath explaining what it says. No need to figure it out alone.",
        "Alcance suas metas": "Reach your goals",
        "Escolha quanto quer guardar e com que frequência. O Singra acompanha e avisa quando dá para guardar mais.":
            "Choose how much you want to save and how often. Singra keeps track and tells you when there is room for more.",
        "Gráficos que respondem perguntas": "Charts that answer questions",
        "Cada desenho tem um título em forma de pergunta e uma frase embaixo que responde. Estes são de exemplo.":
            "Each chart has a question for a title and a sentence below that answers it. These are examples.",
        "Para quem o Singra foi feito": "Who Singra is for",
        "Pessoas que ganham o suficiente, mas chegam ao fim do mês sem saber para onde o dinheiro foi.":
            "People who earn enough, but reach the end of the month with no idea where the money went.",
        "Depoimentos ilustrativos, escritos por nós. O Singra é um projeto novo e ainda não tem clientes para citar.":
            "Illustrative testimonials, written by us. Singra is a new project and has no customers to quote yet.",
        "Comece pelo próximo gasto": "Start with your next expense",
        "Não precisa organizar o passado. Registre o café de hoje e o resto vai se montando sozinho.":
            "You do not have to sort out the past. Log today's coffee and the rest builds itself.",
        "Criar minha conta grátis": "Create my free account",

        // Sign in, sign up and password recovery
        "Que bom te ver de novo": "Good to see you again",
        "Seu e-mail": "Your email",
        "Sua senha": "Your password",
        "Mostrar senha": "Show password",
        "Esconder senha": "Hide password",
        "Manter conectado neste aparelho": "Keep me signed in on this device",
        "Esqueci minha senha": "I forgot my password",
        "Ainda não tem conta?": "Don't have an account yet?",
        "Já tem conta?": "Already have an account?",
        "Vamos começar": "Let's get started",
        "Leva menos de um minuto. E é de graça.":
            "It takes less than a minute. And it is free.",
        "Como você se chama?": "What is your name?",
        "Crie uma senha": "Create a password",
        "Criar minha conta": "Create my account",
        "Usamos só para você entrar e recuperar a senha.":
            "We only use it so you can sign in and recover your password.",
        "A senha precisa de pelo menos 8 letras ou números.":
            "Your password needs at least 8 letters or numbers.",
        "Senha fraca. Que tal juntar letras e números?":
            "Weak password. How about mixing letters and numbers?",
        "Senha boa.": "Good password.",
        "Senha ótima!": "Great password!",
        "Preencha o e-mail e a senha para continuar.":
            "Fill in your email and password to continue.",
        "Esse e-mail parece incompleto. Confere para a gente?":
            "That email looks incomplete. Could you check it?",
        "Falta seu nome. Como podemos te chamar?":
            "Your name is missing. What should we call you?",
        "Esqueci minha senha.": "I forgot my password.",
        "Diga seu e-mail e a gente manda um link.":
            "Tell us your email and we will send you a link.",
        "Mandar o link": "Send the link",
        "Confira seu e-mail": "Check your email",
        "Lembrei a senha, quero entrar": "I remembered it, let me sign in",
        "Voltar para entrar": "Back to sign in",
        "Vamos criar uma senha nova": "Let's create a new password",
        "Crie sua senha nova": "Create your new password",
        "Senha nova": "New password",
        "Salvar e entrar": "Save and sign in",
        "Esse link não vale mais": "This link is no longer valid",
        "Pedir um link novo": "Ask for a new link",

        // First steps (onboarding)
        "Primeiros passos": "First steps",
        "Passo": "Step",
        "Pular esta pergunta": "Skip this question",
        "Pular tudo e ir para o painel": "Skip everything and go to the dashboard",
        "Concluir": "Finish",
        "Como você quer ser chamado?": "What would you like to be called?",
        "É o nome que vai aparecer na saudação do painel.":
            "This is the name that shows up in the dashboard greeting.",
        "Seu apelido": "Your nickname",
        "Como é a sua renda?": "What is your income like?",
        "Isso ajuda a sugerir um planejamento no seu tamanho.":
            "This helps us suggest a budget that fits you.",
        "Tenho um valor fixo todo mês": "I get a fixed amount every month",
        "Salário, aposentadoria, pensão": "Salary, pension, allowance",
        "Sou autônomo(a), varia": "I am self-employed, it varies",
        "Uns meses mais, outros menos": "Some months more, some months less",
        "Quanto entra por mês?": "How much comes in each month?",
        "Quanto entra, em média, por mês?":
            "How much comes in, on average, each month?",
        "Não precisa ser exato, é só para começar.":
            "It does not have to be exact, it is just a starting point.",
        "Você costuma ter alguma renda extra?":
            "Do you usually have any extra income?",
        "Bico, freela, uma venda de vez em quando.":
            "Odd jobs, freelance work, the occasional sale.",
        "Sim, tenho": "Yes, I do",
        "Não tenho": "No, I don't",
        "De que tipo?": "What kind?",
        "Bico": "Odd job",
        "Freela": "Freelance",
        "Venda": "Sale",
        "Outro": "Other",
        "Quanto costuma vir? (opcional)": "How much does it usually come to? (optional)",
        "Esse valor é só um lembrete seu. Ele não entra no cálculo do quanto você pode gastar — a renda extra só conta quando o dinheiro cai de verdade e você registra o ganho.":
            "This amount is just a note to yourself. It does not count towards how much you can spend — extra income only counts when the money actually arrives and you log it.",
        "Quanto você quer guardar ou investir por mês?":
            "How much would you like to save or invest each month?",
        "Pode ser pouco. O que importa é começar.":
            "It can be a small amount. What matters is starting.",
        "Valor que quero guardar": "Amount I want to save",
        "Se pular, a área de investimento nem aparece no seu painel. Dá para ligar depois em Metas.":
            "If you skip this, the saving section will not show up on your dashboard. You can turn it on later under Goals.",
        "Ainda não sei, pular por enquanto": "I don't know yet, skip for now",
        "Com que frequência quer acompanhar essa meta?":
            "How often would you like to follow this goal?",
        "Dá para trocar quando quiser, em Metas.":
            "You can change it whenever you like, under Goals.",
        "Diária": "Daily",
        "Semanal": "Weekly",
        "Mensal": "Monthly",
        "Anual": "Yearly",
        "todo dia": "every day",
        "toda semana": "every week",
        "todo mês": "every month",
        "no ano": "per year",
        "Quer que a gente sugira um planejamento?":
            "Would you like us to suggest a budget?",
        "A gente divide sua renda em 50% para o essencial, 30% para o que você escolhe e 20% para guardar. Depois é só ajustar.":
            "We split your income into 50% essentials, 30% your choices and 20% savings. You can adjust it afterwards.",
        "Sim, pode sugerir": "Yes, please suggest one",
        "Um ponto de partida, não uma regra": "A starting point, not a rule",
        "Não, prefiro montar depois": "No, I'd rather set it up later",
        "Você vai direto para o Início": "You go straight to Home",

        // Dashboard
        "Aqui está como você está indo.": "Here is how you are doing.",
        "Você ainda pode gastar": "You can still spend",
        "Você passou do combinado em": "You went over what you planned by",
        "Entraram": "In",
        "Saíram": "Out",
        "Guardado": "Saved",
        "Guardado este mês": "Saved this month",
        "Ver meta": "See goal",
        "Faltam": "Still missing",
        "Próximas contas": "Upcoming bills",
        "Seus gastos por categoria": "Your spending by category",
        "Ver gráficos": "See charts",
        "Suas metas": "Your goals",
        "Últimos registros": "Latest entries",
        "Ver histórico": "See history",
        "Toque em qualquer registro para corrigir ou apagar.":
            "Tap any entry to fix or delete it.",
        "Ainda dá para guardar": "You can still save",
        "Guardar agora": "Save it now",
        "Aumentar minha meta": "Raise my goal",
        "Dispensar": "Dismiss",

        // Add expense or income panel
        "Gasto": "Expense",
        "Ganho": "Income",
        "Tipo do registro": "Entry type",
        "Quanto foi?": "How much was it?",
        "Apagar último número": "Delete last digit",
        "Em que você gastou?": "What did you spend it on?",
        "De onde veio?": "Where did it come from?",
        "Mais categorias": "More categories",
        "O que foi? (opcional)": "What was it? (optional)",
        "Quando foi?": "When was it?",
        "Como você pagou?": "How did you pay?",
        "Vincular a um cartão ou conta": "Link it to a card or account",
        "Não vincular a nenhum": "Do not link it to any",
        "Esse gasto se repete todo mês?": "Does this expense repeat every month?",
        "Foi parcelado?": "Was it paid in instalments?",
        "Em quantas vezes?": "In how many instalments?",
        "Mais detalhes": "More details",
        "Fechar sem salvar": "Close without saving",
        "Apagar esse registro": "Delete this entry",
        "Apagar esse registro?": "Delete this entry?",
        "Não dá para desfazer.": "This cannot be undone.",
        "Apagar a compra inteira?": "Delete the whole purchase?",
        "As parcelas dos outros meses também somem. Não dá para desfazer.":
            "The instalments in the other months disappear too. This cannot be undone.",
        "Pix": "Pix",
        "Dinheiro": "Cash",
        "Débito": "Debit",
        "Crédito": "Credit",
        "Boleto": "Bank slip",
        "Falta só o valor. Quanto foi?": "Only the amount is missing. How much was it?",
        "Escolha uma categoria para continuar.": "Pick a category to continue.",
        "Pronto! Gasto registrado.": "Done! Expense saved.",
        "Pronto! Ganho registrado.": "Done! Income saved.",
        "Pronto! Corrigimos para você.": "Done! We fixed it for you.",
        "Apagado.": "Deleted.",

        // History
        "Gastos e ganhos": "Expenses and income",
        "Só gastos": "Expenses only",
        "Só ganhos": "Income only",
        "Este mês": "This month",
        "Mês passado": "Last month",
        "Escolher período": "Pick a period",
        "Período escolhido": "Chosen period",
        "Filtrar": "Filter",
        "Ver resultados": "See results",
        "Limpar filtros": "Clear filters",
        "De": "From",
        "Até": "To",
        "Tipo": "Type",
        "Categoria": "Category",
        "Todas": "All",
        "Forma de pagamento": "Payment method",
        "Hoje": "Today",
        "Amanhã": "Tomorrow",
        "Ontem": "Yesterday",
        "Saiu": "Out",
        "Entrou": "In",
        "registros": "entries",
        "Nenhum registro neste período": "No entries in this period",
        "Mude os filtros ou registre um gasto para começar.":
            "Change the filters or log an expense to get started.",

        // Budget
        "Seu planejamento": "Your budget",
        "Quanto você quer gastar em cada categoria.":
            "How much you want to spend in each category.",
        "Planejado para": "Planned for",
        "Já gasto": "Spent so far",
        "Copiar do mês anterior": "Copy from last month",
        "Sugerir planejamento (50/30/20)": "Suggest a budget (50/30/20)",
        "Categorias com limite": "Categories with a limit",
        "Incluir mais categorias": "Add more categories",
        "Escolha por onde começar": "Choose where to start",
        "essencial": "essential",
        "escolha sua": "your choice",
        "Coloque um valor para entrar no planejamento":
            "Set an amount to include it in the budget",
        "Coloque um valor para a categoria entrar no planejamento.":
            "Set an amount to include the category in the budget.",
        "Toque no valor para mudar. A gente salva sozinho. Zerar um valor tira a categoria do planejamento.":
            "Tap the amount to change it. We save it for you. Setting it to zero removes the category from the budget.",
        "Ainda cabem": "Still room for",
        "Passou": "Over by",
        "do planejado": "of the plan",
        "passou": "over by",
        "Você ainda não definiu limites": "You have not set any limits yet",
        "Escolher quanto quer gastar em cada categoria ajuda a não se assustar no fim do mês.":
            "Deciding how much to spend in each category keeps the end of the month from surprising you.",
        "Montar meu planejamento": "Set up my budget",
        "Esse valor não deu para entender. Tente só números.":
            "We could not read that amount. Try numbers only.",

        // Goals
        "Objetivos com nome e prazo dão sentido ao resto.":
            "Goals with a name and a deadline give meaning to the rest.",
        "Nova meta": "New goal",
        "+ Nova meta": "+ New goal",
        "Guardar dinheiro": "Put money in",
        "Apagar meta": "Delete goal",
        "Editar meta": "Edit goal",
        "Investimento": "Saving",
        "Nova meta de investimento": "New saving goal",
        "Editar meta de investimento": "Edit saving goal",
        "Quanto você quer guardar por período?":
            "How much do you want to save each period?",
        "Quanto você quer guardar?": "How much do you want to save?",
        "Quanto custa o que você quer conquistar?":
            "How much does what you want cost?",
        "Você ainda não tem metas": "You have no goals yet",
        "Um celular novo, uma viagem, uma reserva para imprevistos. O que você quer conquistar?":
            "A new phone, a trip, a cushion for emergencies. What would you like to reach?",
        "Criar minha primeira meta": "Create my first goal",
        "É o dinheiro para imprevistos:": "This is your money for emergencies:",
        "Conquistada 🎉": "Reached 🎉",
        "Apagar a meta": "Delete the goal",

        // Bills
        "Passou do vencimento": "Past due",
        "Vence hoje": "Due today",
        "Próximos 7 dias": "Next 7 days",
        "Mais para frente": "Further ahead",
        "Já pagas": "Already paid",
        "Já paguei": "I paid it",
        "Marcar como paga": "Mark as paid",
        "Desfazer": "Undo",
        "Ainda falta pagar": "Still to pay",
        "Nova conta": "New bill",
        "Que conta é essa?": "Which bill is this?",
        "Quanto é?": "How much is it?",
        "Quando vence?": "When is it due?",
        "De que categoria?": "Which category?",
        "Se repete todo mês?": "Does it repeat every month?",
        "Cadastrar conta": "Save bill",
        "Nenhuma conta cadastrada": "No bills saved yet",
        "Cadastre o aluguel, a luz, a internet. A gente lembra você antes do vencimento.":
            "Add your rent, electricity, internet. We remind you before they are due.",
        "Cadastrar minha primeira conta": "Add my first bill",
        "Ao confirmar que pagou, a gente registra o gasto no seu histórico automaticamente.":
            "When you confirm a payment, we log the expense in your history automatically.",
        "Ao marcar uma conta como paga, a gente registra o gasto no seu histórico automaticamente.":
            "When you mark a bill as paid, we log the expense in your history automatically.",
        "Vence em": "Due on",
        "Venceu em": "Was due on",
        "Paga em": "Paid on",
        "se repete todo mês": "repeats every month",
        "Essa conta já estava paga.": "That bill was already paid.",
        "Para nunca mais pagar juros por esquecimento.":
            "So you never pay interest because you forgot again.",

        // Charts
        "Seus gráficos": "Your charts",
        "Cada desenho responde a uma pergunta.": "Each chart answers one question.",
        "Para onde foi meu dinheiro?": "Where did my money go?",
        "Estou gastando mais do que ganho?": "Am I spending more than I earn?",
        "Quanto sobrou a cada mês?": "How much was left each month?",
        "Estou guardando o que combinei?": "Am I saving what I planned?",
        "Em que cartão eu gastei?": "Which card did I spend on?",
        "Quanto do meu dinheiro já estava comprometido?":
            "How much of my money was already committed?",
        "Onde você tem escolha": "Where you have a choice",
        "Estou dentro do que combinei comigo?":
            "Am I within what I set for myself?",
        "Últimos 6 meses": "Last 6 months",
        "Últimos 12 meses": "Last 12 months",
        "Sem gastos neste mês": "No expenses this month",
        "Registre alguns gastos e este desenho aparece.":
            "Log a few expenses and this chart shows up.",

        // Profile
        "Seus dados, suas categorias e suas preferências.":
            "Your details, your categories and your preferences.",
        "Seus dados": "Your details",
        "Seu nome": "Your name",
        "Como quer ser chamado?": "What would you like to be called?",
        "É esse nome que aparece na saudação do painel.":
            "This is the name that shows up in the dashboard greeting.",
        "O e-mail é o seu login e não muda por aqui.":
            "Your email is your login and cannot be changed here.",
        "Quanto costuma entrar por mês?": "How much usually comes in each month?",
        "Serve para sugerir seu planejamento. Pode deixar em branco.":
            "We use it to suggest your budget. You can leave it blank.",
        "Minha renda varia de mês para mês": "My income changes from month to month",
        "Meu mês financeiro começa no dia": "My financial month starts on day",
        "Quem recebe no dia 5 costuma preferir o dia 5: assim o mês do Singra acompanha o seu salário.":
            "People paid on the 5th usually pick the 5th: that way Singra's month follows your payday.",
        "Salvar meus dados": "Save my details",
        "Minhas categorias": "My categories",
        "Renomear": "Rename",
        "Esconder": "Hide",
        "Mostrar": "Show",
        "Escondidas": "Hidden",
        "+ Criar categoria": "+ Create category",
        "Criar categoria": "Create category",
        "Categorias não são apagadas, e sim escondidas: os gastos que você já registrou precisam continuar apontando para alguma delas. Uma categoria escondida some das telas de registro, mas o histórico dela fica.":
            "Categories are not deleted, they are hidden: the expenses you already logged still need to point at one. A hidden category disappears from the logging screens, but its history stays.",
        "Nome": "Name",
        "É gasto ou ganho?": "Is it an expense or income?",
        "É uma despesa essencial?": "Is it an essential expense?",
        "Escolha um desenho": "Pick an icon",
        "E uma cor": "And a colour",
        "Meus cartões e bancos": "My cards and accounts",
        "+ Cadastrar cartão": "+ Add card",
        "Novo cartão": "New card",
        "Editar cartão": "Edit card",
        "Editar": "Edit",
        "Como você chama esse cartão?": "What do you call this card?",
        "Só o apelido. O Singra não pede nem guarda número de cartão.":
            "Just the nickname. Singra never asks for or stores card numbers.",
        "Cor para reconhecer de relance": "A colour to recognise it at a glance",
        "Nenhum cartão cadastrado": "No cards saved yet",
        "Cadastrar seus cartões é opcional. Serve só para você saber depois em qual deles gastou mais.":
            "Adding your cards is optional. It only helps you see later which one you spent the most on.",
        "Idioma": "Language",
        "A escolha fica na sua conta, e não neste aparelho: vale em qualquer lugar em que você fizer login.":
            "The choice lives in your account, not on this device: it applies wherever you sign in.",
        "Trocar minha senha": "Change my password",
        "Sua senha de agora": "Your current password",
        "Sua nova senha": "Your new password",
        "Trocar senha": "Change password",
        "A nova senha precisa de pelo menos 8 caracteres.":
            "Your new password needs at least 8 characters.",
        "Seus dados são seus": "Your data is yours",
        "Baixe tudo o que você registrou em uma planilha. O arquivo abre no Excel e no Google Planilhas.":
            "Download everything you logged as a spreadsheet. The file opens in Excel and Google Sheets.",
        "Baixar meus dados (CSV)": "Download my data (CSV)",
        "Não conseguimos preparar seu arquivo agora.":
            "We could not prepare your file right now.",
        "Apagar minha conta": "Delete my account",
        "Apaga a conta e tudo o que está nela: gastos, ganhos, metas, contas e planejamento. Não dá para voltar atrás. Se quiser guardar seu histórico, baixe o CSV antes.":
            "Deletes your account and everything in it: expenses, income, goals, bills and budget. There is no going back. If you want to keep your history, download the CSV first.",
        "Quero apagar minha conta": "I want to delete my account",
        "Apagar a conta de vez": "Delete the account for good",
        "Some tudo: gastos, ganhos, metas, contas e planejamento. Não temos como recuperar depois.":
            "Everything goes: expenses, income, goals, bills and budget. We cannot bring it back.",
        "Digite sua senha para confirmar": "Type your password to confirm",
        "Mudei de ideia": "I changed my mind",
        "Novo nome da categoria:": "New category name:",
        "Pronto! Seus dados foram salvos.": "Done! Your details were saved.",
        "Pronto! Sua senha foi trocada.": "Done! Your password was changed.",
        "Hmm, a senha atual não bateu.": "Hmm, that current password did not match.",
        "Categoria criada.": "Category created.",
        "Pronto! Categoria atualizada.": "Done! Category updated.",
        "Cartão cadastrado.": "Card saved.",
        "Pronto! Cartão atualizado.": "Done! Card updated.",
        "Cartão removido. Os gastos dele continuam no histórico.":
            "Card removed. Its expenses stay in your history.",
        "Como você chama esse cartão ou conta?":
            "What do you call this card or account?",
        "Dê um nome para a categoria.": "Give the category a name.",
        "Pronto! Seus dados foram baixados.": "Done! Your data was downloaded.",
        "Não conseguimos baixar agora. Tente de novo.":
            "We could not download it now. Please try again.",

        // Respostas da API: confirmações e recusas que chegam prontas
        // do backend e aparecem nos avisos e embaixo dos campos
        "A senha não bateu. Sua conta continua aqui.":
            "That password did not match. Your account is still here.",
        "Coloque quanto você quer gastar nessa categoria.":
            "Set how much you want to spend in that category.",
        "Conta apagada.": "Bill deleted.",
        "Conta cadastrada. A gente lembra você.": "Bill saved. We will remind you.",
        "Conta criada. Bem-vindo ao Singra!": "Account created. Welcome to Singra!",
        "Conta paga. Já registramos o gasto para você.":
            "Bill paid. We already logged the expense for you.",
        "Dê um nome para a sua meta.": "Give your goal a name.",
        "Escolha com que frequência quer acompanhar.":
            "Choose how often you want to follow it.",
        "Escolha uma categoria para a conta.": "Pick a category for the bill.",
        "Essa categoria não está na sua lista.":
            "That category is not in your list.",
        "Essa conta já estava marcada como paga.":
            "That bill was already marked as paid.",
        "Essa conta não está marcada como paga.":
            "That bill is not marked as paid.",
        "Essa data não parece certa. Use dia/mês/ano.":
            "That date does not look right. Use day/month/year.",
        "Esse cartão não está na sua lista.": "That card is not in your list.",
        "Esse idioma não está disponível.": "That language is not available.",
        "Esse link já foi usado ou passou da validade. Peça um novo, é rapidinho.":
            "This link was already used or has expired. Ask for a new one, it is quick.",
        "Hmm, esses dados não bateram. Quer tentar de novo ou recuperar a senha?":
            "Hmm, those details did not match. Want to try again or recover your password?",
        "Já existe uma conta com esse e-mail. Quer entrar?":
            "There is already an account with that email. Want to sign in?",
        "Meta apagada.": "Goal deleted.",
        "Meta criada. Agora é só ir guardando.":
            "Goal created. Now just keep putting money in.",
        "Não encontramos essa conta.": "We could not find that bill.",
        "Não encontramos essa meta.": "We could not find that goal.",
        "Não encontramos esse cartão.": "We could not find that card.",
        "Não encontramos esse registro.": "We could not find that entry.",
        "Não havia nada para mudar.": "There was nothing to change.",
        "Pronto! Meta atualizada.": "Done! Goal updated.",
        "Pronto! Sua meta de investimento está criada.":
            "Done! Your saving goal is set.",
        "Quando ela vence?": "When is it due?",
        "Quanto é essa conta?": "How much is that bill?",
        "Salvo.": "Saved.",
        "Se existir uma conta com esse e-mail, mandamos um link para":
            "If an account exists with that email, we sent a link to",
        "Sua conta foi apagada. Obrigado por ter usado o Singra.":
            "Your account was deleted. Thank you for having used Singra.",
        "Tudo pronto!": "All set!",
        "Você já tem uma meta de investimento. Edite a que existe":
            "You already have a saving goal. Edit the one you have",
        "Voltamos a conta para 'a pagar'.": "We moved the bill back to unpaid.",

        // Seletor de mês e rótulos desenhados dentro dos gráficos
        "Escolher mês": "Pick a month",
        "Ir para o mês atual": "Go to the current month",
        "Ano anterior": "Previous year",
        "Próximo ano": "Next year",
        "Saldo do mês": "Month balance",
        "Sobrou": "Left over",
        "Faltou": "Short by",
        "Sua meta": "Your goal",
    },

    /* The sentences under the charts. The backend picks which one fits,
       because it has the numbers; the wording lives here. {name} is replaced
       with the value the backend sent — amounts already formatted in reais. */
    frases: {
        "frase.categorias.vazio":
            "As soon as you log a few expenses, we will show where the money is going.",
        "frase.categorias.maior":
            "{nome} was your biggest expense: {valor} ({pct}% of the month).",

        "frase.cartoes.vazio":
            "Link your expenses to a card or account to see this split.",
        "frase.cartoes.sem_vinculo":
            "Most of your spending ({pct}%) is not linked to any card yet.",
        "frase.cartoes.maior":
            "{nome} accounted for {valor} ({pct}% of your spending this month).",

        "frase.evolucao.poucos_meses":
            "With more than one month logged, you can compare the trend here.",
        "frase.evolucao.mes_vazio": "No entries this month yet.",
        "frase.evolucao.sobrou":
            "More came in than went out this month: {valor} left over.",
        "frase.evolucao.faltou":
            "This month {valor} more went out than came in. It is worth looking at the heaviest categories.",

        "frase.saldo.poucos_meses":
            "After a few months, this line shows whether you are improving.",
        "frase.saldo.todos_positivos":
            "You ended every logged month in the black. Keep it up.",
        "frase.saldo.nenhum_positivo":
            "No month has closed with money left over yet. A budget could turn that around.",
        "frase.saldo.parcial":
            "You finished the month with money left over in {positivos} of {total} months.",

        "frase.orcamento.vazio":
            "You have not decided how much to spend in each category yet.",
        "frase.orcamento.atencao_e_folga":
            "Keep an eye on {atencao}. There is still room in {folga} — or you can save what is left.",
        "frase.orcamento.so_atencao":
            "Keep an eye on {atencao}. No category has room to spare this month; easing off over the coming days evens it out.",
        "frase.orcamento.tranquilo_com_folga":
            "Every category is within what you planned. There is still room in {folga} — or you can save what is left.",
        "frase.orcamento.tranquilo":
            "Every category is within what you planned.",

        "frase.fixos.vazio":
            "Mark the expenses that repeat every month to see this split.",
        "frase.fixos.divisao":
            "{pct_fixos}% of your spending was already committed ({fixos} in recurring bills). The other {pct_variaveis}% is where you have a choice.",

        "frase.investimento.todos":
            "You hit your goal in every period. That is consistency.",
        "frase.investimento.nenhum":
            "You have not hit the goal in any period yet. How about starting with a smaller amount?",
        "frase.investimento.parcial":
            "You hit your goal in {bateram} of {total} periods.",

        "frase.comparacao.igual": "You spent the same as in {mes}.",
        "frase.comparacao.menos": "You spent {valor} less than in {mes}.",
        "frase.comparacao.mais": "You spent {valor} more than in {mes}.",

        "frase.disponivel.sem_dados":
            "Nothing here yet. How about logging your first expense?",
        "frase.disponivel.passou_planejado":
            "You went over what you planned for this month. There is room to make up for it in the coming days.",
        "frase.disponivel.passou_ganhos":
            "More went out than came in this month. Take a look at the bigger expenses.",
        "frase.disponivel.do_planejamento":
            "That is what is left of your {planejado} budget.",
        "frase.disponivel.planejamento_e_extra":
            "That is what is left of your {planejado} budget, plus {extra} that came in on top of it.",
        "frase.disponivel.entrou_saiu": "{ganhos} came in and {gastos} went out.",

        "frase.poupanca.acima":
            "You saved {taxa}% of what came in. That is above the suggested 20%.",
        "frase.poupanca.parcial": "You saved {taxa}% of what came in this month.",
        "frase.poupanca.zero":
            "Nothing was left this month. It happens; next one can be different.",
    },
};
