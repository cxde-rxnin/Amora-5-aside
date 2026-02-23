"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

interface AdminPayment {
  id: string;
  txRef: string;
  flutterwaveTxId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  user: { id: string; name: string; email: string } | null;
  booking: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  } | null;
  createdAt: string;
}

const paymentStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  successful: "default",
  failed: "destructive",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Stats
  const totalSuccessful = payments
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").length;
  const totalFailed = payments.filter((p) => p.status === "failed").length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Admin: Payments
        </h1>
        <p className="mt-1 text-muted-foreground">
          View all transactions and payment history
        </p>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              NGN {totalSuccessful.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="mt-1 text-2xl font-bold">{totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Failed Payments</p>
            <p className="mt-1 text-2xl font-bold text-destructive">
              {totalFailed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm">Filter by Date</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-sm">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterDate || filterStatus !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {payments.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No payments found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filterDate || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "No payments have been made yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {payment.txRef}
                        </span>
                        {payment.flutterwaveTxId && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            FLW: {payment.flutterwaveTxId}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.user?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.booking ? (
                          <div>
                            <p className="text-sm">
                              {new Date(
                                payment.booking.date
                              ).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.booking.startTime} –{" "}
                              {payment.booking.endTime}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.currency}{" "}
                        {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.paymentMethod || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paymentStatusColors[payment.status] ?? "secondary"
                          }
                          className="capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-NG",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
