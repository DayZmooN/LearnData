export function mountQuiz(quizzes, root, storage, persist, escapeHTML) {
  const quizHome = () => {
    root.innerHTML = `<div class="quiz-intro"><p class="eyebrow">${quizzes.length} parcours de révision</p><h2>Choisis ton prochain défi</h2></div>
      <div class="qcards">${quizzes.map(quiz => {
        const best = storage.data.best[quiz.id];
        return `<button type="button" class="qcard" data-quiz="${escapeHTML(quiz.id)}">
          <span class="kind">${escapeHTML(quiz.from)}</span><h3>${escapeHTML(quiz.title)}</h3>
          <span class="qmeta">${quiz.questions.length} questions · ${quiz.questions.length * 2} min environ</span>
          <span class="qbest">${Number.isInteger(best) ? `Meilleur score : ${best}/${quiz.questions.length}` : "Pas encore tenté"} <span aria-hidden="true">→</span></span>
        </button>`;
      }).join("")}</div>
      <p class="privacy-note"><span aria-hidden="true">◷</span> Les meilleurs scores sont mémorisés uniquement dans le stockage local de ce navigateur.</p>`;
  };
  window.refreshQuizHome = quizHome;

  function play(quiz) {
    let index = 0;
    let score = 0;
    let answered = false;

    function showQuestion() {
      const question = quiz.questions[index];
      answered = false;
      const progress = Math.round((index / quiz.questions.length) * 100);
      root.innerHTML = `<div class="quiz-play">
        <div class="qtop"><button type="button" class="ghost" data-action="home">← Tous les quiz</button><span>${escapeHTML(quiz.title)} <strong>${index + 1} / ${quiz.questions.length}</strong></span></div>
        <div class="bartrack" role="progressbar" aria-label="Progression du quiz" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div style="width:${progress}%"></div></div>
        <p class="eyebrow">Question ${index + 1}</p><h2 class="qq">${escapeHTML(question.question)}</h2>
        <div class="opts" role="group" aria-label="Choix de réponse">${question.options.map((option, choiceIndex) =>
          `<button type="button" class="opt" data-choice="${choiceIndex}"><span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + choiceIndex)}</span>${escapeHTML(option)}</button>`
        ).join("")}</div>
        <div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>
      </div>`;
      root.querySelector("[data-choice]")?.focus();
    }

    function finish() {
      const previous = storage.data.best[quiz.id] ?? -1;
      const isBest = score > previous;
      if (isBest) {
        storage.data.best[quiz.id] = score;
        persist();
      }
      const total = quiz.questions.length;
      const percent = Math.round((score / total) * 100);
      root.innerHTML = `<section class="result-card">
        <p class="eyebrow">${isBest ? "Nouveau meilleur score" : "Quiz terminé"}</p>
        <div class="result-score">${score}<span>/${total}</span></div>
        <div class="score-track" aria-label="${percent} % de bonnes réponses"><span style="width:${percent}%"></span></div>
        <h2>${score === total ? "Excellent travail !" : score >= total / 2 ? "Bien joué, continue !" : "Chaque essai fait progresser."}</h2>
        <p>${score === total ? "Tu maîtrises ces notions. Garde le rythme !" : "Relis les explications et les fiches liées, puis retente le quiz."}</p>
        <div class="result-actions"><button type="button" class="button button-primary" data-action="retry">Rejouer ce quiz</button><button type="button" class="button button-quiet" data-action="home">Tous les quiz</button></div>
        <p class="privacy-note">Ton meilleur score reste dans le stockage local de cet appareil.</p>
      </section>`;
      root.querySelector("[data-action='retry']").focus();
    }

    showQuestion();
    root.onclick = event => {
      const choiceButton = event.target.closest("[data-choice]");
      if (choiceButton && !answered) {
        answered = true;
        const question = quiz.questions[index];
        const choice = Number(choiceButton.dataset.choice);
        const correct = choice === question.answer;
        if (correct) score++;
        root.querySelectorAll("[data-choice]").forEach(button => {
          button.disabled = true;
          const selectedChoice = Number(button.dataset.choice);
          if (selectedChoice === question.answer) button.classList.add("ok");
          else if (selectedChoice === choice && !correct) button.classList.add("ko");
        });
        const last = index === quiz.questions.length - 1;
        const feedback = root.querySelector("#quiz-feedback");
        feedback.innerHTML = `<div class="expl ${correct ? "good" : "bad"}"><strong>${correct ? "Bonne réponse !" : "Pas tout à fait."}</strong><p>${escapeHTML(question.explanation)}</p></div>
          <button type="button" class="button button-primary" data-action="next">${last ? "Voir mon résultat" : "Question suivante"} <span aria-hidden="true">→</span></button>`;
        feedback.querySelector("button").focus();
        return;
      }
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "home") {
        quizHome();
      } else if (action === "retry") {
        play(quiz);
      } else if (action === "next") {
        index++;
        index === quiz.questions.length ? finish() : showQuestion();
      }
    };
  }

  root.addEventListener("click", event => {
    const card = event.target.closest("[data-quiz]");
    if (!card) return;
    const quiz = quizzes.find(item => item.id === card.dataset.quiz);
    if (quiz) play(quiz);
  });
  quizHome();
}
