# As 4 imagens em todas as faixas: o 4-6 de Davi, Levi, Marta e Perfume ganha o quadro que faltava (3 -> 4) e o dilema do 11-13
# passa a mostrar uma imagem por momento (images = faixa-11-13-1..4). Todos os devocionais de 31/10 a 04/11, em pt-BR, en, es, fr e it.
# Uso: python3 quatro-imagens.py <snapshot.json> <saida.sql> <saida-rollback.sql>   (snapshot = textos atuais da produção, só os 'kids')
import json, sys

LANGS = ['pt-BR', 'en', 'es', 'fr', 'it']
SLUG = {'cmvudrag10002oe2ldyzmvhaa': 'reforma-protestante', 'cmvue6llj000koe2lqtw0xdz2': 'davi-e-a-arca', 'cmvv1whpq0002pm2l3f1bfo13': 'levi-e-o-banquete',
        'cmvyun7rw0032o72lmlzc68bk': 'a-mulher-e-o-perfume', 'cmvyv3ozp003ho72lezbf5h9r': 'marta-e-maria'}
# Quadro que faltava no 4-6: (id do devocional) -> (posição na lista, número da imagem, {idioma: (legenda, fala)})
NEW = {
 'cmvue6llj000koe2lqtw0xdz2': (1, 2, {
   'pt-BR': ('Davi agradeceu a Deus com as mãos para o alto.', 'Obrigado, Senhor!'),
   'en': ('David thanked God with his hands lifted up.', 'Thank you, Lord!'),
   'es': ('David dio gracias a Dios con las manos en alto.', '¡Gracias, Señor!'),
   'fr': ('David remercia Dieu, les mains levées.', 'Merci, Seigneur !'),
   'it': ('Davide ringraziò Dio con le mani alzate.', 'Grazie, Signore!')}),
 'cmvv1whpq0002pm2l3f1bfo13': (1, 2, {
   'pt-BR': ('Levi deixou tudo e foi com Jesus.', 'Eu vou!'),
   'en': ('Levi left everything and went with Jesus.', "I'm coming!"),
   'es': ('Leví lo dejó todo y fue con Jesús.', '¡Voy!'),
   'fr': ('Lévi a tout laissé et a suivi Jésus.', "J'arrive !"),
   'it': ('Levi lasciò tutto e andò con Gesù.', 'Vengo!')}),
 'cmvyv3ozp003ho72lezbf5h9r': (2, 3, {
   'pt-BR': ('Marta ficou cansada de tanto trabalhar.', 'Tem tanta coisa para fazer!'),
   'en': ('Martha got tired from working so much.', 'There is so much to do!'),
   'es': ('Marta se cansó de tanto trabajar.', '¡Hay tanto por hacer!'),
   'fr': ('Marthe était fatiguée de tant travailler.', 'Il y a tant à faire !'),
   'it': ('Marta si stancò di lavorare tanto.', "C'è tanto da fare!")}),
 'cmvyun7rw0032o72lmlzc68bk': (2, 3, {
   'pt-BR': ('Simão achou que a mulher não merecia estar ali. Jesus falou com ele com calma.', 'Simão, tenho uma coisa para te dizer.'),
   'en': ("Simon thought the woman didn't belong there. Jesus spoke to him calmly.", 'Simon, I have something to tell you.'),
   'es': ('Simón pensó que la mujer no merecía estar allí. Jesús le habló con calma.', 'Simón, tengo algo que decirte.'),
   'fr': ("Simon pensait que la femme n'avait pas sa place ici. Jésus lui parla calmement.", "Simon, j'ai quelque chose à te dire."),
   'it': ('Simone pensò che la donna non meritasse di stare lì. Gesù gli parlò con calma.', 'Simone, ho una cosa da dirti.')}),
}

q = lambda s: "'" + s.replace("'", "''") + "'"
ids = ','.join(q(i) for i in SLUG)


