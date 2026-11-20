# Desfecho do dilema do Levi (11-13) mais completo: conta a cena da passagem (Lc 5.27-32) antes da lição.
# pt-BR usa as palavras da NAA entre aspas; nos outros idiomas o relato é parafraseado, sem aspas.
# A frase "Os sãos não precisam de médico..." continua só no bloco da citação, para não se repetir.
# Uso: python3 levi-11-13-desfecho.py <snapshot.json> <saida.sql> <saida-rollback.sql>
import json, sys
DEV = 'cmvv1whpq0002pm2l3f1bfo13'
NEW = {
 'pt-BR': 'Levi era cobrador de impostos, e muita gente o desprezava. Jesus o viu na coletoria e disse: “Siga-me!”. Levi se levantou, deixou tudo e o seguiu. Depois ofereceu um grande banquete em casa, e Jesus se sentou à mesa com publicanos e outras pessoas desprezadas. Os fariseus murmuraram: “Por que vocês comem e bebem com os publicanos e pecadores?”. Jesus estava à mesa com quem mais sabia que precisava dele. Ele veio chamar pecadores ao arrependimento: reconhecer o erro, voltar para Deus e mudar de direção. Quem reclamava também precisava de perdão.',
 'en': 'Levi was a tax collector, and many people looked down on him. Jesus saw him at his booth and told him to follow him. Levi got up, left everything and followed. Then he held a great banquet at his house, and Jesus sat at the table with tax collectors and other people others avoided. The Pharisees muttered, asking why Jesus’ disciples ate and drank with tax collectors and sinners. Jesus was at the table with those who knew best that they needed him. He came to call sinners to repentance: to admit wrong, turn back to God and change direction. Those who complained needed forgiveness too.',
 'es': 'Leví era cobrador de impuestos, y mucha gente lo despreciaba. Jesús lo vio en su despacho y le dijo que lo siguiera. Leví se levantó, lo dejó todo y lo siguió. Después ofreció un gran banquete en su casa, y Jesús se sentó a la mesa con publicanos y otras personas despreciadas. Los fariseos murmuraron y preguntaron por qué los discípulos comían y bebían con publicanos y pecadores. Jesús estaba a la mesa con quienes mejor sabían que lo necesitaban. Vino a llamar a los pecadores al arrepentimiento: reconocer el error, volver a Dios y cambiar de rumbo. Quienes se quejaban también necesitaban perdón.',
 'fr': "Lévi était collecteur d'impôts, et beaucoup de gens le méprisaient. Jésus le vit à son bureau et lui dit de le suivre. Lévi se leva, laissa tout et le suivit. Puis il offrit un grand festin chez lui, et Jésus s'assit à table avec des collecteurs d'impôts et d'autres personnes méprisées. Les pharisiens murmurèrent et demandèrent pourquoi les disciples mangeaient et buvaient avec les collecteurs d'impôts et les pécheurs. Jésus était à table avec ceux qui savaient le mieux qu'ils avaient besoin de lui. Il est venu appeler les pécheurs à la repentance : reconnaître son erreur, revenir à Dieu et changer de direction. Ceux qui se plaignaient avaient eux aussi besoin de pardon.",
 'it': "Levi era un esattore delle tasse, e molti lo disprezzavano. Gesù lo vide al banco e gli disse di seguirlo. Levi si alzò, lasciò tutto e lo seguì. Poi organizzò un grande banchetto in casa sua, e Gesù si sedette a tavola con esattori e altre persone disprezzate. I farisei mormoravano e chiesero perché i discepoli mangiassero e bevessero con gli esattori e i peccatori. Gesù era a tavola con chi sapeva meglio di avere bisogno di lui. Era venuto a chiamare i peccatori al pentimento: riconoscere l'errore, tornare a Dio e cambiare direzione. Anche chi si lamentava aveva bisogno di perdono.",
}
q = lambda s: "'" + s.replace("'", "''") + "'"
def build(snap):
    old = {r['l']: r['story']['outcome'] for r in snap['kids'] if r['d'] == DEV and r['b'] == '11-13'}
    assert set(old) == set(NEW) and all(len(v) <= 800 for v in NEW.values())
    f = ['-- Desfecho do Levi (11-13) mais completo, em 5 idiomas. Só mexe em story.outcome; cada UPDATE só vale se o texto ainda for o antigo.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    r = ['-- Desfaz kids-levi-11-13-desfecho.sql: devolve o desfecho anterior.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    for l in NEW:
        w = f"WHERE devotional_id = {q(DEV)} AND band = '11-13' AND language = {q(l)}"
        f.append(f"UPDATE devotional_kids SET story = jsonb_set(story, '{{outcome}}', to_jsonb({q(NEW[l])}::text)), updated_at = now() {w} AND story->>'outcome' = {q(old[l])};")
        r.append(f"UPDATE devotional_kids SET story = jsonb_set(story, '{{outcome}}', to_jsonb({q(old[l])}::text)), updated_at = now() {w} AND story->>'outcome' = {q(NEW[l])};")
    f += [f"DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id = {q(DEV)} AND band = '11-13' AND (story->>'outcome') = ANY (ARRAY[{','.join(q(v) for v in NEW.values())}]); IF n <> 5 THEN RAISE EXCEPTION 'esperava 5 desfechos novos e encontrei %', n; END IF; END $$;", 'COMMIT;']
    r.append('COMMIT;')
    return '\n'.join(f) + '\n', '\n'.join(r) + '\n'
if __name__ == '__main__':
    a, b = build(json.load(open(sys.argv[1])))
    open(sys.argv[2], 'w').write(a); open(sys.argv[3], 'w').write(b); print('ok', {l: len(v) for l, v in NEW.items()})
