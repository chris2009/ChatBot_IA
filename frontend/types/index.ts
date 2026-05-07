export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
  subscription_expires_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface AuthInfo {
  username: string;
  role: "admin" | "user";
}

export interface ActivityLog {
  id: number;
  user_id: number;
  username: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
