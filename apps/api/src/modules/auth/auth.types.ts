import type { Request } from 'express';
import type { JWTPayload } from 'jose';

export interface AuthenticatedUser extends JWTPayload {
  sub: string;
  kurvenfunkUserId: string;
  kurvenfunkUserStatus: 'ACTIVE' | 'LIMITED' | 'BANNED';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
