import type { User, Conversation, ConversationWithMessages } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Error en la petición");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const login = (username: string, password: string) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const logout = () => request("/auth/logout", { method: "POST" });

export const getMe = () => request<User>("/auth/me");

// Conversations
export const getConversations = () => request<Conversation[]>("/conversations");

export const getConversation = (id: number) =>
  request<ConversationWithMessages>(`/conversations/${id}`);

export const createConversation = (title?: string) =>
  request<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({ title: title || "Nueva conversación" }),
  });

export const deleteConversation = (id: number) =>
  request<void>(`/conversations/${id}`, { method: "DELETE" });

export const updateConversationTitle = (id: number, title: string) =>
  request<Conversation>(`/conversations/${id}/title`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });

// Users (admin)
export const getUsers = () => request<User[]>("/users");

export const createUser = (data: {
  username: string;
  email: string;
  password: string;
  role: string;
}) => request<User>("/users", { method: "POST", body: JSON.stringify(data) });

export const updateUser = (id: number, data: Partial<User & { password: string }>) =>
  request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteUser = (id: number) =>
  request<void>(`/users/${id}`, { method: "DELETE" });

// Streaming chat
export function streamChat(
  message: string,
  conversationId: number | null,
  onChunk: (text: string) => void,
  onConvId: (id: number) => void,
  onDone: () => void,
  signal?: AbortSignal,
): Promise<void> {
  return fetch(`${BASE_URL}/chat/message`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  }).then(async (res) => {
    if (!res.ok) throw new Error("Error al enviar mensaje");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        const convMatch = data.match(/^\[CONV_ID:(\d+)\]$/);
        if (convMatch) {
          onConvId(parseInt(convMatch[1]));
          continue;
        }
        if (data.startsWith("[ERROR:")) {
          throw new Error(data.slice(7, -1));
        }
        // Restaurar saltos de línea escapados
        onChunk(data.replace(/\\n/g, "\n"));
      }
    }
  });
}
