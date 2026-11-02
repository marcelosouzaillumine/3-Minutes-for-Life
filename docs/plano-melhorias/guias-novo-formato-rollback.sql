-- Desfaz guias-novo-formato.sql: devolve os textos de antes (guias, prática, foco, versículos e aplicação).
\set ON_ERROR_STOP on
BEGIN;
UPDATE devotional_kids SET adult_guide = 'The central point is that the Bible is the standard for evaluating what we believe, including our own convictions. The saying in the activity is popular, but it is not in the Bible. If the preteen wants to talk, help them see that, according to Paul, we are accepted by faith and not by our own effort. If they question something learned at home or at church, treat the question as a sign of an active faith. Listen before correcting.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'El punto central es que la Biblia es el criterio para evaluar lo que creemos, incluidas nuestras propias convicciones. La frase de la actividad es un dicho popular y no está en la Biblia. Si el preadolescente quiere conversar, ayúdele a ver que, según Pablo, somos aceptados por la fe y no por nuestro propio esfuerzo. Si cuestiona algo aprendido en casa o en la iglesia, trate la pregunta como señal de una fe activa. Escuche antes de corregir.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'L''idée centrale est que la Bible est le critère pour évaluer ce que nous croyons, y compris nos propres convictions. La phrase de l''activité est populaire, mais elle n''est pas dans la Bible. Si le préadolescent veut en parler, aidez-le à percevoir que, selon Paul, nous sommes acceptés par la foi et non par nos propres efforts. S''il remet en question quelque chose appris à la maison ou à l''église, considérez sa question comme le signe d''une foi active. Écoutez avant de corriger.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Il punto centrale è che la Bibbia è il criterio per valutare ciò in cui crediamo, comprese le nostre convinzioni. Il detto dell''attività è popolare, ma non si trova nella Bibbia. Se il preadolescente vuole parlarne, aiutalo a capire che, secondo Paolo, siamo accettati per fede e non per il nostro sforzo. Se mette in discussione qualcosa imparato a casa o in chiesa, considera la sua domanda un segno di fede viva. Ascolta prima di correggere.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'O ponto central é que a Bíblia é o critério para avaliar o que cremos, inclusive nossas próprias convicções. A frase da atividade é popular e não está na Bíblia. Se o pré-adolescente quiser conversar, ajude-o a perceber que, segundo Paulo, somos aceitos pela fé e não pelo próprio esforço. Se ele questionar algo aprendido em casa ou na igreja, trate a pergunta como sinal de fé ativa. Ouça antes de corrigir.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'The central point is that the Bible shows us who God is. It was by reading the Bible that Luther rediscovered that God''s forgiveness is a gift. Do the gesture together with the child and help them tell the discovery in their own words. If the child can''t think of anyone who tells them Bible stories, offer to be that person.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'El punto central es que la Biblia nos muestra quién es Dios. Fue leyendo la Biblia que Lutero redescubrió que el perdón de Dios es un regalo. Haga el gesto junto con el niño o la niña y ayúdele a contar el descubrimiento con sus propias palabras. Si no recuerda a nadie que le cuente historias de la Biblia, ofrézcase para ser esa persona.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'L''idée centrale est que la Bible nous montre qui est Dieu. C''est en lisant la Bible que Luther a redécouvert que le pardon de Dieu est un cadeau. Faites le geste avec l''enfant et aidez-le à raconter la découverte avec ses propres mots. S''il ne se souvient de personne qui lui raconte des histoires de la Bible, proposez-vous pour être cette personne.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Il punto centrale è che la Bibbia ci mostra chi è Dio. È leggendo la Bibbia che Lutero ha riscoperto che il perdono di Dio è un dono. Fai il gesto insieme al bambino e aiutalo a raccontare la scoperta con parole sue. Se non ricorda nessuno che gli racconti storie della Bibbia, offriti di essere tu quella persona.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'O ponto central é que a Bíblia nos mostra quem Deus é. Foi lendo a Bíblia que Lutero redescobriu que o perdão de Deus é presente. Faça o gesto junto com a criança e ajude-a a contar a descoberta com as palavras dela. Se ela não lembrar de ninguém que lhe conte histórias da Bíblia, ofereça-se para ser essa pessoa.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'The central point is to keep going back to the Bible to check what we believe. That is how Luther rediscovered that God''s forgiveness is grace. When the child shares the discovery, ask why they think it was important for people at that time. If they mention videos or songs as sources, don''t dismiss them; show that the Bible is the place to check. Present Luther without disparaging Catholics or other churches.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'El punto central es volver siempre a la Biblia para comprobar lo que creemos. Así fue como Lutero redescubrió que el perdón de Dios es gracia. Cuando el niño o la niña le cuente el descubrimiento, pregúntele por qué cree que eso fue importante para las personas de aquella época. Si menciona videos o canciones como fuente, no los descalifique; muéstrele que la Biblia es el lugar para comprobar. Presente a Lutero sin descalificar a los católicos ni a otras iglesias.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'L''idée centrale est de toujours revenir à la Bible pour vérifier ce que nous croyons. C''est ainsi que Luther a redécouvert que le pardon de Dieu est grâce. Quand l''enfant raconte la découverte, demandez-lui pourquoi, selon lui, elle a été importante pour les gens de cette époque. S''il cite des vidéos ou des chansons comme source, ne les dénigrez pas ; montrez-lui que la Bible est l''endroit où vérifier. Présentez Luther sans dénigrer les catholiques ni d''autres Églises.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Il punto centrale è tornare sempre alla Bibbia per verificare ciò in cui crediamo. È così che Lutero ha riscoperto che il perdono di Dio è grazia. Quando il bambino racconta la scoperta, chiedigli perché, secondo lui, è stata importante per le persone di quel tempo. Se cita video o canzoni come fonte, non sminuirli; mostragli che la Bibbia è il luogo in cui verificare. Presenta Lutero senza sminuire i cattolici o altre chiese.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'O ponto central é voltar sempre à Bíblia para conferir o que cremos. Foi assim que Lutero redescobriu que o perdão de Deus é graça. Quando a criança contar a descoberta, pergunte por que ela acha que isso foi importante para as pessoas daquela época. Se ela citar vídeos ou músicas como fonte, não os desqualifique; mostre que a Bíblia é o lugar de conferir. Apresente Lutero sem desqualificar católicos ou outras igrejas.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Let your preteen read on their own and offer to talk afterward, without pushing. The main point is that reverence and joy belong together in worship, which can be expressed in different ways. Starting with something from your own experience helps keep the conversation from feeling like an interrogation.

Talk about it at the table:
Why was bringing the ark to Jerusalem so important to David?
How did David show reverence along the way?
Why did Michal and David see the same scene so differently?
What ways of worshiping God have you seen or experienced?

Family activity: each person picks a worship song they like and shares, in one sentence, why it means something to them. Listen to a bit of each one, with no pressure to sing. All you need is a phone or your memory; it takes about 15 minutes.

