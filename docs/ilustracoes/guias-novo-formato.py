# Guias do adulto no formato editorial fixo (como conduzir, "Para conversar à mesa:", "Atividade em família:", "Oração em família:"),
# cada título em linha própria, para os devocionais de 31/10 a 04/11 (faixas 4-6, 7-10 e 11-13, em pt-BR, en, es, fr e it).
# Mais as correções pequenas do rascunho docs/guias-completos-31out-2nov-4nov.md.
# Uso: python3 guias-novo-formato.py <snapshot.json> <saida.sql> <saida-rollback.sql>
#   snapshot.json = cópia dos textos atuais da produção (kids, dev, tr), que também alimenta o rollback.
import json, re, sys, os

LANGS = ['pt-BR', 'en', 'es', 'fr', 'it']
BANDS = ['4-6', '7-10', '11-13']
ID = {'reforma': 'cmvudrag10002oe2ldyzmvhaa', 'davi': 'cmvue6llj000koe2lqtw0xdz2', 'levi': 'cmvv1whpq0002pm2l3f1bfo13',
      'perfume': 'cmvyun7rw0032o72lmlzc68bk', 'marta': 'cmvyv3ozp003ho72lezbf5h9r'}
NEW = ['reforma', 'levi', 'marta']          # guia novo (rascunho do doc + traduções)
REFORMAT = ['davi', 'perfume']              # conteúdo já certo; só coloca os títulos em linha própria
HEAD = {
    'pt-BR': ('Para conversar à mesa:', 'Atividade em família:', 'Oração em família:'),
    'en': ('Talking at the table:', 'Family activity:', 'Family prayer:'),
    'es': ('Para conversar en la mesa:', 'Actividad en familia:', 'Oración en familia:'),
    'fr': ('Pour en parler à table :', 'Activité en famille :', 'Prière en famille :'),
    'it': ('Per parlarne a tavola:', 'Attività in famiglia:', 'Preghiera in famiglia:'),
}
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- pt-BR: lido do rascunho aprovado em docs/ ----
def read_pt():
    md = open(os.path.join(HERE, '..', 'guias-completos-31out-2nov-4nov.md'), encoding='utf-8').read()
    out, dev, band = {}, None, None
    key = {'Reforma': 'reforma', 'Quem se senta': 'levi', 'O que é mais': 'marta'}
    for block in re.split(r'\n(?=## |### )', md):
        if block.startswith('## '):
            dev = next((v for k, v in key.items() if k in block.split('\n')[0]), None)
        elif block.startswith('### Faixa ') and dev:
            band = block.split('\n')[0].replace('### Faixa ', '').strip()
            paras = [p.strip() for p in re.split(r'\n\s*\n', block.split('\n', 1)[1].split('\n---')[0]) if p.strip()]
            lead = paras[0]
            qs = paras[1].split('\n')[1:]
            act = re.sub(r'^Atividade em família:\s*', '', paras[2])
            pr = re.sub(r'^Oração em família:\s*', '', paras[3])
            out[(dev, band)] = (lead, qs, act, pr)
    assert len(out) == 9, out.keys()
    return out

G = {}  # (dev, band) -> {lang: (lead, [perguntas], atividade, oração)}

