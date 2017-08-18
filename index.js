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

app.use((req, res, next) => {
  if (req.session.word) {
    return next();

  } else {
    req.session.guesses = [];
    req.session.guessLeft = 8;
    req.session.word = words[Math.floor(Math.random() * words.length)];
    word = req.session.word;
    req.session.letters = word.split('');
    letters = req.session.letters;
    req.session.blanks = Array(letters.length).fill('_');

  }
  next();
});


const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");


app.get('/', (req, res) => {
  res.render('index', {
    blanks: req.session.blanks.join(' '),
    remaining: req.session.guessLeft,
    newGame: req.session.newGame,
    word: req.session.word,
    guesses: req.session.guesses
  });
});

app.post('/userName', (req, res) => {
  req.session.newGame = req.body.newGame;
  res.redirect('/');
});

app.post('/guesses', (req, res) => {
  req.checkBody("guess", "Please enter one character at a time").isLength(1, 1);
  let errors = req.validationErrors();
  if (errors) {
    res.render('index', {
      errors: errors,
      guesses: req.session.guesses,
      blanks: req.session.blanks.join(' '),
      newGame: req.session.newGame,
      remaining: req.session.guessLeft
    });
  } else if (req.session.guesses.includes(req.body.guess)) {
    error = "You've guessed this letter already";
    res.render('index', {
      error: error
    });

  } else if (letters.includes(req.body.guess)) {
    replaceBlanks(req);
    req.session.guesses.push(req.body.guess);
      winOrLose(res, req);
  } else {
    req.session.guesses.push(req.body.guess);
    req.session.guessLeft = req.session.guessLeft - 1;
      winOrLose(res, req);
  }

});

app.post('/restart', (req, res) => {
  req.session.guesses = [];
  req.session.guessLeft = 8;
  req.session.word = words[Math.floor(Math.random() * words.length)];
  word = req.session.word;
  req.session.letters = word.split('');
  letters = req.session.letters;
  req.session.blanks = Array(letters.length).fill('_');
})

function replaceBlanks(req) {
  for (let i = 0; i < req.session.blanks.length; i++) {
    if (req.body.guess === letters[i]) {
      req.session.blanks[i] = letters[i];
    }

  };
}

function winOrLose (res, req) {
  if (req.session.blanks.join('') === req.session.letters.join('')) {
    res.render('youwin', {word: req.session.word, newGame: req.session.newGame});
  } else if (req.session.guessLeft === 0) {
    res.render('youlose', {word: req.session.word, newGame: req.session.newGame});
  } else {
    res.redirect('/');
  }
}

app.listen(3000);
