"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expandir textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const maxHeight = 6 * 24; // ~6 líneas
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 max-h-36 overflow-y-auto placeholder-gray-400 dark:placeholder-gray-500"
          />
          <span className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
            {value.length > 0 ? value.length : ""}
          </span>
        </div>

        <button
          onClick={isStreaming ? onStop : onSend}
          disabled={!isStreaming && (!value.trim() || disabled)}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isStreaming
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
          title={isStreaming ? "Detener" : "Enviar"}
        >
          {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
