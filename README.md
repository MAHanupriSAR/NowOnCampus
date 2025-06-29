# NowOnCampus – Campus Event Management Web App

NowOnCampus is a full-stack web application for managing and discovering campus events. It enables students to browse, register, and wishlist events, while providing admins with tools to create, edit, and manage events and users. The platform features a personalized calendar, role-based navigation, and a responsive, modern UI.

## Features

- **Student Portal:**  
  - Browse, search, and filter campus events  
  - Register for events and add them to a wishlist  
  - View registered events on a personalized calendar  
  - Responsive design for desktop and mobile

- **Admin Dashboard:**  
  - Create, edit, and delete events  
  - Manage student and admin accounts  
  - Reset user passwords  
  - View and manage event registrations

- **General:**  
  - Secure authentication and role-based access  
  - Dynamic navigation bar based on user role
  - Consistent, accessible UI

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL (customize as per your setup)

## Setup & Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/MAHanupriSAR/NowOnCampus
    cd NowOnCampus
    ```

2. **Install backend dependencies:**
    ```bash
    npm install
    ```

3. **Set up the database:**
    - Import the provided `local.session.sql` file into your MySQL database:
      ```bash
      mysql -u yourusername -p yourdatabase < local.session.sql

4. **Start the backend server:**
    ```bash
    npm start
    ```

5. **Open the frontend:**
    - Open `html/home.html` in your browser, or serve the `html` folder using a local server.

## Screenshots

_Add screenshots of the home page, event details, calendar, and admin dashboard here._

## License

This project is licensed under the terms of the [MIT License](LICENSE).

---