G[('reforma', '4-6')] = {
'en': ("Show the pictures one by one and let your child say what they see. If they don't know who Luther was, just say he was a man who loved the Bible.",
  ['Who tells you stories from the Bible?', 'What did Luther discover in the Bible?', 'Why is it good to be able to read the Bible at home?'],
  'Take a Bible from your home and let your child hold it. The adult opens to Romans 1:17 and reads aloud the phrase "The righteous shall live by faith," and each person says one thing they like knowing about God. You only need a Bible, and it takes about 5 minutes.',
  "Lord, thank you for the Bible, which shows us who you are. Thank you for forgiving us because of Jesus. Help our family read your Word. In Jesus' name, amen."),
'es': ('Muestre los cuadros uno por uno y deje que el niño diga lo que ve. Si no sabe quién fue Lutero, basta con decir que era un hombre que amaba la Biblia.',
  ['¿Quién te cuenta historias de la Biblia?', '¿Qué descubrió Lutero en la Biblia?', '¿Por qué es bueno poder leer la Biblia en casa?'],
  'Tomen una Biblia de la casa y dejen que el niño la sostenga. El adulto la abre en Romanos 1.17 y lee en voz alta la frase "El justo por la fe vivirá", y cada uno dice algo que le gusta saber de Dios. Solo se necesita una Biblia y toma unos 5 minutos.',
  'Señor, gracias por la Biblia, que nos muestra quién eres. Gracias porque nos perdonas por causa de Jesús. Ayuda a nuestra familia a leer tu Palabra. En el nombre de Jesús, amén.'),
'fr': ("Montrez les images une par une et laissez l'enfant dire ce qu'il voit. S'il ne sait pas qui était Luther, dites simplement que c'était un homme qui aimait la Bible.",
  ['Qui te raconte des histoires de la Bible ?', "Qu'a découvert Luther dans la Bible ?", 'Pourquoi est-il bon de pouvoir lire la Bible à la maison ?'],
  "Prenez une Bible de la maison et laissez l'enfant la tenir. L'adulte l'ouvre en Romains 1.17 et lit à voix haute la phrase « Le juste vivra par la foi », et chacun dit une chose qu'il aime savoir sur Dieu. Il suffit d'une Bible, et cela prend environ 5 minutes.",
  'Seigneur, merci pour la Bible, qui nous montre qui tu es. Merci de nous pardonner à cause de Jésus. Aide notre famille à lire ta Parole. Au nom de Jésus, amen.'),
'it': ('Mostra le immagini una per una e lascia che il bambino dica che cosa vede. Se non sa chi era Lutero, basta dire che era un uomo che amava la Bibbia.',
  ['Chi ti racconta le storie della Bibbia?', 'Che cosa ha scoperto Lutero nella Bibbia?', 'Perché è bello poter leggere la Bibbia in casa?'],
  "Prendete una Bibbia di casa e lasciate che il bambino la tenga in mano. L'adulto la apre in Romani 1,17 e legge ad alta voce la frase «Il giusto vivrà per fede», e ognuno dice una cosa che gli piace sapere su Dio. Basta una Bibbia e ci vogliono circa 5 minuti.",
  'Signore, grazie per la Bibbia, che ci mostra chi sei. Grazie perché ci perdoni per mezzo di Gesù. Aiuta la nostra famiglia a leggere la tua Parola. Nel nome di Gesù, amen.'),
}
G[('reforma', '7-10')] = {
'en': ('Read the pictures together and talk without hurry. Introduce Luther without belittling Catholics or other churches, and if your child cites videos or songs as a source, show that the Bible is the place to check.',
  ['Where do you usually learn things about God?', 'What did Luther discover when he went back to the Bible?', 'Why did he want everyone to be able to read the Bible?', 'How can we check whether something about God is in the Bible?'],
  "Pick a sentence someone has heard about God and look together in the Bible to see whether it appears there. If you can't find it, that's fine: write down the question to look again tomorrow. You need a Bible, and it takes about 10 minutes.",
  "Lord, thank you for the Bible and for forgiveness as a gift, received by faith in Jesus. Teach our family to always return to your Word. In Jesus' name, amen."),
'es': ('Lean los cuadros juntos y conversen sin prisa. Presente a Lutero sin descalificar a los católicos ni a otras iglesias y, si el niño cita videos o canciones como fuente, muéstrele que la Biblia es el lugar para comprobar.',
  ['¿Dónde sueles aprender cosas sobre Dios?', '¿Qué descubrió Lutero cuando volvió a la Biblia?', '¿Por qué quiso que todos pudieran leer la Biblia?', '¿Cómo podemos comprobar si algo sobre Dios está en la Biblia?'],
  'Elijan una frase que alguien haya oído sobre Dios y busquen juntos en la Biblia si aparece. Si no la encuentran, no pasa nada: anoten la pregunta para buscar de nuevo mañana. Se necesita una Biblia y toma unos 10 minutos.',
  'Señor, gracias por la Biblia y por el perdón que es un regalo, recibido por la fe en Jesús. Enseña a nuestra familia a volver siempre a tu Palabra. En el nombre de Jesús, amén.'),
'fr': ("Lisez les images ensemble et parlez sans vous presser. Présentez Luther sans dénigrer les catholiques ni les autres Églises, et, si l'enfant cite des vidéos ou des chansons comme source, montrez que la Bible est le lieu pour vérifier.",
  ["Où apprends-tu d'habitude des choses sur Dieu ?", "Qu'a découvert Luther en revenant à la Bible ?", 'Pourquoi voulait-il que tout le monde puisse lire la Bible ?', 'Comment pouvons-nous vérifier si une chose sur Dieu est dans la Bible ?'],
  "Choisissez une phrase que quelqu'un a entendue sur Dieu et cherchez ensemble dans la Bible si elle s'y trouve. Si vous ne la trouvez pas, ce n'est pas grave : notez la question pour chercher à nouveau demain. Il faut une Bible, et cela prend environ 10 minutes.",
  'Seigneur, merci pour la Bible et pour le pardon qui est un cadeau, reçu par la foi en Jésus. Apprends à notre famille à toujours revenir à ta Parole. Au nom de Jésus, amen.'),
'it': ('Leggete le immagini insieme e parlate senza fretta. Presenta Lutero senza screditare i cattolici o altre chiese e, se il bambino cita video o canzoni come fonte, mostra che la Bibbia è il luogo in cui verificare.',
  ['Dove impari di solito le cose su Dio?', 'Che cosa scoprì Lutero tornando alla Bibbia?', 'Perché volle che tutti potessero leggere la Bibbia?', 'Come possiamo verificare se qualcosa su Dio è nella Bibbia?'],
  'Scegliete una frase che qualcuno ha sentito su Dio e cercate insieme nella Bibbia se compare. Se non la trovate, va bene: annotate la domanda per cercare di nuovo domani. Serve una Bibbia e ci vogliono circa 10 minuti.',
  'Signore, grazie per la Bibbia e per il perdono che è un dono, ricevuto per fede in Gesù. Insegna alla nostra famiglia a tornare sempre alla tua Parola. Nel nome di Gesù, amen.'),
}
G[('reforma', '11-13')] = {
'en': ('Let the teenager lead the conversation and listen before correcting. If they question something learned at home or at church, treat the question as a sign of living faith.',
  ["What sentence about God have you heard many times without knowing whether it's in the Bible?", "Why didn't Luther want to take back what he had written?", 'What changes when the Bible has the last word, even about what we feel sure of?', 'How can we tell whether an idea about faith comes from the Bible or just from habit?'],
  'Each person writes, just for themselves, a sentence about God they often repeat. Then look together in the Bible to see whether it is there (the phrase "God helps those who help themselves" is not). No one has to show what they wrote. You need paper, a pen and a Bible, and it takes about 10 minutes.',
  "Lord, thank you for accepting us by grace, not by our effort. Give our family the courage to let your Word have the last word. In Jesus' name, amen."),
'es': ('Deje que el adolescente conduzca la conversación y escuche antes de corregir. Si cuestiona algo aprendido en casa o en la iglesia, trate la pregunta como señal de una fe viva.',
  ['¿Qué frase sobre Dios has oído muchas veces sin saber si está en la Biblia?', '¿Por qué Lutero no quiso negar lo que había escrito?', '¿Qué cambia cuando la Biblia tiene la última palabra, incluso sobre aquello de lo que estamos seguros?', '¿Cómo saber si una idea sobre la fe viene de la Biblia o solo de la costumbre?'],
  'Cada uno escribe, solo para sí, una frase sobre Dios que suele repetir. Después, busquen juntos en la Biblia si está allí (la frase "Ayúdate, que Dios te ayudará" no está). Nadie tiene que mostrar lo que escribió. Se usa papel, lápiz y una Biblia, y toma unos 10 minutos.',
  'Señor, gracias porque nos aceptas por gracia y no por nuestro esfuerzo. Da a nuestra familia valentía para dejar que tu Palabra tenga la última palabra. En el nombre de Jesús, amén.'),
'fr': ("Laissez l'adolescent mener la conversation et écoutez avant de corriger. S'il remet en question quelque chose appris à la maison ou à l'église, considérez la question comme le signe d'une foi vivante.",
  ["Quelle phrase sur Dieu as-tu entendue souvent sans savoir si elle est dans la Bible ?", "Pourquoi Luther n'a-t-il pas voulu renier ce qu'il avait écrit ?", "Qu'est-ce qui change quand la Bible a le dernier mot, même sur ce dont nous sommes sûrs ?", "Comment savoir si une idée sur la foi vient de la Bible ou seulement de l'habitude ?"],
  "Chacun écrit, pour lui seul, une phrase sur Dieu qu'il répète souvent. Ensuite, cherchez ensemble dans la Bible si elle s'y trouve (la phrase « Aide-toi, le ciel t'aidera » n'y est pas). Personne n'a à montrer ce qu'il a écrit. Il faut du papier, un stylo et une Bible, et cela prend environ 10 minutes.",
  'Seigneur, merci de nous accueillir par grâce, et non par nos efforts. Donne à notre famille le courage de laisser ta Parole avoir le dernier mot. Au nom de Jésus, amen.'),
'it': ("Lascia che l'adolescente guidi la conversazione e ascolta prima di correggere. Se mette in dubbio qualcosa imparato a casa o in chiesa, tratta la domanda come segno di una fede viva.",
  ['Quale frase su Dio hai sentito tante volte senza sapere se sta nella Bibbia?', 'Perché Lutero non volle rinnegare ciò che aveva scritto?', 'Che cosa cambia quando la Bibbia ha l\'ultima parola, anche su ciò di cui siamo sicuri?', "Come capire se un'idea sulla fede viene dalla Bibbia o solo dall'abitudine?"],
  'Ognuno scrive, solo per sé, una frase su Dio che ripete spesso. Poi cercate insieme nella Bibbia se c\'è (la frase «Aiutati che Dio ti aiuta» non c\'è). Nessuno deve mostrare ciò che ha scritto. Servono carta, penna e una Bibbia, e ci vogliono circa 10 minuti.',
  'Signore, grazie perché ci accogli per grazia e non per il nostro sforzo. Dona alla nostra famiglia il coraggio di lasciare che la tua Parola abbia l\'ultima parola. Nel nome di Gesù, amen.'),
}

