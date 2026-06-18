import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from '../utils/logger.js';

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // Check if a user already exists with this Google ID or email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // Link Google account if they signed up with email/password originally
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true; // Google already verified the email
            if (!user.avatar?.url && profile.photos?.[0]?.value) {
              user.avatar = { url: profile.photos[0].value, publicId: '' };
            }
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // Create a brand new user from Google profile
        // Generate a unique username from their email/name
        const baseUsername = (profile.displayName || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20) || 'user';

        let username = baseUsername;
        let suffix = 0;
        while (await User.findOne({ username })) {
          suffix += 1;
          username = `${baseUsername}${suffix}`;
        }

        user = await User.create({
          googleId: profile.id,
          username,
          email,
          name: profile.displayName,
          isVerified: true, // trust Google's email verification
          // Random secure password since this account only logs in via Google
          password: `google_oauth_${profile.id}_${Date.now()}`,
          avatar: profile.photos?.[0]?.value
            ? { url: profile.photos[0].value, publicId: '' }
            : undefined,
        });

        logger.info(`New user via Google OAuth: ${user.username}`);
        return done(null, user);
      } catch (err) {
        logger.error(`Google OAuth error: ${err.message}`);
        return done(err, null);
      }
    }
  )
);

// Required by passport even though we use JWT (not sessions) for the app itself
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
