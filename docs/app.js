(() => {
  const STORAGE_KEY = "flag-memory-drill-progress-v1";
  const MAX_WRONG_LOG = 40;
  const MISTAKES_PER_PAGE = 6;
  const FLAGS = Array.isArray(window.FLAG_DATA)
    ? window.FLAG_DATA.map(([code, name]) => ({ code, name }))
    : [];
  const FLAG_MAP = new Map(FLAGS.map((flag) => [flag.code, flag]));
  const ALL_CODES = FLAGS.map((flag) => flag.code);
  const UN_MEMBER_CODES = [
    "AF",
    "AL",
    "DZ",
    "AD",
    "AO",
    "AG",
    "AR",
    "AM",
    "AU",
    "AT",
    "AZ",
    "BS",
    "BH",
    "BD",
    "BB",
    "BY",
    "BE",
    "BZ",
    "BJ",
    "BT",
    "BO",
    "BA",
    "BW",
    "BR",
    "BN",
    "BG",
    "BF",
    "BI",
    "CV",
    "KH",
    "CM",
    "CA",
    "CF",
    "TD",
    "CL",
    "CN",
    "CO",
    "KM",
    "CG",
    "CD",
    "CR",
    "CI",
    "HR",
    "CU",
    "CY",
    "CZ",
    "DK",
    "DJ",
    "DM",
    "DO",
    "EC",
    "EG",
    "SV",
    "GQ",
    "ER",
    "EE",
    "SZ",
    "ET",
    "FJ",
    "FI",
    "FR",
    "GA",
    "GM",
    "GE",
    "DE",
    "GH",
    "GR",
    "GD",
    "GT",
    "GN",
    "GW",
    "GY",
    "HT",
    "HN",
    "HU",
    "IS",
    "IN",
    "ID",
    "IR",
    "IQ",
    "IE",
    "IL",
    "IT",
    "JM",
    "JP",
    "JO",
    "KZ",
    "KE",
    "KI",
    "KP",
    "KR",
    "KW",
    "KG",
    "LA",
    "LV",
    "LB",
    "LS",
    "LR",
    "LY",
    "LI",
    "LT",
    "LU",
    "MG",
    "MW",
    "MY",
    "MV",
    "ML",
    "MT",
    "MH",
    "MR",
    "MU",
    "MX",
    "FM",
    "MD",
    "MC",
    "MN",
    "ME",
    "MA",
    "MZ",
    "MM",
    "NA",
    "NR",
    "NP",
    "NL",
    "NZ",
    "NI",
    "NE",
    "NG",
    "MK",
    "NO",
    "OM",
    "PK",
    "PW",
    "PA",
    "PG",
    "PY",
    "PE",
    "PH",
    "PL",
    "PT",
    "QA",
    "RO",
    "RU",
    "RW",
    "KN",
    "LC",
    "VC",
    "WS",
    "SM",
    "ST",
    "SA",
    "SN",
    "RS",
    "SC",
    "SL",
    "SG",
    "SK",
    "SI",
    "SB",
    "SO",
    "ZA",
    "SS",
    "ES",
    "LK",
    "SD",
    "SR",
    "SE",
    "CH",
    "SY",
    "TJ",
    "TH",
    "TL",
    "TG",
    "TO",
    "TT",
    "TN",
    "TR",
    "TM",
    "TV",
    "UG",
    "UA",
    "AE",
    "GB",
    "TZ",
    "US",
    "UY",
    "UZ",
    "VU",
    "VE",
    "VN",
    "YE",
    "ZM",
    "ZW",
  ].filter((code) => FLAG_MAP.has(code));

  const elements = {
    poolLabel: document.getElementById("pool-label"),
    flag: document.getElementById("flag"),
    options: document.getElementById("options"),
    feedback: document.getElementById("feedback"),
    nextButton: document.getElementById("next-btn"),
    emptyReview: document.getElementById("empty-review"),
    runComplete: document.getElementById("run-complete"),
    runCompleteTitle: document.getElementById("run-complete-title"),
    runCompleteCopy: document.getElementById("run-complete-copy"),
    questionCard: document.getElementById("question-card"),
    switchAllButton: document.getElementById("switch-all-btn"),
    restartRunButton: document.getElementById("restart-run-btn"),
    deckSize: document.getElementById("deck-size"),
    answeredCount: document.getElementById("answered-count"),
    accuracyValue: document.getElementById("accuracy-value"),
    trackedCount: document.getElementById("tracked-count"),
    reviewSummary: document.getElementById("review-summary"),
    modeStatsCard: document.getElementById("mode-stats-card"),
    modeStatsHeading: document.getElementById("mode-stats-heading"),
    modeStatsBadge: document.getElementById("mode-stats-badge"),
    modeStatsGrid: document.getElementById("mode-stats-grid"),
    modeStatsSummary: document.getElementById("mode-stats-summary"),
    mistakeList: document.getElementById("mistake-list"),
    mistakeTotalBadge: document.getElementById("mistake-total-badge"),
    mistakePagination: document.getElementById("mistake-pagination"),
    mistakePrevButton: document.getElementById("mistake-prev-btn"),
    mistakeNextButton: document.getElementById("mistake-next-btn"),
    mistakePageLabel: document.getElementById("mistake-page-label"),
    clearBookButton: document.getElementById("clear-book-btn"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
  };

  const state = {
    mode: "all",
    currentQuestion: null,
    locked: false,
    lastQuestionCodeByMode: {
      all: null,
      mistakes: null,
      un: null,
    },
    mistakePage: 1,
    progress: loadProgress(),
  };

  function defaultModeStats() {
    return {
      answered: 0,
      correct: 0,
      wrong: 0,
    };
  }

  function defaultNoRepeatRun() {
    return {
      order: [],
      index: 0,
      answered: 0,
      correct: 0,
      wrong: 0,
      completed: false,
    };
  }

  function defaultNoRepeatStats() {
    return {
      answered: 0,
      correct: 0,
      wrong: 0,
      completedRuns: 0,
      lastRunAccuracy: null,
      bestRunAccuracy: null,
      currentRun: defaultNoRepeatRun(),
    };
  }

  function defaultProgress() {
    return {
      answered: 0,
      correct: 0,
      wrong: 0,
      mistakes: {},
      wrongLog: [],
      modeStats: {
        noRepeat: defaultNoRepeatStats(),
        un: defaultModeStats(),
      },
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

    if (raw.modeStats && typeof raw.modeStats === "object") {
      normalized.modeStats.noRepeat = normalizeNoRepeatStats(
        raw.modeStats.noRepeat,
      );
      normalized.modeStats.un = normalizeModeStats(raw.modeStats.un);
    }

    return normalized;
  }

  function normalizeModeStats(raw) {
    const normalized = defaultModeStats();

    if (!raw || typeof raw !== "object") {
      return normalized;
    }

    normalized.answered = safeWholeNumber(raw.answered);
    normalized.correct = safeWholeNumber(raw.correct);
    normalized.wrong = safeWholeNumber(raw.wrong);
    return normalized;
  }

  function normalizeNoRepeatRun(raw) {
    const normalized = defaultNoRepeatRun();

    if (!raw || typeof raw !== "object" || !Array.isArray(raw.order)) {
      return normalized;
    }

    const order = raw.order.filter((code) => FLAG_MAP.has(code));

    if (order.length !== ALL_CODES.length || new Set(order).size !== ALL_CODES.length) {
      return normalized;
    }

    normalized.order = order;
    normalized.answered = Math.min(safeWholeNumber(raw.answered), ALL_CODES.length);
    normalized.correct = Math.min(safeWholeNumber(raw.correct), normalized.answered);
    normalized.wrong = Math.min(safeWholeNumber(raw.wrong), normalized.answered);
    normalized.completed = Boolean(raw.completed) && normalized.answered >= ALL_CODES.length;

    if (normalized.completed) {
      normalized.index = ALL_CODES.length;
    } else {
      normalized.index = Math.min(
        safeWholeNumber(raw.index),
        Math.max(0, ALL_CODES.length - 1),
      );
    }

    return normalized;
  }

  function normalizeNullablePercent(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
  }

  function normalizeNoRepeatStats(raw) {
    const normalized = defaultNoRepeatStats();

    if (!raw || typeof raw !== "object") {
      return normalized;
    }

    normalized.answered = safeWholeNumber(raw.answered);
    normalized.correct = safeWholeNumber(raw.correct);
    normalized.wrong = safeWholeNumber(raw.wrong);
    normalized.completedRuns = safeWholeNumber(raw.completedRuns);
    normalized.lastRunAccuracy = normalizeNullablePercent(raw.lastRunAccuracy);
    normalized.bestRunAccuracy = normalizeNullablePercent(raw.bestRunAccuracy);
    normalized.currentRun = normalizeNoRepeatRun(raw.currentRun);
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

  function calculateAccuracy(correct, answered) {
    return answered ? Math.round((correct / answered) * 100) : 0;
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

  function incrementScore(scoreboard, isCorrect) {
    scoreboard.answered += 1;

    if (isCorrect) {
      scoreboard.correct += 1;
    } else {
      scoreboard.wrong += 1;
    }
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

  function createNoRepeatRun() {
    return {
      order: shuffle(ALL_CODES),
      index: 0,
      answered: 0,
      correct: 0,
      wrong: 0,
      completed: false,
    };
  }

  function ensureNoRepeatRun() {
    const noRepeat = state.progress.modeStats.noRepeat;
    const run = noRepeat.currentRun;
    const hasValidOrder =
      Array.isArray(run.order) &&
      run.order.length === ALL_CODES.length &&
      new Set(run.order).size === ALL_CODES.length &&
      run.order.every((code) => FLAG_MAP.has(code));

    if (!hasValidOrder) {
      noRepeat.currentRun = createNoRepeatRun();
      saveProgress();
    }

    return noRepeat.currentRun;
  }

  function startNewNoRepeatRun() {
    state.progress.modeStats.noRepeat.currentRun = createNoRepeatRun();
    saveProgress();

    if (state.mode === "norepeat") {
      state.currentQuestion = null;
      state.locked = false;
      nextQuestion();
    } else {
      renderModeStats();
    }
  }

  function getActiveCodes(mode = state.mode) {
    if (mode === "mistakes") {
      return getMistakeEntries().map((entry) => entry.code);
    }

    if (mode === "un") {
      return UN_MEMBER_CODES;
    }

    return ALL_CODES;
  }

  function getDistractorPool(mode, correctCode) {
    const sourceCodes = mode === "un" ? UN_MEMBER_CODES : ALL_CODES;
    return sourceCodes.filter((code) => code !== correctCode);
  }

  function pickCorrectCode(pool, mode) {
    if (!pool.length) {
      return null;
    }

    if (pool.length === 1) {
      return pool[0];
    }

    let candidate = pool[Math.floor(Math.random() * pool.length)];
    let attempts = 0;

    while (candidate === state.lastQuestionCodeByMode[mode] && attempts < 12) {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      attempts += 1;
    }

    return candidate;
  }

  function buildOptions(correctCode, mode) {
    const distractors = sample(getDistractorPool(mode, correctCode), 3);
    return shuffle([correctCode, ...distractors]);
  }

  function buildQuestion() {
    if (state.mode === "norepeat") {
      const run = ensureNoRepeatRun();

      if (run.completed) {
        return null;
      }

      const correctCode = run.order[run.index];
      return {
        mode: state.mode,
        correctCode,
        options: buildOptions(correctCode, "all"),
      };
    }

    const pool = getActiveCodes();

    if (!pool.length) {
      return null;
    }

    const correctCode = pickCorrectCode(pool, state.mode);

    return {
      mode: state.mode,
      correctCode,
      options: buildOptions(correctCode, state.mode),
    };
  }

  function nextQuestion() {
    if (state.currentQuestion && state.currentQuestion.mode !== "norepeat") {
      state.lastQuestionCodeByMode[state.currentQuestion.mode] =
        state.currentQuestion.correctCode;
    }

    state.locked = false;
    state.currentQuestion = buildQuestion();
    renderQuestion();
    renderStats();
    renderModeStats();
  }

  function setMode(mode) {
    const nextMode = ["all", "mistakes", "norepeat", "un"].includes(mode)
      ? mode
      : "all";

    state.mode = nextMode;
    state.currentQuestion = null;
    state.locked = false;

    if (state.mode === "norepeat") {
      ensureNoRepeatRun();
    }

    renderModeButtons();
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
    const noRepeatRun =
      state.mode === "norepeat" ? ensureNoRepeatRun() : defaultNoRepeatRun();
    const isRunComplete = state.mode === "norepeat" && noRepeatRun.completed;

    elements.poolLabel.textContent =
      state.mode === "mistakes"
        ? `Mistake Book • ${mistakeEntries.length} saved ${pluralize("flag", mistakeEntries.length)}`
        : state.mode === "norepeat"
          ? `No-Repeat Run • ${noRepeatRun.answered}/${ALL_CODES.length} answered`
          : state.mode === "un"
            ? `UN Countries • ${UN_MEMBER_CODES.length} member states`
            : `All Flags • ${ALL_CODES.length} total ${pluralize("flag", ALL_CODES.length)}`;

    elements.emptyReview.classList.toggle("hidden", !isEmptyReview);
    elements.runComplete.classList.toggle("hidden", !isRunComplete);
    elements.questionCard.classList.toggle("hidden", isEmptyReview || isRunComplete);

    if (isRunComplete) {
      const accuracy = calculateAccuracy(noRepeatRun.correct, noRepeatRun.answered);
      elements.runCompleteTitle.textContent = "No-repeat run complete.";
      elements.runCompleteCopy.textContent =
        `You answered ${noRepeatRun.correct} of ${ALL_CODES.length} flags correctly ` +
        `for ${accuracy}% accuracy, with ${noRepeatRun.wrong} ${pluralize("miss", noRepeatRun.wrong)}.`;
    }

    if (isEmptyReview || isRunComplete || !state.currentQuestion) {
      elements.feedback.textContent = "";
      elements.feedback.className = "feedback";
      return;
    }

    const currentFlag = FLAG_MAP.get(state.currentQuestion.correctCode);
    elements.flag.textContent = flagEmoji(currentFlag.code);
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
    elements.nextButton.textContent = "Next Flag";
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

    const { correctCode } = state.currentQuestion;
    const correctFlag = FLAG_MAP.get(correctCode);
    const isCorrect = selectedCode === correctCode;
    const timestamp = new Date().toISOString();
    const optionButtons = Array.from(elements.options.querySelectorAll("button"));

    incrementScore(state.progress, isCorrect);

    if (isCorrect) {
      elements.feedback.textContent = `Correct. This is ${correctFlag.name}.`;
      elements.feedback.className = "feedback is-success";
    } else {
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

    if (state.mode === "un") {
      incrementScore(state.progress.modeStats.un, isCorrect);
    }

    if (state.mode === "norepeat") {
      const noRepeat = state.progress.modeStats.noRepeat;
      const run = ensureNoRepeatRun();

      incrementScore(noRepeat, isCorrect);
      run.answered += 1;

      if (isCorrect) {
        run.correct += 1;
      } else {
        run.wrong += 1;
      }

      if (run.answered >= ALL_CODES.length) {
        const runAccuracy = calculateAccuracy(run.correct, run.answered);
        run.completed = true;
        run.index = ALL_CODES.length;
        noRepeat.completedRuns += 1;
        noRepeat.lastRunAccuracy = runAccuracy;
        noRepeat.bestRunAccuracy =
          noRepeat.bestRunAccuracy === null
            ? runAccuracy
            : Math.max(noRepeat.bestRunAccuracy, runAccuracy);
        elements.nextButton.textContent = "View Summary";
      } else {
        run.index += 1;
      }
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
    renderModeStats();
    renderMistakeBook();
    elements.nextButton.disabled = false;
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

  function createStatTile(label, value) {
    const tile = document.createElement("article");
    tile.className = "stat-tile";

    const title = document.createElement("span");
    title.className = "stat-label";
    title.textContent = label;

    const content = document.createElement("strong");
    content.className = "stat-value";
    content.textContent = value;

    tile.append(title, content);
    return tile;
  }

  function renderModeStats() {
    if (state.mode === "norepeat") {
      const noRepeat = state.progress.modeStats.noRepeat;
      const run = ensureNoRepeatRun();
      const runAccuracy = calculateAccuracy(run.correct, run.answered);
      const modeAccuracy = calculateAccuracy(noRepeat.correct, noRepeat.answered);

      elements.modeStatsCard.classList.remove("hidden");
      elements.modeStatsHeading.textContent = "No-Repeat Run";
      elements.modeStatsBadge.textContent = run.completed ? "Completed" : "In Progress";
      elements.modeStatsGrid.innerHTML = "";
      elements.modeStatsGrid.appendChild(
        createStatTile("Run Progress", `${run.answered}/${ALL_CODES.length}`),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Run Accuracy", `${runAccuracy}%`),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Run Misses", String(run.wrong)),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Mode Accuracy", `${modeAccuracy}%`),
      );
      elements.modeStatsSummary.textContent =
        `Completed runs: ${noRepeat.completedRuns}. ` +
        `Last finished run: ${noRepeat.lastRunAccuracy === null ? "--" : `${noRepeat.lastRunAccuracy}%`}. ` +
        `Best run: ${noRepeat.bestRunAccuracy === null ? "--" : `${noRepeat.bestRunAccuracy}%`}.`;
      return;
    }

    if (state.mode === "un") {
      const unStats = state.progress.modeStats.un;
      const accuracy = calculateAccuracy(unStats.correct, unStats.answered);

      elements.modeStatsCard.classList.remove("hidden");
      elements.modeStatsHeading.textContent = "UN Countries";
      elements.modeStatsBadge.textContent = "Separate Score";
      elements.modeStatsGrid.innerHTML = "";
      elements.modeStatsGrid.appendChild(
        createStatTile("Deck Size", String(UN_MEMBER_CODES.length)),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Answered", String(unStats.answered)),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Accuracy", `${accuracy}%`),
      );
      elements.modeStatsGrid.appendChild(
        createStatTile("Misses", String(unStats.wrong)),
      );
      elements.modeStatsSummary.textContent =
        "This mode only asks UN member-state flags while still updating the overall dashboard.";
      return;
    }

    elements.modeStatsCard.classList.add("hidden");
  }

  function renderStats() {
    const mistakeEntries = getMistakeEntries();
    const accuracy = calculateAccuracy(state.progress.correct, state.progress.answered);
    const currentDeckSize =
      state.mode === "mistakes"
        ? mistakeEntries.length
        : state.mode === "un"
          ? UN_MEMBER_CODES.length
          : ALL_CODES.length;

    elements.deckSize.textContent = String(currentDeckSize);
    elements.answeredCount.textContent = String(state.progress.answered);
    elements.accuracyValue.textContent = `${accuracy}%`;
    elements.trackedCount.textContent = String(mistakeEntries.length);

    if (state.mode === "norepeat") {
      const run = ensureNoRepeatRun();
      elements.reviewSummary.textContent =
        run.completed
          ? "Your no-repeat self-test is finished. Review the summary or start a fresh shuffled run."
          : "No-repeat mode asks each flag exactly once per run, so you can treat it like a full self-test.";
      return;
    }

    if (state.mode === "un") {
      elements.reviewSummary.textContent =
        "UN Countries mode excludes territories and non-member entries from the question pool.";
      return;
    }

    if (!mistakeEntries.length && state.mode !== "mistakes") {
      elements.reviewSummary.textContent =
        "Review mode is ready when you start missing flags.";
      return;
    }

    if (!mistakeEntries.length) {
      elements.reviewSummary.textContent =
        "Your mistake book is empty right now.";
      return;
    }

    const hottestEntry = mistakeEntries[0];
    const modeLead =
      state.mode === "mistakes"
        ? "Mistake Book mode is using your saved review set. "
        : "";
    elements.reviewSummary.textContent =
      modeLead +
      `${mistakeEntries.length} ${pluralize("flag", mistakeEntries.length)} saved. ` +
      `Most missed so far: ${hottestEntry.name} (${hottestEntry.count} ${pluralize("miss", hottestEntry.count)}).`;
  }

  function renderMistakeBook() {
    const mistakeEntries = getMistakeEntries();
    const totalPages = Math.max(
      1,
      Math.ceil(mistakeEntries.length / MISTAKES_PER_PAGE),
    );
    state.mistakePage = Math.min(state.mistakePage, totalPages);
    const startIndex = (state.mistakePage - 1) * MISTAKES_PER_PAGE;
    const visibleEntries = mistakeEntries.slice(
      startIndex,
      startIndex + MISTAKES_PER_PAGE,
    );

    elements.mistakeTotalBadge.textContent = `${mistakeEntries.length} ${pluralize("flag", mistakeEntries.length)}`;
    elements.mistakeList.innerHTML = "";

    if (!mistakeEntries.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "mistake-empty";
      emptyState.innerHTML =
        "<p>No saved misses yet. Once you answer a flag incorrectly, it will appear here with its running miss count.</p>";
      elements.mistakeList.appendChild(emptyState);
      elements.mistakePagination.classList.add("hidden");
      return;
    }

    const list = document.createElement("ul");
    list.className = "mistake-list-items";

    for (const entry of visibleEntries) {
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
    elements.mistakePagination.classList.toggle(
      "hidden",
      mistakeEntries.length <= MISTAKES_PER_PAGE,
    );
    elements.mistakePrevButton.disabled = state.mistakePage === 1;
    elements.mistakeNextButton.disabled = state.mistakePage === totalPages;
    elements.mistakePageLabel.textContent = `Page ${state.mistakePage} of ${totalPages}`;
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
    state.mistakePage = 1;
    saveProgress();
    renderStats();
    renderMistakeBook();

    if (state.mode === "mistakes") {
      nextQuestion();
    }
  }

  function changeMistakePage(direction) {
    const totalPages = Math.max(
      1,
      Math.ceil(getMistakeEntries().length / MISTAKES_PER_PAGE),
    );

    state.mistakePage = Math.min(
      totalPages,
      Math.max(1, state.mistakePage + direction),
    );
    renderMistakeBook();
  }

  function bindEvents() {
    elements.nextButton.addEventListener("click", nextQuestion);
    elements.switchAllButton.addEventListener("click", () => setMode("all"));
    elements.restartRunButton.addEventListener("click", startNewNoRepeatRun);
    elements.clearBookButton.addEventListener("click", clearMistakeBook);
    elements.mistakePrevButton.addEventListener("click", () =>
      changeMistakePage(-1),
    );
    elements.mistakeNextButton.addEventListener("click", () =>
      changeMistakePage(1),
    );

    for (const button of elements.modeButtons) {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    }
  }

  function init() {
    bindEvents();
    renderModeButtons();
    renderStats();
    renderModeStats();
    renderMistakeBook();
    nextQuestion();
  }

  init();
})();
