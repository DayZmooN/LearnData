import { mountQuiz } from "./quiz.js";

const DATA_URL = new URL("./content/courses.json", import.meta.url);
const QUIZZES_URL = new URL("./content/quizzes.json", import.meta.url);
const STORAGE_KEY = "carnet-data-v1";
const $ = (selector, scope = document) => scope.querySelector(selector);
const root = document.documentElement;
const state = { theme: "Tous", type: "all", audience: "all", query: "" };
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const normalize = value => String(value ?? "").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const storageNotice = $("#storage-notice");

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter(x => typeof x === "string") : [],
      best: parsed.best && typeof parsed.best === "object" && !Array.isArray(parsed.best) ? parsed.best : {},
      themeMode: ["light", "dark"].includes(parsed.themeMode) ? parsed.themeMode : null
    };
  } catch {
    return { completed: [], best: {}, themeMode: null };
  }
}
const saved = readSaved();
const storage = { available: false, data: saved };
try {
  const testKey = `${STORAGE_KEY}-test`;
  localStorage.setItem(testKey, "1");
  localStorage.removeItem(testKey);
  storage.available = true;
} catch {
  storage.available = false;
}

function notifyStorage(message = "") {
  storageNotice.hidden = !message;
  storageNotice.textContent = message;
}
if (!storage.available) {
  notifyStorage("Le stockage local est indisponible dans ce navigateur. Tu peux utiliser le site, mais ta progression et tes scores ne seront pas conservés après fermeture.");
}
function persist() {
  if (!storage.available) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage.data));
    return true;
  } catch {
    storage.available = false;
    notifyStorage("Le navigateur ne peut plus enregistrer tes données. Le site reste utilisable, mais la progression ne sera pas conservée.");
    return false;
  }
}

function setMode(mode, save = true) {
  root.dataset.theme = mode;
  $("#mode").textContent = mode === "dark" ? "Mode clair" : "Mode sombre";
  $("#mode").setAttribute("aria-label", `Activer le mode ${mode === "dark" ? "clair" : "sombre"}`);
  if (save) {
    storage.data.themeMode = mode;
    persist();
  }
}
setMode(saved.themeMode || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
$("#mode").addEventListener("click", () => setMode(root.dataset.theme === "dark" ? "light" : "dark"));

function validLocalPath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/") &&
    !path.includes("\\") && !path.split("/").includes("..") &&
    !/^(?:[a-z]+:|\/\/)/i.test(path);
}
function resourceLink(resource) {
  if (!validLocalPath(resource.path)) return `<span class="resource-missing">${escapeHTML(resource.label)} · chemin invalide</span>`;
  return `<a class="resource-link" href="./${escapeHTML(resource.path)}"${resource.kind === "download" ? " download" : ""}>${escapeHTML(resource.label)}<span aria-hidden="true"> ↗</span></a>`;
}

function renderThemes(courses) {
  const themes = ["Tous", ...new Set(courses.map(course => course.theme))];
  $("#themes").innerHTML = themes.map(theme => {
    const count = theme === "Tous" ? courses.length : courses.filter(course => course.theme === theme).length;
    return `<button type="button" data-theme="${escapeHTML(theme)}" aria-pressed="${theme === state.theme}">${escapeHTML(theme)}<span class="n">${count}</span></button>`;
  }).join("");
}

function renderCourse(course) {
  const done = storage.data.completed.includes(course.id);
  const reviewLabel = course.status === "draft" ? "À compléter" : "Synthèse à relire";
  const objectives = course.objectives.map(item => `<li>${escapeHTML(item)}</li>`).join("");
  const concepts = course.concepts.map(item => `<article class="concept"><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.body)}</p></article>`).join("");
  const exercises = course.exercises.map(item => `<li>${escapeHTML(item)}</li>`).join("");
  const resources = course.resources.length
    ? course.resources.map(resourceLink).join("")
    : `<p class="resource-missing">Aucune ressource importée. Ajouter et vérifier le fichier source avant publication.</p>`;
  return `<article class="course-card ${escapeHTML(course.type)}${done ? " is-done" : ""}">
    <div class="card-topline"><span class="kind">${course.type === "tp" ? "Travaux pratiques" : course.type === "brief" ? "Brief" : "Cours"}</span>
      <span class="review-status ${course.status === "draft" ? "is-draft" : ""}">${reviewLabel}</span></div>
    <h3>${escapeHTML(course.title)}</h3>
    <p class="card-description">${escapeHTML(course.description)}</p>
    <div class="card-meta"><span>${escapeHTML(course.theme)}</span><span>${escapeHTML(course.duration)}</span><span>${course.audience.includes("groupe") ? "Individuel & groupe" : "Individuel"}</span></div>
    <div class="tags">${course.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
    <a class="button button-quiet course-open" href="cours/${escapeHTML(course.id)}/">Voir le cours complet <span aria-hidden="true">→</span></a>
    <details class="course-details">
      <summary>Découvrir le contenu <span aria-hidden="true">＋</span></summary>
      <div class="course-body">
        <section><h4>Objectifs</h4><ul>${objectives}</ul></section>
        <section><h4>Notions clés</h4><div class="concepts">${concepts}</div></section>
        <section><h4>Exemple commenté</h4><p>${escapeHTML(course.example)}</p></section>
        <section><h4>À pratiquer</h4><ul>${exercises}</ul></section>
        <section><h4>Supports et ressources</h4><div class="resource-list">${resources}</div></section>
        ${course.quizId ? `<a class="inline-quiz" href="#quiz">Réviser avec le quiz correspondant <span aria-hidden="true">→</span></a>` : ""}
      </div>
    </details>
    <div class="card-footer"><span class="progress-label">${done ? "Terminé sur cet appareil" : "Progression personnelle"}</span>
      <button class="complete-button" type="button" data-complete="${escapeHTML(course.id)}" aria-pressed="${done}">${done ? "Terminé ✓" : "Marquer terminé"}</button>
    </div>
  </article>`;
}

