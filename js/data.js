/* ===== DADOS DO JOGO — RPG DA LIBERDADE ===== */

const GAME_DATA = {

  phases: [
    {
      id: 0,
      name: "Estabilização",
      location: "Floresta da Organização",
      icon: "🌲",
      description: "Criar clareza financeira. Organizar caixas. Evitar déficit.",
      reward: "Clareza e Controle",
      xp: 500,
      missions: [
        { id: "0_1", title: "Organizar todas as finanças", desc: "Mapear todas as entradas e saídas mensais", type: "main" },
        { id: "0_2", title: "Separar os caixas financeiros", desc: "Criar divisões claras para cada objetivo", type: "main" },
        { id: "0_3", title: "Zerar o déficit mensal", desc: "Fechar o mês com saldo positivo", type: "main" },
        { id: "0_4", title: "Criar planilha de controle", desc: "Documentar todas as finanças em um único lugar", type: "secondary" },
        { id: "0_5", title: "Definir orçamento mensal", desc: "Planejar os gastos com antecedência", type: "secondary" },
        { id: "0_6", title: "Revisar assinaturas e contratos", desc: "Eliminar gastos desnecessários", type: "secondary" },
        { id: "0_7", title: "Primeiro mês sem déficit", desc: "Fechar o mês com saldo positivo pela primeira vez", type: "secondary" },
      ]
    },
    {
      id: 1,
      name: "Primeira Venda",
      location: "Vila da Primeira Venda",
      icon: "🏘️",
      description: "Provar que é capaz de vender. O valor não importa — importa a conquista.",
      reward: "Prova de Potencial",
      xp: 1000,
      missions: [
        { id: "1_1", title: "Conseguir o primeiro cliente próprio", desc: "A primeira venda abre o caminho para todas as outras. Qualquer valor conta.", type: "main" },
        { id: "1_2", title: "Criar portfólio inicial", desc: "Montar exemplos do seu trabalho, mesmo que gratuitos", type: "secondary" },
        { id: "1_3", title: "Definir serviços e tabela de preços", desc: "Criar sua oferta de serviços com valores claros", type: "secondary" },
        { id: "1_4", title: "Divulgar para rede de contatos", desc: "Contar o que você faz para quem você conhece", type: "secondary" },
        { id: "1_5", title: "Atualizar perfil profissional", desc: "Instagram ou LinkedIn com foco em clientes", type: "secondary" },
        { id: "1_6", title: "Fazer proposta para 3 pessoas", desc: "Praticar apresentar seus serviços sem medo", type: "secondary" },
      ]
    },
    {
      id: 2,
      name: "Renda Recorrente",
      location: "Montanha da Renda Recorrente",
      icon: "⛰️",
      description: "Diminuir dependência do emprego atual. Alcançar R$500/mês de renda própria.",
      reward: "Independência Inicial",
      xp: 2000,
      missions: [
        { id: "2_1", title: "Alcançar R$500/mês de renda própria", desc: "Renda recorrente de pelo menos R$500 mensais de forma consistente", type: "main" },
        { id: "2_2", title: "Conseguir 2 clientes fixos mensais", desc: "Clientes que pagam mensalidade pelo seu serviço", type: "secondary" },
        { id: "2_3", title: "Criar pacotes de serviços mensais", desc: "Transformar serviços avulsos em mensalidades", type: "secondary" },
        { id: "2_4", title: "Pedir indicações para clientes atuais", desc: "Solicitar referências e ampliar a rede", type: "secondary" },
      ]
    },
    {
      id: 3,
      name: "Ferramentas de Trabalho",
      location: "Forja das Ferramentas",
      icon: "🔨",
      description: "Melhorar capacidade produtiva. Comprar celular novo sem comprometer a reserva.",
      reward: "Equipamento de Aventureira",
      xp: 1500,
      missions: [
        { id: "3_1", title: "Comprar celular novo", desc: "Adquirir equipamento profissional sem comprometer reservas", type: "main" },
        { id: "3_2", title: "Definir modelo e orçamento", desc: "Pesquisar a melhor opção custo-benefício", type: "secondary" },
        { id: "3_3", title: "Guardar dinheiro específico para o celular", desc: "Caixa separado para equipamentos", type: "secondary" },
        { id: "3_4", title: "Avaliar outros equipamentos necessários", desc: "Listar o que mais pode melhorar sua produção", type: "secondary" },
      ]
    },
    {
      id: 4,
      name: "Classe Avançada",
      location: "Torre dos Sites",
      icon: "🗼",
      description: "Expandir habilidades. Construir portfólio de sites e se tornar referência.",
      reward: "Mestre dos Sites",
      xp: 2500,
      missions: [
        { id: "4_1", title: "Construir portfólio com 3 sites", desc: "Ter pelo menos 3 sites completos para mostrar", type: "main" },
        { id: "4_2", title: "Aprender WordPress avançado", desc: "Dominar temas, plugins e customizações", type: "secondary" },
        { id: "4_3", title: "Criar landing page profissional própria", desc: "Seu site de apresentação de serviços", type: "secondary" },
        { id: "4_4", title: "Conseguir primeiro cliente de site", desc: "Vender seu primeiro projeto de site", type: "secondary" },
        { id: "4_5", title: "Aprender SEO básico", desc: "Otimizar sites para aparecer no Google", type: "secondary" },
        { id: "4_6", title: "Dominar hospedagem em nuvem", desc: "Deploy, gerenciamento e configuração de servidores", type: "secondary" },
      ]
    },
    {
      id: 5,
      name: "Reserva de Liberdade",
      location: "Fortaleza da Reserva",
      icon: "🏰",
      description: "Construir reserva financeira progressiva. Cada marco celebrado.",
      reward: "Escudo Financeiro",
      xp: 3000,
      missions: [
        { id: "5_1", title: "Guardar R$5.000 de reserva", desc: "Primeiro marco da reserva de emergência", type: "main" },
        { id: "5_2", title: "Guardar R$10.000 de reserva", desc: "Segunda etapa — reserva de liberdade intermediária", type: "main" },
        { id: "5_3", title: "Guardar R$15.000 de reserva", desc: "Reserva de liberdade completa", type: "main" },
        { id: "5_4", title: "Colocar reserva para render", desc: "Investir a reserva em aplicação segura e rentável", type: "secondary" },
        { id: "5_5", title: "Manter reserva por 3 meses seguidos", desc: "Consistência é mais importante que o valor", type: "secondary" },
      ]
    },
    {
      id: 6,
      name: "Projeto Independência",
      location: "Planejamento da Independência",
      icon: "🏠",
      description: "Planejar vida fora da casa dos pais. Criar simulações. Comparar cidades e custos.",
      reward: "Chave da Liberdade",
      xp: 4000,
      missions: [
        { id: "6_1", title: "Criar plano completo de independência", desc: "Mapear todos os custos, prazos e estratégias para morar sozinha", type: "main" },
        { id: "6_2", title: "Pesquisar bairros e preços de aluguel", desc: "Mapear opções reais de moradia", type: "secondary" },
        { id: "6_3", title: "Calcular custo real mensal de vida independente", desc: "Entender o real custo de morar sozinha", type: "secondary" },
        { id: "6_4", title: "Simular orçamento doméstico completo", desc: "Praticar gestão financeira de uma moradia", type: "secondary" },
        { id: "6_5", title: "Definir a renda mínima necessária", desc: "Calcular o valor de renda que permite a mudança", type: "secondary" },
        { id: "6_6", title: "Comparar cidades e estilos de vida", desc: "Pesquisar onde você gostaria de viver", type: "secondary" },
      ]
    },
    {
      id: 7,
      name: "Liberdade de Escolha",
      location: "Cidade da Independência",
      icon: "✨",
      description: "Possuir condições reais para decidir: onde morar, onde trabalhar, como viver.",
      reward: "Liberdade Total",
      xp: 10000,
      missions: [
        { id: "7_1", title: "Conquistar liberdade de escolha real", desc: "Ter renda, reservas e estrutura para viver da forma que escolher", type: "main" },
        { id: "7_2", title: "Ter renda que cobre todos os custos com margem", desc: "Renda maior que as despesas com folga", type: "secondary" },
        { id: "7_3", title: "Morar onde quiser", desc: "Ter liberdade geográfica real", type: "secondary" },
        { id: "7_4", title: "Trabalhar por propósito, não por necessidade", desc: "Liberdade profissional verdadeira", type: "secondary" },
      ]
    },
  ],

  frozenMissions: [
    {
      id: "fm_notebook",
      name: "Notebook Profissional",
      icon: "💻",
      desc: "Comprar um notebook para trabalho remoto e mobilidade",
      checklist: [
        { id: "fm_nb_1", task: "Definir configuração necessária" },
        { id: "fm_nb_2", task: "Definir orçamento máximo" },
        { id: "fm_nb_3", task: "Pesquisar melhores opções" },
        { id: "fm_nb_4", task: "Guardar dinheiro específico" },
        { id: "fm_nb_5", task: "Comprar" },
      ]
    },
    {
      id: "fm_computador",
      name: "Computador Gamer",
      icon: "🖥️",
      desc: "Montar ou comprar um computador potente para trabalho e lazer",
      checklist: [
        { id: "fm_cg_1", task: "Definir configuração desejada" },
        { id: "fm_cg_2", task: "Definir orçamento" },
        { id: "fm_cg_3", task: "Pesquisar melhores preços" },
        { id: "fm_cg_4", task: "Separar dinheiro específico" },
        { id: "fm_cg_5", task: "Comprar" },
      ]
    },
    {
      id: "fm_viagem",
      name: "Primeira Viagem",
      icon: "✈️",
      desc: "Fazer uma viagem com dinheiro do próprio trabalho",
      checklist: [
        { id: "fm_v_1", task: "Escolher o destino" },
        { id: "fm_v_2", task: "Calcular custo total" },
        { id: "fm_v_3", task: "Criar caixa de viagem" },
        { id: "fm_v_4", task: "Guardar o valor total" },
        { id: "fm_v_5", task: "Planejar e reservar" },
        { id: "fm_v_6", task: "Ir 🎉" },
      ]
    },
    {
      id: "fm_faculdade",
      name: "Faculdade / Curso Superior",
      icon: "🎓",
      desc: "Pesquisar e planejar formação acadêmica ou técnica",
      checklist: [
        { id: "fm_f_1", task: "Definir área de interesse" },
        { id: "fm_f_2", task: "Pesquisar opções (presencial, EAD, técnico)" },
        { id: "fm_f_3", task: "Verificar custo e bolsas disponíveis" },
        { id: "fm_f_4", task: "Planejar financiamento ou pagamento" },
        { id: "fm_f_5", task: "Inscrever-se" },
      ]
    },
    {
      id: "fm_reserva_maior",
      name: "Reserva de R$30.000",
      icon: "🏦",
      desc: "Expandir a reserva para um valor que garante mais de 6 meses de tranquilidade",
      checklist: [
        { id: "fm_r_1", task: "Chegar em R$15.000 (Fase 5)" },
        { id: "fm_r_2", task: "Manter investindo mensalmente" },
        { id: "fm_r_3", task: "Chegar em R$20.000" },
        { id: "fm_r_4", task: "Chegar em R$25.000" },
        { id: "fm_r_5", task: "Chegar em R$30.000" },
      ]
    },
    {
      id: "fm_cliente_fora",
      name: "Primeiro Cliente Fora da Cidade",
      icon: "🗺️",
      desc: "Conseguir um cliente de outra cidade ou estado",
      checklist: [
        { id: "fm_cf_1", task: "Ter presença profissional online" },
        { id: "fm_cf_2", task: "Configurar serviços para atendimento remoto" },
        { id: "fm_cf_3", task: "Prospectar fora da cidade" },
        { id: "fm_cf_4", task: "Fechar primeiro contrato remoto" },
      ]
    },
    {
      id: "fm_1k_extras",
      name: "Primeiros R$1.000 Extras",
      icon: "💰",
      desc: "Ganhar R$1.000 em projetos avulsos além da renda recorrente",
      checklist: [
        { id: "fm_1k_1", task: "Ter renda recorrente estabelecida" },
        { id: "fm_1k_2", task: "Criar oferta de serviço avulso" },
        { id: "fm_1k_3", task: "Fechar projetos extras" },
        { id: "fm_1k_4", task: "Acumular R$1.000 em extras" },
      ]
    },
    {
      id: "fm_investimento",
      name: "Primeiros Investimentos",
      icon: "📈",
      desc: "Começar a investir com consistência, mesmo que pequeno",
      checklist: [
        { id: "fm_i_1", task: "Aprender sobre tipos de investimento" },
        { id: "fm_i_2", task: "Escolher a plataforma/corretora" },
        { id: "fm_i_3", task: "Fazer o primeiro aporte" },
        { id: "fm_i_4", task: "Criar aporte mensal fixo" },
        { id: "fm_i_5", task: "Chegar em R$5.000 investidos" },
      ]
    },
  ],

  achievements: [
    { id: "primeiro_cliente",       name: "Primeiro Cliente",            icon: "🤝", desc: "Conquistou o primeiro cliente próprio" },
    { id: "primeira_venda",         name: "Primeira Venda",              icon: "💰", desc: "Realizou a primeira venda de um serviço" },
    { id: "primeiro_projeto_pago",  name: "Primeiro Projeto Pago",       icon: "📋", desc: "Entregou e recebeu por um projeto completo" },
    { id: "primeiro_site",          name: "Primeiro Site",               icon: "🌐", desc: "Entregou o primeiro site para um cliente" },
    { id: "primeiros_500",          name: "Primeiros R$500",             icon: "💎", desc: "Alcançou R$500 de renda mensal própria" },
    { id: "primeiros_500_extras",   name: "Primeiros R$500 Extras",      icon: "✨", desc: "Ganhou R$500 em projetos extras" },
    { id: "primeiros_1000",         name: "Primeiros R$1.000",           icon: "👑", desc: "Alcançou R$1.000 de renda mensal própria" },
    { id: "primeiros_1000_extras",  name: "Primeiros R$1.000 Extras",    icon: "🔥", desc: "Ganhou R$1.000 em projetos avulsos" },
    { id: "primeiros_5k_guardados", name: "R$5.000 Guardados",           icon: "🛡️", desc: "Formou os primeiros R$5.000 de reserva" },
    { id: "primeiros_10k",          name: "R$10.000 Guardados",          icon: "🏆", desc: "Reserva de R$10.000 formada" },
    { id: "reserva_completa",       name: "Reserva Completa",            icon: "🏰", desc: "Reserva de liberdade de R$15.000 formada" },
    { id: "mes_sem_deficit",        name: "Mês sem Déficit",             icon: "📊", desc: "Primeiro mês fechado com saldo positivo" },
    { id: "ano_sem_deficit",        name: "Ano sem Entrar no Vermelho",  icon: "🌟", desc: "Um ano inteiro sem déficit — incrível" },
    { id: "tres_meses_positivos",   name: "Três Meses Positivos",        icon: "🔁", desc: "Três meses seguidos com saldo positivo" },
    { id: "cliente_fora_cidade",    name: "Cliente Fora da Cidade",      icon: "🗺️", desc: "Primeiro cliente de outra cidade" },
    { id: "cliente_de_site",        name: "Cliente de Site",             icon: "💻", desc: "Primeiro projeto de site entregue e pago" },
    { id: "cliente_de_video",       name: "Cliente de Vídeo",            icon: "🎬", desc: "Primeiro trabalho de edição de vídeo pago" },
    { id: "primeira_viagem",        name: "Primeira Viagem",             icon: "✈️", desc: "Viajou com dinheiro do próprio trabalho" },
    { id: "fase_0_completa",        name: "Base Sólida",                 icon: "🌱", desc: "Completou a Fase 0 — Estabilização" },
    { id: "fase_1_completa",        name: "Pioneira",                    icon: "⚔️", desc: "Completou a Fase 1 — Primeira Venda" },
    { id: "fase_2_completa",        name: "Recorrente",                  icon: "🔄", desc: "Completou a Fase 2 — Renda Recorrente" },
  ],

  skills: [
    {
      id: "social_media",
      name: "Social Media",
      icon: "📱",
      skills: [
        { id: "estrategia",     name: "Estratégia" },
        { id: "conteudo",       name: "Criação de Conteúdo" },
        { id: "storytelling",   name: "Storytelling" },
        { id: "instagram",      name: "Instagram" },
        { id: "posicionamento", name: "Posicionamento" },
      ]
    },
    {
      id: "videos",
      name: "Vídeos",
      icon: "🎬",
      skills: [
        { id: "edicao",     name: "Edição" },
        { id: "captacao",   name: "Captação" },
        { id: "roteiros",   name: "Roteiros" },
        { id: "reels",      name: "Reels" },
      ]
    },
    {
      id: "sites",
      name: "Sites",
      icon: "🌐",
      skills: [
        { id: "wordpress",      name: "WordPress" },
        { id: "cloud",          name: "Cloud & Hosting" },
        { id: "landing_pages",  name: "Landing Pages" },
        { id: "seo",            name: "SEO Básico" },
      ]
    },
  ],

  finances: [
    { id: "renda_mensal",       label: "Renda Mensal Própria",   icon: "💸", defaultTarget: 500 },
    { id: "dinheiro_livre",     label: "Dinheiro Livre",         icon: "🪙", defaultTarget: null },
    { id: "reserva",            label: "Reserva",                icon: "🛡️", defaultTarget: 5000 },
    { id: "fundo_aniversario",  label: "Fundo Aniversário",      icon: "🎂", defaultTarget: null },
    { id: "investimentos",      label: "Investimentos",          icon: "📈", defaultTarget: null },
    { id: "empresa",            label: "Caixa Empresa",          icon: "🏢", defaultTarget: null },
  ],

  xpLevels: [
    { level: 1,  name: "Aprendiz",     xp: 0 },
    { level: 2,  name: "Exploradora",  xp: 500 },
    { level: 3,  name: "Aventureira",  xp: 1500 },
    { level: 4,  name: "Veterana",     xp: 3500 },
    { level: 5,  name: "Especialista", xp: 6000 },
    { level: 6,  name: "Mestre",       xp: 9500 },
    { level: 7,  name: "Lenda",        xp: 14000 },
    { level: 8,  name: "Soberana",     xp: 20000 },
    { level: 9,  name: "Guardiã",      xp: 27000 },
    { level: 10, name: "Livre",        xp: 34500 },
  ],

  motivational: {
    progress: [
      "Pequenos passos também contam como progresso.",
      "Cada tarefa concluída é um tijolo na construção da sua liberdade.",
      "Você não precisa ver o topo para dar o próximo passo.",
    ],
    delay: [
      "Talvez seja hora de ajustar a estratégia, não abandonar a missão.",
      "Você não está atrasada. Está aprendendo o caminho.",
      "Se o plano não está funcionando, ajuste a rota. A missão continua.",
      "Algumas fases exigem persistência, não velocidade.",
    ],
    nearCompletion: [
      "Você está mais perto do que imagina.",
      "Continue avançando. A recompensa está no horizonte.",
      "Últimos passos. Não pare agora.",
    ],
    completed: [
      "Missão concluída. Nova área do mapa desbloqueada.",
      "Você provou para si mesma que consegue.",
      "Seu eu do futuro acabou de agradecer.",
    ],
    daily: [
      "Cada dia de esforço é XP acumulado.",
      "Você está construindo algo que ninguém pode tirar de você.",
      "A liberdade que você busca está sendo construída agora, neste momento.",
      "Progresso é progresso, independente do tamanho.",
      "Confie no processo. A jornada é o destino.",
      "Você já foi mais longe do que onde começou.",
      "Cada cliente conquistado é uma prova do seu valor.",
      "A consistência vence o talento quando o talento não é consistente.",
      "Construa devagar. Construa bem. Construa para durar.",
      "O foco não é a velocidade. É a direção.",
    ],
  },

  totalXP: 24500,
};

