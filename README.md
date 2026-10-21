# Carnet de cours

Site pédagogique statique en HTML, CSS et JavaScript natifs. Il est conçu pour GitHub Pages, sans compte, serveur, base de données, clé d’API ou dépendance à un fournisseur d’IA. Les fichiers de cours restent dans le dépôt ; l’avancement et les meilleurs scores sont conservés seulement dans le stockage local du navigateur.

## Prévisualiser et vérifier

L’application charge des fichiers JSON ; ouvre-la depuis un petit serveur HTTP plutôt qu’en `file://` :

```sh
python -m http.server 8000
```

Puis ouvre `http://localhost:8000`. Avant une publication ou une pull request, exécute le validateur intégré (Node.js, sans paquet à installer) :

```sh
node scripts/validate-content.mjs
```

Il contrôle les champs obligatoires, les identifiants, les réponses et explications des quiz, les chemins des ressources locales, leur existence et les chemins compatibles avec un sous-répertoire GitHub Pages.

## Ajouter un cours ou un quiz

1. Repère et vérifie la source dans le dépôt (énoncé, notebook, CSV ou autre support). Conserve le fichier source et son chemin relatif.
2. Prépare une fiche dans `content/courses.json` en respectant les autres entrées : identifiant stable, thème, type (`cours`, `tp` ou `brief`), résumé, tags, public, objectifs, notions expliquées, exemple, exercices, ressources et `quizId`.
3. Ajoute un quiz adapté à chaque cours destiné à être publié dans `content/quizzes.json`. Chaque question comprend `question`, au moins deux `options`, l’index entier `answer` (à partir de 0) et une `explanation`. Le validateur refuse la publication d’un cours sans quiz ni contenu pédagogique requis.
4. Lance le validateur, vérifie le rendu avec le serveur local et contrôle le contenu, les liens, les droits et la provenance.
5. Garde `status: "draft"` tant que la fiche est incomplète ; utilise `"review"` pour une proposition complète qui attend une vérification humaine ; ne passe à `"published"` qu’après relecture et approbation éditoriale. Un cours publié doit avoir objectifs, notions, exemple, exercices et quiz valides. Les états autres que publié restent signalés dans l’interface.
6. Soumets les modifications à la revue habituelle du dépôt, puis publie le site statique depuis le mécanisme GitHub Pages déjà configuré pour ce dépôt.

Les chemins de ressources sont relatifs à la racine du dépôt (par exemple `ENONCES/tp1_regression.ipynb`), sans `/` initial ni `..`. Les liens sont ainsi compatibles avec la publication à la racine d’un dépôt de projet GitHub Pages.

## Génération de contenu assistée par IA (hors du site)

La génération est facultative et se déroule dans l’outil externe choisi par l’éditeur. Le site ne transmet aucune source à un fournisseur et ne contient aucun appel d’IA. Les propositions générées sont des brouillons : un humain doit contrôler l’exactitude, les objectifs, les exemples, les exercices, chaque correction de quiz, les droits des ressources et le rendu avant publication. Le même format fonctionne pour un contenu écrit sans IA.

Consigne de départ à adapter à l’outil choisi :

> À partir de la source de TP ou de brief que je fournis, propose une fiche de cours et un quiz adaptés à chaque cours, conformes aux formats de `content/courses.json` et `content/quizzes.json`. Enrichis la fiche avec un titre, un identifiant stable, un type, un thème, un résumé, des tags, un public, des objectifs d’apprentissage, des notions expliquées en sections courtes, un exemple commenté, des exercices et des ressources faisant référence uniquement aux chemins réellement présents dans la source. Le quiz doit avoir des questions, des choix plausibles, un index de bonne réponse et une explication pédagogique pour chaque réponse. N’invente pas de faits absents de la source : signale les inconnues à vérifier et conserve le statut `draft` si le contenu ne permet pas encore de produire une fiche et un quiz fiables. N’inclus ni HTML, ni code de rendu, ni script, ni secret. La sortie est une proposition éditoriale, pas un contenu approuvé.

Ne colle à un fournisseur externe que des sources que tu es autorisé à lui transmettre. Relis et valide toute proposition ; ne copie jamais de secret ou de donnée personnelle dans les fichiers du site.

## Progression et confidentialité

La progression, les meilleurs scores et le thème sont stockés dans `localStorage` sur l’appareil courant. Ils ne sont ni transmis ni synchronisés, et peuvent disparaître si le navigateur efface ses données. Le bouton **Effacer mes données** permet de supprimer ces informations ; si le stockage est bloqué, le site reste consultable et l’interface indique que les données ne persisteront pas.
