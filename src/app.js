
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');	//TODO: switch to mongodb session store
const mongoose = require('mongoose');
require('./db.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const http = require('http');
const https = require('https');
const {google} = require('googleapis');

var passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;



// const {google} = require('googleapis');
// const calendar = google.calendar('v3');
app.use(passport.initialize());
const sessionOptions = { 
    secret: 'ballroomConnectIsTrash', 
    saveUninitialized: false, 
    resave: false 
};

app.use(session(sessionOptions));
app.use(passport.session());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '/public')));


//use of passport based on instruction at: http://www.passportjs.org/docs/google/

	const fn = path.join(__dirname, '../config.json');
    const data = fs.readFileSync(fn);
   	const conf = JSON.parse(data);

//console.log("client ID: "+conf.GOOGLE_CLIENT_ID+" secret: "+conf.GOOGLE_CLIENT_SECRET);

passport.serializeUser(function(user, done) {
  	done(null, user.id);
});


//query database, TODO: check if it is a teacher or student
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
    	done(err, user);
  	});

});



const options = {
    clientID: conf.GOOGLE_CLIENT_ID,
    clientSecret: conf.GOOGLE_CLIENT_SECRET,
    callbackURL: conf.CALLBACK_URL

}

let USER_PROFILE;	//google profile
let ACCESS_TOKEN;
let REFRESH_TOKEN;
let USER_TYPE;
const TOKEN_PATH = 'token.json';
let SCOPES = ['https://www.googleapis.com/auth/plus.login','https://www.google.com/calendar/feeds','https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.events'];

let oAuth2Client;

let USER_ENTRY;		//mongo db User object profile

passport.use(new GoogleStrategy(options,
  function(accessToken, refreshToken, profile, done) {
  		//console.log("Google login info: ");
  		//console.log({accessToken, refreshToken, profile});
  	ACCESS_TOKEN  = accessToken;
  	REFRESH_TOKEN = refreshToken;
  	oAuth2Client = new google.auth.OAuth2(options[0],options[1], options[2]);
	//console.log(ACCESS_TOKEN)

	let tokens = {
		"access_token":accessToken,
		"refresh_token":refreshToken,
		"scope":'https://www.googleapis.com/auth/calendar',
		"token_type":"Bearer"//expiry_date left out
	}

	//console.log("tokens: ");
	//console.log(tokens);
	oAuth2Client.setCredentials(tokens);

  	Student.findOne({googleId: profile.id }, function (err, user) {
      if(!user) {
      	//keep in mind that err and user are overriden below
      	Teacher.findOne({googleId: profile.id}, function(err, user){
      		if(!user){	//not registered, the button does allow the user to log in to google account and now they can assign it into user entry
      			USER_PROFILE = profile;
      			return done(err, user);
      		}
      		else{
      			USER_PROFILE = profile;
		      	USER_TYPE = "teacher";
		      	USER_ENTRY = user;		//TODO: make this more secure so it is not just a plain text user entry option, maybe hash it like req.session
        		return done(err, user);
      		}

      	});
       	
	
      } else {

      	//console.log("registered student user found");
      	USER_PROFILE = profile;
      	USER_TYPE = "student";
		
      	USER_ENTRY = user;		//TODO: make this more secure so it is not just a plain text user entry option, maybe hash it like req.session
        return done(err, user);
      }
    });
  }
));




app.get('/auth/google',passport.authenticate('google', { scope: SCOPES }));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/' }),function(req,res){
  	res.redirect('/browse');
});   

//attempt to implement google calendar, this would list out the next 10 events that users have

/*
app.get('/calendar',(req,res)=>{
	listEvents(oAuth2Client);
})


function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}


function availiability(auth){
	const calendar = google.calendar({version: 'v3', auth});
}

*/
 //end of attempting to implement google calendar

app.set('view engine', 'hbs');

const Student = mongoose.model('Student');
const Teacher = mongoose.model('Teacher');
//route handlers
app.get('/', (req,res)=>{
	res.render('login');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: SCOPES }));
app.get('/auth/google/callback', 
  passport.authenticate('google', {failureRedirect: '/' }),function(req,res){
	res.redirect('/browse');
});


app.get('/logout',(req,res)=>{
//  clear session stored user and implement usage of this
	req.session.destroy();
	res.redirect('/');
 });


