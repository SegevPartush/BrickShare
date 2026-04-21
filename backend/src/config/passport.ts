import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User, { IUser } from '../models/user.model';

function ensureUniqueUsername(base: string): string {
  return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 28) || 'user';
}

async function findOrCreateOAuthUser(
  providerId: string,
  provider: 'google' | 'facebook',
  email: string,
  displayName: string,
  profileImage?: string
): Promise<IUser> {
  const idField = provider === 'google' ? 'googleId' : 'facebookId';
  let user = await User.findOne({ [idField]: providerId });
  if (user) {
    // אם המשתמש כבר קיים אבל אין/יש תמונה חדשה מהפרוביידר,
    // חשוב לעדכן כדי שלא נישאר עם profileImage ריק לעד.
    if (profileImage && user.profileImage !== profileImage) {
      user.profileImage = profileImage;
    }
    if (email && (!user.email || user.email !== email.toLowerCase())) {
      user.email = email.toLowerCase();
    }
    await user.save();
    return user;
  }

  user = await User.findOne({ email: email?.toLowerCase() });
  if (user) {
    (user as any)[idField] = providerId;
    if (profileImage) user.profileImage = profileImage;
    await user.save();
    return user;
  }

  const base = ensureUniqueUsername(displayName || email?.split('@')[0] || 'user');
  let username = base;
  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }

  const newUser = new User({
    username,
    email: email?.toLowerCase() || `${providerId}@${provider}.oauth.local`,
    profileImage: profileImage || '',
    [idField]: providerId
  });
  await newUser.save();
  return newUser;
}

/** כתובת הבקאנד ל-OAuth redirect_uri — חייבת להתאים ל־Authorized redirect URIs ב-Google/Facebook. */
const backendOrigin = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;

function oauthCallbackUrl(envValue: string | undefined, path: string): string {
  if (envValue && /^https?:\/\//i.test(envValue)) {
    return envValue;
  }
  if (envValue?.startsWith('/')) {
    return `${backendOrigin.replace(/\/$/, '')}${envValue}`;
  }
  return `${backendOrigin.replace(/\/$/, '')}${path}`;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL = oauthCallbackUrl(process.env.GOOGLE_CALLBACK_URL, '/api/auth/google/callback');

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || '';
          // ב-googles' passport response זה לרוב `value`, אבל לפעמים מתקבל `url`.
          const photo0: any = profile.photos?.[0] as any;
          const photo = photo0?.value || photo0?.url;
          const user = await findOrCreateOAuthUser(
            profile.id,
            'google',
            email || '',
            displayName,
            photo
          );
          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
const facebookCallbackURL = oauthCallbackUrl(process.env.FACEBOOK_CALLBACK_URL, '/api/auth/facebook/callback');

if (facebookAppId && facebookAppSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: facebookCallbackURL,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
        scope: ['email']
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (profile.emails as { value: string }[])?.[0]?.value;
          const displayName = profile.displayName || '';
          const photo0: any = (profile.photos as any[] | undefined)?.[0] as any;
          const photo = photo0?.value || photo0?.url;
          const user = await findOrCreateOAuthUser(
            profile.id,
            'facebook',
            email || '',
            displayName,
            photo
          );
          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user: Express.User, done) => {
  const u = user as IUser;
  done(null, u._id.toString());
});
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user ?? undefined);
  } catch (err) {
    done(err as Error, undefined);
  }
});
