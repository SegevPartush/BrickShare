# BrickShare 🧱

רשת חברתית לאספני לגו - פרויקט גמר בקורס פיתוח אפליקציות אינטרנטיות

## מבנה הפרויקט

```
brickshare/
├── backend/          # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Custom middleware
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utility functions
│   │   └── server.js    # Entry point
│   └── package.json
│
└── frontend/        # React Application
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/       # Page components
    │   ├── hooks/       # Custom hooks
    │   ├── context/     # React Context
    │   ├── services/    # API services
    │   └── styles/      # CSS/SCSS
    └── package.json
```

## חלוקת עבודה

### Backend Developer
- עובד על branch: `feature/backend-setup`
- כל ה-API, Models, Authentication, AI Integration

### Frontend Developer  
- עובד על branch: `feature/frontend-setup`
- כל ה-React UI, Components, Design

## התחלה מהירה

### Backend
```bash
cd backend
npm install
cp .env.example .env  # יצירת קובץ .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Git Workflow

1. כל אחד עובד על ה-branch שלו
2. Pull requests לפני merge ל-main
3. Code review בין חברי הקבוצה
4. Commit messages ברורים בעברית/אנגלית

## Features

- [ ] Authentication (JWT + Refresh Token)
- [ ] OAuth (Google/Facebook)
- [ ] User Profile
- [ ] Posts (CRUD)
- [ ] Comments
- [ ] Likes
- [ ] AI Integration
- [ ] Image Upload
- [ ] Search

## Technologies

**Backend:**
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- AI API (Gemini/ChatGPT)

**Frontend:**
- React
- React Router
- Axios
- CSS/SCSS

## Team

- Backend Developer
- Frontend Developer
