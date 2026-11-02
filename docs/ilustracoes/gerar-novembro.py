# Gera os desenhos (SVG, sem texto) dos devocionais de 01 a 04/11. Mesmo estilo da Reforma: 300x240, formas simples.
import os, sys
OUT = sys.argv[1]

SKIN = '#D9A57B'
def shade(hexc, f=.78):
    h = hexc.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02X%02X%02X' % (int(r * f), int(g * f), int(b * f))
def person(x, y, s=1.0, robe='#7AA6C9', hair='#4A3523', head=None, mood='smile', arms='down', beard=False, crown=False, sit=False, flip=False, skin=SKIN, horn=False, rot=0):
    """Figura em pé de ~104 de altura (largura 60): pés em y+104*s. Túnica até o tornozelo, pescoço, mãos, sandálias."""
    t = f'translate({x + 60 * s},{y}) scale({-s},{s})' if flip else f'translate({x},{y}) scale({s})'
    o = [f'<g transform="{t}">']
    if rot:
        o.append(f'<g transform="rotate({rot} 30 100)">')
    dk, sk2 = shade(robe), shade(skin, .86)
    if not sit:
        o.append('<ellipse cx="30" cy="104" rx="30" ry="5" fill="#000" opacity=".1"/>')
    arm = {'down': [(13, 58, 8, 86), (47, 58, 52, 86)], 'up': [(13, 56, 4, 28), (47, 56, 56, 28)], 'out': [(13, 58, -4, 72), (47, 58, 64, 72)],
           'hold': [(13, 60, 24, 78), (47, 60, 36, 78)], 'point': [(13, 58, 8, 84), (47, 58, 72, 56)], 'one': [(13, 58, 8, 84), (47, 58, 60, 30)]}[arms]
    if horn:
        arm = [(13, 58, 8, 84), (47, 58, 40, 46)]
    for (x1, y1, x2, y2) in arm:
        o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{robe}" stroke-width="11" stroke-linecap="round"/>')
    o.append(f'<rect x="25" y="40" width="10" height="14" rx="4" fill="{sk2}"/>')
    if sit:
        o.append(f'<path d="M14 52Q30 45 46 52Q51 58 51 66L53 86H7L9 66Q9 58 14 52Z" fill="{robe}"/><ellipse cx="30" cy="90" rx="34" ry="12" fill="{robe}"/>')
    else:
        o.append(f'<path d="M14 52Q30 45 46 52Q51 58 52 68L58 100Q30 106 2 100L8 68Q9 58 14 52Z" fill="{robe}"/>'
                 f'<path d="M9 74Q30 82 51 74" stroke="{dk}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M30 80V102" stroke="{dk}" stroke-width="1.5" opacity=".5"/>'
                 f'<ellipse cx="20" cy="103" rx="8" ry="3.4" fill="#5A4030"/><ellipse cx="40" cy="103" rx="8" ry="3.4" fill="#5A4030"/>')
    o.append(f'<path d="M23 48Q30 58 37 48Z" fill="{sk2}"/>')
    for (x2, y2) in [(a[2], a[3]) for a in arm]:
        o.append(f'<circle cx="{x2}" cy="{y2}" r="5.2" fill="{skin}"/>')
    o.append(f'<ellipse cx="30" cy="28" rx="17" ry="19" fill="{skin}"/>')
    if head:
        o.append(f'<path d="M30 3Q8 3 9 28L10 46Q14 40 14 34Q15 18 30 15Q45 18 46 34Q46 40 50 46L51 28Q52 3 30 3Z" fill="{head}"/>'
                 f'<path d="M12 12Q30 4 48 12" stroke="{shade(head, .6)}" stroke-width="3.4" fill="none" stroke-linecap="round"/>')
    else:
        o.append(f'<path d="M12 26Q9 6 30 7Q51 6 48 26Q45 15 30 15Q15 15 12 26Z" fill="{hair}"/><circle cx="16" cy="18" r="3.6" fill="{hair}"/><circle cx="44" cy="18" r="3.6" fill="{hair}"/><circle cx="23" cy="11" r="4" fill="{hair}"/><circle cx="37" cy="11" r="4" fill="{hair}"/>')
    if beard:
        o.append(f'<path d="M13 32Q14 52 30 53Q46 52 47 32Q40 44 30 44Q20 44 13 32Z" fill="{hair}"/>')
    mc = '#FFFFFF' if beard else '#7A3B2E'
    if crown:
        o.append('<path d="M12 15Q30 6 48 15" stroke="#F2C94C" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="30" cy="9" r="3.6" fill="#D6453D" stroke="#C99A1A" stroke-width="1.2"/>')
    o.append('<ellipse cx="22.5" cy="28" rx="3.1" ry="3.5" fill="#fff"/><ellipse cx="37.5" cy="28" rx="3.1" ry="3.5" fill="#fff"/><circle cx="23" cy="28.6" r="1.9" fill="#2E2A28"/><circle cx="37" cy="28.6" r="1.9" fill="#2E2A28"/>')
    o.append('<circle cx="17" cy="35" r="3.4" fill="#E58E8E" opacity=".35"/><circle cx="43" cy="35" r="3.4" fill="#E58E8E" opacity=".35"/><path d="M30 29q-3 5 0 7" stroke="#B0805A" stroke-width="1.5" fill="none" stroke-linecap="round"/>')
    brow = '#3A2A20'
    if mood == 'smile':
        o.append(f'<path d="M21 36.5q9 8 18 0" stroke="{mc}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M19 22q4-3 7 0M34 22q4-3 7 0" stroke="{brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
    elif mood == 'happy':
        o.append(f'<path d="M23 36q7 8 14 0z" fill="#8A3B3B"/><path d="M19 21.5q4-3.5 7 0M34 21.5q4-3.5 7 0" stroke="{brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
    elif mood == 'frown':
        o.append(f'<path d="M24 41q6-3.5 12 0" stroke="{mc}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M18 22.5l9 2M42 22.5l-9 2" stroke="{brow}" stroke-width="2.2" stroke-linecap="round"/>')
    elif mood == 'sad':
        o.append(f'<path d="M23 42q7-5 14 0" stroke="{mc}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M19 24l7-3M41 24l-7-3" stroke="{brow}" stroke-width="1.8" stroke-linecap="round"/><path d="M21 33q-3 5 0 8q3-3 0-8z" fill="#7FB8E6"/>')
    else:
        o.append(f'<path d="M24 40h12" stroke="{mc}" stroke-width="2.2" stroke-linecap="round"/><path d="M19 22q4-2 7 0M34 22q4-2 7 0" stroke="{brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
    if horn:
        o.append('<path d="M34 41L82 37L98 28L100 52L82 44L34 45Z" fill="#F2C94C" stroke="#C99A1A" stroke-width="1.5" stroke-linejoin="round"/><circle cx="40" cy="47" r="5.2" fill="%s"/>' % skin)
    if rot:
        o.append('</g>')
    o.append('</g>')
    return ''.join(o)

def jesus(x, y, s=1.0, **k):
    k.setdefault('mood', 'smile')
    return person(x, y, s, robe='#F4F1EA', hair='#6B4A2E', beard=True, **k) + f'<g transform="translate({x},{y}) scale({s})"><path d="M9 74Q30 82 51 74" stroke="#4C78A8" stroke-width="6" fill="none" stroke-linecap="round"/></g>'

def bg(sky='#FDF1D6', ground='#E3C79A', gy=190):
    return f'<rect width="300" height="240" fill="{sky}"/><rect y="{gy}" width="300" height="{240 - gy}" fill="{ground}"/>'
def sun(x=250, y=40, r=22):
    rays = ''.join(f'<line x1="{x}" y1="{y}" x2="{x + 38 * __import__("math").cos(a / 8 * 6.2832):.1f}" y2="{y + 38 * __import__("math").sin(a / 8 * 6.2832):.1f}" stroke="#F7D77A" stroke-width="4" stroke-linecap="round"/>' for a in range(8))
    return rays + f'<circle cx="{x}" cy="{y}" r="{r}" fill="#F7D77A"/>'
def walls(gate=True):
    r = '<rect x="0" y="112" width="300" height="80" fill="#D9BE8E"/>'
    r += ''.join(f'<rect x="{i * 40 + 6}" y="100" width="22" height="16" fill="#D9BE8E"/>' for i in range(8))
    r += ''.join(f'<path d="M{x} 124h60M{x + 30} 138h60" stroke="#C4A874" stroke-width="2"/>' for x in (0, 100, 200))
    if gate:
        r += '<path d="M118 192V148Q118 126 143 126Q168 126 168 148V192Z" fill="#7A5A38" stroke="#B89A66" stroke-width="5"/><path d="M143 126V192" stroke="#5E4630" stroke-width="2"/>'
    return r
def ark(x, y, w=70):
    """Arca da aliança de lado: baú dourado, tampa com dois querubins de asas erguidas e duas varas pelos argolões (sem cruz)."""
    h = w * .46
    cx = x + w / 2
    g, gd = '#E7BF4A', '#B88A12'
    r = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{g}" stroke="{gd}" stroke-width="2"/>'
    r += f'<rect x="{x + 5}" y="{y + 5}" width="{w - 10}" height="{h - 10}" rx="2" fill="none" stroke="{gd}" stroke-width="1.4" opacity=".7"/>'
    r += f'<rect x="{x - 3}" y="{y - 5}" width="{w + 6}" height="7" rx="2" fill="#F5D570" stroke="{gd}" stroke-width="1.6"/>'
    for sx in (-1, 1):
        wx = cx + sx * w * .22
        tip = cx - sx * 1.5
        r += (f'<path d="M{wx + sx * 7:.1f} {y - 5}Q{wx + sx * 9:.1f} {y - 20} {tip:.1f} {y - 27}Q{wx - sx * 6:.1f} {y - 17} {wx - sx * 6:.1f} {y - 5}Z" fill="#F5D570" stroke="{gd}" stroke-width="1.4" stroke-linejoin="round"/>'
              f'<path d="M{wx + sx * 2:.1f} {y - 6}Q{wx + sx * 3:.1f} {y - 16} {tip - sx * 1:.1f} {y - 23}" stroke="{gd}" stroke-width="1" fill="none" opacity=".7"/>')
    r += f'<circle cx="{x + 6}" cy="{y + h - 8}" r="2.6" fill="{gd}"/><circle cx="{x + w - 6}" cy="{y + h - 8}" r="2.6" fill="{gd}"/>'
    r += f'<line x1="{x - 16}" y1="{y + h - 8}" x2="{x + w + 16}" y2="{y + h - 8}" stroke="#7A5230" stroke-width="4.5" stroke-linecap="round"/>'
    return r
def carried(cx, gy, s=.7, w=50):
    """Dois levitas carregando a arca nas varas, sobre os ombros."""
    bw = 60 * s
    y = gy - 104 * s
    sh = y + 56 * s
    gap = w * .5 + 24 * s + 16
    lx, rx = cx - gap - bw / 2, cx + gap - bw / 2
    r = person(lx, y, s, robe='#C8A15A', head='#F4F1EA', arms='hold') + person(rx, y, s, robe='#6BA368', head='#F4F1EA', arms='hold', flip=True)
    r += ark(cx - w / 2, sh - w * .46 + 8, w)
    r += f'<line x1="{lx + bw / 2}" y1="{sh}" x2="{rx + bw / 2}" y2="{sh}" stroke="#7A5230" stroke-width="4.5" stroke-linecap="round"/>'
    return r
def horn_player(x, y, s, robe, flip=False):
    return person(x, y, s, robe=robe, head='#F4F1EA', horn=True, flip=flip, mood='happy')
def altar(x, y, w=64, h=46):
    """Altar de pedras com chifres nos cantos e fogo em cima."""
    r = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#B5AEA0"/>' + ''.join(f'<path d="M{x} {y + h * k / 3}h{w}" stroke="#8F887A" stroke-width="2"/>' for k in (1, 2))
    r += ''.join(f'<path d="M{x + dx} {y + dy}h{ww}" stroke="#8F887A" stroke-width="2"/>' for dx, dy, ww in ((w * .3, 0, 0),))
    for hx in (x - 2, x + w - 6):
        r += f'<path d="M{hx} {y}q0-12 4-14q4 2 4 14z" fill="#9A9384"/>'
    r += f'<path d="M{x + w / 2 - 14} {y}l-4-6h36l-4 6z" fill="#7A5230"/>'
    r += f'<path d="M{x + w / 2} {y - 6}q-16-12-2-30q2 10 10 12q6 8-8 18z" fill="#F08A3C"/><path d="M{x + w / 2} {y - 6}q-7-8-1-18q6 6 4 10q2 4-3 8z" fill="#F7D77A"/>'
    return r
def tent(x, gy, w=120, h=84):
    cx = x + w / 2
    return (f'<path d="M{x} {gy}L{cx} {gy - h}L{x + w} {gy}Z" fill="#C9A66B" stroke="#8A6A3A" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M{cx - 20} {gy}L{cx} {gy - h * .62}L{cx + 20} {gy}Z" fill="#5E4630"/><path d="M{x + 20} {gy - 14}L{cx} {gy - h}M{x + w - 20} {gy - 14}L{cx} {gy - h}" stroke="#A98550" stroke-width="2"/>')
def window_with(x, y, w, h, who):
    """Janela aberta com uma pessoa olhando (recortada na moldura, sem travessas na frente do rosto)."""
    return (f'<defs><clipPath id="wc"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath></defs><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#4A3A2C"/>'
            f'<g clip-path="url(#wc)">{who}</g><rect x="{x - 4}" y="{y - 4}" width="{w + 8}" height="{h + 8}" fill="none" stroke="#8A7048" stroke-width="7" rx="2"/><rect x="{x - 8}" y="{y + h}" width="{w + 16}" height="8" rx="2" fill="#8A7048"/>')
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
def stand(x, s, **k):
    return person(x, 196 - 104 * s, s, **k)
PURPLE = '#7B4B94'
DAV = dict(robe=PURPLE, crown=True, hair='#6B3A22')
S[d]['4-6-1'] = bg() + sun(250, 40, 18) + walls() + stand(16, .95, **DAV, arms='up', mood='happy', rot=-4) + carried(194, 196, .78) + note(110, 60) + spark(150, 70, .8)
S[d]['4-6-2'] = bg() + sun(150, 40, 18) + walls(False) + horn_player(8, 196 - 104 * .92, .92, '#C8A15A') + stand(120, 1.0, **DAV, arms='up', mood='happy', rot=-4) + horn_player(228, 196 - 104 * .92, .92, '#6BA368', flip=True) + note(40, 70) + note(262, 70, '#E58E8E') + note(150, 52, '#6BA368')
S[d]['4-6-3'] = bg() + sun(250, 38, 20) + spark(60, 60) + spark(240, 100, .8) + heart(60, 120) + heart(246, 150, .8) + stand(98, 1.3, **DAV, arms='up', mood='happy', rot=-3) + stand(14, .62, robe='#C8A15A', head='#F4F1EA', arms='up', mood='happy') + stand(224, .62, robe='#6BA368', head='#F4F1EA', arms='up', mood='happy', flip=True)
S[d]['7-10-1'] = bg() + sun(46, 38, 18) + walls() + carried(150, 196, .72) + stand(240, .8, **DAV, arms='up', mood='happy', flip=True) + note(250, 80) + spark(120, 66, .8)
S[d]['7-10-2'] = bg() + sun(250, 38, 16) + tent(6, 192, 128, 88) + ark(52, 166, 40) + altar(186, 148, 70, 44) + stand(128, .92, **DAV, arms='hold', mood='smile') + spark(160, 90, .8) + spark(120, 60, .7)
S[d]['7-10-3'] = bg() + walls() + horn_player(8, 196 - 104 * .88, .88, '#C8A15A') + stand(118, 1.0, **DAV, arms='up', mood='happy', rot=4) + horn_player(232, 196 - 104 * .88, .88, '#6BA368', flip=True) + spark(100, 60) + spark(210, 56, .8) + note(160, 50)
S[d]['7-10-4'] = bg() + '<rect x="176" y="14" width="124" height="180" fill="#D9BE8E"/><path d="M176 14h124" stroke="#B89A66" stroke-width="6"/>' + window_with(198, 40, 80, 84, person(213, 54, .98, robe='#B84A62', head='#8A4668', mood='frown')) + stand(20, 1.05, **DAV, arms='up', mood='happy', rot=-5) + note(130, 80) + spark(150, 128, .8)
S[d]['11-13-cena'] = bg() + sun(40, 34, 14) + walls(False) + '<rect x="200" y="22" width="100" height="170" fill="#D9BE8E"/>' + window_with(214, 40, 68, 74, person(226, 50, .9, robe='#B84A62', head='#8A4668', mood='neutral')) + carried(84, 196, .6, 44) + stand(148, .95, **DAV, arms='up', mood='smile', rot=-3) + stand(214, .58, robe='#6BA368', head='#F4F1EA', mood='neutral', flip=True) + stand(254, .56, robe='#C8A15A', head='#F4F1EA', mood='neutral')

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
