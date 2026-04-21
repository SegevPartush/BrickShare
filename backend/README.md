# BrickShare Backend

API (Express + MongoDB). להרצה והתקנה מלאה ראה את [README.md](../README.md) בשורש הפרויקט.

## סביבה

- העתק `cp .env.example .env` ומלא ערכים.
- **ברירת מחדל:** פרונט על `http://localhost:3000`, בקאנד על `http://localhost:3001` (כמו ב־`frontend/package.json` proxy).

## פקודות

```bash
npm install
npm run dev   # פיתוח
npm run build && npm start   # production
```

## מבנה

```
backend/
├── src/
│   ├── server.ts
│   ├── routes/ | controllers/ | models/ | middleware/ | ...
```
