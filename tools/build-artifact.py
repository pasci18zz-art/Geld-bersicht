#!/usr/bin/env python3
"""Baut aus www/ eine einzige Artefakt-Seite (alles eingebettet).

Aufruf: python3 tools/build-artifact.py <ausgabe.html>
Die Artefakt-Hülle stellt <html>/<head>/<body> selbst bereit, deshalb entsteht hier nur der Inhalt.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'www'
out = pathlib.Path(sys.argv[1])

index = (ROOT / 'index.html').read_text(encoding='utf-8')
markup = re.search(r'<!--APP-->(.*?)<!--/APP-->', index, re.S).group(1).strip()
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', index)

css = (ROOT / 'style.css').read_text(encoding='utf-8')
# Lokale Schriftdatei gibt es im Artefakt nicht – dort kommt die Schrift von Google Fonts
css = re.sub(r'@font-face\s*\{[^}]*\}\s*', '', css, count=1)

js = '\n'.join((ROOT / s).read_text(encoding='utf-8') for s in scripts)
if '</script' in js.lower():
    raise SystemExit('JS enthält </script – würde die Seite zerbrechen')

page = f"""<title>Geld Finanzmanager</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>
{css}
</style>
{markup}
<script>window.BUILD = 'artefakt';</script>
<script>
{js}
</script>
"""
out.write_text(page, encoding='utf-8')
print(f'{out} geschrieben: {len(page) // 1024} KB, {len(scripts)} Skripte')
