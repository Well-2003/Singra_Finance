/* Singra - Español
   La clave de cada entrada es la frase en portugués tal como está escrita
   en las pantallas. Que falte una entrada no rompe la página: la frase
   simplemente se queda en portugués.

   Dos cosas nunca se traducen aquí. Lo que la persona escribió — nombres de
   categorías, descripciones de gastos, nombres de metas y de tarjetas —,
   porque traducirlo cambiaría lo que quiso decir. Y el dinero: Singra
   funciona en Brasil, así que la moneda sigue en reales en cualquier idioma.

   Las reglas de tono del producto viajan con la traducción: nunca culpar,
   nunca exagerar y, cuando el número es malo, señalar el siguiente paso. */

window.TextosES = {
    codigo: "es",
    nome: "Español",
    // Une el último elemento de una lista de categorías
    conector: "y",

    textos: {
        // Navegación y elementos comunes
        "Pular para o conteúdo": "Ir al contenido",
        // Aparece solo entre dos valores: "R$ 200,00 de R$ 500,00"
        "de": "de",
        "Adicionar": "Agregar",
        "Adicionar gasto ou ganho": "Agregar gasto o ingreso",
        "Adicionar gasto": "Agregar gasto",
        "+ Adicionar gasto": "+ Agregar gasto",
        "Adicionar gasto/ganho": "Agregar gasto o ingreso",
        "Início": "Inicio",
        "Histórico": "Historial",
        "Gráficos": "Gráficos",
        "Planejamento": "Planificación",
        "Metas": "Metas",
        "Contas": "Cuentas",
        "Contas a pagar": "Cuentas por pagar",
        "Ajuda": "Ayuda",
        "Meu perfil": "Mi perfil",
        "Sair": "Salir",
        "Mais": "Más",
        "Mais opções": "Más opciones",
        "Menu do Singra": "Menú de Singra",
        "Menu principal": "Menú principal",
        "Fechar": "Cerrar",
        "Voltar": "Volver",
        "Continuar": "Continuar",
        "Salvar": "Guardar",
        "Confirmar": "Confirmar",
        "Cancelar": "Cancelar",
        "Apagar": "Borrar",
        "Mudar": "Cambiar",
        "Ver todas": "Ver todas",
        "Ver todos": "Ver todos",
        "Sobre nós": "Sobre nosotros",
        "Criar conta": "Crear cuenta",
        "Criar conta grátis": "Crear cuenta gratis",
        "Entrar": "Entrar",
        "Ir para o meu painel": "Ir a mi panel",
        "Seu dinheiro, organizado sem planilha.":
            "Tu dinero, ordenado sin planilla.",
        "© 2026 Singra · Todos os direitos reservados":
            "© 2026 Singra · Todos los derechos reservados",
        "Links do rodapé": "Enlaces del pie de página",

        // Carga, conexión y sesión
        "Só um instante, estamos preparando tudo 🌱":
            "Un momento, estamos preparando todo 🌱",
        "O servidor estava descansando e está acordando agora.":
            "El servidor estaba descansando y se está despertando ahora.",
        "O servidor está demorando mais que o normal.":
            "El servidor está tardando más de lo normal.",
        "Só acontece no primeiro acesso depois de um tempo parado.":
            "Solo pasa la primera vez que vuelves después de un tiempo.",
        "Tente de novo em alguns instantes.": "Inténtalo de nuevo en un momento.",
        "Parece que a internet caiu. Tente de novo em instantes.":
            "Parece que se cayó la conexión. Inténtalo de nuevo en un momento.",
        "Sua sessão expirou. Entre de novo, por favor.":
            "Tu sesión expiró. Entra de nuevo, por favor.",
        "Algo deu errado do nosso lado. Tente de novo.":
            "Algo salió mal de nuestro lado. Inténtalo de nuevo.",
        "Não conseguimos salvar agora.": "No pudimos guardarlo ahora.",
        "O endereço da API ainda não foi configurado.":
            "La dirección de la API todavía no fue configurada.",
        "Salvando…": "Guardando…",
        "Criando…": "Creando…",
        "Entrando…": "Entrando…",
        "Enviando…": "Enviando…",
        "Guardando…": "Guardando…",
        "Carregando…": "Cargando…",

        // Página inicial pública
        "Registre um gasto em três toques e descubra, em uma olhada, quanto você ainda pode gastar este mês.":
            "Registra un gasto en tres toques y descubre, de un vistazo, cuánto puedes gastar todavía este mes.",
        "Começar agora": "Empezar ahora",
        "Já tenho conta": "Ya tengo cuenta",
        "Grátis. Sem cartão de crédito, sem propaganda de banco.":
            "Gratis. Sin tarjeta de crédito, sin publicidad de bancos.",
        "Feito para quem nunca teve paciência com planilha":
            "Hecho para quien nunca tuvo paciencia con las planillas",
        "Três coisas resolvem quase tudo: registrar rápido, entender para onde o dinheiro foi e ter um lugar guardando o que sobra.":
            "Tres cosas resuelven casi todo: registrar rápido, entender adónde fue el dinero y tener un lugar para lo que sobra.",
        "Registre em 3 toques": "Registra en 3 toques",
        "Valor, categoria, pronto. Sem formulário comprido, sem campo obrigatório que trava o registro no meio.":
            "Monto, categoría, listo. Sin formularios largos, sin campos obligatorios que traben el registro a la mitad.",
        "Veja para onde vai seu dinheiro": "Mira adónde va tu dinero",
        "Sete gráficos com uma frase embaixo explicando o que cada um está dizendo. Nada de você ter que interpretar sozinho.":
            "Siete gráficos, cada uno con una frase debajo que explica lo que dice. No tienes que interpretarlo solo.",
        "Alcance suas metas": "Alcanza tus metas",
        "Escolha quanto quer guardar e com que frequência. O Singra acompanha e avisa quando dá para guardar mais.":
            "Elige cuánto quieres guardar y con qué frecuencia. Singra hace el seguimiento y te avisa cuando hay margen para más.",
        "Gráficos que respondem perguntas": "Gráficos que responden preguntas",
        "Cada desenho tem um título em forma de pergunta e uma frase embaixo que responde. Estes são de exemplo.":
            "Cada gráfico tiene una pregunta por título y una frase debajo que la responde. Estos son de ejemplo.",
        "Para quem o Singra foi feito": "Para quién es Singra",
        "Pessoas que ganham o suficiente, mas chegam ao fim do mês sem saber para onde o dinheiro foi.":
            "Personas que ganan lo suficiente, pero llegan a fin de mes sin saber adónde fue el dinero.",
        "Depoimentos ilustrativos, escritos por nós. O Singra é um projeto novo e ainda não tem clientes para citar.":
            "Testimonios ilustrativos, escritos por nosotros. Singra es un proyecto nuevo y todavía no tiene clientes que citar.",
        "Comece pelo próximo gasto": "Empieza por el próximo gasto",
        "Não precisa organizar o passado. Registre o café de hoje e o resto vai se montando sozinho.":
            "No hace falta ordenar el pasado. Registra el café de hoy y el resto se va armando solo.",
        "Criar minha conta grátis": "Crear mi cuenta gratis",

        // Entrar, crear cuenta y recuperar contraseña
        "Que bom te ver de novo": "Qué bueno verte de nuevo",
        "Seu e-mail": "Tu correo",
        "Sua senha": "Tu contraseña",
        "Mostrar senha": "Mostrar contraseña",
        "Esconder senha": "Ocultar contraseña",
        "Manter conectado neste aparelho": "Mantener la sesión en este dispositivo",
        "Esqueci minha senha": "Olvidé mi contraseña",
        "Ainda não tem conta?": "¿Todavía no tienes cuenta?",
        "Já tem conta?": "¿Ya tienes cuenta?",
        "Vamos começar": "Vamos a empezar",
        "Leva menos de um minuto. E é de graça.":
            "Toma menos de un minuto. Y es gratis.",
        "Como você se chama?": "¿Cómo te llamas?",
        "Crie uma senha": "Crea una contraseña",
        "Criar minha conta": "Crear mi cuenta",
        "Usamos só para você entrar e recuperar a senha.":
            "Solo lo usamos para que entres y recuperes la contraseña.",
        "A senha precisa de pelo menos 8 letras ou números.":
            "La contraseña necesita al menos 8 letras o números.",
        "Senha fraca. Que tal juntar letras e números?":
            "Contraseña débil. ¿Qué tal mezclar letras y números?",
        "Senha boa.": "Buena contraseña.",
        "Senha ótima!": "¡Excelente contraseña!",
        "Preencha o e-mail e a senha para continuar.":
            "Completa el correo y la contraseña para continuar.",
        "Esse e-mail parece incompleto. Confere para a gente?":
            "Ese correo parece incompleto. ¿Lo revisas?",
        "Falta seu nome. Como podemos te chamar?":
            "Falta tu nombre. ¿Cómo te podemos llamar?",
        "Esqueci minha senha.": "Olvidé mi contraseña.",
        "Diga seu e-mail e a gente manda um link.":
            "Dinos tu correo y te mandamos un enlace.",
        "Mandar o link": "Enviar el enlace",
        "Confira seu e-mail": "Revisa tu correo",
        "Lembrei a senha, quero entrar": "Ya la recordé, quiero entrar",
        "Voltar para entrar": "Volver a entrar",
        "Vamos criar uma senha nova": "Vamos a crear una contraseña nueva",
        "Crie sua senha nova": "Crea tu contraseña nueva",
        "Senha nova": "Contraseña nueva",
        "Salvar e entrar": "Guardar y entrar",
        "Esse link não vale mais": "Este enlace ya no sirve",
        "Pedir um link novo": "Pedir un enlace nuevo",

        // Primeros pasos
        "Primeiros passos": "Primeros pasos",
        "Passo": "Paso",
        "Pular esta pergunta": "Saltar esta pregunta",
        "Pular tudo e ir para o painel": "Saltar todo e ir al panel",
        "Concluir": "Terminar",
        "Como você quer ser chamado?": "¿Cómo quieres que te llamemos?",
        "É o nome que vai aparecer na saudação do painel.":
            "Es el nombre que aparece en el saludo del panel.",
        "Seu apelido": "Tu apodo",
        "Como é a sua renda?": "¿Cómo son tus ingresos?",
        "Isso ajuda a sugerir um planejamento no seu tamanho.":
            "Esto ayuda a sugerir un presupuesto a tu medida.",
        "Tenho um valor fixo todo mês": "Tengo un monto fijo cada mes",
        "Salário, aposentadoria, pensão": "Sueldo, jubilación, pensión",
        "Sou autônomo(a), varia": "Trabajo por mi cuenta, varía",
        "Uns meses mais, outros menos": "Unos meses más, otros menos",
        "Quanto entra por mês?": "¿Cuánto entra por mes?",
        "Quanto entra, em média, por mês?":
            "¿Cuánto entra, en promedio, por mes?",
        "Não precisa ser exato, é só para começar.":
            "No tiene que ser exacto, es solo para empezar.",
        "Você costuma ter alguma renda extra?":
            "¿Sueles tener algún ingreso extra?",
        "Bico, freela, uma venda de vez em quando.":
            "Changas, trabajos por encargo, alguna venta de vez en cuando.",
        "Sim, tenho": "Sí, tengo",
        "Não tenho": "No tengo",
        "De que tipo?": "¿De qué tipo?",
        "Bico": "Changa",
        "Freela": "Por encargo",
        "Venda": "Venta",
        "Outro": "Otro",
        "Quanto costuma vir? (opcional)": "¿Cuánto suele ser? (opcional)",
        "Esse valor é só um lembrete seu. Ele não entra no cálculo do quanto você pode gastar — a renda extra só conta quando o dinheiro cai de verdade e você registra o ganho.":
            "Este monto es solo un recordatorio tuyo. No entra en el cálculo de cuánto puedes gastar: el ingreso extra cuenta cuando el dinero llega de verdad y lo registras.",
        "Quanto você quer guardar ou investir por mês?":
            "¿Cuánto quieres guardar o invertir por mes?",
        "Pode ser pouco. O que importa é começar.":
            "Puede ser poco. Lo que importa es empezar.",
        "Valor que quero guardar": "Monto que quiero guardar",
        "Se pular, a área de investimento nem aparece no seu painel. Dá para ligar depois em Metas.":
            "Si lo saltas, la sección de ahorro ni aparece en tu panel. Puedes activarla después en Metas.",
        "Ainda não sei, pular por enquanto": "Todavía no sé, saltar por ahora",
        "Com que frequência quer acompanhar essa meta?":
            "¿Con qué frecuencia quieres seguir esta meta?",
        "Dá para trocar quando quiser, em Metas.":
            "Puedes cambiarlo cuando quieras, en Metas.",
        "Diária": "Diaria",
        "Semanal": "Semanal",
        "Mensal": "Mensual",
        "Anual": "Anual",
        "todo dia": "todos los días",
        "toda semana": "todas las semanas",
        "todo mês": "todos los meses",
        "no ano": "al año",
        "Quer que a gente sugira um planejamento?":
            "¿Quieres que te sugiramos un presupuesto?",
        "A gente divide sua renda em 50% para o essencial, 30% para o que você escolhe e 20% para guardar. Depois é só ajustar.":
            "Dividimos tus ingresos en 50% para lo esencial, 30% para lo que elijas y 20% para guardar. Después lo ajustas.",
        "Sim, pode sugerir": "Sí, sugiéranme uno",
        "Um ponto de partida, não uma regra": "Un punto de partida, no una regla",
        "Não, prefiro montar depois": "No, prefiero armarlo después",
        "Você vai direto para o Início": "Vas directo a Inicio",

        // Panel
        "Aqui está como você está indo.": "Así vas este mes.",
        "Você ainda pode gastar": "Todavía puedes gastar",
        "Você passou do combinado em": "Te pasaste de lo acordado en",
        "Entraram": "Entró",
        "Saíram": "Salió",
        "Guardado": "Guardado",
        "Guardado este mês": "Guardado este mes",
        "Ver meta": "Ver meta",
        "Faltam": "Faltan",
        "Próximas contas": "Próximas cuentas",
        "Seus gastos por categoria": "Tus gastos por categoría",
        "Ver gráficos": "Ver gráficos",
        "Suas metas": "Tus metas",
        "Últimos registros": "Últimos registros",
        "Ver histórico": "Ver historial",
        "Toque em qualquer registro para corrigir ou apagar.":
            "Toca cualquier registro para corregirlo o borrarlo.",
        "Ainda dá para guardar": "Todavía puedes guardar",
        "Guardar agora": "Guardar ahora",
        "Aumentar minha meta": "Aumentar mi meta",
        "Dispensar": "Descartar",

        // Panel de agregar gasto o ingreso
        "Gasto": "Gasto",
        "Ganho": "Ingreso",
        "Tipo do registro": "Tipo de registro",
        "Quanto foi?": "¿Cuánto fue?",
        "Apagar último número": "Borrar último número",
        "Em que você gastou?": "¿En qué gastaste?",
        "De onde veio?": "¿De dónde vino?",
        "Mais categorias": "Más categorías",
        "O que foi? (opcional)": "¿Qué fue? (opcional)",
        "Quando foi?": "¿Cuándo fue?",
        "Como você pagou?": "¿Cómo pagaste?",
        "Vincular a um cartão ou conta": "Vincular a una tarjeta o cuenta",
        "Não vincular a nenhum": "No vincular a ninguna",
        "Esse gasto se repete todo mês?": "¿Este gasto se repite todos los meses?",
        "Foi parcelado?": "¿Fue en cuotas?",
        "Em quantas vezes?": "¿En cuántas cuotas?",
        "Mais detalhes": "Más detalles",
        "Fechar sem salvar": "Cerrar sin guardar",
        "Apagar esse registro": "Borrar este registro",
        "Apagar esse registro?": "¿Borrar este registro?",
        "Não dá para desfazer.": "No se puede deshacer.",
        "Apagar a compra inteira?": "¿Borrar la compra entera?",
        "As parcelas dos outros meses também somem. Não dá para desfazer.":
            "Las cuotas de los otros meses también desaparecen. No se puede deshacer.",
        "Pix": "Pix",
        "Dinheiro": "Efectivo",
        "Débito": "Débito",
        "Crédito": "Crédito",
        "Boleto": "Boleta",
        "Falta só o valor. Quanto foi?": "Solo falta el monto. ¿Cuánto fue?",
        "Escolha uma categoria para continuar.": "Elige una categoría para continuar.",
        "Pronto! Gasto registrado.": "¡Listo! Gasto registrado.",
        "Pronto! Ganho registrado.": "¡Listo! Ingreso registrado.",
        "Pronto! Corrigimos para você.": "¡Listo! Lo corregimos para ti.",
        "Apagado.": "Borrado.",

        // Historial
        "Gastos e ganhos": "Gastos e ingresos",
        "Só gastos": "Solo gastos",
        "Só ganhos": "Solo ingresos",
        "Este mês": "Este mes",
        "Mês passado": "Mes pasado",
        "Escolher período": "Elegir período",
        "Período escolhido": "Período elegido",
        "Filtrar": "Filtrar",
        "Ver resultados": "Ver resultados",
        "Limpar filtros": "Limpiar filtros",
        "De": "Desde",
        "Até": "Hasta",
        "Tipo": "Tipo",
        "Categoria": "Categoría",
        "Todas": "Todas",
        "Forma de pagamento": "Forma de pago",
        "Hoje": "Hoy",
        "Amanhã": "Mañana",
        "Ontem": "Ayer",
        "Saiu": "Salió",
        "Entrou": "Entró",
        "registros": "registros",
        "Nenhum registro neste período": "Ningún registro en este período",
        "Mude os filtros ou registre um gasto para começar.":
            "Cambia los filtros o registra un gasto para empezar.",

        // Presupuesto
        "Seu planejamento": "Tu presupuesto",
        "Quanto você quer gastar em cada categoria.":
            "Cuánto quieres gastar en cada categoría.",
        "Planejado para": "Planeado para",
        "Já gasto": "Ya gastado",
        "Copiar do mês anterior": "Copiar del mes anterior",
        "Sugerir planejamento (50/30/20)": "Sugerir presupuesto (50/30/20)",
        "Categorias com limite": "Categorías con límite",
        "Incluir mais categorias": "Incluir más categorías",
        "Escolha por onde começar": "Elige por dónde empezar",
        "essencial": "esencial",
        "escolha sua": "tu elección",
        "Coloque um valor para entrar no planejamento":
            "Pon un monto para entrar en el presupuesto",
        "Coloque um valor para a categoria entrar no planejamento.":
            "Pon un monto para que la categoría entre en el presupuesto.",
        "Toque no valor para mudar. A gente salva sozinho. Zerar um valor tira a categoria do planejamento.":
            "Toca el monto para cambiarlo. Lo guardamos solos. Poner cero saca la categoría del presupuesto.",
        "Ainda cabem": "Todavía caben",
        "Passou": "Se pasó",
        "do planejado": "de lo planeado",
        "passou": "se pasó",
        "Você ainda não definiu limites": "Todavía no definiste límites",
        "Escolher quanto quer gastar em cada categoria ajuda a não se assustar no fim do mês.":
            "Decidir cuánto quieres gastar en cada categoría evita sustos a fin de mes.",
        "Montar meu planejamento": "Armar mi presupuesto",
        "Esse valor não deu para entender. Tente só números.":
            "No pudimos entender ese monto. Prueba solo con números.",

        // Metas
        "Objetivos com nome e prazo dão sentido ao resto.":
            "Los objetivos con nombre y plazo le dan sentido al resto.",
        "Nova meta": "Nueva meta",
        "+ Nova meta": "+ Nueva meta",
        "Guardar dinheiro": "Guardar dinero",
        "Apagar meta": "Borrar meta",
        "Editar meta": "Editar meta",
        "Investimento": "Ahorro",
        "Nova meta de investimento": "Nueva meta de ahorro",
        "Editar meta de investimento": "Editar meta de ahorro",
        "Quanto você quer guardar por período?":
            "¿Cuánto quieres guardar por período?",
        "Quanto você quer guardar?": "¿Cuánto quieres guardar?",
        "Quanto custa o que você quer conquistar?":
            "¿Cuánto cuesta lo que quieres lograr?",
        "Você ainda não tem metas": "Todavía no tienes metas",
        "Um celular novo, uma viagem, uma reserva para imprevistos. O que você quer conquistar?":
            "Un celular nuevo, un viaje, un fondo para imprevistos. ¿Qué quieres lograr?",
        "Criar minha primeira meta": "Crear mi primera meta",
        "É o dinheiro para imprevistos:": "Es el dinero para imprevistos:",
        "Conquistada 🎉": "¡Lograda! 🎉",
        "Apagar a meta": "Borrar la meta",

        // Cuentas por pagar
        "Passou do vencimento": "Vencidas",
        "Vence hoje": "Vence hoy",
        "Próximos 7 dias": "Próximos 7 días",
        "Mais para frente": "Más adelante",
        "Já pagas": "Ya pagadas",
        "Já paguei": "Ya la pagué",
        "Marcar como paga": "Marcar como pagada",
        "Desfazer": "Deshacer",
        "Ainda falta pagar": "Todavía falta pagar",
        "Nova conta": "Nueva cuenta",
        "Que conta é essa?": "¿Qué cuenta es esta?",
        "Quanto é?": "¿Cuánto es?",
        "Quando vence?": "¿Cuándo vence?",
        "De que categoria?": "¿De qué categoría?",
        "Se repete todo mês?": "¿Se repite todos los meses?",
        "Cadastrar conta": "Guardar cuenta",
        "Nenhuma conta cadastrada": "Ninguna cuenta guardada",
        "Cadastre o aluguel, a luz, a internet. A gente lembra você antes do vencimento.":
            "Guarda el alquiler, la luz, el internet. Te avisamos antes del vencimiento.",
        "Cadastrar minha primeira conta": "Guardar mi primera cuenta",
        "Ao confirmar que pagou, a gente registra o gasto no seu histórico automaticamente.":
            "Al confirmar el pago, registramos el gasto en tu historial automáticamente.",
        "Ao marcar uma conta como paga, a gente registra o gasto no seu histórico automaticamente.":
            "Al marcar una cuenta como pagada, registramos el gasto en tu historial automáticamente.",
        "Vence em": "Vence el",
        "Venceu em": "Venció el",
        "Paga em": "Pagada el",
        "se repete todo mês": "se repite todos los meses",
        "Essa conta já estava paga.": "Esa cuenta ya estaba pagada.",
        "Para nunca mais pagar juros por esquecimento.":
            "Para no volver a pagar intereses por olvido.",

        // Gráficos
        "Seus gráficos": "Tus gráficos",
        "Cada desenho responde a uma pergunta.":
            "Cada gráfico responde una pregunta.",
        "Para onde foi meu dinheiro?": "¿Adónde fue mi dinero?",
        "Estou gastando mais do que ganho?": "¿Estoy gastando más de lo que gano?",
        "Quanto sobrou a cada mês?": "¿Cuánto sobró cada mes?",
        "Estou guardando o que combinei?": "¿Estoy guardando lo que me propuse?",
        "Em que cartão eu gastei?": "¿En qué tarjeta gasté?",
        "Quanto do meu dinheiro já estava comprometido?":
            "¿Cuánto de mi dinero ya estaba comprometido?",
        "Onde você tem escolha": "Donde puedes elegir",
        "Estou dentro do que combinei comigo?":
            "¿Estoy dentro de lo que me propuse?",
        "Últimos 6 meses": "Últimos 6 meses",
        "Últimos 12 meses": "Últimos 12 meses",
        "Sem gastos neste mês": "Sin gastos este mes",
        "Registre alguns gastos e este desenho aparece.":
            "Registra algunos gastos y este gráfico aparece.",

        // Mi perfil
        "Seus dados, suas categorias e suas preferências.":
            "Tus datos, tus categorías y tus preferencias.",
        "Seus dados": "Tus datos",
        "Seu nome": "Tu nombre",
        "Como quer ser chamado?": "¿Cómo quieres que te llamemos?",
        "É esse nome que aparece na saudação do painel.":
            "Es el nombre que aparece en el saludo del panel.",
        "O e-mail é o seu login e não muda por aqui.":
            "El correo es tu usuario y no se cambia por aquí.",
        "Quanto costuma entrar por mês?": "¿Cuánto suele entrar por mes?",
        "Serve para sugerir seu planejamento. Pode deixar em branco.":
            "Sirve para sugerir tu presupuesto. Puedes dejarlo en blanco.",
        "Minha renda varia de mês para mês": "Mis ingresos cambian de mes a mes",
        "Meu mês financeiro começa no dia": "Mi mes financiero empieza el día",
        "Quem recebe no dia 5 costuma preferir o dia 5: assim o mês do Singra acompanha o seu salário.":
            "Quien cobra el día 5 suele elegir el 5: así el mes de Singra sigue tu sueldo.",
        "Salvar meus dados": "Guardar mis datos",
        "Minhas categorias": "Mis categorías",
        "Renomear": "Renombrar",
        "Esconder": "Ocultar",
        "Mostrar": "Mostrar",
        "Escondidas": "Ocultas",
        "+ Criar categoria": "+ Crear categoría",
        "Criar categoria": "Crear categoría",
        "Categorias não são apagadas, e sim escondidas: os gastos que você já registrou precisam continuar apontando para alguma delas. Uma categoria escondida some das telas de registro, mas o histórico dela fica.":
            "Las categorías no se borran, se ocultan: los gastos que ya registraste tienen que seguir apuntando a alguna. Una categoría oculta desaparece de las pantallas de registro, pero su historial se queda.",
        "Nome": "Nombre",
        "É gasto ou ganho?": "¿Es gasto o ingreso?",
        "É uma despesa essencial?": "¿Es un gasto esencial?",
        "Escolha um desenho": "Elige un ícono",
        "E uma cor": "Y un color",
        "Meus cartões e bancos": "Mis tarjetas y bancos",
        "+ Cadastrar cartão": "+ Guardar tarjeta",
        "Novo cartão": "Nueva tarjeta",
        "Editar cartão": "Editar tarjeta",
        "Editar": "Editar",
        "Como você chama esse cartão?": "¿Cómo le llamas a esta tarjeta?",
        "Só o apelido. O Singra não pede nem guarda número de cartão.":
            "Solo el apodo. Singra no pide ni guarda números de tarjeta.",
        "Cor para reconhecer de relance": "Un color para reconocerla de un vistazo",
        "Nenhum cartão cadastrado": "Ninguna tarjeta guardada",
        "Cadastrar seus cartões é opcional. Serve só para você saber depois em qual deles gastou mais.":
            "Guardar tus tarjetas es opcional. Solo sirve para saber después en cuál gastaste más.",
        "Idioma": "Idioma",
        "A escolha fica na sua conta, e não neste aparelho: vale em qualquer lugar em que você fizer login.":
            "La elección vive en tu cuenta, no en este dispositivo: vale donde sea que entres.",
        "Trocar minha senha": "Cambiar mi contraseña",
        "Sua senha de agora": "Tu contraseña actual",
        "Sua nova senha": "Tu contraseña nueva",
        "Trocar senha": "Cambiar contraseña",
        "A nova senha precisa de pelo menos 8 caracteres.":
            "La contraseña nueva necesita al menos 8 caracteres.",
        "Seus dados são seus": "Tus datos son tuyos",
        "Baixe tudo o que você registrou em uma planilha. O arquivo abre no Excel e no Google Planilhas.":
            "Descarga todo lo que registraste en una planilla. El archivo abre en Excel y en Hojas de cálculo de Google.",
        "Baixar meus dados (CSV)": "Descargar mis datos (CSV)",
        "Não conseguimos preparar seu arquivo agora.":
            "No pudimos preparar tu archivo ahora.",
        "Apagar minha conta": "Borrar mi cuenta",
        "Apaga a conta e tudo o que está nela: gastos, ganhos, metas, contas e planejamento. Não dá para voltar atrás. Se quiser guardar seu histórico, baixe o CSV antes.":
            "Borra la cuenta y todo lo que hay en ella: gastos, ingresos, metas, cuentas y presupuesto. No hay vuelta atrás. Si quieres conservar tu historial, descarga el CSV antes.",
        "Quero apagar minha conta": "Quiero borrar mi cuenta",
        "Apagar a conta de vez": "Borrar la cuenta para siempre",
        "Some tudo: gastos, ganhos, metas, contas e planejamento. Não temos como recuperar depois.":
            "Desaparece todo: gastos, ingresos, metas, cuentas y presupuesto. No podemos recuperarlo después.",
        "Digite sua senha para confirmar": "Escribe tu contraseña para confirmar",
        "Mudei de ideia": "Cambié de idea",
        "Novo nome da categoria:": "Nuevo nombre de la categoría:",
        "Pronto! Seus dados foram salvos.": "¡Listo! Tus datos fueron guardados.",
        "Pronto! Sua senha foi trocada.": "¡Listo! Tu contraseña fue cambiada.",
        "Hmm, a senha atual não bateu.": "Mmm, la contraseña actual no coincide.",
        "Categoria criada.": "Categoría creada.",
        "Pronto! Categoria atualizada.": "¡Listo! Categoría actualizada.",
        "Cartão cadastrado.": "Tarjeta guardada.",
        "Pronto! Cartão atualizado.": "¡Listo! Tarjeta actualizada.",
        "Cartão removido. Os gastos dele continuam no histórico.":
            "Tarjeta eliminada. Sus gastos siguen en el historial.",
        "Como você chama esse cartão ou conta?":
            "¿Cómo le llamas a esta tarjeta o cuenta?",
        "Dê um nome para a categoria.": "Ponle un nombre a la categoría.",
        "Pronto! Seus dados foram baixados.": "¡Listo! Tus datos fueron descargados.",
        "Não conseguimos baixar agora. Tente de novo.":
            "No pudimos descargarlo ahora. Inténtalo de nuevo.",

        // Respuestas de la API: confirmaciones y avisos que llegan
        // listos del backend y aparecen bajo los campos
        "A senha não bateu. Sua conta continua aqui.":
            "La contraseña no coincide. Tu cuenta sigue aquí.",
        "Coloque quanto você quer gastar nessa categoria.":
            "Pon cuánto quieres gastar en esa categoría.",
        "Conta apagada.": "Cuenta borrada.",
        "Conta cadastrada. A gente lembra você.":
            "Cuenta guardada. Nosotros te avisamos.",
        "Conta criada. Bem-vindo ao Singra!":
            "Cuenta creada. ¡Bienvenido a Singra!",
        "Conta paga. Já registramos o gasto para você.":
            "Cuenta pagada. Ya registramos el gasto por ti.",
        "Dê um nome para a sua meta.": "Ponle un nombre a tu meta.",
        "Escolha com que frequência quer acompanhar.":
            "Elige con qué frecuencia quieres seguirla.",
        "Escolha uma categoria para a conta.":
            "Elige una categoría para la cuenta.",
        "Essa categoria não está na sua lista.":
            "Esa categoría no está en tu lista.",
        "Essa conta já estava marcada como paga.":
            "Esa cuenta ya estaba marcada como pagada.",
        "Essa conta não está marcada como paga.":
            "Esa cuenta no está marcada como pagada.",
        "Essa data não parece certa. Use dia/mês/ano.":
            "Esa fecha no parece correcta. Usa día/mes/año.",
        "Esse cartão não está na sua lista.": "Esa tarjeta no está en tu lista.",
        "Esse idioma não está disponível.": "Ese idioma no está disponible.",
        "Esse link já foi usado ou passou da validade. Peça um novo, é rapidinho.":
            "Este enlace ya fue usado o venció. Pide uno nuevo, es rapidito.",
        "Hmm, esses dados não bateram. Quer tentar de novo ou recuperar a senha?":
            "Mmm, esos datos no coinciden. ¿Quieres intentar de nuevo o recuperar la contraseña?",
        "Já existe uma conta com esse e-mail. Quer entrar?":
            "Ya existe una cuenta con ese correo. ¿Quieres entrar?",
        "Meta apagada.": "Meta borrada.",
        "Meta criada. Agora é só ir guardando.":
            "Meta creada. Ahora solo hay que ir guardando.",
        "Não encontramos essa conta.": "No encontramos esa cuenta.",
        "Não encontramos essa meta.": "No encontramos esa meta.",
        "Não encontramos esse cartão.": "No encontramos esa tarjeta.",
        "Não encontramos esse registro.": "No encontramos ese registro.",
        "Não havia nada para mudar.": "No había nada que cambiar.",
        "Pronto! Meta atualizada.": "¡Listo! Meta actualizada.",
        "Pronto! Sua meta de investimento está criada.":
            "¡Listo! Tu meta de ahorro está creada.",
        "Quando ela vence?": "¿Cuándo vence?",
        "Quanto é essa conta?": "¿Cuánto es esa cuenta?",
        "Salvo.": "Guardado.",
        "Se existir uma conta com esse e-mail, mandamos um link para":
            "Si existe una cuenta con ese correo, mandamos un enlace a",
        "Sua conta foi apagada. Obrigado por ter usado o Singra.":
            "Tu cuenta fue borrada. Gracias por haber usado Singra.",
        "Tudo pronto!": "¡Todo listo!",
        "Você já tem uma meta de investimento. Edite a que existe":
            "Ya tienes una meta de ahorro. Edita la que tienes",
        "Voltamos a conta para 'a pagar'.": "Volvimos la cuenta a \"por pagar\".",

        // Selector de mes y rótulos dibujados dentro de los gráficos
        "Escolher mês": "Elegir mes",
        "Ir para o mês atual": "Ir al mes actual",
        "Ano anterior": "Año anterior",
        "Próximo ano": "Año siguiente",
        "Saldo do mês": "Saldo del mes",
        "Sobrou": "Sobró",
        "Faltou": "Faltó",
        "Sua meta": "Tu meta",
    },

    /* Las frases debajo de los gráficos. El backend elige cuál cabe, porque
       tiene los números; la redacción vive aquí. {nombre} se reemplaza por
       el valor que mandó el backend — los montos ya vienen en reales. */
    frases: {
        "frase.categorias.vazio":
            "En cuanto registres algunos gastos, te mostramos adónde está yendo el dinero.",
        "frase.categorias.maior":
            "{nome} fue tu mayor gasto: {valor} ({pct}% del mes).",

        "frase.cartoes.vazio":
            "Vincula tus gastos a una tarjeta o cuenta para ver esta división.",
        "frase.cartoes.sem_vinculo":
            "La mayor parte de tus gastos ({pct}%) todavía no está vinculada a ninguna tarjeta.",
        "frase.cartoes.maior":
            "{nome} concentró {valor} ({pct}% de tus gastos del mes).",

        "frase.evolucao.poucos_meses":
            "Con más de un mes registrado, aquí puedes comparar la evolución.",
        "frase.evolucao.mes_vazio": "Todavía no hay registros este mes.",
        "frase.evolucao.sobrou":
            "Este mes entró más de lo que salió: sobraron {valor}.",
        "frase.evolucao.faltou":
            "Este mes salieron {valor} más de lo que entró. Vale mirar las categorías que más pesaron.",

        "frase.saldo.poucos_meses":
            "Después de algunos meses, esta línea muestra si estás mejorando.",
        "frase.saldo.todos_positivos":
            "Cerraste en positivo todos los meses registrados. Sigue así.",
        "frase.saldo.nenhum_positivo":
            "Ningún mes cerró con sobra todavía. Un presupuesto puede dar vuelta el partido.",
        "frase.saldo.parcial":
            "Cerraste el mes con dinero de sobra en {positivos} de {total} meses.",

        "frase.orcamento.vazio":
            "Todavía no definiste cuánto quieres gastar en cada categoría.",
        "frase.orcamento.atencao_e_folga":
            "Ojo con {atencao}. Todavía cabe gasto en {folga} — o puedes guardar lo que sobre.",
        "frase.orcamento.so_atencao":
            "Ojo con {atencao}. Ninguna categoría tiene margen este mes; aflojar en los próximos días lo equilibra.",
        "frase.orcamento.tranquilo_com_folga":
            "Todas las categorías están dentro de lo que planeaste. Todavía cabe gasto en {folga} — o puedes guardar lo que sobre.",
        "frase.orcamento.tranquilo":
            "Todas las categorías están dentro de lo que planeaste.",

        "frase.fixos.vazio":
            "Marca los gastos que se repiten todos los meses para ver esta división.",
        "frase.fixos.divisao":
            "{pct_fixos}% de tus gastos ya estaba comprometido ({fixos} en cuentas que se repiten). El otro {pct_variaveis}% es donde puedes elegir.",

        "frase.investimento.todos":
            "Alcanzaste tu meta en todos los períodos. Eso es constancia.",
        "frase.investimento.nenhum":
            "Todavía no alcanzaste la meta en ningún período. ¿Qué tal empezar con un monto menor?",
        "frase.investimento.parcial":
            "Alcanzaste tu meta en {bateram} de {total} períodos.",

        "frase.comparacao.igual": "Gastaste lo mismo que en {mes}.",
        "frase.comparacao.menos": "Gastaste {valor} menos que en {mes}.",
        "frase.comparacao.mais": "Gastaste {valor} más que en {mes}.",

        "frase.disponivel.sem_dados":
            "Todavía no hay nada por aquí. ¿Qué tal registrar tu primer gasto?",
        "frase.disponivel.passou_planejado":
            "Te pasaste de lo que habías planeado para este mes. Hay margen para compensarlo en los próximos días.",
        "frase.disponivel.passou_ganhos":
            "Salió más de lo que entró este mes. Échale un ojo a los gastos más grandes.",
        "frase.disponivel.do_planejamento":
            "Es lo que sobra de tu presupuesto de {planejado}.",
        "frase.disponivel.planejamento_e_extra":
            "Es lo que sobra de tu presupuesto de {planejado}, más {extra} que entraron por encima de él.",
        "frase.disponivel.entrou_saiu": "Entraron {ganhos} y salieron {gastos}.",

        "frase.poupanca.acima":
            "Guardaste {taxa}% de lo que entró. Está por encima del 20% sugerido.",
        "frase.poupanca.parcial": "Guardaste {taxa}% de lo que entró este mes.",
        "frase.poupanca.zero":
            "Este mes no sobró nada. Pasa; el próximo puede ser distinto.",
    },
};
