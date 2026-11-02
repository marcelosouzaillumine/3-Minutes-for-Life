-- Traduções da história da Reforma (en, es, fr, it), mesma arte da versão em português.
-- Traduzidas por IA a partir do pt-BR; a fala de Worms é paráfrase. Revisão editorial recomendada.
-- Só mexe no campo story: o texto corrido (what_it_says) de cada idioma não é tocado.
-- railway connect 3minutes-db < docs/plano-melhorias/kids-story-reforma-traducoes.sql
-- Tudo ou nada: exige as 12 versões (3 faixas x 4 idiomas); desfaz se qualquer UPDATE não atingir 1 linha.
-- Rollback: docs/plano-melhorias/kids-story-reforma-traducoes-rollback.sql

\set ON_ERROR_STOP on
BEGIN;

SELECT language, band, status, (story IS NOT NULL) AS tem_historia
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') ORDER BY language, band;

DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') AND band IN ('4-6','7-10','11-13')) <> 12 THEN
    RAISE EXCEPTION 'Esperava 12 versões (3 faixas x en, es, fr, it); nada foi alterado.';
  END IF;
END $$;

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "At home, there was a very special book.", "speech": "What a big book!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Long ago, almost no one could open the Bible.", "speech": "I can't reach it!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Luther opened the Bible and saw God's love.", "speech": "God loves us for free!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "Today the Bible is for everyone!", "speech": "Shall we read together?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'en';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Something has to change."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "Studying the Bible, he discovered: forgiveness is a gift from God.", "speech": "You can't buy it. You receive it!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "He wrote down his questions and nailed them to the church door.", "speech": "95 ideas to talk about!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Everyone started talking.", "speech": "Could this really be true?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Then he translated the Bible so the people could read it.", "speech": "Now everyone can understand!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'en';

UPDATE devotional_kids SET story = $j${"format": "dilemma", "image": "/ilustracoes/reforma-protestante/quadros/11-13-cena.svg", "setup": "Worms, 1521. You are Martin Luther. Before princes and bishops, you are asked to take back everything you wrote. If you do, you go home in peace. If you refuse, you could lose everything.", "question": "What would you do?", "options": ["Take it back and stay safe", "Stand by what I believe", "Ask for time to think"], "outcome": "Luther asked for a day to think. The next day, he refused to take anything back unless Scripture convinced him. After that, he was hidden in a castle, where he translated the New Testament into German.", "quote": "My conscience is bound to the Word of God.", "outcomeQuestion": "Would anyone change the choice they made a moment ago?", "today": "Back then, the printing press spread ideas in weeks. Today, an idea can reach the world in seconds.", "todayQuestion": "When you need to know whether something is true, where do you look first?"}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'en';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "En casa había un libro muy especial.", "speech": "¡Qué libro tan grande!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Antes, casi nadie podía abrir la Biblia.", "speech": "¡No llego!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Lutero abrió la Biblia y vio el amor de Dios.", "speech": "¡Dios nos ama sin pedir nada a cambio!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "¡Hoy la Biblia es para todos!", "speech": "¿Leemos juntos?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'es';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Algo tiene que cambiar."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "Estudiando la Biblia, descubrió: el perdón es un regalo de Dios.", "speech": "¡No se compra. Se recibe!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "Escribió sus dudas y las clavó en la puerta de la iglesia.", "speech": "¡95 ideas para conversar!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Todos empezaron a conversar.", "speech": "¿Será que es así?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Después tradujo la Biblia para que el pueblo pudiera leerla.", "speech": "¡Ahora todos entienden!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'es';

UPDATE devotional_kids SET story = $j${"format": "dilemma", "image": "/ilustracoes/reforma-protestante/quadros/11-13-cena.svg", "setup": "Worms, 1521. Eres Martín Lutero. Ante príncipes y obispos, te piden que retires todo lo que escribiste. Si lo retiras, vuelves a casa en paz. Si te niegas, puedes perderlo todo.", "question": "¿Qué harías?", "options": ["Retractarme y estar a salvo", "Mantener lo que creo", "Pedir tiempo para pensar"], "outcome": "Lutero pidió un día para pensar. Al día siguiente, se negó a retractarse mientras la Escritura no lo convenciera. Después se escondió en un castillo y tradujo el Nuevo Testamento al alemán.", "quote": "Mi conciencia está sujeta a la Palabra de Dios.", "outcomeQuestion": "¿Alguien cambiaría la elección de hace un momento?", "today": "En aquella época, la imprenta difundía las ideas en semanas. Hoy, una idea llega al mundo en segundos.", "todayQuestion": "Cuando necesitas saber si algo es verdad, ¿dónde buscas primero?"}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'es';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "À la maison, il y avait un livre très spécial.", "speech": "Quel grand livre !"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Autrefois, presque personne ne pouvait ouvrir la Bible.", "speech": "Je ne peux pas l'atteindre !"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Luther a ouvert la Bible et a vu l'amour de Dieu.", "speech": "Dieu nous aime gratuitement !"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "Aujourd'hui, la Bible est pour tout le monde !", "speech": "On lit ensemble ?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'fr';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Quelque chose doit changer."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "En étudiant la Bible, il a découvert : le pardon est un cadeau de Dieu.", "speech": "Il ne s'achète pas. Il se reçoit !"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "Il a écrit ses questions et les a clouées à la porte de l'église.", "speech": "95 idées pour en discuter !"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Tout le monde s'est mis à discuter.", "speech": "Est-ce vraiment ainsi ?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Ensuite, il a traduit la Bible pour que le peuple puisse la lire.", "speech": "Maintenant, tout le monde comprend !"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'fr';

