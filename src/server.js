const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const mysql = require('mysql');
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config()

// Mongo config
const mongoURL = process.env.MONGO_URL;
// SQL config
const host = process.env.SQL_HOST;
const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;
const database = process.env.SQL_DATABASE;

const JWT_SECRET = process.env.JWT_SECRET;

const dbConn = SQLConnection();
let dbConnMongo;

// --- MIDDLEWARES ---
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
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
            userId: results.insertId,
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

app.get('/getAllPosts', async function (req, res) {
  try {
    const posts = await dbConnMongo.collection('posts').find().sort({ createdAt: 1 }).toArray();
    return res.send({ posts: posts });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/createPost', function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);

    const username = decoded.username;
    const content = req.body.content;
    const tags = req.body.tags;
    const createdAt = new Date();
    const reposts = 0;
    const views = 0;
    const likes = 0;
    const comments = [];

    dbConnMongo.collection('posts').insertOne(
      {
        username: username,
        content,
        tags,
        createdAt,
        reposts,
        views,
        likes,
        comments,
      },
      function (error, result) {
        if (error) return res.status(500).json({ message: 'Database error' });
        return res.send({
          post: {
            _id: result.insertedId,
            username: username,
            content,
            tags,
            createdAt,
            reposts,
            views,
            likes,
            comments
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

async function mongoConnection() {
  const client = new MongoClient(mongoURL, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client.db('devconnect')
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

function SQLConnection() {
  const dbConn = mysql.createPool({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  return dbConn;
}

async function startServer() {
  dbConnMongo = await mongoConnection();
  if (!dbConnMongo) {
    console.error("Mongo no conectado. No arrancando server");
    return;
  }
  app.listen(3000, () => console.log('Node app is running on port 3000'));
}
startServer()
