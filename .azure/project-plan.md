# Plan de projet — Modernisation du site pédagogique

**Status**: Approved  
**Created**: 2026-10-21  
**Mode**: Plan

## 1. Résumé du projet

Faire évoluer le site pédagogique existant en une plateforme publique, responsive et accessible pour consulter des cours, TP, briefs, exemples, exercices et quiz. Le site reste un site statique publié sur GitHub Pages, sans compte, backend, base de données ni dépendance à un fournisseur d’IA.

Le projet s’appuie sur le dépôt actuel plutôt que de repartir de zéro : `index.html`, `app.js`, `quiz.js`, `style.css`, les notebooks et ressources du dossier `cours/` constituent le point de départ.

## 2. Objectifs et périmètre

### Objectifs

- Rendre les contenus de formation plus faciles à parcourir, comprendre et réviser.
- Donner à chaque cours une structure pédagogique cohérente : objectifs, notions expliquées, exemples, exercices, ressources et quiz.
- Permettre aux visiteurs de retrouver les cours par thème, type et recherche.
- Enregistrer localement la progression et les meilleurs scores, sur l’appareil du visiteur.
- Moderniser l’identité visuelle existante en conservant ses repères et sa personnalité.
- Faciliter l’ajout et la mise à jour de contenus issus de TP, briefs et notebooks, avec une étape de relecture et d’approbation avant publication.

### Inclus dans cette évolution

- Expérience publique destinée aux apprenants individuels, au groupe d’apprenants et aux visiteurs du public.
- Catalogue et pages de contenu statiques, quiz à choix multiples avec explication après chaque réponse, et progression locale.
- Génération de cours à partir des briefs et TP avec un outil d’IA externe, puis relecture et import éditorial des contenus dans des fichiers consommables par le site statique.
- Publication et vérification du site sur GitHub Pages.

### Hors périmètre

- Comptes, connexion, profils, synchronisation entre appareils et données de progression côté serveur.
- API, backend, base de données ou stockage cloud.
- Appel direct à un fournisseur d’IA depuis le site public, automatisation serveur ou choix imposé d’un fournisseur. Une génération intégrée et sécurisée fera l’objet d’une décision ultérieure ; aucune clé d’API ne sera livrée dans le code client.

## 3. Publics, besoins et parcours

- **Apprenant individuel** : trouver un cours, lire les notions et exemples, faire les exercices et quiz, puis retrouver sa progression sur le même navigateur.
- **Groupe d’apprenants** : accéder aux contenus communs et aux ressources partagées par thème ou parcours, sans mécanisme d’accès privé.
- **Public** : découvrir les ressources pédagogiques publiques, comprendre leur contexte et consulter les contenus sans compte ni installation.
- **Éditeur du dépôt** : préparer ou importer un contenu, vérifier sa structure et ses ressources, faire relire le brouillon, puis le valider avant publication.

Les trois publics utilisent le même site et le même catalogue public. Les contenus peuvent porter des indications de parcours ou de public, mais ne sont pas protégés par une authentification.

## 4. Services et architecture

### Service frontend

- **Identifiant** : `frontend`
- **Type** : site web statique monopage ou multi-vues, côté navigateur.
- **Technologies** : HTML, CSS et JavaScript natifs, en continuité avec le dépôt existant.
- **Hébergement** : GitHub Pages.
- **Données** : fichiers de contenu et ressources versionnés dans le dépôt ; progression et meilleurs scores conservés uniquement dans `localStorage`.
- **Authentification** : aucune.
- **App Type** : frontend seul (site statique ; aucun backend/API).
- **Data stores** : No datastore required. Le stockage local du navigateur est une préférence de l’utilisateur sur son appareil, pas un datastore de service.

Le site ne doit pas appeler de service externe pour fonctionner. Les chemins d’assets et de contenus doivent être compatibles avec le sous-chemin de publication GitHub Pages. Prévoir un état lisible si une ressource référencée manque ou si le stockage local est indisponible.

## 5. Contenus, données et flux éditorial

### Modèle de cours proposé

Chaque contenu publié doit pouvoir fournir :

