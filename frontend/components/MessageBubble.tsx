"use client";

import type { Message } from "@/types";
import StreamingText from "./StreamingText";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-700" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-900 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <StreamingText content={message.content} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}
