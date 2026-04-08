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
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_secret_key
PORT=5000
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=your_from_email_address
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
3. Enable OAuth 2.0
4. Add Authorized Redirect URI:

```
http://localhost:5000/auth/google/callback
```

5. Copy Client ID & Secret into `.env`

---

## 🌍 Deployment

### Frontend (Vercel / Netlify)

- Vercel: set **Root Directory** to `client`, build command `npm run build`, output `dist`
- Netlify: root `netlify.toml` is included and deploys from `client`
- Add frontend env vars on either platform:
  - `VITE_BASE_URL`
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
