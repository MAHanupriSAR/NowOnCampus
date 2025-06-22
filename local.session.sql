CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  isAdmin TINYINT(1) DEFAULT 0
);

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) DEFAULT 'unlisted',
    department VARCHAR(100), -- Optional
    capacity INT NOT NULL,
    organiser_name VARCHAR(255), -- Optional
    agenda TEXT, -- Optional
    description TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