Family prayer: Lord, thank you that through Jesus we can live in your presence. Renew in us the joy of knowing you and teach us to honor you at home and wherever we go. In Jesus'' name, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Deje que el preadolescente lea solo y ofrézcase a conversar después, sin insistir. El punto central es que la reverencia y la alegría conviven en la adoración, que puede expresarse de formas diferentes. Empezar contando algo de su propia experiencia ayuda a que la conversación no se convierta en un interrogatorio.

Para conversar en la mesa:
¿Por qué era tan importante para David llevar el arca a Jerusalén?
¿Cómo mostró David reverencia durante el camino?
¿Por qué Mical y David vieron la misma escena de maneras tan diferentes?
¿Qué formas de adorar a Dios han visto o vivido?

Actividad en familia: cada uno elige una canción de alabanza que le guste y cuenta, en una frase, por qué tiene sentido para él. Escuchen un fragmento de cada una, sin obligación de cantar. Basta un celular o la memoria, y toma unos 15 minutos.

Oración en familia: Señor, gracias porque, por medio de Jesús, podemos vivir en tu presencia. Renueva en nosotros la alegría de conocerte y enséñanos a honrarte en casa y fuera de ella. En el nombre de Jesús, amén.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Laissez le préadolescent lire seul et proposez-lui d''en parler ensuite, sans insister. L''idée centrale est que la révérence et la joie coexistent dans l''adoration, qui peut s''exprimer de différentes manières. Commencer en racontant quelque chose de votre propre expérience aide la conversation à ne pas devenir un interrogatoire.

Pour en parler à table :
Pourquoi apporter l''arche à Jérusalem était-il si important pour David ?
Comment David a-t-il montré de la révérence pendant le trajet ?
Pourquoi Mical et David ont-ils vu la même scène de manière si différente ?
Quelles formes d''adoration avez-vous déjà vues ou vécues ?

Activité en famille : chacun choisit un chant de louange qu''il aime et dit, en une phrase, pourquoi il a du sens pour lui. Écoutez un extrait de chacun, sans obligation de chanter. Un téléphone ou la mémoire suffisent, et cela prend environ 15 minutes.

Prière en famille : Seigneur, merci parce que, par Jésus, nous pouvons vivre en ta présence. Renouvelle en nous la joie de te connaître et apprends-nous à t''honorer à la maison et ailleurs. Au nom de Jésus, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Lascia che il preadolescente legga da solo e offriti di parlarne dopo, senza insistere. Il punto centrale è che riverenza e gioia convivono nell''adorazione, che può esprimersi in modi diversi. Cominciare raccontando qualcosa della tua esperienza aiuta la conversazione a non diventare un interrogatorio.

Per parlarne a tavola:
Perché portare l''arca a Gerusalemme era così importante per Davide?
Come ha mostrato riverenza Davide durante il cammino?
Perché Mical e Davide hanno visto la stessa scena in modo così diverso?
Quali modi di adorare Dio avete già visto o vissuto?

Attività in famiglia: ognuno sceglie un canto di lode che gli piace e racconta, in una frase, perché ha significato per sé. Ascoltate un pezzo di ciascuno, senza obbligo di cantare. Basta un cellulare o la memoria, e ci vogliono circa 15 minuti.

Preghiera in famiglia: Signore, grazie perché, per mezzo di Gesù, possiamo vivere alla tua presenza. Rinnova in noi la gioia di conoscerti e insegnaci a onorarti a casa e fuori. Nel nome di Gesù, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Deixe que o pré-adolescente leia sozinho e ofereça-se para conversar depois, sem insistir. O ponto central é que reverência e alegria convivem na adoração, que pode se expressar de formas diferentes. Começar contando algo da sua própria experiência ajuda a conversa a não virar interrogatório.

Para conversar à mesa:
Por que levar a arca para Jerusalém era tão importante para Davi?
Como Davi mostrou reverência durante o caminho?
Por que Mical e Davi viram a mesma cena de jeitos tão diferentes?
Quais formas de adorar a Deus vocês já viram ou viveram?

Atividade em família: cada um escolhe uma música de louvor de que gosta e conta, em uma frase, por que ela faz sentido para si. Ouçam um trecho de cada, sem obrigação de cantar. Basta um celular ou a própria memória, e leva cerca de 15 minutos.

Oração em família: Senhor, obrigado porque, por meio de Jesus, podemos viver na tua presença. Renova em nós a alegria de te conhecer e ensina-nos a te honrar em casa e fora dela. Em nome de Jesus, amém.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Read slowly and, when you get to the dancing, invite your child to show with their body how David celebrated. The main point is simple: being with God fills us with joy. Welcome whatever your child says, without correcting them or asking them to repeat it.

Talk about it at the table:
Why was David so happy?
What did the ark remind the people of?
How can we show God that we are joyful?

Family activity: have a little parade through the house, like the people who followed the ark to Jerusalem. One person leads, everyone claps, and at each stop each person names one good thing God does. No materials needed; it takes about 10 minutes.

Family prayer: Lord, thank you for being with our family. Fill our home with the joy of knowing you. In Jesus'' name, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '4-6' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Lea despacio y, en la parte del baile, invite al niño a mostrar con el cuerpo cómo celebró David. El punto central es sencillo: estar con Dios nos llena de alegría. Acoja lo que el niño diga, sin corregirlo ni pedirle que lo repita.

Para conversar en la mesa:
¿Por qué estaba David tan feliz?
¿Qué le recordaba el arca al pueblo?
¿Cómo podemos mostrarle a Dios que estamos alegres?

Actividad en familia: hagan un pequeño desfile por la casa, como el pueblo que acompañó el arca hasta Jerusalén. Alguien va adelante, todos aplauden y, en cada parada, cada uno dice algo bueno que Dios hace. No se necesitan materiales y toma unos 10 minutos.

Oración en familia: Señor, gracias por estar con nuestra familia. Llena nuestra casa de la alegría de conocerte. En el nombre de Jesús, amén.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '4-6' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Lisez lentement et, au moment de la danse, invitez l''enfant à montrer avec son corps comment David a célébré. L''idée centrale est simple : être avec Dieu nous remplit de joie. Accueillez ce que l''enfant dit, sans le corriger ni lui demander de répéter.

Pour en parler à table :
Pourquoi David était-il si heureux ?
Que rappelait l''arche au peuple ?
Comment pouvons-nous montrer à Dieu que nous sommes dans la joie ?

Activité en famille : faites un petit défilé dans la maison, comme le peuple qui a accompagné l''arche jusqu''à Jérusalem. Quelqu''un marche devant, tout le monde tape dans les mains et, à chaque arrêt, chacun dit une bonne chose que Dieu fait. Aucun matériel n''est nécessaire, et cela prend environ 10 minutes.

