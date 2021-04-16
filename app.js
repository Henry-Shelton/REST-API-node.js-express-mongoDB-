const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose'); //links mongodb database to web app
const bcrypt = require('bcryptjs'); //for generating password #  - NOT IN USE WITHOUT APP
const expressSession = require('express-session'); //generate individual session for user
const passport = require('passport'); //once user is logged in it stores user session locally - NOT IN USE WITHOUT APP
const localStrategy = require('passport-local').Strategy; //for login authentication
const flash = require('connect-flash');
const dotenv = require('dotenv');
dotenv.config();
const router = express.Router();
const axios = require('axios'); //for passing api data via ejs for stores

require('./models'); //adds user info/models from database
const User = mongoose.model('User'); //command to get user info/model from mongodb database
require('./models/Store'); //adds user info/models from database
const StoreData = mongoose.model('Store');

//connecting to mongodb const
const connectDB = require('./db')
connectDB();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {apiVersion: ''});

//for email enquiries
const mailGun = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer')
const sendMail = require('./public/js/mail');

//enable cors
const cors = require('cors');

//authentication session (prevent direct to /main)
const { ensureAuthenticated } = require('./auth');

//passport config
require('./passport');

const app = express();

//view engine setup (middleware - app.set/app.use)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//THIS SECTION JUST FOR EMAIL SENDING
//Data parsing for contact form
app.use(express.urlencoded({
  extended: false
}));

//expresssession
app.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

//set static folder
app.use(express.static(path.join(__dirname, 'public')))

//STRIPE WEBHOOK PARSER - extra code so doesnt interfere with express json parser
//Use body-parser to retrieve the raw body as a buffer
const bodyParser = require('body-parser');

//dependencies for contact forms - NOT IN USE WITHOUT APP

// Match the raw body to content type application/json
//WEBHOOK NEEDS TO BE UPDATED IN STRIPE FOR FINAL URL FOR SUBSCRIPTION ACTIVE TO WORK
app.post('/pay-success', bodyParser.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Fulfill the purchase...
    console.log(session);
    User.findOne({
      email: session.customer_email
    }, function(err, user) {
      if (user) {
        user.subscriptionActive = true;
        user.subscriptionId = session.subscription;
        user.customerId = session.customer;
        user.expire_at = null;
        user.save();
      }
    });
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});


app.use(logger('dev'));
app.use(express.json()); //expresses data submitted by clients into json format to the server (login/contact posts)
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//connect-flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});


//link API routes
app.use('/api/v1/stores', require('./routes/stores'));


//signup verification
//passport method using localstrategy for signup (serialize/deserialize in session) looks at form data user/pass and passes it on
passport.use('signup-local', new localStrategy({
  usernameField: "email",
  passwordField: "password"
}, function(email, password, next) {
  User.findOne({
    email: email
  }, function(err, user) {
    if (err) return next(err);
    if (user) return next({message: "This user already exists"});
    let newUser = new User({
      email: email,
      passwordHash: bcrypt.hashSync(password, 10)
    })
    newUser.save(function(err) {
      next(err, newUser);
    });
  });
}));

//login verification
//passport method using localstrategy for login
passport.use(new localStrategy({
  usernameField: "email",
  passwordField: "password"
}, function(email, password, next) {
  //check fore same emails in DB
  User.findOne({
    email: email
  }, function(err, user) {
    if (err) return next(err);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return next({message: 'Email or password incorrect'})
    }
    next(null, user);
  })
}));

//only saves id of user into session (saves memory) - PART OF LOGIN SYSTEM
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  done(null, user.id);
  // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

//rendering of different html pages for website//

//LANDING PAGE
app.get('/', function(req, res) {
  res.render('index', {title: "Langing Page"})
})

//MAP PAGE
app.get('/gyms-near-me', function(req, res) {
  res.render('gyms-near-me')
})

//GYM INFO PAGE
app.get('/gym-info', function (req, res) {
  res.render('gym-info');
});

//COMPARE PAGE
app.get('/compare', function (req, res) {
  res.render('compare');
});

//CONTACT US PAGE
app.get('/contact-us', (req, res) => {
  res.render('contact-us')
})

//WEBSITE CREDITS
app.get('/credits', (req, res) => {
  res.render('credits')
})

