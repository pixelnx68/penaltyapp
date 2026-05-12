"use client";

import { useEffect, useState, useActionState } from "react";
import { getPlayers, addPlayer, updatePlayer, deletePlayer } from "@/lib/actions/players";
import Toast from "@/components/Toast";
import { Button, Input, Card, Badge } from "@/components/ui";

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

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Manage <span className="text-primary">Players</span></h1>
        <p className="text-sm text-muted">Add or update team members.</p>
      </header>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="bg-surface/50">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Add New Player</h2>
        <form action={addAction} className="space-y-4">
          <Input
            name="name"
            placeholder="Full Name"
            required
          />
          <Input
            name="phone"
            type="tel"
            placeholder="Phone Number (optional)"
          />
          <Button
            type="submit"
            isLoading={addPending}
            className="w-full py-4"
          >
            Add Team Member
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Active Roster</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const id = player._id;
              const isEditing = editingId === id;

              return (
                <Card key={id} className="transition-all">
                  {isEditing ? (
                    <div className="space-y-4 animate-in">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        autoFocus
                      />
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Phone"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(id)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-base font-bold">{player.name}</span>
                        {player.phone ? (
                          <span className="text-xs text-muted">{player.phone}</span>
                        ) : (
                          <Badge variant="info">No Phone</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(id);
                            setEditName(player.name);
                            setEditPhone(player.phone || "");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => setConfirmDelete(id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-sm space-y-6 bg-surface p-8 shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Remove Player?</h3>
              <p className="text-sm text-muted">This will delete the player and all their history. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Keep
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(confirmDelete)}
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