Prière en famille : Seigneur, merci d''être avec notre famille. Remplis notre maison de la joie de te connaître. Au nom de Jésus, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '4-6' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Leggi lentamente e, nella parte della danza, invita il bambino a mostrare con il corpo come Davide ha festeggiato. Il punto centrale è semplice: stare con Dio ci riempie di gioia. Accogli quello che il bambino dice, senza correggerlo né chiedergli di ripetere.

Per parlarne a tavola:
Perché Davide era così felice?
Che cosa ricordava l''arca al popolo?
Come possiamo mostrare a Dio che siamo nella gioia?

Attività in famiglia: fate una piccola sfilata per casa, come il popolo che ha accompagnato l''arca fino a Gerusalemme. Qualcuno va avanti, tutti battono le mani e, a ogni sosta, ognuno dice una cosa bella che Dio fa. Non serve materiale e ci vogliono circa 10 minuti.

Preghiera in famiglia: Signore, grazie perché sei con la nostra famiglia. Riempi la nostra casa della gioia di conoscerti. Nel nome di Gesù, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '4-6' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Leia devagar e, na parte da dança, convide a criança a mostrar com o corpo como Davi celebrou. O ponto central é simples: estar com Deus nos deixa alegres. Acolha o que a criança disser, sem corrigir nem pedir que repita.

Para conversar à mesa:
Por que Davi estava tão feliz?
O que a arca lembrava ao povo?
De que jeito a gente pode mostrar a Deus que está alegre?

Atividade em família: façam um pequeno desfile pela casa, como o povo que acompanhou a arca até Jerusalém. Alguém vai na frente, todos batem palmas e, a cada parada, cada um diz uma coisa boa que Deus faz. Não precisa de material e leva cerca de 10 minutos.

Oração em família: Senhor, obrigado por estar com a nossa família. Enche nossa casa da alegria de te conhecer. Em nome de Jesus, amém.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Read together or let your child read alone, then talk about it. Help them see that, in this story, respect and joy go hand in hand.

Talk about it at the table:
What did the ark remind the people of Israel about?
How did David show respect for God while the ark was being carried?
Why didn''t David let Michal''s opinion take away his joy?
What is one way to show joy in God in everyday life?

Family activity: retell the story by acting out three scenes without words: the ark being carried carefully, the celebration with shouts and trumpets, and David dancing while Michal watches from the window. Everyone picks a role. No materials needed; it takes about 10 minutes.

Family prayer: Lord, you are holy and good. Thank you that we can be close to you. Teach our family to worship you with respect and joy. In Jesus'' name, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '7-10' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Lea junto con el niño o déjelo leer solo, y conversen después. Ayúdelo a percibir que, en esta historia, el respeto y la alegría van de la mano.

Para conversar en la mesa:
¿Qué le recordaba el arca al pueblo de Israel?
¿Cómo mostró David respeto a Dios mientras llevaban el arca?
¿Por qué David no dejó que la opinión de Mical le quitara la alegría?
¿Cuál es una manera de mostrar alegría en Dios en el día a día?

Actividad en familia: vuelvan a contar la historia representando tres escenas sin palabras: el arca llevada con cuidado, la fiesta con gritos y trompetas, y David danzando mientras Mical observa desde la ventana. Cada uno elige un papel. No se necesitan materiales y toma unos 10 minutos.

Oración en familia: Señor, tú eres santo y bueno. Gracias porque podemos estar cerca de ti. Enseña a nuestra familia a adorarte con respeto y alegría. En el nombre de Jesús, amén.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '7-10' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Lisez avec l''enfant ou laissez-le lire seul, puis parlez-en ensemble. Aidez-le à percevoir que, dans cette histoire, le respect et la joie vont de pair.

Pour en parler à table :
Que rappelait l''arche au peuple d''Israël ?
Comment David a-t-il montré du respect envers Dieu pendant le transport de l''arche ?
Pourquoi David n''a-t-il pas laissé l''avis de Mical lui enlever sa joie ?
Quelle est une façon de montrer de la joie en Dieu au quotidien ?

Activité en famille : racontez à nouveau l''histoire en jouant trois scènes sans paroles : l''arche transportée avec soin, la fête avec des cris et des trompettes, et David qui danse pendant que Mical observe par la fenêtre. Chacun choisit un rôle. Aucun matériel n''est nécessaire, et cela prend environ 10 minutes.

Prière en famille : Seigneur, tu es saint et bon. Merci parce que nous pouvons être près de toi. Apprends à notre famille à t''adorer avec respect et joie. Au nom de Jésus, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '7-10' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Leggi insieme al bambino o lascia che legga da solo, poi parlatene. Aiutalo a capire che, in questa storia, rispetto e gioia vanno di pari passo.

Per parlarne a tavola:
Che cosa ricordava l''arca al popolo d''Israele?
Come ha mostrato rispetto verso Dio Davide mentre l''arca veniva portata?
Perché Davide non ha lasciato che l''opinione di Mical gli togliesse la gioia?
Qual è un modo per mostrare gioia in Dio nella vita di tutti i giorni?

Attività in famiglia: raccontate di nuovo la storia recitando tre scene senza parole: l''arca portata con cura, la festa con grida e trombe, e Davide che danza mentre Mical guarda dalla finestra. Ognuno sceglie un ruolo. Non serve materiale e ci vogliono circa 10 minuti.

Preghiera in famiglia: Signore, tu sei santo e buono. Grazie perché possiamo stare vicino a te. Insegna alla nostra famiglia ad adorarti con rispetto e gioia. Nel nome di Gesù, amen.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '7-10' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Leia junto ou deixe a criança ler sozinha e conversem em seguida. Ajude-a a perceber que, na história, respeito e alegria caminham juntos.

Para conversar à mesa:
O que a arca lembrava ao povo de Israel?
Como Davi mostrou respeito a Deus enquanto a arca era levada?
Por que Davi não deixou a opinião de Mical tirar a alegria dele?
Qual é um jeito de mostrar alegria em Deus no dia a dia?

Atividade em família: recontem a história encenando três cenas sem falas: a arca sendo levada com cuidado, a festa com gritos e trombetas, e Davi dançando enquanto Mical observa da janela. Cada um escolhe um papel. Não precisa de material e leva uns 10 minutos.

