"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";

// Mock data for teams (replace with API call)
const mockTeams = [
  { id: "1", name: "Frontend Wizards" },
  { id: "2", name: "Backend Ninjas" },
  { id: "3", name: "DevOps Gurus" },
];

export default function ProfilePage() {
  // Profile form
  const form = useForm({
    defaultValues: {
      name: "",
      bio: "",
    },
  });

  // Teams state
  const [teams, setTeams] = useState(mockTeams); // Replace with API call
  const [requestedTeams, setRequestedTeams] = useState<string[]>([]); // IDs of teams user has requested
  const [createTeamOpen, setCreateTeamOpen] = useState(false);

  // Create team form
  const createTeamForm = useForm({
    defaultValues: {
      teamName: "",
      teamDescription: "",
    },
  });

  // Handlers
  const onProfileSubmit = (data: any) => {
    // TODO: Call API to update profile
    alert("Profile updated! (mock)");
  };

  const handleRequestJoin = (teamId: string) => {
    // TODO: Call API to request join
    setRequestedTeams((prev) => [...prev, teamId]);
  };

  const onCreateTeam = (data: any) => {
    // TODO: Call API to create team
    setTeams((prev) => [...prev, { id: Date.now().toString(), name: data.teamName }]);
    setCreateTeamOpen(false);
    createTeamForm.reset();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short bio about you" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Save Profile</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Teams List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Join Teams</CardTitle>
          <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Create Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
                <DialogDescription>Start your own team and invite others to join.</DialogDescription>
              </DialogHeader>
              <Form {...createTeamForm}>
                <form onSubmit={createTeamForm.handleSubmit(onCreateTeam)} className="space-y-4">
                  <FormField
                    control={createTeamForm.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Team name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTeamForm.control}
                    name="teamDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What is your team about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.length === 0 && <div className="text-muted-foreground">No teams available.</div>}
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between border rounded-md px-4 py-3">
                <div className="font-medium">{team.name}</div>
                {requestedTeams.includes(team.id) ? (
                  <span className="text-xs text-blue-500">Requested</span>
                ) : (
                  <Button size="sm" onClick={() => handleRequestJoin(team.id)}>
                    Request to Join
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
