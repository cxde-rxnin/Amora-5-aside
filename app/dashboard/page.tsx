"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Users, Trophy, CreditCard, ArrowRight, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
}

interface Team {
  _id: string;
  name: string;
}

interface TournamentEntry {
  _id: string;
  tournamentStatus: string;
}

interface User {
  name: string;
  email: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "confirmed") return "default";
  if (status === "pending") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/teams").then((r) => r.json()),
      fetch("/api/dashboard/tournaments").then((r) => r.json()),
    ])
      .then(([meData, bookingsData, teamsData, tournamentsData]) => {
        setUser(meData.user ?? null);

        const allBookings: Booking[] = Array.isArray(bookingsData.bookings)
          ? bookingsData.bookings
          : [];
        const upcoming = allBookings.filter(
          (b) => b.status !== "cancelled" && b.date >= today
        );
        setBookings(upcoming);

        setTeams(Array.isArray(teamsData.teams) ? teamsData.teams : []);

        const allTournaments: TournamentEntry[] = Array.isArray(
          tournamentsData.tournaments
        )
          ? tournamentsData.tournaments
          : [];
        setTournaments(allTournaments);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.slice(0, 3);
  const activeCount = tournaments.filter(
    (t) => t.tournamentStatus === "ongoing"
  ).length;

  const currentDate = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 space-y-8">
      {/* Welcome banner */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">{currentDate}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Bookings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Teams
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Teams joined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tournaments
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ongoing competitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link
                href="/dashboard/bookings"
                className="hover:underline text-primary"
              >
                View bookings
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/book">
              <CalendarDays className="h-4 w-4 mr-2" />
              Book a Pitch
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tournaments">
              <Search className="h-4 w-4 mr-2" />
              Browse Tournaments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/teams">
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No upcoming bookings</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/book">Book a pitch now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <Card key={booking._id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(booking.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.startTime} – {booking.endTime}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
