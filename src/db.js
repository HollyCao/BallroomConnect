const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');

//a student entry, non-required value defaulted for templating purpose
const User = new mongoose.Schema({
    _id: String,
    name: String,
    profile: String
});

mongoose.model('User', User);


const Student = new mongoose.Schema({
	//_id: { type: mongoose.ObjectId, auto: true },
	googleId: String,
	username:{type:String, required:[true,'{PATH} is required!']},
	password:{type:String, required: [true,'{PATH} is required!']},
	profile:{type:String, required:[true,'{PATH} is required!']},
	styles:{type:String, default:""},
	upcoming_lessons: {type:Array, default:[]},
	contact: {type:Array, default:[]},
	headshot: {type:String, default:"/public/image/logo.jpeg"}
});

Student.plugin(URLSlugs('username'));	//add a field called slug
//Student.contact.plugin(URLSlug('name'));	//TODO: need to specify that contact has name field
mongoose.model('Student',Student);

//a teacher entry, non-required value defaulted for templating purpose

const Teacher = new mongoose.Schema({
	_id: { type: mongoose.ObjectId, auto: true },
	username:{type:String, required: [true,'{PATH} is required!']},
	password:{type:String, required: [true,'{PATH} is required!']},
	profile: {type:String, required: [true,'{PATH} is required!']},
	styles: {type:Array, required: [true,'{PATH} is required!']},
	price: {type:String, required: [true,'{PATH} is required!']},
	height: {type: String, default: ""},
	headshot: {type: String, default: "/image/logo.jpeg"},
	portfolio:{type:Array, default:[]},		//these are only photos
	youtube_vids:{type:String},	//array of youtube links
	locations: {type: Array, default:[]},
	availiability:{type:Array, required:[true,'{PATH} is required!']},
	upcoming_lessons:{type:Array, default:[]},
	contact:{type:Array, default:[]}		//TODO: make slug for contacts and sort contacts by lessons

});
Teacher.plugin(URLSlugs('username'));
mongoose.model('Teacher', Teacher);

//TODO: figure out how to do login
//mongoose.connect('mongodb://localhost');

//to run code, do: NODE_ENV=PRODUCTION node app.js from src folder
let dbconf;

if (process.env.NODE_ENV === 'PRODUCTION') {
   	const fs = require('fs');
    const path = require('path');
    const fn = path.join(__dirname, '../config.json');
    const data = fs.readFileSync(fn);

   	const conf = JSON.parse(data);
    dbconf = conf.dbconf;
} else {
    dbconf = 'mongodb://localhost/ballroom';
}

mongoose.connect(dbconf);
// let db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log('connected');
// });

