"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Star, Loader2 } from "lucide-react";

interface TopScorer {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    goals: number;
}

interface TeamStat {
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

export default function StatsPage() {
    const [data, setData] = useState<{
        topScorers: TopScorer[];
        teamLeaderboard: TeamStat[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stats");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="relative flex h-[40vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2071&auto=format&fit=crop')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-transparent to-transparent" />
                <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                        Performance
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Global Stats
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
                        Tracking excellence across all Amora Resort tournaments and matches.
                    </p>
                </div>
            </section>

            <section className="py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Tabs defaultValue="teams" className="space-y-8">
                        <div className="flex justify-center">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="teams" className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4" />
                                    Team Leaderboard
                                </TabsTrigger>
                                <TabsTrigger value="scorers" className="flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    Top Scorers
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="teams">
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Overall Team Standings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">Pos</TableHead>
                                                    <TableHead>Team</TableHead>
                                                    <TableHead className="text-center">P</TableHead>
                                                    <TableHead className="text-center">W</TableHead>
                                                    <TableHead className="text-center">D</TableHead>
                                                    <TableHead className="text-center">L</TableHead>
                                                    <TableHead className="text-center">GD</TableHead>
                                                    <TableHead className="text-center font-bold">Pts</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data?.teamLeaderboard.map((team, idx) => (
                                                    <TableRow key={team.teamId}>
                                                        <TableCell className="font-medium text-muted-foreground">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-bold">{team.teamName}</TableCell>
                                                        <TableCell className="text-center">{team.played}</TableCell>
                                                        <TableCell className="text-center">{team.wins}</TableCell>
                                                        <TableCell className="text-center">{team.draws}</TableCell>
                                                        <TableCell className="text-center">{team.losses}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={team.goalDifference >= 0 ? "secondary" : "destructive"}>
                                                                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-primary">
                                                            {team.points}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!data?.teamLeaderboard || data.teamLeaderboard.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                                            No data available yet.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="scorers">
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        Golden Boot Race
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">Pos</TableHead>
                                                    <TableHead>Player</TableHead>
                                                    <TableHead>Team</TableHead>
                                                    <TableHead className="text-center font-bold">Goals</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data?.topScorers.map((scorer, idx) => (
                                                    <TableRow key={scorer.playerId}>
                                                        <TableCell className="font-medium text-muted-foreground">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-bold">{scorer.playerName}</TableCell>
                                                        <TableCell className="text-muted-foreground">{scorer.teamName}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="flex items-center justify-center gap-1 font-bold text-primary text-lg">
                                                                {scorer.goals}
                                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!data?.topScorers || data.topScorers.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                                                            No goals recorded yet.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
        </>
    );
}
