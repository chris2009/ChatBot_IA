"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Message, ConversationWithMessages } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { streamChat } from "@/lib/api";
import { useSidebar } from "@/context/SidebarContext";
import { Sparkles, Code2, Globe, Lightbulb, Bot } from "lucide-react";

function TypingIndicator() {
  return (
    <div className="flex gap-3 flex-row mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-10">
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:160ms]" />
        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:320ms]" />
      </div>
    </div>
  );
}

const EXAMPLES = [
  { icon: Sparkles, text: "Explícame qué es la inteligencia artificial" },
  { icon: Code2, text: "Escribe una función en Python para ordenar una lista" },
  { icon: Globe, text: "¿Cuáles son las mejores prácticas en diseño web?" },
  { icon: Lightbulb, text: "Dame ideas para un proyecto de software" },
];

interface ChatWindowProps {
  conversation?: ConversationWithMessages;
}

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const router = useRouter();
  const { triggerRefresh } = useSidebar();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? []);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentConvId, setCurrentConvId] = useState<number | null>(conversation?.id ?? null);

  // Sync messages when conversation changes
  useEffect(() => {
    setMessages(conversation?.messages ?? []);
    setCurrentConvId(conversation?.id ?? null);
  }, [conversation?.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isStreaming) return;

      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      // Añadir mensaje del usuario inmediatamente
      const userMsg: Message = {
        id: Date.now(),
        conversation_id: currentConvId ?? 0,
        role: "user",
        content: messageText,
        tokens_used: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let accumulatedText = "";
      let resolvedConvId = currentConvId;

      try {
        await streamChat(
          messageText,
          currentConvId,
          (chunk) => {
            accumulatedText += chunk;
            setStreamingContent(accumulatedText);
          },
          (newConvId) => {
            resolvedConvId = newConvId;
            setCurrentConvId(newConvId);
            triggerRefresh();
            router.replace(`/chat/${newConvId}`);
          },
          () => {
            // Done
            const assistantMsg: Message = {
              id: Date.now() + 1,
              conversation_id: resolvedConvId ?? 0,
              role: "assistant",
              content: accumulatedText,
              tokens_used: null,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setStreamingContent("");
            setIsStreaming(false);
            triggerRefresh();
          },
          ctrl.signal,
        );
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          const errorMsg: Message = {
            id: Date.now() + 1,
            conversation_id: resolvedConvId ?? 0,
            role: "assistant",
            content: "Ocurrió un error al procesar tu mensaje. Intenta de nuevo.",
            tokens_used: null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
        setStreamingContent("");
        setIsStreaming(false);
      }
    },
    [input, isStreaming, currentConvId, triggerRefresh, router],
  );

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Bienvenido a AI Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Escribe un mensaje o selecciona un ejemplo para comenzar
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {EXAMPLES.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-left transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && !streamingContent && <TypingIndicator />}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: -1,
                  conversation_id: currentConvId ?? 0,
                  role: "assistant",
                  content: streamingContent,
                  tokens_used: null,
                  created_at: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </div>
  );
}