G[('levi', '4-6')] = {
'en': ('Tell the story slowly: Jesus called, Levi went with him, and then he held a meal. Explain "sin" with a simple example, like lying or hurting someone on purpose, without demanding answers or confessions from your child.',
  ['Who usually sits with you at mealtime?', 'What did Levi do after Jesus called him?', 'Who did Levi invite to the table?'],
  'At the next meal, set an extra place at the table and tell the story of Levi again. Each person says one person they would like to invite. No materials needed, and it takes about 5 minutes.',
  'Jesus, thank you for welcoming everyone. Forgive what we do wrong and help our family open the table to others. Amen.'),
'es': ('Cuente la historia despacio: Jesús llamó, Leví fue con él y después hizo una comida. Explique "pecado" con un ejemplo sencillo, como mentir o lastimar a alguien a propósito, sin exigir respuestas ni confesiones al niño.',
  ['¿Quién suele sentarse contigo a la hora de comer?', '¿Qué hizo Leví después de que Jesús lo llamó?', '¿A quién invitó Leví a la mesa?'],
  'En la próxima comida, pongan un lugar extra en la mesa y cuenten de nuevo la historia de Leví. Cada uno dice una persona a la que le gustaría invitar. No se necesitan materiales y toma unos 5 minutos.',
  'Jesús, gracias porque recibes a todas las personas. Perdona lo que hacemos mal y ayuda a nuestra familia a abrir la mesa a los demás. Amén.'),
'fr': ("Racontez l'histoire lentement : Jésus a appelé, Lévi l'a suivi, puis il a organisé un repas. Expliquez le « péché » avec un exemple simple, comme mentir ou faire du mal à quelqu'un exprès, sans exiger de réponses ni d'aveux de l'enfant.",
  ["Qui s'assoit d'habitude avec toi au moment du repas ?", "Qu'a fait Lévi après que Jésus l'a appelé ?", 'Qui Lévi a-t-il invité à sa table ?'],
  "Au prochain repas, mettez une place de plus à table et racontez à nouveau l'histoire de Lévi. Chacun dit une personne qu'il aimerait inviter. Aucun matériel n'est nécessaire, et cela prend environ 5 minutes.",
  "Jésus, merci d'accueillir tout le monde. Pardonne ce que nous faisons de mal et aide notre famille à ouvrir sa table aux autres. Amen."),
'it': ("Racconta la storia piano: Gesù chiamò, Levi andò con lui e poi organizzò un pranzo. Spiega il «peccato» con un esempio semplice, come mentire o far del male a qualcuno apposta, senza pretendere risposte o confessioni dal bambino.",
  ['Chi si siede di solito con te a tavola?', 'Che cosa fece Levi dopo che Gesù lo chiamò?', 'Chi invitò Levi a tavola?'],
  'Al prossimo pasto, mettete un posto in più a tavola e raccontate di nuovo la storia di Levi. Ognuno dice una persona che vorrebbe invitare. Non serve materiale e ci vogliono circa 5 minuti.',
  'Gesù, grazie perché accogli tutte le persone. Perdona ciò che sbagliamo e aiuta la nostra famiglia ad aprire la tavola agli altri. Amen.'),
}
G[('levi', '7-10')] = {
'en': ('Help your child follow the sequence before explaining the comparison with the doctor: Jesus comes close because people need him. Avoid dividing the family into those who "need Jesus" and those who are "already good." Saying sorry does not erase the consequences or oblige a friendship.',
  ['Why did Jesus eat with the tax collectors?', 'Who needed Jesus more at that table: the guests or the ones complaining?', 'How could classmates treat a child who made a mistake and said sorry?', 'What simple invitation can we make this week?'],
  'Set up the table from the story with a tablecloth or sheets of paper: a place for Jesus, one for Levi and others for the guests. Each person picks a character and says, in one sentence, what that character felt. You need paper and pens from home, and it takes about 10 minutes.',
  'Jesus, thank you for calling people who need forgiveness, and we are like that. Help our family tell the truth, fix what we get wrong and treat others with respect. Amen.'),
'es': ('Ayude al niño a seguir la secuencia antes de explicar la comparación con el médico: Jesús se acerca porque las personas lo necesitan. Evite dividir a la familia entre quienes "necesitan a Jesús" y quienes "ya son buenos". Pedir perdón no elimina las consecuencias ni obliga a una amistad.',
  ['¿Por qué comió Jesús con los cobradores de impuestos?', '¿Quién necesitaba más a Jesús en aquella mesa: los invitados o los que se quejaban?', '¿Cómo podrían tratar los compañeros a un niño que se equivocó y pidió perdón?', '¿Qué invitación sencilla podemos hacer esta semana?'],
  'Armen la mesa de la historia con un mantel o con hojas de papel: un lugar para Jesús, uno para Leví y otros para los invitados. Cada uno elige un personaje y dice, en una frase, lo que sintió. Se usan papel y lápices de casa, y toma unos 10 minutos.',
  'Jesús, gracias porque llamas a personas que necesitan perdón, y nosotros somos así. Ayuda a nuestra familia a decir la verdad, a corregir lo que hacemos mal y a tratar a los demás con respeto. Amén.'),
'fr': ("Aidez l'enfant à suivre la suite des événements avant d'expliquer la comparaison avec le médecin : Jésus s'approche parce que les gens ont besoin de lui. Évitez de diviser la famille entre ceux qui « ont besoin de Jésus » et ceux qui sont « déjà bons ». S'excuser n'efface pas les conséquences et n'oblige pas à une amitié.",
  ['Pourquoi Jésus a-t-il mangé avec les collecteurs d\'impôts ?', "Qui avait le plus besoin de Jésus à cette table : les invités ou ceux qui se plaignaient ?", "Comment les camarades pourraient-ils traiter un enfant qui s'est trompé et s'est excusé ?", 'Quelle invitation simple pouvons-nous faire cette semaine ?'],
  "Dressez la table de l'histoire avec une nappe ou des feuilles de papier : une place pour Jésus, une pour Lévi et d'autres pour les invités. Chacun choisit un personnage et dit, en une phrase, ce qu'il a ressenti. Il faut du papier et des crayons de la maison, et cela prend environ 10 minutes.",
  'Jésus, merci d\'appeler des personnes qui ont besoin de pardon, et nous sommes ainsi. Aide notre famille à dire la vérité, à réparer ce que nous faisons de travers et à traiter les autres avec respect. Amen.'),
'it': ("Aiuta il bambino a seguire la sequenza prima di spiegare il paragone con il medico: Gesù si avvicina perché le persone hanno bisogno di lui. Evita di dividere la famiglia tra chi «ha bisogno di Gesù» e chi è «già buono». Chiedere scusa non cancella le conseguenze e non obbliga a un'amicizia.",
  ['Perché Gesù mangiò con gli esattori delle tasse?', 'Chi aveva più bisogno di Gesù a quella tavola: gli invitati o quelli che si lamentavano?', 'Come potrebbero trattare i compagni un bambino che ha sbagliato e ha chiesto scusa?', 'Quale semplice invito possiamo fare questa settimana?'],
  'Preparate la tavola della storia con una tovaglia o dei fogli di carta: un posto per Gesù, uno per Levi e altri per gli invitati. Ognuno sceglie un personaggio e dice, in una frase, che cosa ha provato. Servono carta e penne di casa e ci vogliono circa 10 minuti.',
  'Gesù, grazie perché chiami le persone che hanno bisogno di perdono, e noi siamo così. Aiuta la nostra famiglia a dire la verità, a correggere ciò che sbagliamo e a trattare gli altri con rispetto. Amen.'),
}
G[('levi', '11-13')] = {
'en': ("Listen without asking for names or access to your teenager's messages. Stress that Jesus' mercy calls us to repentance, including when we take part in humiliating someone, and don't demand immediate reconciliation. If there is any account of persecution or violence, offer protection and support.",
  ['Who needs an invitation from you this week?', "In what situations is it easier to point out others' mistakes than our own?", 'How can we correct a mistake and respect the person at the same time?', 'What changes when we remember that we too were welcomed?'],
  'Each person thinks, in silence, of someone who is often left out and picks a simple invitation for this week: sitting together, asking them to join a project or sending a message. No one has to say who it is. No materials needed, and it takes about 5 minutes.',
  'Jesus, thank you for welcoming us even when we get it wrong. Teach our family to admit our own mistakes and to make room for those who are left out. Amen.'),
'es': ('Escuche sin pedir nombres ni acceso a los mensajes del adolescente. Refuerce que la misericordia de Jesús llama al arrepentimiento, incluso cuando participamos en una humillación, y no exija una reconciliación inmediata. Si hay un relato de acoso o violencia, ofrezca protección y acompañamiento.',
  ['¿Quién necesita una invitación tuya esta semana?', '¿En qué situaciones es más fácil señalar el error de los demás que el nuestro?', '¿Cómo corregir un error y respetar a la persona al mismo tiempo?', '¿Qué cambia cuando recordamos que también fuimos acogidos?'],
  'Cada uno piensa, en silencio, en una persona que suele quedar al margen y elige una invitación sencilla para esta semana: sentarse juntos, llamarla para un trabajo o enviarle un mensaje. Nadie tiene que decir quién es. No se necesitan materiales y toma unos 5 minutos.',
  'Jesús, gracias porque nos acoges incluso cuando fallamos. Enseña a nuestra familia a reconocer los propios errores y a hacer espacio para quien queda fuera. Amén.'),
'fr': ("Écoutez sans demander de noms ni l'accès aux messages de l'adolescent. Soulignez que la miséricorde de Jésus appelle à la repentance, y compris quand nous participons à une humiliation, et n'exigez pas de réconciliation immédiate. S'il y a un récit de harcèlement ou de violence, offrez protection et accompagnement.",
  ["Qui a besoin d'une invitation de ta part cette semaine ?", "Dans quelles situations est-il plus facile de pointer l'erreur des autres que la nôtre ?", 'Comment corriger une erreur tout en respectant la personne ?', "Qu'est-ce qui change quand nous nous rappelons que nous aussi, nous avons été accueillis ?"],
  "Chacun pense, en silence, à une personne souvent laissée de côté et choisit une invitation simple pour cette semaine : s'asseoir ensemble, l'appeler pour un travail ou lui envoyer un message. Personne n'a à dire qui c'est. Aucun matériel n'est nécessaire, et cela prend environ 5 minutes.",
  "Jésus, merci de nous accueillir même quand nous faisons des erreurs. Apprends à notre famille à reconnaître ses propres torts et à faire de la place à ceux qui sont laissés de côté. Amen."),
'it': ("Ascolta senza chiedere nomi né l'accesso ai messaggi dell'adolescente. Sottolinea che la misericordia di Gesù chiama al pentimento, anche quando partecipiamo a un'umiliazione, e non esigere una riconciliazione immediata. Se emerge un racconto di persecuzione o violenza, offri protezione e accompagnamento.",
  ['Chi ha bisogno di un tuo invito questa settimana?', "In quali situazioni è più facile indicare l'errore degli altri che il nostro?", 'Come correggere un errore e rispettare la persona allo stesso tempo?', 'Che cosa cambia quando ricordiamo che anche noi siamo stati accolti?'],
  'Ognuno pensa, in silenzio, a una persona che di solito resta esclusa e sceglie un invito semplice per questa settimana: sedersi insieme, chiamarla per un lavoro o mandarle un messaggio. Nessuno deve dire chi è. Non serve materiale e ci vogliono circa 5 minuti.',
  'Gesù, grazie perché ci accogli anche quando sbagliamo. Insegna alla nostra famiglia a riconoscere i propri errori e a fare spazio a chi è rimasto fuori. Amen.'),
}

