export function getCommentSpamErrorMessage(code: unknown): string | undefined {
  switch (code) {
    case 'COMMENT_POST_COOLDOWN':
      return 'Bitte warte 5 Sekunden, bevor du erneut kommentierst.';

    case 'COMMENT_RATE_LIMIT':
      return 'Du hast zu viele Kommentare geschrieben. Bitte versuche es später erneut.';

    case 'COMMENT_DUPLICATE_SPAM':
      return 'Du hast diesen Kommentar vor Kurzem bereits veröffentlicht.';

    case 'COMMENT_LINK_LIMIT':
      return 'Pro Kommentar sind maximal zwei Links erlaubt.';

    case 'COMMENT_SPAM_PROTECTION_UNAVAILABLE':
      return 'Kommentieren ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.';

    default:
      return undefined;
  }
}
