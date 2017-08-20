const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fs = require('fs');


const app = express();


app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


// middleware
app.use(session({
  secret: "somethingsecretive",
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(expressValidator());
app.use('/static', express.static('public'));

// create new game if word is not defined in session
app.use((req, res, next) => {
  if (req.session.word) {
    return next();

  // } else if (!req.session.level) {
  //   return next();

  } else {
    req.session.word = words[Math.floor(Math.random() * words.length)];
    console.log(req.session.word);
    req.session.guesses = [];
    req.session.guessLeft = 8;
    let word = req.session.word;
    console.log(word);
    req.session.letters = word.split('');
    letters = req.session.letters;
    req.session.blanks = Array(letters.length).fill('_');

  }
  return next();
});


// pull list of words from file on comp
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toUpperCase().split("\n");
const easyWords =[];
const mediumWords = [];
const hardWords = [];

// create three different arrays of words of various word length
words.filter(function(word) {
  if (word.length <= 6 && word.length >= 4) {
    return easyWords.push(word);
  } else if (word.length === 7) {
    return mediumWords.push(word);
  } else if (word.length >= 8) {
    return hardWords.push(word);
  }
});

// render the main page with info about game
app.get('/', (req, res) => {
  res.render('index', {
    blanks: req.session.blanks.join(' '),
    remaining: req.session.guessLeft,
    userName: req.session.userName,
    guesses: req.session.guesses,
    level: req.session.level
  });
});

// allow user to add name and show their name at top of screen
app.post('/userName', (req, res) => {
  req.session.userName = req.body.userName;
  res.redirect('/');
});

//allow user to pick a difficulty level
app.post('/level', (req, res) => {
  req.session.level = req.body.level;
  res.redirect('/');
});

// logic for determining if the guess is correct or incorrect,
// and hwo to proceed.
app.post('/guesses', (req, res) => {
  //check if the guess is more than one letter. if so,
  // throw an error
  req.checkBody("guess", "Please enter one character at a time").isLength(1, 1);
  req.checkBody("guess", "Invalid entry. Please enter only alphabetical characters").isAlpha();
  req.body.guess = req.body.guess.toUpperCase();
  let errors = req.validationErrors();
  if (errors) {
    res.render('index', {
      level: req.session.level,
      errors: errors,
      guesses: req.session.guesses,
      blanks: req.session.blanks.join(' '),
      userName: req.session.userName,
      remaining: req.session.guessLeft
    });
    // determine if the guessed letter has already been guessed,
    // if so, return an error
  } else if (req.session.guesses.includes(req.body.guess)) {
    error = "You've guessed this letter already";
    res.render('index', {
      level: req.session.level,
      blanks: req.session.blanks.join(' '),
      remaining: req.session.guessLeft,
      userName: req.session.userName,
      word: req.session.word,
      guesses: req.session.guesses,
      error: error
    });

    // check if the guessed letter is in the letters array of the word,
    // replace the blanks with the correct letters, and add the guess,
    // to the array of guessed letters. Then run the function to,
    // determine if the correct letter caused them to win the game.
  } else if (letters.includes(req.body.guess)) {
    replaceBlanks(req);
    req.session.guesses.push(req.body.guess);
    winOrLose(res, req);
    // because the guess was incorrect, subtract a guess from,
    // the guesses remaining. Check to see if this caused them to,
    // lose the game.
  } else {
    req.session.guesses.push(req.body.guess);
    req.session.guessLeft = req.session.guessLeft - 1;
    winOrLose(res, req);
  }

});

//  process the request to start a new game. reset session info, but keep,
// name stored. Redirect to the root page.
app.post('/restart', (req, res) => {
  req.session.guesses = [];
  req.session.guessLeft = 8;
  req.session.word = words[Math.floor(Math.random() * words.length)];
  word = req.session.word;
  req.session.letters = word.split('');
  letters = req.session.letters;
  req.session.blanks = Array(letters.length).fill('_');
  console.log(word);
  res.redirect('/');
});

// function that replaces the blanks on the page with the correct letter
function replaceBlanks(req) {
  for (let i = 0; i < req.session.blanks.length; i++) {
    if (req.body.guess === letters[i]) {
      req.session.blanks[i] = letters[i];
    }

  };
}

// function that checks whether you've won or lost the game
function winOrLose(res, req) {
  if (req.session.blanks.join('') === req.session.letters.join('')) {
    res.render('youwin', {
      word: req.session.word,
      userName: req.session.userName
    });
  } else if (req.session.guessLeft === 0) {
    res.render('youlose', {
      word: req.session.word,
      userName: req.session.userName
    });
  } else {
    res.redirect('/');
  }
}

//select random word based on level selected.
// function selectWord(req) {
//   console.log(req.session.level);
//   if (req.session.level === "easy") {
//     let word = easyWords[Math.floor(Math.random() * words.length)];
//     return word;
//   } else if (req.session.level === "medium") {
//     let word = mediumWords[Math.floor(Math.random() * words.length)];
//     return word;
//   } else if (req.session.level === "hard") {
//       let word = hardWords[Math.floor(Math.random() * words.length)];
//       return word;
//   } else {
//     return;
//   }
// }

app.listen(3000);