G[('marta', '4-6')] = {
'en': ('Tell a short, familiar story of Jesus and let your child comment or ask questions. The goal is a pleasant time around Jesus, not testing memory. Avoid comparing siblings or demanding that your child sit still.',
  ['Which story of Jesus do you remember?', 'What did Mary do when Jesus arrived?', 'How can we listen to Jesus here at home?'],
  'Pick a story of Jesus and read or tell it together, sitting close. Then each person says what they liked best. A children\'s Bible or just memory is enough, and it takes about 5 minutes.',
  'Jesus, thank you for your love. We want to hear your stories and keep what you teach. Help our family stay together with you. Amen.'),
'es': ('Cuente una historia breve y conocida de Jesús, dejando que el niño comente o pregunte. El objetivo es un tiempo agradable en torno a Jesús, sin poner a prueba la memoria. Evite comparar hermanos o exigir que el niño se quede quieto.',
  ['¿De qué historia de Jesús te acuerdas?', '¿Qué hizo María cuando llegó Jesús?', '¿Cómo podemos escuchar a Jesús aquí en casa?'],
  'Elijan una historia de Jesús y léanla o cuéntenla juntos, sentados bien cerquita. Después, cada uno dice lo que más le gustó. Basta una Biblia infantil o la memoria, y toma unos 5 minutos.',
  'Jesús, gracias por tu amor. Queremos escuchar tus historias y guardar lo que enseñas. Ayuda a nuestra familia a estar juntos contigo. Amén.'),
'fr': ("Racontez une histoire brève et connue de Jésus, en laissant l'enfant commenter ou poser des questions. Le but est un moment agréable autour de Jésus, sans tester la mémoire. Évitez de comparer des frères et sœurs ou d'exiger que l'enfant reste immobile.",
  ["De quelle histoire de Jésus te souviens-tu ?", "Qu'a fait Marie quand Jésus est arrivé ?", 'Comment pouvons-nous écouter Jésus ici, à la maison ?'],
  "Choisissez une histoire de Jésus et lisez-la ou racontez-la ensemble, bien serrés. Ensuite, chacun dit ce qu'il a préféré. Une Bible pour enfants ou simplement la mémoire suffisent, et cela prend environ 5 minutes.",
  "Jésus, merci pour ton amour. Nous voulons écouter tes histoires et garder ce que tu enseignes. Aide notre famille à rester ensemble avec toi. Amen."),
'it': ("Racconta una storia breve e conosciuta di Gesù, lasciando che il bambino commenti o faccia domande. L'obiettivo è un momento piacevole intorno a Gesù, senza mettere alla prova la memoria. Evita di confrontare i fratelli o di pretendere che il bambino stia fermo.",
  ['Di quale storia di Gesù ti ricordi?', 'Che cosa fece Maria quando arrivò Gesù?', 'Come possiamo ascoltare Gesù qui a casa?'],
  'Scegliete una storia di Gesù e leggetela o raccontatela insieme, seduti vicini. Poi ognuno dice che cosa gli è piaciuto di più. Basta una Bibbia per bambini o la memoria, e ci vogliono circa 5 minuti.',
  'Gesù, grazie per il tuo amore. Vogliamo ascoltare le tue storie e custodire ciò che insegni. Aiuta la nostra famiglia a stare insieme con te. Amen.'),
}
G[('marta', '7-10')] = {
'en': ("Welcome your child's question with interest, without feeling you must have the answer right away. The passage values the disciple's listening without belittling the work of whoever cares for the home, and without turning Martha and Mary into fixed personality types.",
  ['What would you like to know better about Jesus?', 'What did Martha want to do for her guest? And what did Mary want to do?', 'When do we get so busy that we forget to be with the people we love?', 'What can we leave for later today so we can listen to Jesus?'],
  'Pick five minutes with no screens. One person reads a short passage from the Bible and the others just listen. Then each person shares a question that stayed with them. You need a Bible and a timer, and it takes about 10 minutes.',
  'Lord Jesus, thank you that we can know you and hear your word. Teach our family to set aside time to be with you, in the middle of our tasks. Amen.'),
'es': ('Reciba la pregunta del niño con interés, sin sentir que debe tener la respuesta de inmediato. El pasaje valora la escucha del discípulo, sin menospreciar el trabajo de quien cuida la casa y sin convertir a Marta y María en modelos fijos de personalidad.',
  ['¿Qué te gustaría conocer mejor de Jesús?', '¿Qué quería hacer Marta por su visita? ¿Y qué quiso hacer María?', '¿Cuándo estamos tan ocupados que nos olvidamos de estar con quien amamos?', '¿Qué podemos dejar para después, hoy, para escuchar a Jesús?'],
  'Elijan cinco minutos sin pantallas. Uno lee un pasaje corto de la Biblia y los demás solo escuchan. Después, cada uno cuenta una pregunta que le quedó. Se necesita una Biblia y un temporizador, y toma unos 10 minutos.',
  'Señor Jesús, gracias porque podemos conocerte y oír tu palabra. Enseña a nuestra familia a reservar tiempo para estar contigo, en medio de nuestras tareas. Amén.'),
'fr': ("Accueillez la question de l'enfant avec intérêt, sans vous sentir obligé d'avoir la réponse tout de suite. Le passage valorise l'écoute du disciple, sans dévaloriser le travail de celle ou celui qui s'occupe de la maison et sans faire de Marthe et Marie des modèles figés de personnalité.",
  ["Qu'aimerais-tu mieux connaître de Jésus ?", "Que voulait faire Marthe pour son invité ? Et que voulait faire Marie ?", "Quand sommes-nous si occupés que nous oublions d'être avec ceux que nous aimons ?", "Que pouvons-nous remettre à plus tard, aujourd'hui, pour écouter Jésus ?"],
  "Choisissez cinq minutes sans écrans. L'un lit un court passage de la Bible et les autres écoutent simplement. Ensuite, chacun partage une question qui lui est restée. Il faut une Bible et un minuteur, et cela prend environ 10 minutes.",
  "Seigneur Jésus, merci de pouvoir te connaître et entendre ta parole. Apprends à notre famille à réserver du temps pour être avec toi, au milieu de nos tâches. Amen."),
'it': ("Accogli la domanda del bambino con interesse, senza sentirti obbligato ad avere subito la risposta. Il brano valorizza l'ascolto del discepolo, senza sminuire il lavoro di chi si prende cura della casa e senza fare di Marta e Maria modelli fissi di personalità.",
  ['Che cosa vorresti conoscere meglio di Gesù?', 'Che cosa voleva fare Marta per il suo ospite? E che cosa volle fare Maria?', 'Quando siamo così occupati da dimenticare di stare con chi amiamo?', 'Che cosa possiamo rimandare, oggi, per ascoltare Gesù?'],
  'Scegliete cinque minuti senza schermi. Uno legge un breve brano della Bibbia e gli altri ascoltano soltanto. Poi ognuno racconta una domanda che gli è rimasta. Servono una Bibbia e un timer, e ci vogliono circa 10 minuti.',
  'Signore Gesù, grazie perché possiamo conoscerti e ascoltare la tua parola. Insegna alla nostra famiglia a riservare del tempo per stare con te, in mezzo alle nostre faccende. Amen.'),
}
G[('marta', '11-13')] = {
'en': ('Offer company without demanding access to prayer or to what was written. If a question comes up, listen before explaining. Avoid measuring the encounter with Jesus by the length of silence, the emotion shown or the number of things said.',
  ["What would you talk about with Jesus if you weren't in a hurry?", 'When does serving turn into tiredness or pressure?', 'What does it mean to listen to Jesus before serving?'],
  'Each person sets aside five minutes in silence, without a phone, to pray or write a line, starting from what is really in the heart, not from the list of requests. No one has to show what they wrote. Then offer each other two minutes of undivided attention. Paper is optional, and it takes about 10 minutes.',
  'Jesus, thank you for loving us beyond what we produce. Help our family rest in your love and hear your word before running after everything that needs to be done. Amen.'),
'es': ('Ofrezca compañía sin exigir acceso a la oración ni a lo que se escribió. Si surge una pregunta, escuche antes de explicar. Evite medir el encuentro con Jesús por el tiempo de silencio, la emoción demostrada o la cantidad de cosas dichas.',
  ['¿De qué hablarías con Jesús si no tuvieras prisa?', '¿Cuándo servir se vuelve cansancio o exigencia?', '¿Qué significa escuchar a Jesús antes de servir?'],
  'Cada uno reserva cinco minutos en silencio, sin celular, para orar o escribir una línea, empezando por lo que de verdad está en el corazón, no por la lista de peticiones. Nadie tiene que mostrar lo que escribió. Después, ofrézcanse unos a otros dos minutos de atención sin interrupciones. El papel es opcional y toma unos 10 minutos.',
  'Jesús, gracias porque nos amas más allá de lo que producimos. Ayuda a nuestra familia a descansar en tu amor y a oír tu palabra antes de correr tras todo lo que hay que hacer. Amén.'),
'fr': ("Offrez votre compagnie sans exiger l'accès à la prière ni à ce qui a été écrit. Si une question surgit, écoutez avant d'expliquer. Évitez de mesurer la rencontre avec Jésus à la durée du silence, à l'émotion montrée ou à la quantité de choses dites.",
  ["De quoi parlerais-tu avec Jésus si tu n'étais pas pressé ?", 'Quand servir devient-il fatigue ou pression ?', 'Que signifie écouter Jésus avant de servir ?'],
  "Chacun réserve cinq minutes en silence, sans téléphone, pour prier ou écrire une ligne, en partant de ce qui est vraiment dans le cœur, et non de la liste de demandes. Personne n'a à montrer ce qu'il a écrit. Ensuite, offrez-vous mutuellement deux minutes d'attention sans interruption. Le papier est facultatif, et cela prend environ 10 minutes.",
  "Jésus, merci de nous aimer au-delà de ce que nous produisons. Aide notre famille à se reposer dans ton amour et à entendre ta parole avant de courir après tout ce qu'il y a à faire. Amen."),
'it': ("Offri compagnia senza pretendere l'accesso alla preghiera o a ciò che è stato scritto. Se nasce una domanda, ascolta prima di spiegare. Evita di misurare l'incontro con Gesù dalla durata del silenzio, dall'emozione mostrata o dalla quantità di cose dette.",
  ['Di che cosa parleresti con Gesù se non avessi fretta?', 'Quando servire diventa stanchezza o pretesa?', 'Che cosa significa ascoltare Gesù prima di servire?'],
  'Ognuno si riserva cinque minuti in silenzio, senza telefono, per pregare o scrivere una riga, partendo da ciò che c\'è davvero nel cuore e non dall\'elenco delle richieste. Nessuno deve mostrare ciò che ha scritto. Poi offritevi a vicenda due minuti di attenzione senza interruzioni. La carta è facoltativa e ci vogliono circa 10 minuti.',
  'Gesù, grazie perché ci ami al di là di ciò che produciamo. Aiuta la nostra famiglia a riposare nel tuo amore e ad ascoltare la tua parola prima di correre dietro a tutto ciò che c\'è da fare. Amen.'),
}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def titles(guide):
    n = 0
    for p in re.split(r'\n\s*\n', guide):
        first = p.split('\n')[0].strip()
        if 0 < len(first) <= 60 and first.endswith(':'):
            n += 1
    return n


