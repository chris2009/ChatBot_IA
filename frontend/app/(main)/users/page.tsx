"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { UserPlus, Pencil, Trash2, Shield, User as UserIcon } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user" });
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({ username: "", email: "", password: "", role: "user" });
    setEditingUser(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingUser) {
        const updates: Parameters<typeof updateUser>[1] = {
          username: form.username,
          email: form.email,
          role: form.role as "admin" | "user",
        };
        if (form.password) updates.password = form.password;
        await updateUser(editingUser.id, updates);
      } else {
        await createUser({ ...form });
      }
      await loadUsers();
      resetForm();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email, password: "", role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingUser ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder={editingUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingUser}
                />
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
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

        {/* Table */}
        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role === "admin" && <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          user.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
