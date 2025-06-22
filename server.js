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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});