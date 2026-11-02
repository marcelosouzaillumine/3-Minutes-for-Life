-- Faixa 0 a 3 anos (bebês) de Davi, Levi, Perfume, Reforma e Marta e Maria, em 5 idiomas: 25 versões novas, como RASCUNHO (a pessoa revisa e publica no admin). Publicar o app ANTES de rodar (a arte faixa-0-3-*.webp).
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids WHERE band = '0-3' AND devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvudrag10002oe2ldyzmvhaa','cmvyv3ozp003ho72lezbf5h9r');
  IF n <> 0 THEN RAISE EXCEPTION 'ja existem % versoes 0-3 para estes devocionais', n; END IF;
  SELECT count(*) INTO n FROM devotionals WHERE id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvudrag10002oe2ldyzmvhaa','cmvyv3ozp003ho72lezbf5h9r');
  IF n <> 5 THEN RAISE EXCEPTION 'esperava 5 devocionais e encontrei %', n; END IF;
END $$;
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvue6llj000koe2lqtw0xdz2pt-BR'), 1, 20), 'cmvue6llj000koe2lqtw0xdz2', '0-3', 'pt-BR', 'Davi dança de alegria', 'Davi dançava de alegria diante do Senhor.', 'A arca de Deus chega a Jerusalém.

Davi levanta as mãos para Deus.

Davi dança de alegria!

Alguém olha da janela. Davi continua alegre!', 'O que deixa você alegre?', 'Bata palmas com a criança e dancem um pouquinho, dizendo juntos: Deus está aqui!', 'Obrigado, Deus, por estar perto de nós. Amém.', 'Leia uma frase por quadro, mostrando a imagem e apontando para Davi. Use uma voz alegre e deixe a criança bater palmas. Não espere respostas: o que ela guarda é o seu carinho e o seu tom de voz.

Para conversar à mesa:
Quem estava feliz na história?
O que Davi fez para mostrar a sua alegria?
Quando a nossa família sente a alegria de estar com Deus?

Atividade em família:
Coloquem uma música alegre e dancem juntos, no colo ou no chão. De vez em quando, parem e digam: Deus está aqui! Leva cerca de 3 minutos e não precisa de material.