/* ===== DEFAULT STATE ===== */

function buildDefaultState() {
  const missions = {};
  GAME_DATA.phases.forEach(p => {
    p.missions.forEach(m => {
      missions[m.id] = { completed: false, completedDate: null };
    });
  });

  const achievements = {};
  GAME_DATA.achievements.forEach(a => {
    achievements[a.id] = { unlocked: false, unlockedDate: null };
  });

  const skills = {};
  GAME_DATA.skills.forEach(branch => {
    skills[branch.id] = {};
    branch.skills.forEach(s => { skills[branch.id][s.id] = 0; });
  });

  const finances = {};
  GAME_DATA.finances.forEach(f => {
    finances[f.id] = { amount: 0, target: f.defaultTarget, notes: "" };
  });

  const phases = {};
  GAME_DATA.phases.forEach(p => {
    phases[p.id] = {
      status: "available",
      startDate: p.id === 0 ? new Date().toISOString().split('T')[0] : null,
      targetDate: null,
      completionDate: null,
    };
  });

  const frozenProgress = {};
  GAME_DATA.frozenMissions.forEach(fm => {
    frozenProgress[fm.id] = {};
    fm.checklist.forEach(c => { frozenProgress[fm.id][c.id] = false; });
  });

  return {
    phases,
    missions,
    achievements,
    skills,
    finances,
    frozenProgress,
    activeMission: { main: "0_1", secondary: null },
    xp: 0,
    createdAt: new Date().toISOString(),
  };
}
