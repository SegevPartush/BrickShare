// סוגים משותפים לכל הפרויקט

export interface User {
  id?: string;
  _id?: string;
  username?: string;
  email: string;
  profileImage?: string;
}

export interface Post {
  _id: string;
  title?: string;
  text: string;
  image?: string;
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
  register: (payload: { username: string; email: string; password: string }) => Promise<User>;
  login: (payload: { email: string; password: string }) => Promise<User>;
  refresh: () => Promise<any>;
  logout: () => void;
  setOAuthTokens: (tokens: { accessToken: string; refreshToken: string; userId: string }) => void;
  getValidToken: () => Promise<string>;
}
