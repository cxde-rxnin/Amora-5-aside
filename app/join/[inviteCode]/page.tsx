"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function JoinTeamPage() {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [team, setTeam] = useState<{ id: string; name: string; description: string | null } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchTeamInfo = useCallback(async () => {
        try {
            // We don't have a public "get team by invite code" API yet, 
            // but the join API can return info or we can create one.
            // For now, let's try to join directly or just show a generic "Join Team" UI.
            // Better: Create a small API to peek at team info by invite code.
            const res = await fetch(`/api/teams/peek?code=${inviteCode}`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data.team);
            } else {
                const data = await res.json();
                setError(data.error || "Invalid invite link");
            }
        } catch {
            setError("Failed to load team information");
        } finally {
            setLoading(false);
        }
    }, [inviteCode]);

    useEffect(() => {
        fetchTeamInfo();
    }, [fetchTeamInfo]);

    async function handleJoin() {
        setJoining(true);
        try {
            const res = await fetch(`/api/teams/join/${inviteCode}`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Welcome to ${data.teamName}!`);
                router.push(`/dashboard/teams/${data.teamId}`);
            } else {
                if (data.teamId && res.status === 400) {
                    // Already a member
                    router.push(`/dashboard/teams/${data.teamId}`);
                    return;
                }
                toast.error(data.error || "Failed to join team");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setJoining(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Fetching team details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-md px-4 py-24">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <CardTitle>Invitation Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/">Return Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md px-4 py-24">
            <Card className="overflow-hidden border-primary/20 shadow-xl">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Join {team?.name}</CardTitle>
                    <CardDescription>
                        You've been invited to join this team on Amora Resort.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {team?.description && (
                        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground italic text-center">
                            "{team.description}"
                        </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg border border-border/50 p-4 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <span>Join over 100+ players already on the platform</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={handleJoin} disabled={joining} className="w-full text-base h-12">
                        {joining ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            "Confirm & Join Team"
                        )}
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                        <Link href="/dashboard/teams">Cancel</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
