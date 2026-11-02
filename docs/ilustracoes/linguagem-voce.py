# Linguagem das versões infantis em pt-BR sem tu/vós: só você, eu, ele/ela e nós (orações, guias, falas).
# Uso: python3 linguagem-voce.py <pt-br.json> <saida.sql> <saida-rollback.sql>
#   pt-br.json = linhas atuais de devotional_kids (pt-BR) exportadas da produção: id, devotional_id, band, prayer, adult_guide, think_about, story
import json, sys

# (final do id do devocional, faixa) -> (oração da criança, oração em família). None = não muda.
P = {
 ('vhaa', '0-3'): (None, 'Senhor, obrigado pela Bíblia, que nos mostra quem você é. Ensine a nossa família a conhecer você. Amém.'),
 ('vhaa', '11-13'): ('Deus, obrigado porque você me aceita pela graça, e não pelo meu esforço. Ajude-me a deixar a sua Palavra ter a última palavra sobre o que eu creio, mesmo quando ela questiona minhas certezas. Às vezes tenho dúvidas; ensine-me a confiar em você. Amém.',
                     'Senhor, obrigado porque você nos aceita pela graça, e não pelo nosso esforço. Dê à nossa família coragem para deixar a sua Palavra ter a última palavra. Em nome de Jesus, amém.'),
 ('vhaa', '4-6'): ('Querido Deus, obrigado pela Bíblia, que me conta do seu amor.\nObrigado porque você me perdoa de presente, por causa de Jesus. Amém.',
                   'Senhor, obrigado pela Bíblia, que nos mostra quem você é. Obrigado porque você nos perdoa por causa de Jesus. Ajude nossa família a ler a sua Palavra. Em nome de Jesus, amém.'),
 ('vhaa', '7-10'): ('Deus, obrigado pela Bíblia, que me mostra a verdade sobre você. Obrigado porque o seu perdão é um presente que recebo confiando em Jesus. Ajude-me a confiar no que a sua Palavra ensina. Hoje eu também quero pedir… (fale com suas palavras). Amém.',
                    'Senhor, obrigado pela Bíblia e pelo perdão que é presente, recebido pela fé em Jesus. Ensine nossa família a voltar sempre à sua Palavra. Em nome de Jesus, amém.'),
 ('xdz2', '0-3'): (None, 'Senhor, obrigado por estar com a nossa família. Encha a nossa casa de alegria. Amém.'),
 ('xdz2', '11-13'): ('Deus, você é santo e, por causa de Jesus, me recebe perto de você. Quando a fé parecer só rotina ou quando eu me preocupar demais com o que os outros pensam, renove em mim a alegria de conhecer você. Ajude-me a adorar você com sinceridade, do jeito que eu sou. Em nome de Jesus, amém.',
                     'Senhor, obrigado porque, por meio de Jesus, podemos viver na sua presença. Renove em nós a alegria de conhecer você e ensine-nos a honrar você em casa e fora dela. Em nome de Jesus, amém.'),
 ('xdz2', '4-6'): ('Querido Deus, obrigado porque você está comigo. Eu fico feliz em estar perto de você. Quero louvar você com todo o meu coração. Em nome de Jesus, amém.',
                   'Senhor, obrigado por estar com a nossa família. Encha nossa casa da alegria de conhecer você. Em nome de Jesus, amém.'),
 ('xdz2', '7-10'): ('Deus, obrigado porque você está perto de mim. Ensine-me a respeitar você e a me alegrar em você. Quero adorar você de coração, mesmo quando alguém não entender. Agora quero dizer, com minhas palavras, por que estou feliz em conhecer você. Em nome de Jesus, amém.',
                    'Senhor, você é santo e bom. Obrigado porque podemos estar perto de você. Ensine nossa família a adorar você com respeito e alegria. Em nome de Jesus, amém.'),
 ('fo13', '0-3'): ('Obrigado, Jesus, porque você ama todas as pessoas. Amém.', 'Jesus, obrigado por amar todas as pessoas. Sente-se à mesa com a nossa família. Amém.'),
 ('fo13', '11-13'): ('Jesus, ajude-me a reconhecer meus pecados e a pedir perdão. Quando eu apontar o erro de alguém, lembre-me de quanto preciso da sua misericórdia. Dê-me coragem para interromper uma humilhação e disposição para ouvir. Ensine-me a tratar as pessoas como alguém que também foi acolhido por você. Amém.',
                     'Jesus, obrigado porque você nos acolhe mesmo quando erramos. Ensine nossa família a reconhecer os próprios erros e a abrir espaço para quem está de fora. Amém.'),
 ('fo13', '4-6'): ('Jesus, perdoe o que faço de errado. Ajude-me a ouvir a sua Palavra. Ensine-me a dar atenção às pessoas. Amém.',
                   'Jesus, obrigado porque você recebe todas as pessoas. Perdoe o que fazemos de errado e ajude nossa família a abrir a mesa para os outros. Amém.'),
 ('fo13', '7-10'): ('Jesus, obrigado por chamar pessoas que precisam de perdão. Ajude-me a contar a verdade e a corrigir o que faço de errado. Quando outra pessoa errar, ensine-me a tratá-la com respeito e a lembrar que também preciso de você. Amém.',
                    'Jesus, obrigado por chamar pessoas que precisam de perdão, e nós somos assim. Ajude nossa família a contar a verdade, a corrigir o que erramos e a tratar os outros com respeito. Amém.'),
 ('68bk', '0-3'): ('Obrigado, Jesus, por me perdoar e me amar. Amém.', 'Jesus, obrigado porque você perdoa os nossos erros e nos ama. Ajude a nossa família a cuidar uns dos outros. Amém.'),
 ('68bk', '11-13'): ('Jesus, ajude-me a reconhecer meus pecados sem me esconder nas desculpas. Ao confiar no seu perdão, quero aprender a agradecer e mudar. Que meu amor por você apareça na maneira como falo, escuto e trato as pessoas. Amém.',
                     'Jesus, obrigado porque o seu perdão alcança nossa vida. Ensine-nos a admitir nossos erros com sinceridade e a tratar uns aos outros com paciência e verdade. Amém.'),
 ('68bk', '4-6'): ('Jesus, quando eu fizer algo errado, ajude-me a reconhecer e a pedir perdão. Obrigado por me amar. Quero demonstrar meu amor por você cuidando das pessoas. Amém.',
                   'Jesus, obrigado porque você perdoa nossos erros. Ensine nossa família a amar você e a cuidar uns dos outros. Amém.'),
 ('68bk', '7-10'): ('Jesus, quando tento justificar meus erros, ajude-me a reconhecer o que preciso mudar. Obrigado pelo seu perdão. Que minha gratidão se transforme em amor por você e em cuidado com as pessoas. Amém.',
                    'Jesus, obrigado porque você perdoa o que não conseguimos pagar. Ajude-nos a assumir nossos erros e a mostrar nossa gratidão cuidando uns dos outros. Amém.'),
 ('5h9r', '0-3'): ('Obrigado, Jesus, por falar comigo. Amém.', 'Jesus, obrigado por visitar a nossa casa. Ensine a nossa família a parar e a ouvir você. Amém.'),
 ('5h9r', '11-13'): ('Jesus, quero conhecer você além dos momentos em que preciso de ajuda. Ensine-me a desfrutar da sua companhia e a ouvir a sua palavra com sinceridade. Que eu encontre descanso no seu amor e deixe que o seu ensino oriente minhas escolhas. Amém.',
                     'Jesus, obrigado porque você nos ama além do que produzimos. Ajude nossa família a descansar no seu amor e a ouvir a sua palavra antes de correr atrás de tudo o que precisa ser feito. Amém.'),
 ('5h9r', '4-6'): ('Jesus, obrigado pelo seu amor. Quero conhecer as suas histórias e aprender com você. Ajude-me a guardar o que você ensina. Amém.',
                   'Jesus, obrigado pelo seu amor. Queremos ouvir as suas histórias e guardar o que você ensina. Ajude nossa família a ficar sempre perto de você. Amém.'),
 ('5h9r', '7-10'): ('Jesus, quero conhecer você melhor. Obrigado por me ouvir e por tudo o que você ensina. Ajude-me a reservar um tempo para estar com você e a lembrar das suas palavras nas escolhas de cada dia. Amém.',
                    'Senhor Jesus, obrigado porque podemos conhecer você e ouvir a sua palavra. Ensine nossa família a reservar tempo para estar com você, no meio das nossas tarefas. Amém.'),
}
# Trocas pontuais dentro de um campo: (final do id, faixa, campo) -> [(antes, depois)]
R = {
 ('vhaa', '11-13', 'adult_guide'): [('Usa papel, caneta e uma Bíblia, e leva cerca de 10 minutos.', 'Use papel, caneta e uma Bíblia. A atividade leva cerca de 10 minutos.')],
 ('68bk', '11-13', 'adult_guide'): [('Usa papel e caneta e leva cerca de 10 minutos.', 'Use papel e caneta. A atividade leva cerca de 10 minutos.')],
 ('68bk', '7-10', 'adult_guide'): [('Usa objetos de casa e leva cerca de 10 minutos.', 'Use objetos de casa. A atividade leva cerca de 10 minutos.')],
 ('5h9r', '7-10', 'think_about'): [('Arruma o quarto, escolhe uma brincadeira e separa um lanche.', 'Você arruma o quarto, escolhe uma brincadeira e separa um lanche.')],
}
SPEECH = {('68bk', '4-6'): ('Simão, tenho uma coisa para te dizer.', 'Simão, tenho uma coisa para dizer a você.'),
          ('5h9r', '7-10'): ('Senhor, não te importas?', 'O Senhor não se importa?')}