Oração em família:
Senhor, obrigado por estar com a nossa família. Enche a nossa casa de alegria. Amém.', '{"format": "panels", "panels": [{"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-1.webp", "caption": "A arca de Deus chega a Jerusalém."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-2.webp", "caption": "Davi levanta as mãos para Deus."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-3.webp", "caption": "Davi dança de alegria!"}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-4.webp", "caption": "Alguém olha da janela. Davi continua alegre!"}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvue6llj000koe2lqtw0xdz2en'), 1, 20), 'cmvue6llj000koe2lqtw0xdz2', '0-3', 'en', 'David dances for joy', 'David danced before the Lord with joy.', 'God''s ark arrives in Jerusalem.

David lifts his hands to God.

David dances for joy!

Someone watches from the window. David is still happy!', 'What makes you happy?', 'Clap with your child and dance a little, saying together: God is here!', 'Thank you, God, for being near us. Amen.', 'Read one sentence per picture, showing the image and pointing to David. Use a cheerful voice and let your child clap. Don''t expect answers: what a little one keeps is your warmth and your tone of voice.

To talk about at the table:
Who was happy in the story?
What did David do to show his joy?
When does our family feel the joy of being with God?

Family activity:
Put on a cheerful song and dance together, in your arms or on the floor. Every now and then, stop and say: God is here! It takes about 3 minutes and needs no materials.

Family prayer:
Lord, thank you for being with our family. Fill our home with joy. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-1.webp", "caption": "God''s ark arrives in Jerusalem."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-2.webp", "caption": "David lifts his hands to God."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-3.webp", "caption": "David dances for joy!"}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-4.webp", "caption": "Someone watches from the window. David is still happy!"}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvue6llj000koe2lqtw0xdz2es'), 1, 20), 'cmvue6llj000koe2lqtw0xdz2', '0-3', 'es', 'David baila de alegría', 'David danzaba de alegría delante del Señor.', 'El arca de Dios llega a Jerusalén.

David levanta las manos a Dios.

¡David baila de alegría!

Alguien mira desde la ventana. ¡David sigue alegre!', '¿Qué te pone contento?', 'Aplaude con el niño y bailen un poquito, diciendo juntos: ¡Dios está aquí!', 'Gracias, Dios, por estar cerca de nosotros. Amén.', 'Lee una frase por cuadro, mostrando la imagen y señalando a David. Usa una voz alegre y deja que el niño aplauda. No esperes respuestas: lo que el pequeño guarda es tu cariño y tu tono de voz.

Para conversar en la mesa:
¿Quién estaba feliz en la historia?
¿Qué hizo David para mostrar su alegría?
¿Cuándo siente nuestra familia la alegría de estar con Dios?

Actividad en familia:
Pongan una música alegre y bailen juntos, en brazos o en el suelo. De vez en cuando, paren y digan: ¡Dios está aquí! Dura unos 3 minutos y no necesita materiales.

Oración en familia:
Señor, gracias por estar con nuestra familia. Llena nuestra casa de alegría. Amén.', '{"format": "panels", "panels": [{"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-1.webp", "caption": "El arca de Dios llega a Jerusalén."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-2.webp", "caption": "David levanta las manos a Dios."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-3.webp", "caption": "¡David baila de alegría!"}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-4.webp", "caption": "Alguien mira desde la ventana. ¡David sigue alegre!"}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvue6llj000koe2lqtw0xdz2fr'), 1, 20), 'cmvue6llj000koe2lqtw0xdz2', '0-3', 'fr', 'David danse de joie', 'David dansait de joie devant le Seigneur.', 'L''arche de Dieu arrive à Jérusalem.

David lève les mains vers Dieu.

David danse de joie !

Quelqu''un regarde par la fenêtre. David reste joyeux !', 'Qu''est-ce qui te rend joyeux ?', 'Tapez dans vos mains avec l''enfant et dansez un petit peu, en disant ensemble : Dieu est là !', 'Merci, Dieu, d''être près de nous. Amen.', 'Lisez une phrase par image, en montrant le dessin et en désignant David. Prenez une voix joyeuse et laissez l''enfant taper dans ses mains. N''attendez pas de réponses : ce que le tout-petit retient, c''est votre tendresse et le ton de votre voix.

Pour en parler à table :
Qui était joyeux dans l''histoire ?
Que fait David pour montrer sa joie ?
Quand notre famille ressent-elle la joie d''être avec Dieu ?

Activité en famille :
Mettez une musique joyeuse et dansez ensemble, dans vos bras ou par terre. De temps en temps, arrêtez-vous et dites : Dieu est là ! Cela dure environ 3 minutes et ne demande aucun matériel.

Prière en famille :
Seigneur, merci d''être avec notre famille. Remplis notre maison de joie. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-1.webp", "caption": "L''arche de Dieu arrive à Jérusalem."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-2.webp", "caption": "David lève les mains vers Dieu."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-3.webp", "caption": "David danse de joie !"}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-4.webp", "caption": "Quelqu''un regarde par la fenêtre. David reste joyeux !"}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvue6llj000koe2lqtw0xdz2it'), 1, 20), 'cmvue6llj000koe2lqtw0xdz2', '0-3', 'it', 'Davide danza di gioia', 'Davide danzava di gioia davanti al Signore.', 'L''arca di Dio arriva a Gerusalemme.

Davide alza le mani a Dio.

Davide danza di gioia!

Qualcuno guarda dalla finestra. Davide resta felice!', 'Che cosa ti rende contento?', 'Battete le mani insieme al bambino e ballate un pochino, dicendo insieme: Dio è qui!', 'Grazie, Dio, perché sei vicino a noi. Amen.', 'Leggi una frase per immagine, mostrando il disegno e indicando Davide. Usa una voce allegra e lascia che il bambino batta le mani. Non aspettarti risposte: quello che il piccolo conserva è il tuo affetto e il tono della tua voce.

Per parlarne a tavola:
Chi era felice nella storia?
Che cosa fece Davide per mostrare la sua gioia?
Quando la nostra famiglia sente la gioia di stare con Dio?

Attività in famiglia:
Mettete una musica allegra e ballate insieme, in braccio o sul pavimento. Ogni tanto fermatevi e dite: Dio è qui! Dura circa 3 minuti e non serve alcun materiale.

Preghiera in famiglia:
Signore, grazie perché sei con la nostra famiglia. Riempi la nostra casa di gioia. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-1.webp", "caption": "L''arca di Dio arriva a Gerusalemme."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-2.webp", "caption": "Davide alza le mani a Dio."}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-3.webp", "caption": "Davide danza di gioia!"}, {"image": "/ilustracoes/davi-e-a-arca/quadros/faixa-0-3-4.webp", "caption": "Qualcuno guarda dalla finestra. Davide resta felice!"}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvv1whpq0002pm2l3f1bfo13pt-BR'), 1, 20), 'cmvv1whpq0002pm2l3f1bfo13', '0-3', 'pt-BR', 'Jesus chama Levi', 'Jesus disse a Levi: Siga-me.', 'Jesus chama Levi: Siga-me!

Levi vai com Jesus.

Levi faz uma festa para Jesus.

Jesus ama todas as pessoas.', 'Quem senta com você na hora de comer?', 'Na próxima refeição, olhe nos olhos da criança e diga: Jesus ama você!', 'Obrigado, Jesus, porque amas todas as pessoas. Amém.', 'Leia uma frase por quadro e mostre a imagem. No terceiro quadro, aponte as pessoas à mesa e diga que todos estão com Jesus. Não espere respostas: o que importa é o carinho com que você conta.

Para conversar à mesa:
Quem Jesus chamou?
Quem veio à festa de Levi?
Quem senta à mesa com a nossa família?

Atividade em família:
Na próxima refeição, ponham um lugar a mais na mesa, de brincadeira, e digam: Jesus é bem-vindo aqui! Leva cerca de 2 minutos e não precisa de material.

Oração em família:
Jesus, obrigado por amares todas as pessoas. Senta-te à mesa com a nossa família. Amém.', '{"format": "panels", "panels": [{"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-1.webp", "caption": "Jesus chama Levi: Siga-me!"}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-2.webp", "caption": "Levi vai com Jesus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-3.webp", "caption": "Levi faz uma festa para Jesus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-4.webp", "caption": "Jesus ama todas as pessoas."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvv1whpq0002pm2l3f1bfo13en'), 1, 20), 'cmvv1whpq0002pm2l3f1bfo13', '0-3', 'en', 'Jesus calls Levi', 'Jesus said to Levi: Follow me.', 'Jesus calls Levi: Follow me!

Levi goes with Jesus.

Levi throws a party for Jesus.

Jesus loves everyone.', 'Who sits with you at mealtime?', 'At the next meal, look into your child''s eyes and say: Jesus loves you!', 'Thank you, Jesus, for loving everyone. Amen.', 'Read one sentence per picture and show the image. On the third picture, point to the people at the table and say they are all with Jesus. Don''t expect answers: what matters is the warmth with which you tell it.

To talk about at the table:
Who did Jesus call?
Who came to Levi''s party?
Who sits at the table with our family?

Family activity:
At the next meal, set one extra place at the table, just for fun, and say: Jesus is welcome here! It takes about 2 minutes and needs no materials.

Family prayer:
Jesus, thank you for loving everyone. Sit at the table with our family. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-1.webp", "caption": "Jesus calls Levi: Follow me!"}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-2.webp", "caption": "Levi goes with Jesus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-3.webp", "caption": "Levi throws a party for Jesus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-4.webp", "caption": "Jesus loves everyone."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvv1whpq0002pm2l3f1bfo13es'), 1, 20), 'cmvv1whpq0002pm2l3f1bfo13', '0-3', 'es', 'Jesús llama a Leví', 'Jesús le dijo a Leví: Sígueme.', 'Jesús llama a Leví: ¡Sígueme!

Leví va con Jesús.

Leví hace una fiesta para Jesús.

Jesús ama a todas las personas.', '¿Quién se sienta contigo a la hora de comer?', 'En la próxima comida, mira a los ojos al niño y dile: ¡Jesús te ama!', 'Gracias, Jesús, porque amas a todas las personas. Amén.', 'Lee una frase por cuadro y muestra la imagen. En el tercer cuadro, señala a las personas de la mesa y di que todos están con Jesús. No esperes respuestas: lo que importa es el cariño con que lo cuentas.

Para conversar en la mesa:
¿A quién llamó Jesús?
¿Quiénes vinieron a la fiesta de Leví?
¿Quién se sienta a la mesa con nuestra familia?

Actividad en familia:
En la próxima comida, pongan un lugar más en la mesa, de juego, y digan: ¡Jesús es bienvenido aquí! Dura unos 2 minutos y no necesita materiales.

Oración en familia:
Jesús, gracias por amar a todas las personas. Siéntate a la mesa con nuestra familia. Amén.', '{"format": "panels", "panels": [{"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-1.webp", "caption": "Jesús llama a Leví: ¡Sígueme!"}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-2.webp", "caption": "Leví va con Jesús."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-3.webp", "caption": "Leví hace una fiesta para Jesús."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-4.webp", "caption": "Jesús ama a todas las personas."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvv1whpq0002pm2l3f1bfo13fr'), 1, 20), 'cmvv1whpq0002pm2l3f1bfo13', '0-3', 'fr', 'Jésus appelle Lévi', 'Jésus dit à Lévi : Suis-moi.', 'Jésus appelle Lévi : Suis-moi !

Lévi part avec Jésus.

Lévi fait une fête pour Jésus.

Jésus aime tout le monde.', 'Qui s''assoit avec toi au moment du repas ?', 'Au prochain repas, regardez l''enfant dans les yeux et dites : Jésus t''aime !', 'Merci, Jésus, parce que tu aimes tout le monde. Amen.', 'Lisez une phrase par image et montrez le dessin. Sur la troisième image, montrez les personnes à table et dites qu''elles sont toutes avec Jésus. N''attendez pas de réponses : ce qui compte, c''est la tendresse avec laquelle vous racontez.

Pour en parler à table :
Qui Jésus a-t-il appelé ?
Qui est venu à la fête de Lévi ?
Qui est assis à table avec notre famille ?

Activité en famille :
Au prochain repas, mettez une place de plus à table, pour jouer, et dites : Jésus est le bienvenu ici ! Cela dure environ 2 minutes et ne demande aucun matériel.

Prière en famille :
Jésus, merci d''aimer tout le monde. Assieds-toi à table avec notre famille. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-1.webp", "caption": "Jésus appelle Lévi : Suis-moi !"}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-2.webp", "caption": "Lévi part avec Jésus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-3.webp", "caption": "Lévi fait une fête pour Jésus."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-4.webp", "caption": "Jésus aime tout le monde."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvv1whpq0002pm2l3f1bfo13it'), 1, 20), 'cmvv1whpq0002pm2l3f1bfo13', '0-3', 'it', 'Gesù chiama Levi', 'Gesù disse a Levi: Seguimi.', 'Gesù chiama Levi: Seguimi!

Levi va con Gesù.

Levi fa una festa per Gesù.

Gesù ama tutte le persone.', 'Chi si siede con te a tavola?', 'Al prossimo pasto, guarda il bambino negli occhi e digli: Gesù ti vuole bene!', 'Grazie, Gesù, perché ami tutte le persone. Amen.', 'Leggi una frase per immagine e mostra il disegno. Sulla terza immagine, indica le persone a tavola e di'' che sono tutte con Gesù. Non aspettarti risposte: conta l''affetto con cui racconti.

Per parlarne a tavola:
Chi ha chiamato Gesù?
Chi è venuto alla festa di Levi?
Chi si siede a tavola con la nostra famiglia?

Attività in famiglia:
Al prossimo pasto, mettete un posto in più a tavola, per gioco, e dite: Gesù è il benvenuto qui! Dura circa 2 minuti e non serve alcun materiale.

Preghiera in famiglia:
Gesù, grazie perché ami tutte le persone. Siediti a tavola con la nostra famiglia. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-1.webp", "caption": "Gesù chiama Levi: Seguimi!"}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-2.webp", "caption": "Levi va con Gesù."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-3.webp", "caption": "Levi fa una festa per Gesù."}, {"image": "/ilustracoes/levi-e-o-banquete/quadros/faixa-0-3-4.webp", "caption": "Gesù ama tutte le persone."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyun7rw0032o72lmlzc68bkpt-BR'), 1, 20), 'cmvyun7rw0032o72lmlzc68bk', '0-3', 'pt-BR', 'Obrigado, Jesus!', 'Os seus pecados estão perdoados.', 'Uma mulher chega com perfume para Jesus.

Ela cuida dos pés de Jesus com amor.

Jesus conversa com Simão.

Jesus a acolhe e a perdoa.', 'Quem cuida de você com carinho?', 'Faça um carinho bem devagar nos pés da criança e diga: Jesus cuida de você!', 'Obrigado, Jesus, por me perdoares e me amares. Amém.', 'Leia devagar, uma frase por quadro. No segundo quadro, fale baixinho e com ternura, como quem cuida. Não espere respostas: o que a criança guarda é o seu carinho.

Para conversar à mesa:
O que a mulher trouxe para Jesus?
Como ela cuidou dele?
Como Jesus a tratou?

Atividade em família:
Passem um pouco de creme comum nas mãos ou nos pés da criança, bem devagar, dizendo: Jesus ama você. Leva cerca de 3 minutos, com um creme de casa.

Oração em família:
Jesus, obrigado porque perdoas os nossos erros e nos amas. Ajuda a nossa família a cuidar uns dos outros. Amém.', '{"format": "panels", "panels": [{"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-1.webp", "caption": "Uma mulher chega com perfume para Jesus."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-2.webp", "caption": "Ela cuida dos pés de Jesus com amor."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-3.webp", "caption": "Jesus conversa com Simão."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-4.webp", "caption": "Jesus a acolhe e a perdoa."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyun7rw0032o72lmlzc68bken'), 1, 20), 'cmvyun7rw0032o72lmlzc68bk', '0-3', 'en', 'Thank you, Jesus!', 'Your sins are forgiven.', 'A woman arrives with perfume for Jesus.

She tenderly cares for Jesus'' feet.

Jesus talks with Simon.

Jesus welcomes her and forgives her.', 'Who takes care of you with love?', 'Gently stroke your child''s feet, very slowly, and say: Jesus takes care of you!', 'Thank you, Jesus, for forgiving me and loving me. Amen.', 'Read slowly, one sentence per picture. On the second picture, speak softly and tenderly, like someone caring for another. Don''t expect answers: what your child keeps is your warmth.

To talk about at the table:
What did the woman bring to Jesus?
How did she take care of him?
How did Jesus treat her?

Family activity:
Rub a little ordinary lotion on your child''s hands or feet, very slowly, saying: Jesus loves you. It takes about 3 minutes, with a lotion you already have at home.

Family prayer:
Jesus, thank you for forgiving our mistakes and loving us. Help our family take care of one another. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-1.webp", "caption": "A woman arrives with perfume for Jesus."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-2.webp", "caption": "She tenderly cares for Jesus'' feet."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-3.webp", "caption": "Jesus talks with Simon."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-4.webp", "caption": "Jesus welcomes her and forgives her."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyun7rw0032o72lmlzc68bkes'), 1, 20), 'cmvyun7rw0032o72lmlzc68bk', '0-3', 'es', '¡Gracias, Jesús!', 'Tus pecados te son perdonados.', 'Una mujer llega con perfume para Jesús.

Ella cuida los pies de Jesús con amor.

Jesús conversa con Simón.

Jesús la acoge y la perdona.', '¿Quién te cuida con cariño?', 'Acaricia muy despacio los pies del niño y dile: ¡Jesús te cuida!', 'Gracias, Jesús, por perdonarme y amarme. Amén.', 'Lee despacio, una frase por cuadro. En el segundo cuadro, habla bajito y con ternura, como quien cuida. No esperes respuestas: lo que el niño guarda es tu cariño.

Para conversar en la mesa:
¿Qué le trajo la mujer a Jesús?
¿Cómo cuidó de él?
¿Cómo la trató Jesús?

Actividad en familia:
Pongan un poco de crema común en las manos o en los pies del niño, muy despacio, diciendo: Jesús te ama. Dura unos 3 minutos, con una crema que haya en casa.

Oración en familia:
Jesús, gracias porque perdonas nuestros errores y nos amas. Ayuda a nuestra familia a cuidarse unos a otros. Amén.', '{"format": "panels", "panels": [{"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-1.webp", "caption": "Una mujer llega con perfume para Jesús."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-2.webp", "caption": "Ella cuida los pies de Jesús con amor."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-3.webp", "caption": "Jesús conversa con Simón."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-4.webp", "caption": "Jesús la acoge y la perdona."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyun7rw0032o72lmlzc68bkfr'), 1, 20), 'cmvyun7rw0032o72lmlzc68bk', '0-3', 'fr', 'Merci, Jésus !', 'Tes péchés sont pardonnés.', 'Une femme arrive avec du parfum pour Jésus.

Elle prend soin des pieds de Jésus avec amour.

Jésus parle avec Simon.

Jésus l''accueille et lui pardonne.', 'Qui prend soin de toi avec tendresse ?', 'Caressez très doucement les pieds de l''enfant et dites : Jésus prend soin de toi !', 'Merci, Jésus, de me pardonner et de m''aimer. Amen.', 'Lisez lentement, une phrase par image. Sur la deuxième image, parlez doucement et avec tendresse, comme quelqu''un qui prend soin. N''attendez pas de réponses : ce que l''enfant retient, c''est votre tendresse.

Pour en parler à table :
Qu''a apporté la femme à Jésus ?
Comment a-t-elle pris soin de lui ?
Comment Jésus l''a-t-il traitée ?

Activité en famille :
Mettez un peu de crème ordinaire sur les mains ou les pieds de l''enfant, très doucement, en disant : Jésus t''aime. Cela dure environ 3 minutes, avec une crème que vous avez à la maison.

Prière en famille :
Jésus, merci de pardonner nos erreurs et de nous aimer. Aide notre famille à prendre soin les uns des autres. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-1.webp", "caption": "Une femme arrive avec du parfum pour Jésus."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-2.webp", "caption": "Elle prend soin des pieds de Jésus avec amour."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-3.webp", "caption": "Jésus parle avec Simon."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-4.webp", "caption": "Jésus l''accueille et lui pardonne."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyun7rw0032o72lmlzc68bkit'), 1, 20), 'cmvyun7rw0032o72lmlzc68bk', '0-3', 'it', 'Grazie, Gesù!', 'I tuoi peccati sono perdonati.', 'Una donna arriva con il profumo per Gesù.

Lei si prende cura dei piedi di Gesù con amore.

Gesù parla con Simone.

Gesù la accoglie e la perdona.', 'Chi si prende cura di te con affetto?', 'Accarezza molto piano i piedini del bambino e digli: Gesù si prende cura di te!', 'Grazie, Gesù, perché mi perdoni e mi ami. Amen.', 'Leggi piano, una frase per immagine. Sulla seconda immagine, parla a bassa voce e con tenerezza, come chi si prende cura. Non aspettarti risposte: quello che il bambino conserva è il tuo affetto.

Per parlarne a tavola:
Che cosa ha portato la donna a Gesù?
Come si è presa cura di lui?
Come l''ha trattata Gesù?

Attività in famiglia:
Mettete un po'' di crema comune sulle manine o sui piedini del bambino, molto piano, dicendo: Gesù ti vuole bene. Dura circa 3 minuti, con una crema che avete in casa.

Preghiera in famiglia:
Gesù, grazie perché perdoni i nostri errori e ci ami. Aiuta la nostra famiglia a prendersi cura gli uni degli altri. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-1.webp", "caption": "Una donna arriva con il profumo per Gesù."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-2.webp", "caption": "Lei si prende cura dei piedi di Gesù con amore."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-3.webp", "caption": "Gesù parla con Simone."}, {"image": "/ilustracoes/a-mulher-e-o-perfume/quadros/faixa-0-3-4.webp", "caption": "Gesù la accoglie e la perdona."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvudrag10002oe2ldyzmvhaapt-BR'), 1, 20), 'cmvudrag10002oe2ldyzmvhaa', '0-3', 'pt-BR', 'A Bíblia nos mostra Deus', 'O justo viverá pela fé.', 'Lutero lê a Bíblia.

Ele conta a todos o que descobriu.

Lutero fala com coragem.

Agora as famílias leem a Bíblia.', 'Quem lê a Bíblia para você?', 'Abra uma Bíblia com a criança, mostre as páginas e diga: Deus fala com a gente aqui.', 'Obrigado, Deus, pela Bíblia. Amém.', 'Leia uma frase por quadro. No último, mostre a imagem da família e, se puder, uma Bíblia de verdade. Não espere respostas: o que a criança guarda é o seu carinho e o seu tom de voz.

Para conversar à mesa:
O que Lutero lia?
Quem lê a Bíblia na nossa casa?
O que a Bíblia nos mostra sobre Deus?

Atividade em família:
Sentem juntos com uma Bíblia aberta e folheiem as páginas devagar. Leiam em voz alta o título de uma história bíblica que vocês conhecem. Leva cerca de 3 minutos.

Oração em família:
Senhor, obrigado pela Bíblia, que nos mostra quem tu és. Ensina a nossa família a te conhecer. Amém.', '{"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-1.webp", "caption": "Lutero lê a Bíblia."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-2.webp", "caption": "Ele conta a todos o que descobriu."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-3.webp", "caption": "Lutero fala com coragem."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-4.webp", "caption": "Agora as famílias leem a Bíblia."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvudrag10002oe2ldyzmvhaaen'), 1, 20), 'cmvudrag10002oe2ldyzmvhaa', '0-3', 'en', 'The Bible shows us God', 'The righteous will live by faith.', 'Luther reads the Bible.

He tells everyone what he discovered.

Luther speaks with courage.

Now families read the Bible.', 'Who reads the Bible to you?', 'Open a Bible with your child, show the pages and say: God speaks to us here.', 'Thank you, God, for the Bible. Amen.', 'Read one sentence per picture. On the last one, show the picture of the family and, if you can, a real Bible. Don''t expect answers: what your child keeps is your warmth and your tone of voice.

To talk about at the table:
What did Luther read?
Who reads the Bible in our home?
What does the Bible show us about God?

Family activity:
Sit together with an open Bible and turn the pages slowly. Read aloud the title of a Bible story you already know. It takes about 3 minutes.

Family prayer:
Lord, thank you for the Bible, which shows us who you are. Teach our family to know you. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-1.webp", "caption": "Luther reads the Bible."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-2.webp", "caption": "He tells everyone what he discovered."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-3.webp", "caption": "Luther speaks with courage."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-4.webp", "caption": "Now families read the Bible."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvudrag10002oe2ldyzmvhaaes'), 1, 20), 'cmvudrag10002oe2ldyzmvhaa', '0-3', 'es', 'La Biblia nos muestra a Dios', 'El justo vivirá por la fe.', 'Lutero lee la Biblia.

Él cuenta a todos lo que descubrió.

Lutero habla con valentía.

Ahora las familias leen la Biblia.', '¿Quién te lee la Biblia?', 'Abre una Biblia con el niño, muéstrale las páginas y dile: Dios nos habla aquí.', 'Gracias, Dios, por la Biblia. Amén.', 'Lee una frase por cuadro. En el último, muestra la imagen de la familia y, si puedes, una Biblia de verdad. No esperes respuestas: lo que el niño guarda es tu cariño y tu tono de voz.

Para conversar en la mesa:
¿Qué leía Lutero?
¿Quién lee la Biblia en nuestra casa?
¿Qué nos muestra la Biblia sobre Dios?

Actividad en familia:
Siéntense juntos con una Biblia abierta y hojeen las páginas despacio. Lean en voz alta el título de una historia bíblica que conozcan. Dura unos 3 minutos.

Oración en familia:
Señor, gracias por la Biblia, que nos muestra quién eres. Enseña a nuestra familia a conocerte. Amén.', '{"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-1.webp", "caption": "Lutero lee la Biblia."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-2.webp", "caption": "Él cuenta a todos lo que descubrió."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-3.webp", "caption": "Lutero habla con valentía."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-4.webp", "caption": "Ahora las familias leen la Biblia."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvudrag10002oe2ldyzmvhaafr'), 1, 20), 'cmvudrag10002oe2ldyzmvhaa', '0-3', 'fr', 'La Bible nous montre Dieu', 'Le juste vivra par la foi.', 'Luther lit la Bible.

Il raconte à tout le monde ce qu''il a découvert.

Luther parle avec courage.

Maintenant, les familles lisent la Bible.', 'Qui te lit la Bible ?', 'Ouvrez une Bible avec l''enfant, montrez-lui les pages et dites : Dieu nous parle ici.', 'Merci, Dieu, pour la Bible. Amen.', 'Lisez une phrase par image. Sur la dernière, montrez le dessin de la famille et, si vous le pouvez, une vraie Bible. N''attendez pas de réponses : ce que l''enfant retient, c''est votre tendresse et le ton de votre voix.

Pour en parler à table :
Que lisait Luther ?
Qui lit la Bible chez nous ?
Que nous montre la Bible sur Dieu ?

Activité en famille :
Asseyez-vous ensemble avec une Bible ouverte et feuilletez les pages lentement. Lisez à voix haute le titre d''une histoire biblique que vous connaissez. Cela dure environ 3 minutes.

Prière en famille :
Seigneur, merci pour la Bible, qui nous montre qui tu es. Apprends à notre famille à te connaître. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-1.webp", "caption": "Luther lit la Bible."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-2.webp", "caption": "Il raconte à tout le monde ce qu''il a découvert."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-3.webp", "caption": "Luther parle avec courage."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-4.webp", "caption": "Maintenant, les familles lisent la Bible."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvudrag10002oe2ldyzmvhaait'), 1, 20), 'cmvudrag10002oe2ldyzmvhaa', '0-3', 'it', 'La Bibbia ci mostra Dio', 'Il giusto vivrà per fede.', 'Lutero legge la Bibbia.

Racconta a tutti ciò che ha scoperto.

Lutero parla con coraggio.

Ora le famiglie leggono la Bibbia.', 'Chi ti legge la Bibbia?', 'Apri una Bibbia con il bambino, mostragli le pagine e digli: Dio ci parla qui.', 'Grazie, Dio, per la Bibbia. Amen.', 'Leggi una frase per immagine. Sull''ultima, mostra il disegno della famiglia e, se puoi, una vera Bibbia. Non aspettarti risposte: quello che il bambino conserva è il tuo affetto e il tono della tua voce.

Per parlarne a tavola:
Che cosa leggeva Lutero?
Chi legge la Bibbia in casa nostra?
Che cosa ci mostra la Bibbia su Dio?

Attività in famiglia:
Sedetevi insieme con una Bibbia aperta e sfogliate le pagine piano. Leggete ad alta voce il titolo di una storia biblica che conoscete. Dura circa 3 minuti.

Preghiera in famiglia:
Signore, grazie per la Bibbia, che ci mostra chi sei. Insegna alla nostra famiglia a conoscerti. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-1.webp", "caption": "Lutero legge la Bibbia."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-2.webp", "caption": "Racconta a tutti ciò che ha scoperto."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-3.webp", "caption": "Lutero parla con coraggio."}, {"image": "/ilustracoes/reforma-protestante/quadros/faixa-0-3-4.webp", "caption": "Ora le famiglie leggono la Bibbia."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyv3ozp003ho72lezbf5h9rpt-BR'), 1, 20), 'cmvyv3ozp003ho72lezbf5h9r', '0-3', 'pt-BR', 'Jesus visita Marta e Maria', 'Maria escolheu a melhor parte.', 'Marta recebe Jesus em casa.

Marta cozinha. Maria senta perto de Jesus.

Marta fica preocupada com tanta coisa.

Jesus responde com carinho: ouvir é o mais importante.', 'O que você gosta de ouvir?', 'Fiquem quietinhos juntos por um momento, de mãos dadas, e depois digam: Jesus está aqui.', 'Obrigado, Jesus, por falares comigo. Amém.', 'Leia uma frase por quadro, mostrando a imagem. No segundo quadro, fale mais baixinho, como quem escuta. Não espere respostas: o que a criança guarda é o seu carinho e o seu tom de voz.

Para conversar à mesa:
Quem recebeu Jesus em casa?
O que Maria fez perto de Jesus?
Quando a nossa família consegue ficar quietinha para escutar Jesus?

Atividade em família:
Fiquem quietinhos por um minuto, sentados juntos no chão, de mãos dadas. Depois, cada um diz uma coisa boa que ouviu: o vento, um passarinho, a voz de alguém. Leva cerca de 3 minutos e não precisa de material.

Oração em família:
Jesus, obrigado por visitares a nossa casa. Ensina a nossa família a parar e a te ouvir. Amém.', '{"format": "panels", "panels": [{"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-1.webp", "caption": "Marta recebe Jesus em casa."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-2.webp", "caption": "Marta cozinha. Maria senta perto de Jesus."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-3.webp", "caption": "Marta fica preocupada com tanta coisa."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-4.webp", "caption": "Jesus responde com carinho: ouvir é o mais importante."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyv3ozp003ho72lezbf5h9ren'), 1, 20), 'cmvyv3ozp003ho72lezbf5h9r', '0-3', 'en', 'Jesus visits Martha and Mary', 'Mary has chosen the better part.', 'Martha welcomes Jesus into her home.

Martha cooks. Mary sits near Jesus.

Martha is worried about so many things.

Jesus answers kindly: listening matters most.', 'What do you like to listen to?', 'Be quiet together for a moment, holding hands, and then say: Jesus is here.', 'Thank you, Jesus, for speaking to me. Amen.', 'Read one sentence per picture, showing the image. On the second picture, speak more softly, like someone listening. Don''t expect answers: what your child keeps is your warmth and your tone of voice.

To talk about at the table:
Who welcomed Jesus into her home?
What did Mary do near Jesus?
When can our family be quiet to listen to Jesus?

Family activity:
Be quiet for one minute, sitting together on the floor, holding hands. Then each person says one good thing they heard: the wind, a little bird, someone''s voice. It takes about 3 minutes and needs no materials.

Family prayer:
Jesus, thank you for visiting our home. Teach our family to stop and listen to you. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-1.webp", "caption": "Martha welcomes Jesus into her home."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-2.webp", "caption": "Martha cooks. Mary sits near Jesus."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-3.webp", "caption": "Martha is worried about so many things."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-4.webp", "caption": "Jesus answers kindly: listening matters most."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyv3ozp003ho72lezbf5h9res'), 1, 20), 'cmvyv3ozp003ho72lezbf5h9r', '0-3', 'es', 'Jesús visita a Marta y María', 'María ha escogido la mejor parte.', 'Marta recibe a Jesús en casa.

Marta cocina. María se sienta cerca de Jesús.

Marta se preocupa por tantas cosas.

Jesús responde con cariño: escuchar es lo más importante.', '¿Qué te gusta escuchar?', 'Quédense quietitos juntos un momento, de la mano, y luego digan: Jesús está aquí.', 'Gracias, Jesús, por hablar conmigo. Amén.', 'Lee una frase por cuadro, mostrando la imagen. En el segundo cuadro, habla más bajito, como quien escucha. No esperes respuestas: lo que el niño guarda es tu cariño y tu tono de voz.

Para conversar en la mesa:
¿Quién recibió a Jesús en casa?
¿Qué hizo María cerca de Jesús?
¿Cuándo puede nuestra familia quedarse quietita para escuchar a Jesús?

Actividad en familia:
Quédense quietitos un minuto, sentados juntos en el suelo, de la mano. Después, cada uno dice algo bueno que oyó: el viento, un pajarito, la voz de alguien. Dura unos 3 minutos y no necesita materiales.

Oración en familia:
Jesús, gracias por visitar nuestra casa. Enseña a nuestra familia a detenerse y a escucharte. Amén.', '{"format": "panels", "panels": [{"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-1.webp", "caption": "Marta recibe a Jesús en casa."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-2.webp", "caption": "Marta cocina. María se sienta cerca de Jesús."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-3.webp", "caption": "Marta se preocupa por tantas cosas."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-4.webp", "caption": "Jesús responde con cariño: escuchar es lo más importante."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyv3ozp003ho72lezbf5h9rfr'), 1, 20), 'cmvyv3ozp003ho72lezbf5h9r', '0-3', 'fr', 'Jésus rend visite à Marthe et Marie', 'Marie a choisi la meilleure part.', 'Marthe accueille Jésus chez elle.

Marthe cuisine. Marie s''assoit près de Jésus.

Marthe s''inquiète de tant de choses.

Jésus répond avec douceur : écouter est le plus important.', 'Qu''aimes-tu écouter ?', 'Restez tout calmes un moment, main dans la main, puis dites : Jésus est là.', 'Merci, Jésus, de me parler. Amen.', 'Lisez une phrase par image, en montrant le dessin. Sur la deuxième image, parlez plus doucement, comme quelqu''un qui écoute. N''attendez pas de réponses : ce que l''enfant retient, c''est votre tendresse et le ton de votre voix.

Pour en parler à table :
Qui a accueilli Jésus chez elle ?
Que fait Marie près de Jésus ?
Quand notre famille peut-elle rester calme pour écouter Jésus ?

Activité en famille :
Restez calmes une minute, assis ensemble par terre, main dans la main. Ensuite, chacun dit une bonne chose qu''il a entendue : le vent, un petit oiseau, la voix de quelqu''un. Cela dure environ 3 minutes et ne demande aucun matériel.

Prière en famille :
Jésus, merci de visiter notre maison. Apprends à notre famille à s''arrêter et à t''écouter. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-1.webp", "caption": "Marthe accueille Jésus chez elle."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-2.webp", "caption": "Marthe cuisine. Marie s''assoit près de Jésus."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-3.webp", "caption": "Marthe s''inquiète de tant de choses."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-4.webp", "caption": "Jésus répond avec douceur : écouter est le plus important."}]}'::jsonb, 'draft', now(), now());
INSERT INTO devotional_kids (id, devotional_id, band, language, title, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, story, status, created_at, updated_at) VALUES ('k03' || substr(md5('cmvyv3ozp003ho72lezbf5h9rit'), 1, 20), 'cmvyv3ozp003ho72lezbf5h9r', '0-3', 'it', 'Gesù visita Marta e Maria', 'Maria ha scelto la parte migliore.', 'Marta accoglie Gesù in casa.

Marta cucina. Maria si siede vicino a Gesù.

Marta si preoccupa per tante cose.

Gesù risponde con dolcezza: ascoltare è la cosa più importante.', 'Che cosa ti piace ascoltare?', 'State in silenzio insieme per un momento, tenendovi per mano, e poi dite: Gesù è qui.', 'Grazie, Gesù, perché parli con me. Amen.', 'Leggi una frase per immagine, mostrando il disegno. Sulla seconda immagine, parla più piano, come chi ascolta. Non aspettarti risposte: quello che il bambino conserva è il tuo affetto e il tono della tua voce.

Per parlarne a tavola:
Chi ha accolto Gesù in casa?
Che cosa ha fatto Maria vicino a Gesù?
Quando la nostra famiglia riesce a stare in silenzio per ascoltare Gesù?

Attività in famiglia:
State in silenzio per un minuto, seduti insieme per terra, tenendovi per mano. Poi ciascuno dice una cosa bella che ha sentito: il vento, un uccellino, la voce di qualcuno. Dura circa 3 minuti e non serve alcun materiale.

Preghiera in famiglia:
Gesù, grazie perché visiti la nostra casa. Insegna alla nostra famiglia a fermarsi e ad ascoltarti. Amen.', '{"format": "panels", "panels": [{"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-1.webp", "caption": "Marta accoglie Gesù in casa."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-2.webp", "caption": "Marta cucina. Maria si siede vicino a Gesù."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-3.webp", "caption": "Marta si preoccupa per tante cose."}, {"image": "/ilustracoes/marta-e-maria/quadros/faixa-0-3-4.webp", "caption": "Gesù risponde con dolcezza: ascoltare è la cosa più importante."}]}'::jsonb, 'draft', now(), now());
SELECT devotional_id, count(*) AS versoes, bool_and(status = 'draft') AS rascunho FROM devotional_kids WHERE band = '0-3' AND devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvudrag10002oe2ldyzmvhaa','cmvyv3ozp003ho72lezbf5h9r') GROUP BY 1 ORDER BY 1;
COMMIT;
