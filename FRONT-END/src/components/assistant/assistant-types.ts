export type Source = {
  source_type: string;
  source_id: string;
  source_key?: string;
  title: string;
  snippet?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  intent?: string;
  createdAt?: string;
  latencyMs?: number;
};
export type Conversation = {
  session_id: string;
  title: string;
  last_message_preview?: string;
  current_intent?: string;
  updated_at?: string;
  created_at?: string;
};
