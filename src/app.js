
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
	res.render('browse');
	let allTeachers = Teacher.find({},(err, result, count)=>{		//TODO: stuck on trying to load teachers
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
  $(".data").css("display","inline-block"); //TODO: fix this so that it appears on the same line as title but to the side
  $("#pic").attr('src',profile.getImageUrl());
  $("#email").text(profile.getEmail())
}


app.listen(3000);
