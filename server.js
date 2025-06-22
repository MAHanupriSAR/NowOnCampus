const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'mahe1972',
  database: 'nowoncampus'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

//////////////////////////////////////////////////////////////////////////////////////////////
// Signup endpoint
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  try {
    // Check if email already exists
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)',
      [`${firstName} ${lastName}`, email, hashedPassword, 0]
    );
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // 2. Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Create session or JWT token (simplified example)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    };

    res.status(200).json({ 
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////
//Admin Management
// Create Admin endpoint
app.post('/createAdmin', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.promise().query(
      'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 1]
    );
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
}); 

app.get('/admins', async (req, res) => {
  try {
    const [admins] = await db.promise().query(
      'SELECT id, name, email FROM users WHERE isAdmin = 1'
    );
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

app.post('/updateAdminPassword', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.promise().query(
      'UPDATE users SET password = ? WHERE email = ? AND isAdmin = 1',
      [hashedPassword, email]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/deleteAdmin', async (req, res) => {
  const { email } = req.body;
  try {
    await db.promise().query(
      'DELETE FROM users WHERE email = ? AND isAdmin = 1',
      [email]
    );
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////
//student management
app.get('/students', async (req, res) => {
  try {
    const [students] = await db.promise().query(
      'SELECT id, name, email FROM users WHERE isAdmin = 0'
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/updateStudentPassword', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.promise().query(
      'UPDATE users SET password = ? WHERE email = ? AND isAdmin = 0',
      [hashedPassword, email]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update student password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/deleteStudent', async (req, res) => {
  const { email } = req.body;
  try {
    await db.promise().query(
      'DELETE FROM users WHERE email = ? AND isAdmin = 0',
      [email]
    );
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////
//event management
app.post('/createEvent', async (req, res) => {
  const {
    event_name,
    start_datetime,
    end_datetime,
    venue,
    event_type,
    department,
    capacity,
    organiser_name,
    agenda,
    description
  } = req.body;

  try {
    // Calculate event_status
    const now = new Date();
    const start = new Date(start_datetime);
    const end = new Date(end_datetime);
    let event_status = 'upcoming';
    if (now > end) {
      event_status = 'past';
    } else if (now >= start && now <= end) {
      event_status = 'ongoing';
    }

    await db.promise().query(
      `INSERT INTO events 
        (event_name, start_datetime, end_datetime, venue, event_type, department, capacity, organiser_name, agenda, description, event_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_name, start_datetime, end_datetime, venue, event_type, department, capacity, organiser_name, agenda, description, event_status]
    );
    res.json({ message: 'Event created successfully' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/events', async (req, res) => {
  try {
    const [events] = await db.promise().query(
      'SELECT * FROM events ORDER BY start_datetime DESC'
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/cancelEvent', async (req, res) => {
  const { event_id } = req.body;
  try {
    await db.promise().query(
      'UPDATE events SET event_status = "cancelled" WHERE event_id = ?',
      [event_id]
    );
    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

app.post('/deleteEvent', async (req, res) => {
  const { event_id } = req.body;
  try {
    await db.promise().query(
      'DELETE FROM events WHERE event_id = ?',
      [event_id]
    );
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.get('/event/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query('SELECT * FROM events WHERE event_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.post('/updateEvent', async (req, res) => {
  const {
    event_id,
    event_name,
    start_datetime,
    end_datetime,
    venue,
    event_type,
    department,
    capacity,
    organiser_name,
    agenda,
    description,
    event_status // get from request
  } = req.body;
  try {
    await db.promise().query(
      `UPDATE events SET 
        event_name = ?, start_datetime = ?, end_datetime = ?, venue = ?, event_type = ?, department = ?, capacity = ?, organiser_name = ?, agenda = ?, description = ?, event_status = ?
       WHERE event_id = ?`,
      [event_name, start_datetime, end_datetime, venue, event_type, department, capacity, organiser_name, agenda, description, event_status, event_id]
    );
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.get('/adminStats', async (req, res) => {
  try {
    const [[{ totalEvents }]] = await db.promise().query('SELECT COUNT(*) AS totalEvents FROM events');
    const [[{ activeEvents }]] = await db.promise().query('SELECT COUNT(*) AS activeEvents FROM events WHERE event_status IN ("upcoming", "ongoing")');
    const [[{ totalAdmins }]] = await db.promise().query('SELECT COUNT(*) AS totalAdmins FROM users WHERE isAdmin = 1');
    const [[{ totalStudents }]] = await db.promise().query('SELECT COUNT(*) AS totalStudents FROM users WHERE isAdmin = 0');
    res.json({ totalEvents, activeEvents, totalAdmins, totalStudents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})