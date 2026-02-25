"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Trophy, Loader2 } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: string;
  maxTeams: number;
  squadSizeLimit: number;
  entryFee: number;
  registrationOpen: string;
  registrationClose: string;
  status: string;
  registeredTeamCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "open") return "default";
  if (status === "ongoing") return "secondary";
  return "outline";
}

function statusLabel(status: string) {
  if (status === "open") return "Registering";
  if (status === "ongoing") return "Ongoing";
  if (status === "completed") return "Completed";
  return status;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tournaments");
        if (res.ok) {
          const data = await res.json();
          setTournaments(data.tournaments);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/tournament.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Compete
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Tournaments
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Register your team, compete against the best in Port Harcourt, and battle
            for cash prizes and bragging rights.
          </p>
        </div>
      </section>

      {/* Tournament list */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Open &amp; Ongoing Tournaments
          </h2>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tournaments.length === 0 ? (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Trophy className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No open tournaments</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back soon for upcoming tournaments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {tournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="border-border/50 transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-xl">
                        {tournament.name}
                      </CardTitle>
                      <Badge
                        variant={statusVariant(tournament.status)}
                        className="shrink-0"
                      >
                        {statusLabel(tournament.status)}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {tournament.format}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {tournament.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {tournament.description}
                      </p>
                    )}
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          Reg closes {formatDate(tournament.registrationClose)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {tournament.registeredTeamCount}/{tournament.maxTeams}{" "}
                          teams
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">Entry:</span>
                        <span>
                          {tournament.entryFee === 0
                            ? "Free"
                            : `NGN ${tournament.entryFee.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">Squad limit:</span>
                        <span>{tournament.squadSizeLimit} players</span>
                      </div>
                    </div>
                    <Button className="mt-6 w-full" asChild>
                      <Link href={`/tournaments/${tournament.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
