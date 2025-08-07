CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  isAdmin TINYINT(1) DEFAULT 0
);

-- CREATE TABLE events (
--     event_id INT AUTO_INCREMENT PRIMARY KEY,
--     event_name VARCHAR(255) NOT NULL,
--     start_datetime DATETIME NOT NULL,
--     end_datetime DATETIME NOT NULL,
--     venue VARCHAR(255) NOT NULL,
--     event_type VARCHAR(100) DEFAULT 'unlisted',
--     department VARCHAR(100), -- Optional
--     capacity INT NOT NULL,
--     organiser_name VARCHAR(255), -- Optional
--     agenda TEXT, -- Optional
--     description TEXT NOT NULL,
    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

CREATE TABLE events (
    event_id INT NOT NULL AUTO_INCREMENT,
    event_name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) DEFAULT 'unlisted',
    department VARCHAR(100),
    capacity INT NOT NULL,
    organiser_name VARCHAR(255),
    agenda TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    registrations INT DEFAULT 0,
    event_status ENUM('upcoming', 'ongoing', 'past', 'cancelled'),
    PRIMARY KEY (event_id)
);

create table register(user_id INT, event_id INT);
create table wishlist(user_id INT, event_id INT);

INSERT INTO users (name, email, password, isAdmin)
VALUES ('admin', 'admin@gmail.com', 'admin', 1);