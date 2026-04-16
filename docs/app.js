(() => {
  const STORAGE_KEY = "flag-memory-drill-progress-v1";
  const MAX_WRONG_LOG = 40;
  const FLAGS = Array.isArray(window.FLAG_DATA)
    ? window.FLAG_DATA.map(([code, name]) => ({ code, name }))
    : [];
  const FLAG_MAP = new Map(FLAGS.map((flag) => [flag.code, flag]));
  const ALL_CODES = FLAGS.map((flag) => flag.code);

  const elements = {
    poolLabel: document.getElementById("pool-label"),
    flag: document.getElementById("flag"),
    options: document.getElementById("options"),
    feedback: document.getElementById("feedback"),
    nextButton: document.getElementById("next-btn"),
    emptyReview: document.getElementById("empty-review"),
    questionCard: document.getElementById("question-card"),
    switchAllButton: document.getElementById("switch-all-btn"),
    deckSize: document.getElementById("deck-size"),
    answeredCount: document.getElementById("answered-count"),
    accuracyValue: document.getElementById("accuracy-value"),
    trackedCount: document.getElementById("tracked-count"),
    reviewSummary: document.getElementById("review-summary"),
    mistakeList: document.getElementById("mistake-list"),
    mistakeTotalBadge: document.getElementById("mistake-total-badge"),
    clearBookButton: document.getElementById("clear-book-btn"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
  };

  const state = {
    mode: "all",
    currentQuestion: null,
    locked: false,
    lastQuestionCode: null,
    autoNextHandle: null,
    progress: loadProgress(),
  };

  function defaultProgress() {
    return {
      answered: 0,
      correct: 0,
      wrong: 0,
      mistakes: {},
      wrongLog: [],
    };
  }

  function normalizeProgress(raw) {
    const normalized = defaultProgress();

    if (!raw || typeof raw !== "object") {
      return normalized;
    }

    normalized.answered = safeWholeNumber(raw.answered);
    normalized.correct = safeWholeNumber(raw.correct);
    normalized.wrong = safeWholeNumber(raw.wrong);

    if (raw.mistakes && typeof raw.mistakes === "object") {
      for (const [code, entry] of Object.entries(raw.mistakes)) {
        if (!FLAG_MAP.has(code) || !entry || typeof entry !== "object") {
          continue;
        }

        const count = safeWholeNumber(entry.count);

        if (!count) {
          continue;
        }

        normalized.mistakes[code] = {
          count,
          lastWrongAt:
            typeof entry.lastWrongAt === "string" ? entry.lastWrongAt : null,
        };
      }
    }

    if (Array.isArray(raw.wrongLog)) {
      normalized.wrongLog = raw.wrongLog
        .filter(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof entry.code === "string" &&
            FLAG_MAP.has(entry.code) &&
            typeof entry.at === "string",
        )
        .slice(0, MAX_WRONG_LOG);
    }

    return normalized;
  }

  function safeWholeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return normalizeProgress(raw ? JSON.parse(raw) : null);
    } catch (error) {
      return defaultProgress();
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (error) {
      return;
    }
  }

  function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  }

  function sample(items, count) {
    return shuffle(items).slice(0, count);
  }

  function pluralize(word, count) {
    return count === 1 ? word : `${word}s`;
  }

  function flagEmoji(code) {
    return Array.from(code.toUpperCase())
      .map((character) =>
        String.fromCodePoint(127397 + character.charCodeAt(0)),
      )
      .join("");
  }

  function compareEntries(left, right) {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    const leftTime = left.lastWrongAt ? new Date(left.lastWrongAt).getTime() : 0;
    const rightTime = right.lastWrongAt
      ? new Date(right.lastWrongAt).getTime()
      : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.name.localeCompare(right.name);
  }

  function getMistakeEntries() {
    return Object.entries(state.progress.mistakes)
      .filter(([code]) => FLAG_MAP.has(code))
      .map(([code, info]) => ({
        code,
        name: FLAG_MAP.get(code).name,
        count: safeWholeNumber(info.count),
        lastWrongAt: info.lastWrongAt || null,
      }))
      .filter((entry) => entry.count > 0)
      .sort(compareEntries);
  }

  function getActiveCodes() {
    return state.mode === "mistakes"
      ? getMistakeEntries().map((entry) => entry.code)
      : ALL_CODES;
  }

  function pickCorrectCode(pool) {
    if (!pool.length) {
      return null;
    }

    if (pool.length === 1) {
      return pool[0];
    }

    let candidate = pool[Math.floor(Math.random() * pool.length)];
    let attempts = 0;

    while (candidate === state.lastQuestionCode && attempts < 12) {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      attempts += 1;
    }

    return candidate;
  }

  function buildQuestion() {
    const pool = getActiveCodes();

    if (!pool.length) {
      return null;
    }

    const correctCode = pickCorrectCode(pool);
    const distractorPool = ALL_CODES.filter((code) => code !== correctCode);
    const distractors = sample(distractorPool, 3);

    return {
      correctCode,
      options: shuffle([correctCode, ...distractors]),
    };
  }

  function clearAutoNext() {
    if (state.autoNextHandle) {
      window.clearTimeout(state.autoNextHandle);
      state.autoNextHandle = null;
    }
  }

  function nextQuestion() {
    clearAutoNext();

    if (state.currentQuestion) {
      state.lastQuestionCode = state.currentQuestion.correctCode;
    }

    state.locked = false;
    state.currentQuestion = buildQuestion();
    renderQuestion();
  }

  function scheduleNext() {
    clearAutoNext();
    state.autoNextHandle = window.setTimeout(() => {
      nextQuestion();
    }, 850);
  }

  function setMode(mode) {
    state.mode = mode === "mistakes" ? "mistakes" : "all";
    clearAutoNext();
    renderModeButtons();
    renderStats();
    nextQuestion();
  }

  function renderModeButtons() {
    for (const button of elements.modeButtons) {
      const isActive = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    }
  }

  function renderQuestion() {
    const mistakeEntries = getMistakeEntries();
    const isEmptyReview = state.mode === "mistakes" && mistakeEntries.length === 0;

    elements.poolLabel.textContent =
      state.mode === "mistakes"
        ? `Mistake Book • ${mistakeEntries.length} saved ${pluralize("flag", mistakeEntries.length)}`
        : `All Flags • ${ALL_CODES.length} total ${pluralize("flag", ALL_CODES.length)}`;

    elements.emptyReview.classList.toggle("hidden", !isEmptyReview);
    elements.questionCard.classList.toggle("hidden", isEmptyReview);

    if (isEmptyReview || !state.currentQuestion) {
      elements.feedback.textContent = "";
      elements.feedback.className = "feedback";
      return;
    }

    const currentFlag = FLAG_MAP.get(state.currentQuestion.correctCode);
    elements.flag.textContent = flagEmoji(currentFlag.code);
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
    elements.nextButton.disabled = true;
    elements.options.innerHTML = "";

    for (const code of state.currentQuestion.options) {
      const option = FLAG_MAP.get(code);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.dataset.code = code;
      button.textContent = option.name;
      button.addEventListener("click", () => answerQuestion(code));
      elements.options.appendChild(button);
    }
  }

  function answerQuestion(selectedCode) {
    if (state.locked || !state.currentQuestion) {
      return;
    }

    state.locked = true;
    clearAutoNext();

    const { correctCode } = state.currentQuestion;
    const correctFlag = FLAG_MAP.get(correctCode);
    const isCorrect = selectedCode === correctCode;
    const timestamp = new Date().toISOString();
    const optionButtons = Array.from(elements.options.querySelectorAll("button"));

    state.progress.answered += 1;

    if (isCorrect) {
      state.progress.correct += 1;
      elements.feedback.textContent = `Correct. This is ${correctFlag.name}.`;
      elements.feedback.className = "feedback is-success";
    } else {
      state.progress.wrong += 1;

      const existingMistake = state.progress.mistakes[correctCode] || {
        count: 0,
        lastWrongAt: null,
      };

      state.progress.mistakes[correctCode] = {
        count: existingMistake.count + 1,
        lastWrongAt: timestamp,
      };

      state.progress.wrongLog = [
        { code: correctCode, at: timestamp },
        ...state.progress.wrongLog,
      ].slice(0, MAX_WRONG_LOG);

      elements.feedback.textContent = `Wrong. The correct answer is ${correctFlag.name}.`;
      elements.feedback.className = "feedback is-error";
    }

    for (const button of optionButtons) {
      button.disabled = true;

      if (button.dataset.code === correctCode && !isCorrect) {
        button.classList.add("is-revealed");
      }

      if (button.dataset.code === selectedCode) {
        button.classList.add(isCorrect ? "is-correct" : "is-wrong");
      }
    }

    saveProgress();
    renderStats();
    renderMistakeBook();
    elements.nextButton.disabled = false;

    if (isCorrect) {
      scheduleNext();
    }
  }

  function formatDate(isoString) {
    if (!isoString) {
      return "Unknown time";
    }

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function renderStats() {
    const mistakeEntries = getMistakeEntries();
    const accuracy = state.progress.answered
      ? Math.round((state.progress.correct / state.progress.answered) * 100)
      : 0;

    elements.deckSize.textContent = String(ALL_CODES.length);
    elements.answeredCount.textContent = String(state.progress.answered);
    elements.accuracyValue.textContent = `${accuracy}%`;
    elements.trackedCount.textContent = String(mistakeEntries.length);

    if (!mistakeEntries.length) {
      elements.reviewSummary.textContent =
        "Review mode is ready when you start missing flags.";
      return;
    }

    const hottestEntry = mistakeEntries[0];
    elements.reviewSummary.textContent =
      `${mistakeEntries.length} ${pluralize("flag", mistakeEntries.length)} saved. ` +
      `Most missed so far: ${hottestEntry.name} (${hottestEntry.count} ${pluralize("miss", hottestEntry.count)}).`;
  }

  function renderMistakeBook() {
    const mistakeEntries = getMistakeEntries();
    elements.mistakeTotalBadge.textContent = `${mistakeEntries.length} ${pluralize("flag", mistakeEntries.length)}`;
    elements.mistakeList.innerHTML = "";

    if (!mistakeEntries.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "mistake-empty";
      emptyState.innerHTML =
        "<p>No saved misses yet. Once you answer a flag incorrectly, it will appear here with its running miss count.</p>";
      elements.mistakeList.appendChild(emptyState);
      return;
    }

    const list = document.createElement("ul");
    list.className = "mistake-list-items";

    for (const entry of mistakeEntries) {
      const item = document.createElement("li");
      item.className = "mistake-item";

      const left = document.createElement("div");
      left.className = "mistake-main";

      const flag = document.createElement("span");
      flag.className = "mistake-flag";
      flag.textContent = flagEmoji(entry.code);

      const copy = document.createElement("div");

      const name = document.createElement("p");
      name.className = "mistake-name";
      name.textContent = entry.name;

      const meta = document.createElement("p");
      meta.className = "mistake-meta";
      meta.textContent =
        `Missed ${entry.count} ${pluralize("time", entry.count)} • ` +
        `Last missed ${formatDate(entry.lastWrongAt)}`;

      copy.append(name, meta);
      left.append(flag, copy);

      const countBadge = document.createElement("span");
      countBadge.className = "mistake-count";
      countBadge.textContent = `x${entry.count}`;

      item.append(left, countBadge);
      list.appendChild(item);
    }

    elements.mistakeList.appendChild(list);
  }

  function clearMistakeBook() {
    const hasMistakes = getMistakeEntries().length > 0;

    if (!hasMistakes) {
      return;
    }

    const shouldClear = window.confirm(
      "Clear every saved mistake and reset the mistake book?",
    );

    if (!shouldClear) {
      return;
    }

    state.progress.mistakes = {};
    state.progress.wrongLog = [];
    saveProgress();
    renderStats();
    renderMistakeBook();

    if (state.mode === "mistakes") {
      nextQuestion();
    }
  }

  function bindEvents() {
    elements.nextButton.addEventListener("click", nextQuestion);
    elements.switchAllButton.addEventListener("click", () => setMode("all"));
    elements.clearBookButton.addEventListener("click", clearMistakeBook);

    for (const button of elements.modeButtons) {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    }
  }

  function init() {
    bindEvents();
    renderModeButtons();
    renderStats();
    renderMistakeBook();
    nextQuestion();
  }

  init();
})();
