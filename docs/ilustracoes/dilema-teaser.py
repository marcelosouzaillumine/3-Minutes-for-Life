# Frase do cartão (teaser) do dilema do 11-13, para o seletor de versão: apresentação curta da cena + a pergunta que a faixa já tem.
# 5 devocionais × 5 idiomas. Uso: python3 dilema-teaser.py <snapshot.json> <saida.sql> <saida-rollback.sql>
import json, sys
LANGS = ['pt-BR', 'en', 'es', 'fr', 'it']
HOOK = {
 'cmvyv3ozp003ho72lezbf5h9r': ['Jesus chegou, há muito a fazer e sua irmã só ouve.', 'Jesus has arrived, there is much to do, and your sister just listens.', 'Jesús llegó, hay mucho por hacer y tu hermana solo escucha.', "Jésus est arrivé, il y a beaucoup à faire et ta sœur ne fait qu'écouter.", 'Gesù è arrivato, c’è molto da fare e tua sorella ascolta soltanto.'],
 'cmvyun7rw0032o72lmlzc68bk': ['Uma mulher chora aos pés de Jesus, e todos olham para você.', "A woman weeps at Jesus' feet, and everyone looks at you.", 'Una mujer llora a los pies de Jesús y todos te miran.', 'Une femme pleure aux pieds de Jésus, et tous te regardent.', 'Una donna piange ai piedi di Gesù e tutti guardano te.'],
 'cmvv1whpq0002pm2l3f1bfo13': ['Jesus está à mesa, e seus amigos reclamam.', 'Jesus is at the table, and your friends complain.', 'Jesús está a la mesa y tus amigos se quejan.', 'Jésus est à table, et tes amis se plaignent.', 'Gesù è a tavola e i tuoi amici si lamentano.'],
 'cmvue6llj000koe2lqtw0xdz2': ['A arca chega e todos esperam pose de rei, mas seu coração transborda.', 'The ark arrives and everyone expects a dignified king, but your heart overflows.', 'Llega el arca y todos esperan un rey solemne, pero tu corazón desborda.', "L'arche arrive et tous attendent un roi solennel, mais ton cœur déborde.", 'Arriva l’arca e tutti si aspettano un re solenne, ma il tuo cuore trabocca.'],
 'cmvudrag10002oe2ldyzmvhaa': ['Em Worms, mandam você negar tudo o que escreveu.', 'In Worms, you are told to deny everything you wrote.', 'En Worms te piden negar todo lo que escribiste.', "À Worms, on te demande de nier tout ce que tu as écrit.", 'A Worms ti chiedono di negare tutto ciò che hai scritto.'],
}
q = lambda s: "'" + s.replace("'", "''") + "'"
ids = ','.join(q(i) for i in HOOK)
def build(snap):
    ques = {(r['d'], r['l']): r['story']['question'] for r in snap['kids'] if r['b'] == '11-13'}
    f = ['-- Frase do cartão (teaser) do dilema do 11-13, no seletor de versão. Só mexe na história (story). Publicar o app e a API ANTES de rodar.', '\\set ON_ERROR_STOP on', 'BEGIN;',
         f"DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story->>'format' = 'dilemma' AND NOT (story ? 'teaser'); IF n <> 25 THEN RAISE EXCEPTION 'esperava 25 dilemas sem teaser e encontrei %', n; END IF; END $$;"]
    r = ['-- Desfaz kids-dilema-teaser.sql.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    for dev, hooks in HOOK.items():
        for lang, hook in zip(LANGS, hooks):
            t = f"{hook} {ques[(dev, lang)]}"
            assert len(t) <= 100, (dev, lang, len(t), t)
            w = f"WHERE devotional_id = {q(dev)} AND band = '11-13' AND language = {q(lang)} AND story->>'format' = 'dilemma'"
            f.append(f"UPDATE devotional_kids SET story = story || jsonb_build_object('teaser', {q(t)}::text), updated_at = now() {w} AND NOT (story ? 'teaser');")
            r.append(f"UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() {w};")
            print(lang, len(t), t)
    f += [f"DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND (story->>'teaser') IS NULL; IF n <> 0 THEN RAISE EXCEPTION '% dilemas sem teaser', n; END IF; END $$;", 'COMMIT;']
    r.append('COMMIT;')
    return '\n'.join(f) + '\n', '\n'.join(r) + '\n'
if __name__ == '__main__':
    a, b = build(json.load(open(sys.argv[1])))
    open(sys.argv[2], 'w').write(a); open(sys.argv[3], 'w').write(b)
