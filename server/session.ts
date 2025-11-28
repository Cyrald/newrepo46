import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { env } from "./env";

const PgSession = connectPg(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  name: 'sessionId',
});

declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRoles: string[];
  }
}