Oração em família: Senhor, tu és santo e bom. Obrigado porque podemos estar perto de ti. Ensina nossa família a te adorar com respeito e alegria. Em nome de Jesus, amém.', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Listen without asking for names or access to your preteen''s messages. Explore how correcting a wrong and respecting a person can go together. Emphasize that Jesus'' mercy calls us to repentance, including when we take part in humiliating someone. Don''t demand an immediate reconciliation or restored trust. If your child tells you about bullying or violence, offer protection and support.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Escuche sin pedir nombres ni acceso a los mensajes del preadolescente. Exploren cómo corregir un error y respetar a una persona pueden ir de la mano. Refuerce que la misericordia de Jesús nos llama al arrepentimiento, incluso cuando participamos en una humillación. No exija una reconciliación inmediata ni que se restablezca la confianza. Si hay un relato de acoso o violencia, ofrezca protección y acompañamiento.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Écoutez sans demander de noms ni l''accès aux messages du préadolescent. Explorez ensemble comment corriger une faute et respecter une personne peuvent aller de pair. Soulignez que la miséricorde de Jésus nous appelle à la repentance, y compris lorsque nous participons à une humiliation. N''exigez pas une réconciliation immédiate ni le rétablissement de la confiance. S''il vous parle de harcèlement ou de violence, offrez protection et accompagnement.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Ascolta senza chiedere nomi o accesso ai messaggi del preadolescente. Esplorate insieme come correggere uno sbaglio e rispettare una persona possano andare di pari passo. Sottolinea che la misericordia di Gesù ci chiama al ravvedimento, anche quando partecipiamo a un''umiliazione. Non pretendere una riconciliazione immediata o il ritorno della fiducia. Se ti racconta di bullismo o violenza, offri protezione e accompagnamento.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Escute sem pedir nomes ou acesso às mensagens do adolescente. Explore como corrigir um erro e respeitar uma pessoa podem caminhar juntos. Reforce que a misericórdia de Jesus nos chama ao arrependimento, inclusive quando participamos de uma humilhação. Não exija reaproximação imediata ou restauração da confiança. Se houver relato de perseguição ou violência, ofereça proteção e acompanhamento.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'While your child draws, go over what happened: Jesus called, Levi followed him and then welcomed him into his home. Explain "sin" with a simple example, like lying or hurting someone on purpose. Say that we all need Jesus'' forgiveness and help. At your next meal, remember the story together, without asking your child for answers or confessions.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '4-6' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Mientras el niño dibuja, repase lo que pasó: Jesús llamó, Leví lo siguió y después lo recibió en su casa. Explique "pecado" con un ejemplo sencillo, como mentir o lastimar a alguien a propósito. Dígale que todos necesitamos el perdón y la ayuda de Jesús. En la próxima comida, recuerden juntos la historia, sin exigirle al niño respuestas ni confesiones.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '4-6' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Pendant que l''enfant dessine, reprenez ce qui s''est passé : Jésus a appelé, Lévi l''a suivi, puis l''a reçu chez lui. Expliquez le mot « péché » avec un exemple simple, comme mentir ou faire mal à quelqu''un exprès. Dites que nous avons tous besoin du pardon et de l''aide de Jésus. Au prochain repas, rappelez-vous l''histoire ensemble, sans exiger de réponses ni de confessions de l''enfant.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '4-6' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Mentre il bambino disegna, riprendi quello che è successo: Gesù ha chiamato, Levi lo ha seguito e poi lo ha accolto in casa. Spiega la parola "peccato" con un esempio semplice, come dire una bugia o fare male a qualcuno apposta. Di'' che tutti abbiamo bisogno del perdono e dell''aiuto di Gesù. Al prossimo pasto, ricordate insieme la storia, senza pretendere dal bambino risposte o confessioni.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '4-6' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Enquanto a criança desenha, retome as ações: Jesus chamou, Levi o seguiu e depois o recebeu em casa. Explique “pecado” com um exemplo simples, como mentir ou machucar alguém de propósito. Diga que todos precisamos do perdão e da ajuda de Jesus. Na próxima refeição, relembrem juntos a história, sem exigir respostas ou confissões da criança.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Help your child follow the sequence before explaining the comparison with the doctor: Jesus comes close because people need him. In the game situation, talk about telling the truth, making things right and stopping name-calling. Saying sorry doesn''t erase the consequences or require a friendship. Avoid dividing the family into those who "need Jesus" and those who "are already good."', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '7-10' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Ayude al niño a seguir la secuencia antes de explicar la comparación con el médico: Jesús se acerca porque las personas lo necesitan. En la situación del juego, conversen sobre decir la verdad, reparar el error y detener los apodos. Pedir perdón no elimina las consecuencias ni obliga a mantener una amistad. Evite dividir a la familia entre quienes "necesitan a Jesús" y quienes "ya son buenos".', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '7-10' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Aidez l''enfant à suivre la séquence avant d''expliquer la comparaison avec le médecin : Jésus s''approche parce que les gens ont besoin de lui. À propos de la situation du jeu, parlez de dire la vérité, de réparer la faute et de faire cesser les surnoms. Demander pardon n''efface pas les conséquences et n''oblige pas à rester amis. Évitez de diviser la famille entre ceux qui « ont besoin de Jésus » et ceux qui « sont déjà bons ».', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '7-10' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Aiuta il bambino a seguire la sequenza prima di spiegare il paragone con il medico: Gesù si avvicina perché le persone hanno bisogno di lui. Sulla situazione del gioco, parlate di dire la verità, rimediare allo sbaglio e smettere con i soprannomi. Chiedere scusa non cancella le conseguenze né obbliga a un''amicizia. Evita di dividere la famiglia tra chi "ha bisogno di Gesù" e chi "è già buono".', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '7-10' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Ajude a criança a acompanhar a sequência antes de explicar a comparação com o médico: Jesus se aproxima porque as pessoas precisam dele. Na situação da brincadeira, conversem sobre contar a verdade, reparar o erro e interromper apelidos. Pedir desculpas não elimina as consequências nem obriga uma amizade. Evite separar a família entre quem “precisa de Jesus” e quem “já é bom”.', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Give the preteen space to reflect without having to share personal situations. If they want to talk, listen before guiding. Help them connect forgiveness with gratitude and responsibility, remembering that repairing harm may take time and help. Care for the one who did wrong must go hand in hand with protecting the one who was hurt.

Talking at the table:
Why did Simon find it hard to understand the woman''s actions?
In what kinds of situations is it easier to justify a mistake than to admit it?
What changes when we remember that we also need forgiveness?
How can we respond to someone''s mistake without humiliating them or ignoring the person who was hurt?

Family activity: Each person writes on a piece of paper, just for themselves, a common excuse we use to avoid admitting a mistake, without mentioning real people or situations. Then try rewriting that sentence as someone who takes responsibility. No one has to show what they wrote. Uses paper and pen and takes about 10 minutes.

Family prayer: Jesus, thank you that your forgiveness reaches our lives. Teach us to admit our mistakes honestly and to treat one another with patience and truth. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Dé espacio para que el preadolescente reflexione sin necesidad de exponer situaciones personales. Si quiere conversar, escuche antes de orientar. Ayúdelo a relacionar el perdón con la gratitud y la responsabilidad, recordando que reparar un daño puede requerir tiempo y ayuda. El cuidado de quien se equivocó debe ir de la mano de la protección de quien fue herido.

Para conversar a la mesa:
¿Por qué a Simón le costaba entender la actitud de la mujer?
¿En qué tipo de situación es más fácil justificar un error que admitirlo?
¿Qué cambia cuando recordamos que también necesitamos perdón?
¿Cómo reaccionar ante el error de alguien sin humillarlo ni ignorar a quien fue herido?

