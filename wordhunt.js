(function () {

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
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
      const key = document.createElement('div');
      key.className = 'key';
      key.innerText = alphabet[i];
      keysRoot.appendChild(key);
    }
  }

  function resetKeys(ui) {

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
    resetKeys(state.ui);
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

  function submitGuess(state, guess) {
    const word = state.game.word;
    if (guess.length != word.length) {
      return;
    }

    const row = addWordRow(getElement(state.ui, 'guesses-root'), guess.length);

    const letterCounts = {};
    for (let i = 0; i < guess.length; i++) {
      const cell = row.children[i];
      const letter = guess[i];
      cell.textContent = letter;
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;

      if (letter === word[i]) {
        cell.classList.add('correct-cell');
      } else {
        const appearances = word.split(letter).length - 1;
        if (appearances === 0 || appearances < letterCounts[letter]) {
          cell.classList.add('incorrect-cell');
        } else {
          cell.classList.add('other-cell');
        }
      }
    }
  }

  function newGame(state, wordLength) {
    state.game.word = chooseRandomWord(wordLength);
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
