"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  Trophy,
  ShieldCheck,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Your squad needs a name!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Mission failed. Try again.");
        return;
      }

      toast.success("Team Legacy Started!", {
        description: `${name} is now active on the pitch.`,
      });
      router.push(`/dashboard/teams/${data.team.id}`);
    } catch {
      toast.error("System error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020817] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 px-4 py-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="ghost" size="sm" asChild className="mb-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
            <Link href="/dashboard/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="mr-1 h-3 w-3" />
                  New Registration
                </Badge>
                <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  Form Your Dynasty
                </h1>
                <p className="mt-4 text-lg text-slate-400">
                  Every legend starts with a name. Register your squad and get ready to dominate the pitch.
                </p>
              </div>

              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Squad Details</CardTitle>
                  <CardDescription className="text-slate-500">
                    Enter the fundamental details of your team.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Team Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alakahia Titans"
                        maxLength={50}
                        className="h-12 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-300">
                        Squad Philosophy <span className="text-slate-500 text-xs ml-1">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What defines your team? Our goal is to..."
                        maxLength={300}
                        rows={4}
                        className="resize-none border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="group relative w-full overflow-hidden bg-emerald-600 font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      disabled={loading}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Establishing Legacy...
                          </>
                        ) : (
                          <>
                            Confirm Registration
                            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10">
                  <Trophy className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-300">Join Tournaments</p>
                  <p className="text-xs text-slate-500">Compete for prizes and glory.</p>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-300">Track Statistics</p>
                  <p className="text-xs text-slate-500">Monitor goals, wins, and losses.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preview Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col justify-center"
          >
            <div className="relative isolate">
              {/* Background Glows */}
              <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-[100px]" />
              <div className="absolute -right-20 -bottom-20 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

              <div className="text-center mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Live Preview</h2>
              </div>

              {/* Crystal Card */}
              <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 shadow-2xl backdrop-blur-md">
                <div className="aspect-square w-full rounded-2xl bg-gradient-to-tr from-emerald-900 to-emerald-500 flex items-center justify-center p-12 shadow-inner">
                  <div className="relative">
                    <Users className="h-24 w-24 text-white drop-shadow-2xl" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 border-2 border-dashed border-white/20 rounded-full"
                    />
                  </div>
                </div>

                <div className="mt-8 text-center space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-3xl font-bold text-white min-h-[1.5em]"
                    >
                      {name || "Squad Name"}
                    </motion.h3>
                  </AnimatePresence>

                  <div className="flex justify-center gap-4">
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none px-4 py-1">
                      EST. {new Date().getFullYear()}
                    </Badge>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={description}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-400 text-sm italic line-clamp-2 min-h-[3em]"
                    >
                      {description || "The beginning of something legendary..."}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-tighter text-slate-500">Victories</p>
                    <p className="text-xl font-bold text-white">0</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-tighter text-slate-500">Rank</p>
                    <p className="text-xl font-bold text-white">#--</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-tighter text-slate-500">Squad</p>
                    <p className="text-xl font-bold text-white">0</p>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="mt-12 text-center">
                <p className="text-sm text-slate-500">
                  Ready to show the world? Confirm your registration to finalize your team card.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
