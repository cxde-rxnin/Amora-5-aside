"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CalendarDays, Clock, Timer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateParam } from "@/lib/slots";

interface SlotInfo {
  time: string;
  available: boolean;
}

export default function BookingForm() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [bookingType, setBookingType] = useState<string>("casual");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailability = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/bookings/availability?date=${formatDateParam(date)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
      } else {
        toast.error("Failed to load availability");
        setSlots([]);
      }
    } catch {
      toast.error("Failed to load availability");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, fetchAvailability]);

  function canSelectSlot(time: string, dur: number): boolean {
    const startHour = parseInt(time.split(":")[0], 10);
    const slotsNeeded = dur / 60;

    for (let i = 0; i < slotsNeeded; i++) {
      const checkTime = `${(startHour + i).toString().padStart(2, "0")}:00`;
      const slotInfo = slots.find((s) => s.time === checkTime);
      if (!slotInfo || !slotInfo.available) return false;
    }

    if (startHour + slotsNeeded > 23) return false;

    return true;
  }

  function handleSlotClick(time: string) {
    if (!canSelectSlot(time, duration)) return;
    setSelectedSlot(time);
  }

  function handleDurationChange(val: string) {
    const newDuration = parseInt(val, 10);
    setDuration(newDuration);
    if (selectedSlot && !canSelectSlot(selectedSlot, newDuration)) {
      setSelectedSlot(null);
    }
  }

  function getEndTime(): string {
    if (!selectedSlot) return "";
    const h = parseInt(selectedSlot.split(":")[0], 10) + duration / 60;
    return `${h.toString().padStart(2, "0")}:00`;
  }

  async function handleBooking() {
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDateParam(selectedDate),
          startTime: selectedSlot,
          duration,
          type: bookingType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login to book a pitch");
          router.push("/login?callbackUrl=/dashboard/book");
          return;
        }
        toast.error(data.error || "Booking failed");
        if (res.status === 409) {
          fetchAvailability(selectedDate);
        }
        return;
      }

      toast.success("Booking created successfully!");
      router.push("/dashboard/bookings");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left: Date + Options */}
      <div className="space-y-6 lg:col-span-2">
        {/* Date Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Duration + Type */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Booking Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Duration
                  </label>
                  <Select
                    value={duration.toString()}
                    onValueChange={handleDurationChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 Hour</SelectItem>
                      <SelectItem value="120">2 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Booking Type
                  </label>
                  <Select
                    value={bookingType}
                    onValueChange={setBookingType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="team">Team Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Slots */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                Select a start time for your{" "}
                {duration === 60 ? "1-hour" : "2-hour"} booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No slots available for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => {
                    const selectable = canSelectSlot(slot.time, duration);
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotClick(slot.time)}
                        disabled={!selectable}
                        className={cn(
                          "rounded-lg border px-3 py-3 text-sm font-medium transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : selectable
                              ? "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                              : "cursor-not-allowed border-border/30 bg-muted/50 text-muted-foreground/50 line-through"
                        )}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Booking Summary */}
      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-NG", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {selectedSlot
                    ? `${selectedSlot} – ${getEndTime()}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {duration === 60 ? "1 Hour" : "2 Hours"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize">
                  {bookingType}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">Pending</Badge>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedDate || !selectedSlot || submitting}
              onClick={handleBooking}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Booking will be set to pending until confirmed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