//CONTACT US BACKEND
app.post('/email', (req, res) => {
  //send email here
  const {name, email, subject, message} = req.body;
  console.log('Data: ', req.body);

  sendMail(name, email, subject, message, function(err) {
    if (err) {
      res.status(500).json({ message: 'Internal Error' });
    } else {
      res.json({ message: 'Email has been sent successfully'});
    }
  });
});


//SIGNUP PAGE step 1
app.get('/signup', function(req, res, next) {
  res.render('signup', {title: "Signup Page"})
});

app.post('/signup',
    passport.authenticate('signup-local', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('/main');
});

//LOGIN PAGE step 2
app.get('/login', function(req, res, next) {
  res.render('login')
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/main',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
  req.body.email
});

//LOGOUT PAGE step 3
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});

app.get('/main', ensureAuthenticated, function(req, res, next) {
// req.user should be defined here because of the ensureAuth middleware
  const id = req.user.id
  return User.findOne({ _id: id }, function (err, post) {
    if (err) { throw(err); }
    res.redirect('/main/users/' + id)
  });
});

app.get('/main/users/:id', ensureAuthenticated, function(req, res, next) {
  // req.user should be defined here because of the ensureAuth middleware
  return res.render('main', { title: req.user.email });
});


app.get('/main/users/:id/addstore', ensureAuthenticated, function(req, res, next) {
// req.user should be defined here because of the ensureAuth middleware
  const id = req.user.id
  return User.findOne({ _id: id }, function (err, post) {
    if (err) { throw(err); }
    res.redirect('/main/users/addstore/' + id)
  });
});

app.get('/main/users/addstore/:id', ensureAuthenticated, function(req, res, next) {
  axios.get('http://localhost:3000/api/v1/stores')
      .then(function(response){
        res.render('addstore', { stores : response.data, userId : req.params.id })
      });
});


app.get('/main/users/:id/viewstores', ensureAuthenticated, function(req, res, next) {
// req.user should be defined here because of the ensureAuth middleware
  const id = req.user.id
  return User.findOne({ _id: id }, function (err, post) {
    if (err) { throw(err); }
    res.redirect('/main/users/viewstores/' + id)
  });
});

app.get('/main/users/viewstores/:id', ensureAuthenticated, function(req, res, next) {
  console.log(req.params.id)

  axios.get('http://localhost:3000/api/v1/stores')
      .then(function(response){
        res.render('viewstores', { stores : response.data })
      });
});


app.get('/main/users/:id/updatestore', ensureAuthenticated, function(req, res, next) {
  axios.get('http://localhost:3000/api/v1/stores', {params:req.query.id})
      .then(function(storedata){
        res.render('updatestore', { stores:storedata.data })
      });
});

app.get('/main/users/:id/previewstores', ensureAuthenticated, function(req, res, next) {
  axios.get('http://localhost:3000/api/v1/stores')
      .then(function(response){
    res.render('previewstores', { stores:response.data })
  });
});

app.get('/billing', ensureAuthenticated, function(req, res, next) {

  stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    subscription_data: {
      items: [{
        plan: process.env.STRIPE_BASIC_PLAN,
      }],
    },
    success_url: process.env.BASE_URL + '/billing?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: process.env.BASE_URL + '/billing',
  }, function(err, session) {
    if (err) return next(err);
    res.render('billing', {STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY, sessionId: session.id, subscriptionActive: req.user.subscriptionActive})
  });
})


//TESTING PAGES
app.get('/testing', (req, res) => {
  res.render('testing')
})

app.get('/testing', (req, res) => {
  res.render('testing')
})

//ROBOTS TXT
app.use(express.static('public'))

app.use('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /");
});

app.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /");
});


//SITEMAP
app.get('/sitemap', function(req, res){
  res.contentType('application/xml');
  res.sendFile(path.join(__dirname , 'sitemap.xml'));
});

//ERROR HANDLERS
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

//change for specific errors
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {error2: err.message});
});


module.exports = app


//CHANGE IF BAD GATEWAY 502 - 3000 FOR WWW. OR 5000 FOR TESTING PURPOSES ON LOCALHOST:5000
app.listen(5000, () => {
  console.log('App listening on port 3000!');
})
