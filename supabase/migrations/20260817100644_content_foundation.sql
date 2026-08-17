
-- Create themes table
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create devotionals table
CREATE TABLE public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id INTEGER UNIQUE, -- To map to old principles for migration 009
  publication_date DATE NOT NULL,
  title TEXT NOT NULL,
  scripture_reference TEXT,
  scripture_text TEXT,
  reflection TEXT NOT NULL,
  practical_application TEXT NOT NULL,
  theme_id UUID REFERENCES public.themes(id),
  category_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view themes" ON public.themes FOR SELECT USING (true);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view published devotionals" ON public.devotionals FOR SELECT USING (status = 'published');

-- Allow admins to view drafts (if we add admin roles later, for now we keep it simple or allow anon to see published only)

-- Trigger for updated_at
CREATE TRIGGER on_devotionals_updated
  BEFORE UPDATE ON public.devotionals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed Categories
INSERT INTO public.categories (id, name) VALUES 
  ('c0b1c6e5-d777-4ab8-b03b-091868027912', 'Vida'),
  ('a80a12a4-ad21-4897-9cf9-ff370d7dda37', 'Relacionamentos'),
  ('0715df67-cc22-458f-9193-003a98f34fb3', 'Decisões'),
  ('5d5e182f-14ee-4028-94a0-a6c0d41f8b2f', 'Trabalho'),
  ('f401724b-7b19-409c-952f-030dae6e457d', 'Dinheiro'),
  ('91855dc1-cc0b-48fd-a4ab-c4510ebfdbda', 'Liderança'),
  ('13f03be9-0e27-4a55-aaa6-4a4f4c7257bf', 'Propósito'),
  ('14a3232e-186d-42ba-a371-0f79a0088d4c', 'Fé');

