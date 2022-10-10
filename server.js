const uri = "mongodb+srv://katie:Pineapple55@project.pgudc.mongodb.net/mydb?retryWrites=true&w=majority";
const uri2 = "mongodb+srv://katie:Pineapple55@project.pgudc.mongodb.net/Accounts?retryWrites=true&w=majority"

const DB_NAME = "mydb"; 
const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");
var mongoose = require('mongoose');
const bodyParser = require("body-parser"); 
var ObjectId = require("mongodb").ObjectId; 
const sanitize = require("mongo-sanitize");
const Validator = require("validatorjs");

app.use('/assets', express.static('assets'));
app.set("view engine", "ejs");

const mongooseDB = mongoose.connection;
mongooseDB.on("error", console.error.bind(console, "Mongoose DB Connection error: "));

const PORT = process.env.PORT || 8080; 
app.listen(PORT, function () {
    console.log("Server listening on port " + PORT);
});


//User schema
var UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

// password hash
UserSchema.pre('save', function (next) {
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    })
});

//Method to authenticate input against database
UserSchema.statics.authenticate = function (userData, req, res) {
    User.findOne({
        username: userData.username
    })
        .exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                //error
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            bcrypt.compare(userData.password, user.password, function (err, result) {
                if (result === true) { //password hashes match
                    //set up session cookie
                    req.session.userId = user._id;
                    req.session.userName = user.firstname;
                    return res.render("menu.ejs", {
                        userFirstName: req.session.userName
                    });
                } else {
                    return res.redirect("/login");
                }
            })
        });
}

var User = mongoose.model('User', UserSchema);
module.exports = User;

//session configuration
const session = require('express-session');
//use sessions for tracking logins
app.use(session({
    secret: "This is a secret string that should be stored in an environment variable!",
    resave: true,
    saveUninitialized: false
}));

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connect(uri2, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

client.connect(err => {
    dbMood = client.db(DB_NAME).collection("moodEntry");
});

client.connect(err => {
    dbJoke = client.db(DB_NAME).collection("jokeCollection");
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.urlencoded({
    extended: true
}));

// If logged in go to menu. If not go to login page.
app.get("/", (req, res) => {
    if (req.session.userId) {
        //authenticate        
        validateSession(req.session.userId, res);
        res.redirect("/menu");
    } else {
        return res.redirect("/login");
    }
});

// Create New Entry
app.get("/create", (req, res) => {
    if (req.session.userId) {
        validateSession(req.session.userId, res);
        res.render("create.ejs");
    } else {
        return res.redirect("/login");
    }
});

// Create moodEntry
app.post("/show", (req, res) => {
    req.body.user = req.session.userId;
    dbMood.insertOne(
        (req.body)
        ,(err, result) => {
        if (err) return console.log("Error: " + err);
        console.log("Successfully saved to the database!");
        res.redirect("/show");
    });
});

// Show all entries if logged in. 
app.get("/show", (req, res) => {
    if (req.session.userId) {
        //authenticate        
        validateSession(req.session.userId, res);
        dbMood.find({user: req.session.userId}).toArray((err, results) => {
            console.log(results);
            if (err) return console.log("Error: " + err);
            res.render("show.ejs", {
                moodEntry: results
            });
        });
    } else { //no session data, log in first
        return res.redirect("/login");
    }
});

app.get("/menu", (req, res) => {
    return res.render("menu.ejs", {
        userFirstName: req.session.userName
    });
});

app.get("/joke", (req, res) => {
    var numJokes = 5
    var randNum = Math.floor(Math.random() * numJokes) + 1;

    dbJoke.find({number : randNum}).toArray((err, results) => {
        console.log(results);
        if (err) return console.log("Error: " + err);
        res.render("joke.ejs", {
            jokeCollection: results,
            userFirstName: req.session.userName
        });
    });
});

app.post("/joke/:id", (req, res) => {
    let id = req.params.id

    let favJokeChecked = req.body.favjoke;
    console.log(favJokeChecked);
    if (favJokeChecked) {
        favJokeChecked = true;
        console.log(favJokeChecked);
    } else {
        favJokeChecked = false;
        console.log(favJokeChecked);
    }

    dbJoke.updateOne(
        {
            _id: ObjectId(id)
        }, 
        {
            $set: {
                favorite: favJokeChecked
            }
        }, (err, result) => {
            if (err) return res.send(err);
            console.log("Successfully Updated!");
        }
    )
});

app.get("/favjoke",  (req, res) => {
    dbJoke.find({favorite : true}).toArray((err, results) => {
        if (err) return console.log("Error: " + err);
        res.render("favjoke.ejs", {
            jokeCollection: results
        });
    })
});

// Create a new user
app.route("/register")
    .get((req, res) => {
        let errors = {
            usernameError: ""
        }
        res.render("register.ejs", errors);
    })
    .post((req, res) => {
        if (req.body.firstname &&
            req.body.lastname &&
            req.body.username &&
            req.body.password &&
            req.body.passwordConf) {
            var userData = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                username: req.body.username,
                password: req.body.password,
            }
            
            User.create(userData, function (err, user) {
                if (err) {
                    //return next(err)
                    let errors = {
                        usernameError: "Invalid username"
                    }
                    res.render("register.ejs", errors);
                } else {
                    return res.redirect("/menu");
                }
            });
        }
    });

app.route("/login")
    .get((req, res) => {
        let errors = {
            usernameError: ""
        }
        res.render("login.ejs", errors);
    })
    .post((req, res) => {
        if (req.body.username &&
            req.body.password) {
            var userData = {
                username: req.body.username,
                password: req.body.password,
            }
            let temp = User.authenticate(userData, req, res);
            let temp2 = 0;
        }
    });

function validateSession(_id, res) {
    if (_id != "") {
        //authenticate
        User.findOne({
            _id: _id
        }).exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                //error
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            return;
        });

    } else {
        //redirect to log in
        return res.redirect("/login");
    }
};

app.get('/logout', function (req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});
