const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');
var moment = require('moment');

router.get('/', loginCheck, (req, res) => {

    db.query(`SELECT * FROM tasks WHERE userId=?`, [req.session.user.id], (err, results) => {

        if (err){
            console.log(err);
            req.session.error = 'Adatbázis hiba!';
            req.session.severity = 'danger';
            return res.redirect('/tasks');  
        }

        results.forEach(item => {
            item.start = moment(item.start).format('YYYY-MM-DD');
            item.end = moment(item.end).format('YYYY-MM-DD');
        });

        ejs.renderFile('./views/tasks.ejs', { session: req.session, results }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = null;
            res.send(html);
        });

    });
   
});

router.get('/calendar', loginCheck, (req, res) => {

    let calEvents = [];

    db.query(`SELECT * FROM tasks WHERE userId=?`, [req.session.user.id], (err, results) => {

        if (err){
            console.log(err);
            req.session.error = 'Adatbázis hiba!';
            req.session.severity = 'danger';
            return res.redirect('/tasks');  
        }
    
        results.forEach(item => {
            calEvents.push({
                    title   : item.title,
                    start   : moment(item.start).format('YYYY-MM-DD'),
                    end     : moment(item.end).format('YYYY-MM-DD')
            });
        });
        
        ejs.renderFile('./views/calendar.ejs', { session: req.session, calEvents }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = null;
            res.send(html);
        });

    });


   

});

function loginCheck(req, res, next){
    if (req.session.user){
        return next();
    }
    return res.redirect('/users/login');
}

module.exports = router;