let courses = [];
function renderCatalogue() {
  const query = normalize(state.query);
  const filtered = courses.filter(course =>
    (state.theme === "Tous" || course.theme === state.theme) &&
    (state.type === "all" || course.type === state.type) &&
    (state.audience === "all" || course.audience.includes(state.audience)) &&
    (!query || normalize([course.title, course.description, course.theme, ...course.tags,
      ...course.objectives, ...course.concepts.map(x => `${x.title} ${x.body}`)].join(" ")).includes(query))
  );
  $("#result-count").textContent = `${filtered.length} contenu${filtered.length === 1 ? "" : "s"}`;
  const groups = [...new Set(filtered.map(course => course.theme))];
  $("#liste").innerHTML = filtered.length
    ? groups.map(theme => `<section class="group"><div class="group-heading"><h3>${escapeHTML(theme)}</h3><span>${filtered.filter(item => item.theme === theme).length} ressources</span></div><div class="course-grid">${filtered.filter(item => item.theme === theme).map(renderCourse).join("")}</div></section>`).join("")
    : `<div class="empty-state"><span aria-hidden="true">⌕</span><h3>Aucun résultat pour cette recherche</h3><p>Essaie un autre mot-clé ou retire un filtre.</p><button type="button" class="button button-quiet" id="clear-filters">Effacer les filtres</button></div>`;
  const countDone = storage.data.completed.filter(id => courses.some(course => course.id === id)).length;
  $("#stats").innerHTML = `<span><strong>${courses.length}</strong> fiches au catalogue</span><span><strong>${countDone}</strong> terminée${countDone === 1 ? "" : "s"} sur cet appareil</span>`;
}

$("#themes").addEventListener("click", event => {
  const button = event.target.closest("[data-theme]");
  if (!button) return;
  state.theme = button.dataset.theme;
  renderThemes(courses);
  renderCatalogue();
});
$("#type-filter").addEventListener("change", event => { state.type = event.target.value; renderCatalogue(); });
$("#audience-filter").addEventListener("change", event => { state.audience = event.target.value; renderCatalogue(); });
$("#q").addEventListener("input", event => { state.query = event.target.value; renderCatalogue(); });
$("#liste").addEventListener("click", event => {
  const completeButton = event.target.closest("[data-complete]");
  if (completeButton) {
    const id = completeButton.dataset.complete;
    storage.data.completed = storage.data.completed.includes(id)
      ? storage.data.completed.filter(item => item !== id)
      : [...storage.data.completed, id];
    persist();
    renderCatalogue();
    return;
  }
  if (event.target.closest("#clear-filters")) {
    state.theme = "Tous";
    state.type = "all";
    state.audience = "all";
    state.query = "";
    $("#q").value = "";
    $("#type-filter").value = "all";
    $("#audience-filter").value = "all";
    renderThemes(courses);
    renderCatalogue();
  }
});

const resetDialog = $("#reset-dialog");
$("#reset").addEventListener("click", () => resetDialog.showModal());
resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue !== "confirm") return;
  storage.data = { completed: [], best: {}, themeMode: null };
  persist();
  setMode(matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", false);
  renderCatalogue();
  if (window.refreshQuizHome) window.refreshQuizHome();
});

function route() {
  const view = location.hash === "#quiz" ? "quiz" : "cours";
  $("#view-cours").hidden = view !== "cours";
  $("#view-quiz").hidden = view !== "quiz";
  $("#themes").hidden = view !== "cours";
  document.querySelectorAll(".sections a").forEach(link => {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (view === "quiz" && window.refreshQuizHome) window.refreshQuizHome();
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
window.addEventListener("hashchange", route);
document.addEventListener("keydown", event => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
      !resetDialog.open) {
    event.preventDefault();
    $("#q").focus();
  }
});

try {
  const [courseResponse, quizResponse] = await Promise.all([fetch(DATA_URL), fetch(QUIZZES_URL)]);
  if (!courseResponse.ok) throw new Error(`Chargement des cours : HTTP ${courseResponse.status}`);
  if (!quizResponse.ok) throw new Error(`Chargement des quiz : HTTP ${quizResponse.status}`);
  courses = await courseResponse.json();
  const quizzes = await quizResponse.json();
  renderThemes(courses);
  renderCatalogue();
  $("#quiz-nav-count").textContent = `${quizzes.length}`;
  mountQuiz(quizzes, $("#quiz-root"), storage, persist, escapeHTML);
  route();
} catch (error) {
  console.error("Impossible de charger le catalogue de cours.", error);
  $("#liste").innerHTML = `<div class="empty-state"><h3>Le catalogue n’a pas pu être chargé</h3><p>Vérifie que les fichiers du site sont servis par un serveur web et que <code>content/courses.json</code> est présent.</p></div>`;
  $("#quiz-root").innerHTML = `<p class="empty-state">Les quiz ne sont pas disponibles pour le moment.</p>`;
}
