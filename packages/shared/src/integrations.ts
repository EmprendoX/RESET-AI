export interface ExternalAuthAdapter {
  getUserId(token: string): Promise<string | null>;
}

export interface ExternalEventsAdapter {
  emit(event: Record<string, unknown>): Promise<void>;
}

export interface ExternalProfileAdapter {
  getProfile(userId: string): Promise<Record<string, unknown> | null>;
}

export interface ExternalContentAdapter {
  getContent(userId: string): Promise<Record<string, unknown>[]>;
}
