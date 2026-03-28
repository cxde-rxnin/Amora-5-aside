"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserCircle,
  Users,
  Copy,
} from "lucide-react";

interface TeamInfo {
  id: string;
  name: string;
  description: string | null;
  captainId: string;
  myRole: string;
  inviteCode: string;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  jerseyNumber: number | null;
  position: string | null;
  joinedAt: string;
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("player");
  const [addJersey, setAddJersey] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete team dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setMembers(data.members);
      } else if (res.status === 404) {
        toast.error("Team not found");
        router.push("/dashboard/teams");
      }
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const isCaptain = team?.myRole === "captain";

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail.trim(),
          role: addRole,
          jerseyNumber: addJersey ? Number(addJersey) : undefined,
          position: addPosition.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add member");
        return;
      }

      toast.success(`${data.member.name} added to the team`);
      setAddOpen(false);
      setAddEmail("");
      setAddRole("player");
      setAddJersey("");
      setAddPosition("");
      fetchTeam();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/teams/${id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Member removed");
        fetchTeam();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteTeam() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });

      if (res.ok) {
        toast.success("Team deleted");
        router.push("/dashboard/teams");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete team");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard/teams">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Link>
      </Button>

      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{team.name}</CardTitle>
              {team.description && (
                <p className="mt-2 text-muted-foreground">
                  {team.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Created{" "}
                {new Date(team.createdAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={isCaptain ? "default" : "secondary"}
                className="gap-1"
              >
                {isCaptain ? (
                  <Crown className="h-3 w-3" />
                ) : (
                  <Shield className="h-3 w-3" />
                )}
                {team.myRole === "captain" ? "Captain" : "Player"}
              </Badge>

              {isCaptain && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative">
                    <Input
                      readOnly
                      value={`${window.location.origin}/join/${team.inviteCode}`}
                      className="h-8 w-[200px] pr-10 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-0 top-0 h-8 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/join/${team.inviteCode}`
                        );
                        toast.success("Invite link copied!");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Roster */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Squad ({members.length})
          </h2>
          {isCaptain && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Player</DialogTitle>
                  <DialogDescription>
                    Add a registered user to your team by their email address.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="player@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={addRole} onValueChange={setAddRole}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="captain">Captain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="jersey">
                        Jersey #{" "}
                        <span className="text-muted-foreground">(opt.)</span>
                      </Label>
                      <Input
                        id="jersey"
                        type="number"
                        min={1}
                        max={99}
                        value={addJersey}
                        onChange={(e) => setAddJersey(e.target.value)}
                        placeholder="10"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="position">
                      Position{" "}
                      <span className="text-muted-foreground">(opt.)</span>
                    </Label>
                    <Input
                      id="position"
                      value={addPosition}
                      onChange={(e) => setAddPosition(e.target.value)}
                      placeholder="e.g. Midfielder"
                      maxLength={30}
                      className="mt-1.5"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={adding}>
                      {adding ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Player"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-9 w-9 text-muted-foreground" />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {member.name}
                      {member.role === "captain" && (
                        <Crown className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.jerseyNumber && (
                    <Badge variant="outline" className="font-mono">
                      #{member.jerseyNumber}
                    </Badge>
                  )}
                  {member.position && (
                    <Badge variant="secondary">{member.position}</Badge>
                  )}
                  {isCaptain &&
                    member.userId !== team.captainId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingId === member.id}
                      >
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      {isCaptain && (
        <div className="mt-12">
          <Separator />
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Team</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Team</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">{team.name}</span>? All
                    members will be removed. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteTeam}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Team"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </section>
  );
}
