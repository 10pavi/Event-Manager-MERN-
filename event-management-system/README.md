# 🎟️ Event Manager – MERN Stack

A full-stack event management web application built using the MERN stack. It allows users to explore upcoming events and register their interest, while administrators can manage events and view participant details.

## ✨ Features

### 👤 User

* User registration and login
* Browse and view event details
* View registered events in **My Events**
* Register interest in events
* Cancel event registrations

### 🛠️ Admin

* Secure admin login
* Create, update, and delete events
* View event participants
* View participant statistics
* Track recent activities, including event creation, updates, deletions, and registrations

## 🧰 Technologies Used

**Frontend**

* React.js
* Vite
* React Router
* CSS

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs

## 📁 Project Structure

```text
Event-Manager-MERN/
└── event-management-system/
    ├── backend/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── server.js
    │   └── package.json
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── public/
    ├── package.json
    └── README.md
```

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/10pavi/Event-Manager-MERN-.git
```

### 2. Navigate to the project

```bash
cd event-management-system
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Configure environment variables

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Use your own MongoDB connection string and a private JWT secret. **Do not commit your `.env` file or credentials to GitHub.**

### 6. Start the backend

From the `backend` folder, run:

```bash
node server.js
```

### 7. Start the frontend

Open another terminal in the `event-management-system` folder and run:

```bash
npm run dev
```

Open the local URL shown in your terminal, usually `http://localhost:5173`.

## 🎨 UI Theme

The application uses a light yellow and teal color theme for a clean, user-friendly interface.

## 🔐 Authentication

* JWT-based authentication
* Password hashing with bcryptjs
* Role-based access for users and administrators
* Protected routes for authorized pages

## 🚀 Future Improvements

* Event image uploads
* Email notifications
* Advanced event search and filtering
* Online deployment

## 👩‍💻 Author

**Pavithra K**

Computer Science and Engineering Student

---

⭐ If you find this project useful, feel free to explore the repository!
