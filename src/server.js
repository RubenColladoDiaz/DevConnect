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

      dbConn.query(
        'UPDATE users SET status = ? WHERE userId = ?',
        ['active', user.userId],
        function () {
          let followers = user.followers;
          if (typeof followers === 'string') {
            followers = JSON.parse(followers);
          }
          if (!followers) {
            followers = [];
          }

          return res.send({
            token,
            user: {
              userId: user.userId,
              username: user.username,
              email: user.email,
              display_name: user.display_name,
              bio: user.bio,
              stack: JSON.parse(user.stack),
              followers,
              status: 'active',
              location: user.location,
              avatar_url: user.avatar_url,
              created_at: user.created_at,
            },
          });
        },
      );
    },
  );
});

app.post('/logout', function (req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, function (error, decoded) {
    if (error) {
      return res.status(401).json({
        message: 'Invalid or expired token',
      });
    }

    dbConn.query(
      'UPDATE users SET status = ? WHERE userId = ?',
      ['offline', decoded.userId],
      function (databaseError, results) {
        if (databaseError) {
          return res.status(500).json({
            message: 'Database error: ' + databaseError,
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            message: 'User not found',
          });
        }

        return res.json({
          message: 'Logout successful',
          status: 'offline',
        });
      },
    );
  });
});

app.post('/register', async function (req, res) {
  const display_name = req.body.display_name;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const stack = req.body.stack;

  const hashedPassword = await bcrypt.hash(password, 12);

  dbConn.query(
    'INSERT INTO users SET ?',
    {
      username,
      email,
      password: hashedPassword,
      display_name,
      stack: JSON.stringify(stack),
      status: 'active',
    },
    function (error, results) {
      if (error) {
        return res.status(500).json({
          message: 'Database error: ' + error,
        });
      }

      dbConn.query(
        'SELECT * FROM users WHERE userId = ?',
        [results.insertId],
        function (error2, rows) {
          if (error2) {
            return res.status(500).json({
              message: 'Database error: ' + error2,
            });
          }

          const user = rows[0];

          const token = jwt.sign(
            {
              userId: user.userId,
              username: user.username,
            },
            JWT_SECRET,
            {
              expiresIn: '24h',
            },
          );

          let followers = user.followers;
          if (typeof followers === 'string') {
            followers = JSON.parse(followers);
          }
          if (!followers) {
            followers = [];
          }

          return res.send({
            token,
            user: {
              userId: user.userId,
              username: user.username,
              email: user.email,
              display_name: user.display_name,
              bio: user.bio,
              stack: JSON.parse(user.stack),
              followers,
              status: user.status,
              location: user.location,
              avatar_url: user.avatar_url,
              created_at: user.created_at,
            },
          });
        },
      );
    },
  );
});

// POSTS SERVICE

