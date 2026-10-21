import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = message => errors.push(message);
async function json(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return [];
  }
}
const [courses, quizzes] = await Promise.all([
  json("content/courses.json"),
  json("content/quizzes.json")
]);
const quizIds = new Set();
const courseIds = new Set();

if (!Array.isArray(courses)) fail("content/courses.json doit être un tableau.");
if (!Array.isArray(quizzes)) fail("content/quizzes.json doit être un tableau.");
for (const quiz of Array.isArray(quizzes) ? quizzes : []) {
  if (!quiz.id || quizIds.has(quiz.id)) fail(`Identifiant de quiz absent ou dupliqué : ${quiz.id ?? "(vide)"}.`);
  quizIds.add(quiz.id);
  if (!quiz.title || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    fail(`Quiz ${quiz.id}: titre et questions sont requis.`);
    continue;
  }
  for (const [index, question] of quiz.questions.entries()) {
    if (!question.question || !Array.isArray(question.options) || question.options.length < 2 ||
        !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length ||
        !question.explanation) {
      fail(`Quiz ${quiz.id}, question ${index + 1}: énoncé, choix, bonne réponse et explication sont requis.`);
    }
  }
}

for (const course of Array.isArray(courses) ? courses : []) {
  if (!course.id || courseIds.has(course.id)) fail(`Identifiant de cours absent ou dupliqué : ${course.id ?? "(vide)"}.`);
  courseIds.add(course.id);
  for (const field of ["title", "description", "theme", "type", "duration"]) {
    if (typeof course[field] !== "string" || course[field].trim() === "") fail(`Cours ${course.id}: champ ${field} manquant.`);
  }
  if (!["tp", "brief", "cours"].includes(course.type)) fail(`Cours ${course.id}: type invalide.`);
  if (!["draft", "review", "published"].includes(course.status)) fail(`Cours ${course.id}: statut éditorial invalide.`);
  for (const field of ["tags", "audience", "objectives", "concepts", "exercises", "resources"]) {
    if (!Array.isArray(course[field])) fail(`Cours ${course.id}: ${field} doit être un tableau.`);
  }
  if (course.status === "published") {
    if (!course.quizId) fail(`Cours ${course.id}: un quiz est requis avant publication.`);
    if (!Array.isArray(course.objectives) || course.objectives.length === 0) {
      fail(`Cours ${course.id}: au moins un objectif est requis avant publication.`);
    }
    if (!Array.isArray(course.concepts) || course.concepts.length === 0) {
      fail(`Cours ${course.id}: au moins une notion est requise avant publication.`);
    }
    if (typeof course.example !== "string" || course.example.trim() === "") {
      fail(`Cours ${course.id}: un exemple est requis avant publication.`);
    }
    if (!Array.isArray(course.exercises) || course.exercises.length === 0) {
      fail(`Cours ${course.id}: au moins un exercice est requis avant publication.`);
    }
  }
  if (Array.isArray(course.concepts) && course.concepts.some(item => !item.title || !item.body)) {
    fail(`Cours ${course.id}: chaque notion doit contenir title et body.`);
  }
  if (course.quizId && !quizIds.has(course.quizId)) fail(`Cours ${course.id}: quiz ${course.quizId} introuvable.`);
  for (const resource of Array.isArray(course.resources) ? course.resources : []) {
    if (!resource.label || !resource.path || path.isAbsolute(resource.path) ||
        resource.path.includes("\\") || resource.path.split("/").includes("..") ||
        !["read", "download"].includes(resource.kind)) {
      fail(`Cours ${course.id}: ressource invalide (${resource.path ?? "(sans chemin)"}).`);
      continue;
    }
    try {
      await readFile(path.join(root, resource.path));
    } catch {
      fail(`Cours ${course.id}: ressource absente (${resource.path}).`);
    }
  }
}

const html = await readFile(path.join(root, "index.html"), "utf8");
if (/\b(?:href|src)\s*=\s*["']\//i.test(html)) {
  fail("index.html contient un chemin absolu qui risque de casser sur un sous-chemin GitHub Pages.");
}
const pagesBase = new URL("https://example.github.io/carnet/");
for (const [, relative] of html.matchAll(/\b(?:href|src)\s*=\s*["'](\.\/[^"'#?]+)(?:[?#][^"']*)?["']/gi)) {
  if (!new URL(relative, pagesBase).pathname.startsWith("/carnet/")) {
    fail(`Chemin incompatible avec un sous-chemin GitHub Pages : ${relative}.`);
  }
}
for (const file of ["style.css", "app.js", "content/courses.json", "content/quizzes.json"]) {
  try { await readFile(path.join(root, file)); }
  catch { fail(`Fichier requis absent : ${file}.`); }
}
try {
  const notebookHTML = await readFile(path.join(root, "cours/tp1-regression/tp1_regression.html"), "utf8");
  if (!notebookHTML.includes('href="../../notebook.css"') ||
      !notebookHTML.includes('href="./tp1_regression.ipynb"')) {
    fail("La page du notebook TP1 doit utiliser des chemins relatifs valides.");
  }
  if (!notebookHTML.includes('id="mode"') ||
      !notebookHTML.includes('carnet-data-v1') ||
      !notebookHTML.includes('data-jp-theme-light')) {
    fail("La page du notebook TP1 doit proposer le bouton de mode sombre synchronisé avec le site.");
  }
  if (/<script\b[^>]*\bsrc=["']https?:/i.test(notebookHTML) ||
      /\bimport\s*\(\s*["']https?:/i.test(notebookHTML) ||
      /<link\b[^>]*\bhref=["']https?:/i.test(notebookHTML)) {
    fail("La page notebook TP1 contient encore une dépendance distante.");
  }
} catch {
  fail("Page notebook manquante : cours/tp1_regression.html.");
}

if (errors.length) {
  console.error(`Validation du contenu : ${errors.length} problème(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const courseList = Array.isArray(courses) ? courses : [];
  const quizList = Array.isArray(quizzes) ? quizzes : [];
  const resourceCount = courseList.reduce((count, course) => count + (Array.isArray(course.resources) ? course.resources.length : 0), 0);
  console.log(`Validation réussie : ${courseList.length} fiches, ${quizList.length} quiz, ${resourceCount} ressources internes vérifiées.`);
  const pending = courseList.filter(course => course.status !== "published").length;
  if (pending) console.log(`${pending} fiche(s) restent en brouillon ou à relire avant publication éditoriale.`);
}
