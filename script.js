/*===================
DOM SELECTOR
===================*/
const gameContainer = document.querySelector('.game-container');
const restartBtn = document.getElementById('restart');
const difficultySelect = document.getElementById('difficulty');

/*===================
CONFIG & STATE
===================*/
const difficultyConfig = {
  easy:   { size: 4, pairs: 8 },
  medium: { size: 6, pairs: 18 },
  hard:   { size: 8, pairs: 32 }
};

/*===================
emojiPool, state, dll...
===================*/
const emojiPool = [
  '🍎','🍌','🍇','🍓','🍉','🍒','🥝','🍍',
  '🥑','🍋','🍑','🍈','🍐','🍊','🥥','🌽',
  '🥕','🍄','🫐','🥔','🍆','🥦','🌶','🧄',
  '🧅','🥬','🥒','🫛','🌰','🍠','🫑','🍅'
];

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;

const timeEl = document.getElementById('time');
const movesEl = document.getElementById('moves');

let timer = null;
let seconds = 0;
let moves = 0;

const winModal = document.getElementById('winModal');
const finalTimeEl = document.getElementById('finalTime');
const finalMovesEl = document.getElementById('finalMoves');
const playAgainBtn = document.getElementById('playAgain');

const bestTimeEl = document.getElementById('bestTime');
const bestMovesEl = document.getElementById('bestMoves');

const sounds = {
  flip: new Audio('assets/sounds/flip.mp3'),
  match: new Audio('assets/sounds/match.mp3'),
  wrong: new Audio('assets/sounds/wrong.mp3'),
  win: new Audio('assets/sounds/win.wav'),
};

const soundToggleBtn = document.getElementById('soundToggle');

let soundEnabled = true;

/*===================
FUNCTION
===================*/
function initGame() {
  winModal.classList.add('hidden');

  gameContainer.innerHTML = '';
  matchedPairs = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  moves = 0;
  movesEl.textContent = 0;
  resetTimer();

  const level = difficultySelect.value;
  const { size, pairs } = difficultyConfig[level];

  gameContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const selected = emojiPool.slice(0, pairs);
  cards = [...selected, ...selected].sort(() => 0.5 - Math.random());

  cards.forEach(value => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.card = value;

    card.innerHTML = `
      <div class="front">?</div>
      <div class="back">${value}</div>
    `;

    card.addEventListener('click', flipCard);
    gameContainer.appendChild(card);
  });

  loadBestScore();
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  playSound(sounds.flip);
  vibrate(20); // 📳 short tap

  startTimer();
  this.classList.add('flip');

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  moves++;
  movesEl.textContent = moves;
  checkMatch();
}

function checkMatch() {
  const isMatch = firstCard.dataset.card === secondCard.dataset.card;
  isMatch ? disableCards() : unflipCards();
}

//LOCK BOARD (ANTI SPAM)
function disableCards() {
  playSound(sounds.match);

  firstCard.classList.add('match');
  secondCard.classList.add('match');

  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);

  matchedPairs++;
  resetBoard();

  if (matchedPairs === cards.length / 2) {
  clearInterval(timer);

  playSound(sounds.win);
  vibrate([100, 50, 100, 50, 150]); // 🏆 victory pattern

  // best score logic
  const bestKey = getBestKey();
  const bestData = JSON.parse(localStorage.getItem(bestKey));

  const isBetter =
    !bestData ||
    seconds < bestData.time ||
    (seconds === bestData.time && moves < bestData.moves);

  if (isBetter) {
    localStorage.setItem(bestKey, JSON.stringify({
      time: seconds,
      moves: moves
    }));
  }

  loadBestScore();

  finalTimeEl.textContent = seconds;
  finalMovesEl.textContent = moves;

  setTimeout(() => {
    winModal.classList.remove('hidden');
        }, 500);
    }

}

function unflipCards() {
  lockBoard = true;

  playSound(sounds.wrong);
  vibrate([40, 30, 40]); 

  firstCard.classList.add('shake');
  secondCard.classList.add('shake');

  setTimeout(() => {
    firstCard.classList.remove('flip', 'shake');
    secondCard.classList.remove('flip', 'shake');
    resetBoard();
  }, 600);
}

function resetBoard() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

//TIMER FUNCTION
function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    seconds++;
    timeEl.textContent = seconds;
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  seconds = 0;
  timeEl.textContent = 0;
}

function getBestKey() {
  return `memory-best-${difficultySelect.value}`;
}

function loadBestScore() {
  const data = JSON.parse(localStorage.getItem(getBestKey()));

  if (!data) {
    bestTimeEl.textContent = '--';
    bestMovesEl.textContent = '--';
    return;
  }

  bestTimeEl.textContent = data.time;
  bestMovesEl.textContent = data.moves;
}

function playSound(sound) {
  if (!soundEnabled || !sound) return;
  sound.currentTime = 0;
  sound.play();
}

function loadSoundSetting() {
  const saved = localStorage.getItem('memory-sound');
  soundEnabled = saved !== 'off';
  updateSoundButton();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('memory-sound', soundEnabled ? 'on' : 'off');
  updateSoundButton();
}

function updateSoundButton() {
  soundToggleBtn.textContent = soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
}

function vibrate(pattern) {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate(pattern);
}

/*===================
EVENT LISTENER
===================*/
//PLAY AGAIN BUTTON
playAgainBtn.addEventListener('click', () => {
  winModal.classList.add('hidden');
  initGame();
});

/* 🔄 Restart */
restartBtn.addEventListener('click', initGame);

difficultySelect.addEventListener('change', initGame);

soundToggleBtn.addEventListener('click', toggleSound);

/*===================
START GAME
===================*/
loadSoundSetting();
initGame();