app.get('/getAllPosts', async function (req, res) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
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

    const maxPosts = 20;
    const maxFollowedPosts = 10;
    let followedUsernames = [];

    if (userId !== null) {
      const following = await new Promise((resolve, reject) => {
        dbConn.query(
          'SELECT username FROM users WHERE JSON_CONTAINS(followers, CAST(? AS JSON))',
          [userId],
          function (error, results) {
            if (error) return reject(error);
            resolve(results);
          },
        );
      });
      followedUsernames = following.map((user) => user.username);
    }

    let posts = [];
    if (followedUsernames.length > 0) {
      posts = await dbConnMongo
        .collection('posts')
        .aggregate([
          { $match: { username: { $in: followedUsernames } } },
          { $sort: { createdAt: -1 } },
          { $limit: maxFollowedPosts },
        ])
        .toArray();
    }

    const remainingSlots = maxPosts - posts.length;
    if (remainingSlots > 0) {
      let randomPosts;
      if (followedUsernames.length > 0) {
        randomPosts = await dbConnMongo
          .collection('posts')
          .aggregate([
            { $match: { username: { $nin: followedUsernames } } },
            { $sample: { size: remainingSlots } },
          ])
          .toArray();
      } else {
        randomPosts = await dbConnMongo
          .collection('posts')
          .aggregate([{ $sample: { size: remainingSlots } }])
          .toArray();
      }
      posts = posts.concat(randomPosts);
    }

    const postsWithLiked = posts.map((post) => ({
      ...post,
      liked: (post.likedByUserIds || []).includes(userId),
      reposted: (post.repostedByUserIds || []).includes(userId),
    }));

    return res.send({ posts: postsWithLiked });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.get('/searchUsers', function (req, res) {
  const query = String(req.query.query || '').trim();
  if (query.length < 2) {
    return res.send([]);
  }

  const search = `%${query}%`;
  dbConn.query(
    'SELECT userId, username, display_name, avatar_url FROM users WHERE username LIKE ? OR display_name LIKE ? ORDER BY username LIMIT 8',
    [search, search],
    function (error, results) {
      if (error) {
        return res.status(500).json({ message: 'Database error: ' + error });
      }

      return res.send(results);
    },
  );
});

app.get('/getAllInfoFromUser', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const username = decoded.username;
    const userId = decoded.userId;

    const posts = await dbConnMongo.collection('posts').find({ username: username }).toArray();
    const reposts = await dbConnMongo
      .collection('posts')
      .find({ repostedByUserIds: userId })
      .toArray();

    let likes = 0;
    let comments = 0;

    for (const post of posts) {
      likes += post.likes || 0;
      comments += post.comments?.length || 0;
    }

    dbConn.query(
      'SELECT JSON_LENGTH(followers) AS followers FROM users WHERE userId = ?',
      [userId],
      function (error, results) {
        if (error) {
          return res.status(500).json({ message: 'Database error: ' + error });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.send({ posts, likes, comments, reposts, followers: results[0].followers });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.get('/getAllInfoFromUser/:username', async function (req, res) {
  try {
    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT userId, username, display_name, bio, stack, status, location, avatar_url, created_at, followers, JSON_LENGTH(followers) AS followersCount FROM users WHERE username = ?',
        [req.params.username],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const account = users[0];
    let followerIds = account.followers || [];
    if (typeof followerIds === 'string') {
      followerIds = JSON.parse(followerIds);
    }
    let viewerId = null;
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      try {
        viewerId = jwt.verify(token, JWT_SECRET).userId;
      } catch (error) {
        viewerId = null;
      }
    }

    const posts = await dbConnMongo
      .collection('posts')
      .find({ username: account.username })
      .toArray();
    const reposts = await dbConnMongo
      .collection('posts')
      .find({ repostedByUserIds: account.userId })
      .toArray();

    let likes = 0;
    let comments = 0;

    for (const post of posts) {
      likes += post.likes || 0;
      comments += post.comments?.length || 0;
    }

    let stack = account.stack;
    if (typeof stack === 'string') {
      stack = JSON.parse(stack);
    }

    const postsWithViewerState = posts.map((post) => ({
      ...post,
      liked: (post.likedByUserIds || []).includes(viewerId),
      reposted: (post.repostedByUserIds || []).includes(viewerId),
    }));

    return res.send({
      user: {
        ...account,
        stack,
        followers: followerIds,
        locatinon: account.location,
      },
      posts: postsWithViewerState,
      likes,
      comments,
      reposts,
      followers: account.followersCount,
      isFollowing:
        viewerId !== null && followerIds.some((followerId) => Number(followerId) === viewerId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/follow/:userId', async function (req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const followerId = decoded.userId;
    const followedId = Number(req.params.userId);

    if (!Number.isInteger(followedId) || followedId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (followerId === followedId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT followers FROM users WHERE userId = ?',
        [followedId],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let followers = users[0].followers || [];
    if (typeof followers === 'string') {
      followers = JSON.parse(followers);
    }
    const isFollowing = followers.some((id) => Number(id) === followerId);
    let updatedFollowers;
    if (isFollowing) {
      updatedFollowers = followers.filter((id) => Number(id) !== followerId);
    } else {
      updatedFollowers = [...followers, followerId];
    }

    await new Promise((resolve, reject) => {
      dbConn.query(
        'UPDATE users SET followers = ? WHERE userId = ?',
        [JSON.stringify(updatedFollowers), followedId],
        function (error) {
          if (error) return reject(error);
          resolve();
        },
      );
    });

    return res.send({
      followers: updatedFollowers,
      followersCount: updatedFollowers.length,
      isFollowing: !isFollowing,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/getUserConnections/:userId', async function (req, res) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const users = await new Promise((resolve, reject) => {
      dbConn.query('SELECT followers FROM users WHERE userId = ?', [userId], function (error, results) {
        if (error) return reject(error);
        resolve(results);
      });
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let followerIds = users[0].followers || [];
    if (typeof followerIds === 'string') {
      followerIds = JSON.parse(followerIds);
    }

    let followers = [];
    if (followerIds.length > 0) {
      followers = await new Promise((resolve, reject) => {
        dbConn.query(
          'SELECT userId, username, display_name, avatar_url FROM users WHERE userId IN (?)',
          [followerIds],
          function (error, results) {
            if (error) return reject(error);
            resolve(results);
          },
        );
      });
    }

    const following = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT userId, username, display_name, avatar_url FROM users WHERE JSON_CONTAINS(followers, CAST(? AS JSON))',
        [userId],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });

    return res.send({ followers, following });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

app.post('/updateReposts', async function (req, res) {
  try {
    const postId = new ObjectId(req.body.postId);

    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    let reposted = false;

    const result = await dbConnMongo
      .collection('posts')
      .updateOne(
        { _id: postId, repostedByUserIds: { $ne: userId } },
        { $addToSet: { repostedByUserIds: userId }, $inc: { reposts: 1 } },
      );

    if (result.modifiedCount === 1) {
      reposted = true;
    } else {
      await dbConnMongo
        .collection('posts')
        .updateOne(
          { _id: postId, repostedByUserIds: userId },
          { $pull: { repostedByUserIds: userId }, $inc: { reposts: -1 } },
        );
      reposted = false;
    }

    const post = await dbConnMongo.collection('posts').findOne({ _id: postId });

    return res.send({ post: post, reposted: reposted });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/updateBio', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const bio = req.body.bio;

    dbConn.query(
      'UPDATE users SET bio = ? WHERE userId = ?',
      [bio, userId],
      function (error, results) {
        if (error) {
          return res.status(500).json({
            message: 'Database error: ' + error,
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            message: 'User not found',
          });
        }

        return res.json({
          message: 'Bio updated successfully',
          bio,
        });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/updateAvatar', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const avatar_url = req.body.avatar_url;

    dbConn.query(
      'UPDATE users SET avatar_url = ? WHERE userId = ?',
      [avatar_url, userId],
      function (error, results) {
        if (error) {
          return res.status(500).json({
            message: 'Database error: ' + error,
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({
            message: 'User not found',
          });
        }

        return res.json({
          message: 'Avatar updated successfully',
          avatar_url,
        });
      },
    );
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
    const contentBlocks = req.body.contentBlocks;
    if (contentBlocks !== undefined) {
      if (!Array.isArray(contentBlocks) || contentBlocks.length > 50) {
        return res.status(400).json({ message: 'Invalid post content blocks' });
      }

      const supportedLanguages = [
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C#',
        'HTML',
        'CSS',
        'SQL',
        'Text',
      ];
      const supportedThemes = ['dark', 'light', 'monokai'];

      for (const block of contentBlocks) {
        if (
          !block ||
          (block.type !== 'text' && block.type !== 'code') ||
          typeof block.content !== 'string'
        ) {
          return res.status(400).json({ message: 'Invalid post content block' });
        }

        if (
          block.type === 'code' &&
          (!supportedLanguages.includes(block.language) || !supportedThemes.includes(block.theme))
        ) {
          return res.status(400).json({ message: 'Invalid code language or theme' });
        }
      }
    }

    const createdAt = new Date();
    const reposts = 0;
    const views = 0;
    const likes = 0;
    const comments = [];

    const result = await dbConnMongo.collection('posts').insertOne({
      username,
      content,
      contentBlocks,
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
        contentBlocks,
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

    const avatarUrl = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT avatar_url FROM users WHERE userId = ?',
        [decoded.userId],
        function (error, results) {
          if (error) return reject(error);
          if (results.length === 0) return resolve(null);
          resolve(results[0].avatar_url || null);
        },
      );
    });

    const newComment = {
      username,
      content,
      avatar_url: avatarUrl,
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
