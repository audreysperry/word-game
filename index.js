const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fs = require('fs');


const app = express();


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


// middleware
app.use(session({
  secret: "somethingsecretive",
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());

app.use((req, res, next) => {
  if (!req.session.guesses) {
    req.session.guesses = [];
  }
  if (!req.session.newGame) {
  req.session.NewGame = true;
  }
  if (!req.session.guessLeft) {
    req.session.guessLeft = 8;
  }
  next();
});


const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

function pickAWord () {
  let selectedWord = words[Math.floor(Math.random()*words.length)];
  return selectedWord;
}

let word = pickAWord();
let letters = word.split('');
let blanks = Array(letters.length).fill('_').join(' ');
console.log(blanks);


app.get('/', (req, res) => {
  console.log(req);
  req.session.word = word;
  res.render('index', {blanks: blanks, remaining: req.session.guessLeft, newGame: req.session.newGame, word: req.session.word, guesses: req.session.guesses});
});

app.post('/userName', (req, res) => {
  req.session.newGame = req.body.newGame;
  res.redirect('/');
});



app.post('/', (req, res) => {
  req.checkBody("guess", "Please enter one character at a time").
  req.session.guesses.push(req.body.guess);
  res.render('index', {guesses: req.session.guesses, blanks: blanks, newGame: req.session.newGame, remaining: req.session.guessLeft});
});


app.listen(3000);
