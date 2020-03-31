const express = require('express');
const app = express();
const session = require('express-session');

const sessionOptions = { 
    secret: 'ballroomTinderIsTrash', 
    saveUninitialized: false, 
    resave: false 
};

app.use(session(sessionOptions));

const publicPath = path.join(__dirname, ‘public’);

app.use(express.static(publicPath));

app.set('view engine', 'hbs');


app.get(‘/‘, (req,res)=>{
	res.render(“login”); //can do: {name:obj}
});




app.listen(3000);
