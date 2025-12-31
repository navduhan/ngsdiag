import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ngsdiag-secret-key-change-in-production'
);

const COOKIE_NAME = 'ngsdiag-session';
const TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  [key: string]: unknown; // Index signature for jose compatibility
}

// ============ Password Hashing ============

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ============ JWT Token ============

export const createToken = async (payload: JWTPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
};

// ============ Session Management ============

export const setSessionCookie = async (payload: JWTPayload): Promise<void> => {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
};

export const getSession = async (): Promise<JWTPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
};

export const clearSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};

// ============ Auth Helpers ============

export const getCurrentUser = async () => {
  const session = await getSession();
  if (!session) return null;
  
  // Import here to avoid circular dependency
  const { getUserById } = await import('./db');
  const user = getUserById(session.userId);
  
  if (!user) return null;
  
  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};
