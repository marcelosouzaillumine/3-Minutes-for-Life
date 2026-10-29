-- Rascunhos infantis de "Você sabe o que é suficiente para ser feliz?" (Filipenses 4:11–12).
-- Rodar no banco 3minutes-db (Railway › Data). Tudo entra como RASCUNHO: nada aparece no app
-- até alguém mudar o status para "Publicada" na aba Crianças do admin.
-- Não sobrescreve nada: se a faixa já existir, a linha é ignorada.
-- O campo "trecho da passagem" fica vazio de propósito: cole lá o versículo na tradução que o app já usa.

INSERT INTO devotional_kids
  (id, devotional_id, band, language, scripture_focus, what_it_says, think_about, practice, prayer, adult_guide, status, created_at, updated_at)
SELECT gen_random_uuid()::text, d.id, v.band, 'pt-BR', NULL, v.what_it_says, v.think_about, v.practice, v.prayer, v.adult_guide, 'draft', now(), now()
FROM devotionals d
CROSS JOIN (VALUES
  (
    '4-6',
    $$Paulo era amigo de Jesus. Às vezes ele tinha muita comida. Às vezes tinha pouca. Mas ele ficava alegre nos dois dias, porque Deus cuidava dele.$$,
    $$Contente é ficar alegre com o que a gente já tem. Pode ser seu brinquedo, sua comida, sua família.$$,
    $$Diga três coisas que você tem e agradeça a Deus por cada uma.$$,
    $$Deus, obrigado pelo que eu tenho. Amém.$$,
    $$Deixe a criança dizer as três coisas sem corrigir. Se ela citar só brinquedos, tudo bem. Evite comparar com crianças que têm menos.$$
  ),
  (
    '7-10',
    $$Paulo escreveu essa carta sem ter tudo o que queria. Ele conhecia dias de fartura e dias de falta. Disse que aprendeu a ficar contente nos dois, e que isso não vinha das coisas que tinha, mas de confiar em Deus.$$,
    $$Muitas vezes a gente ganha o que queria e logo quer outra coisa. Se a alegria depende de ter sempre mais, ela nunca chega. Contentamento é aprender a perceber o que já é suficiente. A palavra "aprendi" mostra que isso se treina.$$,
    $$Escolha três coisas simples que você tem, como uma refeição, alguém que ama você ou um lugar para morar. Pare um minuto e agradeça a Deus por cada uma.$$,
    $$Deus, ajuda-me a ver o que já tenho e a não viver só pensando no que falta. Obrigado pelo que me deste. Amém.$$,
    $$Pergunte: "O que você queria muito e, quando ganhou, já quis outra coisa?". Não transforme em sermão sobre ser ingrato.$$
  ),
  (
    '11-13',
    $$Paulo escreve da prisão, sem poder escolher o que tinha. Mesmo assim, diz que aprendeu o segredo de viver contente, tanto na fartura quanto na necessidade. A fonte da paz dele não era a situação.$$,
    $$Hoje é fácil olhar só para o que falta: a próxima compra, o próximo objetivo, o que os outros têm nas redes. O texto mostra o problema. Se a paz depende de conseguir sempre mais, nunca haverá um "suficiente". Contentamento não é gostar de tudo nem desistir de mudar o que precisa mudar. É fundar a paz em algo que não muda a cada dia, que para Paulo era a confiança em Deus.$$,
    $$Pense em três coisas comuns da sua vida que você quase nunca nota. Pare um minuto e agradeça a Deus por cada uma. Depois, perceba se isso mudou alguma coisa no seu humor.$$,
    $$Deus, ajuda-me a reconhecer o que já tenho e a não viver preso ao que me falta. Ensina-me a encontrar contentamento nas coisas simples e a receber com gratidão o que colocaste em minhas mãos. Amém.$$,
    $$Faça a pergunta e escute. Evite a resposta pronta: nessa idade a pergunta sincera vale mais que a conclusão certa.$$
  )
) AS v(band, what_it_says, think_about, practice, prayer, adult_guide)
WHERE d.tenant_id = '3minutes'
  AND d.title LIKE 'Você sabe o que é suficiente%'
ON CONFLICT (devotional_id, band, language) DO NOTHING;

-- Conferência: deve listar 3 linhas, todas em draft.
SELECT d.title, k.band, k.status FROM devotional_kids k JOIN devotionals d ON d.id = k.devotional_id ORDER BY k.band;
