# 🚀 Resume Builder Web Application

A full-stack Resume Builder web application that allows users to create, customize, and download professional resumes easily. This project includes authentication, modern UI, and a backend for data storage and user management.

---

## 📌 Features

- 🔐 User Authentication (Google OAuth + Email/Login)
- 🧾 Create and Edit Resume Sections
- 💾 Save Resume Data to Database
- 📄 Download Resume (PDF-ready layout)
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast Performance using Vite
- 🌐 Full Stack (Frontend + Backend)

---

## 🛠️ Tech Stack

### Frontend

- React (JSX)
- Vite
- Tailwind CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### Authentication

- Google OAuth 2.0

---

## 📂 Project Structure

```
resume-builder/
│
├── client/              # Frontend (React + Vite)
│   ├── src/
│   ├── components/
│   └── pages/
│
├── server/              # Backend (Node + Express)
│   ├── routes/
│   ├── controllers/
│   └── models/
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/nirmal-coder6/resume-builder.git
cd resume-builder
```

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/` and add:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_secret_key
PORT=5000
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=your_from_email_address
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
OTP_RATE_LIMIT_SECONDS=60
OTP_CACHE_SECONDS=600
EMAIL_QUEUE_NAME=email.jobs
EMAIL_RETRY_QUEUE_NAME=email.jobs.retry
```

`MONGO_URI` is also supported as a backward-compatible fallback.

For Upstash Redis, use your TLS URL in `REDIS_URL`, for example:

```env
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
```

Recommended for Gmail production SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-google-workspace-or-gmail-address
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM=your-google-workspace-or-gmail-address
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Setup Frontend

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Google Authentication Setup

1. Go to Google Cloud Console
2. Create a new project
3. Enable OAuth 2.0 and create a **Web application** client
4. Add **Authorized JavaScript origins**:

```
http://localhost:5173
https://your-site.vercel.app
https://your-site.netlify.app
```

5. Copy the Client ID into backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID`

---

## 🌍 Deployment

### Frontend (Vercel / Netlify)

- Vercel: set **Root Directory** to `client`, build command `npm run build`, output `dist`
- Netlify: root `netlify.toml` is included and deploys from `client`
- Add frontend env vars on either platform:
  - `VITE_BASE_URL` (required, example: `https://resume-builder-api.onrender.com`)
  - `VITE_GOOGLE_CLIENT_ID`

### Backend (Render)

- Connect GitHub repo
- Add environment variables
- Set start command: `npm start`
- Set frontend allowlist env vars:
  - `CLIENT_URL1` for Vercel domain
  - `CLIENT_URL2` for Netlify domain

---

## 📸 Screenshots

_Add your project screenshots here_

---

## 🧠 Future Improvements

- Multiple Resume Templates
- Drag & Drop Sections
- AI Resume Suggestions
- Export in Different Formats (DOCX, PDF)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Nirmal**  
GitHub: https://github.com/nirmal-coder6

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
