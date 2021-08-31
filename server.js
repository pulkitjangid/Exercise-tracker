const { body, validationResult } = require('express-validator');
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongo = require('mongodb');
const mongoose = require('mongoose');
const { json } = require('express');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://pulkit:mumbaiaws@cluster0.no2pb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
{ useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Hey I am database & I'm connected")
});
const person = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  exercises: [{
    _id : false,
    description: String,
    duration: String,
    date: {
      type: String,
    }
  }]
});
const userModel = mongoose.model('userModel', person);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//To create a new user
app.post('/api/users',
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters, inclusive')
  , async (req, res) => {
    let name = req.body.username
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let data = new userModel({
      username: name
    });
    data.save((err, result) => {
      if (err) {
        console.log(err);
      }
      else
        console.log(result);

    });
    res.json({ username: data.username, _id: data._id })

  });
//To log the exercise of the user
app.post('/api/users/:_id/exercises', async (req, res, next) => {
  let date = req.body.date;
  var newDate;
  if (date) {
    newDate = new Date(date);
    newDate.toString();
  }
  else { newDate = new Date() }
  //console.log(newDate)
  var duration = Number(req.body.duration)
  newDate = newDate.toDateString();
  console.log(typeof (req.body.duration))
  try{
    const detail = await userModel.findByIdAndUpdate({ _id: req.params._id }, {
      $push: {
        exercises: {
          description: req.body.description,
          duration: duration,
          date: newDate
        }
      }
    })
    // detail.save()
    res.json({
      _id: req.params._id,
      username: detail.username,
      date: newDate,
      duration: parseInt(req.body.duration),
      description: req.body.description
    })
  }
  catch (err) {
    res.send("Error",err.message);
  }
  //console.log(newDate)
});
//To fetch logs of the users
app.get('/api/users/:_id/logs', async (req, res) => {
  const logs = await userModel.findById({ _id: req.params._id })
  var arr = {
    _id : logs._id,
    username : logs.username,
    count : logs.exercises.length,
    log : logs.exercises
  }
  res.json(arr);
})
//To get details of all username
app.get('/api/users', async (req, res) => {
  var projection = {
    username: true,
    _id: true
  }
  await userModel.find({}, projection, function (err, users) {
    if (err) return next(err);
    res.json(users);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
