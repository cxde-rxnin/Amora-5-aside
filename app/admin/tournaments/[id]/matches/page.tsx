"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, ListPlus, Trash2 } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

interface MatchItem {
  id: string;
  round: string;
  matchDate: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerTeamId: string | null;
}

interface TournamentMeta {
  name: string;
  status: string;
  format: string;
}

interface MatchEventItem {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  type: string;
  minute: number | null;
}

interface Player {
  userId: string;
  name: string;
}

/* ─── Badge helpers ─────────────────────────────────────── */

function eventTypeBadge(type: string) {
  const map: Record<
    string,
    { label: string; cls: string }
  > = {
    goal: { label: "Goal", cls: "bg-green-600 text-white border-green-600" },
    assist: { label: "Assist", cls: "bg-blue-600 text-white border-blue-600" },
    yellow: { label: "Yellow", cls: "bg-yellow-400 text-black border-yellow-400" },
    red: { label: "Red", cls: "bg-red-600 text-white border-red-600" },
  };
  const m = map[type];
  if (!m) return <Badge variant="outline" className="capitalize">{type}</Badge>;
  return (
    <Badge variant="outline" className={`capitalize ${m.cls}`}>
      {m.label}
    </Badge>
  );
}

/* ─── Events Dialog ─────────────────────────────────────── */

interface EventsDialogProps {
  match: MatchItem;
  isLocked: boolean;
  onEventsChanged: () => void;
}

