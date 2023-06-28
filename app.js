require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


const password = process.env.PASSWORD;
mongoose.connect(`mongodb+srv://nishujangra27:${password}@cluster0.bwi1a0u.mongodb.net/?retryWrites=true&w=majority`)

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

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

app.get('/forme',(req,res)=>{
    User.find().then((users)=>{
        res.send(users);
    }).catch((err)=>{
        res.send(err);
    })
});



app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save().then(() => {
        res.render('secrets');
    }).catch((err) => {
        res.send(err);
    });
});


app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

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