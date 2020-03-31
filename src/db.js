const mongoose = require('mongoose');

//a student entry, non-required value defaulted for templating purpose

const Student = new mongoose.Schema({
	username:{type:String, required:true},
	hash:{type:String, required: true},
	profile:{type:String, required:true},
	styles:{type:Array, default:[]},
	upcoming lessons: {type:Array, default:[]},
	contact: {type:Array, default:[]}
	headshot: {type:String, default:"/public/image/logo.jpeg"}
});

mongoose.model('Student',Student);

//a teacher entry, non-required value defaulted for templating purpose

const Teacher = new mongoose.Schema({
	username:{type:String, required: true},
	hash:{type:String, required: true},
	profile: {type:String, required: true},
	styles: {type:Array, required: true},
	price: {type:String, required: true},
	height: {type: String, default: ""},
	portfolio:{type:Array, default:[]},
	availiability:{type:Array, required:true},
	upcoming lessons:{type:Array, default:[]},
	contact:{type:Array, default:[]}

});

mongoose.model('Teacher', Teacher);

//TODO: figure out how to do login
mongoose.connect('mongodb://localhost');