q = lambda s: "'" + s.replace("'", "''") + "'"

def rewrite(row):
    k = (row['devotional_id'][-4:], row['band'])
    new = {'prayer': row['prayer'], 'adult_guide': row['adult_guide'], 'think_about': row['think_about'], 'story': json.loads(json.dumps(row['story']))}
    if k in P:
        pr, fam = P[k]
        if pr is not None: new['prayer'] = pr
        i = new['adult_guide'].index('Oração em família:\n') + len('Oração em família:\n')
        new['adult_guide'] = new['adult_guide'][:i] + fam
    for field in ('adult_guide', 'think_about'):
        for a, b in R.get(k + (field,), []):
            assert a in new[field], (k, a)
            new[field] = new[field].replace(a, b)
    if k in SPEECH:
        a, b = SPEECH[k]
        hit = [p for p in new['story']['panels'] if p.get('speech') == a]
        assert len(hit) == 1, k
        hit[0]['speech'] = b
    return new

def build(rows):
    f = ['-- Linguagem sem tu/vós nas versões infantis em pt-BR: orações, guias e falas passam a usar você, eu, ele/ela e nós. Cada UPDATE só vale se a linha ainda estiver como exportada.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    r = ['-- Desfaz kids-linguagem-voce.sql.', '\\set ON_ERROR_STOP on', 'BEGIN;']
    n = 0
    for row in rows:
        new = rewrite(row)
        if all(new[c] == row[c] for c in new):
            continue
        n += 1
        cols = ', '.join(f"{c} = {q(new[c])}" if c != 'story' else f"story = {q(json.dumps(new['story'], ensure_ascii=False))}::jsonb" for c in ('prayer', 'adult_guide', 'think_about', 'story') if new[c] != row[c])
        back = ', '.join(f"{c} = {q(row[c])}" if c != 'story' else f"story = {q(json.dumps(row['story'], ensure_ascii=False))}::jsonb" for c in ('prayer', 'adult_guide', 'think_about', 'story') if new[c] != row[c])
        guard = ' AND '.join(f"{c} = {q(row[c])}" if c != 'story' else f"story = {q(json.dumps(row['story'], ensure_ascii=False))}::jsonb" for c in ('prayer', 'adult_guide', 'think_about', 'story') if new[c] != row[c])
        gnew = ' AND '.join(f"{c} = {q(new[c])}" if c != 'story' else f"story = {q(json.dumps(new['story'], ensure_ascii=False))}::jsonb" for c in ('prayer', 'adult_guide', 'think_about', 'story') if new[c] != row[c])
        f.append(f"UPDATE devotional_kids SET {cols}, updated_at = now() WHERE id = {q(row['id'])} AND {guard};")
        r.append(f"UPDATE devotional_kids SET {back}, updated_at = now() WHERE id = {q(row['id'])} AND {gnew};")
    f += [f"DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM devotional_kids WHERE language = 'pt-BR' AND (prayer ~* '\\m(tu|ti|contigo|teu|tua|teus|tuas)\\M' OR adult_guide ~* '\\m(tu|ti|contigo|teu|tua|teus|tuas)\\M'); IF n <> 0 THEN RAISE EXCEPTION '% versoes ainda com tu', n; END IF; END $$;", 'COMMIT;']
    r.append('COMMIT;')
    return '\n'.join(f) + '\n', '\n'.join(r) + '\n', n

if __name__ == '__main__':
    a, b, n = build(json.load(open(sys.argv[1])))
    open(sys.argv[2], 'w').write(a); open(sys.argv[3], 'w').write(b); print('ok', n, 'linhas')
