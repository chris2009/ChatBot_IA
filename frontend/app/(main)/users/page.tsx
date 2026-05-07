"use client";

import { useEffect, useState } from "react";
import type { User, ActivityLog } from "@/types";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllActivityLogs,
} from "@/lib/api";
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  User as UserIcon,
  Activity,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  RefreshCw,
  Calendar,
} from "lucide-react";

type Tab = "users" | "logs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Desconocido";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "Móvil";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/linux/i.test(ua)) return "Linux";
  return "Escritorio";
}

function getSubscriptionLabel(user: User): { text: string; className: string } {
  if (!user.subscription_expires_at) {
    return { text: "Sin límite", className: "text-green-600 dark:text-green-400" };
  }
  const exp = new Date(user.subscription_expires_at);
  if (exp < new Date()) {
    return { text: `Expirada ${formatDateOnly(user.subscription_expires_at)}`, className: "text-red-600 dark:text-red-400" };
  }
  return { text: `Hasta ${formatDateOnly(user.subscription_expires_at)}`, className: "text-blue-600 dark:text-blue-400" };
}

const EMPTY_FORM = { username: "", email: "", password: "", role: "user", subscription_expires_at: "", no_limit: true };

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("users");

  // Users tab state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Logs tab state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<number | undefined>(undefined);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      setUsers(await getUsers());
    } catch {
      // silenciar
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLogs = async (userId?: number) => {
    setLoadingLogs(true);
    try {
      setLogs(await getAllActivityLogs(userId));
    } catch {
      // silenciar
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (tab === "logs") loadLogs(logFilter);
  }, [tab, logFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
    setShowForm(false);
    setFormError("");
  };

  const handleEdit = (user: User) => {
    const hasExpiry = !!user.subscription_expires_at;
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      subscription_expires_at: hasExpiry
        ? new Date(user.subscription_expires_at!).toISOString().split("T")[0]
        : "",
      no_limit: !hasExpiry,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const expiresAt = form.no_limit
      ? null
      : form.subscription_expires_at
      ? new Date(form.subscription_expires_at).toISOString()
      : null;

    try {
      if (editingUser) {
        const updates: Parameters<typeof updateUser>[1] = {
          username: form.username,
          email: form.email,
          role: form.role as "admin" | "user",
          subscription_expires_at: expiresAt,
        };
        if (form.password) updates.password = form.password;
        await updateUser(editingUser.id, updates);
      } else {
        await createUser({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          subscription_expires_at: expiresAt,
        });
      }
      await loadUsers();
      resetForm();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Panel de Administración</h1>
          {tab === "users" && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo usuario
            </button>
          )}
          {tab === "logs" && (
            <button
              onClick={() => loadLogs(logFilter)}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "users"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "logs"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            Logs de actividad
          </button>
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <>
            {/* Form modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {editingUser ? "Editar usuario" : "Nuevo usuario"}
                  </h2>
                  {formError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                      {formError}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                    />
                    <input
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
                      placeholder="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                    <input
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
                      placeholder={editingUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editingUser}
                    />
                    <select
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* Subscription */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.no_limit}
                          onChange={(e) => setForm({ ...form, no_limit: e.target.checked, subscription_expires_at: "" })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Sin límite de suscripción
                      </label>
                      {!form.no_limit && (
                        <div>
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Fecha de expiración
                          </label>
                          <input
                            type="date"
                            value={form.subscription_expires_at}
                            onChange={(e) => setForm({ ...form, subscription_expires_at: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
                            required={!form.no_limit}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                      >
                        {editingUser ? "Guardar" : "Crear"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users table */}
            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Usuario</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Rol</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Suscripción</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                      <th className="text-right px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map((user) => {
                      const sub = getSubscriptionLabel(user);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                  <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {user.role === "admin" && <Shield className="w-3 h-3" />}
                              {user.role}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-xs font-medium ${sub.className}`}>{sub.text}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                user.is_active ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── LOGS TAB ── */}
        {tab === "logs" && (
          <>
            {/* Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Filtrar por usuario:</label>
              <select
                value={logFilter ?? ""}
                onChange={(e) => setLogFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Todos los usuarios</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                No hay registros de actividad aún.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Usuario</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Acción</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">IP</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Dispositivo</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {logs.map((log) => {
                      const isLogin = log.action === "login";
                      const device = parseDevice(log.user_agent);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {log.username ?? `#${log.user_id}`}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                isLogin
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {isLogin ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                              {isLogin ? "Inicio de sesión" : "Cierre de sesión"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {log.ip_address ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              {device === "Móvil" ? (
                                <Smartphone className="w-3.5 h-3.5" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5" />
                              )}
                              {device}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
