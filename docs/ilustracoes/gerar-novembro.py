# Gera os desenhos (SVG, sem texto) dos devocionais de 01 a 04/11. Mesmo estilo da Reforma: 300x240, formas simples.
import os, sys
OUT = sys.argv[1]

SKIN = '#F2C7A1'
def person(x, y, s=1.0, robe='#7AA6C9', hair='#6B4F2F', head=None, mood='smile', arms='down', beard=False, crown=False, sit=False, flip=False, skin=SKIN):
    t = f'translate({x + 60 * s},{y}) scale({-s},{s})' if flip else f'translate({x},{y}) scale({s})'
    o = [f'<g transform="{t}">']
    arm = {'down': [(8, 60, 4, 84), (52, 60, 56, 84)], 'up': [(10, 56, 2, 26), (50, 56, 58, 26)], 'out': [(10, 58, -6, 70), (50, 58, 66, 70)],
           'hold': [(12, 60, 26, 76), (48, 60, 34, 76)], 'point': [(10, 58, 4, 82), (50, 58, 74, 54)], 'one': [(10, 58, 4, 82), (50, 58, 62, 30)]}[arms]
    for (x1, y1, x2, y2) in arm:
        o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{robe}" stroke-width="10" stroke-linecap="round"/><circle cx="{x2}" cy="{y2}" r="5" fill="{skin}"/>')
    if sit:
        o.append(f'<rect x="10" y="48" width="40" height="36" rx="16" fill="{robe}"/><ellipse cx="30" cy="90" rx="34" ry="12" fill="{robe}"/>')
    else:
        o.append(f'<rect x="10" y="48" width="40" height="52" rx="16" fill="{robe}"/>')
    o.append(f'<circle cx="30" cy="30" r="20" fill="{skin}"/>')
    if head:
        o.append(f'<rect x="5" y="26" width="9" height="30" rx="4" fill="{head}"/><rect x="46" y="26" width="9" height="30" rx="4" fill="{head}"/><path d="M8 34q-2-34 22-34q24 0 22 34q-6-16-22-16q-16 0-22 16z" fill="{head}"/>')
    else:
        o.append(f'<path d="M10 28q4-26 40 0q-8-10-20-9q-12 0-20 9z" fill="{hair}"/>')
    mc = '#3A3F4F'
    if beard:
        o.append(f'<path d="M12 38q2 24 18 24q16 0 18-24q-8 8-18 8q-10 0-18-8z" fill="{hair}"/>')
        mc = '#FFFFFF'
    if crown:
        o.append('<path d="M14 14l5-10l6 7l5-9l5 9l6-7l5 10z" fill="#F2C94C" stroke="#C99A1A" stroke-width="1.5"/>')
    o.append('<circle cx="23" cy="31" r="2.6" fill="#3A3F4F"/><circle cx="37" cy="31" r="2.6" fill="#3A3F4F"/>')
    if mood == 'smile':
        o.append(f'<path d="M23 40q7 6 14 0" stroke="{mc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    elif mood == 'happy':
        o.append(f'<path d="M22 39q8 10 16 0z" fill="#8A3B3B"/>')
    elif mood == 'frown':
        o.append(f'<path d="M23 44q7-6 14 0" stroke="{mc}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M19 25l8 3M41 25l-8 3" stroke="#3A3F4F" stroke-width="2.2" stroke-linecap="round"/>')
    elif mood == 'sad':
        o.append(f'<path d="M23 44q7-6 14 0" stroke="{mc}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M20 27l6-3M40 27l-6-3" stroke="#3A3F4F" stroke-width="2" stroke-linecap="round"/><path d="M22 36q-3 6 0 9q3-3 0-9z" fill="#7FB8E6"/><path d="M38 36q3 6 0 9q-3-3 0-9z" fill="#7FB8E6"/>')
    else:
        o.append(f'<path d="M24 42h12" stroke="{mc}" stroke-width="2.4" stroke-linecap="round"/>')
    o.append('</g>')
    return ''.join(o)

def jesus(x, y, s=1.0, **k):
    k.setdefault('mood', 'smile')
    return person(x, y, s, robe='#F4F1EA', hair='#8B5E3C', beard=True, **k) + f'<g transform="translate({x},{y}) scale({s})"><rect x="10" y="66" width="40" height="7" fill="#4C78A8"/></g>'

def bg(sky='#FDF1D6', ground='#E3C79A', gy=190):
    return f'<rect width="300" height="240" fill="{sky}"/><rect y="{gy}" width="300" height="{240 - gy}" fill="{ground}"/>'
def sun(x=250, y=40, r=22):
    rays = ''.join(f'<line x1="{x}" y1="{y}" x2="{x + 38 * __import__("math").cos(a / 8 * 6.2832):.1f}" y2="{y + 38 * __import__("math").sin(a / 8 * 6.2832):.1f}" stroke="#F7D77A" stroke-width="4" stroke-linecap="round"/>' for a in range(8))
    return rays + f'<circle cx="{x}" cy="{y}" r="{r}" fill="#F7D77A"/>'
def walls():
    r = '<rect x="0" y="110" width="300" height="80" fill="#D9BE8E"/>'
    r += ''.join(f'<rect x="{i * 40 + 6}" y="98" width="22" height="16" fill="#D9BE8E"/>' for i in range(8))
    r += '<rect x="120" y="130" width="46" height="60" rx="20" fill="#A98B5C"/>'
    return r
def ark(x, y, w=70):
    h = w * .48
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="#8C5A3C"/><rect x="{x - 3}" y="{y - 6}" width="{w + 6}" height="9" rx="3" fill="#F2C94C" stroke="#C99A1A" stroke-width="1.5"/>'
            f'<path d="M{x + w / 2} {y + 6}v{h - 12}M{x + w / 2 - 9} {y + h / 2}h18" stroke="#F7D77A" stroke-width="3" stroke-linecap="round"/>'
            f'<line x1="{x - 14}" y1="{y + h - 4}" x2="{x + w + 14}" y2="{y + h - 4}" stroke="#6B4F2F" stroke-width="4" stroke-linecap="round"/>')
