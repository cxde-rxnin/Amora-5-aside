"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CalendarDays, Users, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────── */

interface TournamentDetail {
  id: string;
  name: string;
  description?: string;
  bannerImage?: string;
  format: string;
  maxTeams: number;
  squadSizeLimit: number;
  entryFee: number;
  registrationOpen: string;
  registrationClose: string;
  status: string;
  registeredTeamCount: number;
}

interface UserRegistration {
  tournamentTeamId: string;
  teamId: string;
  paymentStatus: string;
  registeredAt: string;
}

interface CaptainedTeam {
  id: string;
  name: string;
}

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

interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/* ─── Helpers ───────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

function paymentStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid" || status === "free") return "default";
  if (status === "pending") return "outline";
  return "secondary";
}

function isLeague(format: string) {
  return format.toLowerCase().includes("league");
}

/* ─── Sub-components ────────────────────────────────────── */

function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/matches`)
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Fixtures have not been generated yet.
      </p>
    );
  }

  // Group by round
  const rounds = Array.from(new Set(matches.map((m) => m.round)));

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <div key={round}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {round}
          </h3>
          <div className="space-y-2">
            {matches
              .filter((m) => m.round === round)
              .map((m) => (
                <Card key={m.id} className="border-border/50">
                  <CardContent className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-right text-sm font-medium">
                        {m.homeTeamName}
                      </span>
                      <div className="flex shrink-0 items-center gap-1 text-center">
                        {m.status === "completed" ? (
                          <span className="w-16 rounded bg-muted px-2 py-1 text-center text-sm font-bold tabular-nums">
                            {m.homeScore} – {m.awayScore}
                          </span>
                        ) : (
                          <span className="w-16 rounded bg-muted/50 px-2 py-1 text-center text-xs text-muted-foreground">
                            vs
                          </span>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                        {m.awayTeamName}
                      </span>
                    </div>
                    <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant={
                          m.status === "completed" ? "default" : "outline"
                        }
                        className="text-xs capitalize"
                      >
                        {m.status}
                      </Badge>
                      {m.matchDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(m.matchDate)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTab({ tournamentId }: { tournamentId: string }) {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/standings`)
      .then((r) => r.json())
      .then((d) => setStandings(d.standings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No standings yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, idx) => (
            <TableRow key={row.teamId}>
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell className="font-medium">{row.teamName}</TableCell>
              <TableCell className="text-center">{row.played}</TableCell>
              <TableCell className="text-center">{row.wins}</TableCell>
              <TableCell className="text-center">{row.draws}</TableCell>
              <TableCell className="text-center">{row.losses}</TableCell>
              <TableCell className="text-center">{row.goalsFor}</TableCell>
              <TableCell className="text-center">{row.goalsAgainst}</TableCell>
              <TableCell className="text-center">
                {row.goalDifference > 0
                  ? `+${row.goalDifference}`
                  : row.goalDifference}
              </TableCell>
              <TableCell className="text-center font-bold">
                {row.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Top Scorers tab ───────────────────────────────────── */

interface LeaderboardRow {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  appearances: number;
}

function TopScorersTab({ tournamentId }: { tournamentId: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/leaderboard`)
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No player stats recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">
              <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                G
              </span>
            </TableHead>
            <TableHead className="text-center">
              <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                A
              </span>
            </TableHead>
            <TableHead className="text-center">
              <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-xs font-semibold text-black">
                Y
              </span>
            </TableHead>
            <TableHead className="text-center">
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                R
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((row, idx) => (
            <TableRow
              key={row.playerId}
              className={idx < 3 ? "font-medium" : ""}
            >
              <TableCell>
                {idx === 0 ? (
                  <span className="text-yellow-500 font-bold">1</span>
                ) : idx === 1 ? (
                  <span className="text-slate-400 font-semibold">2</span>
                ) : idx === 2 ? (
                  <span className="text-amber-700 font-semibold">3</span>
                ) : (
                  <span className="text-muted-foreground">{idx + 1}</span>
                )}
              </TableCell>
              <TableCell>{row.playerName}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.teamName}
              </TableCell>
              <TableCell className="text-center font-bold text-green-600">
                {row.goals}
              </TableCell>
              <TableCell className="text-center text-blue-600">
                {row.assists}
              </TableCell>
              <TableCell className="text-center text-yellow-600">
                {row.yellows}
              </TableCell>
              <TableCell className="text-center text-red-600">
                {row.reds}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Team Stats tab ─────────────────────────────────────── */

interface TeamStatRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  cleanSheets: number;
  mostGoalsInMatch: number;
  totalYellows: number;
  totalReds: number;
  form: Array<"W" | "D" | "L">;
}

function formBadgeClass(result: "W" | "D" | "L") {
  if (result === "W") return "bg-green-600 text-white";
  if (result === "L") return "bg-red-600 text-white";
  return "bg-muted text-muted-foreground";
}

function TeamStatsTab({ tournamentId }: { tournamentId: string }) {
  const [stats, setStats] = useState<TeamStatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d.stats ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No team stats yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map((s) => (
        <Card key={s.teamId} className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{s.teamName}</CardTitle>
              {s.cleanSheets > 0 && (
                <Badge className="bg-sky-600 text-white border-sky-600">
                  {s.cleanSheets} clean sheet{s.cleanSheets > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-xl font-bold text-green-600">
                  {s.goalsScored}
                </p>
                <p className="text-xs text-muted-foreground">Scored</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">
                  {s.goalsConceded}
                </p>
                <p className="text-xs text-muted-foreground">Conceded</p>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {s.goalDifference > 0
                    ? `+${s.goalDifference}`
                    : s.goalDifference}
                </p>
                <p className="text-xs text-muted-foreground">GD</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                Best: {s.mostGoalsInMatch} goals in a match
              </div>
              <div>
                Cards:{" "}
                <span className="text-yellow-600">{s.totalYellows}Y</span>{" "}
                <span className="text-red-600">{s.totalReds}R</span>
              </div>
            </div>

            {s.form.length > 0 && (
              <div className="mt-3 flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">
                  Form:
                </span>
                {s.form.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${formBadgeClass(r)}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [userRegistration, setUserRegistration] =
    useState<UserRegistration | null>(null);
  const [captainedTeams, setCaptainedTeams] = useState<CaptainedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tournamentRes, teamsRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch("/api/teams"),
      ]);

      if (tournamentRes.ok) {
        const data = await tournamentRes.json();
        setTournament(data.tournament);
        setUserRegistration(data.userRegistration);
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        const captained = (
          data.teams as Array<{ id: string; name: string; myRole: string }>
        ).filter((t) => t.myRole === "captain");
        setCaptainedTeams(captained);
        if (captained.length === 1) {
          setSelectedTeamId(captained[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRegister() {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      if (data.paymentRequired && data.paymentLink) {
        router.push(data.paymentLink);
      } else {
        toast.success("Team registered successfully!");
        fetchData();
      }
    } catch {
      toast.error("Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Tournament not found</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/tournaments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tournaments
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const isRegistrationOpen =
    tournament.status === "open" &&
    new Date() >= new Date(tournament.registrationOpen) &&
    new Date() <= new Date(tournament.registrationClose);

  const isFull = tournament.registeredTeamCount >= tournament.maxTeams;
  const hasStarted =
    tournament.status === "ongoing" || tournament.status === "completed";
  const league = isLeague(tournament.format);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Tournaments
        </Link>
      </Button>

      {tournament.bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tournament.bannerImage}
          alt={tournament.name}
          className="mb-6 h-48 w-full rounded-lg object-cover"
        />
      )}

      <div className="flex flex-wrap items-start gap-3">
        <h1 className="flex-1 text-3xl font-bold tracking-tight">
          {tournament.name}
        </h1>
        <Badge
          variant={
            tournament.status === "open"
              ? "default"
              : tournament.status === "ongoing"
                ? "secondary"
                : "outline"
          }
          className="text-sm"
        >
          {tournament.status === "open"
            ? "Registering"
            : tournament.status === "ongoing"
              ? "Ongoing"
              : tournament.status === "completed"
                ? "Completed"
                : tournament.status}
        </Badge>
        <Badge variant="outline">{tournament.format}</Badge>
      </div>

      {tournament.description && (
        <p className="mt-4 text-muted-foreground">{tournament.description}</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Entry Fee
          </p>
          <p className="mt-1 text-lg font-semibold">
            {tournament.entryFee === 0
              ? "Free"
              : `NGN ${tournament.entryFee.toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Teams
          </p>
          <p className="mt-1 text-lg font-semibold">
            {tournament.registeredTeamCount} / {tournament.maxTeams}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Squad Limit
          </p>
          <p className="mt-1 text-lg font-semibold">
            {tournament.squadSizeLimit} players
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>
            Registration opens: {formatDate(tournament.registrationOpen)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>
            Registration closes: {formatDate(tournament.registrationClose)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-10">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasStarted && (
            <TabsTrigger value="matches">Matches</TabsTrigger>
          )}
          {hasStarted && league && (
            <TabsTrigger value="standings">Standings</TabsTrigger>
          )}
          {hasStarted && (
            <TabsTrigger value="topscorers">Top Scorers</TabsTrigger>
          )}
          {hasStarted && (
            <TabsTrigger value="stats">Stats</TabsTrigger>
          )}
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userRegistration ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your team is registered for this tournament.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Payment status:</span>
                    <Badge
                      variant={paymentStatusVariant(
                        userRegistration.paymentStatus
                      )}
                      className="capitalize"
                    >
                      {userRegistration.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered:{" "}
                    {new Date(userRegistration.registeredAt).toLocaleDateString(
                      "en-NG",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              ) : captainedTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You need to be the captain of a team to register.{" "}
                  <Link
                    href="/dashboard/teams/create"
                    className="text-primary underline"
                  >
                    Create a team
                  </Link>
                </p>
              ) : !isRegistrationOpen ? (
                <p className="text-sm text-muted-foreground">
                  {tournament.status !== "open"
                    ? "Registration is not open for this tournament."
                    : isFull
                      ? "This tournament is full."
                      : "Registration window is currently closed."}
                </p>
              ) : isFull ? (
                <p className="text-sm text-muted-foreground">
                  This tournament is full.
                </p>
              ) : (
                <div className="space-y-4">
                  {captainedTeams.length > 1 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        Select your team
                      </p>
                      <Select
                        value={selectedTeamId}
                        onValueChange={setSelectedTeamId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {captainedTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {captainedTeams.length === 1 && (
                    <p className="text-sm text-muted-foreground">
                      Registering as:{" "}
                      <span className="font-medium text-foreground">
                        {captainedTeams[0].name}
                      </span>
                    </p>
                  )}
                  <Button
                    onClick={handleRegister}
                    disabled={registering || !selectedTeamId}
                    className="w-full"
                  >
                    {registering && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {tournament.entryFee === 0
                      ? "Register Team (Free)"
                      : `Register Team — NGN ${tournament.entryFee.toLocaleString()}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches tab */}
        {hasStarted && (
          <TabsContent value="matches">
            <MatchesTab tournamentId={id} />
          </TabsContent>
        )}

        {/* Standings tab (league only) */}
        {hasStarted && league && (
          <TabsContent value="standings">
            <StandingsTab tournamentId={id} />
          </TabsContent>
        )}

        {/* Top Scorers tab */}
        {hasStarted && (
          <TabsContent value="topscorers">
            <TopScorersTab tournamentId={id} />
          </TabsContent>
        )}

        {/* Team Stats tab */}
        {hasStarted && (
          <TabsContent value="stats">
            <TeamStatsTab tournamentId={id} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
