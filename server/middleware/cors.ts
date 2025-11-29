import cors from 'cors';

const isProduction = process.env.NODE_ENV === 'production';

export const corsMiddleware = cors({
  origin: isProduction
    ? (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.REPLIT_DEV_DOMAIN
        ].filter(Boolean);
        
        if (!origin) {
          callback(new Error('Not allowed by CORS'));
          return;
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'idempotency-key'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
});
