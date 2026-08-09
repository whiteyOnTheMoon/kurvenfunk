import type {
  CreateLoggerOptions,
  LogEntry,
  LogLevel,
  LogMetadata,
  LogOptions,
  LogSink,
  Logger,
} from './types.js';

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'clientSecret',
  'client_secret',
  'apiKey',
  'api_key',
] as const;

const sensitiveKeys = new Set(
  SENSITIVE_KEYS.map((key) => key.toLowerCase()),
);

function isSensitiveKey(key: string): boolean {
  return sensitiveKeys.has(key.toLowerCase());
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeMetadata(value as Record<string, unknown>);
  }

  return value;
}

export function sanitizeMetadata(
  metadata: LogMetadata,
): LogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? REDACTED : sanitizeValue(value),
    ]),
  );
}

export function createLogEntry(
  service: string,
  level: LogLevel,
  message: string,
  options: LogOptions = {},
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service,
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.event ? { event: options.event } : {}),
    message,
    ...(options.metadata
      ? { metadata: sanitizeMetadata(options.metadata) }
      : {}),
  };
}

const defaultSink: LogSink = (entry) => {
  console.log(JSON.stringify(entry));
};

export function createLogger({
  service,
  sink = defaultSink,
}: CreateLoggerOptions): Logger {
  const write = (
    level: LogLevel,
    message: string,
    options?: LogOptions,
  ): void => {
    sink(createLogEntry(service, level, message, options));
  };

  return {
    debug: (message, options) => write('debug', message, options),
    info: (message, options) => write('info', message, options),
    warn: (message, options) => write('warn', message, options),
    error: (message, options) => write('error', message, options),
  };
}
