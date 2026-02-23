"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const formatOptions = [
  "5-a-side Knockout",
  "5-a-side League",
  "5-a-side Round Robin",
  "5-a-side League + Playoffs",
  "7-a-side Knockout",
  "7-a-side League",
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("");
  const [entryFee, setEntryFee] = useState("0");
  const [maxTeams, setMaxTeams] = useState("16");
  const [squadSizeLimit, setSquadSizeLimit] = useState("10");
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationClose, setRegistrationClose] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !format || !registrationOpen || !registrationClose) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          format,
          entryFee: parseFloat(entryFee) || 0,
          maxTeams: parseInt(maxTeams, 10),
          squadSizeLimit: parseInt(squadSizeLimit, 10),
          registrationOpen: new Date(registrationOpen).toISOString(),
          registrationClose: new Date(registrationClose).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create tournament");
        return;
      }

      toast.success("Tournament created successfully");
      router.push("/admin/tournaments");
    } catch {
      toast.error("Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/admin/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournaments
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
      <p className="mt-1 text-muted-foreground">
        New tournaments are created as drafts. Set status to &quot;Open&quot; when ready.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tournament Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Amora Champions Cup 2026"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the tournament..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Format <span className="text-destructive">*</span>
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTeams">
                  Max Teams <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min={2}
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squadSizeLimit">
                  Squad Size Limit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="squadSizeLimit"
                  type="number"
                  min={1}
                  value={squadSizeLimit}
                  onChange={(e) => setSquadSizeLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee (NGN)</Label>
              <Input
                id="entryFee"
                type="number"
                min={0}
                step={500}
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="0 for free"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for a free tournament.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrationOpen">
                  Registration Opens <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="registrationOpen"
                  type="datetime-local"
                  value={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationClose">
                  Registration Closes <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="registrationClose"
                  type="datetime-local"
                  value={registrationClose}
                  onChange={(e) => setRegistrationClose(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Tournament
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/tournaments">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
