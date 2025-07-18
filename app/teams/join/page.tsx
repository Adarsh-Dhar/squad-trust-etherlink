"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (teamId: string) => {
    setJoining(teamId);
    setError(null);
    // TODO: Replace with actual userId from session/auth
    const userId = "demo-user-id";
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "member" }),
      });
      if (res.ok) {
        setJoined((prev) => [...prev, teamId]);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join team.");
      }
    } catch (e) {
      setError("Failed to join team.");
    }
    setJoining(null);
  };

  const filteredTeams = teams.filter((team) =>
    team.name?.toLowerCase().includes(search.toLowerCase()) ||
    team.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Join a Team
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse teams and request to join the ones that match your interests.
        </p>
      </div>
      <div className="flex justify-center mb-8">
        <Input
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No teams found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-up">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-1">{team.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{team.bio}</p>
                </div>
                <Button
                  className="mt-4"
                  disabled={joining === team.id || joined.includes(team.id)}
                  onClick={() => handleJoin(team.id)}
                  variant={joined.includes(team.id) ? "outline" : "default"}
                >
                  {joined.includes(team.id)
                    ? "Requested"
                    : joining === team.id
                    ? "Joining..."
                    : "Join"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-500 mt-6">{error}</div>}
    </div>
  );
}
