"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  Timer,
  Loader2,
  Plus,
  XCircle,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  amount: number;
  paymentStatus: string | null;
  txRef: string | null;
  createdAt: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
};

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (res.ok) {
        toast.success("Booking cancelled");
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel");
      }
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePay(bookingId: string) {
    setPayingId(bookingId);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to initiate payment");
        return;
      }

      // Redirect to Flutterwave hosted payment page
      window.location.href = data.paymentLink;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  const upcoming = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      new Date(b.date) >= new Date(new Date().toDateString())
  );
  const past = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      new Date(b.date) < new Date(new Date().toDateString())
  );

  const totalBookings = bookings.length;
  const upcomingCount = upcoming.length;
  const hoursPlayed = past
    .filter((b) => b.status === "confirmed")
    .reduce((acc, curr) => acc + curr.duration / 60, 0);
  const totalSpent = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mx-auto px-4 py-4 sm:px-6 lg:px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your pitch bookings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/book">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Played
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursPlayed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount Spent
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NGN {totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No bookings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Book your first pitch session to get started
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/book">Book Now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Upcoming</h2>
              <div className="mt-4 space-y-4">
                {upcoming.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancel(booking.id)}
                    onPay={() => handlePay(booking.id)}
                    cancelling={cancellingId === booking.id}
                    paying={payingId === booking.id}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Past & Cancelled
              </h2>
              <div className="mt-4 space-y-4">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function BookingCard({
  booking,
  onCancel,
  onPay,
  cancelling,
  paying,
}: {
  booking: Booking;
  onCancel?: () => void;
  onPay?: () => void;
  cancelling?: boolean;
  paying?: boolean;
}) {
  const dateStr = new Date(booking.date).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const needsPayment = isPending && booking.paymentStatus !== "successful";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{dateStr}</CardTitle>
            {booking.txRef && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ref: {booking.txRef}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isConfirmed && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
            {isPending && (
              <Badge variant="outline" className="capitalize">
                Pending Payment
              </Badge>
            )}
            {booking.status === "cancelled" && (
              <Badge variant="destructive" className="capitalize">
                Cancelled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {booking.startTime} – {booking.endTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            {booking.duration === 60 ? "1 Hour" : "2 Hours"}
          </span>
          <Badge variant="secondary" className="capitalize">
            {booking.type}
          </Badge>
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <CreditCard className="h-4 w-4" />
            NGN {booking.amount.toLocaleString()}
          </span>
        </div>

        {(needsPayment || (onCancel && isPending)) && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {needsPayment && onPay && (
                <Button onClick={onPay} disabled={paying} size="sm">
                  {paying ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-1 h-3 w-3" />
                      Pay Now
                    </>
                  )}
                </Button>
              )}
              {onCancel && isPending && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
