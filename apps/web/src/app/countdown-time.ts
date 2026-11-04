// Der Jahreswechsel wird explizit in österreichischer Normalzeit (MEZ, UTC+1)
// festgelegt und ist damit unabhängig von der Zeitzone des Besuchers.
export const LAUNCH_TIMESTAMP = Date.parse('2027-01-01T00:00:00+01:00');

export interface LaunchCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

export function getLaunchCountdown(now = Date.now()): LaunchCountdown {
  const remaining = Math.max(0, Math.ceil((LAUNCH_TIMESTAMP - now) / 1000));

  return {
    days: Math.floor(remaining / 86_400),
    hours: Math.floor((remaining % 86_400) / 3_600),
    minutes: Math.floor((remaining % 3_600) / 60),
    seconds: remaining % 60,
    finished: remaining === 0,
  };
}