Actividad en familia: Cada persona escribe en un papel, solo para sí, una excusa común que usamos para no admitir un error, sin mencionar personas ni situaciones reales. Luego intenten reescribir esa frase como alguien que asume la responsabilidad. Nadie necesita mostrar lo que escribió. Usa papel y bolígrafo y dura unos 10 minutos.

Oración en familia: Jesús, gracias porque tu perdón alcanza nuestra vida. Enséñanos a admitir nuestros errores con sinceridad y a tratarnos unos a otros con paciencia y verdad. Amén.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Laissez au préadolescent l''espace pour réfléchir sans devoir exposer de situations personnelles. S''il veut en parler, écoutez avant d''orienter. Aidez-le à relier le pardon à la reconnaissance et à la responsabilité, en rappelant que réparer un tort peut demander du temps et de l''aide. Le soin de celui qui a fauté doit aller de pair avec la protection de celui qui a été blessé.

Pour discuter à table :
Pourquoi Simon avait-il du mal à comprendre l''attitude de la femme ?
Dans quelles situations est-il plus facile de justifier une erreur que de l''admettre ?
Qu''est-ce qui change quand nous nous rappelons que nous aussi avons besoin de pardon ?
Comment réagir à l''erreur de quelqu''un sans l''humilier ni ignorer celui qui a été blessé ?

Activité en famille : Chacun écrit sur un papier, pour lui seul, une excuse courante que nous utilisons pour ne pas admettre une erreur, sans citer de personnes ni de situations réelles. Ensuite, essayez de réécrire cette phrase comme quelqu''un qui assume sa responsabilité. Personne n''est obligé de montrer ce qu''il a écrit. Avec du papier et un stylo ; environ 10 minutes.

Prière en famille : Jésus, merci parce que ton pardon atteint notre vie. Apprends-nous à admettre nos erreurs avec sincérité et à nous traiter les uns les autres avec patience et vérité. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Lasciate al preadolescente lo spazio per riflettere senza dover esporre situazioni personali. Se vuole parlarne, ascoltate prima di orientare. Aiutatelo a collegare il perdono alla gratitudine e alla responsabilità, ricordando che riparare un danno può richiedere tempo e aiuto. La cura per chi ha sbagliato deve andare insieme alla protezione di chi è stato ferito.

Per parlarne a tavola:
Perché Simone faceva fatica a capire l''atteggiamento della donna?
In quali situazioni è più facile giustificare uno sbaglio che ammetterlo?
Che cosa cambia quando ricordiamo che anche noi abbiamo bisogno di perdono?
Come reagire allo sbaglio di qualcuno senza umiliarlo né ignorare chi è stato ferito?

Attività in famiglia: Ognuno scrive su un foglio, solo per sé, una scusa comune che usiamo per non ammettere uno sbaglio, senza citare persone o situazioni reali. Poi provate a riscrivere quella frase come qualcuno che si assume la responsabilità. Nessuno deve mostrare ciò che ha scritto. Servono carta e penna e dura circa 10 minuti.

Preghiera in famiglia: Gesù, grazie perché il tuo perdono raggiunge la nostra vita. Insegnaci ad ammettere i nostri sbagli con sincerità e a trattarci gli uni gli altri con pazienza e verità. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Dê espaço para que o adolescente reflita sem precisar expor situações pessoais. Se ele quiser conversar, escute antes de orientar. Ajude-o a relacionar o perdão à gratidão e à responsabilidade, lembrando que reparar um dano pode exigir tempo e ajuda. O cuidado com quem errou deve caminhar junto da proteção de quem foi ferido.

Para conversar à mesa:
Por que Simão tinha dificuldade de entender a atitude da mulher?
Em que tipo de situação é mais fácil justificar um erro do que admiti-lo?
O que muda quando lembramos que também precisamos de perdão?
Como reagir ao erro de alguém sem humilhar a pessoa nem ignorar quem foi ferido?

Atividade em família: Cada pessoa escreve em um papel, só para si, uma desculpa comum que usamos para não admitir um erro, sem citar pessoas ou situações reais. Em seguida, tentem reescrever essa frase como alguém que assume a responsabilidade. Ninguém precisa mostrar o que escreveu. Usa papel e caneta e leva cerca de 10 minutos.

Oração em família: Jesus, obrigado porque teu perdão alcança nossa vida. Ensina-nos a admitir nossos erros com sinceridade e a tratar uns aos outros com paciência e verdade. Amém.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Follow the order of the woman''s gestures, helping the child notice that she cared for Jesus with love. As you connect the story to prayer, explain that we all need forgiveness. The caring gesture suggested is a response of thankfulness, not a way of paying. Welcome the child''s participation, even if they prefer just to listen.

Talking at the table:
What did the woman do to care for Jesus?
What did Jesus say to her at the end?
How can we thank Jesus today?

Family activity: Retell the story together using your hands to show each of the woman''s gestures: crying, drying his feet, kissing and pouring perfume. Then each person shares one way to care for someone at home today. No materials needed; it takes about 5 minutes.

Family prayer: Jesus, thank you for forgiving our mistakes. Teach our family to love you and to care for one another. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Acompañe la secuencia de los gestos de la mujer, ayudando al niño a percibir que ella cuidó de Jesús con amor. Al relacionar la historia con la oración, explique que todos necesitamos perdón. El gesto de cuidado propuesto es una respuesta de gratitud, no funciona como pago. Acoja la participación del niño, aunque prefiera solo escuchar.

Para conversar a la mesa:
¿Qué hizo la mujer para cuidar de Jesús?
¿Qué le dijo Jesús al final?
¿De qué manera podemos agradecer a Jesús hoy?

Actividad en familia: Vuelvan a contar juntos la historia usando las manos para mostrar cada gesto de la mujer: llorar, secar los pies, besar y poner perfume. Después, cada persona cuenta una manera de cuidar de alguien en casa hoy. No necesita materiales y dura unos 5 minutos.

Oración en familia: Jesús, gracias porque perdonas nuestros errores. Enseña a nuestra familia a amarte y a cuidarnos unos a otros. Amén.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Suivez l''ordre des gestes de la femme, en aidant l''enfant à remarquer qu''elle a pris soin de Jésus avec amour. En reliant l''histoire à la prière, expliquez que nous avons tous besoin de pardon. Le geste d''attention proposé est une réponse de reconnaissance, et non un paiement. Accueillez la participation de l''enfant, même s''il préfère seulement écouter.

Pour discuter à table :
Qu''a fait la femme pour prendre soin de Jésus ?
Qu''est-ce que Jésus lui a dit à la fin ?
Comment pouvons-nous dire merci à Jésus aujourd''hui ?

Activité en famille : Racontez de nouveau l''histoire ensemble en utilisant vos mains pour montrer chaque geste de la femme : pleurer, essuyer les pieds, embrasser et verser le parfum. Ensuite, chacun dit une façon de prendre soin de quelqu''un à la maison aujourd''hui. Aucun matériel nécessaire ; environ 5 minutes.

