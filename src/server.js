const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const mysql = require('mysql');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

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
      if (error) return res.status(500).json({ message: 'Database error: ' + error });

      if (results.length === 0) return res.status(401).json({ message: 'User not found' });

      const user = results[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ userId: user.userId, username: user.username }, JWT_SECRET, {
        expiresIn: '24h',
      });

      return res.send({
        token,
        user: {
          userId: user.userId,
          username: user.username,
        },
      });
    },
  );
});

app.post('/register', function (req, res) {
  const display_name = req.body.display_name;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  dbConn.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username],
    async function (error, results, fields) {
      if (error) return res.status(500).json({ message: 'Database error: ' + error });

      if (results.length > 0) return res.status(409).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);

      dbConn.query(
        'INSERT INTO users set ?',
        { username: username, email: email, password: hashedPassword, display_name: display_name },
        function (error, results, fields) {
          if (error) return res.status(500).json({ message: 'Database error: ' + error });

          const newUser = {
            userId: results.insertId,
            username,
            email,
            display_name,
          };

          const token = jwt.sign(
            { userId: newUser.userId, username: newUser.username },
            JWT_SECRET,
            {
              expiresIn: '24h',
            },
          );

          return res.send({ token, user: newUser });
        },
      );
    },
  );
});

// POSTS SERVICE

app.get('/getAllPosts', async function (req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const hasValidToken = token && token !== 'null' && token !== 'undefined';

    let userId = null;

    if (hasValidToken) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        userId = null;
      }
    }

    const posts = await dbConnMongo.collection('posts').find().sort({ _id: -1 }).toArray();
    const postsWithLiked = posts.map((post) => ({
      ...post,
      liked: (post.likedByUserIds || []).includes(userId),
    }));

    return res.send({ posts: postsWithLiked });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.get('/getAllPostsFromUser', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const username = decoded.username;

    const posts = await dbConnMongo.collection('posts').find({ username: username }).toArray();

    return res.send({ posts: posts });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/updateLikes', async function (req, res) {
  try {
    const postId = new ObjectId(req.body.postId); // En MongoDB el id no es ni numero ni string

    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    let post = await dbConnMongo.collection('posts').findOne({ _id: postId });

    let liked = false;

    const result = await dbConnMongo
      .collection('posts')
      .updateOne(
        { _id: postId, likedByUserIds: { $ne: userId } },
        { $addToSet: { likedByUserIds: userId }, $inc: { likes: 1 } },
      );

    if (result.modifiedCount === 1) {
      liked = true;
    } else {
      await dbConnMongo
        .collection('posts')
        .updateOne(
          { _id: postId, likedByUserIds: userId },
          { $pull: { likedByUserIds: userId }, $inc: { likes: -1 } },
        );
      liked = false;
    }
    // Vuelvo a buscar el post para no devolver la cantidad de likes desactualizada
    post = await dbConnMongo.collection('posts').findOne({ _id: postId });

    return res.send({ likes: post.likes, liked: liked });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/createPost', async function (req, res) {
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

    const result = await dbConnMongo.collection('posts').insertOne({
      username,
      content,
      tags,
      createdAt,
      reposts,
      views,
      likes,
      comments,
      likedByUserIds: [],
    });

    return res.send({
      post: {
        _id: result.insertedId,
        username,
        content,
        tags,
        createdAt,
        reposts,
        views,
        likes,
        comments,
      },
    });
  } catch (error) {
    return res.status(401).json({
      message: error.message || 'Invalid token',
    });
  }
});

app.post('/createComment', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);

    const username = decoded.username;
    const content = req.body.content;
    const postId = new ObjectId(req.body.postId);

    const newComment = {
      username,
      content,
    };
    const result = await dbConnMongo.collection('posts').updateOne(
      { _id: postId },
      {
        $push: {
          comments: newComment,
        },
      },
    );

    const post = await dbConnMongo.collection('posts').findOne({ _id: postId });

    return res.send(post.comments);
  } catch (error) {
    return res.status(401).json({
      message: error.message || 'Invalid token',
    });
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
    },
  });

  try {
    await client.connect();
    console.log('You successfully connected to MongoDB!');
    return client.db('devconnect');
  } catch (error) {
    console.error('MongoDB connection error:', error);
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
    console.error('Mongo no conectado. No arrancando server');
    return;
  }
  app.listen(3000, () => console.log('Node app is running on port 3000'));
}
startServer();
