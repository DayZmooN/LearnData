// Génère une page de cours HTML complète pour chaque fiche
// de content/courses.json : cours/<id>/index.html (notions, exemple, exercices, ressources, quiz).
// Utilisation : node scripts/build-pages.mjs
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const esc = v => String(v ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

const TYPE_LABEL = { cours: "Cours", tp: "Travail pratique", brief: "Brief" };
const STATUS_LABEL = { published: "Publié", review: "À relire", draft: "Brouillon" };
const AUDIENCE_LABEL = { individuel: "Individuel", groupe: "En groupe" };

const EARLY_THEME = "<script>(function(){var r=document.documentElement,m;try{var d=JSON.parse(localStorage.getItem('carnet-data-v1')||'null');m=d&&(d.themeMode==='dark'||d.themeMode==='light')?d.themeMode:null}catch(e){}document.documentElement.dataset.theme=m||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')})();</script>";
const TOGGLE = "<script>(function(){var r=document.documentElement,b=document.getElementById('mode');function paint(mode,saved){r.dataset.theme=mode;b.textContent=mode==='dark'?'Mode clair':'Mode sombre';b.setAttribute('aria-label','Activer le mode '+(mode==='dark'?'clair':'sombre'));}paint(r.dataset.theme||'light');b.addEventListener('click',function(){var m=r.dataset.theme==='dark'?'light':'dark';paint(m);try{var d=JSON.parse(localStorage.getItem('carnet-data-v1')||'null');d=(d&&typeof d==='object')?d:{};d.themeMode=m;localStorage.setItem('carnet-data-v1',JSON.stringify(d));}catch(e){}});})();</script>";

const resourceHref = (courseId, pageId, p) => {
  if (p === `cours/${pageId}/` || p.startsWith(`cours/${pageId}/`)) return "./" + p.slice(`cours/${pageId}/`.length);
  if (p.startsWith("cours/")) return "../" + p.slice("cours/".length);
  return "../" + p;
};

function page(course, all) {
  const base = `cours/${course.id}/`;
  const chips = [
    TYPE_LABEL[course.type.toLowerCase()] || "Cours",
    course.duration,
    ...(course.audience || []).map(a => AUDIENCE_LABEL[a] || a),
    STATUS_LABEL[(course.status || "").toLowerCase()] || course.status
  ].filter(Boolean).map(c => `<span>${esc(c)}</span>`).join("");
  const tags = (course.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
  const objectives = (course.objectives || []).map(o => `<li>${esc(o)}</li>`).join("");
  const concepts = (course.concepts || []).map((k, i) => `
    <article class="concept"><span class="concept-n" aria-hidden="true">${i + 1}</span>
      <h3>${esc(k.title)}</h3><p>${esc(k.body)}</p>
    </article>`).join("");
  const exercises = (course.exercises || []).map(e => `<li>${esc(e)}</li>`).join("");
  const resources = (course.resources || []).map(r => {
    const href = esc(resourceHref(course.id, course.id, r.path));
    const dl = r.kind === "download" ? " download" : "";
    return `<a class="resource-link" href="${href}"${dl}>${esc(r.label)}</a>`;
  }).join("");
  const draft = course.status !== "published"
    ? `<p class="notice">Page ${esc((STATUS_LABEL[course.status] || "en relecture").toLowerCase())} : le contenu ci-dessous peut encore évoluer après relecture éditoriale.</p>`
    : "";
  const quiz = course.quizId
    ? `<section id="quiz"><h2>Vérifier tes connaissances</h2><p class="lesson-quiz-note">Trois ou quatre questions pour vérifier ce que tu retiens. Le score le meilleur est gardé sur cet appareil.</p><a class="button button-primary" href="../../index.html#quiz">Réviser avec le quiz <span aria-hidden="true">→</span></a></section>`
    : "";
  const i = all.findIndex(c => c.id === course.id);
  const prev = all[i - 1], next = all[i + 1];
  const nav = [
    prev ? `<a href="../${esc(prev.id)}/">← ${esc(prev.title)}</a>` : "",
    next ? `<a href="../${esc(next.id)}/">${esc(next.title)} →</a>` : "",
    `<a href="../../">▦ Catalogue</a>`
  ].filter(Boolean).join("");
  const notebook = (course.resources || []).find(r => r.path.endsWith(".html"));
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f3f6fa">
  <meta name="description" content="${esc(course.description)}">
  <title>${esc(course.title)} · Carnet de cours</title>
  <link rel="stylesheet" href="../../style.css">
</head>
<body>${EARLY_THEME}
  <a class="skip" href="#contenu">Aller au contenu</a>
  <div class="layout">
    <aside class="side">
      <a class="brand" href="../../" aria-label="Retour au catalogue">
        <span class="brand-mark" aria-hidden="true">C.</span>
        <span><span class="brand-name">Carnet de cours</span><span class="brand-sub">Formation Data Engineer</span></span>
      </a>
      <nav class="sections" aria-label="Navigation principale">
        <a href="../../"><span aria-hidden="true">▦</span> Catalogue</a>
        <a href="../../#quiz"><span aria-hidden="true">✓</span> Quiz</a>
      </nav>
      <div class="side-label">Sommaire</div>
      <nav class="lesson-toc" aria-label="Sommaire du cours">
        <a href="#objectifs">Objectifs</a>
        <a href="#notions">Notions</a>
        <a href="#exemple">En pratique</a>
        <a href="#exercices">Exercices</a>
        <a href="#ressources">Ressources</a>
      </nav>
      <div class="side-actions">
        <button class="mode" id="mode" type="button">Mode sombre</button>
      </div>
    </aside>

    <main class="main" id="contenu" tabindex="-1">
      ${draft}
      <header class="hero lesson-hero">
        <div class="eyebrow">${esc(course.theme)}</div>
        <h1>${esc(course.title)}</h1>
        <p class="lede">${esc(course.description)}</p>
        <div class="hero-stats" aria-label="Informations">${chips}</div>
        <div class="tags">${tags}</div>
        ${notebook ? `<p class="lesson-support">Le support complet de ce cours est le notebook : <a class="resource-link" href="${esc(resourceHref(course.id, course.id, notebook.path))}">${esc(notebook.label)}</a></p>` : ""}
      </header>
      <article class="lesson">
        <section id="objectifs"><h2>Ce que tu vas apprendre</h2><ul>${objectives}</ul></section>
        <section id="notions"><h2>Les notions, une par une</h2><p class="lesson-intro">Chaque encadré tient en trois ou quatre phrases : lis-les dans l’ordre, elles construisent l’étape suivante.</p><div class="concepts-grid">${concepts}</div></section>
        <section id="exemple"><h2>En pratique dans ce TP</h2><p class="lesson-example">${esc(course.example)}</p></section>
        <section id="exercices"><h2>À toi de jouer</h2><ol>${exercises}</ol></section>
        <section id="ressources"><h2>Supports et ressources</h2><div class="resource-list">${resources}</div></section>
        ${quiz}
        <nav class="footer-nav" aria-label="Cours voisins">${nav}</nav>
      </article>
    </main>
  </div>${TOGGLE}
</body>
</html>
`;
}

const courses = JSON.parse(fs.readFileSync(path.join(root, "content/courses.json"), "utf8"));
let n = 0;
for (const course of courses) {
  const dir = path.join(root, "cours", course.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(course, courses), "utf8");
  n++;
}
console.log(`${n} pages de cours générées dans cours/<id>/index.html`);
