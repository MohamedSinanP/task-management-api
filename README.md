# 🧩 Task Management Backend (Express + TypeScript)

This is a **backend** built using **Express.js**, **TypeScript**, and **MongoDB**, following the **MVC architecture**.  
It includes **JWT authentication**, **Socket.IO** for real-time updates, and **Node-Cron** for automated email reminders.

---

## 🚀 Features

- JWT-based Authentication (Access + Refresh tokens)
- Real-time communication with Socket.IO
- Node-Cron for scheduled email reminders
- Secure cookies for tokens
- MVC architecture for clean code structure
- MongoDB with Mongoose ORM
- Environment-based configuration with dotenv
- Email sending via Nodemailer

---

## 🧠 Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB + Mongoose**
- **Socket.IO**
- **Nodemailer**
- **Node-Cron**
- **JWT (jsonwebtoken)**

---

## 📂 Folder Structure

```
src/
├── config/           # DB and app configurations
├── controllers/      # Route controllers
├── models/           # Mongoose schemas
├── routes/           # Express route definitions
├── sockets/          # Socket.IO event handlers
├── utils/            # Utility functions
├── cron/             # Node-Cron jobs
└── index.ts          # Main entry file
```

---

## ⚙️ Environment Variables

Create a `.env` file at the root:

```
PORT=3001
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

MONGO_URI=your_mongodb_connection_string
NODE_ENV=production_or_development
ADMIN_PASSWORD=your_admin_password
ADMIN_EMAIL=your_admin_email@example.com
CLIENT_URL=https://your-frontend.vercel.app

SMTP_PASS=your_smtp_password
SMTP_USER=your_smtp_user
SMTP_PORT=your_smtp_port
SMTP_HOST=your_smtp_host
```

> ⚠️ Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your own credentials before deployment.

---

## ⚒️ Installation & Setup

### 🧑‍💻 Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/MohamedSinanP/task-management-api.git
   cd task-management-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   - Create a `.env` file using the example above.

4. **Run in development mode**

   ```bash
   npm run dev
   ```

5. Your server will start at `http://localhost:3001`

---

### 🏭 Production Build

1. **Build TypeScript project**

   ```bash
   npx tsc
   ```

2. **Start compiled code**

   ```bash
   node dist/index.js
   ```

---

## ☁️ Deployment

### 🔹 Render (Backend)

1. Push your backend repo to GitHub.
2. Create a **Web Service** on [Render](https://render.com/).
3. Set environment variables from `.env`.
4. **Build Command:**
   ```bash
   npm install && npx tsc
   ```
5. **Start Command:**
   ```bash
   node dist/index.js
   ```

---

### 🔹 Vercel (Frontend)

When calling your backend from Vercel:

```js
fetch("https://your-backend.onrender.com/api/auth/login", {
  method: "POST",
  credentials: "include",
});
```

---

## 👨‍💻 Author

**Mohamed Sinan P**  
MERN Stack Developer  
📧[mohamedsinanp8@gmail.com]

---

## 🪪 License

This project is licensed under the **MIT License** — feel free to modify and use it.

---
