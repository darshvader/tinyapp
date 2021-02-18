const userFunctions = require('./helpers/userFunctions.js');
const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb']
}))
const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};
//response for homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});
//response for /urls.json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//response for /urls
app.get("/urls", (req, res) => {

  const id = req.session.user_id;
  const currentUser = userFunctions.findUser(id, users);
  const userURLs = userFunctions.urlsForUser(id, urlDatabase);
  const templateVars = {
    urls: userURLs,
    user: currentUser
    // ... any other vars
  };

  res.render("urls_index", templateVars);
});
//response for /hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//response for /urls/new
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  if (id) {
    const currentUser = userFunctions.findUser(id, users);
    //const currentUser = userFunctions.
    const templateVars = {
      user: currentUser
      // ... any other vars
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }

});
//response for /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  //console.log(urlDatabase);
  const id = req.session.user_id;
  const currentUser = userFunctions.findUser(id, users);
  const templateVars = {
    user: currentUser,
    currentID: id,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    URLuser: urlDatabase[req.params.shortURL]["userID"]
    // ... any other vars
  };
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
  const id = req.session.user_id;
  const currentUser = userFunctions.findUser(id, users);
  //const currentUser = userFunctions.
  const templateVars = {
    user: currentUser
    // ... any other vars
  };
  let shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
});
//response for /register
app.get("/form", (req, res) => {
  const id = req.session.user_id;
  const currentUser = userFunctions.findUser(id, users);
  //const currentUser = userFunctions.
  const templateVars = {
    user: currentUser
    // ... any other vars
  };
  res.render('form', templateVars);
});
app.get("/login", (req, res) => {
  const id = req.session.user_id;
  const currentUser = userFunctions.findUser(id, users);
  //const currentUser = userFunctions.
  const templateVars = {
    user: currentUser
    // ... any other vars
  };
  console.log(users)
  res.render('loginForm', templateVars);
});
app.post("/urls", (req, res) => {
  const id = req.session.user_id;
  if (!id) {
    res.statusMessage('Not logged in');
    res.redirect('/url');
  } else if (id !== urlDatabase[req.params.shortURL].userID) {
    res.statusMessage('Not owner');
    res.redirect('/url');
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect('/urls/' + shortURL);
  }
});
//post request to delete
app.post('/urls/:shortURL/delete', (req, res) => {
  const id = req.session.user_id;
  if (!id) {
    res.status(400);
    res.redirect('/url');
  } else if (id !== urlDatabase[req.params.shortURL].userID) {
    res.status(400);
    res.redirect('/url');
  } else {
    console.log("DELETE ROUTE HAS BEEN HIT");
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});
//post request to edit
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect('/urls/' + shortURL);
});
app.post('/urls/:shortURL/replaceURL', (req, res) => {
  console.log("Edit ROUTE HAS BEEN HIT");
  const longURL = req.body.urlBox;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("Email or password cannot be empty.");
  }
  const { user, error } = userFunctions.validateUser(email, password, users);
  console.log(user, error);
  if (user) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else if (error === 'email') {
    res.status(403)
    res.send("Email not registered");
  } else if (error === 'password') {
    res.status(403)
    res.send("Password does not match");
  }
});
//post request to register
app.post('/register', (req, res) => {
  const tempID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10); 
  if (email === "" || password === "") {
    res.status(400);
    res.send("Email or password cannot be empty.");
  }
  else if (userFunctions.findUserEmail(email, users)) {
    res.status(400);
    res.send("Email already registered as a user.");

    // console.log(users);

  }
  else {
    users[tempID] = {
      id: tempID,
      email: email,
      password: hashedPassword
    };
    req.session.user_id = tempID;
  }
  console.log(users)
  res.redirect('/urls');
});
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});
//error handler
app.use(function (req, res, next) {
  res.status(404);
  res.send("404 Error!");
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//comment new
