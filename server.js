var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var flash = require('express-flash');
var path = require('path');
var session = require('express-session');
var bcrypt = require('bcrypt');

app.use(session({
    secret: "secretkey", 
    resave: false, 
    saveUnitialized: true,
    cookie:{maxAge: 60000}
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, './static')));
app.use(flash());

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost/login_register_authentication');
mongoose.Promise = global.Promise;

var fromFuture = function(birthday){
    return birthday < Date.now();
};
var UserSchema = new mongoose.Schema({
    first_name: {type: String, required:[true, "First name is required."], minlength: 2, maxlength: 45},
    last_name: {type: String, required:[true, "Last name is required."], minlength: 2, maxlength: 45},
    email: {type: String, trim:true, lowercase:true, unique:true, required:"Email address is required",
    match: [/^\w+(\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill in a valid email address"]},
    password: {type: String, required:[true, "A password is required."], minlength: 5, maxlength: 255},
    birthday: {type: Date, required:[true, "A birthday is required."], validate: [fromFuture, "Birthday must not be in the future."]}
    },
    {timestamps: true}
);

mongoose.model('User', UserSchema);
var User = mongoose.model('User');

app.get('/', function(req, res){
    res.render('login_registration');
});

app.post('/register', function(req, res){
    if(req.body.password < 8 || req.body.password != req.body.c_pw){
        console.log("Password does not match or is less than or equal to 8");
    } else if(req.body.password < 8 || req.body.password == req.body.c_pw){
        var hashed_password = bcrypt.hash(req.body.password, 8)
        .then(hashed_password => {
            var user = new User({first_name: req.body.first_name, last_name: req.body.last_name, birthday: req.body.birthday, email: req.body.email, password: hashed_password, c_pw:req.body.c_pw});
            user.save(function(err){
                if(err){
                    console.log('something went wrong', err);
                    for (var key in err.errors){
                        req.flash('registration', err.errors[key].message);
                    }
                    res.redirect('/');
                } else {
                    console.log(user.first_name)
                    console.log('successfully added data!')
                    res.redirect('/dashboard')
                }
            });
        })
        .catch(error => {

        });
    }
});

// app.post('/register', function(req, res){
//     if(req.body.password < 8 || req.body.password != req.body.c_pw){
//         console.log("Password does not match or is less than or equal to 8");
//         res.redirect('/');
//     } else {
//         var hashed_password = bcrypt.hash(req.body.password, 8)
//         .then(hashed_password => {
//             var user = new User({first_name: req.body.first_name, last_name: req.body.last_name, birthday: req.body.birthday, email: req.body.email, password: hashed_password, c_pw:req.body.c_pw});
//             console.log(user.first_name)
//             user.save(function(err){
//                 if(err){
//                     console.log('something went wrong', err);
//                     for (var key in err.errors){
//                         req.flash('registration', err.errors[key].message);
//                     }
//                     res.redirect('/');
//                 } else {
//                     console.log('successfully added data!')
//                     res.redirect('/dashboard')
//                 }
//             });
//         })
//         .catch(error => {

//         });
//     }
// });

app.post('/login', function(req, res){
    User.findOne({email: req.body.email}, function(err, data){
        bcrypt.compare(req.body.password, data.password, function(err, valid){
            if (err){
                console.log(err);
            } else if (valid == false) {
                res.redirect('/')
            } else {
                res.redirect('/dashboard')
            }
        })
    })
})


app.get('/dashboard', function(req, res){
    res.render('dashboard');
});

app.listen(8000, function(){
    console.log('listening on port 8000');
});