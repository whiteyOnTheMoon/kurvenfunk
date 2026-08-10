export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFormat = 'pretty' | 'json';

export type LogMetadata = Record<string, unknown>;

export interface LogContext {
  requestId?: string;
  userId?: string;
}

export interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  service: string;
  event?: string;
  message: string;
  metadata?: LogMetadata;
}

export interface LogOptions extends LogContext {
  event?: string;
  metadata?: LogMetadata;
}

export interface Logger {
  debug(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  error(message: string, options?: LogOptions): void;
}

export type LogSink = (entry: LogEntry) => void;

export interface CreateLoggerOptions {
  service: string;
  format?: LogFormat;
  sink?: LogSink;
}