def compose(lang, lead, qs, act, pr):
    h1, h2, h3 = HEAD[lang]
    return '\n\n'.join([lead, h1 + '\n' + '\n'.join(qs), h2 + '\n' + act, h3 + '\n' + pr])


def reformat(guide):
    """Coloca o título de 'Atividade' e de 'Oração' em linha própria (o conteúdo já está certo)."""
    paras = re.split(r'\n\s*\n', guide.strip())
    out = []
    for i, p in enumerate(paras):
        if i >= 2 and '\n' not in p and ': ' in p:
            head, body = p.split(': ', 1)
            if len(head) <= 58:
                p = head + ':\n' + body
        out.append(p)
    return '\n\n'.join(out)


def strip_ref(t):
    """Tira a referência (" - Lucas 7.47" ou " — Lucas 10.42") e as aspas do texto bíblico; o app mostra a referência à parte."""
    t = re.sub(r'\s+[-—–]\s+[^-—–]+$', '', t.strip())
    return t.strip().strip('“”"«»  ').strip()


def build(snap):
    pt = read_pt()
    kids = {(r['d'], r['b'], r['l']): r for r in snap['kids']}
    fwd, rb = [], []
    new_guides = {}
    for dev in NEW:
        for band in BANDS:
            lead, qs, act, pr = pt[(dev, band)]
            new_guides[(ID[dev], band, 'pt-BR')] = compose('pt-BR', lead, qs, act, pr)
            for lang in LANGS[1:]:
                new_guides[(ID[dev], band, lang)] = compose(lang, *G[(dev, band)][lang])
    for dev in REFORMAT:
        for band in BANDS:
            for lang in LANGS:
                new_guides[(ID[dev], band, lang)] = reformat(kids[(ID[dev], band, lang)]['guide'])
    assert len(new_guides) == 75
    for k, g in new_guides.items():
        assert titles(g) == 3, (k, titles(g))
    ids = ','.join(q(i) for i in ID.values())
    head = ['\\set ON_ERROR_STOP on', 'BEGIN;']
    fwd += ['-- Guias do adulto no formato fixo (títulos em linha própria) para 31/10 a 04/11, em 5 idiomas, e as correções pequenas do rascunho docs/guias-completos-31out-2nov-4nov.md.'] + head
    rb += ['-- Desfaz guias-novo-formato.sql: devolve os textos de antes (guias, prática, foco, versículos e aplicação).'] + head
    fwd += ['DO $$', 'DECLARE n int;', 'BEGIN',
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band IN ('4-6','7-10','11-13') AND language IN ('pt-BR','en','es','fr','it');",
            "  IF n <> 75 THEN RAISE EXCEPTION 'esperava 75 versoes infantis e encontrei %', n; END IF;", 'END $$;']
    for (d, b, l), g in sorted(new_guides.items()):
        old = kids[(d, b, l)]['guide']
        fwd.append(f"UPDATE devotional_kids SET adult_guide = {q(g)}, updated_at = now() WHERE devotional_id = {q(d)} AND band = {q(b)} AND language = {q(l)} AND adult_guide = {q(old)};")
        rb.append(f"UPDATE devotional_kids SET adult_guide = {q(old)}, updated_at = now() WHERE devotional_id = {q(d)} AND band = {q(b)} AND language = {q(l)};")
    # correções pequenas
    r = kids[(ID['reforma'], '4-6', 'pt-BR')]
    new_pr = r['practice'].replace('Deus me perdoa, é isso é um presente Dele para mim.', 'Deus me perdoa, e isso é um presente dele para mim.')
    assert new_pr != r['practice']
    fwd.append(f"UPDATE devotional_kids SET practice = {q(new_pr)}, updated_at = now() WHERE devotional_id = {q(ID['reforma'])} AND band = '4-6' AND language = 'pt-BR' AND practice = {q(r['practice'])};")
    rb.append(f"UPDATE devotional_kids SET practice = {q(r['practice'])}, updated_at = now() WHERE devotional_id = {q(ID['reforma'])} AND band = '4-6' AND language = 'pt-BR';")
    m = kids[(ID['marta'], '11-13', 'pt-BR')]
    assert m['focus'].endswith('esta não lhe será tirada.'), m['focus']
    story_old = json.dumps(m['story'], ensure_ascii=False)
    assert 'ela não lhe será tirada' in story_old
    story_new = story_old.replace('ela não lhe será tirada', 'esta não lhe será tirada')
    fwd.append(f"UPDATE devotional_kids SET story = {q(story_new)}::jsonb, updated_at = now() WHERE devotional_id = {q(ID['marta'])} AND band = '11-13' AND language = 'pt-BR' AND story::text LIKE '%ela não lhe será tirada%';")
    rb.append(f"UPDATE devotional_kids SET story = {q(story_old)}::jsonb, updated_at = now() WHERE devotional_id = {q(ID['marta'])} AND band = '11-13' AND language = 'pt-BR';")
    # versículo sem a referência embutida (03/11 e 04/11) e parágrafo vazio no fim da aplicação (01/11)
    for row in snap['dev']:
        if row['id'] in (ID['perfume'], ID['marta']):
            new = strip_ref(row['st'])
            assert new and new != row['st'] and not re.search(r'\d+\.\d+', new), (row['id'], new)
            fwd.append(f"UPDATE devotionals SET scripture_text = {q(new)} WHERE id = {q(row['id'])} AND scripture_text = {q(row['st'])};")
            rb.append(f"UPDATE devotionals SET scripture_text = {q(row['st'])} WHERE id = {q(row['id'])};")
        if row['id'] == ID['davi']:
            new = re.sub(r'(<p>\s*</p>)+$', '', row['pa'])
            assert new != row['pa']
            fwd.append(f"UPDATE devotionals SET practical_application = {q(new)} WHERE id = {q(row['id'])} AND practical_application = {q(row['pa'])};")
            rb.append(f"UPDATE devotionals SET practical_application = {q(row['pa'])} WHERE id = {q(row['id'])};")
    for row in snap['tr']:
        if row['d'] in (ID['perfume'], ID['marta']):
            new = strip_ref(row['st'])
            assert new and new != row['st'] and not re.search(r'\d+\.\d+', new), (row['id'], new)
            fwd.append(f"UPDATE devotional_translations SET scripture_text = {q(new)} WHERE id = {q(row['id'])} AND scripture_text = {q(row['st'])};")
            rb.append(f"UPDATE devotional_translations SET scripture_text = {q(row['st'])} WHERE id = {q(row['id'])};")
        if row['d'] == ID['davi'] and re.search(r'(<p>\s*</p>)+$', row['pa'] or ''):
            new = re.sub(r'(<p>\s*</p>)+$', '', row['pa'])
            fwd.append(f"UPDATE devotional_translations SET practical_application = {q(new)} WHERE id = {q(row['id'])} AND practical_application = {q(row['pa'])};")
            rb.append(f"UPDATE devotional_translations SET practical_application = {q(row['pa'])} WHERE id = {q(row['id'])};")
    # conferência final dentro da transação: os 75 guias com 3 títulos e nenhum UPDATE ficou para trás
    fwd += ['DO $$', 'DECLARE n int;', 'BEGIN',
            f"  SELECT count(*) INTO n FROM devotional_kids k WHERE k.devotional_id IN ({ids}) AND k.band IN ('4-6','7-10','11-13') AND k.language IN ('pt-BR','en','es','fr','it') AND (SELECT count(*) FROM regexp_split_to_table(k.adult_guide, E'\\n\\n') p WHERE length(split_part(p, E'\\n', 1)) <= 60 AND right(trim(split_part(p, E'\\n', 1)), 1) = ':') <> 3;",
            "  IF n <> 0 THEN RAISE EXCEPTION '% guias seguem fora do formato', n; END IF;", 'END $$;',
            f"SELECT band, count(*) AS versoes FROM devotional_kids WHERE devotional_id IN ({ids}) AND band IN ('4-6','7-10','11-13') GROUP BY 1 ORDER BY 1;", 'COMMIT;']
    rb += ['COMMIT;']
    return '\n'.join(fwd) + '\n', '\n'.join(rb) + '\n'


if __name__ == '__main__':
    snap = json.load(open(sys.argv[1]))
    a, b = build(snap)
    open(sys.argv[2], 'w').write(a)
    open(sys.argv[3], 'w').write(b)
    print('ok', a.count('UPDATE '), 'updates')
