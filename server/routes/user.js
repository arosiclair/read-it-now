/* eslint-disable no-useless-escape */
var express = require('express')
var router = express.Router()

var passwordHasher = require('password-hash')
const { sanitize, sanitizeAndValidate, sanitizeAndValidateStrict } = require('../utils/validation')
const { InvalidJSONResponse, ErrorResponse } = require('../utils/errors')
const { addUser, getUserByEmail, getUserById, updateUser } = require('../daos/users')
const { createSession, deleteSession, getSession } = require('../daos/sessions')
/*
  Endpoint for creating a user.
  Responds with a session token in payload and set's the token in a session cookie
*/
const registerUserSchema = {
  name: (val) => typeof val === 'string' && val.length <= 30,
  email: (val) => {
    return typeof val === 'string' &&
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        .test(val.toLowerCase())
  },
  password: (val) => {
    return typeof val === 'string' &&
      val.length >= 8 && val.length <= 30 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
        .test(val)
  }
}
router.post('/register', async (req, res) => {
  const errorParams = sanitizeAndValidateStrict(req.body, registerUserSchema)
  if (errorParams.length) {
    res.status(400).json(new InvalidJSONResponse(errorParams))
    return
  }

  const result = await addUser(req.body.name, req.body.email, req.body.password, {
    linkTTL: 5 // days until link expires
  })

  if (result) {
    req.session.token = await createSession(result.insertedId)
    res.json({
      result: 'success',
      name: req.body.name,
      token: req.session.token
    })
  } else {
    res.status(500).json(new ErrorResponse('db error'))
  }
})

/*
  Endpoint for logging in
  Responds with a session token in payload and set's the token in a session cookie
  Expects json payload with following params:
*/
const loginSchema = {
  email: (val) => typeof val === 'string',
  password: (val) => typeof val === 'string'
}
router.post('/login', async function (req, res) {
  const invalidProps = sanitizeAndValidateStrict(req.body, loginSchema)
  if (invalidProps.length) {
    res.status(400).json(new InvalidJSONResponse(invalidProps))
    return
  }

  const user = await getUserByEmail(req.body.email)
  if (!user) {
    res.status(401).json(new ErrorResponse('Email/password is incorrect'))
    return
  }

  if (passwordHasher.verify(req.body.password, user.password)) {
    req.session.token = await createSession(user._id)
    res.json({
      result: 'success',
      name: user.name,
      token: req.session.token
    })
  } else {
    res.status(401).json(new ErrorResponse('Email/password is incorrect'))
  }
})

/*
  Endpoint for logging out
  Responds with 'success' or 'error'
  Expects session token in json payload or in session cookie
*/
router.post('/logout', async (req, res) => {
  var token = req.body.token ? req.body.token : req.session.token

  if (token) {
    await deleteSession(token)
    req.session.token = ''
    res.json({ result: 'success' })
  } else {
    res.status(400).json(new ErrorResponse('No token provided'))
  }
})

router.all('/data', authMiddleware)
router.get('/data', async function (req, res) {
  var user = await getUserById(req.userId)
  if (user) {
    res.json({
      result: 'success',
      name: user.name,
      email: user.email,
      prefs: user.prefs
    })
  } else {
    res.status(500).json(new ErrorResponse("the user wasn't found"))
  }
})

const userDataSchema = {
  name: value => typeof value === 'string' && value.length <= 30,
  // email: value => typeof value === 'string' && validateEmail(value),
  prefs: value => typeof value === 'object' && !sanitizeAndValidate(value, userPrefsSchema).length
}
const userPrefsSchema = {
  linkTTL: value => typeof value === 'number',
  linkOrder: value => typeof value === 'string' && ['asc', 'desc'].includes(value)
}

router.patch('/data', async function (req, res) {
  const data = req.body
  const errorKeys = sanitizeAndValidate(data, userDataSchema)
  if (errorKeys.length) {
    res.json(new InvalidJSONResponse(errorKeys))
    return
  }

  const updatedUser = await updateUser(req.userId, data)
  if (updateUser) {
    res.json({
      result: 'success',
      data: sanitize(updatedUser, userDataSchema)
    })
  } else {
    res.status(500).json(ErrorResponse('db error'))
  }
})

/*
  Authentication middleware to be used with user endpoints
  expects either the session token to be present in the json payload
  or the request's session to have the token
*/
module.exports.auth = authMiddleware

async function authMiddleware (req, res, next) {
  var error = await authImpl(req)
  if (error) {
    res.status(401).json(new ErrorResponse(error))
  } else {
    next()
  }
}

async function authImpl (req) {
  var token = req.body.token ? req.body.token : req.session.token

  if (token) {
    const session = await getSession(token)
    if (session) {
      // attach the user's mongo ID for easy access
      req.userId = session.userId
      req.sessionToken = session.token
    } else {
      return 'invalid session'
    }
  } else {
    return 'invalid session'
  }
}

module.exports.router = router