function EventsDialog({ match, isLocked, onEventsChanged }: EventsDialogProps) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<MatchEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Team players cache
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const playersLoaded = useRef(false);

  // Form state
  const [selectedTeamId, setSelectedTeamId] = useState(match.homeTeamId);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minute, setMinute] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/admin/matches/${match.id}/events`);
      if (res.ok) {
        const d = await res.json();
        setEvents(d.events ?? []);
      }
    } finally {
      setLoadingEvents(false);
    }
  }, [match.id]);

  const loadPlayers = useCallback(async () => {
    if (playersLoaded.current) return;
    playersLoaded.current = true;
    try {
      const [homeRes, awayRes] = await Promise.all([
        fetch(`/api/teams/${match.homeTeamId}`),
        fetch(`/api/teams/${match.awayTeamId}`),
      ]);
      if (homeRes.ok) {
        const d = await homeRes.json();
        setHomePlayers(
          (d.members ?? []).map((m: { userId: string; name: string }) => ({
            userId: m.userId,
            name: m.name,
          }))
        );
      }
      if (awayRes.ok) {
        const d = await awayRes.json();
        setAwayPlayers(
          (d.members ?? []).map((m: { userId: string; name: string }) => ({
            userId: m.userId,
            name: m.name,
          }))
        );
      }
    } catch {
      // Non-critical
    }
  }, [match.homeTeamId, match.awayTeamId]);

  useEffect(() => {
    if (open) {
      loadEvents();
      loadPlayers();
    }
  }, [open, loadEvents, loadPlayers]);

  const currentPlayers =
    selectedTeamId === match.homeTeamId ? homePlayers : awayPlayers;

  async function handleAddEvent() {
    if (!selectedPlayerId || !selectedType) {
      toast.error("Player and event type are required");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        playerId: selectedPlayerId,
        teamId: selectedTeamId,
        type: selectedType,
      };
      if (minute) {
        const m = parseInt(minute, 10);
        if (!isNaN(m) && m >= 1 && m <= 120) body.minute = m;
      }

      const res = await fetch(`/api/admin/matches/${match.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add event");
      } else {
        toast.success("Event added");
        setSelectedPlayerId("");
        setSelectedType("");
        setMinute("");
        await loadEvents();
        onEventsChanged();
      }
    } catch {
      toast.error("Failed to add event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    setDeletingId(eventId);
    try {
      const res = await fetch(
        `/api/admin/matches/${match.id}/events/${eventId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete event");
      } else {
        toast.success("Event removed");
        await loadEvents();
        onEventsChanged();
      }
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  }

  const canAddEvents = match.status === "completed" && !isLocked;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ListPlus className="mr-1 h-3 w-3" />
          Events
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Match Events — {match.homeTeamName} vs {match.awayTeamName}
          </DialogTitle>
          <DialogDescription>
            {match.status === "completed"
              ? `${match.homeScore} – ${match.awayScore}`
              : "Match not yet completed"}
          </DialogDescription>
        </DialogHeader>

        {/* Add event form */}
        {canAddEvents && (
          <div className="rounded-md border p-4">
            <p className="mb-3 text-sm font-medium">Add Event</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Team selector */}
              <div className="space-y-1">
                <Label className="text-xs">Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={(v) => {
                    setSelectedTeamId(v);
                    setSelectedPlayerId("");
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.homeTeamId}>
                      {match.homeTeamName}
                    </SelectItem>
                    <SelectItem value={match.awayTeamId}>
                      {match.awayTeamName}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Player selector */}
              <div className="space-y-1">
                <Label className="text-xs">Player</Label>
                <Select
                  value={selectedPlayerId}
                  onValueChange={setSelectedPlayerId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pick player" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPlayers.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No players found
                      </SelectItem>
                    ) : (
                      currentPlayers.map((p) => (
                        <SelectItem key={p.userId} value={p.userId}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Event type */}
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goal">Goal</SelectItem>
                    <SelectItem value="assist">Assist</SelectItem>
                    <SelectItem value="yellow">Yellow Card</SelectItem>
                    <SelectItem value="red">Red Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minute */}
              <div className="space-y-1">
                <Label className="text-xs">Minute (opt.)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="e.g. 34"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button
              className="mt-3 w-full sm:w-auto"
              size="sm"
              onClick={handleAddEvent}
              disabled={submitting || !selectedPlayerId || !selectedType}
            >
              {submitting && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              Add Event
            </Button>
          </div>
        )}

        {!canAddEvents && match.status !== "completed" && (
          <p className="text-sm text-muted-foreground">
            Events can only be added after the match result is entered.
          </p>
        )}

        {/* Events list */}
        <div className="mt-2">
          <p className="mb-2 text-sm font-medium">
            Events ({events.length})
          </p>
          {loadingEvents ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No events recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  {!isLocked && (
                    <TableHead className="text-right">Del</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">
                      {e.minute ?? "—"}
                    </TableCell>
                    <TableCell>{eventTypeBadge(e.type)}</TableCell>
                    <TableCell className="font-medium">
                      {e.playerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.teamId === match.homeTeamId
                        ? match.homeTeamName
                        : match.awayTeamName}
                    </TableCell>
                    {!isLocked && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(e.id)}
                          disabled={deletingId === e.id}
                        >
                          {deletingId === e.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-destructive" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function AdminMatchesPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [meta, setMeta] = useState<TournamentMeta | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editState, setEditState] = useState<
    Record<
      string,
      { homeScore: string; awayScore: string; matchDate: string; saving: boolean }
    >
  >({});

  const fetchData = useCallback(async () => {
    try {
      const [metaRes, matchRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
      ]);

      if (metaRes.ok) {
        const d = await metaRes.json();
        setMeta({
          name: d.tournament.name,
          status: d.tournament.status,
          format: d.tournament.format,
        });
      }

      if (matchRes.ok) {
        const d = await matchRes.json();
        const fetched: MatchItem[] = d.matches ?? [];
        setMatches(fetched);
        const init: typeof editState = {};
        for (const m of fetched) {
          init[m.id] = {
            homeScore: String(m.homeScore),
            awayScore: String(m.awayScore),
            matchDate: m.matchDate
              ? new Date(m.matchDate).toISOString().slice(0, 16)
              : "",
            saving: false,
          };
        }
        setEditState(init);
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateField(
    matchId: string,
    field: "homeScore" | "awayScore" | "matchDate",
    value: string
  ) {
    setEditState((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }));
  }

  async function handleSave(matchId: string) {
    const state = editState[matchId];
    if (!state) return;
    const homeScore = parseInt(state.homeScore, 10);
    const awayScore = parseInt(state.awayScore, 10);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      toast.error("Scores must be non-negative numbers");
      return;
    }
    setEditState((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], saving: true },
    }));
    try {
      const body: Record<string, unknown> = { homeScore, awayScore };
      if (state.matchDate)
        body.matchDate = new Date(state.matchDate).toISOString();

      const res = await fetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save match");
      } else {
        toast.success("Match result saved");
        await fetchData();
      }
    } catch {
      toast.error("Failed to save match");
    } finally {
      setEditState((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], saving: false },
      }));
    }
  }

  async function handleDateOnly(matchId: string) {
    const state = editState[matchId];
    if (!state || !state.matchDate) {
      toast.error("No date to save");
      return;
    }
    setEditState((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], saving: true },
    }));
    try {
      const res = await fetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchDate: new Date(state.matchDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save date");
      } else {
        toast.success("Match date saved");
        await fetchData();
      }
    } catch {
      toast.error("Failed to save date");
    } finally {
      setEditState((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], saving: false },
      }));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCompleted = meta?.status === "completed";
  const rounds = Array.from(new Set(matches.map((m) => m.round)));

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/admin/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournaments
        </Link>
      </Button>

      <div className="flex flex-wrap items-start gap-3">
        <h1 className="flex-1 text-3xl font-bold tracking-tight">
          {meta?.name ?? "Tournament"} — Matches
        </h1>
        {meta && (
          <>
            <Badge
              variant={
                meta.status === "ongoing"
                  ? "secondary"
                  : meta.status === "completed"
                    ? "outline"
                    : "default"
              }
              className="capitalize"
            >
              {meta.status}
            </Badge>
            <Badge variant="outline">{meta.format}</Badge>
          </>
        )}
      </div>

      {isCompleted && (
        <div className="mt-4 rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          This tournament is completed. Match results and events are locked.
        </div>
      )}

      {matches.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium">No fixtures generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate fixtures from the tournaments list first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-8">
          {rounds.map((round) => (
            <div key={round}>
              <h2 className="mb-4 text-lg font-semibold">{round}</h2>
              <div className="space-y-4">
                {matches
                  .filter((m) => m.round === round)
                  .map((m) => {
                    const es = editState[m.id];
                    const isSaving = es?.saving ?? false;
                    const locked = isCompleted;

                    return (
                      <Card key={m.id} className="border-border/60">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">
                              {m.homeTeamName}{" "}
                              <span className="text-muted-foreground">vs</span>{" "}
                              {m.awayTeamName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  m.status === "completed"
                                    ? "default"
                                    : "outline"
                                }
                                className="capitalize"
                              >
                                {m.status}
                              </Badge>
                              {/* Events button — always visible for completed matches */}
                              {m.status === "completed" && (
                                <EventsDialog
                                  match={m}
                                  isLocked={locked}
                                  onEventsChanged={fetchData}
                                />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Match date */}
                            <div className="space-y-1">
                              <Label className="text-xs">Match Date</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="datetime-local"
                                  value={es?.matchDate ?? ""}
                                  onChange={(e) =>
                                    updateField(
                                      m.id,
                                      "matchDate",
                                      e.target.value
                                    )
                                  }
                                  disabled={locked || isSaving}
                                  className="text-xs"
                                />
                                {!locked && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDateOnly(m.id)}
                                    disabled={isSaving || !es?.matchDate}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Scores */}
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {m.homeTeamName} Score
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                value={es?.homeScore ?? "0"}
                                onChange={(e) =>
                                  updateField(m.id, "homeScore", e.target.value)
                                }
                                disabled={locked || isSaving}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {m.awayTeamName} Score
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                value={es?.awayScore ?? "0"}
                                onChange={(e) =>
                                  updateField(m.id, "awayScore", e.target.value)
                                }
                                disabled={locked || isSaving}
                              />
                            </div>
                          </div>

                          {!locked && (
                            <Button
                              className="mt-4 w-full sm:w-auto"
                              onClick={() => handleSave(m.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save Result
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