-- Seed Devotionals
INSERT INTO public.devotionals (legacy_id, publication_date, title, reflection, practical_application, category_id, status, scripture_reference, scripture_text) VALUES 
  (1, '2026-08-01', 'Você está dando atenção ao que importa?', E'Aquilo que recebe sua atenção ganha espaço na sua vida.\n\nTodos os dias, muitas coisas disputam nossa atenção. Mensagens, notícias, redes sociais, trabalho, problemas e preocupações. Sem perceber, podemos passar tanto tempo olhando para o que exige nossa atenção que deixamos de perceber aquilo que realmente importa.

Nossa atenção é limitada. Por isso, aquilo que escolhemos contemplar, ouvir e alimentar dentro de nós começa a moldar a maneira como pensamos, sentimos e vivemos.

Jesus nos convida a olhar a vida de outra maneira. Em vez de sermos conduzidos apenas pelo que acontece ao nosso redor, podemos aprender a voltar nossa atenção para Deus e confiar que nossa vida está segura em suas mãos.

Talvez hoje você precise apenas parar por alguns minutos e perceber: para onde sua atenção tem levado você?', E'Escolha um momento do dia para ficar alguns minutos longe do celular e de outras distrações.

Fique em silêncio, agradeça pela vida e pense no que realmente merece sua atenção hoje.', 'c0b1c6e5-d777-4ab8-b03b-091868027912', 'published', NULL, NULL),
  (2, '2026-08-02', 'Você está brigando com a realidade?', E'A mudança começa quando reconhecemos a realidade como ela é.\n\nTodos nós já gastamos energia desejando que uma situação fosse diferente. Ficamos pensando no que poderia ter acontecido, no que alguém deveria ter feito ou em como gostaríamos que as coisas fossem. Enquanto isso, a realidade continua diante de nós, esperando que façamos alguma coisa com ela.

Aceitar a realidade não significa gostar dela, concordar com ela ou desistir de mudá-la. Significa reconhecer onde estamos para descobrir o que podemos fazer a partir daí. É difícil mudar uma situação que ainda não estamos dispostos a enxergar.

E há coisas que simplesmente não estão sob nosso controle. É nesse limite que a fé pode nos ensinar um novo caminho. A fé cristã nos lembra que não precisamos controlar tudo para seguir em frente. Podemos entregar a Deus aquilo que não conseguimos mudar e voltar nossa atenção para aquilo que está ao nosso alcance.

Por isso, talvez a pergunta de hoje não seja “por que isso aconteceu?”, mas “o que posso fazer a partir daqui?”', E'Pense em uma situação que tem trazido frustração. Separe o que você pode mudar daquilo que não está sob seu controle.

Escolha uma coisa que está ao seu alcance e dê hoje um pequeno passo.', 'c0b1c6e5-d777-4ab8-b03b-091868027912', 'published', NULL, NULL),
  (3, '2026-08-03', 'O conforto está tornando você mais frágil?', E'Evitar todo desconforto pode nos tornar menos preparados para a vida.\n\nNossa cultura nos ensina a buscar conforto o tempo todo. Queremos evitar o esforço, a espera, a frustração e tudo aquilo que nos tira da nossa zona de conforto. Afinal, é natural preferirmos o caminho mais fácil.

Mas existe um problema quando fazemos do conforto uma regra para a vida. Ao evitar constantemente o desconforto físico ou emocional, podemos perder a capacidade de lidar com aquilo que nos desafia. Aos poucos, uma dificuldade que antes parecia pequena pode se tornar grande demais aos nossos olhos.

Nem toda dificuldade, porém, precisa ser evitada. A fé cristã nos ensina que algumas experiências difíceis podem produzir perseverança, fortalecer nosso caráter e nos fazer crescer. Há momentos em que Deus não nos livra imediatamente do caminho difícil, mas nos sustenta enquanto o atravessamos.

Talvez crescer não seja encontrar uma vida sem dificuldades, mas descobrir que somos capazes de atravessar algumas delas sem fugir.', E'Escolha voluntariamente um pequeno desconforto para enfrentar hoje.

Pode ser caminhar em vez de usar o carro, ficar alguns minutos longe do celular ou iniciar aquela conversa difícil que você tem adiado.

Quando sentir vontade de desistir, lembre-se: nem todo desconforto é um problema. Às vezes, ele é parte do caminho que nos torna mais fortes.', 'c0b1c6e5-d777-4ab8-b03b-091868027912', 'published', 'Romanos 5:3-4', NULL),
  (4, '2026-08-04', 'Você sabe o que é suficiente para ser feliz?', E'O contentamento não é ter tudo o que se deseja, mas aprender a reconhecer o que já é suficiente.\n\nNossa cultura nos ensina a olhar constantemente para aquilo que nos falta. Somos cercados pela ideia de que a próxima conquista, a próxima compra ou o próximo passo finalmente nos trará a satisfação que procuramos.

O problema é que, quando alcançamos aquilo que desejávamos, quase sempre surge algo novo para buscar. A conquista de hoje rapidamente se transforma no desejo de amanhã. E, se a nossa paz depender de conseguir sempre mais, nunca haverá um momento em que teremos o suficiente.

É por isso que o contentamento precisa ser aprendido. A fé cristã nos mostra esse caminho. Paulo escreveu que aprendeu a viver contente tanto na fartura quanto na necessidade. Sua paz não estava determinada pelo que possuía ou pela situação que enfrentava, mas pela confiança que havia colocado em Deus.

Talvez o contentamento comece exatamente aí: quando deixamos de medir nossa vida apenas pelo que ainda falta e passamos a perceber, com gratidão, o valor daquilo que já recebemos.', E'Pense em três coisas simples e comuns que fazem parte da sua vida hoje.

Pode ser uma refeição, um lugar para morar, alguém que você ama, seu trabalho, uma conversa ou até algo que normalmente passa despercebido.

Pare por um minuto e agradeça a Deus por cada uma delas.', 'c0b1c6e5-d777-4ab8-b03b-091868027912', 'published', 'Filipenses 4:11–12', NULL),
  (5, '2026-08-05', 'Julgue pela intenção, responda ao impacto', E'Entenda que as pessoas raramente agem com malícia, mas os erros delas ainda causam dor.\n\nMuitos conflitos surgem porque confundimos impacto com intenção. Presumir a melhor intenção do outro evita que você se torne cínico; reconhecer o impacto doloroso das ações evita que você se torne passivo ou permissivo.', E'Se alguém o irritar hoje, faça a separação: "A intenção não foi me machucar, mas a atitude teve esse efeito". Comunique-se a partir do impacto, não acusando intenções.', 'a80a12a4-ad21-4897-9cf9-ff370d7dda37', 'draft', NULL, NULL),
  (6, '2026-08-06', 'Escuta não é espera', E'A maioria de nós não escuta para entender, mas apenas espera a nossa vez de falar.\n\nA verdadeira escuta requer o silenciamento não apenas da voz, mas também da mente. Quando você está formulando sua resposta enquanto o outro fala, você deixou de ouvir. A presença atenta é uma das formas mais raras de respeito que podemos oferecer.', E'Na sua próxima conversa, tente deixar um silêncio de 2 segundos após a pessoa terminar de falar antes de você começar a sua resposta.', 'a80a12a4-ad21-4897-9cf9-ff370d7dda37', 'draft', NULL, NULL),
  (7, '2026-08-07', 'O custo das expectativas não ditas', E'Frustração em relacionamentos é, quase sempre, o resultado de expectativas não comunicadas.\n\nEsperamos que nossos parceiros, amigos ou colegas "adivinhem" o que precisamos, como se a intuição fosse a prova do afeto. A clareza é bondosa. Ninguém tem o dever de ler sua mente.', E'Perceba se você está secretamente ressentido por alguém não ter feito algo. Pergunte-se: "Eu comuniquei esse desejo claramente?". Se não, faça o pedido hoje.', 'a80a12a4-ad21-4897-9cf9-ff370d7dda37', 'draft', NULL, NULL),
  (8, '2026-08-08', 'Limites preservam o amor', E'Estabelecer limites não afasta as pessoas; mostra a elas como podem permanecer perto.\n\nDizer "sim" quando se quer dizer "não" gera ressentimento, que é o veneno silencioso das relações. Limites claros são o manual de instruções que você oferece aos outros para que possam se relacionar com você de maneira saudável.', E'Diga "não" de forma educada e firme a um pedido que viole seu tempo ou energia hoje. Não forneça justificativas elaboradas, apenas seja claro.', 'a80a12a4-ad21-4897-9cf9-ff370d7dda37', 'draft', NULL, NULL),
  (9, '2026-08-09', 'A inversão', E'Quando não souber como alcançar um objetivo, pergunte-se como garantir o fracasso, e então evite isso.\n\nMuitas vezes é mais fácil identificar o que não fazer do que o que fazer. A estupidez sistematicamente evitada é, na prática, indistinguível do brilhantismo. Reduzir erros óbvios traz mais resultados do que buscar acertos geniais.', E'Pense num objetivo atual. Liste três ações que com certeza garantiriam que você falhasse. Comprometa-se a evitar essas três coisas rigorosamente.', '0715df67-cc22-458f-9193-003a98f34fb3', 'draft', NULL, NULL),
  (10, '2026-08-10', 'O filtro do "Inferno, sim!"', E'Se a resposta não é "Com certeza sim", então deveria ser "Não".\n\nNossa tendência é aceitar oportunidades medianas por medo de perdê-las. O problema é que o bom é inimigo do ótimo. Quando você diz sim para coisas razoáveis, não terá espaço quando a oportunidade excepcional aparecer.', E'Ao avaliar o próximo convite, projeto ou oportunidade, use essa regra. Se você não sentir entusiasmo imediato, decline.', '0715df67-cc22-458f-9193-003a98f34fb3', 'draft', NULL, NULL),
  (11, '2026-08-11', 'Informação não é ação', E'Pesquisar mais, às vezes, é apenas uma forma disfarçada de procrastinação.\n\nÉ reconfortante ler outro artigo ou assistir a outro vídeo antes de começar. Isso nos dá a ilusão de progresso. Porém, chega um momento em que o custo de adquirir mais informação supera o benefício de agir com as informações que já temos.', E'Escolha uma decisão que você tem adiado para "pesquisar mais". Estabeleça que você vai tomá-la hoje, apenas com o que sabe agora.', '0715df67-cc22-458f-9193-003a98f34fb3', 'draft', NULL, NULL),
  (12, '2026-08-12', 'Minimização de arrependimentos', E'Projete-se aos 80 anos de idade e escolha o caminho que causará menos arrependimento.\n\nNo dia a dia, nos preocupamos com o que pode dar errado no curto prazo — o julgamento alheio, a perda de um conforto. No longo prazo, nossos maiores arrependimentos raramente são sobre o que tentamos e falhamos, mas sobre aquilo que nem sequer tentamos.', E'Diante de um dilema intimidador, faça o exercício de se imaginar no fim da vida olhando para trás. Qual decisão você se orgulharia de ter tomado?', '0715df67-cc22-458f-9193-003a98f34fb3', 'draft', NULL, NULL),
  (13, '2026-08-13', 'Trabalho raso vs. Trabalho profundo', E'Ocupar-se com tarefas rasas é a maneira mais fácil de parecer produtivo enquanto não se produz nada de valor.\n\nResponder e-mails, ir a reuniões não essenciais e organizar pastas são tarefas logísticas. Elas impedem o caos, mas não criam valor real. O verdadeiro diferencial profissional hoje é a capacidade de focar profundamente e resolver problemas complexos.', E'Bloqueie 90 minutos ininterruptos hoje no seu calendário para realizar a tarefa mais difícil e importante da sua semana. Feche todo o resto.', '5d5e182f-14ee-4028-94a0-a6c0d41f8b2f', 'draft', NULL, NULL),
  (14, '2026-08-14', 'Seja um artesão', E'Trate o seu trabalho diário com a reverência de quem está construindo um legado, não batendo o ponto.\n\nQuando o foco está apenas no resultado financeiro, o trabalho se torna um peso. Quando adotamos a mentalidade do artesão, focando em fazer a tarefa com excelência pelo simples mérito de fazê-la bem, o trabalho ganha dignidade própria.', E'Escolha uma tarefa mundana no seu trabalho de hoje. Faça-a com uma atenção aos detalhes e um rigor que ninguém além de você perceberia.', '5d5e182f-14ee-4028-94a0-a6c0d41f8b2f', 'draft', NULL, NULL),
  (15, '2026-08-15', 'Sistemas são melhores que metas', E'Você não se eleva ao nível das suas metas, você cai ao nível dos seus sistemas.\n\nMetas dizem a você onde você quer chegar; sistemas garantem que você esteja caminhando. Um objetivo grande sem um sistema sólido diário é apenas um desejo. A verdadeira mudança acontece nos processos invisíveis que repetimos.', E'Em vez de focar na sua grande meta hoje, revise o seu processo. O que você fará repetidamente às 9h da manhã todos os dias para garantir o avanço?', '5d5e182f-14ee-4028-94a0-a6c0d41f8b2f', 'draft', NULL, NULL),
  (16, '2026-08-16', 'O custo da interrupção', E'A cada vez que você interrompe o foco, demora até vinte minutos para que seu cérebro retorne ao estado original.\n\nO custo de checar uma notificação "rapidinho" não é o tempo gasto olhando a tela; é a quebra do fluxo mental. A alternância constante de contexto exaure a mente e fragmenta a capacidade de pensar de forma conectada.', E'Trabalhe hoje com o celular em outro cômodo ou fora da sua linha de visão direta. Desative todas as notificações não essenciais do seu computador.', '5d5e182f-14ee-4028-94a0-a6c0d41f8b2f', 'draft', NULL, NULL),
  (17, '2026-08-17', 'A diferença entre ser rico e ter riqueza', E'A riqueza é o dinheiro que você não gasta.\n\nVemos a riqueza no carro que as pessoas dirigem ou nas roupas que vestem. Mas isso demonstra apenas que elas gastaram dinheiro naquelas coisas. A verdadeira riqueza é o que não é visto: a opção, a flexibilidade e o tempo que o dinheiro guardado proporciona.', E'Aja de forma contraintuitiva hoje: sinta orgulho por algo que você decidiu NÃO comprar.', 'f401724b-7b19-409c-952f-030dae6e457d', 'draft', NULL, NULL),
  (18, '2026-08-18', 'A inflação do estilo de vida', E'Se os seus desejos sobem na mesma velocidade que os seus ganhos, você estará para sempre no mesmo lugar.\n\nÉ o ciclo clássico: ganhamos um aumento e, subitamente, nossas "necessidades" se expandem para absorver o novo valor. A margem de manobra financeira só existe se mantivermos uma diferença consciente entre o que ganhamos e o que gastamos.', E'Revise suas despesas mensais recorrentes. Identifique um serviço ou hábito que você incorporou nos últimos dois anos e que agora pode ser cortado sem perda real.', 'f401724b-7b19-409c-952f-030dae6e457d', 'draft', NULL, NULL),
  (19, '2026-08-19', 'Tempo é a moeda final', E'Dinheiro é uma ferramenta para comprar de volta o controle sobre o seu próprio tempo.\n\nQuando compramos algo, não pagamos com dinheiro; pagamos com as horas de vida que investimos para ganhar aquele dinheiro. Se o seu trabalho te dá muito dinheiro, mas não te deixa tempo algum, a ferramenta perdeu o seu propósito primário.', E'Antes de fazer uma compra não essencial hoje, calcule quantas horas de trabalho ela custa. Pergunte-se se o objeto vale essas horas da sua vida.', 'f401724b-7b19-409c-952f-030dae6e457d', 'draft', NULL, NULL),
  (20, '2026-08-20', 'A responsabilidade extrema', E'Um líder não terceiriza a culpa.\n\nO momento em que um líder aponta o dedo para sua equipe, para o mercado ou para a sorte, é o momento em que ele perde o direito de liderar. A verdadeira liderança assume o fardo quando as coisas dão errado, e distribui os créditos quando elas dão certo.', E'Se algo falhar na sua responsabilidade hoje, resista à vontade de justificar. Diga: "Isso é minha responsabilidade e eu vou consertar".', '91855dc1-cc0b-48fd-a4ab-c4510ebfdbda', 'draft', NULL, NULL),
  (21, '2026-08-21', 'Lidere pelo exemplo, não pela ordem', E'As pessoas observam o que você faz muito mais do que ouvem o que você diz.\n\nExigir pontualidade e chegar atrasado, exigir excelência e entregar o medíocre, pedir calma e se descontrolar. Nada corrói a autoridade mais rápido do que a hipocrisia. Seu comportamento é o padrão cultural que você impõe.', E'Pergunte-se: "Se toda a minha equipe fizesse o seu trabalho exatamente com a mesma dedicação e atitude que estou tendo agora, onde estaríamos?".', '91855dc1-cc0b-48fd-a4ab-c4510ebfdbda', 'draft', NULL, NULL),
  (22, '2026-08-22', 'Elogie em público, critique em particular', E'O feedback deve construir a pessoa, não destruí-la diante do grupo.\n\nCorreções públicas costumam gerar postura defensiva e humilhação, não aprendizado. Liderança eficaz exige proteger a dignidade do liderado. O objetivo do feedback duro é mudar o comportamento e não demonstrar poder.', E'Se precisar corrigir o trabalho de alguém, chame-o para uma conversa individual e foque na ação, não no caráter da pessoa.', '91855dc1-cc0b-48fd-a4ab-c4510ebfdbda', 'draft', NULL, NULL),
  (23, '2026-08-23', 'Propósito é ação, não epifania', E'Não espere que o propósito caia do céu; ele é forjado no fazer diário.\n\nTratamos o propósito como se fosse um tesouro escondido que devemos encontrar antes de começar a agir. Na realidade, o significado emerge da responsabilidade que assumimos e das coisas pelas quais escolhemos trabalhar duro e sofrer.', E'Pare de buscar a "grande missão". Escolha um problema útil na sua frente agora e resolva-o com empenho.', '13f03be9-0e27-4a55-aaa6-4a4f4c7257bf', 'draft', NULL, NULL),
  (24, '2026-08-24', 'Identidade maleável', E'Cuidado para não se apegar demais a uma versão de si mesmo.\n\nMuitas vezes ficamos presos a caminhos infelizes porque já investimos muito tempo naquilo ou porque é assim que as pessoas nos veem. O compromisso cego com a própria identidade passada impede o crescimento. Permita-se mudar de ideia.', E'Identifique algo que você continua fazendo apenas por hábito ou pela imagem que quer projetar, e não mais por sentido. Considere abandonar isso.', '13f03be9-0e27-4a55-aaa6-4a4f4c7257bf', 'draft', NULL, NULL),
  (25, '2026-08-25', 'O sacrifício necessário', E'Tudo tem um custo; o que define sua vida é qual sofrimento você escolhe suportar.\n\nTodos querem a recompensa — o corpo saudável, a carreira de sucesso, o bom relacionamento —, mas poucos querem o sacrifício atrelado. O propósito não é perguntar "o que eu quero da vida?", mas "qual dor eu estou disposto a sustentar?".', E'Em vez de desejar um grande objetivo hoje, defina com clareza os sacrifícios que ele exige. Se você não estiver disposto a fazê-los, reajuste o objetivo.', '13f03be9-0e27-4a55-aaa6-4a4f4c7257bf', 'draft', NULL, NULL),
  (26, '2026-08-26', 'A clareza no silêncio', E'Você não ouvirá o essencial enquanto não calar o barulho ao seu redor.\n\nA cultura moderna despreza o silêncio e o preenche imediatamente com ruído. Mas as verdades mais profundas do coração humano e do divino nunca são gritadas; elas são percebidas na quietude. Onde há ausência de silêncio, há ausência de clareza.', E'Encontre 10 minutos hoje para sentar no absoluto silêncio. Sem telas, sem música, sem leitura. Apenas exista e ouça.', '14a3232e-186d-42ba-a371-0f79a0088d4c', 'draft', 'Salmos 46:10', NULL),
  (27, '2026-08-27', 'Confiança através da ação', E'A verdadeira fé não é passiva; é o movimento na direção do que não se vê.\n\nMuitos confundem fé com uma mera crença intelectual ou com ficar esperando que as coisas melhorem sozinhas. A fé madura é aquela que confia na providência, mas age de acordo com a responsabilidade que tem nas mãos. É agir amparado na esperança.', E'Existe alguma área da vida onde você está apenas "esperando" em vez de assumir sua responsabilidade? Dê hoje o primeiro passo que cabe a você.', '14a3232e-186d-42ba-a371-0f79a0088d4c', 'draft', 'Tiago 2:17', NULL),
  (28, '2026-08-28', 'Humildade existencial', E'Reconheça a vastidão do universo e as limitações do seu próprio entendimento.\n\nA ansiedade moderna vem, em parte, da ilusão de que precisamos entender e controlar o mundo inteiro. Há paz profunda na constatação de que não somos o centro do universo. Entregar o que não podemos controlar é o ápice da maturidade.', E'Diante de um problema insolúvel hoje, pratique soltar o controle internamente. Diga: "Fiz o que pude, o resto não me pertence".', '14a3232e-186d-42ba-a371-0f79a0088d4c', 'draft', NULL, NULL),
  (29, '2026-08-29', 'A reverência pelo ordinário', E'O sagrado muitas vezes se esconde nas repetições cotidianas que consideramos banais.\n\nEsperamos a epifania em grandes eventos e grandes conquistas, mas a maior parte da vida é feita de lavar louça, cuidar dos filhos e trabalhar. Encontrar dignidade, graça e sentido no serviço oculto transforma qualquer tarefa em uma prática espiritual.', E'Escolha uma tarefa doméstica rotineira hoje e execute-a com cuidado e lentidão absolutos, como se fosse um ato de honra.', '14a3232e-186d-42ba-a371-0f79a0088d4c', 'draft', NULL, NULL),
  (30, '2026-08-30', 'O sofrimento tem contornos', E'A dor não tem a palavra final na narrativa da sua vida.\n\nNo meio do sofrimento, a ilusão é a de que ele durará para sempre e define tudo. Mas, na perspectiva mais longa, as crises são capítulos, não o livro inteiro. A fé é a âncora que diz que há significado mesmo na desordem.', E'Quando a angústia surgir hoje, lembre-se das outras vezes que você pensou que não suportaria, e ainda assim, você continuou. A tempestade também passa.', '14a3232e-186d-42ba-a371-0f79a0088d4c', 'draft', NULL, NULL);
