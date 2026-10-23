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
// The limit is bigger than the default because the CV PDF is sent as base64
app.use(bodyParser.json({ limit: '10mb' }));
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
        'UPDATE users SET status = ?, last_seen_at = CURRENT_TIMESTAMP WHERE userId = ?',
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
              location: user.location || 'Unknown',
              avatar_url: user.avatar_url,
              cover_url: user.cover_url,
              job_title: user.job_title,
              company: user.company,
              portfolio_url: user.portfolio_url,
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
  const location = typeof req.body.location === 'string' ? req.body.location.trim() : 'Unknown';

  const hashedPassword = await bcrypt.hash(password, 12);

  dbConn.query(
    'INSERT INTO users SET ?',
    {
      username,
      email,
      password: hashedPassword,
      display_name,
      stack: JSON.stringify(stack),
      location: location || 'Unknown',
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
              location: user.location || 'Unknown',
              avatar_url: user.avatar_url,
              cover_url: user.cover_url,
              job_title: user.job_title,
              company: user.company,
              portfolio_url: user.portfolio_url,
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

    await normalizePostComments(posts);
    await addAuthorAvatars(posts);

    const postsWithLiked = posts.map((post) => ({
      ...post,
      liked: (post.likedByUserIds || []).includes(userId),
      reposted: (post.repostedByUserIds || []).includes(userId),
      saved: (post.savedByUserIds || []).includes(userId),
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

app.get('/topFollowers', function (req, res) {
  dbConn.query(
    'SELECT userId, username, display_name, avatar_url, COALESCE(JSON_LENGTH(followers), 0) AS followersCount FROM users ORDER BY followersCount DESC, username ASC LIMIT 5',
    function (error, results) {
      if (error) {
        return res.status(500).json({ message: 'Database error: ' + error });
      }

      return res.send(results);
    },
  );
});

app.get('/topProfileViews', function (req, res) {
  dbConn.query(
    'SELECT userId, username, display_name, avatar_url, profile_views FROM users ORDER BY profile_views DESC, username ASC LIMIT 5',
    function (error, results) {
      if (error) {
        return res.status(500).json({ message: 'Database error: ' + error });
      }

      return res.send(results);
    },
  );
});

app.get('/topQuestionSolvers', async function (req, res) {
  try {
    const solvers = await dbConnMongo
      .collection('posts')
      .aggregate([
        {
          $match: {
            type: 'question',
            acceptedAnswerIds: { $exists: true, $ne: [] },
          },
        },
        { $unwind: '$comments' },
        {
          $match: {
            $expr: {
              $in: ['$comments.answerId', { $ifNull: ['$acceptedAnswerIds', []] }],
            },
          },
        },
        {
          $group: {
            _id: {
              username: '$comments.username',
              postId: '$_id',
            },
            solvedQuestionCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.username',
            solvedQuestionCount: { $sum: 1 },
          },
        },
        { $sort: { solvedQuestionCount: -1, _id: 1 } },
        { $limit: 5 },
      ])
      .toArray();

    if (solvers.length === 0) {
      return res.send([]);
    }

    const usernames = solvers.map((solver) => solver._id);
    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT userId, username, display_name, avatar_url FROM users WHERE username IN (?)',
        [usernames],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });
    const usersByUsername = new Map(users.map((user) => [user.username, user]));
    const result = solvers
      .map((solver) => {
        const user = usersByUsername.get(solver._id);
        if (!user) return null;
        return {
          ...user,
          solvedQuestionCount: solver.solvedQuestionCount,
        };
      })
      .filter(Boolean);

    return res.send(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/followingPresence', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        `SELECT userId, username, display_name, avatar_url,
                (status = 'active' AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)) AS online
         FROM users
         WHERE JSON_CONTAINS(followers, CAST(? AS JSON))
         ORDER BY online DESC, username ASC`,
        [decoded.userId],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });

    return res.send(
      users.map((user) => ({
        ...user,
        online: Boolean(user.online),
      })),
    );
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/heartbeat', function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    dbConn.query(
      "UPDATE users SET status = 'active', last_seen_at = CURRENT_TIMESTAMP WHERE userId = ?",
      [decoded.userId],
      function (error) {
        if (error) {
          return res.status(500).json({ message: 'Database error: ' + error });
        }
        return res.send({ status: 'active' });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.get('/trendingLanguages', async function (req, res) {
  try {
    const supportedLanguages = [
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'C#',
      'HTML',
      'CSS',
      'SQL',
    ];
    const counts = new Map(supportedLanguages.map((language) => [language, 0]));
    const posts = await dbConnMongo
      .collection('posts')
      .find({}, { projection: { contentBlocks: 1, 'comments.contentBlocks': 1 } })
      .toArray();

    for (const post of posts) {
      countCodeBlocks(post.contentBlocks, counts);
      for (const comment of post.comments || []) {
        countCodeBlocks(comment.contentBlocks, counts);
      }
    }

    const trendingLanguages = supportedLanguages
      .map((language) => ({ language, count: counts.get(language) || 0 }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 5);

    return res.send(trendingLanguages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
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
    await normalizePostComments(posts);
    await normalizePostComments(reposts);
    await addAuthorAvatars(reposts);

    let likes = 0;
    let comments = 0;

    for (const post of posts) {
      likes += post.likes || 0;
      comments += post.comments?.length || 0;
    }

    const cv = await dbConnMongo
      .collection('cvs')
      .findOne({ userId: userId }, { projection: { _id: 1 } });

    dbConn.query(
      'SELECT JSON_LENGTH(followers) AS followers, profile_views FROM users WHERE userId = ?',
      [userId],
      function (error, results) {
        if (error) {
          return res.status(500).json({ message: 'Database error: ' + error });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.send({
          posts,
          likes,
          comments,
          reposts,
          followers: results[0].followers,
          views: results[0].profile_views,
          hasCv: cv !== null,
        });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.get('/getSavedPosts', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const savedPosts = await dbConnMongo
      .collection('posts')
      .find({ savedByUserIds: userId })
      .toArray();
    await normalizePostComments(savedPosts);
    await addAuthorAvatars(savedPosts);

    const savedPostsWithState = savedPosts.map((post) => ({
      ...post,
      liked: (post.likedByUserIds || []).includes(userId),
      reposted: (post.repostedByUserIds || []).includes(userId),
      saved: true,
    }));

    return res.send({ posts: savedPostsWithState });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.get('/getAllInfoFromUser/:username', async function (req, res) {
  try {
    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT userId, username, display_name, bio, stack, status, location, avatar_url, cover_url, job_title, company, portfolio_url, created_at, followers, profile_views, JSON_LENGTH(followers) AS followersCount FROM users WHERE username = ?',
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

    if (viewerId !== null && Number(viewerId) !== Number(account.userId)) {
      await new Promise((resolve, reject) => {
        dbConn.query(
          `UPDATE users
           SET profile_viewer_ids = JSON_ARRAY_APPEND(profile_viewer_ids, '$', ?),
               profile_views = profile_views + 1
           WHERE userId = ?
             AND NOT JSON_CONTAINS(profile_viewer_ids, CAST(? AS JSON))`,
          [viewerId, account.userId, viewerId],
          function (error) {
            if (error) return reject(error);
            resolve();
          },
        );
      });
    }

    const profileViews = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT profile_views FROM users WHERE userId = ?',
        [account.userId],
        function (error, results) {
          if (error) return reject(error);
          resolve(results[0].profile_views);
        },
      );
    });

    const posts = await dbConnMongo
      .collection('posts')
      .find({ username: account.username })
      .toArray();
    const reposts = await dbConnMongo
      .collection('posts')
      .find({ repostedByUserIds: account.userId })
      .toArray();
    await normalizePostComments(posts);
    await normalizePostComments(reposts);
    await addAuthorAvatars(reposts);

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

    const cv = await dbConnMongo
      .collection('cvs')
      .findOne({ userId: account.userId }, { projection: { _id: 1 } });

    return res.send({
      user: {
        ...account,
        stack,
        followers: followerIds,
        profile_views: profileViews,
        location: account.location || 'Unknown',
        cover_url: account.cover_url,
      },
      posts: postsWithViewerState,
      likes,
      comments,
      reposts,
      followers: account.followersCount,
      isFollowing:
        viewerId !== null && followerIds.some((followerId) => Number(followerId) === viewerId),
      hasCv: cv !== null,
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
      dbConn.query(
        'SELECT followers FROM users WHERE userId = ?',
        [userId],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
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

app.post('/registerPostView', async function (req, res) {
  try {
    const postId = req.body.postId;
    if (typeof postId !== 'string' || !ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const post = await dbConnMongo
        .collection('posts')
        .findOne({ _id: new ObjectId(postId) }, { projection: { views: 1 } });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      return res.send({ views: post.views || 0 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);

    const postObjectId = new ObjectId(postId);
    const post = await dbConnMongo.collection('posts').findOne({ _id: postObjectId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor =
      post.authorId === decoded.userId ||
      (post.authorId === undefined && decoded.username === post.username);
    if (!isAuthor) {
      await dbConnMongo.collection('posts').updateOne(
        { _id: postObjectId, viewedByUserIds: { $ne: decoded.userId } },
        {
          $addToSet: { viewedByUserIds: decoded.userId },
          $inc: { views: 1 },
        },
      );
    }

    const updatedPost = await dbConnMongo
      .collection('posts')
      .findOne({ _id: postObjectId }, { projection: { views: 1 } });

    return res.send({ views: updatedPost.views || 0 });
  } catch (error) {
    const status =
      error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : 500;
    return res.status(status).json({ message: error.message });
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

app.post('/updateSaved', async function (req, res) {
  try {
    const postId = new ObjectId(req.body.postId);

    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    let saved = false;

    const result = await dbConnMongo
      .collection('posts')
      .updateOne(
        { _id: postId, savedByUserIds: { $ne: userId } },
        { $addToSet: { savedByUserIds: userId } },
      );

    if (result.modifiedCount === 1) {
      saved = true;
    } else {
      await dbConnMongo
        .collection('posts')
        .updateOne(
          { _id: postId, savedByUserIds: userId },
          { $pull: { savedByUserIds: userId } },
        );
      saved = false;
    }

    return res.send({ saved: saved });
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

app.post('/updateProfile', async function (req, res) {
  try {
    const decoded = jwt.verify(getDecodedToken(req), JWT_SECRET);
    const displayName =
      typeof req.body.display_name === 'string' ? req.body.display_name.trim() : '';
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const location =
      typeof req.body.location === 'string' ? req.body.location.trim() || 'Unknown' : 'Unknown';
    const jobTitle = String(req.body.job_title || '').trim();
    const company = String(req.body.company || '').trim();
    const portfolioUrl = String(req.body.portfolio_url || '').trim();

    if (
      !displayName ||
      displayName.length > 100 ||
      !username ||
      username.length > 100 ||
      location.length > 100 ||
      jobTitle.length > 100 ||
      company.length > 100
    ) {
      return res.status(400).json({ message: 'Please enter valid profile details' });
    }
    if (portfolioUrl && (!/^https?:\/\/.+/i.test(portfolioUrl) || portfolioUrl.length > 500)) {
      return res.status(400).json({ message: 'Please enter a valid portfolio URL' });
    }

    dbConn.query(
      'UPDATE users SET display_name = ?, username = ?, location = ?, job_title = ?, company = ?, portfolio_url = ? WHERE userId = ?',
      [
        displayName,
        username,
        location,
        jobTitle || null,
        company || null,
        portfolioUrl || null,
        decoded.userId,
      ],
      async function (error, results) {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'That username is already taken' });
          }
          return res.status(500).json({ message: 'Database error: ' + error });
        }
        const token = jwt.sign({ userId: decoded.userId, username }, JWT_SECRET, {
          expiresIn: '24h',
        });
        if (decoded.username !== username) {
          try {
            await dbConnMongo
              .collection('posts')
              .updateMany({ username: decoded.username }, { $set: { username } });
            await dbConnMongo
              .collection('posts')
              .updateMany(
                { 'comments.username': decoded.username },
                { $set: { 'comments.$[comment].username': username } },
                { arrayFilters: [{ 'comment.username': decoded.username }] },
              );
          } catch (mongoError) {
            console.error('Could not update historical usernames:', mongoError);
          }
        }

        return res.json({
          token,
          user: {
            userId: decoded.userId,
            username,
            display_name: displayName,
            location,
            job_title: jobTitle || null,
            company: company || null,
            portfolio_url: portfolioUrl || null,
          },
        });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/updateStack', async function (req, res) {
  try {
    const decoded = jwt.verify(getDecodedToken(req), JWT_SECRET);
    const stack = req.body.stack;
    if (
      !Array.isArray(stack) ||
      stack.length > 50 ||
      stack.some(
        (technology) =>
          typeof technology !== 'string' || !technology.trim() || technology.length > 50,
      )
    ) {
      return res.status(400).json({ message: 'Please enter a valid technology list' });
    }

    dbConn.query(
      'UPDATE users SET stack = ? WHERE userId = ?',
      [JSON.stringify([...new Set(stack.map((technology) => technology.trim()))]), decoded.userId],
      function (error, results) {
        if (error) return res.status(500).json({ message: 'Database error: ' + error });
        return res.json({ stack: [...new Set(stack.map((technology) => technology.trim()))] });
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

app.post('/updateCover', async function (req, res) {
  try {
    const decoded = jwt.verify(getDecodedToken(req), JWT_SECRET);
    const cover_url = typeof req.body.cover_url === 'string' ? req.body.cover_url.trim() : '';
    if (cover_url && (!/^https?:\/\/.+/i.test(cover_url) || cover_url.length > 500)) {
      return res.status(400).json({ message: 'Please enter a valid image URL' });
    }

    dbConn.query(
      'UPDATE users SET cover_url = ? WHERE userId = ?',
      [cover_url || null, decoded.userId],
      function (error, results) {
        if (error) return res.status(500).json({ message: 'Database error: ' + error });
        return res.json({ cover_url });
      },
    );
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/uploadCv', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const fileName = String(req.body.file_name || 'cv.pdf');
    const data = String(req.body.data || '');
    const prefix = 'data:application/pdf;base64,';

    if (!data.startsWith(prefix)) {
      return res.status(400).json({ message: 'Please choose a PDF file' });
    }
    // 5 MB of PDF are about 7 MB in base64
    if (data.length > 7 * 1024 * 1024) {
      return res.status(400).json({ message: 'The PDF must be 5 MB or less' });
    }

    await dbConnMongo.collection('cvs').updateOne(
      { userId: decoded.userId },
      {
        $set: {
          userId: decoded.userId,
          file_name: fileName,
          data: data.slice(prefix.length),
          uploadedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return res.send({ hasCv: true });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.get('/cv/:userId', async function (req, res) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const cv = await dbConnMongo.collection('cvs').findOne({ userId: userId });
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="' + encodeURIComponent(cv.file_name) + '"');
    return res.send(Buffer.from(cv.data, 'base64'));
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    const type = req.body.type || 'post';
    if (type !== 'post' && type !== 'question') {
      return res.status(400).json({ message: 'Invalid post type' });
    }
    if (contentBlocks !== undefined && !isValidContentBlocks(contentBlocks)) {
      return res.status(400).json({ message: 'Invalid post content blocks' });
    }

    const createdAt = new Date();
    const reposts = 0;
    const views = 0;
    const likes = 0;
    const comments = [];

    const result = await dbConnMongo.collection('posts').insertOne({
      username,
      authorId: decoded.userId,
      type,
      acceptedAnswerIds: [],
      content,
      contentBlocks,
      tags,
      createdAt,
      reposts,
      views,
      likes,
      comments,
      likedByUserIds: [],
      viewedByUserIds: [],
      savedByUserIds: [],
    });

    return res.send({
      post: {
        _id: result.insertedId,
        username,
        authorId: decoded.userId,
        type,
        acceptedAnswerIds: [],
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
    const contentBlocks = req.body.contentBlocks;
    if (contentBlocks !== undefined && !isValidContentBlocks(contentBlocks)) {
      return res.status(400).json({ message: 'Invalid comment content blocks' });
    }
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
      answerId: new ObjectId().toString(),
      username,
      content,
      contentBlocks,
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

app.post('/toggleAcceptedAnswer', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const { postId, answerId, accepted } = req.body;

    if (
      !ObjectId.isValid(postId) ||
      typeof answerId !== 'string' ||
      typeof accepted !== 'boolean'
    ) {
      return res.status(400).json({ message: 'Invalid answer selection' });
    }

    const postObjectId = new ObjectId(postId);
    const post = await dbConnMongo.collection('posts').findOne({ _id: postObjectId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.type !== 'question') {
      return res.status(400).json({ message: 'Only questions can have helpful answers' });
    }

    let isAuthor = false;
    if (post.authorId !== undefined) {
      isAuthor = String(post.authorId) === String(decoded.userId);
    } else {
      isAuthor = post.username === decoded.username;
    }
    if (!isAuthor) {
      return res.status(403).json({ message: 'Only the question author can mark answers' });
    }
    if (!(post.comments || []).some((comment) => comment.answerId === answerId)) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    let update;
    if (accepted) {
      update = { $addToSet: { acceptedAnswerIds: answerId } };
    } else {
      update = { $pull: { acceptedAnswerIds: answerId } };
    }
    await dbConnMongo.collection('posts').updateOne({ _id: postObjectId }, update);

    const updatedPost = await dbConnMongo
      .collection('posts')
      .findOne({ _id: postObjectId }, { projection: { acceptedAnswerIds: 1 } });
    return res.send({ acceptedAnswerIds: updatedPost.acceptedAnswerIds || [] });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

// PROJECTS SERVICE

app.get('/getProjects/:userId', async function (req, res) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const projects = await dbConnMongo
      .collection('projects')
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    const collaborations = await dbConnMongo
      .collection('projects')
      .find({ collaboratorIds: userId })
      .sort({ createdAt: -1 })
      .toArray();
    await addProjectUsers(projects);
    await addProjectUsers(collaborations);

    return res.send({ projects, collaborations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/getProjectInvitations', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);

    const invitations = await dbConnMongo
      .collection('projects')
      .find({ invitedUserIds: decoded.userId })
      .sort({ createdAt: -1 })
      .toArray();
    await addProjectUsers(invitations);

    return res.send(invitations);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

app.post('/createProject', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);

    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const image_url = String(req.body.image_url || '').trim();
    const git_url = String(req.body.git_url || '').trim();
    const status = req.body.status;
    const start_date = String(req.body.start_date || '');
    const end_date = String(req.body.end_date || '');
    const collaborators = req.body.collaborators || [];

    const fieldsError = validateProjectFields(name, description, image_url, git_url, status);
    if (fieldsError) {
      return res.status(400).json({ message: fieldsError });
    }
    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ message: 'Invalid collaborators list' });
    }

    const invitedUserIds = [];
    if (collaborators.length > 0) {
      const users = await new Promise((resolve, reject) => {
        dbConn.query(
          'SELECT userId, username FROM users WHERE username IN (?)',
          [collaborators],
          function (error, results) {
            if (error) return reject(error);
            resolve(results);
          },
        );
      });

      for (const username of collaborators) {
        const user = users.find(
          (item) => item.username.toLowerCase() === String(username).toLowerCase(),
        );
        if (!user) {
          return res.status(404).json({ message: 'User ' + username + ' not found' });
        }
        if (user.userId !== decoded.userId && !invitedUserIds.includes(user.userId)) {
          invitedUserIds.push(user.userId);
        }
      }
    }

    const project = {
      ownerId: decoded.userId,
      name,
      description,
      image_url,
      git_url,
      status,
      start_date,
      end_date,
      collaboratorIds: [],
      invitedUserIds,
      createdAt: new Date(),
    };
    await dbConnMongo.collection('projects').insertOne(project);
    await addProjectUsers([project]);

    return res.send({ project });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/inviteCollaborator', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;
    const username = String(req.body.username || '').trim();

    if (!ObjectId.isValid(projectId) || !username) {
      return res.status(400).json({ message: 'Invalid invitation' });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo.collection('projects').findOne({ _id: projectObjectId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId !== decoded.userId) {
      return res.status(403).json({ message: 'Only the project owner can invite collaborators' });
    }

    const users = await new Promise((resolve, reject) => {
      dbConn.query(
        'SELECT userId FROM users WHERE username = ?',
        [username],
        function (error, results) {
          if (error) return reject(error);
          resolve(results);
        },
      );
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const invitedId = users[0].userId;
    if (invitedId === decoded.userId) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }
    if ((project.collaboratorIds || []).includes(invitedId)) {
      return res.status(400).json({ message: 'That user is already a collaborator' });
    }

    await dbConnMongo
      .collection('projects')
      .updateOne({ _id: projectObjectId }, { $addToSet: { invitedUserIds: invitedId } });

    const updatedProject = await dbConnMongo
      .collection('projects')
      .findOne({ _id: projectObjectId });
    await addProjectUsers([updatedProject]);

    return res.send({ project: updatedProject });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/respondProjectInvitation', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;
    const accepted = req.body.accepted;

    if (!ObjectId.isValid(projectId) || typeof accepted !== 'boolean') {
      return res.status(400).json({ message: 'Invalid invitation answer' });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo
      .collection('projects')
      .findOne({ _id: projectObjectId, invitedUserIds: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    let update;
    if (accepted) {
      update = {
        $pull: { invitedUserIds: decoded.userId },
        $addToSet: { collaboratorIds: decoded.userId },
      };
    } else {
      update = { $pull: { invitedUserIds: decoded.userId } };
    }
    await dbConnMongo.collection('projects').updateOne({ _id: projectObjectId }, update);

    return res.send({ accepted });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/updateProject', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const image_url = String(req.body.image_url || '').trim();
    const git_url = String(req.body.git_url || '').trim();
    const status = req.body.status;
    const start_date = String(req.body.start_date || '');
    const end_date = String(req.body.end_date || '');

    const fieldsError = validateProjectFields(name, description, image_url, git_url, status);
    if (fieldsError) {
      return res.status(400).json({ message: fieldsError });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo.collection('projects').findOne({ _id: projectObjectId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId !== decoded.userId) {
      return res.status(403).json({ message: 'Only the project owner can edit it' });
    }

    await dbConnMongo.collection('projects').updateOne(
      { _id: projectObjectId },
      { $set: { name, description, image_url, git_url, status, start_date, end_date } },
    );

    const updatedProject = await dbConnMongo
      .collection('projects')
      .findOne({ _id: projectObjectId });
    await addProjectUsers([updatedProject]);

    return res.send({ project: updatedProject });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/deleteProject', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo.collection('projects').findOne({ _id: projectObjectId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId !== decoded.userId) {
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    }

    await dbConnMongo.collection('projects').deleteOne({ _id: projectObjectId });

    return res.send({ message: 'Project deleted' });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/removeCollaborator', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;
    const userId = Number(req.body.userId);

    if (!ObjectId.isValid(projectId) || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid collaborator' });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo.collection('projects').findOne({ _id: projectObjectId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId !== decoded.userId) {
      return res.status(403).json({ message: 'Only the project owner can remove collaborators' });
    }

    await dbConnMongo
      .collection('projects')
      .updateOne(
        { _id: projectObjectId },
        { $pull: { collaboratorIds: userId, invitedUserIds: userId } },
      );

    const updatedProject = await dbConnMongo
      .collection('projects')
      .findOne({ _id: projectObjectId });
    await addProjectUsers([updatedProject]);

    return res.send({ project: updatedProject });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

app.post('/leaveProject', async function (req, res) {
  try {
    const token = getDecodedToken(req);
    const decoded = jwt.verify(token, JWT_SECRET);
    const projectId = req.body.projectId;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const projectObjectId = new ObjectId(projectId);
    const project = await dbConnMongo
      .collection('projects')
      .findOne({ _id: projectObjectId, collaboratorIds: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'You are not a collaborator of this project' });
    }

    await dbConnMongo
      .collection('projects')
      .updateOne({ _id: projectObjectId }, { $pull: { collaboratorIds: decoded.userId } });

    return res.send({ message: 'You left the project' });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Invalid token' });
  }
});

function getDecodedToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token provided');
  return token;
}

async function addAuthorAvatars(posts) {
  if (posts.length === 0) return;

  const usernames = posts.map((post) => post.username);
  const users = await new Promise((resolve, reject) => {
    dbConn.query(
      'SELECT username, avatar_url FROM users WHERE username IN (?)',
      [usernames],
      function (error, results) {
        if (error) return reject(error);
        resolve(results);
      },
    );
  });

  for (const post of posts) {
    const author = users.find((user) => user.username === post.username);
    if (author) {
      post.avatar_url = author.avatar_url;
    }
  }
}

function validateProjectFields(name, description, image_url, git_url, status) {
  if (!name || name.length > 100 || description.length > 1000) {
    return 'Please enter a valid project name and description';
  }
  if (status !== 'in_progress' && status !== 'finished') {
    return 'Invalid project status';
  }
  if (image_url && !/^https?:\/\/.+/i.test(image_url)) {
    return 'Please enter a valid image URL';
  }
  if (git_url && !/^https?:\/\/.+/i.test(git_url)) {
    return 'Please enter a valid Git URL';
  }
  return '';
}

async function addProjectUsers(projects) {
  let userIds = [];
  for (const project of projects) {
    userIds.push(project.ownerId);
    userIds = userIds.concat(project.collaboratorIds || [], project.invitedUserIds || []);
  }
  if (userIds.length === 0) return;

  const users = await new Promise((resolve, reject) => {
    dbConn.query(
      'SELECT userId, username, display_name, avatar_url FROM users WHERE userId IN (?)',
      [userIds],
      function (error, results) {
        if (error) return reject(error);
        resolve(results);
      },
    );
  });

  for (const project of projects) {
    project.owner = users.find((user) => user.userId === project.ownerId);
    project.collaborators = users.filter((user) =>
      (project.collaboratorIds || []).includes(user.userId),
    );
    project.invited = users.filter((user) => (project.invitedUserIds || []).includes(user.userId));
  }
}

async function normalizePostComments(posts) {
  for (const post of posts) {
    if (!Array.isArray(post.comments)) continue;

    let changed = false;
    const comments = post.comments.map((comment) => {
      if (!comment || typeof comment !== 'object' || comment.answerId) return comment;
      changed = true;
      return { ...comment, answerId: new ObjectId().toString() };
    });

    if (changed) {
      await dbConnMongo.collection('posts').updateOne({ _id: post._id }, { $set: { comments } });
      post.comments = comments;
    }
  }
}

function isValidContentBlocks(contentBlocks) {
  if (!Array.isArray(contentBlocks) || contentBlocks.length > 50) return false;

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

  return contentBlocks.every((block) => {
    if (
      !block ||
      (block.type !== 'text' && block.type !== 'code') ||
      typeof block.content !== 'string'
    ) {
      return false;
    }
    return (
      block.type === 'text' ||
      (supportedLanguages.includes(block.language) && supportedThemes.includes(block.theme))
    );
  });
}

function countCodeBlocks(contentBlocks, counts) {
  for (const block of contentBlocks || []) {
    if (block?.type === 'code' && counts.has(block.language)) {
      counts.set(block.language, counts.get(block.language) + 1);
    }
  }
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
  const coverColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'cover_url'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!coverColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query('ALTER TABLE users ADD COLUMN cover_url VARCHAR(500) NULL', (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  const profileViewsColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'profile_views'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!profileViewsColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query('ALTER TABLE users ADD COLUMN profile_views INT NOT NULL DEFAULT 0', (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  const profileViewerIdsColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'profile_viewer_ids'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!profileViewerIdsColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query(
        'ALTER TABLE users ADD COLUMN profile_viewer_ids JSON NOT NULL DEFAULT (JSON_ARRAY())',
        (error) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }

  const lastSeenColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'last_seen_at'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!lastSeenColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query(
        'ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL DEFAULT NULL',
        (error) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }

  const jobTitleColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'job_title'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!jobTitleColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query('ALTER TABLE users ADD COLUMN job_title VARCHAR(100) NULL', (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  const companyColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'company'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!companyColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query('ALTER TABLE users ADD COLUMN company VARCHAR(100) NULL', (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  const portfolioColumnExists = await new Promise((resolve, reject) => {
    dbConn.query("SHOW COLUMNS FROM users LIKE 'portfolio_url'", (error, rows) => {
      if (error) return reject(error);
      resolve(rows.length > 0);
    });
  });
  if (!portfolioColumnExists) {
    await new Promise((resolve, reject) => {
      dbConn.query('ALTER TABLE users ADD COLUMN portfolio_url VARCHAR(500) NULL', (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  dbConnMongo = await mongoConnection();
  if (!dbConnMongo) {
    console.error('Mongo no conectado. No arrancando server');
    return;
  }
  app.listen(3000, () => console.log('Node app is running on port 3000'));
}
startServer();
