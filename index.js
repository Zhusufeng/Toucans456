//Changed expressed delcaration location.
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


//Loading .env file. -Heroku
require('dotenv').config();

//Database testing script.
// var testDB = require('./server/testDatabase.js');

//===INITIALIZE EXPRESS APP===================
const app = module.exports = express();
const port = process.env.PORT || 8000;

var mysql = require('./db/config.js');
// var cloudinary = require('./client/cloudinary/cloudinaryConfig.js')

//Booting up rest of the server file.
// var server = require('./server/routes.js');

//===PORT====================================
app.listen(port, () => {
  console.log('Node is listening on port ', port,' Stamp: ', Date());
});


//this part only runs after config.js runs
// mysql.createDatabase()
//   .then(function() {

//     //boot up the rest of the backend
//     var server = require('./server/routes.js');

//     //server is now listening
//     server.listen(port);
//     console.log('Listening on port ', port);
//   })
//   .catch(console.error);

// ==============Line of death ==============================
// ==========================================================


var cloudinary = require('cloudinary');
// var express = require('express');
// var bodyParser = require('body-parser');
var db = require('./db/schema.js');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var cloudConfig = require('./server/cloudinaryConfig.js');


var multer  = require('multer');
var upload = multer({ dest: 'uploads/'});
//clean storage

// var app = express();
const public = path.join(__dirname + '/client');
app.use(bodyParser.json());
app.use(express.static(public));

// app.use(express.static(__dirname + '/../client'));
// app.use(bodyParser.urlencoded( {extended: true }));
// app.use(bodyParser.json());

//Setting up tokens
// app.use(expressJWT({
//   secret: 'rowdyHouse'
// }).unless({
//   path: ['/api/login', '/api/signup', '/']
// }));

/////////////////////////////////////////////////////////////
/////////////////////// GET REQUESTS ///////////////////////
////////////////////////////////////////////////////////////

// Finds all users from the database
app.get('/api/users', (request, response) => {
  db.User.findAll()
    .then((users) => {
      // console.log(users);
      response.send(users);
    })
    .catch((error) => {
      response.send(error);
    });
});

// Finds all recipes from the database
app.get('/api/recipes', (request, response) => {
  //STRETCH GOAL:  Account for username here
  //query username to retrieve their recipeId's

  db.Recipe.findAll()
    .then((recipe) => {
      //console.log(recipe);
      response.send(recipe);
    })
    .catch((error) => {
      response.send(error);
    });
});


//Returns all data associated with the recipe that was clicked on
app.get('/api/recipe', (request, response) => {
  console.log('Server GET Recipes request', typeof request.query.config);
  var responseObj = {};
  var queryStringPhoto = "SELECT Image FROM Photos WHERE RecipeId = " + request.query.config;
  var queryStringTag = "SELECT Tag FROM Tags LEFT JOIN RecipeTag on RecipeTag.tagId = tags.id WHERE RecipeTag.RecipeId = " + request.query.config;
  var queryStringTitleAndStars = "SELECT title, isStarred FROM Recipes WHERE id = " + request.query.config;

  return new Promise(function(resolve, reject) {
    db.db.query(queryStringPhoto)
    .spread(function(photos) {
      responseObj["Photos"] = photos;   //[array of photos]
      db.db.query(queryStringTag)
      .spread(function(tags) {
        responseObj["Tags"] = tags;   //[array of tags]
        db.db.query(queryStringTitleAndStars)
        .spread(function(titleAndStars) {
          responseObj["title"] = titleAndStars[0].title;
          responseObj["isStarred"] = titleAndStars[0].isStarred;
          resolve();
        })
      })
    })
   })
  .then(function() {
    response.send(responseObj);
  })
  .catch(function(error) {
    console.log('Server GET photos error');
    response.send(error);
  });
});



// app.get('/api/login', (request, response) => {
//   db.User.findAll({
//     where: {
//       username: request.query.username
//     }
//   })
//     .then((user) => {
//       // compare passwords
//       if (user[0].dataValues.hash === request.query.hash) {
//         var myToken = jwt.sign({
//           username: request.query.username
//         }, 'rowdyHouse');
//         // redirect to homepage with token as header
//         response.status(200).json(myToken);
//       } else {
//         response.status(401).send('Invalid password');
//       }
//     })
//     .catch((error) => {
//       console.log('User does not exist');
//       response.status(401).send(error);
//     });
// });

