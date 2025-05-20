# Job Portal Backend

This is the backend server for the Job Portal application, built with Node.js and Express.js.

## 🚀 Features

- User Authentication & Authorization
- Job Posting and Management
- Resume Upload and Processing
- Email Notifications
- PDF Processing
- AI Integration (OpenAI & Google AI)
- Cloud Storage Integration (Cloudinary)

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Cloudinary for File Storage
- OpenAI & Google AI Integration
- Nodemailer for Email
- PDF Processing Libraries

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary Account
- OpenAI API Key
- Google AI API Key

## 🔧 Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

## 🚀 Running the Application

Development mode:
```bash
npm run dev
```

## 📁 Project Structure

```
Backend/
├── controllers/     # Route controllers
├── models/         # Database models
├── routes/         # API routes
├── middlewares/    # Custom middlewares
├── utils/          # Utility functions
├── temp/           # Temporary files
└── index.js        # Entry point
```

## 🔐 API Endpoints

- Authentication
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout

- Jobs
  - GET /api/jobs
  - POST /api/jobs
  - GET /api/jobs/:id
  - PUT /api/jobs/:id
  - DELETE /api/jobs/:id

- Users
  - GET /api/users/profile
  - PUT /api/users/profile
  - POST /api/users/resume

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📝 License

This project is licensed under the ISC License. 