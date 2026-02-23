"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Ban,
  ShieldBan,
  Trash2,
  CalendarDays,
  CheckCircle,
  Search,
} from "lucide-react";
import { formatDateParam } from "@/lib/slots";

interface AdminBooking {
  id: string;
  user: { id: string; name: string; email: string; phone?: string } | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  createdAt: string;
}

interface BlockedSlotItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy: { id: string; name: string; email: string } | null;
  createdAt: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
  "checked-in": "secondary",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Block slot dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);

      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch {
      toast.error("Failed to load bookings");
    }
  }, [filterDate, filterStatus, debouncedSearchQuery]);

  const fetchBlockedSlots = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);

      const res = await fetch(`/api/admin/block-slot?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedSlots(data.blockedSlots);
      }
    } catch {
      toast.error("Failed to load blocked slots");
    }
  }, [filterDate]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchBlockedSlots()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchBookings, fetchBlockedSlots]);

  async function handleCheckInBooking(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked-in" }),
      });
      if (res.ok) {
        toast.success("User checked in successfully");
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to check in");
      }
    } catch {
      toast.error("Failed to check in booking");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleConfirmBooking(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        toast.success("Booking confirmed");
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to confirm");
      }
    } catch {
      toast.error("Failed to confirm booking");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleBlockSlot() {
    if (!blockDate || !blockStartTime || !blockEndTime || !blockReason) {
      toast.error("All fields are required");
      return;
    }

    setBlockSubmitting(true);
    try {
      const res = await fetch("/api/admin/block-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: blockDate,
          startTime: blockStartTime,
          endTime: blockEndTime,
          reason: blockReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Slot blocked successfully");
        setBlockDialogOpen(false);
        setBlockDate("");
        setBlockStartTime("");
        setBlockEndTime("");
        setBlockReason("");
        fetchBlockedSlots();
      } else {
        toast.error(data.error || "Failed to block slot");
      }
    } catch {
      toast.error("Failed to block slot");
    } finally {
      setBlockSubmitting(false);
    }
  }

  async function handleDeleteBlockedSlot(id: string) {
    try {
      const res = await fetch(`/api/admin/block-slot?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Blocked slot removed");
        fetchBlockedSlots();
      } else {
        toast.error("Failed to remove blocked slot");
      }
    } catch {
      toast.error("Failed to remove blocked slot");
    }
  }

  // Generate time options for select
  const timeOptions = [];
  for (let h = 8; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin: Bookings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all bookings and blocked slots
          </p>
        </div>
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <ShieldBan className="mr-2 h-4 w-4" />
              Block Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Time Slot</DialogTitle>
              <DialogDescription>
                Block a time range to prevent bookings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select
                    value={blockStartTime}
                    onValueChange={setBlockStartTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(0, -1).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Time</Label>
                  <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.slice(1).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Maintenance, Private event"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleBlockSlot}
                disabled={blockSubmitting}
              >
                {blockSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Block Slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <Label className="mb-1.5 block text-sm">Search Booking by User</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                }
              }}
            />
            <Button
              onClick={() => setSearchQuery(searchInput)}
              variant="default"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
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

      <Tabs defaultValue="bookings" className="mt-6">
        <TabsList>
          <TabsTrigger value="bookings">
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked Slots ({blockedSlots.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No bookings found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filterDate || filterStatus !== "all" || searchQuery
                    ? "Try adjusting your filters or search"
                    : "No bookings have been made yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {booking.user?.name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {booking.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(booking.date).toLocaleDateString(
                              "en-NG",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.startTime} – {booking.endTime}
                          </TableCell>
                          <TableCell>
                            {booking.duration === 60 ? "1hr" : "2hr"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="capitalize"
                            >
                              {booking.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusColors[booking.status] ?? "secondary"}
                              className="capitalize"
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {booking.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleConfirmBooking(booking.id)
                                  }
                                  disabled={cancellingId === booking.id}
                                >
                                  Confirm
                                </Button>
                              )}
                              {booking.status === "confirmed" && new Date(booking.date) <= new Date() && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    handleCheckInBooking(booking.id)
                                  }
                                  disabled={cancellingId === booking.id}
                                >
                                  {cancellingId === booking.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Check In
                                    </span>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Blocked Slots Tab */}
        <TabsContent value="blocked">
          {blockedSlots.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShieldBan className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No blocked slots</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Block a time slot to prevent bookings
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            {new Date(slot.date).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            {slot.startTime} – {slot.endTime}
                          </TableCell>
                          <TableCell>{slot.reason}</TableCell>
                          <TableCell>
                            {slot.createdBy?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBlockedSlot(slot.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
