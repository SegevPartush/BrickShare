# BrickShare Backend

Backend API for BrickShare - Social network for LEGO collectors.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in backend folder:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret
```

3. Run the server:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── services/        # Additional services
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
└── package.json
```

## API Endpoints

### Authentication

**Register**
```
POST /api/auth/register
Body: { username, email, password }
```

**Login**
```
POST /api/auth/login
Body: { email, password }
```

## Technologies

- Node.js
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
