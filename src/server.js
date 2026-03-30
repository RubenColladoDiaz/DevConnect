const express = require('express');
const app = express();

const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

app.use(cors());

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.listen(3000, function () {
  console.log('Node app is running on port 3000');
});
module.exports = app;

const dbConn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'super3',
  database: 'devconnectBD',
});

const mongoClient = new MongoClient('mongodb://localhost:27017');
mongoClient.connect();
const dbConnMongo = mongoClient.db('devconnect');

// USERS SERVICE

app.post('/login', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  dbConn.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async function (error, results, fields) {
      if (error) return res.status(500).json({ message: 'Database error' });

      if (results.length === 0) return res.status(401).json({ message: 'User not found' });

      const user = results[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username }, 'SECRET_KEY', {
        expiresIn: '24h',
      });

      return res.send({
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    },
  );
});

app.post('/register', function (req, res) {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  dbConn.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username],
    async function (error, results, fields) {
      if (error) return res.status(500).json({ message: 'Database error' });

      if (results.length > 0) return res.status(409).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      dbConn.query(
        'INSERT INTO users set ?',
        { username: username, email: email, password: hashedPassword },
        function (error, results, fields) {
          if (error) return res.status(500).json({ message: 'Database error' });

          const newUser = {
            id: results.insertId,
            username,
            email,
          };
          return res.send({ user: newUser });
        },
      );
    },
  );
});

// POSTS SERVICE

app.post('/createPost', function (req, res) {
  try {
    const token = getDecodedToken(req);

    const decoded = jwt.verify(token, 'SECRET_KEY');
    const userId = decoded.id;
    const content = req.body.content;
    const tags = req.body.tags;
    const createdAt = req.body.createdAt;
    const likes = 0;
    const comments = [];

    dbConnMongo.collection('posts').insertOne(
      {
        userId,
        content,
        tags,
        createdAt,
        likes,
        comments,
      },
      function (error, result) {
        if (error) return res.status(500).json({ message: 'Database error' });
        return res.send({
          post: {
            _id: result.insertedId,
            userId,
            content,
            tags,
            createdAt,
            likes,
            comments,
          },
        });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

function getDecodedToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token provided');
  return token;
}