Prière en famille : Jésus, merci de pardonner nos erreurs. Apprends à notre famille à t''aimer et à prendre soin les uns des autres. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Seguite la sequenza dei gesti della donna, aiutando il bambino a notare che lei si è presa cura di Gesù con amore. Collegando la storia alla preghiera, spiegate che tutti abbiamo bisogno di perdono. Il gesto di cura proposto è una risposta di gratitudine, non un pagamento. Accogliete la partecipazione del bambino, anche se preferisce soltanto ascoltare.

Per parlarne a tavola:
Che cosa ha fatto la donna per prendersi cura di Gesù?
Che cosa le ha detto Gesù alla fine?
In che modo possiamo ringraziare Gesù oggi?

Attività in famiglia: Raccontate di nuovo insieme la storia usando le mani per mostrare ogni gesto della donna: piangere, asciugare i piedi, baciare e versare il profumo. Poi ognuno dice un modo per prendersi cura di qualcuno in casa oggi. Non servono materiali e dura circa 5 minuti.

Preghiera in famiglia: Gesù, grazie perché perdoni i nostri sbagli. Insegna alla nostra famiglia ad amarti e a prenderci cura gli uni degli altri. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Acompanhe a sequência dos gestos da mulher, ajudando a criança a perceber que ela cuidou de Jesus com amor. Ao relacionar a história à oração, explique que todos precisamos de perdão. O gesto de cuidado proposto é uma resposta de gratidão, sem funcionar como pagamento. Acolha a participação da criança, mesmo que ela prefira apenas ouvir.

Para conversar à mesa:
O que a mulher fez para cuidar de Jesus?
O que Jesus disse para ela no final?
De que jeito podemos agradecer a Jesus hoje?

Atividade em família: Recontem juntos a história usando as mãos para mostrar cada gesto da mulher: chorar, enxugar os pés, beijar e passar perfume. Depois, cada pessoa conta um jeito de cuidar de alguém em casa hoje. Não precisa de materiais e leva cerca de 5 minutos.

Oração em família: Jesus, obrigado porque perdoas nossos erros. Ensina nossa família a te amar e a cuidar uns dos outros. Amém.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'When talking about the debts, explain that both men depended on forgiveness because neither could pay. Connect this need to our life with Jesus, without comparing the mistakes of people in the family. Then help the child notice how gratitude can guide a concrete action. Avoid asking for personal stories or a specific show of emotion.

Talking at the table:
Why couldn''t either of the two men solve his debt on his own?
What did Simon think about the woman, and what did Jesus want him to see?
What excuses do we usually give when we do something wrong?
How can gratitude for forgiveness change a choice we make today?

Family activity: Use two objects of different sizes, such as a mug and a spoon, to stand for the two debts. Remove both from the table at the same time, showing that the lender canceled both. Talk about what each debtor might have felt. Uses household objects and takes about 10 minutes.

Family prayer: Jesus, thank you for forgiving what we cannot pay. Help us take responsibility for our mistakes and show our gratitude by caring for one another. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Al conversar sobre las deudas, explique que los dos hombres dependían del perdón porque ninguno podía pagar. Relacione esa necesidad con nuestra vida con Jesús, sin comparar los errores de las personas de la familia. Después, ayude al niño a percibir cómo la gratitud puede orientar una actitud concreta. Evite exigir relatos personales o una demostración específica de emoción.

Para conversar a la mesa:
¿Por qué ninguno de los dos hombres podía resolver su deuda solo?
¿Qué pensaba Simón de la mujer, y qué quería Jesús que él percibiera?
¿Qué excusas solemos dar cuando hacemos algo malo?
¿Cómo puede la gratitud por el perdón cambiar una decisión de hoy?

Actividad en familia: Usen dos objetos de tamaños diferentes, como una taza y una cuchara, para representar las dos deudas. Retírenlos de la mesa al mismo tiempo, mostrando que el acreedor perdonó ambas. Conversen sobre lo que cada deudor pudo haber sentido. Usa objetos de casa y dura unos 10 minutos.

Oración en familia: Jesús, gracias porque perdonas lo que no podemos pagar. Ayúdanos a asumir nuestros errores y a mostrar nuestra gratitud cuidándonos unos a otros. Amén.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'En parlant des dettes, expliquez que les deux hommes dépendaient du pardon parce qu''aucun ne pouvait payer. Reliez ce besoin à notre vie avec Jésus, sans comparer les erreurs des membres de la famille. Aidez ensuite l''enfant à percevoir comment la reconnaissance peut orienter une action concrète. Évitez d''exiger des récits personnels ou une manifestation particulière d''émotion.

Pour discuter à table :
Pourquoi aucun des deux hommes ne pouvait-il régler sa dette tout seul ?
Que pensait Simon de la femme, et que voulait Jésus qu''il comprenne ?
Quelles excuses donnons-nous souvent quand nous faisons quelque chose de mal ?
Comment la reconnaissance pour le pardon peut-elle changer un choix d''aujourd''hui ?

Activité en famille : Utilisez deux objets de tailles différentes, comme une tasse et une cuillère, pour représenter les deux dettes. Retirez-les de la table en même temps, pour montrer que le créancier a remis les deux. Parlez de ce que chaque débiteur a pu ressentir. Avec des objets de la maison ; environ 10 minutes.

Prière en famille : Jésus, merci de pardonner ce que nous ne pouvons pas payer. Aide-nous à assumer nos erreurs et à montrer notre reconnaissance en prenant soin les uns des autres. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Parlando dei debiti, spiegate che i due uomini dipendevano dal perdono perché nessuno dei due poteva pagare. Collegate questo bisogno alla nostra vita con Gesù, senza confrontare gli sbagli delle persone di famiglia. Poi aiutate il bambino a notare come la gratitudine può orientare un gesto concreto. Evitate di chiedere racconti personali o una particolare manifestazione di emozione.

Per parlarne a tavola:
Perché nessuno dei due uomini poteva risolvere il suo debito da solo?
Che cosa pensava Simone della donna, e che cosa voleva Gesù che capisse?
Quali scuse diamo di solito quando facciamo qualcosa di sbagliato?
Come può la gratitudine per il perdono cambiare una scelta di oggi?

Attività in famiglia: Usate due oggetti di dimensioni diverse, come una tazza e un cucchiaio, per rappresentare i due debiti. Toglieteli dal tavolo nello stesso momento, mostrando che il creditore li ha condonati entrambi. Parlate di ciò che ciascun debitore può aver provato. Si usano oggetti di casa e dura circa 10 minuti.

Preghiera in famiglia: Gesù, grazie perché perdoni ciò che non possiamo pagare. Aiutaci ad assumerci i nostri sbagli e a mostrare la nostra gratitudine prendendoci cura gli uni degli altri. Amen.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Ao conversar sobre as dívidas, explique que os dois homens dependiam do perdão porque nenhum podia pagar. Relacione essa necessidade à nossa vida com Jesus, sem comparar os erros das pessoas da família. Depois, ajude a criança a perceber como a gratidão pode orientar uma atitude concreta. Evite exigir relatos pessoais ou uma demonstração específica de emoção.