app.post('/login',(req,res)=>{
	let errormsg = "";
	if(req.body.type == "teacher"){
		let user = Teacher.findOne({username : req.body.username},(err, user)=>{
			if(err){
				console.log(err);
				errormsg = " *username not found";
				res.render('login', {errormsg});
			}else{
				bcrypt.compare(req.body.password, user.password, function(err,result){
				if(err){
					errormsg = " *system error";
					res.render('login',{errormsg});
				}
				else if(result == false){
					errormsg = " *username and password does not match";
					res.render('login',{errormsg});
				}
				else{
					req.session.user = user;		//req.session.user stores current user information
					req.session.userType =  "teacher";
					res.redirect('/browse');	//no need to pass in user here, but store user somewhere
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
				bcrypt.compare(req.body.password, user.password, function(err,result){
					if(err){
						errormsg = " *username and password does not match";
					 	res.render('login',{errormsg});
					}else{
						req.session.user = user;		//req.session.user stores current user information
						req.session.userType = "student";
						res.redirect('/browse');
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
	res.render('register-teacher',{USER_PROFILE});
});
app.get('/register-student', (req,res)=>{
	res.render('register-student',{USER_PROFILE});
});
app.post('/add-student',(req,res)=>{

	//TODO: check if username already taken

	bcrypt.hash(req.body.password, saltRounds, function(err,hash){
		const student = new Student({	
			username:req.body.username,
			password: hash,	//note: if user registered with google, they would not need password but it would be the same as google id
			headshot: req.body.headshot,	//with public folder as directory, TODO: make sure that this has to be from image/slug for each user
			styles: req.body.styles,	//here style is stored as strings because it is for reference purpose only
			profile: req.body.profile
		});


		if(USER_PROFILE){
			student.googleId= USER_PROFILE.id;
		}
		student.save((err, savedStudent)=>{
			if(err){
				console.log("error adding student");
				console.log(err);
				res.render('register-student',{errmsg:"error registering student",USER_PROFILE});
			}else{
				req.session.user = savedStudent;
				req.session.userType = "student";
				res.redirect('/browse');
			}
		});
	});


});


app.post('/add-teacher',(req,res)=>{
	//TODO: check if username already taken
		password: bcrypt.hash(req.body.password, saltRounds, function(err,hash){
			let vid_arr;
			let vid_str;

			if(req.body.youtube_vids != ""){	//not undefined or empty string
				vid_arr=req.body.youtube_vids.split(',').map((url)=>{
					return url.trim().split("v=")[1];
				});
				vid_str = vid_arr.reduce((str,id)=>{return str+","+id}).trimLeft(",");
			
			}

			
			const teacher = new Teacher({
				username:req.body.username,
				headshot: req.body.headshot,		//TODO: want to store this as binary data
				portfolio: req.body.portfolio,
				calendarId: req.body.calendar,
				password: hash,
				styles: req.body.styles,	//an array of selections
				locations: req.body.locations,
				price: req.body.price,
				profile: req.body.profile,
				youtube_vids: vid_str	//get video ids separated by comma
			});

		if(USER_PROFILE){
			teacher.googleId= USER_PROFILE.id;
			// var calendar = CalendarApp.createCalendar('Ballroom Connect');	//return Calendar object
			// //when viewing profile page, that teacher and all student are able to get calendar with:
			// //var calendars = CalendarApp.getCalendarsByName('Ballroom Connect');	//return a list of calendars of the name
			// //var schedule = calendars[0]
			// console.log('Created the calendar "%s", with the ID "%s".',
   //  		calendar.getName(), calendar.getId());
   //  		teacher.calendarId = calendar.getId();
		}


			teacher.save((err, savedTeacher)=>{
				if(err){
					res.redirect('/register-teacher',{errmsg: "error registering teacher", USER_PROFILE});
				}else{
					req.session.user = savedTeacher;
					req.session.userType = "teacher";
					res.redirect(`/profile-teacher/${req.session.user.slug}`);//send to teacher's own profile, TODO: pass in self object
				}
			});
		});


});

app.get('/me',(req,res)=>{
	//display private information: upcoming lessons and contacts
	//contact object has name, slug, and amount of lessons
	if(req.session.userType == "teacher"){
		res.render('me',{user:req.session.user,teacher:true});
	}
	else{	//student page
		res.render('me',{user:req.session.user, teacher:false});
	}

	});

app.get('/about', (req,res)=>{
	res.render('about',{user: req.session.user});
});
app.get('/profile-teacher/:teacher', (req,res)=>{

	Teacher.findOne({slug: req.params.teacher},(err, teacherObj)=>{
		if(err){
			let errstr = "entry not found";
			res.render('/browse',{errstr});
		}
		res.render('profile-teacher',{teacher: teacherObj, user: req.session.user, type: req.session.userType});

	});
});

app.get('/profile-student/:student', (req,res)=>{
	Student.findOne({slug: req.params.student},(err, studentObj)=>{
		if(err){
			let errstr = "student not found";
			res.render('/me',{errstr});
		}
		//teacherObj.portfolio = ["donnie1.jpeg","donnie2.jpeg"];
		res.render('profile-student',{student: studentObj, user: req.session.user, type: req.session.userType});

	});
});
app.get('/browse', (req,res)=>{
	if(!req.session.user){	//logged in with google and therefore was not able to access req.session
		req.session.user = USER_ENTRY;
		req.session.userType = USER_TYPE;
	}
	let isStudent = false;
	if(req.session.userType == "student"){
		isStudent = true;
	}
	let allTeachers = Teacher.find({},(err, result)=>{
		res.render('browse',{teachers: result, count:result.length,user: req.session.user, isStudent});
	});
	
});
app.get('/filter', (req,res)=>{ 	//can only choose up to one parameter to search
	Teacher.find({},(err, result)=>{	//list all teachers and do filter because the entries are arrays
		let filtered = result.filter((teacher)=>{

			if(req.query.style != "" && req.query.location != ""){
				return Array.prototype.includes.call(teacher.styles,req.query.style)&&Array.prototype.includes.call(teacher.locations,req.query.location);
			}
			else if(req.query.style != ""){
				return Array.prototype.includes.call(teacher.styles,req.query.style);
			}
			else if(req.query.location != ""){
				return Array.prototype.includes.call(teacher.locations,req.query.location);
			}
			else{		//not searching for anything
				return true;
			}
			
		});
		res.render('browse',{teachers: filtered, count: filtered.length,user: req.session.user});
	});
	
});

//TODO: register certification with let's encrypt and activate the following code:

// const certOptions = {
// 	key: fs.readFileSync(__dirname+'/ssl/server.pem');
// 	cert: fs.recd adFileSync(__dirname+'/ssl/server.crt');
// }

// https.createServer(certOptions,app).listen(app.get('port'));

const PORT = 18613;
app.listen(process.env.PORT || 3000);

//app.listen(3000);
