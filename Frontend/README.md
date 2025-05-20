# Job Portal Frontend

A modern, responsive job portal frontend built with React, Vite, and Tailwind CSS.

## 🚀 Features

- Modern UI with Tailwind CSS
- Responsive Design
- Dark/Light Mode
- Job Search and Filtering
- User Authentication
- Profile Management
- Resume Upload
- Job Applications
- Interactive Charts and Analytics
- Toast Notifications
- Form Validation
- Redux State Management

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- Axios
- Radix UI Components
- Framer Motion
- React Icons
- React Hot Toast
- Recharts
- Typewriter Effect
- Lottie Animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

## 🚀 Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── features/      # Redux slices
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   ├── assets/        # Static assets
│   ├── styles/        # Global styles
│   ├── App.jsx        # Root component
│   └── main.jsx       # Entry point
├── public/            # Public assets
└── index.html         # HTML template
```

## 🎨 UI Components

The project uses a combination of:
- Radix UI for accessible components
- Headless UI for unstyled components
- Custom Tailwind components
- Framer Motion for animations
- Lottie for animated illustrations

## 🔐 Authentication

- JWT-based authentication
- Protected routes
- Persistent login state
- Role-based access control

## 📱 Responsive Design

- Mobile-first approach
- Responsive layouts
- Adaptive components
- Touch-friendly interfaces

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📝 License

This project is licensed under the MIT License.