- identifiant stable, titre, résumé, thème, type (cours, TP ou brief), tags et public/parcours éventuels ;
- objectifs d’apprentissage ;
- notions expliquées en séquences courtes ;
- exemples commentés ;
- exercices et consignes ;
- ressources associées et liens vers les sources du dépôt ;
- quiz associés, avec question, choix, réponse correcte et explication affichée après la réponse.

La progression locale peut conserver les contenus terminés, les réponses/états utiles à la reprise et les meilleurs scores. Elle reste liée au navigateur courant ; elle ne contient pas de donnée personnelle requise pour utiliser le site. Prévoir une action claire pour effacer cette progression.

### Organisation et import

- Inventorier les entrées actuelles dans `app.js`, les questions de `quiz.js`, les notebooks et les fichiers de `cours/`, puis préserver les liens déjà publiés quand ils sont valides.
- Séparer progressivement les métadonnées et contenus structurés du code de rendu, en fichiers statiques versionnés (par exemple JSON par cours, et ressources associées). Garder les quiz dans un format structuré avec leur explication.
- Définir un flux éditorial depuis un TP, un brief ou un notebook : fournir la source à un outil d’IA externe (choisi par l’éditeur), demander le cours et son quiz selon le modèle pédagogique du site, puis préparer un brouillon statique avec les champs requis et les liens contrôlés.
- Le site ne transmet aucune source à un fournisseur d’IA. La génération a lieu hors du site ; le dépôt reçoit uniquement le contenu relu et approuvé. Le fournisseur reste au choix de l’éditeur et aucune clé d’API n’est nécessaire au site.
- Toute proposition générée reste un brouillon jusqu’à relecture humaine : vérifier exactitude pédagogique, objectifs, exemples, exercices, quiz, droits/provenance des ressources et rendu ; puis approuver et intégrer dans le dépôt.
- Le modèle de contenu et le processus d’import doivent rester utilisables si l’éditeur rédige ou adapte le cours sans IA.

Le rendu navigateur ne doit pas exécuter du HTML arbitraire provenant des contenus. Utiliser des composants/templates contrôlés et encoder les champs textuels ; n’autoriser que les ressources et formats explicitement prévus par le dépôt.

## 6. Design System & UI

**Component Library**: Pico.css, utilisé comme base sémantique légère pour le HTML natif ; compléter par les styles et composants personnalisés du site, sans remplacer son identité visuelle.

**Direction visuelle**: moderniser l’interface existante en conservant sa palette bleu profond/bleu accent, les accents distincts pour les TP et briefs, les thèmes clair/sombre, et l’esprit typographique actuel (Bricolage Grotesque pour les titres, Figtree pour le texte, avec des polices système de repli). Conserver les tokens CSS existants comme base, puis les harmoniser pour les états, contrastes, espacements et composants.

**Écrans et composants**:

- Accueil/catalogue avec présentation du projet, recherche et filtres par thème/type/public.
- Vue de cours avec objectifs, notions expliquées, exemples, exercices, ressources et accès au quiz.
- Vue de quiz avec progression, choix accessibles au clavier, retour immédiat correct/incorrect et explication pédagogique après chaque réponse.
- Indicateurs de progression et meilleurs scores, avec mention visible que ces informations restent sur cet appareil.
- Navigation responsive, états vides/erreur, contrôles de thème et action d’effacement des données locales.

**Principes d’interface**: priorité au contenu et à la lisibilité ; hiérarchie claire ; composants réutilisables et cohérents ; design fluide mobile/ordinateur ; focus visible, contrastes suffisants et prise en charge de `prefers-reduced-motion`. Les modes et préférences doivent rester utilisables sans dépendre du chargement des polices externes.

## 7. Qualité, accessibilité et critères d’acceptation

