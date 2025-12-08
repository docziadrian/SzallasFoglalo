const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');
const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// GET login FORM
router.get('/login', (req, res) => {
    ejs.renderFile('./views/login.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err);
            return
        }
        req.session.error = '';
        req.session.body = null;
        res.send(html);
    });
});

// POST login data
router.post('/login', (req, res) => {
    let { email, password } = req.body;
    
    req.session.body = req.body;

    if (email == '' || password == '') {
        req.session.error = 'Nem adtál meg minden adatot!';
        req.session.severity = 'danger';
        return res.redirect('/users/login');
    }

    db.query(`SELECT * FROM users WHERE email=? AND password=SHA1(?)`, [email, password], (err, results) => {
        if (err){
            console.log(err);
            req.session.error = 'Adatbázis hiba!';
            req.session.severity = 'danger';
            return res.redirect('/users/login');  
        }

        if (results.length == 0){
            req.session.error = 'Hibás belépési adatok!';
            req.session.severity = 'danger';
            return res.redirect('/users/login');  
        }

        req.session.user = results[0];
        res.redirect('/tasks');
    });

});

// GET registrartion FORM
router.get('/registration', (req, res) => {
    ejs.renderFile('./views/registration.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err);
            return
        }
        req.session.error = '';
        req.session.body = null;
        res.send(html);
    });
});

// POST registrartion data
router.post('/registration', (req, res) => {
    let { name, email, password, confirm } = req.body;
    
    req.session.body = req.body;

    if (name == '' || email == '' || password == '' || confirm == '') {
        req.session.error = 'Nem adtál meg minden adatot!';
        req.session.severity = 'danger';
        return res.redirect('/users/registration');
    }

    if (password != confirm) {
        req.session.error = 'A megadott jelszavak nem egyeznek!';
        req.session.severity = 'danger';
        return res.redirect('/users/registration');
    }

    if (!password.match(passwdRegExp)) {
        req.session.error = 'A megadott jelszó nem elég biztonságos!';
        req.session.severity = 'danger';
        return res.redirect('/users/registration');
    }

    db.query(`SELECT * FROM users WHERE email=?`, [email], (err, results) => {
        
        if (err){
            console.log(err);
            req.session.error = 'Adatbázis hiba!';
            req.session.severity = 'danger';
            return res.redirect('/users/registration');  
        }

        if (results.length != 0){
            req.session.error = 'Ez az e-mail cím már regisztrált!';
            req.session.severity = 'danger';
            return res.redirect('/users/registration');  
        }

        db.query(`INSERT INTO users (name, email, password) VALUES(?,?,SHA1(?))`, [name, email, password], (err, results) => {
           
            if (err){
                console.log(err);
                req.session.error = 'Adatbázis hiba!';
                req.session.severity = 'danger';
                return res.redirect('/users/registration');  
            }

            req.session.error = 'Sikeres regisztráció! Bejelentkezhet!';
            req.session.severity = 'success';
            return res.redirect('/users/login'); 

        });

    });

});

// GET logout 
router.get('/logout', (req, res) => {
    req.session.user = null;
    res.redirect('/users/login');
});

module.exports = router;