def trumpet(x, y, flip=False):
    sx = -1 if flip else 1
    return f'<g transform="translate({x},{y}) scale({sx},1)"><path d="M0 0h26l14-9v26l-14-9h-26z" fill="#F2C94C" stroke="#C99A1A" stroke-width="1.5"/></g>'
def note(x, y, c='#4C78A8'):
    return f'<g transform="translate({x},{y})"><ellipse cx="0" cy="10" rx="5" ry="3.6" fill="{c}"/><path d="M5 10V-8l8 4" stroke="{c}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>'
def heart(x, y, s=1, c='#E58E8E'):
    return f'<g transform="translate({x},{y}) scale({s})"><path d="M0 6q-12-10-6-17q6-5 6 2q0-7 6-2q6 7-6 17z" fill="{c}"/></g>'
def spark(x, y, s=1):
    return f'<g transform="translate({x},{y}) scale({s})"><path d="M0-9l2.5 6.5L9 0l-6.5 2.5L0 9l-2.5-6.5L-9 0l6.5-2.5z" fill="#F7D77A"/></g>'
def table(x, y, w, food=True):
    r = f'<rect x="{x}" y="{y}" width="{w}" height="10" rx="3" fill="#8A7048"/><rect x="{x + 8}" y="{y + 10}" width="7" height="{190 - y - 10}" fill="#8A7048"/><rect x="{x + w - 15}" y="{y + 10}" width="7" height="{190 - y - 10}" fill="#8A7048"/>'
    if food:
        n = max(2, int(w // 40))
        for i in range(n):
            cx = x + 20 + i * (w - 40) / max(1, n - 1)
            r += f'<ellipse cx="{cx:.0f}" cy="{y - 3}" rx="13" ry="5" fill="#F4F1EA" stroke="#CFC7B8"/><ellipse cx="{cx:.0f}" cy="{y - 7}" rx="8" ry="5" fill="{"#D9A35B" if i % 2 == 0 else "#B5533C"}"/>'
    return r
def jar(x, y, s=1, tilt=0):
    return f'<g transform="translate({x},{y}) rotate({tilt}) scale({s})"><path d="M-8 0h16l4 8q6 8 0 20q-4 8-12 8q-8 0-12-8q-6-12 0-20z" fill="#F4E9D8" stroke="#C9B48A" stroke-width="2"/><rect x="-5" y="-6" width="10" height="7" rx="2" fill="#C9B48A"/></g>'
def window(x, y, w=64, h=64):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#CFE3F2" stroke="#8A7048" stroke-width="5"/><path d="M{x + w / 2} {y}v{h}M{x} {y + h / 2}h{w}" stroke="#8A7048" stroke-width="4"/>'
def house_wall(sky='#F6E7C8'):
    return f'<rect width="300" height="240" fill="{sky}"/><rect y="190" width="300" height="50" fill="#D9BE8E"/>'
def coins(x, y, n=3):
    return ''.join(f'<ellipse cx="{x}" cy="{y - i * 5}" rx="10" ry="4" fill="#F2C94C" stroke="#C99A1A" stroke-width="1.5"/>' for i in range(n))
def pot(x, y, s=1):
    return f'<g transform="translate({x},{y}) scale({s})"><path d="M-16 0h32l-4 24q-1 6-6 6h-12q-5 0-6-6z" fill="#7B7F8C"/><rect x="-18" y="-4" width="36" height="6" rx="3" fill="#5E6270"/><path d="M-8-12q-4-8 0-14M2-12q-4-8 0-14M12-12q-4-8 0-14" stroke="#CFC7B8" stroke-width="3" fill="none" stroke-linecap="round"/></g>'
def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240">{body}</svg>\n'

P = person
RED, PUR, BLUE, GRN, TAN = '#C0392B', '#8E44AD', '#7AA6C9', '#6BA368', '#D4A24C'
DARK = '#3F4A5A'

S = {}
# ---------- 1. Davi e a arca ----------
d = 'davi-e-a-arca'
S[d] = {}
S[d]['4-6-1'] = bg() + sun(40, 40, 18) + walls() + ark(104, 108, 90) + P(60, 112, .7, robe=PUR, crown=True, arms='up', mood='happy') + P(76, 112, .6, robe=BLUE) * 0 + P(226, 116, .64, robe=TAN) + P(66, 130, .0) * 0
S[d]['4-6-1'] = bg() + sun(250, 40, 18) + walls() + P(14, 100, .9, robe=PUR, crown=True, arms='up', mood='happy') + ark(104, 112, 90) + P(88, 120, .7, robe=BLUE) + P(204, 120, .7, robe=TAN, flip=True)
S[d]['4-6-2'] = bg() + walls() + P(12, 96, .9, robe=TAN, arms='one') + trumpet(60, 120) + P(104, 94, 1.0, robe=PUR, crown=True, arms='up', mood='happy') + P(232, 96, .9, robe=GRN, arms='one', flip=True) + trumpet(222, 120, True) + note(20, 70) + note(270, 70, '#E58E8E') + note(150, 60, '#6BA368')
S[d]['4-6-3'] = bg() + sun(250, 38, 20) + spark(60, 60) + spark(240, 100, .8) + heart(50, 120) + heart(250, 150, .8) + P(104, 70, 1.5, robe=PUR, crown=True, arms='up', mood='happy') + P(16, 130, .6, robe=TAN, arms='up') + P(230, 130, .6, robe=BLUE, arms='up', flip=True)
S[d]['7-10-1'] = bg() + sun(250, 38, 18) + walls() + ark(104, 110, 90) + P(86, 118, .7, robe=BLUE) + P(204, 118, .7, robe=TAN, flip=True) + P(20, 100, .9, robe=PUR, crown=True)
S[d]['7-10-2'] = bg() + sun(250, 38, 16) + '<rect x="190" y="130" width="70" height="60" rx="6" fill="#A8A29A"/><rect x="200" y="112" width="50" height="22" rx="5" fill="#BDB7AD"/><path d="M225 112q-14-14 0-28q14 14 0 28z" fill="#F08A3C"/><path d="M225 112q-6-8 0-16q6 8 0 16z" fill="#F7D77A"/>' + ark(50, 134, 80) + P(140, 100, .9, robe=PUR, crown=True, arms='hold', mood='smile', flip=True)
S[d]['7-10-3'] = bg() + walls() + P(8, 100, .85, robe=TAN, arms='one') + trumpet(56, 122) + P(108, 90, 1.0, robe=PUR, crown=True, arms='up', mood='happy') + P(236, 100, .85, robe=GRN, arms='one', flip=True) + trumpet(226, 122, True) + spark(100, 60) + spark(210, 56, .8) + note(160, 50)
S[d]['7-10-4'] = bg() + '<rect x="180" y="20" width="110" height="110" fill="#D9BE8E"/>' + window(200, 36, 70, 74) + P(214, 54, .46, robe='#D98BB5', head='#A0527A', mood='frown') + P(30, 96, 1.0, robe=PUR, crown=True, arms='up', mood='happy') + note(120, 80) + spark(130, 130, .8)
S[d]['11-13-cena'] = bg() + sun(40, 38, 16) + walls() + '<rect x="196" y="22" width="90" height="100" fill="#D9BE8E"/>' + window(210, 34, 62, 66) + P(222, 48, .4, robe='#D98BB5', head='#A0527A', mood='neutral') + ark(14, 140, 64) + P(10, 114, .5, robe=BLUE) + P(84, 114, .5, robe=TAN, flip=True) + P(120, 96, 1.0, robe=PUR, crown=True, mood='neutral') + P(190, 120, .7, robe=GRN, mood='neutral') + P(240, 126, .66, robe=BLUE)

# ---------- 2. Levi ----------
d = 'levi-e-o-banquete'
S[d] = {}
JE = lambda x, y, s=1.0, **k: jesus(x, y, s, **k)
tax = lambda: '<rect x="30" y="118" width="110" height="10" rx="3" fill="#8A7048"/><rect x="38" y="128" width="7" height="62" fill="#8A7048"/><rect x="126" y="128" width="7" height="62" fill="#8A7048"/>' + coins(60, 114, 4) + coins(84, 114, 2) + '<rect x="104" y="106" width="22" height="12" rx="2" fill="#F4F1EA" stroke="#CFC7B8"/>'
S[d]['4-6-1'] = bg() + sun(250, 38, 18) + tax() + P(52, 56, .95, robe=TAN, hair='#3A2A20', mood='neutral') + JE(190, 94, 1.0, arms='point', flip=True, mood='smile')
S[d]['4-6-2'] = house_wall() + table(30, 130, 240) + JE(120, 60, 1.0) + P(34, 70, .9, robe=TAN, hair='#3A2A20', mood='happy') + P(80, 76, .85, robe=GRN) + P(190, 76, .85, robe=BLUE, hair='#3A2A20') + P(232, 70, .9, robe=RED, head='#8C3A2E', mood='happy')
S[d]['4-6-3'] = house_wall() + '<rect x="130" y="40" width="160" height="150" fill="#E7D3A5"/>' + window(150, 54, 120, 70) + '<rect x="160" y="96" width="100" height="6" fill="#8A7048"/>' + JE(194, 60, .5) + P(166, 66, .4, robe=TAN, hair='#3A2A20') + P(246, 66, .4, robe=GRN) + P(14, 96, .95, robe=DARK, head='#2E3748', mood='frown', arms='point') + P(70, 100, .9, robe='#55606F', head='#3A4558', mood='frown', arms='hold')
S[d]['7-10-1'] = bg() + sun(250, 38, 18) + tax() + P(52, 56, .95, robe=TAN, hair='#3A2A20', mood='neutral') + JE(190, 94, 1.0, arms='one', flip=True)
S[d]['7-10-2'] = bg() + sun(40, 38, 16) + tax() + '<g transform="translate(0,0)">' + coins(110, 114, 5) + '</g>' + JE(150, 94, 1.0, arms='point') + P(96, 90, 1.0, robe=TAN, hair='#3A2A20', mood='happy', flip=True) + P(250, 110, .6, robe=GRN, flip=True)
S[d]['7-10-3'] = house_wall() + table(20, 130, 260) + P(18, 70, .85, robe=GRN) + P(66, 64, .95, robe=TAN, hair='#3A2A20', mood='happy', arms='one') + JE(130, 58, 1.05) + P(196, 70, .88, robe=BLUE, hair='#3A2A20') + P(238, 66, .9, robe=RED, head='#8C3A2E') + spark(30, 36, .8) + spark(270, 36, .8)
S[d]['7-10-4'] = house_wall() + P(10, 84, .98, robe=DARK, head='#2E3748', mood='frown', arms='point') + P(66, 90, .92, robe='#55606F', head='#3A4558', mood='frown', arms='hold') + JE(150, 60, 1.1, arms='out') + P(236, 82, .9, robe=TAN, hair='#3A2A20', mood='sad') + '<path d="M104 70q10-6 16 0" stroke="#8A7048" stroke-width="0" fill="none"/>'
S[d]['11-13-cena'] = house_wall('#EBDDB8') + '<rect x="120" y="50" width="170" height="140" fill="#F7E4B0"/>' + table(136, 136, 140) + JE(170, 70, .7) + P(142, 80, .55, robe=TAN, hair='#3A2A20') + P(232, 82, .55, robe=GRN) + P(14, 92, 1.0, robe=DARK, head='#2E3748', mood='neutral') + P(66, 96, .94, robe='#55606F', head='#3A4558', mood='neutral', arms='hold')

# ---------- 3. A mulher e o perfume ----------
d = 'a-mulher-e-o-perfume'
S[d] = {}
WOM = dict(robe='#B84A62', hair='#3A2A20')
SIM = dict(robe=DARK, head='#2E3748')
S[d]['4-6-1'] = house_wall() + table(110, 136, 170) + JE(190, 66, 1.0, sit=True) + P(122, 70, .9, **SIM, sit=True, mood='neutral') + P(14, 84, 1.05, **WOM, arms='hold', mood='sad') + jar(45, 168, .7)
S[d]['4-6-2'] = house_wall() + '<rect x="120" y="56" width="150" height="134" fill="#F7E4B0" opacity=".0"/>' + table(150, 120, 140) + JE(190, 56, 1.2, sit=True) + P(110, 126, .9, **WOM, sit=True, mood='sad', arms='hold') + '<ellipse cx="170" cy="190" rx="26" ry="5" fill="#F4F1EA" opacity=".9"/>'
S[d]['4-6-3'] = house_wall('#FFF3D0') + sun(60, 50, 24) + JE(130, 64, 1.2, arms='out') + P(30, 100, 1.0, **WOM, arms='hold', mood='happy') + heart(236, 80, 1.2) + heart(260, 130, .8) + spark(60, 150, .8) + spark(250, 40)
S[d]['7-10-1'] = house_wall() + table(140, 136, 150) + JE(206, 66, .9, sit=True) + P(150, 70, .8, **SIM, sit=True, mood='neutral') + P(24, 86, 1.05, **WOM, arms='hold', mood='sad') + jar(55, 170, .7)
S[d]['7-10-2'] = house_wall() + jar(100, 120, 1.0, tilt=-40) + '<path d="M118 140q4 14 2 28" stroke="#F7D77A" stroke-width="3" fill="none"/>' + JE(160, 50, 1.25, sit=True) + P(86, 120, .85, **WOM, mood='sad') + '<ellipse cx="190" cy="190" rx="34" ry="5" fill="#F4F1EA" opacity=".9"/>'
S[d]['7-10-3'] = house_wall() + table(30, 136, 240, food=False) + P(30, 66, .95, **SIM, sit=True, mood='frown', arms='hold') + JE(206, 62, 1.0, sit=True, arms='out') + coins(120, 128, 8) + coins(156, 128, 2) + '<path d="M103 98l16-8l16 8M146 98l10-6l10 6" stroke="#C99A1A" stroke-width="0" fill="none"/>'
S[d]['7-10-4'] = house_wall('#FFF3D0') + sun(250, 44, 20) + P(40, 96, 1.0, **WOM, arms='hold', mood='happy') + JE(150, 66, 1.15, arms='out') + heart(110, 70, 1.1) + spark(260, 130, .9) + spark(20, 50, .8)
S[d]['11-13-cena'] = house_wall() + table(100, 136, 190) + JE(190, 70, .95, sit=True) + P(110, 74, .8, **SIM, sit=True, mood='neutral') + P(40, 120, .8, **WOM, sit=True, mood='sad', arms='hold') + jar(52, 176, .6) + P(250, 70, .8, robe=GRN, sit=True)

# ---------- 4. Marta e Maria ----------
d = 'marta-e-maria'
S[d] = {}
MAR = dict(robe='#E0A04A', head='#9B5A2A')
MAI = dict(robe='#5C9E8F', head='#2F6B5E')
door = lambda: '<rect x="100" y="60" width="100" height="130" rx="40" fill="#8A6A46"/><rect x="110" y="74" width="80" height="116" rx="34" fill="#F7E4B0"/>'
S[d]['4-6-1'] = house_wall() + door() + P(40, 96, 1.0, **MAR, arms='out', mood='happy') + JE(210, 90, 1.0, flip=True)
S[d]['4-6-2'] = house_wall() + '<rect x="14" y="120" width="120" height="10" rx="3" fill="#8A7048"/><rect x="22" y="130" width="7" height="60" fill="#8A7048"/><rect x="118" y="130" width="7" height="60" fill="#8A7048"/>' + pot(50, 116) + pot(96, 116, .8) + P(20, 60, .9, **MAR, mood='neutral', arms='hold') + JE(186, 56, 1.1, sit=True, arms='one') + P(154, 100, .8, **MAI, sit=True, mood='happy')
S[d]['4-6-3'] = house_wall() + P(18, 84, 1.0, **MAR, arms='out', mood='sad') + JE(150, 54, 1.15, sit=True, arms='point', flip=False) + P(222, 100, .8, **MAI, sit=True, mood='happy', flip=True)
S[d]['7-10-1'] = house_wall() + door() + '<rect x="14" y="120" width="70" height="10" rx="3" fill="#8A7048"/><rect x="20" y="130" width="6" height="60" fill="#8A7048"/><rect x="72" y="130" width="6" height="60" fill="#8A7048"/>' + pot(48, 116, .8) + P(116, 96, 1.0, **MAR, arms='out', mood='happy') + JE(220, 96, 1.0, flip=True)
S[d]['7-10-2'] = house_wall() + JE(160, 50, 1.25, sit=True, arms='one') + P(92, 104, .85, **MAI, sit=True, mood='happy') + note(60, 70) + spark(260, 70, .8) + P(256, 120, .0) * 0
S[d]['7-10-3'] = house_wall() + '<rect x="8" y="120" width="100" height="10" rx="3" fill="#8A7048"/>' + pot(40, 116, .8) + pot(78, 116, .7) + P(40, 66, 1.0, **MAR, arms='point', mood='frown') + P(188, 100, .85, **MAI, sit=True, mood='happy') + JE(218, 62, .85, sit=True, mood='neutral')
S[d]['7-10-4'] = house_wall() + P(20, 76, 1.0, **MAR, mood='smile', arms='hold') + JE(150, 60, 1.2, arms='point') + P(240, 120, .7, **MAI, sit=True, mood='happy', flip=True) + heart(136, 56, .9) + spark(270, 50, .8)
S[d]['11-13-cena'] = house_wall() + '<rect x="6" y="116" width="150" height="10" rx="3" fill="#8A7048"/><rect x="14" y="126" width="7" height="64" fill="#8A7048"/><rect x="140" y="126" width="7" height="64" fill="#8A7048"/>' + pot(40, 112, .9) + pot(82, 112, .9) + pot(122, 112, .8) + '<ellipse cx="60" cy="108" rx="14" ry="4" fill="#F4F1EA" stroke="#CFC7B8"/>' + P(30, 58, .85, **MAR, mood='neutral', arms='hold') + JE(206, 80, .7, sit=True) + P(176, 104, .55, **MAI, sit=True, mood='happy')

n = 0
sheet = ['<meta charset="utf-8"><style>body{font:12px sans-serif;background:#eee;margin:8px}div{display:inline-block;margin:4px}img{width:140px;height:112px;border:1px solid #999;display:block;background:#fff}</style>']
for slug, items in S.items():
    os.makedirs(f'{OUT}/{slug}/quadros', exist_ok=True)
    for name, body in items.items():
        open(f'{OUT}/{slug}/quadros/{name}.svg', 'w').write(svg(body)); n += 1
        sheet.append(f'<div><img src="{slug}/quadros/{name}.svg"><span>{slug} {name}</span></div>')
open(f'{OUT}/contato.html', 'w').write(''.join(sheet))
print(n, 'svgs')
