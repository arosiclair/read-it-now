// Data access for ReadItNow

var mongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/geoffrey'
const dbName = 'geoffrey'

var geoffrey
var usersCollection
var sessionsCollection

mongoClient.connect(url, function (err, client) {
  if (err) {
    console.error('Error connecting to MongoDB: ' + err)
  }

  console.log('Connected successfully to MongoDB')

  geoffrey = client.db(dbName)
  usersCollection = geoffrey.collection('users')
  sessionsCollection = geoffrey.collection('sessions')
})

module.exports.getUsers = function () {
  return usersCollection
}

module.exports.getSessions = function () {
  return sessionsCollection
}
