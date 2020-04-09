console.log("Correct front end directory!!!!!!!!!!!!!!!!!!");

function onSignIn(googleUser) {
  console.log"user signed in!";
  var profile = googleUser.getBasicProfile();	//TODO: have if statement, determine type of user and send to appropriate starting page
  $(".data").css("display","inline-block"); //TODO: fix this so that it appears on the same line as title but to the side
  #("#sign-in").css("display","none");
  $("#pic").attr('src',profile.getImageUrl());
  $("#email").text(profile.getEmail());
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
    alert("You have been successfully signed out of Ballroom Connect");
    console.log('User signed out.');
  });
}
