CREATE DATABASE IF NOT EXISTS devconnectBD;

USE devconnectBD;

CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    stack JSON NOT NULL,
    followers JSON NOT NULL DEFAULT(JSON_ARRAY()),
    status ENUM('active', 'offline') NOT NULL DEFAULT 'offline',
    location VARCHAR(100) DEFAULT 'Unknown',
    avatar_url VARCHAR(500) DEFAULT 'https://i.pinimg.com/474x/16/e3/16/16e31690d95888a1532ea992b8f3ddf4.jpg',
    cover_url VARCHAR(500),
    job_title VARCHAR(100),
    company VARCHAR(100),
    portfolio_url VARCHAR(500),
    profile_views INT NOT NULL DEFAULT 0,
    profile_viewer_ids JSON NOT NULL DEFAULT(JSON_ARRAY()),
    last_seen_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER USER 'root' @'localhost' IDENTIFIED
WITH
    mysql_native_password BY 'password';

flush privileges;