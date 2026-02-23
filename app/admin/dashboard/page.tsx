"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    byType: Record<string, { total: number; count: number }>;
  };
  bookings: {
    total: number;
    thisMonth: number;
    cancelled: number;
    peakHour: string | null;
    mostBookedDay: string | null;
  };
  tournaments: {
    total: number;
    byStatus: Record<string, number>;
    totalRegistrations: number;
    paidRegistrations: number;
  };
  matches: {
    total: number;
    completed: number;
    totalGoals: number;
    totalCards: number;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-red-500">{error ?? "No data available"}</div>
    );
  }

  const bookingRevenue = data.revenue.byType["booking"];
  const tournamentRevenue = data.revenue.byType["tournament_entry"];

  const tournamentStatusOrder = ["draft", "open", "ongoing", "completed"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform analytics overview
        </p>
      </div>

      {/* Top-level summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.revenue.total)}
          sub={`${formatCurrency(data.revenue.thisMonth)} this month`}
        />
        <StatCard
          title="Total Bookings"
          value={data.bookings.total}
          sub={`${data.bookings.thisMonth} this month`}
        />
        <StatCard
          title="Tournaments"
          value={data.tournaments.total}
          sub={`${data.tournaments.paidRegistrations} confirmed registrations`}
        />
        <StatCard
          title="Matches Played"
          value={data.matches.completed}
          sub={`${data.matches.total} total scheduled`}
        />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(data.revenue.total)}
            />
            <StatCard
              title="This Month"
              value={formatCurrency(data.revenue.thisMonth)}
            />
            <StatCard
              title="Total Transactions"
              value={
                (bookingRevenue?.count ?? 0) +
                (tournamentRevenue?.count ?? 0)
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Booking Payments</Badge>
                    <span className="text-sm text-muted-foreground">
                      {bookingRevenue?.count ?? 0} transactions
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(bookingRevenue?.total ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tournament Entry Fees</Badge>
                    <span className="text-sm text-muted-foreground">
                      {tournamentRevenue?.count ?? 0} transactions
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(tournamentRevenue?.total ?? 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Bookings"
              value={data.bookings.total}
            />
            <StatCard
              title="This Month"
              value={data.bookings.thisMonth}
            />
            <StatCard
              title="Cancelled"
              value={data.bookings.cancelled}
              sub={
                data.bookings.total > 0
                  ? `${Math.round((data.bookings.cancelled / data.bookings.total) * 100)}% cancellation rate`
                  : undefined
              }
            />
            <StatCard
              title="Active"
              value={data.bookings.total - data.bookings.cancelled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Peak Booking Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.bookings.peakHour ?? "—"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Most popular start time
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Booked Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.bookings.mostBookedDay ?? "—"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Busiest day of the week
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Tournaments"
              value={data.tournaments.total}
            />
            <StatCard
              title="Total Registrations"
              value={data.tournaments.totalRegistrations}
              sub={`${data.tournaments.paidRegistrations} confirmed`}
            />
            <StatCard
              title="Total Matches"
              value={data.matches.total}
              sub={`${data.matches.completed} completed`}
            />
            <StatCard
              title="Goals Scored"
              value={data.matches.totalGoals}
              sub={`${data.matches.totalCards} cards issued`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tournaments by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {tournamentStatusOrder.map((status) => {
                  const count = data.tournaments.byStatus[status] ?? 0;
                  const variantMap: Record<
                    string,
                    "default" | "secondary" | "outline" | "destructive"
                  > = {
                    draft: "outline",
                    open: "secondary",
                    ongoing: "default",
                    completed: "secondary",
                  };
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2 border rounded-md px-3 py-2"
                    >
                      <Badge variant={variantMap[status] ?? "outline"}>
                        {status}
                      </Badge>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
