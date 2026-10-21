"""Convertit chaque cours/<cours-id>/*.ipynb en cours/<cours-id>/*.html avec une barre « Accueil »
et un bouton de mode sombre synchronisé avec le site (localStorage carnet-data-v1).
Utilisation : pip install nbconvert nbformat  puis  python build_notebooks.py"""
import re
from pathlib import Path

import nbformat
from nbconvert import HTMLExporter

D = Path(__file__).parent / "cours"

EARLY_THEME = "<script>(function(){var r=document.documentElement,m;try{var d=JSON.parse(localStorage.getItem('carnet-data-v1')||'null');m=d&&(d.themeMode==='dark'||d.themeMode==='light')?d.themeMode:null}catch(e){}document.documentElement.dataset.theme=m||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')})();</script>"

TOGGLE = "<script>(function(){var r=document.documentElement,b=document.getElementById('mode');function paint(mode,saved){r.dataset.theme=mode;b.textContent=mode==='dark'?'Mode clair':'Mode sombre';b.setAttribute('aria-label','Activer le mode '+(mode==='dark'?'clair':'sombre'));}paint(r.dataset.theme||'light');b.addEventListener('click',function(){var m=r.dataset.theme==='dark'?'light':'dark';paint(m);try{var d=JSON.parse(localStorage.getItem('carnet-data-v1')||'null');d=(d&&typeof d==='object')?d:{};d.themeMode=m;localStorage.setItem('carnet-data-v1',JSON.stringify(d));}catch(e){}});})();</script>"

HEAD = '<link rel="stylesheet" href="../../notebook.css">'
BAR = ('<header class="nbbar"><a class="home" href="../../index.html">← Accueil</a>'
       '<a href="../../index.html#quiz">Quiz</a>'
       '<span class="t">{titre}</span>'
       '<button class="nbmode" type="button" id="mode">Mode sombre</button>'
       '<a href="{nom}" download>Télécharger .ipynb</a></header>' + TOGGLE)

for nb in sorted(D.glob("*/*.ipynb")):
    html, _ = HTMLExporter().from_notebook_node(nbformat.read(nb, as_version=4))
    titre = nb.stem.replace("_", " ")
    if not html.count(EARLY_THEME):
        html = html.replace("</head>", EARLY_THEME + HEAD + "</head>", 1)
    html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + BAR.format(titre=titre, nom=nb.name), html, count=1)
    nb.with_suffix(".html").write_text(html, encoding="utf-8")
    print("OK", nb.relative_to(D))
