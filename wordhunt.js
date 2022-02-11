(function () {

  async function wait(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(ms);
      }, ms);
    })
  }

  function removeAllChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getElements(elements, ids) {
    ids.forEach(id => {
      var element = document.getElementById(id);
      elements[id] = element;
    });
  }

  function getElement(ui, id) {
    return ui.elements[id];
  }

  function getKey(ui, letter) {
    letter = letter.toLowerCase();
    const keys = getElement(ui, 'keys-root');
    const numKeys = keys.children.length;
    for (let i = 0; i < numKeys; i++) {
      const key = keys.children[i].textContent.toLowerCase();
      if (key === letter) {
        return keys.children[i];
      }
    }
  }

  function setMessage(ui, message) {
    getElement(ui, 'messages').innerText = message;
  }

  function addWordRow(guessesRoot, wordLength) {
    const wordRow = document.createElement('div');
    wordRow.className = 'word-row';

    for (let i = 0; i < wordLength; i++) {
      const cell = document.createElement('div');
      cell.className = 'word-cell';
      wordRow.appendChild(cell);
    }

    guessesRoot.appendChild(wordRow);
    return wordRow;
  }

  function setupWord(ui, wordLength) {
    const guessesRoot = getElement(ui, 'guesses-root');
    removeAllChildren(guessesRoot);
    addWordRow(guessesRoot, wordLength);

    const input = getElement(ui, 'guesser').children[0];
    input.maxLength = wordLength;
    input.value = '';
    input.classList.remove('guess-ready');
  }

  function setupKeys(ui) {
    const keysRoot = getElement(ui, 'keys-root');
    keysRoot.innerHTML = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
      const key = document.createElement('div');
      key.className = 'key';
      key.innerText = alphabet[i];
      keysRoot.appendChild(key);
    }
  }

  function createUI(state) {
    var ui = {};
    state.ui = ui;
    ui.elements = {};
    var ids = ['root', 'options', 'game-panel', 'guesses-root', 'keys-root', 'guesser', 'buttons', 'challenge', 'start-button', 'word-length-select', 'messages'];
    getElements(ui.elements, ids);
    setupWord(ui, 5);
    setupKeys(ui);
  }

  function resetUI(state) {
    setMessage(state.ui, '');
    setupWord(state.ui, state.game.word.length);
    setupKeys(state.ui);
  }

  function chooseRandomWord(wordLength) {
    let i = Math.floor(Math.random() * window.words.length);
    while (true) {
      if (window.words[i].length === wordLength) {
        return i;
      }

      if (i < window.words.length) {
        i++;
      } else {
        i = 0;
      }
    }
  }

  function getGuess(state) {
    const guesser = getElement(state.ui, 'guesser');
    return guesser.children[0].value;
  }

  function findWord(word, start, end) {
    const words = window.words;
    if (typeof start === 'undefined') {
      start = 0;
    }
    if (typeof end === 'undefined') {
      end = words.length;
    }

    const n = end - start;

    if (n === 0) {
      return false;
    }

    if (n < 2000) {
      for (let i = start; i < end; i++) {
        if (words[i] === word) {
          return true;
        }
      }
      return false;
    }

    const midpoint = Math.floor(n / 2) + start;
    if (words[midpoint] === word) {
      return true;
    }

    const comparison = word.localeCompare(words[midpoint]);
    if (comparison === -1) { // word comes before midpoint
      return findWord(word, start, midpoint);
    }

    if (comparison === 1) { // word comes after midpoint
      return findWord(word, midpoint, end);
    }

    console.log('findWord had a problem: comparison was ', comparison, word, words[midpoint]);
    return false;
  }

  async function submitGuess(state, guess) {
    setMessage(state.ui, '');
    const word = state.game.word;
    if (guess.length != word.length) {
      return;
    }

    guess = guess.toLowerCase();
    if (!findWord(guess)) {
      setMessage(state.ui, guess.toUpperCase() + ' is not a valid word');
      return;
    }

    const ui = state.ui;
    const row = getElement(ui, 'guesses-root').lastChild;

    const marks = [];
    const letterCounts = {}; // number of times each letter has been guessed, minus correct placements
    const correctGuesses = {}; // correct guesses by letter
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      correctGuesses[letter] = (correctGuesses[letter] || 0);

      if (letter === word[i]) {
        marks.push('correct-cell correct-letter');
        correctGuesses[letter]++;
      } else {
        marks.push('-');
      }
    }

    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      if (marks[i] !== '-') continue;

      const keyEl = getKey(ui, guess[i]);
      const appearances = word.split(letter).length - 1;
      const remainingOtherGuesses = appearances - correctGuesses[letter];

      if (appearances === 0 || remainingOtherGuesses === 0) {
        var mark = 'incorrect-cell ';
        if (!keyEl.classList.contains('correct-letter')) {
          mark += 'wrong-letter';
        }
        marks[i] = mark;
      } else {
        marks[i] = 'other-cell correct-letter';
        correctGuesses[letter]++;
      }
    }

    for (let i = 0; i < marks.length; i++) {
      const pair = marks[i].split(' ');
      const keyEl = getKey(ui, guess[i]);

      const cell = row.children[i];
      cell.textContent = guess[i];
      cell.classList.add(pair[0]);
      if (pair[1]) {
        keyEl.classList.add(pair[1]);
      }

      await wait(200);
    }

    state.game.guesses++;
    if (guess === word) {
      setMessage(state.ui, 'You Won in ' + state.game.guesses + ' guesses.');
      state.game.won = true;
    } else if (state.game.guesses >= 6) {
      setMessage(state.ui, 'Game Over. The word was ' + state.game.word.toUpperCase());
      state.game.lost = true;
    } else {
      addWordRow(getElement(ui, 'guesses-root'), guess.length);
      const input = getElement(ui, 'guesser').children[0];
      input.value = '';
      input.classList.remove('guess-ready');
    }
  }

  function newGame(state, wordLength) {
    const wordIndex = chooseRandomWord(wordLength);
    state.game = {
      wordIndex: wordIndex,
      word: window.words[wordIndex],
      guesses: 0
    };
    resetUI(state);
  }

  function getGameId() {
    try {
      return parseInt(location.search.split('?')[1].split('id=')[1]);
    } catch (err) {
      return false;
    }
  }

  function newGameFromIndex(state, idx) {
    const word = window.words[idx];
    state.game = {
      wordIndex: idx,
      word: word,
      guesses: 0
    };
    resetUI(state);
  }

  function initGame(state) {
    const game = {};
    state.game = game;
    const gameId = getGameId();
    if (typeof gameId === 'number') {
      newGameFromIndex(state, gameId);
    } else {
      newGame(state, 5);
    }
  }

  function getEmojiRep(state) {
    const emojiRows = [];
    const guesses = getElement(state.ui, 'guesses-root');
    const rows = [].slice.call(guesses.children);
    rows.forEach(row => {
      const cells = [].slice.call(row.children);
      const emojis = [];
      cells.forEach(cell => {
        if (cell.classList.contains('correct-cell')) {
          emojis.push(String.fromCodePoint('0x1F7E9'));
        } else if (cell.classList.contains('other-cell')) {
          emojis.push(String.fromCodePoint('0x1F7E8'));
        } else {
          emojis.push(String.fromCodePoint('0x2B1C'));
        }
      });
      emojiRows.push(emojis.join(''));
    });
    return emojiRows.join('\n');
  }

  function setupListeners(state) {
    const ui = state.ui;
    const wordLengthSelect = getElement(ui, 'word-length-select');
    const startBtn = getElement(ui, 'start-button');
    startBtn.addEventListener('click', function (evt) {
      newGame(state, parseInt(wordLengthSelect.value));
    });

    const challengeBtn = getElement(ui, 'challenge');
    challengeBtn.addEventListener('click', function (evt) {
      const url = location.protocol + '//' + location.pathname + '?id=' + state.game.wordIndex;
      const emojis = getEmojiRep(state);
      const title = state.game.won ? `won in ${state.game.guesses} guesses` : `lost`;
      const text = `Word Hunt ${title}
${emojis}
${url}`;
      var data = [new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' })
      })];
      navigator.clipboard.write(data);
    });

    const input = getElement(ui, 'guesser').children[0];
    function onInput() {
      if (input.value.length === state.game.word.length) {
        input.classList.add('guess-ready');
      } else {
        input.classList.remove('guess-ready');
      }
    }
    input.addEventListener('input', onInput);

    document.addEventListener('keypress', function (evt) {
      const guess = getGuess(state);
      if (evt.keyCode === 13) { // enter
        submitGuess(state, guess);
      } else if (document.activeElement !== input && input.value.length < input.maxLength) {
        input.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var state = {};
    createUI(state);
    initGame(state);
    setupListeners(state);
  });

})();
