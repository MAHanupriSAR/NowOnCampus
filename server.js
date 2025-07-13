require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
// app.post('/signup', async (req, res) => {
//   const { firstName, lastName, email, password } = req.body;
  
//   try {
//     // Check if email already exists
//     const [existingUsers] = await db.promise().query(
//       'SELECT * FROM users WHERE email = ?',
//       [email]
//     );
    
//     if (existingUsers.length > 0) {
//       return res.status(400).json({ error: 'Email already in use' });
//     }
    
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
    
//     // Insert new user
//     const [result] = await db.promise().query(
//       'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)',
//       [`${firstName} ${lastName}`, email, hashedPassword, 0]
//     );
    
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ error: 'Registration failed' });
//   }
// });
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
    
    // Send confirmation email
    const mailOptions = {
      from: 'your-email@gmail.com', // Replace with your Gmail
      to: email,
      subject: 'Welcome to NowOnCampus - Registration Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to NowOnCampus!</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Thank you for registering with NowOnCampus! Your account has been successfully created.</p>
          <p>Here are your account details:</p>
          <ul>
            <li><strong>Name:</strong> ${firstName} ${lastName}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <p>You can now log in to your account and start exploring campus events and activities.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <br>
          <p>Best regards,<br>The NowOnCampus Team</p>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({ message: 'User registered successfully. Check your email for confirmation!' });
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
// app.post('/createAdmin', async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     const [existingUsers] = await db.promise().query(
//       'SELECT * FROM users WHERE email = ?',
//       [email]
//     );
//     if (existingUsers.length > 0) {
//       return res.status(400).json({ error: 'Email already in use' });
//     }
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     await db.promise().query(
//       'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)',
//       [name, email, hashedPassword, 1]
//     );
//     res.status(201).json({ message: 'Admin created successfully' });
//   } catch (error) {
//     console.error('Create admin error:', error);
//     res.status(500).json({ error: 'Failed to create admin' });
//   }
// }); 
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

    // Send welcome email to the newly created admin
    const mailOptions = {
      from: process.env.GMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Welcome to NowOnCampus - Admin Account Created!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 2rem; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
              <span style="margin-right: 8px; color: #fbbf24;">👨‍��</span>NowOnCampus
            </div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Admin Account Created Successfully</div>
          </div>
          
          <div style="padding: 2rem; color: #374151; line-height: 1.6;">
            <div style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">
              Welcome ${name}!
            </div>
            
            <div style="margin-bottom: 1.5rem; color: #6b7280;">
              Your admin account has been successfully created on NowOnCampus. You now have administrative privileges to manage the platform.
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <div style="font-size: 1.1rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
                Account Details
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #1e40af; text-align: center;">👤</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Name:</span>
                <span style="color: #6b7280; flex: 1;">${name}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #1e40af; text-align: center;">📧</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Email:</span>
                <span style="color: #6b7280; flex: 1;">${email}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #1e40af; text-align: center;">🔐</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Role:</span>
                <span style="color: #6b7280; flex: 1;">Administrator</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #1e40af; text-align: center;">📅</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Created:</span>
                <span style="color: #6b7280; flex: 1;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <div style="font-size: 1rem; font-weight: 600; color: #1e40af; margin-bottom: 1rem;">
                �� Your Admin Privileges
              </div>
              <ul style="margin: 0; padding-left: 1.5rem; color: #374151; font-size: 0.9rem;">
                <li style="margin-bottom: 0.5rem;">Create, edit, and delete campus events</li>
                <li style="margin-bottom: 0.5rem;">Manage student and admin accounts</li>
                <li style="margin-bottom: 0.5rem;">Reset user passwords</li>
                <li style="margin-bottom: 0.5rem;">View and manage event registrations</li>
                <li style="margin-bottom: 0.5rem;">Access comprehensive admin dashboard</li>
                <li style="margin-bottom: 0.5rem;">Monitor platform statistics</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="http://localhost:3000/html/admin_func.html" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">
                Access Admin Dashboard
              </a>
            </div>
            
            <div style="margin-bottom: 1.5rem; color: #6b7280; font-size: 0.9rem;">
              <strong>Next Steps:</strong>
              <ol style="margin-top: 0.5rem; padding-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;">Log in to your admin account using your email and password</li>
                <li style="margin-bottom: 0.5rem;">Explore the admin dashboard to familiarize yourself with the tools</li>
                <li style="margin-bottom: 0.5rem;">Start creating and managing campus events</li>
                <li style="margin-bottom: 0.5rem;">Monitor student registrations and platform activity</li>
              </ol>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 1rem; margin: 1.5rem 0; font-size: 0.9rem; color: #92400e;">
              <strong>🔒 Security Note:</strong> Please keep your login credentials secure and never share them with others. If you suspect any unauthorized access, contact the system administrator immediately.
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 1.5rem 2rem; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem;">
              Welcome to the NowOnCampus Admin Team!
            </div>
            <div style="margin-top: 0.5rem;">
              <a href="http://localhost:3000/html/home.html" style="color: #1e40af; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">Home</a>
              <a href="http://localhost:3000/html/admin_func.html" style="color: #1e40af; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">Admin Dashboard</a>
              <a href="http://localhost:3000/html/about.html" style="color: #1e40af; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">About</a>
            </div>
          </div>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({ message: 'Admin created successfully. Welcome email sent!' });
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Register for event
app.post('/registerEvent', async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    // Prevent duplicate registration
    const [rows] = await db.promise().query('SELECT * FROM register WHERE user_id = ? AND event_id = ?', [user_id, event_id]);
    if (rows.length > 0) return res.status(400).json({ error: 'Already registered' });

    // Get user details
    const [users] = await db.promise().query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];

    // Get event details
    const [events] = await db.promise().query('SELECT * FROM events WHERE event_id = ?', [event_id]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = events[0];

    // Register for event
    await db.promise().query('INSERT INTO register (user_id, event_id) VALUES (?, ?)', [user_id, event_id]);
    // Optionally increment registrations count in events table
    await db.promise().query('UPDATE events SET registrations = registrations + 1 WHERE event_id = ?', [event_id]);

    // Send confirmation email
    const mailOptions = {
      from: process.env.GMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: `Event Registration Confirmation - ${event.event_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 2rem; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
              <span style="margin-right: 8px; color: #fbbf24;">��</span>NowOnCampus
            </div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Event Registration Confirmation</div>
          </div>
          
          <div style="padding: 2rem; color: #374151; line-height: 1.6;">
            <div style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">
              Hello ${user.name}!
            </div>
            
            <div style="margin-bottom: 1.5rem; color: #6b7280;">
              Thank you for registering for the event! Your registration has been confirmed. Here are the event details:
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
              <div style="font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
                ${event.event_name}
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">📅</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Date & Time:</span>
                <span style="color: #6b7280; flex: 1;">${new Date(event.start_datetime).toLocaleDateString()} at ${new Date(event.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(event.end_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">📍</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Venue:</span>
                <span style="color: #6b7280; flex: 1;">${event.venue}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">🏷️</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Type:</span>
                <span style="color: #6b7280; flex: 1;">${event.event_type || 'General'}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">🏢</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Department:</span>
                <span style="color: #6b7280; flex: 1;">${event.department || 'All Departments'}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">👤</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Organizer:</span>
                <span style="color: #6b7280; flex: 1;">${event.organiser_name || 'Not specified'}</span>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 0.75rem; font-size: 0.9rem;">
                <span style="width: 20px; margin-right: 0.75rem; color: #3b82f6; text-align: center;">📊</span>
                <span style="font-weight: 600; color: #374151; min-width: 80px;">Status:</span>
                <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: ${event.event_status === 'upcoming' ? '#dbeafe' : event.event_status === 'ongoing' ? '#fef3c7' : event.event_status === 'past' ? '#f3f4f6' : '#fee2e2'}; color: ${event.event_status === 'upcoming' ? '#1e40af' : event.event_status === 'ongoing' ? '#92400e' : event.event_status === 'past' ? '#374151' : '#991b1b'};">${event.event_status}</span>
              </div>
              
              ${event.description ? `
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin-top: 1rem; font-size: 0.9rem; color: #4b5563; line-height: 1.5;">
                <strong>Description:</strong><br>
                ${event.description}
              </div>
              ` : ''}
              
              ${event.agenda ? `
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin-top: 1rem; font-size: 0.9rem; color: #4b5563; line-height: 1.5;">
                <strong>Agenda:</strong><br>
                ${event.agenda}
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
              <a href="http://localhost:3000/html/event_details.html?id=${event.event_id}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">
                View Event Details
              </a>
            </div>
            
            <div style="margin-bottom: 1.5rem; color: #6b7280; font-size: 0.9rem;">
              <strong>Important Notes:</strong>
              <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                <li>Please arrive 10-15 minutes before the event starts</li>
                <li>Bring any required materials or documents</li>
                <li>Check your email for any updates or changes</li>
                <li>Contact the organizer if you have any questions</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 1.5rem 2rem; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem;">
              Thank you for using NowOnCampus!
            </div>
            <div style="margin-top: 0.5rem;">
              <a href="http://localhost:3000/html/home.html" style="color: #3b82f6; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">Home</a>
              <a href="http://localhost:3000/html/events.html" style="color: #3b82f6; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">Events</a>
              <a href="http://localhost:3000/html/about.html" style="color: #3b82f6; text-decoration: none; font-size: 0.85rem; margin: 0 0.5rem;">About</a>
            </div>
          </div>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Registered successfully. Check your email for confirmation!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});
// app.get('/userRegisteredEvents', async (req, res) => {
//   const { user_id } = req.query;
//   try {
//     const [rows] = await db.promise().query('SELECT event_id FROM register WHERE user_id = ?', [user_id]);
//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch registered events' });
//   }
// });

app.get('/userRegisteredEvents', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.promise().query(
      'SELECT e.* FROM register r JOIN events e ON r.event_id = e.event_id WHERE r.user_id = ? ORDER BY e.start_datetime DESC',
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registered events' });
  }
});
app.post('/unregisterEvent', async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await db.promise().query('DELETE FROM register WHERE user_id = ? AND event_id = ?', [user_id, event_id]);
    // Optionally decrement registrations count in events table
    await db.promise().query('UPDATE events SET registrations = GREATEST(registrations - 1, 0) WHERE event_id = ?', [event_id]);
    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unregister' });
  }
});

// Add to wishlist
app.post('/wishlistEvent', async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    // Prevent duplicate wishlist
    const [rows] = await db.promise().query('SELECT * FROM wishlist WHERE user_id = ? AND event_id = ?', [user_id, event_id]);
    if (rows.length > 0) return res.status(400).json({ error: 'Already wishlisted' });

    await db.promise().query('INSERT INTO wishlist (user_id, event_id) VALUES (?, ?)', [user_id, event_id]);
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove from wishlist
app.post('/unwishlistEvent', async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await db.promise().query('DELETE FROM wishlist WHERE user_id = ? AND event_id = ?', [user_id, event_id]);
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// app.get('/userWishlist', async (req, res) => {
//   const { user_id } = req.query;
//   try {
//     const [rows] = await db.promise().query('SELECT event_id FROM wishlist WHERE user_id = ?', [user_id]);
//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch wishlist' });
//   }
// });
app.get('/userWishlist', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.promise().query(
      'SELECT e.* FROM wishlist w JOIN events e ON w.event_id = e.event_id WHERE w.user_id = ? ORDER BY e.start_datetime DESC',
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist events' });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//event_details.js
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//calender.js


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})