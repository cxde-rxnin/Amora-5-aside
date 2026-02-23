"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";

interface Registration {
  id: string;
  tournamentId: string;
  tournamentName: string;
  format: string;
  entryFee: number;
  tournamentStatus: string;
  teamId: string;
  teamName: string;
  paymentStatus: string;
  registeredAt: string;
}

function paymentBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid") return "default";
  if (status === "free") return "secondary";
  return "outline";
}

function paymentBadgeClass(status: string) {
  if (status === "pending") return "text-yellow-600 border-yellow-400";
  if (status === "paid") return "bg-green-600 text-white border-green-600";
  if (status === "free") return "bg-blue-600 text-white border-blue-600";
  return "";
}

function tournamentStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "open") return "default";
  if (status === "ongoing") return "secondary";
  return "outline";
}

export default function DashboardTournamentsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/tournaments");
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data.registrations);
        } else {
          toast.error("Failed to load tournament registrations");
        }
      } catch {
        toast.error("Failed to load tournament registrations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Tournament Registrations
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tournaments your teams are registered for
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/tournaments">Browse Tournaments</Link>
        </Button>
      </div>

      {registrations.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No tournament registrations</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Register your team for an upcoming tournament.
            </p>
            <Button asChild className="mt-6">
              <Link href="/tournaments">Browse Tournaments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Registrations ({registrations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>My Team</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Link
                          href={`/tournaments/${reg.tournamentId}`}
                          className="font-medium hover:underline"
                        >
                          {reg.tournamentName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{reg.format}</Badge>
                      </TableCell>
                      <TableCell>{reg.teamName}</TableCell>
                      <TableCell>
                        {reg.entryFee === 0
                          ? "Free"
                          : `NGN ${reg.entryFee.toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={paymentBadgeVariant(reg.paymentStatus)}
                          className={`capitalize ${paymentBadgeClass(reg.paymentStatus)}`}
                        >
                          {reg.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tournamentStatusVariant(reg.tournamentStatus)}
                          className="capitalize"
                        >
                          {reg.tournamentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(reg.registeredAt).toLocaleDateString(
                          "en-NG",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
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
