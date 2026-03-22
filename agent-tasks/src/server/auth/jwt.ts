import jwt from 'jsonwebtoken';

export const JWT_COOKIE_NAME = 'auth_token';

const getSecret = () => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getSecret()) as { userId: string };
  } catch {
    return null;
  }
}
