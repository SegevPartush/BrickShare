# BrickShare Backend

Backend API for BrickShare - Social network for LEGO collectors.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

3. Run the server:
```bash
npm run dev
```

## Project Structure

```
backend/
├── src/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic services
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
└── package.json
```

## API Endpoints

(To be documented)
