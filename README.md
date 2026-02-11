# TaskFlow
Full Stack Task Master
A full-featured, secure, persistent Todo application with authentication and user-scoped data.

🚀 Overview

TaskFlow is a full-stack Todo application designed to demonstrate production-ready architecture, secure authentication, and scalable CRUD operations.

Each user can securely create an account, log in, and manage their own persistent task list with full state control (create, update, complete, delete, filter, sort).

This project focuses on:

Secure user authentication

User-isolated data

Persistent storage

Clean architecture

Scalable backend design

Production deployment readiness

✨ Core Features
🔐 Authentication

User registration

Secure login/logout

Password hashing (bcrypt)

JWT-based authentication

Protected API routes

User-scoped task isolation

📝 Todo Management (Full CRUD)

Create new tasks

Edit existing tasks

Mark tasks as complete/incomplete

Delete tasks

Archive tasks (optional soft delete)

Filter: All / Active / Completed

Sort by: Date / Priority / Due Date

💾 Persistent Storage

Tasks stored in database

Each task linked to a specific userId

Timestamps (createdAt, updatedAt)

Optional metadata:

Description

Due date

Priority level

Tags

🎨 UX Features

Responsive UI

Optimistic updates

Loading states

Empty state handling

Error feedback

Dark mode (optional)

🧠 Architecture
Frontend

React / Next.js

TypeScript

Tailwind CSS

Axios or Fetch API

Backend

Node.js

Express.js

REST API structure

JWT authentication middleware

Database

MongoDB (Atlas)

Mongoose ODM

Deployment

Frontend: Vercel

Backend: Render

Database: MongoDB Atlas

📂 Project Structure
taskflow/
│
├── client/                 # Frontend (React / Next.js)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── server/                 # Backend API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
│
└── README.md

🗃️ Database Schema
User Schema
{
  email: String,
  password: String, // hashed
  createdAt: Date
}

Todo Schema
{
  userId: ObjectId,
  title: String,
  description: String,
  completed: Boolean,
  priority: "low" | "medium" | "high",
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}

🔐 Security Considerations

Passwords hashed with bcrypt

JWT stored in HttpOnly cookies (recommended)

Protected routes with middleware

Input validation & sanitization

Rate limiting (recommended for production)

CORS configuration

⚙️ API Endpoints
Auth Routes
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

Todo Routes
GET    /api/todos
POST   /api/todos
PUT    /api/todos/:id
DELETE /api/todos/:id
PATCH  /api/todos/:id/toggle

🧪 Future Improvements

🔄 Real-time updates (WebSockets)

📱 Mobile PWA support

🔔 Due date reminders

👥 Team mode (shared boards)

📊 Productivity analytics dashboard

🗂️ Drag-and-drop reordering

📦 Docker containerization

🧵 Role-based access control

🛠️ Local Development Setup
1️⃣ Clone the repo
git clone https://github.com/yourusername/taskflow.git
cd taskflow

2️⃣ Install dependencies
cd server
npm install

cd ../client
npm install

3️⃣ Environment Variables

Create .env file in server/:

PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_super_secret_key

4️⃣ Run development servers
# backend
npm run dev

# frontend
npm run dev

🎯 Purpose

This project demonstrates:

Full-stack application design

Secure authentication implementation

REST API best practices

Database modeling

Clean folder architecture

Production deployment workflow

📜 License

MIT License
