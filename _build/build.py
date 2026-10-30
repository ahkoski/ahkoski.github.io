#!/usr/bin/env python3
"""Builds the site's HTML pages from the body partials in _build/pages.

Run from the repository root:  python3 _build/build.py
Edit page content in _build/pages/*.html, and shared parts (head, header,
contact band, footer) in this file. Folders starting with "_" are not
published by GitHub Pages.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://ahkoski.github.io/"
PAGES = os.path.join(ROOT, "_build", "pages")
META = json.load(open(os.path.join(ROOT, "_build", "pages.json"), encoding="utf-8"))

CSP = ("default-src 'self'; img-src 'self' data:; media-src 'self'; "
       "script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; "
       "frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'")

FAVICON = ("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
           "<rect width='100' height='100' rx='24' fill='%23FF6B6B'/><text x='50' y='68' font-size='52' "
           "text-anchor='middle' font-family='Arial' font-weight='800' fill='%233A1747'>AK</text></svg>")

def asset_version(rel):
    import hashlib
    with open(os.path.join(ROOT, rel), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


NAV = [("index.html", "Home"), ("work.html", "Work"), ("about.html", "About")]


def head(path, p):
    m = META[path]
    url = SITE + ("" if path == "index.html" else path)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="{CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>{m['title']}</title>
  <meta name="description" content="{m['desc']}">
  {'<meta name="robots" content="noindex">' if path in ("404.html", "behind-the-scenes.html") else f'<link rel="canonical" href="{url}">'}
  <meta name="theme-color" content="#3A1747">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{m['title']}">
  <meta property="og:description" content="{m['desc']}">
  <meta property="og:image" content="{SITE}{m.get('image', 'img/amanda-koski.jpg')}">
  <meta name="twitter:card" content="{'summary_large_image' if 'image' in m else 'summary'}">
  <link rel="preload" href="{p}fonts/bricolage-grotesque-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{p}css/site.css?v={asset_version('css/site.css')}">
  <link rel="icon" href="{FAVICON}">
</head>"""


def header(path, p):
    section = "work.html" if path.startswith("projects/") else path
    links = "".join(
        f'<a href="{p}{h}"' + (' aria-current="page"' if h == section else "") + f">{n}</a>"
        for h, n in NAV)
    return f"""<body data-page="{path[:-5].replace('projects/', 'case-')}" data-root="{p}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap">
    <a class="logo" href="{p}index.html" data-secret-logo><span class="logo-mark" aria-hidden="true">AK</span><span class="logo-name">Amanda Koski</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav"><span aria-hidden="true" class="menu-icon">☰</span><span class="menu-label">Menu</span></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">{links}<a href="#contact">Contact</a><a href="{p}docs/Amanda-Koski-Resume.pdf" target="_blank" rel="noopener">Resume<span class="sr-only"> (PDF, opens in a new tab)</span></a></nav>
    <button class="hud" type="button"><span class="cup" aria-hidden="true">🏆</span><span class="count">0</span></button>
  </div>
</header>
"""


def contact(p):
    return f"""  <section class="contact" id="contact" aria-labelledby="contact-title">
    <div class="wrap">
      <div>
        <h2 id="contact-title">Let’s talk.</h2>
        <p>Looking for someone to design learning people actually want to finish? I’d love to hear what you’re working on.</p>
      </div>
      <div class="btns">
        <a class="btn btn-gold" href="mailto:mrs.amanda.koski@gmail.com">Email me</a>
        <a class="btn btn-mint" href="https://www.linkedin.com/in/aarient" target="_blank" rel="noopener">Connect on LinkedIn<span class="sr-only"> (opens in a new tab)</span></a>
        <a class="btn btn-ghost-dark" href="{p}docs/Amanda-Koski-Resume.pdf" target="_blank" rel="noopener">Download resume (PDF)<span class="sr-only"> (opens in a new tab)</span></a>
      </div>
    </div>
  </section>"""


def footer(p):
    return f"""<footer class="site-foot">
  <div class="wrap">
    <span>© 2026 Amanda Koski</span>
    <span>Psst… some things here are clickable that don’t look it. <button type="button" class="joy" aria-label="Open the gamepad">🕹️</button></span>
  </div>
</footer>
<script src="{p}js/site.js?v={asset_version('js/site.js')}"></script>
</body>
</html>
"""


def build(path):
    p = "/" if path == "404.html" else ("../" if path.startswith("projects/") else "")
    body = open(os.path.join(PAGES, path), encoding="utf-8").read().rstrip()
    html = (head(path, p) + "\n" + header(path, p) + "\n<main id=\"main\">\n" + body +
            "\n\n" + contact(p) + "\n</main>\n\n" + footer(p))
    with open(os.path.join(ROOT, path), "w", encoding="utf-8") as f:
        f.write(html)
    return path


def extras():
    # Old /contact.html links now jump to the contact section on the home page.
    with open(os.path.join(ROOT, "contact.html"), "w", encoding="utf-8") as f:
        f.write('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                '<title>Contact | Amanda Koski</title><meta name="robots" content="noindex">'
                '<meta http-equiv="refresh" content="0; url=index.html#contact">'
                '<link rel="canonical" href="' + SITE + '#contact"></head>'
                '<body><p><a href="index.html#contact">Contact Amanda Koski</a></p></body></html>\n')
    urls = [SITE] + [SITE + k for k in META if k not in ("index.html", "404.html", "behind-the-scenes.html")]
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.writelines(f"  <url><loc>{u}</loc></url>\n" for u in urls)
        f.write("</urlset>\n")
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n")


if __name__ == "__main__":
    for path in META:
        print("built", build(path))
    extras()
    print("built contact.html (redirect), sitemap.xml, robots.txt")
