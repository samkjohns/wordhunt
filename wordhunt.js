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
    var ids = ['root', 'options', 'game-panel', 'guesses-root', 'keys-root', 'guesser', 'start-button', 'word-length-select'];
    getElements(ui.elements, ids);
    setupWord(ui, 5);
    setupKeys(ui);
  }

  function resetUI(state) {
    setupWord(state.ui, state.game.word.length);
    setupKeys(state.ui);
  }

  function chooseRandomWord(wordLength) {
    let i = Math.floor(Math.random() * window.words.length);
    while (true) {
      if (window.words[i].length === wordLength) {
        return window.words[i];
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
    const word = state.game.word;
    if (guess.length != word.length) {
      return;
    }

    if (!findWord(guess)) {
      console.log(guess, 'is not a valid word');
      return;
    }

    const ui = state.ui;
    const row = getElement(ui, 'guesses-root').lastChild;

    const letterCounts = {};
    for (let i = 0; i < guess.length; i++) {
      const cell = row.children[i];
      const letter = guess[i];
      cell.textContent = letter;
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;

      const keyEl = getKey(ui, letter);
      if (letter === word[i]) {
        cell.classList.add('correct-cell');
        keyEl.classList.add('correct-letter');
      } else {
        const appearances = word.split(letter).length - 1;
        if (appearances === 0 || appearances < letterCounts[letter]) {
          cell.classList.add('incorrect-cell');
          if (!keyEl.classList.contains('correct-letter')) {
            keyEl.classList.add('wrong-letter');
          }
        } else {
          cell.classList.add('other-cell');
          keyEl.classList.add('correct-letter');
        }
      }
      await wait(200);
    }

    state.game.guesses++;
    if (guess === word) {
      console.log('You Won in ', state.game.guesses);
    } else if (state.game.guesses >= 6) {
      console.log('Game Over');
    } else {
      addWordRow(getElement(ui, 'guesses-root'), guess.length);
      const input = getElement(ui, 'guesser').children[0];
      input.value = '';
      input.classList.remove('guess-ready');
    }
  }

  function newGame(state, wordLength) {
    state.game.word = chooseRandomWord(wordLength);
    state.game.guesses = 0;
    console.log(state.game.word);
    resetUI(state)
  }

  function initGame(state) {
    const game = {};
    state.game = game;
    newGame(state, 5);
  }

  function setupListeners(state) {
    const ui = state.ui;
    const wordLengthSelect = getElement(ui, 'word-length-select');
    const btn = getElement(ui, 'start-button');
    btn.addEventListener('click', function (evt) {
      newGame(state, parseInt(wordLengthSelect.value));
    });

    const input = getElement(ui, 'guesser').children[0];
    input.addEventListener('input', function (evt) {
      if (input.value.length === state.game.word.length) {
        input.classList.add('guess-ready');
      } else {
        input.classList.remove('guess-ready');
      }
    });

    document.addEventListener('keypress', function (evt) {
      const guess = getGuess(state);
      if (evt.keyCode === 13) { // enter
        submitGuess(state, guess);
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
