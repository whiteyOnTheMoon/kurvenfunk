import type { Request } from 'express';
import type { JWTPayload } from 'jose';

export interface AuthenticatedUser extends JWTPayload {
  sub: string;
  kurvenfunkUserId: string;
  kurvenfunkUserStatus: 'ACTIVE' | 'LIMITED' | 'BANNED';
  kurvenfunkFanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  kurvenfunkFavoriteClubId: string | null;
  kurvenfunkOnboardingCompleted: boolean;
  kurvenfunkRoles: ('USER' | 'TRUSTED_USER' | 'MODERATOR' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN')[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
