import type { Request } from 'express';
import type { JWTPayload } from 'jose';

export interface AuthenticatedUser extends JWTPayload {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
