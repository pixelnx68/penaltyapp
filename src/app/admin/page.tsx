"use client";

import { useEffect, useState, useActionState } from "react";
import { getPlayers, addPlayer, updatePlayer, deletePlayer } from "@/lib/actions/players";
import Toast from "@/components/Toast";

interface Player {
  _id: string;
  name: string;
  phone?: string;
}

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [, addAction, addPending] = useActionState(async (_prev: unknown, formData: FormData) => {
    try {
      await addPlayer(formData);
      const data = await getPlayers();
      setPlayers(data as Player[]);
      setToast({ message: "Player added", type: "success" });
    } catch {
      setToast({ message: "Failed to add player", type: "error" });
    }
  }, null);

  useEffect(() => {
    getPlayers().then((data) => {
      setPlayers(data as Player[]);
      setLoading(false);
    });
  }, []);

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("name", editName);
      formData.set("phone", editPhone);
      await updatePlayer(null, formData);
      setEditingId(null);
      const data = await getPlayers();
      setPlayers(data as Player[]);
      setToast({ message: "Player updated", type: "success" });
    } catch {
      setToast({ message: "Failed to update", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlayer(id);
      setConfirmDelete(null);
      const data = await getPlayers();
      setPlayers(data as Player[]);
      setToast({ message: "Player deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete", type: "error" });
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading players...</p>;
  }

  return (
    <div className="px-4 pt-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-xl font-bold mb-4">Manage Players</h1>

      <form action={addAction} className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2">
          <input
            name="name"
            type="text"
            placeholder="Player name"
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
            style={{ minHeight: 44 }}
          />
          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg bg-black px-6 py-3 text-base font-medium text-white disabled:opacity-50"
            style={{ minHeight: 44 }}
          >
            {addPending ? "..." : "Add"}
          </button>
        </div>
        <input
          name="phone"
          type="tel"
          placeholder="Phone number (optional)"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
          style={{ minHeight: 44 }}
        />
      </form>

      <ul className="space-y-2">
        {players.map((player) => {
          const id = player._id;
          const isEditing = editingId === id;

          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              {isEditing ? (
                <div className="flex flex-col flex-1 gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ minHeight: 44 }}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
                      style={{ minHeight: 44 }}
                    />
                    <button
                      onClick={() => handleEdit(id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
                      style={{ minHeight: 44 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                      style={{ minHeight: 44 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-base font-medium">{player.name}</span>
                    {player.phone && (
                      <span className="text-sm text-gray-500">{player.phone}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(id);
                        setEditName(player.name);
                        setEditPhone(player.phone || "");
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                      style={{ minHeight: 44 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                      style={{ minHeight: 44 }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <p className="text-base mb-4">
              Delete this player and all their penalty records?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium"
                style={{ minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-lg bg-red-600 py-3 text-base font-medium text-white"
                style={{ minHeight: 44 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
