"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import { getConversation } from "@/lib/api";
import type { ConversationWithMessages } from "@/types";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = parseInt(params.id);

  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isNaN(conversationId)) {
      setError(true);
      return;
    }
    setLoading(true);
    getConversation(conversationId)
      .then((data) => {
        setConversation(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Conversación no encontrada.
      </div>
    );
  }

  return <ChatWindow conversation={conversation} />;
}
