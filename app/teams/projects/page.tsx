"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClaimRoleButton } from "@/components/ui/claim-role-button";
import Link from "next/link";

interface Project {
  id: string;
  name: string; // Changed from title to name
  description?: string;
  creator: string; // Wallet address of the project creator
  teamId: string;
  githubRepo?: string;
  liveUrl?: string;
}

interface Team {
  id: string;
  name: string;
}

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAllProjects() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all teams
        const teamsRes = await fetch("/api/teams");
        const teamsData: Team[] = await teamsRes.json();
        const teamsMap: Record<string, Team> = {};
        teamsData.forEach((team) => {
          teamsMap[team.id] = team;
        });
        setTeams(teamsMap);
        // Fetch all projects for each team
        const allProjects: Project[] = [];
        await Promise.all(
          teamsData.map(async (team) => {
            try {
              const projectsRes = await fetch(`/api/teams/${team.id}/projects`);
              const teamProjects = await projectsRes.json();
              if (Array.isArray(teamProjects)) {
                allProjects.push(...teamProjects.map((p: any) => ({ ...p, teamId: team.id })));
              }
            } catch {}
          })
        );
        setProjects(allProjects);
      } catch (e: any) {
        setError(e.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchAllProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const term = search.toLowerCase();
    return (
      project.name.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term)) ||
      (teams[project.teamId]?.name?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="max-w-2xl mx-auto mb-10 text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          All Projects
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse all projects from every team on SquadTrust.
        </p>
      </div>
      <div className="flex justify-center mb-8 animate-slide-up">
        <Input
          placeholder="Search projects by title, description, or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} passHref legacyBehavior>
              <a className="block">
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-up">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description || "No description"}
                      </p>
                      <div className="text-xs text-muted-foreground mb-2">
                        Team: <span className="font-medium text-primary">{teams[project.teamId]?.name || project.teamId}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Created by: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                        </span>
                      </div>
                      {project.githubRepo && (
                        <a
                          href={project.githubRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline block mb-1"
                          onClick={e => e.stopPropagation()}
                        >
                          GitHub Repo
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline block"
                          onClick={e => e.stopPropagation()}
                        >
                          Live Site
                        </a>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <ClaimRoleButton projectId={project.id} />
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 