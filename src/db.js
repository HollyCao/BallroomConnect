const mongoose = require('mongoose');

//a student entry, non-required value defaulted for templating purpose

const Student = new mongoose.Schema({
	username:{type:String, required:true},
	password:{type:String, required: true},
	profile:{type:String, required:true},
	styles:{type:String, default:""},
	upcoming_lessons: {type:Array, default:[]},
	contact: {type:Array, default:[]},
	headshot: {type:String, default:"/public/image/logo.jpeg"}
});

mongoose.model('Student',Student);

//a teacher entry, non-required value defaulted for templating purpose

const Teacher = new mongoose.Schema({
	username:{type:String, required: true},
	password:{type:String, required: true},
	profile: {type:String, required: true},
	styles: {type:Array, required: true},
	price: {type:String, required: true},
	height: {type: String, default: ""},
	portfolio:{type:Array, default:[]},
	locations: {type: Array, default:[]},
	availiability:{type:Array, required:true},
	upcoming_lessons:{type:Array, default:[]},
	contact:{type:Array, default:[]}

});

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

