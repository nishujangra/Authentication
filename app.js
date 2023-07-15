require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(`mongodb+srv://${process.env.ID}:${process.env.PASSWORD}@cluster0.bwi1a0u.mongodb.net/?retryWrites=true&w=majority`)


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id).then((user) => {
        done(null, user);
    }).catch((err) => {
        console.log(err);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" // for google plus deprecation
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));



app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/auth/google',(req, res) => {
    passport.authenticate("google", { scope: ["profile"] });
});

app.get('/auth/google/secrets',(req, res) => {
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    }
});

app.get('/secrets', (req, res) => {
    User.find({"secret": {$ne: null} }).then((foundUsers) => {
        if(foundUsers){
            res.render('secrets', {usersWithSecrets: foundUsers});
        }
    }).catch((err) => {
        console.log(err);
    });
});

app.get('/submit', (req, res) => {
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }
});

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id).then((foundUser) => {
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save().then(() => {
                res.redirect('/secrets');
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});


app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password).then((user) => {
        passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        });
    }).catch((err) => {
        console.log(err);
        res.redirect('/register');
    });

    // bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });

    //     newUser.save().then(() => {
    //         res.render('secrets');
    //     }).catch((err) => {
    //         res.send(err);
    //     });
    // }).catch((err) => {
    //     console.log(err);
    // });

    // const newUser = new User({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });

    // newUser.save().then(() => {
    //     res.render('secrets');
    // }).catch((err) => {
    //     res.send(err);
    // });
});


app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });



    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}).then((foundUser) => {     
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password).then((result) => {
    //             if(result === true){
    //                 res.render('secrets');
    //             }else{
    //                 res.send('Password is incorrect');
    //             }
    //         }).catch((err) => {
    //             console.log(err);
    //         });
    //     }else{
    //         res.send('User not found');
    //     }
    // }).catch((err) => {
    //     console.log(err);
    // })
});


app.listen(port, () => {
    console.log(`My server is running at http://localhost:${port}`);
});