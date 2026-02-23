"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Clock } from "lucide-react";

interface PaymentInfo {
  payment: {
    txRef: string;
    amount: number;
    currency: string;
    status: string;
  };
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
  } | null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const type = searchParams.get("type");
  const isTournament = type === "tournament";
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!txRef) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/payments/verify?tx_ref=${txRef}`);
        if (res.ok) {
          const data = await res.json();
          setInfo(data);
        }
      } catch {
        // Non-critical — the webhook is the source of truth
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [txRef]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConfirmed = info?.payment?.status === "successful";
  const isPending = info?.payment?.status === "pending";

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {isConfirmed ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          ) : isPending ? (
            <Clock className="mx-auto h-16 w-16 text-yellow-500" />
          ) : (
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          )}
          <CardTitle className="mt-4 text-2xl">
            {isConfirmed
              ? "Payment Successful!"
              : isPending
                ? "Payment Processing"
                : "Thank You!"}
          </CardTitle>
          <CardDescription>
            {isConfirmed
              ? isTournament
                ? "Your tournament registration has been confirmed. Good luck!"
                : "Your booking has been confirmed. See you on the pitch!"
              : isPending
                ? isTournament
                  ? "Your payment is being processed. Your tournament registration will be confirmed shortly."
                  : "Your payment is being processed. Your booking will be confirmed shortly."
                : isTournament
                  ? "Your payment has been received. We're confirming your tournament registration."
                  : "Your payment has been received. We're processing your booking."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {info && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              {info.booking && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {new Date(info.booking.date).toLocaleDateString("en-NG", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {info.booking.startTime} – {info.booking.endTime}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {info.payment.currency}{" "}
                  {info.payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium text-xs">{info.payment.txRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={isConfirmed ? "default" : "outline"}
                  className="capitalize"
                >
                  {info.payment.status}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {isTournament ? (
              <Button asChild>
                <Link href="/dashboard/tournaments">View My Tournaments</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/bookings">View My Bookings</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
