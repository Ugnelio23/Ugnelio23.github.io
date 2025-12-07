// assets/js/game.js
// LD12 – Flip Card Memory žaidimas + papildoma dalis (localStorage + laikmatis)

document.addEventListener("DOMContentLoaded", function () {
  const boardEl = document.getElementById("game-board");
  const movesEl = document.getElementById("moves");
  const matchesEl = document.getElementById("matches");
  const totalPairsEl = document.getElementById("total-pairs");
  const messageEl = document.getElementById("game-message");

  const btnStart = document.getElementById("btn-start");
  const btnReset = document.getElementById("btn-reset");
  const btnEasy = document.getElementById("level-easy");
  const btnHard = document.getElementById("level-hard");

  const timerEl = document.getElementById("timer");
  const bestEasyEl = document.getElementById("best-easy");
  const bestHardEl = document.getElementById("best-hard");

  // jeigu kažko trūksta – nelaužom puslapio
  if (
    !boardEl ||
    !movesEl ||
    !matchesEl ||
    !totalPairsEl ||
    !btnStart ||
    !btnReset ||
    !timerEl ||
    !bestEasyEl ||
    !bestHardEl
  ) {
    return;
  }

  // 2 punktas – duomenų rinkinys (mažiausiai 6 unikalūs)
  const symbols = ["⚡", "🔥", "🌊", "🍀", "⭐", "🎯", "🚀", "🎧", "💡", "🧠", "🛠️", "📚"];

  // žaidimo būsena
  let currentLevel = "easy"; // "easy" arba "hard"
  let deck = [];
  let firstCard = null;
  let secondCard = null;
  let isBoardLocked = false;
  let isGameStarted = false;

  let moves = 0;
  let matches = 0;
  let totalPairs = 0;

  // laikmatis
  let timerInterval = null;
  let elapsedSeconds = 0;

  // papildoma – geriausi rezultatai (localStorage)
  let bestEasy = localStorage.getItem("bestEasy");
  let bestHard = localStorage.getItem("bestHard");

  if (bestEasy !== null) bestEasy = Number(bestEasy);
  else bestEasy = null;

  if (bestHard !== null) bestHard = Number(bestHard);
  else bestHard = null;

  // nustatymai pagal lygį
  function getLevelSettings(level) {
    if (level === "hard") {
      // 6×4 = 24 kortelės = 12 porų
      return { rows: 4, cols: 6, pairs: 12 };
    }
    // easy – 4×3 = 12 kortelių = 6 porų
    return { rows: 3, cols: 4, pairs: 6 };
  }

  // Fisher–Yates shuffle
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // sugeneruojam poras iš duomenų rinkinio
  function buildDeck(level) {
    const { pairs } = getLevelSettings(level);
    const needed = symbols.slice(0, pairs); // tiek unikalių, kiek porų
    const doubled = [...needed, ...needed]; // kiekvieno po 2
    return shuffleArray(doubled);
  }

  // statistikos atnaujinimas
  function updateStats() {
    movesEl.textContent = moves;
    matchesEl.textContent = matches;
    totalPairsEl.textContent = totalPairs;
  }

  // laikmatis – atvaizdavimas
  function updateTimerDisplay() {
    const min = Math.floor(elapsedSeconds / 60);
    const sec = elapsedSeconds % 60;
    const mm = String(min).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    timerEl.textContent = `${mm}:${ss}`;
  }

  function startTimer() {
    // pradeda tik paspaudus Start (pagal papildomos dalies reikalavimą)
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    elapsedSeconds = 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      elapsedSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // papildoma – geriausių rezultatų atvaizdavimas
  function loadBestScores() {
    bestEasyEl.textContent =
      bestEasy !== null ? `${bestEasy} ėjimai` : "–";
    bestHardEl.textContent =
      bestHard !== null ? `${bestHard} ėjimai` : "–";
  }

  function saveBestScore() {
    if (totalPairs === 0) return;

    if (currentLevel === "easy") {
      if (bestEasy === null || moves < bestEasy) {
        bestEasy = moves;
        localStorage.setItem("bestEasy", String(bestEasy));
      }
    } else if (currentLevel === "hard") {
      if (bestHard === null || moves < bestHard) {
        bestHard = moves;
        localStorage.setItem("bestHard", String(bestHard));
      }
    }

    loadBestScores();
  }

  // išvalom viską į pradinę būseną
  function resetState() {
    firstCard = null;
    secondCard = null;
    isBoardLocked = false;
    isGameStarted = false;

    moves = 0;
    matches = 0;
    messageEl.textContent = "";

    stopTimer();
    elapsedSeconds = 0;
    updateTimerDisplay();
    updateStats();
  }

  // sugeneruojam kortelių lentą (3b, 4, 5)
  function renderBoard() {
    const { rows, cols, pairs } = getLevelSettings(currentLevel);
    totalPairs = pairs;
    updateStats();

    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    deck = buildDeck(currentLevel);

    deck.forEach((symbol, index) => {
      const card = document.createElement("div");
      card.classList.add("game-card");
      card.dataset.index = index;
      card.dataset.symbol = symbol;

      card.innerHTML = `
        <div class="game-card-inner">
          <div class="game-card-front">?</div>
          <div class="game-card-back">${symbol}</div>
        </div>
      `;

      card.addEventListener("click", () => handleCardClick(card));
      boardEl.appendChild(card);
    });
  }

  // 4–5 punktai – kortelių apvertimas ir sutapimo taisyklės
  function handleCardClick(card) {
    // papildoma: neleisti žaisti, kol nepaspaustas Start
    if (!isGameStarted) return;

    if (isBoardLocked) return;
    if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

    card.classList.add("flipped");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    if (!secondCard && card !== firstCard) {
      secondCard = card;
      moves++;
      updateStats();
      checkForMatch();
    }
  }

  function checkForMatch() {
    const symbol1 = firstCard.dataset.symbol;
    const symbol2 = secondCard.dataset.symbol;

    if (symbol1 === symbol2) {
      // sutapusios kortelės
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      firstCard = null;
      secondCard = null;
      matches++;
      updateStats();
      checkWin();
    } else {
      // nesutapusios – apverčiam atgal
      isBoardLocked = true;
      setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        firstCard = null;
        secondCard = null;
        isBoardLocked = false;
      }, 800);
    }
  }

  // 7 punktas – laimėjimo pranešimas
  function checkWin() {
    if (matches === totalPairs && totalPairs > 0) {
      messageEl.textContent = "Laimėjote!";
      isGameStarted = false;
      stopTimer();          // papildoma – sustabdom laikmatį
      saveBestScore();      // papildoma – išsaugom rekordą
    }
  }

  // 8 punktas – Start mygtukas
  function startGame() {
    // pradinis startas arba naujas žaidimas su dabartiniu lygiu
    resetState();
    renderBoard();
    isGameStarted = true;
    startTimer(); // papildoma – laikmatis startuoja tik čia
  }

  // 9 punktas – Atnaujinti
  function resetGame() {
    // turi: atstatyti būseną, sumaišyti korteles, paslėpti jas, bet laikmatis nestartuojamas,
    // kol iš naujo nepaspaudžiamas Start (pagal papildomos dalies 2 p.)
    resetState();
    renderBoard();
  }

  // 3 punktas – sunkumo lygio keitimas
  function setLevel(level) {
    currentLevel = level;

    // mygtukų aktyvumas
    btnEasy.classList.toggle("active", level === "easy");
    btnHard.classList.toggle("active", level === "hard");

    // keičiant lygį – tiesiog resetinam žaidimą, be laikmačio starto
    resetGame();
  }

  // mygtukų event'ai
  btnStart.addEventListener("click", startGame);
  btnReset.addEventListener("click", resetGame);

  btnEasy.addEventListener("click", () => setLevel("easy"));
  btnHard.addEventListener("click", () => setLevel("hard"));

  // pradinė būsena
  loadBestScores();  // papildoma – parodom rekordus iš localStorage
  updateTimerDisplay();
  setLevel("easy");  // sugeneruojam pradinę lentą, bet žaidimas nepradėtas (kol nespaus Start)
});
