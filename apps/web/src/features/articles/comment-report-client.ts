export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam oder unerwünschte Werbung' },
  { value: 'HARASSMENT', label: 'Belästigung' },
  { value: 'HATE_OR_ABUSE', label: 'Hassrede oder Beschimpfung' },
  { value: 'THREAT_OR_VIOLENCE', label: 'Drohung oder Gewalt' },
  { value: 'PRIVACY', label: 'Verletzung der Privatsphäre' },
  { value: 'IMPERSONATION', label: 'Identitätsmissbrauch' },
  { value: 'ILLEGAL_CONTENT', label: 'Rechtswidriger Inhalt' },
  { value: 'OFF_TOPIC', label: 'Themenfremder Inhalt' },
  { value: 'MISINFORMATION', label: 'Falschinformation' },
  { value: 'OTHER', label: 'Sonstiges' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export interface SubmitCommentReportCommand {
  apiUrl: string;
  commentId: string;
  token: string;
  reason: ReportReason;
  details?: string;
}

export type SubmitCommentReportResult = 'created' | 'already_reported' | 'forbidden' | 'failed';

export async function submitCommentReport(
  command: SubmitCommentReportCommand,
  request: typeof fetch = fetch,
): Promise<SubmitCommentReportResult> {
  const normalizedDetails = command.details?.trim();

  const response = await request(
    `${command.apiUrl}/api/v1/comments/${encodeURIComponent(command.commentId)}/reports`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${command.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: command.reason,
        ...(normalizedDetails ? { details: normalizedDetails } : {}),
      }),
    },
  );

  if (response.status === 409) {
    return 'already_reported';
  }

  if (response.status === 401 || response.status === 403) {
    return 'forbidden';
  }

  if (!response.ok) {
    return 'failed';
  }

  return 'created';
}
