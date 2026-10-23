export type SmtpProviderType = 'google' | 'microsoft' | 'custom';

export type SecurityProtocol = 'SSL' | 'TLS' | 'STARTTLS';

export interface SmtpConfig {
  host: string;
  port: number;
  security: SecurityProtocol;
  username: string;
  password: string;
  senderName: string;
  replyTo: string;
}

export interface ImapConfig {
  host: string;
  port: number;
  security: SecurityProtocol;
  username: string;
  password: string;
  enabled: boolean;
}

export interface SavedSmtpSession {
  id: string;
  name: string;
  provider: SmtpProviderType;
  smtp: SmtpConfig;
  imap?: ImapConfig;
  savedAt: string;
}

export interface StepItem {
  id: number;
  title: string;
  description: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface ConnectionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  latencyMs?: number;
}
