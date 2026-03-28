"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Globe } from "lucide-react";

export default function AdminContentPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        heroTitle: "",
        heroSubtitle: "",
        pitchOffPeakPrice: 0,
        pitchPeakPrice: 0,
        pitchWeekendPrice: 0,
        tournamentEntryFee: 0,
    });

    useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/admin/content");
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data.config);
                }
            } catch (error) {
                toast.error("Failed to load site configuration");
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/admin/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                toast.success("Site configuration updated successfully");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update configuration");
            }
        } catch {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;
        setConfig(prev => ({
            ...prev,
            [id]: type === "number" ? Number(value) : value
        }));
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Site Content Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Update landing page text and pricing levels dynamicallly.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <a href="/" target="_blank">
                        <Globe className="mr-2 h-4 w-4" />
                        View Public Site
                    </a>
                </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Hero Section</CardTitle>
                        <CardDescription>Main title and description on the landing page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="heroTitle">Hero Title</Label>
                            <Input
                                id="heroTitle"
                                value={config.heroTitle}
                                onChange={handleChange}
                                placeholder="The Ultimate 5-Aside Experience"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                            <Textarea
                                id="heroSubtitle"
                                value={config.heroSubtitle}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Description of the resort and pitch..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Configuration</CardTitle>
                        <CardDescription>Manage rates for pitch bookings and tournament entries.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pitchOffPeakPrice">Off-Peak Hour Price (NGN)</Label>
                                <Input
                                    id="pitchOffPeakPrice"
                                    type="number"
                                    value={config.pitchOffPeakPrice}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pitchPeakPrice">Peak Hour Price (NGN)</Label>
                                <Input
                                    id="pitchPeakPrice"
                                    type="number"
                                    value={config.pitchPeakPrice}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pitchWeekendPrice">Weekend/Holiday Price (NGN)</Label>
                                <Input
                                    id="pitchWeekendPrice"
                                    type="number"
                                    value={config.pitchWeekendPrice}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tournamentEntryFee">Tournament Entry Fee (NGN)</Label>
                                <Input
                                    id="tournamentEntryFee"
                                    type="number"
                                    value={config.tournamentEntryFee}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} size="lg" className="px-8">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
