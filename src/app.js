
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
require('./db.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// const {google} = require('googleapis');
// const calendar = google.calendar('v3');


const sessionOptions = { 
    secret: 'ballroomConnectIsTrash', 
    saveUninitialized: false, 
    resave: false 
};

app.use(session(sessionOptions));
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'hbs');

const Student = mongoose.model('Student');
const Teacher = mongoose.model('Teacher');
//route handlers
app.get('/', (req,res)=>{
	res.render('login');
});



app.post('/login',(req,res)=>{
	let errormsg = "";
	if(req.body.type == "teacher"){
		let user = Teacher.findOne({username : req.body.username},(err, user)=>{
			if(err){
				errormsg = " *username not found";
				res.render('login', {errormsg});
			}else{

				// if(user.password == hash(req.body.password+user.salt)){
				// 	res.render('profile-teacher',{teacher: user});
				// }
				// else{
				// 	errormsg = " *username and password does not match";
				// 	res.render('login',{errormsg});
				// }
				bcrypt.compare(req.body.password, user.password, function(err,result){
				if(err){
					errormsg = " *username and password does not match";
					res.render('login',{errormsg});
				}else{
					req.session.user = result;		//req.session.user stores current user information
					req.session.userType =  "teacher";
					res.render('browse');
				}
				});
			}
		});
	}
	else if(req.body.type == "student"){
		let user = Student.findOne({username : req.body.username},(err, user)=>{
			if(err){
				errormsg = " *username not found";
				res.render('login', {errormsg});
			}else{
				// if(user.password == hash(req.body.password+user.salt)){
				// 	res.render('browse');
				// }
				// else{
				// 	errormsg = " *username and password does not match";
				// 	res.render('login',{errormsg});
				// }
				bcrypt.compare(req.body.password, user.password, function(err,result){
					if(err){
						errormsg = " *username and password does not match";
					 	res.render('login',{errormsg});
					}else{
						req.session.user = result;		//req.session.user stores current user information
						req.session.userType = "student";
						res.render('browse');
					}
				});
				
			}
		});
	}
	else{
		errormsg = " *choose either teacher or student";
		res.render('login', {errormsg});
	}

	
	
});
app.get('/register-teacher', (req,res)=>{
	res.render('register-teacher');
});
app.get('/register-student', (req,res)=>{
	res.render('register-student');
});
app.post('/add-student',(req,res)=>{
	//TODO: check if username already taken


	bcrypt.hash(req.body.password, saltRounds, function(err,hash){
		const student = new Student({	
			username:req.body.username,
			password: hash,
			headshot: req.body.headshot,
			styles: req.body.styles,	//here style is stored as strings because it is for reference purpose only
			profile: req.body.profile
		});
		student.save((err, savedStudent)=>{
			if(err){
				console.log(err);
				res.send(err);
				res.redirect('/register-student');
			}else{
				res.redirect('/browse');
			}
		});
	});


});

app.post('/add-teacher',(req,res)=>{
	//TODO: check if username already taken
	
		//salt: crypto.randomBytes(16).toString('hex'),
		//password: hash(req.body.password+salt),
		password: bcrypt.hash(req.body.password, saltRounds, function(err,hash){
			const teacher = new Teacher({	
				username:req.body.username,portfolio: req.body.headshot,	//TODO: profile photo is supposed to be the first one in portfolio
				password: hash,
				styles: req.body.styles,	//an array of selections
				locations: req.body.locations,
				price: req.body.price,
				profile: req.body.profile
			});
			teacher.save((err, savedTeacher)=>{
				if(err){
					console.log(err);
					res.send(err);
					res.redirect('/register-teacher');
				}else{
					res.redirect('/teacher-profile', {teacher: savedTeacher});//send to teacher's own profile, TODO: pass in self object
				}
			});
		});


});


app.get('/about', (req,res)=>{
	res.render('about');
});
app.get('/profile-teacher', (req,res)=>{
	res.render('profile-teacher');
});
app.get('/profile-student', (req,res)=>{
	res.render('profile-student');
});
app.get('/browse', (req,res)=>{
	let allTeachers = Teacher.find({},(err, result, count)=>{
		res.render('browse',{teachers: result, count:count});
	});
	
});
app.get('/filter', (req,res)=>{
	let filtered = Teacher.find({},(err, result, count)=>{
		let found = result.filter((teacher)=>{teacher.styles.contains(req.query.style)||teacher.locations.contains(req.query.location)});
		res.render('browse',{teachers: found, count:found.length});
	});
	
});
app.get('/contact', (req,res)=>{
	//access user's contacts
	res.render('contact');
});
app.get('/upcoming-lessons', (req,res)=>{
	//access user's upcoming-lesson
	res.render('upcoming-lessons');
});


function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();	//TODO: have if statement, determine type of user and send to appropriate starting page
  var xhr = new XMLHttpRequest();
	xhr.open('POST', '/ browse/tokensignin');	//this is for student, do one for teacher directing to their own profile page
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
 	 console.log('Signed in as: ' + xhr.responseText);
	};
	xhr.send('idtoken=' + id_token);
  var id_token = googleUser.getAuthResponse().id_token;
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
}

//check out https://developers.google.com/identity/sign-in/web/backend-auth for validating google ID token in a production environment
//varifying w/ get request for tomen "XYZ123": https://oauth2.googleapis.com/tokeninfo?id_token=XYZ123
// example for varifying token: 
// const {OAuth2Client} = require('google-auth-library');
// const client = new OAuth2Client(CLIENT_ID);
// async function verify() {
//   const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//       // Or, if multiple clients access the backend:
//       //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
//   });
//   const payload = ticket.getPayload();
//   const userid = payload['sub'];
//   // If request specified a G Suite domain:
//   //const domain = payload['hd'];
// }
// verify().catch(console.error);



// response body of 200 after varification has usable user info in json:
//{
 // These six fields are included in all Google ID Tokens.
//  "iss": "https://accounts.google.com",
//  "sub": "110169484474386276334",
//  "azp": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
//  "aud": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
//  "iat": "1433978353",
//  "exp": "1433981953",

//  // These seven fields are only included when the user has granted the "profile" and
//  // "email" OAuth scopes to the application.
//  "email": "testuser@gmail.com",
//  "email_verified": "true",
//  "name" : "Test User",
//  "picture": "https://lh4.googleusercontent.com/-kYgzyAWpZzJ/ABCDEFGHI/AAAJKLMNOP/tIXL9Ir44LE/s99-c/photo.jpg",
//  "given_name": "Test",
//  "family_name": "User",
//  "locale": "en"
// }


function signOut() {	//TODO: redirect to log in page
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}




app.listen(3000);
