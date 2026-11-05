import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompletedGuard } from '../auth/onboarding-completed.guard';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import {
  CommentReportsModerationController,
  createCommentReportSchema,
  ReportsController,
  resolveCommentReportSchema,
} from './reports.controller';
import { ReportsService } from './reports.service';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

jest.mock('./reports.service', () => ({
  ReportsService: jest.fn(),
}));

describe('ReportsController', () => {
  const commentId = '11111111-1111-4111-8111-111111111111';
  const reporterId = '22222222-2222-4222-8222-222222222222';

  const reasons = [
    'SPAM',
    'HARASSMENT',
    'HATE_OR_ABUSE',
    'THREAT_OR_VIOLENCE',
    'PRIVACY',
    'IMPERSONATION',
    'ILLEGAL_CONTENT',
    'OFF_TOPIC',
    'MISINFORMATION',
    'OTHER',
  ] as const;

  it.each(reasons)('accepts report reason %s', (reason) => {
    const result = createCommentReportSchema.safeParse({
      reason,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid reason', () => {
    const result = createCommentReportSchema.safeParse({
      reason: 'INVALID_REASON',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing reasons', () => {
    const result = createCommentReportSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects unexpected fields', () => {
    const result = createCommentReportSchema.safeParse({
      reason: 'SPAM',
      status: 'RESOLVED',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty details', () => {
    const result = createCommentReportSchema.safeParse({
      reason: 'OTHER',
      details: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects details longer than 1000 characters', () => {
    const result = createCommentReportSchema.safeParse({
      reason: 'OTHER',
      details: 'x'.repeat(1001),
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional details', () => {
    const result = createCommentReportSchema.safeParse({
      reason: 'HARASSMENT',
      details: 'Wiederholte persönliche Angriffe.',
    });

    expect(result.success).toBe(true);
  });

  it('normalizes details', () => {
    const result = createCommentReportSchema.parse({
      reason: 'SPAM',
      details: '  Wiederholte Werbung  ',
    });

    expect(result.details).toBe('Wiederholte Werbung');
  });

  it('uses the authentication guard', () => {
    const guards: unknown = Reflect.getMetadata(
      GUARDS_METADATA,
      Reflect.get(ReportsController.prototype, 'createCommentReport'),
    );

    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(OnboardingCompletedGuard);
  });

  it('registers the expected POST route', () => {
    const method: unknown = Reflect.getMetadata(
      METHOD_METADATA,
      Reflect.get(ReportsController.prototype, 'createCommentReport'),
    );

    const path: unknown = Reflect.getMetadata(PATH_METADATA, ReportsController);

    expect(method).toBe(RequestMethod.POST);
    expect(path).toBe('comments/:commentId/reports');
  });

  it('forwards authenticated user information', async () => {
    const expected = {
      id: '33333333-3333-4333-8333-333333333333',
      status: 'OPEN',
      createdAt: new Date(),
    };

    const createCommentReport = jest.fn().mockResolvedValue(expected);

    const service = {
      createCommentReport,
    } as unknown as ReportsService;

    const controller = new ReportsController(service);

    const request = {
      user: {
        kurvenfunkUserId: reporterId,
        kurvenfunkUserStatus: 'LIMITED',
      },
    } as unknown as AuthenticatedRequest;

    const result = await controller.createCommentReport(commentId, request, {
      reason: 'PRIVACY',
      details: 'Private Informationen veröffentlicht.',
    });

    expect(createCommentReport).toHaveBeenCalledWith({
      commentId,
      reporterId,
      userStatus: 'LIMITED',
      reason: 'PRIVACY',
      details: 'Private Informationen veröffentlicht.',
    });

    expect(result).toEqual(expected);
  });
});

describe('CommentReportsModerationController', () => {
  const reportId = '33333333-3333-4333-8333-333333333333';
  const moderatorId = '22222222-2222-4222-8222-222222222222';

  it('validates report decision bodies and rejects extra fields', () => {
    expect(
      resolveCommentReportSchema.safeParse({
        resolution: 'ACTION_TAKEN',
        moderatorNote: 'Kommentar entfernt',
      }).success,
    ).toBe(true);
    expect(
      resolveCommentReportSchema.safeParse({
        resolution: 'NO_VIOLATION',
        moderatorNote: '  ',
      }).success,
    ).toBe(false);
    expect(
      resolveCommentReportSchema.safeParse({
        resolution: 'NO_VIOLATION',
        moderatorNote: 'Kein Verstoß',
        reviewerId: moderatorId,
      }).success,
    ).toBe(false);
  });

  it('requires centralized comment moderation permission for both routes', () => {
    for (const method of ['listPendingCommentReports', 'resolveCommentReport']) {
      const handler = Reflect.get(CommentReportsModerationController.prototype, method);
      const permissions: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);
      expect(permissions).toContain(PERMISSIONS.COMMENT_MODERATE);
      const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, handler);
      expect(guards).toContain(AuthGuard);
    }
  });

  it('forwards the authenticated moderator and validated decision', async () => {
    const resolveCommentReport = jest.fn().mockResolvedValue({ id: reportId, status: 'DISMISSED' });
    const listPendingCommentReports = jest.fn().mockResolvedValue([]);
    const controller = new CommentReportsModerationController({
      resolveCommentReport,
      listPendingCommentReports,
    } as unknown as ReportsService);
    const request = {
      user: { kurvenfunkUserId: moderatorId },
    } as unknown as AuthenticatedRequest;

    expect(await controller.listPendingCommentReports()).toEqual([]);
    await controller.resolveCommentReport(reportId, request, {
      resolution: 'NO_VIOLATION',
      moderatorNote: 'Kein Verstoß',
    });
    expect(resolveCommentReport).toHaveBeenCalledWith({
      reportId,
      moderatorId,
      resolution: 'NO_VIOLATION',
      moderatorNote: 'Kein Verstoß',
    });
  });
});
