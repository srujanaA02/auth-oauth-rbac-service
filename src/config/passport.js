const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const config = require('./env');
const prisma = require('./db');

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.oauth.google.clientID,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const providerUserId = profile.id;

        // Check if user exists with this provider
        let authProvider = await prisma.authProvider.findUnique({
          where: {
            provider_provider_user_id: {
              provider: 'google',
              provider_user_id: providerUserId,
            },
          },
          include: {
            user: true,
          },
        });

        if (authProvider) {
          return done(null, authProvider.user);
        }

        // Check if user exists by email
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name,
              role: 'user',
            },
          });
        }

        // Link provider to user
        await prisma.authProvider.create({
          data: {
            user_id: user.id,
            provider: 'google',
            provider_user_id: providerUserId,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: config.oauth.github.clientID,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName || profile.username;
        const providerUserId = profile.id;

        // Check if user exists with this provider
        let authProvider = await prisma.authProvider.findUnique({
          where: {
            provider_provider_user_id: {
              provider: 'github',
              provider_user_id: providerUserId,
            },
          },
          include: {
            user: true,
          },
        });

        if (authProvider) {
          return done(null, authProvider.user);
        }

        // Check if user exists by email
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name,
              role: 'user',
            },
          });
        }

        // Link provider to user
        await prisma.authProvider.create({
          data: {
            user_id: user.id,
            provider: 'github',
            provider_user_id: providerUserId,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
