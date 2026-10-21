"""Convertit chaque cours/<cours-id>/*.ipynb en cours/<cours-id>/*.html avec une barre « Accueil ».
Utilisation : pip install nbconvert nbformat  puis  python build_notebooks.py"""
import re
from pathlib import Path

import nbformat
from nbconvert import HTMLExporter

D = Path(__file__).parent / "cours"
HEAD = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700'
        '&family=Figtree:wght@400;600&display=swap"><link rel="stylesheet" href="../../notebook.css">')

for nb in sorted(D.glob("*/*.ipynb")):
    html, _ = HTMLExporter().from_notebook_node(nbformat.read(nb, as_version=4))
    titre = nb.stem.replace("_", " ")
    bar = ('<header class="nbbar"><a class="home" href="../../index.html">← Accueil</a>'
           '<a href="../../index.html#quiz">Quiz</a>'
           f'<span class="t">{titre}</span><a href="{nb.name}" download>Télécharger .ipynb</a></header>')
    html = html.replace("</head>", HEAD + "</head>", 1)
    html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + bar, html, count=1)
    nb.with_suffix(".html").write_text(html, encoding="utf-8")
    print("OK", nb.relative_to(D))
