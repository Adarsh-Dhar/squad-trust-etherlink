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

interface Dispute {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export default function DisputesPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // Fetch disputes
  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/disputes");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch disputes");
        setDisputes(data);
      } catch (e: any) {
        setError(e.message || "Failed to load disputes");
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl animate-fade-in">
      <h1 className="text-4xl font-bold mb-8 text-center">Disputes</h1>

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium max-w-[180px] truncate" title={d.title}>{d.title}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={d.description}>{d.description}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {d.status === "PENDING" && (
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
