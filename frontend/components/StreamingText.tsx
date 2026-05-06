"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
}

export default function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <div className="markdown-body text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-gray-500 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