UPDATE devotional_kids SET story = $j${"format": "dilemma", "image": "/ilustracoes/reforma-protestante/quadros/11-13-cena.svg", "setup": "Worms, 1521. Tu es Martin Luther. Devant les princes et les évêques, on te demande de renier tout ce que tu as écrit. Si tu renies, tu rentres chez toi en paix. Si tu refuses, tu peux tout perdre.", "question": "Que ferais-tu ?", "options": ["Renier et rester en sécurité", "Tenir à ce que je crois", "Demander du temps pour réfléchir"], "outcome": "Luther a demandé un jour pour réfléchir. Le lendemain, il a refusé de se rétracter tant que l'Écriture ne l'aurait pas convaincu. Ensuite, il s'est caché dans un château et a traduit le Nouveau Testament en allemand.", "quote": "Ma conscience est liée à la Parole de Dieu.", "outcomeQuestion": "Quelqu'un changerait-il le choix qu'il vient de faire ?", "today": "À l'époque, l'imprimerie répandait les idées en quelques semaines. Aujourd'hui, une idée fait le tour du monde en quelques secondes.", "todayQuestion": "Quand tu veux savoir si quelque chose est vrai, où cherches-tu d'abord ?"}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'fr';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "In casa c'era un libro molto speciale.", "speech": "Che libro grande!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Un tempo quasi nessuno poteva aprire la Bibbia.", "speech": "Non ci arrivo!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Lutero aprì la Bibbia e vide l'amore di Dio.", "speech": "Dio ci ama gratuitamente!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "Oggi la Bibbia è per tutti!", "speech": "Leggiamo insieme?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'it';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Qualcosa deve cambiare."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "Studiando la Bibbia, scoprì: il perdono è un dono di Dio.", "speech": "Non si compra. Si riceve!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "Scrisse i suoi dubbi e li affisse alla porta della chiesa.", "speech": "95 idee di cui parlare!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Tutti cominciarono a parlarne.", "speech": "Sarà davvero così?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Poi tradusse la Bibbia perché il popolo potesse leggerla.", "speech": "Ora tutti capiscono!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'it';

UPDATE devotional_kids SET story = $j${"format": "dilemma", "image": "/ilustracoes/reforma-protestante/quadros/11-13-cena.svg", "setup": "Worms, 1521. Sei Martin Lutero. Davanti a principi e vescovi, ti chiedono di ritrattare tutto ciò che hai scritto. Se ritratti, torni a casa in pace. Se rifiuti, puoi perdere tutto.", "question": "Che cosa faresti?", "options": ["Ritrattare e restare al sicuro", "Restare fedele a ciò che credo", "Chiedere tempo per pensare"], "outcome": "Lutero chiese un giorno per pensare. Il giorno dopo si rifiutò di ritrattare finché la Scrittura non lo avesse convinto. Dopo questo, rimase nascosto in un castello e tradusse il Nuovo Testamento in tedesco.", "quote": "La mia coscienza è legata alla Parola di Dio.", "outcomeQuestion": "Qualcuno cambierebbe la scelta di poco fa?", "today": "A quel tempo la stampa diffondeva le idee in settimane. Oggi un'idea arriva al mondo in pochi secondi.", "todayQuestion": "Quando vuoi sapere se una cosa è vera, dove cerchi per prima?"}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'it';

SELECT language, band, story->>'format' AS formato, jsonb_array_length(story->'panels') AS quadros
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') ORDER BY language, band;

DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') AND story IS NOT NULL) <> 12 THEN
    RAISE EXCEPTION 'Os UPDATEs não atingiram as 12 versões; desfazendo.';
  END IF;
END $$;

COMMIT;
