"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CreateProjectForm } from "@/components/create-project-form";
import { useSession } from "next-auth/react";

export function TeamsDirectory() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("")
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<{ teamId: string | null }>({ teamId: null })
  const [leaving, setLeaving] = useState<string | null>(null)

  // Fetch teams and their stats
  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/teams")
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Failed to fetch teams")
        
        // For each team, fetch trust score, members, and projects
        const teamsWithStats = await Promise.all(
          data.map(async (team: any) => {
            // Trust Score
            let trustScore = null
            try {
              const scoreRes = await fetch(`/api/teams/${team.id}/score`)
              if (scoreRes.ok) {
                const scoreData = await scoreRes.json()
                trustScore = scoreData.score ? Math.round(scoreData.score) : null
              }
            } catch {}
            
            // Members
            let members = []
            try {
              const membersRes = await fetch(`/api/teams/${team.id}/members`)
              if (membersRes.ok) {
                members = await membersRes.json()
              }
            } catch {}
            
            // Projects
            let projects = []
            try {
              const projectsRes = await fetch(`/api/teams/${team.id}/projects`)
              if (projectsRes.ok) {
                projects = await projectsRes.json()
              }
            } catch {}
            
            // Check if current user is a member (only if authenticated)
            let isMember = false
            if (session?.user?.walletAddress) {
              try {
                const userRes = await fetch(`/api/users/wallet/${session.user.walletAddress}`)
                if (userRes.ok) {
                  const user = await userRes.json()
                  isMember = Array.isArray(members) && members.some((m: any) => m.userId === user.id)
                }
              } catch {}
            }
            
            return {
              ...team,
              trustScore,
              membersCount: Array.isArray(members) ? members.length : 0,
              projectsCount: Array.isArray(projects) ? projects.length : 0,
              isMember,
            }
          })
        )
        setTeams(teamsWithStats)
      } catch (e: any) {
        setError(e.message || "Failed to load teams")
      } finally {
        setLoading(false)
      }
    }
    
    if (status === "loading") return;
    fetchTeams()
  }, [status, session])

  // Search filter
  const filteredTeams = teams.filter((team) => {
    const term = searchTerm.toLowerCase()
    return (
      team.name.toLowerCase().includes(term) ||
      (team.bio && team.bio.toLowerCase().includes(term))
    )
  })

  // Trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-blue-500 to-cyan-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
  }

  // Join team handler
  const handleJoin = async (teamId: string) => {
    if (!session?.user?.walletAddress) {
      setError("Please log in to join teams.");
      return;
    }

    setJoining(teamId)
    setError(null)
    try {
      // First, get the user by wallet address
      const userRes = await fetch(`/api/users/wallet/${session.user.walletAddress}`)
      if (!userRes.ok) {
        throw new Error("User not found")
      }
      const user = await userRes.json()
      console.log("user", user)
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: "member" }),
      })
      console.log("res", res)
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) {
          // User is already a member, update UI accordingly
          setTeams((prev) =>
            prev.map((t) =>
              t.id === teamId ? { ...t, membersCount: t.membersCount + 1, isMember: true } : t
            )
          )
        } else {
          throw new Error(err.error || "Failed to join team")
        }
      } else {
        // Update UI
        setTeams((prev) =>
          prev.map((t) =>
            t.id === teamId ? { ...t, membersCount: t.membersCount + 1, isMember: true } : t
          )
        )
      }
    } catch (e: any) {
      setError(e.message || "Failed to join team")
    } finally {
      setJoining(null)
    }
  }

  // Leave team handler
  const handleLeave = async (teamId: string) => {
    if (!session?.user?.walletAddress) {
      setError("Please log in to leave teams.");
      return;
    }

    setLeaving(teamId)
    setError(null)
    try {
      // First, get the user by wallet address
      const userRes = await fetch(`/api/users/wallet/${session.user.walletAddress}`)
      if (!userRes.ok) {
        throw new Error("User not found")
      }
      const user = await userRes.json()

      const res = await fetch(`/api/teams/${teamId}/members/${user.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to leave team")
      }
      // Update UI
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, membersCount: t.membersCount - 1, isMember: false } : t
        )
      )
    } catch (e: any) {
      setError(e.message || "Failed to leave team")
    } finally {
      setLeaving(null)
      setShowConfirm({ teamId: null })
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          Discover{" "}
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Trusted Teams
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore blockchain teams with verified track records and transparent reputation scores.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Error/Loading */}
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team, index) => (
            <Card
              key={team.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Team Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl">🏢</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">{team.bio || "No description"}</p>
                  </div>
                </div>

                {/* Trust Score */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Trust Score</span>
                    <span className="text-sm font-bold text-primary">{team.trustScore !== null ? `${team.trustScore}/100` : "N/A"}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${getTrustScoreColor(team.trustScore || 0)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${team.trustScore || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{team.projectsCount}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">{team.membersCount}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                </div>

                {/* Join/Leave/Details Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/teams/${team.id}`}>Details</Link>
                  </Button>
                  {!team.isMember ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={joining === team.id}
                      onClick={(e) => {
                        e.preventDefault()
                        handleJoin(team.id)
                      }}
                    >
                      {joining === team.id ? "Joining..." : "Join"}
                    </Button>
                  ) : (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="default">Create Project</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create a New Project</DialogTitle>
                            <DialogDescription>
                              Add a new project to your team. Fill in the details below.
                            </DialogDescription>
                          </DialogHeader>
                          <CreateProjectForm teamId={team.id} redirectToProjects />
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={leaving === team.id}
                        onClick={(e) => {
                          e.preventDefault()
                          setShowConfirm({ teamId: team.id })
                        }}
                      >
                        {leaving === team.id ? "Leaving..." : "Leave"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leave Confirmation Dialog */}
      {showConfirm.teamId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 max-w-sm w-full">
            <div className="mb-4 text-lg font-semibold">Are you sure you want to leave?</div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm({ teamId: null })}
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleLeave(showConfirm.teamId!)}
                disabled={leaving === showConfirm.teamId}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No teams found matching your search criteria.</p>
        </div>
      )}
    </div>
  )
}
