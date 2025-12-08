const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');

router.get('/', (req, res) => {
    ejs.renderFile('./views/index.ejs', { session: req.session }, (err, html)=>{
        if (err){
            console.log(err);
            return
        }
        console.log(req.session.user)
        req.session.error = '';
        res.send(html);
    });
});

module.exports = router;