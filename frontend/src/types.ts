// סוגים משותפים לכל הפרויקט

export interface User {
  id?: string;
  _id?: string;
  username?: string;
  email: string;
  profileImage?: string;
  /** ids של משתמשים שהמשתמש הנוכחי עוקב אחריהם — מגיע מ־/api/auth/me */
  following?: string[];
}

export interface Post {
  _id: string;
  title?: string;
  text: string;
  image?: string;
  /** 0–100, מרכז לפיד/פריים */
  imageFocalX?: number;
  imageFocalY?: number;
  author: { _id?: string; username?: string; email?: string; profileImage?: string };
  likes: any[];
  commentCount?: number;
  retweets?: number;
  createdAt: string;
  matchReason?: string;
}

export interface AuthContextType {
  accessToken: string;
  refreshToken: string;
  user: User | null;
  loading: boolean;
  authHeaders: Record<string, string>;
  register: (payload: { username: string; email: string; password: string; rememberMe?: boolean }) => Promise<User>;
  login: (payload: { email: string; password: string; rememberMe?: boolean }) => Promise<User>;
  refresh: () => Promise<any>;
  logout: () => void;
  setOAuthTokens: (tokens: { accessToken: string; refreshToken: string; userId: string }) => void;
  getValidToken: () => Promise<string>;
  /** מסנכרן את אובייקט המשתמש מהשרת (למשל אחרי Follow/Unfollow) */
  refreshUser: () => Promise<void>;
}
