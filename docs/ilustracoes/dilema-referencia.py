# Passagem bíblica (reference) no dilema do 11-13 dos 5 devocionais, em 5 idiomas; em pt-BR as citações passam a ser a NAA literal
# (e o Davi ganha a sua) com a fonte (quoteSource). Fora do pt-BR só entram a referência (e o nome de Lutero): a citação traduzida
# não é texto de uma versão publicada, então não leva "Lucas 10.42" ao lado.
# Uso: python3 dilema-referencia.py <snapshot.json> <saida.sql> <saida-rollback.sql>
import json, sys
LANGS = ['pt-BR', 'en', 'es', 'fr', 'it']
REF = {
 'cmvyv3ozp003ho72lezbf5h9r': dict(zip(LANGS, ['Lucas 10.38-42', 'Luke 10:38-42', 'Lucas 10:38-42', 'Luc 10.38-42', 'Luca 10,38-42'])),   # Marta e Maria
 'cmvyun7rw0032o72lmlzc68bk': dict(zip(LANGS, ['Lucas 7.36-50', 'Luke 7:36-50', 'Lucas 7:36-50', 'Luc 7.36-50', 'Luca 7,36-50'])),       # A mulher e o perfume
 'cmvv1whpq0002pm2l3f1bfo13': dict(zip(LANGS, ['Lucas 5.27-32', 'Luke 5:27-32', 'Lucas 5:27-32', 'Luc 5.27-32', 'Luca 5,27-32'])),       # Levi
 'cmvue6llj000koe2lqtw0xdz2': dict(zip(LANGS, ['2 Samuel 6.12-16', '2 Samuel 6:12-16', '2 Samuel 6:12-16', '2 Samuel 6.12-16', '2 Samuele 6,12-16'])),  # Davi
 'cmvudrag10002oe2ldyzmvhaa': dict(zip(LANGS, ['Romanos 1.16-17', 'Romans 1:16-17', 'Romanos 1:16-17', 'Romains 1.16-17', 'Romani 1,16-17'])),    # Reforma
}
# NAA (pt-BR), conferida em bible.com/bible/1840
NAA = {
 'cmvyv3ozp003ho72lezbf5h9r': ('Maria escolheu a boa parte, e esta não lhe será tirada.', 'Lucas 10.42'),
 'cmvyun7rw0032o72lmlzc68bk': ('Os seus pecados estão perdoados.', 'Lucas 7.48'),
 'cmvv1whpq0002pm2l3f1bfo13': ('Os sãos não precisam de médico, e sim os doentes.', 'Lucas 5.31'),
 'cmvue6llj000koe2lqtw0xdz2': ('Davi dançava com todas as suas forças diante do SENHOR.', '2 Samuel 6.14'),
}
LUTERO = dict(zip(LANGS, ['Martinho Lutero, Worms, 1521', 'Martin Luther, Worms, 1521', 'Martín Lutero, Worms, 1521', 'Martin Luther, Worms, 1521', 'Martino Lutero, Worms, 1521']))
REFORMA = 'cmvudrag10002oe2ldyzmvhaa'
q = lambda s: "'" + s.replace("'", "''") + "'"
ids = ','.join(q(i) for i in REF)

def build(snap):
    kids = {(r['d'], r['b'], r['l']): r['story'] for r in snap['kids']}
    fwd = ['-- Passagem bíblica (selo) no dilema do 11-13 e citações em NAA no pt-BR. Só mexe na história (story). Publicar o app e a API ANTES de rodar.', '\\set ON_ERROR_STOP on', 'BEGIN;',
           'DO $$', 'DECLARE n int;', 'BEGIN',
           f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story->>'format' = 'dilemma' AND NOT (story ? 'reference');",
           "  IF n <> 25 THEN RAISE EXCEPTION 'esperava 25 dilemas sem reference e encontrei %', n; END IF;", 'END $$;']
    rb = ['-- Desfaz kids-dilema-referencia.sql: remove reference/quoteSource e devolve as citações do pt-BR ao texto anterior.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    for dev in REF:
        for lang in LANGS:
            patch = {'reference': REF[dev][lang]}
            if lang == 'pt-BR' and dev in NAA:
                patch['quote'], patch['quoteSource'] = NAA[dev]
            if dev == REFORMA:
                patch['quoteSource'] = LUTERO[lang]
            where = f"WHERE devotional_id = {q(dev)} AND band = '11-13' AND language = {q(lang)} AND story->>'format' = 'dilemma'"
            fwd.append(f"UPDATE devotional_kids SET story = story || {q(json.dumps(patch, ensure_ascii=False))}::jsonb, updated_at = now() {where};")
            old = kids[(dev, '11-13', lang)].get('quote')
            restore = (f" || jsonb_build_object('quote', {q(old)})" if old else '') if 'quote' in patch else ''
            drop = " - 'quote'" if ('quote' in patch and not old) else ''
            rb.append(f"UPDATE devotional_kids SET story = (story - 'reference' - 'quoteSource'{drop}){restore}, updated_at = now() {where};")
    fwd += ['DO $$', 'DECLARE n int;', 'BEGIN',
            f"  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND (story->>'reference') IS NULL;",
            "  IF n <> 0 THEN RAISE EXCEPTION '% dilemas sem reference', n; END IF;", 'END $$;',
            f"SELECT language, count(*) AS dilemas, count(story->>'quoteSource') AS com_fonte FROM devotional_kids WHERE devotional_id IN ({ids}) AND band = '11-13' GROUP BY 1 ORDER BY 1;", 'COMMIT;']
    rb.append('COMMIT;')
    return '\n'.join(fwd) + '\n', '\n'.join(rb) + '\n'

if __name__ == '__main__':
    a, b = build(json.load(open(sys.argv[1])))
    open(sys.argv[2], 'w').write(a); open(sys.argv[3], 'w').write(b); print('ok', a.count('UPDATE '))
