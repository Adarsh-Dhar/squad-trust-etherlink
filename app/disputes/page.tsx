"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { disputeUtils } from "@/lib/dispute";

interface Dispute {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

interface DisputeStats {
  total: number;
  pending: number;
  resolved: number;
  rejected: number;
  autoResolved: number;
  autoIgnored: number;
}

export default function DisputesPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [autoResolving, setAutoResolving] = useState(false);

  // Fetch disputes and stats
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [disputesRes, statsRes] = await Promise.all([
          fetch("/api/disputes"),
          fetch("/api/disputes/auto-resolve"),
        ]);
        
        const disputesData = await disputesRes.json();
        const statsData = await statsRes.json();
        
        if (!disputesRes.ok) throw new Error(disputesData.error || "Failed to fetch disputes");
        if (!statsRes.ok) throw new Error(statsData.error || "Failed to fetch stats");
        
        setDisputes(disputesData);
        setStats(statsData.stats);
      } catch (e: any) {
        setError(e.message || "Failed to load disputes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Form for raising dispute
  const form = useForm({
    defaultValues: { title: "", description: "" },
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: { title: string; description: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit dispute");
      setDisputes((prev) => [data, ...prev]);
      form.reset();
      toast({ title: "Dispute submitted", description: "Your dispute has been raised." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to submit dispute.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve dispute
  const handleResolve = async (id: string) => {
    setResolving(true);
    try {
      const res = await fetch(`/api/disputes/${id}/resolve`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve dispute");
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "RESOLVED" } : d)));
      toast({ title: "Dispute resolved", description: "The dispute has been marked as resolved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to resolve dispute.", variant: "destructive" });
    } finally {
      setResolving(false);
      setResolveId(null);
    }
  };

  // Reject dispute
  const handleReject = async (id: string) => {
    setRejecting(true);
    try {
      const res = await fetch(`/api/disputes/${id}/reject`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manually rejected" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject dispute");
      setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "REJECTED" } : d)));
      toast({ title: "Dispute rejected", description: "The dispute has been marked as rejected." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to reject dispute.", variant: "destructive" });
    } finally {
      setRejecting(false);
      setRejectId(null);
    }
  };

  // Auto-resolve all expired disputes
  const handleAutoResolve = async () => {
    setAutoResolving(true);
    try {
      const res = await fetch("/api/disputes/auto-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "both" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to auto-resolve disputes");
      
      // Refresh disputes list
      const disputesRes = await fetch("/api/disputes");
      const disputesData = await disputesRes.json();
      if (disputesRes.ok) {
        setDisputes(disputesData);
      }
      
      toast({ 
        title: "Auto-resolution completed", 
        description: data.message || "Expired disputes have been processed." 
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to auto-resolve disputes.", variant: "destructive" });
    } finally {
      setAutoResolving(false);
    }
  };

  // Status badge color
  const statusBadge = (status: Dispute["status"]) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "RESOLVED":
        return <Badge variant="default">Resolved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get expiration info
  const getExpirationInfo = (dispute: Dispute) => {
    if (dispute.status !== "PENDING") return null;
    
    const daysUntilExpiry = disputeUtils.getDaysUntilExpiry(dispute, 14);
    const isExpired = disputeUtils.isExpired(dispute, 14);
    
    if (isExpired) {
      return <span className="text-red-500 text-sm">Expired</span>;
    }
    
    if (daysUntilExpiry <= 3) {
      return <span className="text-orange-500 text-sm">{daysUntilExpiry} days left</span>;
    }
    
    return <span className="text-muted-foreground text-sm">{daysUntilExpiry} days left</span>;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl animate-fade-in">
      <h1 className="text-4xl font-bold mb-8 text-center">Disputes</h1>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>
      )}

      {/* Auto-resolve Button */}
      <div className="mb-8 text-center">
        <Button 
          onClick={handleAutoResolve} 
          disabled={autoResolving}
          variant="outline"
          className="mb-4"
        >
          {autoResolving ? "Processing..." : "Auto-resolve Expired Disputes"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Automatically resolves disputes older than 14 days
        </p>
      </div>

      {/* Raise Dispute Form */}
      <div className="bg-card border rounded-xl p-8 shadow mb-12">
        <h2 className="text-2xl font-semibold mb-4">Raise a Dispute</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Dispute title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the issue..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Dispute"}
            </Button>
          </form>
        </Form>
      </div>

      {/* Disputes List */}
      <div className="bg-card border rounded-xl p-8 shadow">
        <h2 className="text-2xl font-semibold mb-4">All Disputes</h2>
        {error && <div className="text-destructive mb-4">{error}</div>}
        {loading ? (
          <div className="text-muted-foreground py-8 text-center">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No disputes found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium max-w-[180px] truncate" title={d.title}>{d.title}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={d.description}>{d.description}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell>{disputeUtils.formatDisputeAge(new Date(d.createdAt))}</TableCell>
                  <TableCell>{getExpirationInfo(d)}</TableCell>
                  <TableCell>
                    {d.status === "PENDING" && (
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setResolveId(d.id)} disabled={resolving}>
                              Resolve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Resolve Dispute</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this dispute as resolved?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel asChild>
                                <Button variant="ghost">Cancel</Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="default"
                                  onClick={() => handleResolve(d.id)}
                                  disabled={resolving}
                                >
                                  {resolving && resolveId === d.id ? "Resolving..." : "Yes, Resolve"}
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setRejectId(d.id)} disabled={rejecting}>
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Dispute</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject this dispute? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel asChild>
                                <Button variant="ghost">Cancel</Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(d.id)}
                                  disabled={rejecting}
                                >
                                  {rejecting && rejectId === d.id ? "Rejecting..." : "Yes, Reject"}
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
