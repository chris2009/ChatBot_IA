"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@/types";
import { getMe, uploadAvatar } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import {
  Camera,
  Moon,
  Sun,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getSubscriptionStatus(user: User) {
  if (!user.subscription_expires_at) {
    return { label: "Sin límite", color: "text-green-600 dark:text-green-400", icon: CheckCircle };
  }
  const exp = new Date(user.subscription_expires_at);
  const now = new Date();
  if (exp < now) {
    return { label: `Expirada el ${formatDate(user.subscription_expires_at)}`, color: "text-red-600 dark:text-red-400", icon: XCircle };
  }
  return { label: `Activa hasta ${formatDate(user.subscription_expires_at)}`, color: "text-blue-600 dark:text-blue-400", icon: Clock };
}

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize + convert to base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX = 128;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        setSaving(true);
        setSuccess(false);
        try {
          const updated = await uploadAvatar(dataUrl);
          setUser(updated);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch {
          // ignore
        } finally {
          setSaving(false);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const sub = getSubscriptionStatus(user);
  const SubIcon = sub.icon;

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mi Perfil</h1>

        {/* Avatar card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center ring-2 ring-indigo-200 dark:ring-indigo-800">
                  <UserIcon className="w-10 h-10 text-indigo-500" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={saving}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              {saving && <p className="text-xs text-indigo-500 mt-1">Guardando...</p>}
              {success && <p className="text-xs text-green-600 dark:text-green-400 mt-1">¡Foto actualizada!</p>}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center gap-3 px-5 py-4">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Usuario</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Email</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <SubIcon className={`w-4 h-4 ${sub.color}`} />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Suscripción</p>
              <p className={`text-sm mt-0.5 font-medium ${sub.color}`}>{sub.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">Miembro desde</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Theme card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Apariencia</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Modo {theme === "dark" ? "oscuro" : "claro"} activo
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
