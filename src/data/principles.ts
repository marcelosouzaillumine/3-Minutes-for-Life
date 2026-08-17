export interface Principle {
  id: number;
  category: string;
  title: string;
  principle: string;
  reflection: string;
  application: string;
  prayer?: string;
  audio?: {
    url: string;
    duration?: string;
  };
  reference?: {
    citation: string;
    translation?: string;
    text?: string;
  };
  status?: 'published' | 'draft';
}

const allPrinciples: Principle[] = [
  // Vida
  {
    id: 1,
    status: 'published',
    category: 'Vida',
    title: 'Você está dando atenção ao que importa?',
    principle: 'Aquilo que recebe sua atenção ganha espaço na sua vida.',
    reflection: 'Todos os dias, muitas coisas disputam nossa atenção. Mensagens, notícias, redes sociais, trabalho, problemas e preocupações. Sem nos darmos conta, podemos passar tanto tempo olhando para tudo isso que deixamos de perceber o que realmente importa.\n\nE como não conseguimos dar atenção a tudo, nossas escolhas fazem diferença. O que recebe nosso olhar com frequência influencia a maneira como vivemos.\n\nPor isso, vale a pena parar e perguntar: o que tem ocupado a minha atenção?\n\nNo meio de tantas demandas, Jesus nos chama a olhar para Deus e confiar nele. Quando fazemos isso, lembramos que nossa vida não depende de tudo o que acontece à nossa volta. Ela está segura em suas mãos.\n\nHoje, antes de seguir de uma tarefa para outra, pare por alguns minutos. Respire, fique em silêncio e perceba o que tem ocupado seus pensamentos.',
    application: 'Escolha um momento do dia para ficar alguns minutos longe do celular e de outras distrações.\n\nFique em silêncio, agradeça pela vida e entregue a Deus aquilo que tem ocupado sua mente. Depois, pergunte a si mesmo: o que realmente merece minha atenção hoje?'
  },
  {
    id: 2,
    status: 'published',
    category: 'Vida',
    title: 'Você está brigando com a realidade?',
    principle: 'A mudança começa quando reconhecemos a realidade como ela é.',
    reflection: 'Todos nós já gastamos energia desejando que uma situação fosse diferente. Pensamos no que poderia ter acontecido, no que alguém deveria ter feito ou em como gostaríamos que as coisas fossem. Enquanto isso, a realidade continua diante de nós, esperando que façamos alguma coisa com ela.\n\nAceitar a realidade não significa gostar dela. Também não significa concordar com tudo ou desistir de mudar o que precisa ser mudado. Significa reconhecer onde estamos para então perceber o que podemos fazer a partir daí. É difícil mudar uma situação que ainda não estamos dispostos a enxergar.\n\nHá coisas que simplesmente não estão sob nosso controle. Quando chegamos a esse limite, a fé nos lembra que não precisamos controlar tudo para seguir em frente. Podemos entregar a Deus aquilo que não conseguimos mudar e cuidar do que está ao nosso alcance.\n\nEntão, em vez de ficar preso à pergunta “por que isso aconteceu?”, pare e pergunte: “o que posso fazer a partir daqui?”',
    application: 'Pense em uma situação que tem trazido frustração. Separe aquilo que você pode mudar do que não está sob seu controle.\n\nEscolha uma coisa que está ao seu alcance e dê hoje um pequeno passo.'
  },
  {
    id: 3,
    status: 'published',
    category: 'Vida',
    title: 'O conforto está tornando você mais frágil?',
    principle: 'Evitar todo desconforto pode nos tornar menos preparados para a vida.',
    reflection: 'Nossa cultura nos ensina a buscar conforto o tempo todo. Quando podemos escolher, preferimos evitar o esforço, a espera e a frustração. Muitas vezes, escolhemos o caminho mais fácil simplesmente porque não queremos lidar com aquilo que nos incomoda.\n\nO problema começa quando essa busca por conforto passa a orientar todas as nossas escolhas. Se evitamos sempre o que é difícil, podemos perder a disposição e a capacidade de enfrentar aquilo que a vida coloca diante de nós. Uma dificuldade que antes parecia pequena pode ganhar um tamanho muito maior dentro da nossa cabeça.\n\nPor isso, nem toda dificuldade precisa ser evitada. A fé cristã nos ensina que algumas experiências difíceis fazem parte do nosso crescimento. Há momentos em que Deus não nos livra imediatamente do caminho difícil. Ele permanece conosco e nos sustenta enquanto o atravessamos.\n\nCrescer também é aprender a permanecer quando seria mais fácil fugir.',
    application: 'Escolha voluntariamente um pequeno desconforto para enfrentar hoje.\n\nPode ser caminhar em vez de usar o carro, ficar alguns minutos longe do celular ou iniciar aquela conversa difícil que você tem adiado.\n\nQuando sentir vontade de desistir, lembre-se: nem todo desconforto é um problema. Alguns deles nos ajudam a perceber que somos capazes de suportar mais do que imaginávamos.',
    reference: {
      citation: 'Romanos 5:3-4'
    }
  },
  {
    id: 4,
    status: 'published',
    category: 'Vida',
    title: 'Você sabe o que é suficiente para ser feliz?',
    principle: 'O contentamento não é ter tudo o que se deseja, mas aprender a reconhecer o que já é suficiente.',
    reflection: 'Nossa cultura nos ensina a olhar constantemente para aquilo que nos falta. Somos cercados pela ideia de que a próxima conquista, a próxima compra ou o próximo passo finalmente nos trará a satisfação que procuramos.\n\nO problema é que, quando alcançamos aquilo que desejávamos, quase sempre surge algo novo para buscar. A conquista de hoje rapidamente se transforma no desejo de amanhã. E, se a nossa paz depender de conseguir sempre mais, nunca haverá um momento em que teremos o suficiente.\n\nÉ por isso que o contentamento precisa ser aprendido. A fé cristã nos mostra esse caminho. Paulo escreveu que aprendeu a viver contente tanto na fartura quanto na necessidade. Sua paz não estava determinada pelo que possuía ou pela situação que enfrentava, mas pela confiança que havia colocado em Deus.\n\nTalvez o contentamento comece exatamente aí: quando deixamos de medir nossa vida apenas pelo que ainda falta e passamos a perceber, com gratidão, o valor daquilo que já recebemos.',
    application: 'Pense em três coisas simples e comuns que fazem parte da sua vida hoje.\n\nPode ser uma refeição, um lugar para morar, alguém que você ama, seu trabalho, uma conversa ou até algo que normalmente passa despercebido.\n\nPare por um minuto e agradeça a Deus por cada uma delas.',
    prayer: 'Deus, ajuda-me a reconhecer o que já tenho e a não viver preso ao que ainda me falta. Ensina-me a encontrar contentamento nas coisas simples e a receber com gratidão aquilo que colocaste em minhas mãos. Amém.',
    reference: {
      citation: 'Filipenses 4:11–12'
    }
  },
  
  // Relacionamentos
  {
    id: 5,
    status: 'draft',
    category: 'Relacionamentos',
    title: 'Julgue pela intenção, responda ao impacto',
    principle: 'Entenda que as pessoas raramente agem com malícia, mas os erros delas ainda causam dor.',
    reflection: 'Muitos conflitos surgem porque confundimos impacto com intenção. Presumir a melhor intenção do outro evita que você se torne cínico; reconhecer o impacto doloroso das ações evita que você se torne passivo ou permissivo.',
    application: 'Se alguém o irritar hoje, faça a separação: "A intenção não foi me machucar, mas a atitude teve esse efeito". Comunique-se a partir do impacto, não acusando intenções.'
  },
  {
    id: 6,
    status: 'draft',
    category: 'Relacionamentos',
    title: 'Escuta não é espera',
    principle: 'A maioria de nós não escuta para entender, mas apenas espera a nossa vez de falar.',
    reflection: 'A verdadeira escuta requer o silenciamento não apenas da voz, mas também da mente. Quando você está formulando sua resposta enquanto o outro fala, você deixou de ouvir. A presença atenta é uma das formas mais raras de respeito que podemos oferecer.',
    application: 'Na sua próxima conversa, tente deixar um silêncio de 2 segundos após a pessoa terminar de falar antes de você começar a sua resposta.'
  },
  {
    id: 7,
    status: 'draft',
    category: 'Relacionamentos',
    title: 'O custo das expectativas não ditas',
    principle: 'Frustração em relacionamentos é, quase sempre, o resultado de expectativas não comunicadas.',
    reflection: 'Esperamos que nossos parceiros, amigos ou colegas "adivinhem" o que precisamos, como se a intuição fosse a prova do afeto. A clareza é bondosa. Ninguém tem o dever de ler sua mente.',
    application: 'Perceba se você está secretamente ressentido por alguém não ter feito algo. Pergunte-se: "Eu comuniquei esse desejo claramente?". Se não, faça o pedido hoje.'
  },
  {
    id: 8,
    status: 'draft',
    category: 'Relacionamentos',
    title: 'Limites preservam o amor',
    principle: 'Estabelecer limites não afasta as pessoas; mostra a elas como podem permanecer perto.',
    reflection: 'Dizer "sim" quando se quer dizer "não" gera ressentimento, que é o veneno silencioso das relações. Limites claros são o manual de instruções que você oferece aos outros para que possam se relacionar com você de maneira saudável.',
    application: 'Diga "não" de forma educada e firme a um pedido que viole seu tempo ou energia hoje. Não forneça justificativas elaboradas, apenas seja claro.'
  },

  // Decisões
  {
    id: 9,
    status: 'draft',
    category: 'Decisões',
    title: 'A inversão',
    principle: 'Quando não souber como alcançar um objetivo, pergunte-se como garantir o fracasso, e então evite isso.',
    reflection: 'Muitas vezes é mais fácil identificar o que não fazer do que o que fazer. A estupidez sistematicamente evitada é, na prática, indistinguível do brilhantismo. Reduzir erros óbvios traz mais resultados do que buscar acertos geniais.',
    application: 'Pense num objetivo atual. Liste três ações que com certeza garantiriam que você falhasse. Comprometa-se a evitar essas três coisas rigorosamente.'
  },
  {
    id: 10,
    status: 'draft',
    category: 'Decisões',
    title: 'O filtro do "Inferno, sim!"',
    principle: 'Se a resposta não é "Com certeza sim", então deveria ser "Não".',
    reflection: 'Nossa tendência é aceitar oportunidades medianas por medo de perdê-las. O problema é que o bom é inimigo do ótimo. Quando você diz sim para coisas razoáveis, não terá espaço quando a oportunidade excepcional aparecer.',
    application: 'Ao avaliar o próximo convite, projeto ou oportunidade, use essa regra. Se você não sentir entusiasmo imediato, decline.'
  },
  {
    id: 11,
    status: 'draft',
    category: 'Decisões',
    title: 'Informação não é ação',
    principle: 'Pesquisar mais, às vezes, é apenas uma forma disfarçada de procrastinação.',
    reflection: 'É reconfortante ler outro artigo ou assistir a outro vídeo antes de começar. Isso nos dá a ilusão de progresso. Porém, chega um momento em que o custo de adquirir mais informação supera o benefício de agir com as informações que já temos.',
    application: 'Escolha uma decisão que você tem adiado para "pesquisar mais". Estabeleça que você vai tomá-la hoje, apenas com o que sabe agora.'
  },
  {
    id: 12,
    status: 'draft',
    category: 'Decisões',
    title: 'Minimização de arrependimentos',
    principle: 'Projete-se aos 80 anos de idade e escolha o caminho que causará menos arrependimento.',
    reflection: 'No dia a dia, nos preocupamos com o que pode dar errado no curto prazo — o julgamento alheio, a perda de um conforto. No longo prazo, nossos maiores arrependimentos raramente são sobre o que tentamos e falhamos, mas sobre aquilo que nem sequer tentamos.',
    application: 'Diante de um dilema intimidador, faça o exercício de se imaginar no fim da vida olhando para trás. Qual decisão você se orgulharia de ter tomado?'
  },

  // Trabalho
  {
    id: 13,
    status: 'draft',
    category: 'Trabalho',
    title: 'Trabalho raso vs. Trabalho profundo',
    principle: 'Ocupar-se com tarefas rasas é a maneira mais fácil de parecer produtivo enquanto não se produz nada de valor.',
    reflection: 'Responder e-mails, ir a reuniões não essenciais e organizar pastas são tarefas logísticas. Elas impedem o caos, mas não criam valor real. O verdadeiro diferencial profissional hoje é a capacidade de focar profundamente e resolver problemas complexos.',
    application: 'Bloqueie 90 minutos ininterruptos hoje no seu calendário para realizar a tarefa mais difícil e importante da sua semana. Feche todo o resto.'
  },
  {
    id: 14,
    status: 'draft',
    category: 'Trabalho',
    title: 'Seja um artesão',
    principle: 'Trate o seu trabalho diário com a reverência de quem está construindo um legado, não batendo o ponto.',
    reflection: 'Quando o foco está apenas no resultado financeiro, o trabalho se torna um peso. Quando adotamos a mentalidade do artesão, focando em fazer a tarefa com excelência pelo simples mérito de fazê-la bem, o trabalho ganha dignidade própria.',
    application: 'Escolha uma tarefa mundana no seu trabalho de hoje. Faça-a com uma atenção aos detalhes e um rigor que ninguém além de você perceberia.'
  },
  {
    id: 15,
    status: 'draft',
    category: 'Trabalho',
    title: 'Sistemas são melhores que metas',
    principle: 'Você não se eleva ao nível das suas metas, você cai ao nível dos seus sistemas.',
    reflection: 'Metas dizem a você onde você quer chegar; sistemas garantem que você esteja caminhando. Um objetivo grande sem um sistema sólido diário é apenas um desejo. A verdadeira mudança acontece nos processos invisíveis que repetimos.',
    application: 'Em vez de focar na sua grande meta hoje, revise o seu processo. O que você fará repetidamente às 9h da manhã todos os dias para garantir o avanço?'
  },
  {
    id: 16,
    status: 'draft',
    category: 'Trabalho',
    title: 'O custo da interrupção',
    principle: 'A cada vez que você interrompe o foco, demora até vinte minutos para que seu cérebro retorne ao estado original.',
    reflection: 'O custo de checar uma notificação "rapidinho" não é o tempo gasto olhando a tela; é a quebra do fluxo mental. A alternância constante de contexto exaure a mente e fragmenta a capacidade de pensar de forma conectada.',
    application: 'Trabalhe hoje com o celular em outro cômodo ou fora da sua linha de visão direta. Desative todas as notificações não essenciais do seu computador.'
  },

  // Dinheiro
  {
    id: 17,
    status: 'draft',
    category: 'Dinheiro',
    title: 'A diferença entre ser rico e ter riqueza',
    principle: 'A riqueza é o dinheiro que você não gasta.',
    reflection: 'Vemos a riqueza no carro que as pessoas dirigem ou nas roupas que vestem. Mas isso demonstra apenas que elas gastaram dinheiro naquelas coisas. A verdadeira riqueza é o que não é visto: a opção, a flexibilidade e o tempo que o dinheiro guardado proporciona.',
    application: 'Aja de forma contraintuitiva hoje: sinta orgulho por algo que você decidiu NÃO comprar.'
  },
  {
    id: 18,
    status: 'draft',
    category: 'Dinheiro',
    title: 'A inflação do estilo de vida',
    principle: 'Se os seus desejos sobem na mesma velocidade que os seus ganhos, você estará para sempre no mesmo lugar.',
    reflection: 'É o ciclo clássico: ganhamos um aumento e, subitamente, nossas "necessidades" se expandem para absorver o novo valor. A margem de manobra financeira só existe se mantivermos uma diferença consciente entre o que ganhamos e o que gastamos.',
    application: 'Revise suas despesas mensais recorrentes. Identifique um serviço ou hábito que você incorporou nos últimos dois anos e que agora pode ser cortado sem perda real.'
  },
  {
    id: 19,
    status: 'draft',
    category: 'Dinheiro',
    title: 'Tempo é a moeda final',
    principle: 'Dinheiro é uma ferramenta para comprar de volta o controle sobre o seu próprio tempo.',
    reflection: 'Quando compramos algo, não pagamos com dinheiro; pagamos com as horas de vida que investimos para ganhar aquele dinheiro. Se o seu trabalho te dá muito dinheiro, mas não te deixa tempo algum, a ferramenta perdeu o seu propósito primário.',
    application: 'Antes de fazer uma compra não essencial hoje, calcule quantas horas de trabalho ela custa. Pergunte-se se o objeto vale essas horas da sua vida.'
  },

  // Liderança
  {
    id: 20,
    status: 'draft',
    category: 'Liderança',
    title: 'A responsabilidade extrema',
    principle: 'Um líder não terceiriza a culpa.',
    reflection: 'O momento em que um líder aponta o dedo para sua equipe, para o mercado ou para a sorte, é o momento em que ele perde o direito de liderar. A verdadeira liderança assume o fardo quando as coisas dão errado, e distribui os créditos quando elas dão certo.',
    application: 'Se algo falhar na sua responsabilidade hoje, resista à vontade de justificar. Diga: "Isso é minha responsabilidade e eu vou consertar".'
  },
  {
    id: 21,
    status: 'draft',
    category: 'Liderança',
    title: 'Lidere pelo exemplo, não pela ordem',
    principle: 'As pessoas observam o que você faz muito mais do que ouvem o que você diz.',
    reflection: 'Exigir pontualidade e chegar atrasado, exigir excelência e entregar o medíocre, pedir calma e se descontrolar. Nada corrói a autoridade mais rápido do que a hipocrisia. Seu comportamento é o padrão cultural que você impõe.',
    application: 'Pergunte-se: "Se toda a minha equipe fizesse o seu trabalho exatamente com a mesma dedicação e atitude que estou tendo agora, onde estaríamos?".'
  },
  {
    id: 22,
    status: 'draft',
    category: 'Liderança',
    title: 'Elogie em público, critique em particular',
    principle: 'O feedback deve construir a pessoa, não destruí-la diante do grupo.',
    reflection: 'Correções públicas costumam gerar postura defensiva e humilhação, não aprendizado. Liderança eficaz exige proteger a dignidade do liderado. O objetivo do feedback duro é mudar o comportamento e não demonstrar poder.',
    application: 'Se precisar corrigir o trabalho de alguém, chame-o para uma conversa individual e foque na ação, não no caráter da pessoa.'
  },

  // Propósito
  {
    id: 23,
    status: 'draft',
    category: 'Propósito',
    title: 'Propósito é ação, não epifania',
    principle: 'Não espere que o propósito caia do céu; ele é forjado no fazer diário.',
    reflection: 'Tratamos o propósito como se fosse um tesouro escondido que devemos encontrar antes de começar a agir. Na realidade, o significado emerge da responsabilidade que assumimos e das coisas pelas quais escolhemos trabalhar duro e sofrer.',
    application: 'Pare de buscar a "grande missão". Escolha um problema útil na sua frente agora e resolva-o com empenho.'
  },
  {
    id: 24,
    status: 'draft',
    category: 'Propósito',
    title: 'Identidade maleável',
    principle: 'Cuidado para não se apegar demais a uma versão de si mesmo.',
    reflection: 'Muitas vezes ficamos presos a caminhos infelizes porque já investimos muito tempo naquilo ou porque é assim que as pessoas nos veem. O compromisso cego com a própria identidade passada impede o crescimento. Permita-se mudar de ideia.',
    application: 'Identifique algo que você continua fazendo apenas por hábito ou pela imagem que quer projetar, e não mais por sentido. Considere abandonar isso.'
  },
  {
    id: 25,
    status: 'draft',
    category: 'Propósito',
    title: 'O sacrifício necessário',
    principle: 'Tudo tem um custo; o que define sua vida é qual sofrimento você escolhe suportar.',
    reflection: 'Todos querem a recompensa — o corpo saudável, a carreira de sucesso, o bom relacionamento —, mas poucos querem o sacrifício atrelado. O propósito não é perguntar "o que eu quero da vida?", mas "qual dor eu estou disposto a sustentar?".',
    application: 'Em vez de desejar um grande objetivo hoje, defina com clareza os sacrifícios que ele exige. Se você não estiver disposto a fazê-los, reajuste o objetivo.'
  },

  // Fé
  {
    id: 26,
    status: 'draft',
    category: 'Fé',
    title: 'A clareza no silêncio',
    principle: 'Você não ouvirá o essencial enquanto não calar o barulho ao seu redor.',
    reflection: 'A cultura moderna despreza o silêncio e o preenche imediatamente com ruído. Mas as verdades mais profundas do coração humano e do divino nunca são gritadas; elas são percebidas na quietude. Onde há ausência de silêncio, há ausência de clareza.',
    application: 'Encontre 10 minutos hoje para sentar no absoluto silêncio. Sem telas, sem música, sem leitura. Apenas exista e ouça.',
    reference: { citation: 'Salmos 46:10' }
  },
  {
    id: 27,
    status: 'draft',
    category: 'Fé',
    title: 'Confiança através da ação',
    principle: 'A verdadeira fé não é passiva; é o movimento na direção do que não se vê.',
    reflection: 'Muitos confundem fé com uma mera crença intelectual ou com ficar esperando que as coisas melhorem sozinhas. A fé madura é aquela que confia na providência, mas age de acordo com a responsabilidade que tem nas mãos. É agir amparado na esperança.',
    application: 'Existe alguma área da vida onde você está apenas "esperando" em vez de assumir sua responsabilidade? Dê hoje o primeiro passo que cabe a você.',
    reference: { citation: 'Tiago 2:17' }
  },
  {
    id: 28,
    status: 'draft',
    category: 'Fé',
    title: 'Humildade existencial',
    principle: 'Reconheça a vastidão do universo e as limitações do seu próprio entendimento.',
    reflection: 'A ansiedade moderna vem, em parte, da ilusão de que precisamos entender e controlar o mundo inteiro. Há paz profunda na constatação de que não somos o centro do universo. Entregar o que não podemos controlar é o ápice da maturidade.',
    application: 'Diante de um problema insolúvel hoje, pratique soltar o controle internamente. Diga: "Fiz o que pude, o resto não me pertence".'
  },
  {
    id: 29,
    status: 'draft',
    category: 'Fé',
    title: 'A reverência pelo ordinário',
    principle: 'O sagrado muitas vezes se esconde nas repetições cotidianas que consideramos banais.',
    reflection: 'Esperamos a epifania em grandes eventos e grandes conquistas, mas a maior parte da vida é feita de lavar louça, cuidar dos filhos e trabalhar. Encontrar dignidade, graça e sentido no serviço oculto transforma qualquer tarefa em uma prática espiritual.',
    application: 'Escolha uma tarefa doméstica rotineira hoje e execute-a com cuidado e lentidão absolutos, como se fosse um ato de honra.'
  },
  {
    id: 30,
    status: 'draft',
    category: 'Fé',
    title: 'O sofrimento tem contornos',
    principle: 'A dor não tem a palavra final na narrativa da sua vida.',
    reflection: 'No meio do sofrimento, a ilusão é a de que ele durará para sempre e define tudo. Mas, na perspectiva mais longa, as crises são capítulos, não o livro inteiro. A fé é a âncora que diz que há significado mesmo na desordem.',
    application: 'Quando a angústia surgir hoje, lembre-se das outras vezes que você pensou que não suportaria, e ainda assim, você continuou. A tempestade também passa.'
  }
];

export const principles = allPrinciples.filter(p => p.status === 'published' || (!p.status && p.id <= 4));
