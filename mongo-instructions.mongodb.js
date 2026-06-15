use('devconnect');

db.getCollection('posts').deleteMany({"likes": 0})