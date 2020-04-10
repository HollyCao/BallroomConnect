
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
require('./db.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');

// const {google} = require('googleapis');
// const calendar = google.calendar('v3');


const sessionOptions = { 
    secret: 'ballroomConnectIsTrash', 
    saveUninitialized: false, 
    resave: false 
};

app.use(session(sessionOptions));
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '/public')));


app.set('view engine', 'hbs');

const Student = mongoose.model('Student');
const Teacher = mongoose.model('Teacher');
//route handlers
app.get('/', (req,res)=>{
	res.render('login');
});



app.post('/login',(req,res)=>{
	let errormsg = "";
// 	//implementing google login
// 	if(req.getHeader("X-Requested-With")== null){
// 		errormsg = "Server error: no 'X-Requested-With' header";
// 		res.render("login",{errormsg});
// 	}

// 	String CLIENT_SECRET_FILE = "client_secret.json";
// 	// Exchange auth code for access token
// 	GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JacksonFactory.getDefaultInstance(), new FileReader(CLIENT_SECRET_FILE));
// 	GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
// 				new NetHttpTransport(),
// 	              JacksonFactory.getDefaultInstance(),
// 	              "https://oauth2.googleapis.com/token",
// 	              clientSecrets.getDetails().getClientId(),
// 	              clientSecrets.getDetails().getClientSecret(),
// 	              authCode,
// 	              REDIRECT_URI)  // Specify the same redirect URI that you use with your web
// 	                             // app. If you don't have a web version of your app, you can
// 	                             // specify an empty string.
// 	              .execute();

// 	String accessToken = tokenResponse.getAccessToken();
// //TODO: call calendar API
// // Get profile info from ID token
// GoogleIdToken idToken = tokenResponse.parseIdToken();
// GoogleIdToken.Payload payload = idToken.getPayload();
// String userId = payload.getSubject();  // Use this value as a key to identify a user.
// String email = payload.getEmail();
// boolean emailVerified = Boolean.valueOf(payload.getEmailVerified());
// String name = (String) payload.get("name");
// String pictureUrl = (String) payload.get("picture");
// String locale = (String) payload.get("locale");
// String familyName = (String) payload.get("family_name");
// String givenName = (String) payload.get("given_name");




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
				res.redirect('/register-student',{errmsg:err});
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
			let vid_arr = req.body.youtube_vids.split(',').map((url)=>{
				return url.trim().split("v=")[1];
			});

			let vid_str = vid_arr.reduce((str,id)=>{return str+","+id}).trimLeft(",");
			const teacher = new Teacher({	
				username:req.body.username,
				portfolio: req.body.headshot,	//TODO: profile photo is supposed to be the first one in portfolio
				password: hash,
				styles: req.body.styles,	//an array of selections
				locations: req.body.locations,
				price: req.body.price,
				profile: req.body.profile,
				youtube_vids: vid_arr	//get video ids separated by comma
			});
			teacher.save((err, savedTeacher)=>{
				if(err){
					res.redirect('/register-teacher',{errmsg: err});
				}else{
					res.redirect('/teacher-profile', {teacher: savedTeacher});//send to teacher's own profile, TODO: pass in self object
				}
			});
		});


});

app.get('/me',(req,res)=>{
	//display private information: upcoming lessons and contacts
	res.render('me',{user:req.session.user});	//TODO: pass in user for this session
});
app.get('/about', (req,res)=>{
	res.render('about');
});
app.get('/profile-teacher/:teacher', (req,res)=>{
	//TODO: how to pass teacher to here when redirect
	//res.send(req.params.teacher);



	Teacher.findOne({slug: req.params.teacher},(err, teacherObj)=>{
		if(err){
			let errstr = "entry not found";
			res.render('/browse',{errstr});
		}

		// console.log("teacher name :"+teacherObj.username);
		// console.log("read file");
		// let portfolio = teacherObj.portfolio.map((fpath)=>{		//TODO: alternatively build a directory for each user (look into hw3)
		// 	console.log("File path: "+path.join(__dirname,"/public",fpath));
		// 	let pic = fs.readFileSync(path.join(__dirname,"/public",fpath),'utf8', (err, pic)=>{
		// 		if(err){
		// 			return "error loading image";
		// 		}
		// 		else{
		// 			return pic;
		// 		}
				
		// 	});
		// 	return pic;
		// });	//read in photos from public folder

		// console.log("portfolio: "+portfolio);
		let portfolio = ["portfolio placeholder"];
		res.render('profile-teacher',{teacher: teacherObj,portfolio});

	});
});

app.get('/profile-student', (req,res)=>{
	res.render('profile-student');
});
app.get('/browse', (req,res)=>{
	let allTeachers = Teacher.find({},(err, result)=>{		//TODO: stuck on trying to load teachers
		res.render('browse',{teachers: result, count:result.length});
	});
	
});
app.get('/filter', (req,res)=>{	//can only choose up to one parameter to search
	// let filtered = Teacher.find({},(err, result, count)=>{

	// 	let found = result.filter((teacher)=>{

	// 		req.query.style.forEach()
	// 		console.log("style data type"+typeof(teacher.styles)); //an object
	// 		teacher.styles.contains(req.query.style)||teacher.locations.contains(req.query.location);
	// 	});

	// 	res.render('browse',{teachers: found, count:found.length});
	// });


	// let search = {};
	// if(req.query.style != ""){
	// 	console.log("style: "+req.query.style);
	// 	search.style = req.query.style;
	// }
	// if(req.query.location != ""){
	// 	console.log("location: "+req.query.location);
	// 	search.location = req.query.location;
	// }


	Teacher.find({},(err, result)=>{	//list all teachers and do filter because the entries are arrays
		let filtered = result.filter((teacher)=>{

			console.log("inside filter function");
			console.log(teacher.styles);
			console.log(teacher.locations);
			if(req.query.style != "" && req.query.location != ""){
				return Array.from(teacher.styles).contains(req.query.style)&&Array.from(teacher.locations).contains(req.query.location);
			}
			else if(req.query.style != ""){
				return Array.from(teacher.styles).contains(req.query.style);
			}
			else if(req.query.location != ""){
				return Array.from(teacher.locations).contains(req.query.location);
			}
			else{		//not searching for anything
				return true;
			}
			
		});
		res.render('browse',{teachers: filtered, count: filtered.length});
	});
	
});
app.get('/contact', (req,res)=>{
	//access user's contacts 
	res.render('contact');
});
app.get('/upcoming-lessons', (req,res)=>{
	//access user's upcoming-lesson
	//TODO: show student's partner or if they are looking for a partner
	//implement three-way scheduling, invite partner first before having teachers approve
	res.render('upcoming-lessons');
});



app.listen(3000);
