"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Conversation } from "@/types";
import { getConversations, deleteConversation, logout } from "@/lib/api";
import { getAuthInfo } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";
import {
  MessageSquare,
  Plus,
  Trash2,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
} from "lucide-react";

interface SidebarProps {
  refreshTrigger?: number;
}

export default function Sidebar({ refreshTrigger }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const authInfo = getAuthInfo();

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // silenciar
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (pathname === `/chat/${id}`) router.push("/chat");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 dark:bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-sm">AI Chat</span>
        </div>
        <Link
          href="/chat"
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
          title="Nueva conversación"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      {/* Conversations list */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 px-2">
            No hay conversaciones aún
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname === `/chat/${conv.id}`;
            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-700 dark:bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white"
                }`}
              >
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 dark:border-gray-800 p-3 space-y-1">
        {authInfo?.role === "admin" && (
          <Link
            href="/users"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/users"
                ? "bg-gray-700 dark:bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Panel de administración</span>
          </Link>
        )}
        <Link
          href="/profile"
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/profile"
              ? "bg-gray-700 dark:bg-gray-800 text-white"
              : "text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Mi perfil</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 truncate flex-1">
            {authInfo?.username ?? "Usuario"}
          </span>
          <button
            onClick={toggleTheme}
            className="p-1 rounded hover:text-yellow-300 transition-colors"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-1 rounded hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-gray-900 dark:bg-gray-950 text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed left-0 top-0 h-full w-64 z-50 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-3 p-1 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 h-full">
        <SidebarContent />
      </div>
    </>
  );
}
