
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

console.log("client ID: "+conf.GOOGLE_CLIENT_ID+" secret: "+conf.GOOGLE_CLIENT_SECRET);

passport.serializeUser(function(user, done) {
  	done(null, user.id);
});


//query database, TODO: check if it is a teacher or student
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
    	done(err, user);
  	});
  // Student.findOne({googleId: id}, function(err, user) {
  // 	if(err){
  // 		Teacher.findOne({googleId: id}, function(err, user){
  // 			if(!err){
  // 				req.session.userType = "teacher";
  // 			}
  // 			done(err, user);
  // 		});
  // 	}
  // 	else{
  // 		req.session.userType = "student";
  //   	done(err, user);
  // 	}
 
  // });
});



const options = {
    clientID: conf.GOOGLE_CLIENT_ID,
    clientSecret: conf.GOOGLE_CLIENT_SECRET,
    callbackURL: conf.CALLBACK_URL

}

let USER_PROFILE;	//google profile
let ACCESS_TOKEN;
let REFRESH_TOKEN;

let USER_ENTRY;		//mongo db User object profile

passport.use(new GoogleStrategy(options,
  function(accessToken, refreshToken, profile, done) {
  		console.log("Google login info: ");
  		console.log({accessToken, refreshToken, profile});
  	//User.findOne({_id: mongoose.Types.ObjectId(parseInt(profile.id.toString(16)+"abcdeff",16)) }, function (err, user) {
    Student.findOne({googleId: profile.id }, function (err, user) {
     	console.log("google id: "+profile.id);
      if(!user) {
      	console.log("student user not found.")
      	let errormsg = " *your google account has not been registered. ";
       	USER_PROFILE = profile;		//although not registered, the button does allow the user to log in to google account and now they can assign it into user entry
		// ACCESS_TOKEN  = accessToken;
		// REFRESH_TOKEN = refreshToken;

		
		return done(err, user);
		// res.render('login',{errormsg});
  //       // const u = new User({
  //       //   googleId: profile.id,
  //       //   name: profile.name.givenName,
  //       //   profile: profile._json.picture 
  //       // });
  //       // u.save((err, user) => {
  //       // 	req.session.user = u;
  //       //   return done(err, user);
  //       // });
      } else {

      	console.log("registered user found");
      	USER_PROFILE = profile;
      	USER_ENTRY = user;		//TODO: make this more secure so it is not just a plain text user entry option, maybe hash it like req.session
        return done(err, user);
      }
    });
  		// Student.findOne({ googleId: profile.id }, function (err, userS) {
    //    		if(!userS){
    //    			Teacher.findOne({googleId: profile.id},function(err, userT){
    //    				if(!userT){
    //    					//needs to register first
    //    					req.session.googleId = profile.id;
    //    					res.render('login',{errormsg: "No existing account found. Please register"});
    //    					// const s = new Student({	//TODO: ask if want to register as teacher or student
    //    					// 	googleId: profile.id,
    //       		// 			username: profile.name.givenName
    //    					// });
    //    				}
    //    				else{
    //    					req.session.userType = "teacher";
    //    					return done(err,userT);
    //    				}
       				
    //    			});
    //    		}
    //    		else{
    //    			req.session.userType = "student";
    //     		return done(err, userS);
    //    		}
       		
    //    });
  }
));



app.get('/auth/google',passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login','https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.events'] }));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/' }),function(req,res){
  	res.redirect('/browse');
});   




app.set('view engine', 'hbs');

const Student = mongoose.model('Student');
const Teacher = mongoose.model('Teacher');
const User = mongoose.model('User');
//route handlers
app.get('/', (req,res)=>{
	res.render('login');
});

//TODO: add scope: https://www.googleapis.com/auth/admin.directory.resource.calendar

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', {failureRedirect: '/' }),function(req,res){
	// console.log("req.user: ");
	// console.log(req.user);
	// onSignIn(req.user);
	res.redirect('/browse');
});

// function onSignIn(googleUser) {
// 		console.log("signed in");
// 	  var profile = googleUser.getBasicProfile();	//TODO: have if statement, determine type of user and send to appropriate starting page
// 	  $(".data").css("display","inline-block"); //TODO: fix this so that it appears on the same line as title but to the side
// 	  $("#pic").attr('src',profile.getImageUrl());
// 	  $("#email").text(profile.getEmail())
// 	}

// app.get('/login/google', passport.authenticate('google', { scope: ['email', 'profile'] }), (req, res) => {
// 	console.log("Logging in via Google");
// });

// app.get('/login/google/return', passport.authenticate('google', { scope: ['email', 'profile'] }), (req, res) => {
// 	// Passportjs sends back the user attached to the request object, I set it as part of the session
// 	req.session.user = req.user;
// 	// Redirect to budgeteer after the session has been set
// 	res.redirect("/browse");
// });