- Navigation principale, catalogue, filtres, recherche, cours et quiz sont utilisables sur mobile et ordinateur, au clavier et avec des libellés accessibles.
- Chaque cours publié expose les éléments pédagogiques requis ou signale explicitement ceux qui restent à compléter avant approbation.
- Chaque réponse de quiz produit un retour et une explication ; le score est calculé de façon reproductible.
- La progression persiste après rechargement sur le même navigateur, sans réseau ni compte, et peut être effacée. Le site reste utilisable si `localStorage` est bloqué.
- Aucun endpoint backend, secret, clé fournisseur ou donnée personnelle n’est requis ; le site fonctionne comme fichiers statiques sur le chemin GitHub Pages.
- Les liens internes, ressources et chemins sous un dépôt GitHub Pages sont vérifiés avant publication ; les liens manquants ont un état compréhensible.
- Contrôler les contrastes des thèmes clair/sombre, les focus clavier, les titres et régions sémantiques, les messages de quiz et le respect de la réduction des animations.
- Vérifier le flux éditorial sur au moins un contenu issu d’un TP/notebook et un contenu issu d’un brief : import en brouillon, revue, approbation, publication statique.

## 8. Publication et exploitation

- Publier le frontend statique sur GitHub Pages, à partir de la branche ou du workflow déjà retenu par le dépôt.
- Ajouter ou ajuster une vérification automatisée légère avant publication : validation des données structurées, existence des ressources référencées et contrôle des liens internes.
- Conserver les sources de contenu et les ressources dans le dépôt avec historique de modifications et relecture par pull request ou revue équivalente.
- Documenter les étapes pour ajouter un cours/quiz, prévisualiser et valider le contenu, puis publier sur GitHub Pages.
- Aucun provisionnement Azure n’est prévu dans cette phase.

## 9. Phases de réalisation proposées

1. **Inventaire et cadrage éditorial** : confirmer les fichiers réellement publiés, les ressources manquantes, les contenus à prioriser et la structure commune des cours.
2. **Socle statique et système visuel** : moderniser la navigation, le catalogue, la présentation responsive et les styles en préservant l’identité de base.
3. **Contenus pédagogiques** : structurer les cours et quiz, enrichir les cours prioritaires selon le modèle commun et conserver les liens aux supports d’origine.
4. **Progression locale et expérience quiz** : enregistrer localement l’avancement et les scores, afficher les explications, gérer l’effacement et les cas où le stockage est indisponible.
5. **Flux de génération externe et de revue** : documenter le modèle de consigne pour produire un cours et un quiz depuis un brief/TP avec un outil d’IA externe ; préparer le contenu au format statique, valider champs et liens, puis exiger une approbation humaine avant intégration.
6. **Validation et publication** : tester les parcours et l’accessibilité, vérifier les chemins GitHub Pages et publier ; documenter l’édition courante.
7. **Option ultérieure non engagée** : évaluer séparément une automatisation de génération intégrée, uniquement après décision sur le fournisseur, la sécurité des clés et l’hébergement de cette capacité. Le flux externe documenté reste disponible sans cette intégration.

## 10. Hypothèses, décisions et risques

- **Décisions confirmées** : public-facing pour les trois audiences ; GitHub Pages pour l’instant ; hébergement statique ; contenus versionnés dans le dépôt ; progression locale ; identité existante modernisée et conservée comme base ; quiz à choix multiples avec explication après réponse ; pas de backend.
- **Hypothèse technique** : garder HTML/CSS/JavaScript natifs afin de limiter les changements d’hébergement et de s’appuyer sur le site actuel. Pico.css sert de base sémantique, avec styles personnalisés conservant le design existant.
- **Génération de contenu** : génération avec un outil d’IA choisi par l’éditeur en dehors du site, import en brouillon et validation humaine ; aucun fournisseur n’est imposé et aucune génération directe n’est exécutée depuis GitHub Pages.
- **Risque de migration** : les entrées actuelles peuvent référencer des supports absents ou des formats hétérogènes. Réaliser l’inventaire avant de les déclarer publiés et signaler proprement les ressources manquantes.
- **Risque de données locales** : `localStorage` est limité à un navigateur/appareil et peut être effacé ou bloqué ; l’interface doit annoncer cette limite et ne pas promettre de synchronisation.
- **Risque de cohérence éditoriale** : l’enrichissement complet des notions, exemples et exercices nécessite une revue pédagogique ; distinguer le socle technique livrable de la complétion progressive du catalogue.
