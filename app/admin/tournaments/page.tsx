"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trophy, Calendar } from "lucide-react";

interface AdminTournament {
  id: string;
  name: string;
  format: string;
  status: string;
  maxTeams: number;
  registeredTeamCount: number;
  entryFee: number;
  registrationOpen: string;
  registrationClose: string;
  createdAt: string;
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "open") return "default";
  if (status === "ongoing") return "secondary";
  return "outline";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments);
      }
    } catch {
      toast.error("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
        fetchTournaments();
      } else {
        toast.success("Status updated");
      }
    } catch {
      toast.error("Failed to update status");
      fetchTournaments();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleGenerateFixtures(id: string) {
    setGeneratingId(id);
    try {
      const res = await fetch(
        `/api/admin/tournaments/${id}/generate-fixtures`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate fixtures");
      } else {
        toast.success(
          `Generated ${data.matchCount} fixtures — tournament is now ongoing`
        );
        fetchTournaments();
      }
    } catch {
      toast.error("Failed to generate fixtures");
    } finally {
      setGeneratingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin: Tournaments
          </h1>
          <p className="mt-1 text-muted-foreground">Manage all tournaments</p>
        </div>
        <Button asChild>
          <Link href="/admin/tournaments/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Link>
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No tournaments yet</p>
            <Button asChild className="mt-6">
              <Link href="/admin/tournaments/create">Create Tournament</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>All Tournaments ({tournaments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead>Reg Opens</TableHead>
                    <TableHead>Reg Closes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {updatingId === t.id && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                          <Select
                            value={t.status}
                            onValueChange={(val) =>
                              handleStatusChange(t.id, val)
                            }
                            disabled={updatingId === t.id}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue>
                                <Badge
                                  variant={statusVariant(t.status)}
                                  className="capitalize"
                                >
                                  {t.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.registeredTeamCount} / {t.maxTeams}
                      </TableCell>
                      <TableCell>
                        {t.entryFee === 0
                          ? "Free"
                          : `NGN ${t.entryFee.toLocaleString()}`}
                      </TableCell>
                      <TableCell>{formatDate(t.registrationOpen)}</TableCell>
                      <TableCell>{formatDate(t.registrationClose)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Generate Fixtures — only shown for open tournaments */}
                          {t.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateFixtures(t.id)}
                              disabled={generatingId === t.id}
                            >
                              {generatingId === t.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Calendar className="mr-1 h-3 w-3" />
                              )}
                              Fixtures
                            </Button>
                          )}
                          {/* Manage Matches — shown once ongoing or completed */}
                          {(t.status === "ongoing" ||
                            t.status === "completed") && (
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={`/admin/tournaments/${t.id}/matches`}
                              >
                                <Calendar className="mr-1 h-3 w-3" />
                                Matches
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