Para conversar à mesa:
Por que nenhum dos dois homens conseguia resolver sua dívida sozinho?
O que Simão pensava sobre a mulher, e o que Jesus queria que ele percebesse?
Que desculpas costumamos dar quando fazemos algo errado?
Como a gratidão pelo perdão pode mudar uma escolha de hoje?

Atividade em família: Usem dois objetos de tamanhos diferentes, como uma caneca e uma colher, para representar as duas dívidas. Retirem os dois da mesa ao mesmo tempo, mostrando que o credor perdoou ambas. Conversem sobre o que cada devedor pode ter sentido. Usa objetos de casa e leva cerca de 10 minutos.

Oração em família: Jesus, obrigado porque perdoas o que não conseguimos pagar. Ajuda-nos a assumir nossos erros e a mostrar nossa gratidão cuidando uns dos outros. Amém.', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Offer your company without demanding access to their prayer or to what they wrote. If a question comes up, listen before explaining. Help the preteen see that knowing Jesus involves trust, learning and room for honest doubts. Avoid measuring this time by how long they stay quiet, the emotion they show or how much they manage to say.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Ofrezca compañía sin exigir acceso a la oración ni a lo que fue escrito. Si surge una pregunta, escuche antes de explicar. Ayude al preadolescente a percibir que conocer a Jesús implica confianza, aprendizaje y espacio para dudas sinceras. Evite medir este encuentro por el tiempo de silencio, por la emoción demostrada o por la cantidad de cosas que logra decir.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Offrez votre présence sans exiger d''avoir accès à sa prière ou à ce qu''il a écrit. Si une question surgit, écoutez avant d''expliquer. Aidez le préadolescent à percevoir que connaître Jésus implique la confiance, l''apprentissage et de la place pour des doutes sincères. Évitez de mesurer ce moment au temps de silence, à l''émotion manifestée ou à la quantité de choses qu''il parvient à dire.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Offrite compagnia senza pretendere di accedere alla sua preghiera o a ciò che ha scritto. Se nasce una domanda, ascoltate prima di spiegare. Aiutate il preadolescente a capire che conoscere Gesù comporta fiducia, apprendimento e spazio per dubbi sinceri. Evitate di misurare questo incontro dal tempo di silenzio, dall''emozione mostrata o dalla quantità di cose che riesce a dire.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Ofereça companhia sem exigir acesso à oração ou ao que foi escrito. Se surgir uma pergunta, escute antes de explicar. Ajude o adolescente a perceber que conhecer Jesus envolve confiança, aprendizado e espaço para dúvidas sinceras. Evite medir esse encontro pelo tempo de silêncio, pela emoção demonstrada ou pela quantidade de coisas que ele consegue dizer.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Tell a short, familiar story, letting the child comment or ask questions. The purpose is to share a pleasant time centered on Jesus, without testing their memory. When you return to Martha and Mary, explain that preparing the house was important, but Jesus also wanted to be listened to. Avoid comparing siblings or requiring the child to sit perfectly still.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Cuente una historia breve y conocida, permitiendo que el niño comente o haga preguntas. El propósito es compartir un tiempo agradable en torno a Jesús, sin poner a prueba la memoria. Al volver a Marta y María, explique que preparar la casa era importante, pero Jesús también quería ser escuchado. Evite comparar hermanos o exigir que el niño se quede inmóvil.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Racontez une histoire courte et connue, en laissant l''enfant faire des commentaires ou poser des questions. Le but est de partager un moment agréable autour de Jésus, sans tester sa mémoire. En revenant à Marthe et Marie, expliquez que préparer la maison était important, mais que Jésus voulait aussi être écouté. Évitez de comparer les frères et sœurs ou d''exiger que l''enfant reste immobile.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Raccontate una storia breve e conosciuta, lasciando che il bambino commenti o faccia domande. Lo scopo è condividere un momento piacevole attorno a Gesù, senza mettere alla prova la memoria. Tornando a Marta e Maria, spiegate che preparare la casa era importante, ma Gesù voleva anche essere ascoltato. Evitate di fare paragoni tra fratelli o di pretendere che il bambino stia immobile.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Conte uma história breve e conhecida, permitindo que a criança comente ou faça perguntas. O propósito é compartilhar um tempo agradável em torno de Jesus, sem testar a memória. Ao retomar Marta e Maria, explique que preparar a casa era importante, mas Jesus também queria ser ouvido. Evite comparar irmãos ou exigir que a criança fique imóvel.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET adult_guide = 'Receive the question with interest, without feeling you need an immediate answer. Share something you appreciate about Jesus and explain how his word helps you. Keep the joy of discovery alive. The passage values the disciple''s listening, without belittling the work of those who care for the home or turning Martha and Mary into fixed personality types.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language = 'en';
UPDATE devotional_kids SET adult_guide = 'Reciba la pregunta con interés, sin sentir que necesita tener una respuesta inmediata. Comparta algo que usted aprecia de Jesús y explique cómo su palabra lo ayuda. Preserve el gusto por el descubrimiento. El pasaje valora la escucha del discípulo, sin menospreciar el trabajo de quien cuida de la casa ni convertir a Marta y María en modelos fijos de personalidad.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language = 'es';
UPDATE devotional_kids SET adult_guide = 'Accueillez la question avec intérêt, sans vous sentir obligé d''avoir une réponse immédiate. Partagez quelque chose que vous appréciez chez Jésus et expliquez comment sa parole vous aide. Préservez le plaisir de la découverte. Le passage valorise l''écoute du disciple, sans déprécier le travail de ceux qui prennent soin de la maison ni faire de Marthe et Marie des modèles figés de personnalité.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language = 'fr';
UPDATE devotional_kids SET adult_guide = 'Accogliete la domanda con interesse, senza sentire di dover avere una risposta immediata. Condividete qualcosa che apprezzate di Gesù e spiegate come la sua parola vi aiuta. Custodite il piacere della scoperta. Il brano valorizza l''ascolto del discepolo, senza sminuire il lavoro di chi si prende cura della casa né trasformare Marta e Maria in modelli fissi di personalità.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language = 'it';
UPDATE devotional_kids SET adult_guide = 'Receba a pergunta com interesse, sem sentir que precisa ter uma resposta imediata. Compartilhe algo que você aprecia em Jesus e explique como sua palavra ajuda você. Preserve o prazer da descoberta. A passagem valoriza a escuta do discípulo, sem desmerecer o trabalho de quem cuida da casa ou transformar Marta e Maria em modelos fixos de personalidade.', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET practice = 'Junte as mãos abertas, como se fossem uma Bíblia aberta, e diga com o adulto: “Deus me perdoa, é isso é um presente Dele para mim.” Depois, conte essa descoberta de Lutero para alguém da casa.', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET story = '{"image": "/ilustracoes/marta-e-maria/quadros/faixa-11-13-2.webp", "quote": "Maria escolheu a boa parte, e ela não lhe será tirada.", "setup": "Uma aldeia, a casa de Marta. Você é Marta. Jesus acabou de chegar, e há muito a fazer. Sua irmã Maria se sentou para ouvi-lo, e você está sozinha na cozinha.", "today": "Hoje, tarefas, telas e agenda disputam nossa atenção, até para coisas boas. Ouvir Jesus não compete com servir: é o que dá sentido ao serviço.", "format": "dilemma", "options": ["Reclamar com Maria", "Pedir ajuda a Jesus", "Largar tudo e sentar para ouvir"], "outcome": "Marta levou a queixa a Jesus. Ele a chamou pelo nome, falou das muitas preocupações que a deixavam inquieta e disse que Maria tinha escolhido a boa parte. Marta queria oferecer algo a Jesus, e ele a ajudou a ver o que ela também precisava receber.", "question": "O que você faria?", "todayQuestion": "O que você poderia pausar hoje para ficar um tempo com Jesus?", "outcomeQuestion": "O que Marta poderia ter feito de diferente?"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'pt-BR';
UPDATE devotionals SET practical_application = '<p>Reserve um momento para reconhecer, em oração, o privilégio da comunhão com Deus. Agradeça por sua graça e reflita sobre como sua alegria no Senhor pode se manifestar em suas atitudes e relacionamentos.</p><p></p>' WHERE id = 'cmvue6llj000koe2lqtw0xdz2';
UPDATE devotionals SET scripture_text = 'Por isso, afirmo a você que os muitos pecados dela foram perdoados, porque ela muito amou; mas aquele a quem pouco se perdoa, pouco ama. - Lucas 7.47' WHERE id = 'cmvyun7rw0032o72lmlzc68bk';
UPDATE devotionals SET scripture_text = '“Maria escolheu a boa parte, e esta não lhe será tirada.” — Lucas 10.42' WHERE id = 'cmvyv3ozp003ho72lezbf5h9r';
UPDATE devotional_translations SET practical_application = '<p>Take a moment to acknowledge, in prayer, the privilege of communion with God. Thank Him for His grace and reflect on how your joy in the Lord can manifest in your attitudes and relationships.</p><p></p>' WHERE id = 'cmvvrlwsr0016mp2ls7pvnphk';
UPDATE devotional_translations SET practical_application = '<p>Take a moment to acknowledge, in prayer, the privilege of communion with God. Thank Him for His grace and reflect on how your joy in the Lord can manifest in your attitudes and relationships.</p><p></p>' WHERE id = 'cmvx7mwbl0010o72ljqja0x0r';
UPDATE devotional_translations SET practical_application = '<p>Reserve un momento para reconocer, en oración, el privilegio de la comunión con Dios. Agradezca por su gracia y reflexione sobre cómo su alegría en el Señor puede manifestarse en sus actitudes y relaciones.</p><p></p>' WHERE id = 'cmvvrm0lu001amp2lm6de3s9i';
UPDATE devotional_translations SET scripture_text = 'Therefore I tell you, her sins, which are many, are forgiven—for she loved much. But he who is forgiven little, loves little. - Luke 7.47' WHERE id = 'cmvyvsdwe003wo72lja1grjlo';
UPDATE devotional_translations SET scripture_text = 'Therefore I tell you, her sins, which are many, are forgiven—for she loved much. But he who is forgiven little, loves little. - Luke 7.47' WHERE id = 'cmvyw32af001nqz2losgce404';
UPDATE devotional_translations SET scripture_text = 'Por lo cual te digo que sus muchos pecados le son perdonados, porque amó mucho; mas aquel a quien se le perdona poco, poco ama. - Lucas 7.47' WHERE id = 'cmvyvso9l003yo72l3qz9dl55';
UPDATE devotional_translations SET scripture_text = 'Por lo cual te digo que sus muchos pecados le son perdonados, porque amó mucho; mas aquel a quien se le perdona poco, poco ama. - Lucas 7.47' WHERE id = 'cmvyw32en001pqz2lpw8gtvyo';
UPDATE devotional_translations SET scripture_text = 'C''est pourquoi, je te le dis, ses nombreux péchés ont été pardonnés : car elle a beaucoup aimé. Mais celui à qui on pardonne peu aime peu. - Luc 7.47' WHERE id = 'cmvyvszfm0040o72lep6novwk';
UPDATE devotional_translations SET scripture_text = 'C''est pourquoi, je te le dis, ses nombreux péchés ont été pardonnés : car elle a beaucoup aimé. Mais celui à qui on pardonne peu aime peu. - Luc 7.47' WHERE id = 'cmvyw32ja001rqz2ls4hhnk9i';
UPDATE devotional_translations SET scripture_text = 'Perciò, io ti dico: i suoi molti peccati le sono perdonati, perché ha molto amato; ma colui a cui poco è perdonato, poco ama. - Luca 7.47' WHERE id = 'cmvyvtap80042o72l2ahsz047';
UPDATE devotional_translations SET scripture_text = 'Perciò, io ti dico: i suoi molti peccati le sono perdonati, perché ha molto amato; ma colui a cui poco è perdonato, poco ama. - Luca 7.47' WHERE id = 'cmvyw32ue001tqz2l4x33xg0x';
UPDATE devotional_translations SET scripture_text = '“Mary has chosen the good portion, which will not be taken away from her.” — Luke 10.42' WHERE id = 'cmvyvtjsa0044o72l1ckzywff';
UPDATE devotional_translations SET scripture_text = '“Mary has chosen the good portion, which will not be taken away from her.” — Luke 10.42' WHERE id = 'cmvyw3pkl002pqz2l553c1rn9';
UPDATE devotional_translations SET scripture_text = '“María ha escogido la buena parte, la cual no le será quitada.” — Lucas 10.42' WHERE id = 'cmvyvtudl0046o72ldo9vyd21';
UPDATE devotional_translations SET scripture_text = '“María ha escogido la buena parte, la cual no le será quitada.” — Lucas 10.42' WHERE id = 'cmvyw3pr7002rqz2l8kjwaar6';
UPDATE devotional_translations SET scripture_text = '« Marie a choisi la bonne part, qui ne lui sera point ôtée. » — Luc 10.42' WHERE id = 'cmvyvu5ve0001qz2le416z49n';
UPDATE devotional_translations SET scripture_text = '« Marie a choisi la bonne part, qui ne lui sera point ôtée. » — Luc 10.42' WHERE id = 'cmvyw3pvn002tqz2lb39pjpgg';
UPDATE devotional_translations SET scripture_text = '«Maria ha scelto la parte buona che non le sarà tolta.» — Luca 10.42' WHERE id = 'cmvyvuhd80003qz2l6chzg85f';
UPDATE devotional_translations SET scripture_text = '«Maria ha scelto la parte buona che non le sarà tolta.» — Luca 10.42' WHERE id = 'cmvyw3pzy002vqz2ly9pt2o8p';
COMMIT;
