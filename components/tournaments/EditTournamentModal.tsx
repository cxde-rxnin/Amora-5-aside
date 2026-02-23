"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trophy, Settings, CalendarRange, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const formatOptions = [
    "5-a-side Knockout",
    "5-a-side League",
    "5-a-side Round Robin",
    "5-a-side League + Playoffs",
    "7-a-side Knockout",
    "7-a-side League",
];

const STEPS = [
    { id: 1, label: "Basic Info", icon: Trophy },
    { id: 2, label: "Format & Teams", icon: Settings },
    { id: 3, label: "Registration", icon: CalendarRange },
];

interface TournamentData {
    id: string;
    name: string;
    description?: string;
    format: string;
    maxTeams: number;
    squadSizeLimit: number;
    entryFee: number;
    registrationOpen: string;
    registrationClose: string;
}

interface EditTournamentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    tournament: TournamentData | null;
}

function toDatetimeLocal(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditTournamentModal({
    open,
    onOpenChange,
    onSuccess,
    tournament,
}: EditTournamentModalProps) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [format, setFormat] = useState("");
    const [maxTeams, setMaxTeams] = useState("16");
    const [squadSizeLimit, setSquadSizeLimit] = useState("10");
    const [entryFee, setEntryFee] = useState("0");
    const [registrationOpen, setRegistrationOpen] = useState("");
    const [registrationClose, setRegistrationClose] = useState("");

    // Populate fields when tournament changes
    useEffect(() => {
        if (tournament) {
            setName(tournament.name);
            setDescription(tournament.description || "");
            setFormat(tournament.format);
            setMaxTeams(tournament.maxTeams.toString());
            setSquadSizeLimit(tournament.squadSizeLimit.toString());
            setEntryFee(tournament.entryFee.toString());
            setRegistrationOpen(toDatetimeLocal(tournament.registrationOpen));
            setRegistrationClose(toDatetimeLocal(tournament.registrationClose));
            setStep(1);
        }
    }, [tournament]);

    function handleClose() {
        setStep(1);
        onOpenChange(false);
    }

    function validateStep(): boolean {
        if (step === 1) {
            if (!name.trim()) {
                toast.error("Tournament name is required");
                return false;
            }
        }
        if (step === 2) {
            if (!format) {
                toast.error("Please select a format");
                return false;
            }
        }
        if (step === 3) {
            if (!registrationOpen || !registrationClose) {
                toast.error("Both registration dates are required");
                return false;
            }
            if (new Date(registrationClose) <= new Date(registrationOpen)) {
                toast.error("Registration close must be after registration open");
                return false;
            }
        }
        return true;
    }

    function handleNext() {
        if (!validateStep()) return;
        setStep((s) => s + 1);
    }

    async function handleSubmit() {
        if (!validateStep() || !tournament) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/tournaments/${tournament.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
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
                toast.error(data.error || "Failed to update tournament");
                return;
            }

            toast.success("Tournament updated successfully!");
            handleClose();
            onSuccess();
        } catch {
            toast.error("Failed to update tournament");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Tournament</DialogTitle>
                    <DialogDescription>
                        Update tournament details. Changes are saved when you click Save.
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between border-b pb-4">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = s.id === step;
                        const isDone = s.id < step;
                        return (
                            <div key={s.id} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                                            isDone
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : isActive
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/30 text-muted-foreground/50"
                                        )}
                                    >
                                        {isDone ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <Icon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs font-medium",
                                            isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground/50"
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            "mx-2 mb-5 h-0.5 flex-1 transition-colors",
                                            s.id < step ? "bg-primary" : "bg-muted"
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="space-y-4 py-2">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">
                                    Tournament Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Amora Champions Cup 2026"
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the tournament..."
                                    rows={3}
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
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
                                    <Label htmlFor="edit-maxTeams">
                                        Max Teams <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="edit-maxTeams"
                                        type="number"
                                        min={2}
                                        value={maxTeams}
                                        onChange={(e) => setMaxTeams(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-squadSizeLimit">
                                        Squad Size Limit <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="edit-squadSizeLimit"
                                        type="number"
                                        min={1}
                                        value={squadSizeLimit}
                                        onChange={(e) => setSquadSizeLimit(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-entryFee">Entry Fee (NGN)</Label>
                                <Input
                                    id="edit-entryFee"
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
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="edit-registrationOpen">
                                    Registration Opens <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-registrationOpen"
                                    type="datetime-local"
                                    value={registrationOpen}
                                    onChange={(e) => setRegistrationOpen(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-registrationClose">
                                    Registration Closes <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-registrationClose"
                                    type="datetime-local"
                                    value={registrationClose}
                                    onChange={(e) => setRegistrationClose(e.target.value)}
                                />
                            </div>
                            {/* Summary */}
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                                <p className="font-medium text-foreground">{name}</p>
                                <p className="text-muted-foreground">{format} · {maxTeams} teams · Squad of {squadSizeLimit}</p>
                                <p className="text-muted-foreground">
                                    {entryFee === "0" || !entryFee ? "Free entry" : `NGN ${parseInt(entryFee).toLocaleString()} entry fee`}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between border-t pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => step > 1 ? setStep((s) => s - 1) : handleClose()}
                    >
                        {step > 1 ? "Back" : "Cancel"}
                    </Button>

                    {step < 3 ? (
                        <Button onClick={handleNext}>
                            Continue
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
