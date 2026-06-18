import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  getUserById,
  getUserByUsername,
  verifyPassword,
} from "./dao/user-dao.js";

// Configure local strategy
passport.use(
  new LocalStrategy(function (username, password, done) {
    const user = getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: "Username non trovato." });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return done(null, false, { message: "Password non corretta." });
    }

    // Don't include password hash in session
    const { password_hash, ...userWithoutPassword } = user;
    return done(null, userWithoutPassword);
  }),
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  const user = getUserById(id);
  if (user) {
    done(null, user);
  } else {
    done({ message: "User not found" }, null);
  }
});

export default passport;
