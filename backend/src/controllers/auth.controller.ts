import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function oauthRedirect(req: Request, res: Response, user: IUser): void {
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  const params = new URLSearchParams({
    accessToken,
    refreshToken,
    userId: user._id.toString()
  });
  res.redirect(`${FRONTEND_URL}/oauth-callback?${params.toString()}`);
}

export const register = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const oauthCallback = (req: Request, res: Response): void => {
  const user = req.user as IUser | undefined;
  if (!user) {
    const err = new URLSearchParams({ error: 'oauth_failed' });
    res.redirect(`${FRONTEND_URL}/login?${err.toString()}`);
    return;
  }
  oauthRedirect(req, res, user);
};

export const logout = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};
