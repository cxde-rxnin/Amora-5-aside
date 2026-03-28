"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type EntityType = "booking" | "tournament" | "match" | "payment" | "team" | "config";

interface AuditLogEntry {
  id: string;
  admin: { name: string; email: string };
  action: string;
  entityType: EntityType;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const ENTITY_COLORS: Record<
  EntityType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  booking: "default",
  tournament: "secondary",
  match: "outline",
  payment: "destructive",
  team: "secondary",
  config: "outline",
};

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function MetadataCell({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="text-xs space-y-0.5">
      {entries.slice(0, 3).map(([k, v]) => (
        <div key={k}>
          <span className="font-medium">{k}:</span>{" "}
          <span className="text-muted-foreground">
            {Array.isArray(v) ? v.join(", ") : String(v)}
          </span>
        </div>
      ))}
      {entries.length > 3 && (
        <div className="text-muted-foreground">+{entries.length - 3} more</div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (entityType && entityType !== "all") params.set("entityType", entityType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const json = await res.json();
      setLogs(json.logs ?? []);
    } catch {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [entityType, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Admin action history — newest first
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="entityType">Entity Type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger id="entityType" className="w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
              <SelectItem value="match">Match</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="config">Config</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setEntityType("all");
            setDateFrom("");
            setDateTo("");
          }}
        >
          Clear
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          No audit log entries found.
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.admin.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.admin.email}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {formatAction(log.action)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ENTITY_COLORS[log.entityType as EntityType] ?? "outline"
                      }
                    >
                      {log.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {log.entityId.slice(-8)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <MetadataCell data={log.metadata ?? {}} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