//Returns all recipes based on what was typed in search bar
app.get('/api/search', (request, response) => {



  var queryString = "SELECT Recipes.* FROM RecipeTag LEFT JOIN Recipes on RecipeTag.RecipeId = Recipes.id LEFT JOIN Tags on RecipeTag.TagId = Tags.id WHERE Recipes.title like '%" + request.query.query.toString() + "%' OR Tags.tag like '%" + request.query.query.toString() + "%' GROUP BY id"

  db.db.query(queryString)
  .spread(function(recipes) {
    response.send(recipes);
  })
  .catch(function(error) {
    response.send(error);
  })
});


//////////////////////////////////////////////////////////////
/////////////////////// POST REQUESTS ///////////////////////
/////////////////////////////////////////////////////////////

// app.post('/api/signup', (request, response) => {
//   var username = request.body.username;
//   var hash = request.body.hash;

//   if (!username) {
//     response.status(404).send('invalid username');
//   }
//   if (!hash) {
//     response.status(404).send('invalid password');
//   }
//   db.User.findAll({where: {username: username}})
//   .then ((userData) => {
//     if(userData.length > 0) {
//       console.log('User already exists');
//       response.status(404).send('User already exists')
//     } else {
//       db.User.create({
//         username: username,
//         hash: hash
//       })
//       .then((user) => {
//         var myToken = jwt.sign({
//             username: username
//         }, 'rowdyHouse');
//         response.status(200).json(myToken);
//       })
//       .catch((error) => {
//         response.status(404).json(error);
//       })
//     }
//   })
//   .catch((error) => {
//     response.status(404).json(error);
//   })
// })

// Adds a recipe, desired tags, thumbnail url, and photos to the database

app.post('/api/recipes', upload.array('file', 4), (request, response) => {
  //UPDATE THIS TO HANDLE USERNAME
  var photoPathforOne = request.files[0].path;
  var photoTitle = request.body.title + "thumbnail";
  var photoTags = request.body.tags.split(",");
  var photoData = request.files;
  var endThisResponse = response;

  return new Promise(function(resolve, reject){
    cloudConfig.uploadPhoto(photoPathforOne, photoTitle, photoTags)
    .then(function(response){
      var inputTags = photoTags.map(cur => cur={tag:cur});
      db.Recipe.create({
        title: request.body.title,
        imageUrl: response.secure_url,
        Tags: inputTags
      }, {
        include: [db.Tag]  //UPDATE THIS TO HANDLE USERNAME
      })
      .then(() => {
        console.log('Server POST Recipe success');

      })
      .catch((error) => {
        console.log('Server POST Recipe error');
        response.send(error);
      });
      resolve();
    })
    .catch(err => {
      console.error('Unable to upload', err);
      reject(err);
    })
  })
  .then(function() {
    photoData.forEach(function(cur, index){
      var photoPath = cur.path;
      var photoTitle = request.body.title + index;
      var receivedUrl ='';
      return new Promise(function(resolve, reject) {
        cloudConfig.uploadPhoto(photoPath, photoTitle)
        .then(function(response){
          receivedUrl = response.secure_url;
          db.Recipe.findOne({where: {title: request.body.title}})
          .then(recipe =>(

            db.Photo.create({
              RecipeId: recipe.id,
              image:receivedUrl
            })
            .then((recipeData) => {
              console.log('Server POST Recipe success', recipeData);
              endThisResponse.send(recipeData);
            })
            .catch((error) => {
              console.log('Server POST Recipe error: ', error);
              endThisResponse.end('Recipe upload error');
            })
          ))
        })
      });
    })

  })
  .catch(err => console.error)


});

///////////////////////////////////////////////////////////////
/////////////////////// OTHER REQUESTS ///////////////////////
//////////////////////////////////////////////////////////////

// Deletes a recipe from the database
app.delete('/api/recipes', (request, response) => {
  db.Recipe.findAll({ title: request.body.title }) //use findAll here?
    .then((recipe)=> {
      console.log('Recipes is: ', recipes);
      return recipes[0].destroy();
    })
    .then(() => {
      console.log('Recipe DESTROYED.');
    });
});