def build(snap):
    kids = {(r['d'], r['b'], r['l']): r for r in snap['kids']}
    fwd = ['-- As 4 imagens em todas as faixas: 4-6 de Davi, Levi, Marta e Perfume ganha o quadro que faltava; o dilema do 11-13 passa a ter uma imagem por momento (images). Só mexe na história (story). Publicar o app e a API ANTES de rodar.',
           '\\set ON_ERROR_STOP on', 'BEGIN;']
    rb = ['-- Desfaz kids-quatro-imagens.sql: o 4-6 volta a ter 3 quadros e o dilema do 11-13 volta a ter só a imagem única.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    fwd += ['DO $$', 'DECLARE n int;', 'BEGIN',
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({','.join(q(i) for i in NEW)}) AND band = '4-6' AND language IN ('pt-BR','en','es','fr','it') AND jsonb_array_length(story->'panels') = 3;",
            "  IF n <> 20 THEN RAISE EXCEPTION 'esperava 20 versoes 4-6 com 3 quadros e encontrei %', n; END IF;",
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story->>'format' = 'dilemma' AND NOT (story ? 'images');",
            "  IF n <> 25 THEN RAISE EXCEPTION 'esperava 25 dilemas sem images e encontrei %', n; END IF;", 'END $$;']
    for dev, (pos, num, per) in NEW.items():
        for lang in LANGS:
            old = kids[(dev, '4-6', lang)]['story']
            assert len(old['panels']) == 3
            panel = {'image': f"/ilustracoes/{SLUG[dev]}/quadros/faixa-4-6-{num}.webp", 'caption': per[lang][0], 'speech': per[lang][1]}
            panels = old['panels'][:pos] + [panel] + old['panels'][pos:]
            nums = [int(p['image'].split('-')[-1].split('.')[0]) for p in panels]
            assert nums == [1, 2, 3, 4], (dev, lang, nums)
            fwd.append(f"UPDATE devotional_kids SET story = jsonb_set(story, '{{panels}}', {q(json.dumps(panels, ensure_ascii=False))}::jsonb), updated_at = now() WHERE devotional_id = {q(dev)} AND band = '4-6' AND language = {q(lang)} AND jsonb_array_length(story->'panels') = 3;")
            rb.append(f"UPDATE devotional_kids SET story = jsonb_set(story, '{{panels}}', {q(json.dumps(old['panels'], ensure_ascii=False))}::jsonb), updated_at = now() WHERE devotional_id = {q(dev)} AND band = '4-6' AND language = {q(lang)} AND jsonb_array_length(story->'panels') = 4;")
    for dev, slug in SLUG.items():
        imgs = [f"/ilustracoes/{slug}/quadros/faixa-11-13-{n}.webp" for n in (1, 2, 3, 4)]
        fwd.append(f"UPDATE devotional_kids SET story = story || jsonb_build_object('images', {q(json.dumps(imgs))}::jsonb), updated_at = now() WHERE devotional_id = {q(dev)} AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story->>'format' = 'dilemma' AND NOT (story ? 'images');")
        rb.append(f"UPDATE devotional_kids SET story = story - 'images', updated_at = now() WHERE devotional_id = {q(dev)} AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it');")
    fwd += ['DO $$', 'DECLARE n int;', 'BEGIN',
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band IN ('4-6','7-10') AND language IN ('pt-BR','en','es','fr','it') AND (SELECT count(DISTINCT p->>'image') FROM jsonb_array_elements(story->'panels') p) < 4;",
            "  IF n <> 0 THEN RAISE EXCEPTION '% versoes 4-6 ou 7-10 sem as 4 imagens', n; END IF;",
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND jsonb_array_length(story->'images') <> 4;",
            "  IF n <> 0 THEN RAISE EXCEPTION '% dilemas sem as 4 imagens', n; END IF;", 'END $$;',
            f"SELECT band, count(*) AS versoes FROM devotional_kids WHERE devotional_id IN ({ids}) AND band IN ('4-6','7-10','11-13') GROUP BY 1 ORDER BY 1;", 'COMMIT;']
    rb += ['COMMIT;']
    return '\n'.join(fwd) + '\n', '\n'.join(rb) + '\n'


if __name__ == '__main__':
    a, b = build(json.load(open(sys.argv[1])))
    open(sys.argv[2], 'w').write(a)
    open(sys.argv[3], 'w').write(b)
    print('ok', a.count('UPDATE '), 'updates')
