# מעבר Backend ל-TypeScript – תיעוד השלבים

## שלב 1: התקנה והגדרות
- **התקנה:** `typescript`, `ts-node-dev`, `@types/node`, `@types/express`, `@types/cors`, `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/multer`
- **tsconfig.json:** target ES2020, module commonjs, outDir `dist`, rootDir `src`, strict mode
- **package.json:** `main` → `dist/server.js`, סקריפט `build` (tsc), `start` (node dist/server.js), `dev` (ts-node-dev src/server.ts)

## שלב 2: טיפוסים גלובליים
- **src/types/express.d.ts:** הרחבת `Express.Request` עם `userId?: string` לשימוש ב-auth middleware

## שלב 3: Utils ו-Models
- **utils/jwt.utils.ts:** פונקציות JWT עם טיפוסים, ממשק `JwtPayload`
- **models/user.model.ts:** ממשק `IUser`, Schema עם טיפוסים, export default
- **models/post.model.ts:** ממשק `IPost`, `Types.ObjectId` ל-author ו-likes
- **models/comment.model.ts:** ממשק `IComment`, refs ל-User ו-Post

## שלב 4: Middleware ו-Validators
- **middleware/auth.middleware.ts:** `Request`, `Response`, `NextFunction` מ-express
- **middleware/validate.middleware.ts:** שימוש ב-`validationResult`, טיפוס לשגיאות
- **middleware/upload.middleware.ts:** טיפוסי multer ו-`FileFilterCallback`
- **validators/*.ts:** auth, user, post, comment – ייצוא אותם כללים עם סיומת .ts

## שלב 5: Controllers
- **controllers/auth.controller.ts:** Request/Response, `user._id.toString()` ל-JWT, טיפול ב-error עם `instanceof Error`
- **controllers/user.controller.ts:** טיפוס ל-`updateData`
- **controllers/post.controller.ts:** `req.query.page/limit` as string, `mongoose.Types.ObjectId` ב-toggleLike
- **controllers/comment.controller.ts:** אותן חתימות כמו ב-JS

## שלב 6: Routes ו-Server
- **routes/*.ts:** `Router()` מ-express, `import` במקום require, `export default router`
- **server.ts:** `import` לכל המודולים, `process.env.MONGO_URI as string`

## שלב 7: סיום
- **ecosystem.config.js:** `script` → `./dist/server.js`
- **מחיקה:** כל קבצי `.js` מתוך `src/` (נשארו רק `.ts`)
- **.gitignore:** `dist/` כבר כלול תחת Build outputs

---

## פקודות שימוש
- **פיתוח:** `npm run dev` (ts-node-dev עם src/server.ts)
- **בנייה:** `npm run build` (מוציא ל-dist/)
- **הרצה:** `npm start` (node dist/server.js)
- **PM2:** `npm run pm2:start` (מריץ dist/server.js)
