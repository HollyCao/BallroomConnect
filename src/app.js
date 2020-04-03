
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
require('./db.js');

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
app.get('/register-teacher', (req,res)=>{
	res.render('register-teacher');
});
app.get('/register-student', (req,res)=>{
	res.render('register-student');
});
app.post('/add-student',(req,res)=>{
	const student = new Student({	
		username:req.body.username,
		password: req.body.password,
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

app.post('/add-teacher',(req,res)=>{
	const teacher = new Teacher({	
		username:req.body.username,
		password: req.body.password,
		portfolio: req.body.headshot,	//TODO: profile photo is supposed to be the first one in portfolio
		styles: req.body.styles,	//an array of selections
		locations: req.body.locations,
		profile: req.body.profile
	});

	student.save((err, savedTeacher)=>{
		if(err){
			console.log(err);
			res.send(err);
			res.redirect('/register-teacher');
		}else{
			res.redirect('/teacher-profile', {teacher: savedTeacher});//send to teacher's own profile, TODO: pass in self object
		}
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
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
}





app.listen(3000);
