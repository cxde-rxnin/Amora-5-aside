import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

const tournaments = [
  {
    name: "Amora Champions Cup",
    date: "March 15, 2026",
    status: "Registering",
    statusVariant: "default" as const,
    teams: "16 teams",
    prize: "NGN 500,000",
  },
  {
    name: "Weekend Warriors League",
    date: "April 5, 2026",
    status: "Coming Soon",
    statusVariant: "secondary" as const,
    teams: "12 teams",
    prize: "NGN 300,000",
  },
  {
    name: "Corporate 5-Aside Challenge",
    date: "May 20, 2026",
    status: "Coming Soon",
    statusVariant: "secondary" as const,
    teams: "8 teams",
    prize: "NGN 200,000",
  },
];

export default function TournamentsPreview() {
  return (
    <section className="bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Tournaments
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Upcoming Tournaments
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Compete against the best teams in PH. Register your squad and
            battle for glory.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.name}
              className="border-border/50 transition-all duration-300 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  <Badge variant={tournament.statusVariant}>
                    {tournament.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{tournament.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tournament.teams}</span>
                    <span className="font-semibold text-foreground">
                      {tournament.prize}
                    </span>
                  </div>
                </div>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/tournaments">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild>
            <Link href="/tournaments">View All Tournaments</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
