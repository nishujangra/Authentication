require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require('md5');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/secrets', (req, res) => {
    res.render('secrets')
});

app.get('/submit', (req, res) => {
    res.render('submit')
});


app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save().then(() => {
        res.render('secrets');
    }).catch((err) => {
        res.send(err);
    });
});


app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}).then((foundUser) => {     
        if(foundUser){
            if(foundUser.password === password){
                res.render('secrets');
            }else{
                res.send('Password is incorrect');
            }
        }else{
            res.send('User not found');
        }
    }).catch((err) => {
        console.log(err);
    })
});


app.listen(port, () => {
    console.log(`My server is running at http://localhost:${port}`);
});