// app.get('/logout',(req,res)=>{
// 	//TODO: clear session stored user and implement usage of this
// 	res.redirect('/');
// });


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
				console.log(err);
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
					errormsg = " *system error";
					res.render('login',{errormsg});
				}
				else if(result == false){
					errormsg = " *username and password does not match";
					res.render('login',{errormsg});
				}
				else{	//TODO: potentially set expiration date for user login?
					//res.append('Set-Cookie',`user=${result}`);	//if it does not accept object, make a session id in schema (or use google id)
					req.session.user = user;		//req.session.user stores current user information
					//user passport req.user object
					req.session.userType =  "teacher";
					console.log("during login, user is :"+req.session.user);
					console.log("user type: "+req.session.userType);
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
						req.session.user = user;		//req.session.user stores current user information
						console.log("Login username: "+user.username);
						console.log("Session username: "+req.session.user.username);
						
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

	// console.log("add student");
	// console.log("existing students: ");
	// Student.find((err, obj)=>{
	// 	console.log(obj);
	// });
	 
  //       //   name: USER_PROFILE.name.givenName,
  //       //   profile: profile._json.picture 
  //       // });
  //       // u.save((err, user) => {
  //       // 	req.session.user = u;
  //       //   return done(err, user);
  //       // });
	bcrypt.hash(req.body.password, saltRounds, function(err,hash){
		const student = new Student({	
			username:req.body.username,
			password: hash,	//note: if user registered with google, they would not need password but it would be the same as google id
			headshot: req.body.headshot,	//TODO: make sure that this has to be from image/slug for each user
			styles: req.body.styles,	//here style is stored as strings because it is for reference purpose only
			profile: req.body.profile
		});


		if(USER_PROFILE){
			student.googleId= USER_PROFILE.id;
			// student._id = mongoose.Types.ObjectId(parseInt(USER_PROFILE.id.toString(16)+"abcdeff",16));
			// console.log(student._id);
		}else{
			student.headshot = "/image/"+student.slug+"/"+student.headshot;	//TODO: upload pictures to server, if it is not registered by google user, headshot must be placed in student's own slug folder inside image
			//student._id = new mongoose.Types.ObjectId();
		}
		student.save((err, savedStudent)=>{
			if(err){
				console.log("error adding student");
				console.log(err);
				res.render('register-student',{errmsg:"error registering student",USER_PROFILE});
			}else{
				console.log("adding student success");
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

			let profile_pic = fs.readFileSync(req.body.headshot);

			const teacher = new Teacher({
				username:req.body.username,
				headshot: profile_pic,		//TODO: want to store this as binary data
				portfolio: req.body.portfolio,	//TODO: profile photo is supposed to be the first one in portfolio
				password: hash,
				styles: req.body.styles,	//an array of selections
				locations: req.body.locations,
				price: req.body.price,
				profile: req.body.profile,
				youtube_vids: vid_str	//get video ids separated by comma
			});

			if(USER_PROFILE){
				teacher._id = mongoose.Types.ObjectId(parseInt(USER_PROFILE.id.toString(16)+"abcdeff",16));
		
			}
			else{
				teacher._id = new mongoose.Types.ObjectId();
			}


			teacher.save((err, savedTeacher)=>{
				if(err){
					res.redirect('/register-teacher',{errmsg: "error registering teacher", USER_PROFILE});
				}else{
					req.session.user = savedTeacher;
					req.session.userType = "teacher";
					console.log("Registered teacher: "+req.session.user.username);
					console.log("Registered slug: "+req.session.user.slug);
					res.redirect(`/profile-teacher/${req.session.user.slug}`);//send to teacher's own profile, TODO: pass in self object
				}
			});
		});


});

app.get('/me',(req,res)=>{
	//display private information: upcoming lessons and contacts
	//contact object has name, slug, and amount of lessons
	if(req.session.userType == "teacher"){
		res.render('me',{user:req.session.user,teacher:true});	//TODO: use req.user for passport instead
	}
	else{	//student page
		res.render('me',{user:req.session.user, teacher:false});
	}

	});

app.get('/about', (req,res)=>{
	res.render('about',{user: req.session.user});
});
app.get('/profile-teacher/:teacher', (req,res)=>{
	//TODO: how to pass teacher to here when redirect
	//res.send(req.params.teacher);

	Teacher.findOne({slug: req.params.teacher},(err, teacherObj)=>{
		if(err){
			let errstr = "entry not found";
			res.render('/browse',{errstr});
		}
		res.render('profile-teacher',{teacher: teacherObj, user: req.session.user, type: req.session.userType});

	});
});

app.get('/profile-student/:student', (req,res)=>{
	console.log("root directory: ");
	console.log(process.cwd());
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
	//console.log("google user",req.user);
	if(!req.session.user){	//logged in with google and therefore was not able to access req.session
		req.session.user = USER_ENTRY;
	}
	//console.log("Username: "+req.user.name);
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
