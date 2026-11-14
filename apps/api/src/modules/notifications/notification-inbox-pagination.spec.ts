import { BadRequestException } from '@nestjs/common';

import {
  encodeNotificationCursor,
  parseNotificationCursor,
  parseNotificationFilter,
  parseNotificationLimit,
} from './notification-inbox-pagination';

describe('23.226 private notification cursor and bounded request validation', () => {
  const cursor = {
    id: '11111111-1111-4111-8111-111111111111',
    createdAt: new Date('2026-11-13T18:00:00.000Z'),
    filter: 'unread' as const,
  };

  it('round-trips an opaque, stable cursor without user IDs or notification text', () => {
    const encoded = encodeNotificationCursor(cursor);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toContain('11111111');
    expect(parseNotificationCursor(encoded, 'unread')).toEqual(cursor);
    expect(parseNotificationCursor(undefined, 'all')).toBeNull();
  });

  it('rejects mismatched filters, invalid dates/IDs and malformed or oversized cursors', () => {
    const encoded = encodeNotificationCursor(cursor);
    const invalid = [
      encoded,
      '###',
      'a'.repeat(257),
      Buffer.from('{}').toString('base64url'),
      Buffer.from(JSON.stringify({
        version: 1, id: 'not-a-uuid', createdAt: cursor.createdAt.toISOString(), filter: 'unread',
      })).toString('base64url'),
      Buffer.from(JSON.stringify({
        version: 1, id: cursor.id, createdAt: '2026-13-99T18:00:00.000Z', filter: 'unread',
      })).toString('base64url'),
      Buffer.from(JSON.stringify({
        version: 2, id: cursor.id, createdAt: cursor.createdAt.toISOString(), filter: 'unread',
      })).toString('base64url'),
    ];
    for (const value of invalid) {
      expect(() => parseNotificationCursor(value, value === encoded ? 'all' : 'unread')).toThrow(
        BadRequestException,
      );
    }
  });

  it('restricts page limits and filters before hitting PostgreSQL', () => {
    expect(parseNotificationLimit(undefined)).toBe(20);
    expect(parseNotificationLimit('1')).toBe(1);
    expect(parseNotificationLimit('50')).toBe(50);
    expect(parseNotificationFilter(undefined)).toBe('all');
    expect(parseNotificationFilter('unread')).toBe('unread');
    for (const value of ['0', '51', '999', '-1', '1.0', '01', 1, ['20'], {}]) {
      expect(() => parseNotificationLimit(value)).toThrow(BadRequestException);
    }
    for (const value of ['read', 'other', ['unread'], 42]) {
      expect(() => parseNotificationFilter(value)).toThrow(BadRequestException);
    }
  });
});
