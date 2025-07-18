"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, Clock, DollarSign, Award } from "lucide-react"

// Mock data for team profile
const teamData = {
  id: 1,
  name: "DeFi Innovators",
  logo: "🚀",
  description:
    "We are a cutting-edge team focused on building the future of decentralized finance. Our mission is to create innovative DeFi protocols that are secure, scalable, and user-friendly.",
  trustScore: 94,
  members: 8,
  projects: 12,
  totalFunding: "$2.4M",
  founded: "2022",
  tags: ["DeFi", "Smart Contracts", "Ethereum", "Security"],
  pastProjects: [
    {
      id: 1,
      title: "LendingPool Protocol",
      description: "Decentralized lending platform with automated market making",
      status: "Completed",
      funding: "$800K",
      date: "2024",
      contributors: ["Alice Chen", "Bob Smith", "Carol Davis"],
    },
    {
      id: 2,
      title: "YieldFarm Optimizer",
      description: "Automated yield farming strategy optimizer",
      status: "Completed",
      funding: "$600K",
      date: "2023",
      contributors: ["Alice Chen", "David Wilson", "Eve Johnson"],
    },
    {
      id: 3,
      title: "CrossChain Bridge",
      description: "Multi-chain asset bridge with enhanced security",
      status: "In Progress",
      funding: "$1M",
      date: "2024",
      contributors: ["Bob Smith", "Carol Davis", "Frank Miller"],
    },
  ],
  fundingHistory: [
    { round: "Seed", amount: "$500K", date: "2022-03", investors: "Angel Investors" },
    { round: "Series A", amount: "$1.2M", date: "2023-01", investors: "Blockchain Capital" },
    { round: "Series B", amount: "$700K", date: "2024-06", investors: "DeFi Ventures" },
  ],
  contributors: [
    {
      name: "Alice Chen",
      role: "Lead Developer",
      verified: true,
      contributions: 45,
      joinDate: "2022-01",
    },
    {
      name: "Bob Smith",
      role: "Smart Contract Auditor",
      verified: true,
      contributions: 38,
      joinDate: "2022-03",
    },
    {
      name: "Carol Davis",
      role: "Product Manager",
      verified: true,
      contributions: 32,
      joinDate: "2022-06",
    },
    {
      name: "David Wilson",
      role: "Frontend Developer",
      verified: false,
      contributions: 28,
      joinDate: "2023-01",
    },
  ],
}

export function TeamProfile({ teamId }: { teamId: string }) {
  const team = teamData // In real app, fetch based on teamId

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-blue-500 to-cyan-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Team Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-6xl">{team.logo}</div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
                <p className="text-muted-foreground">Founded in {team.founded}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl">{team.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {team.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Trust Score Card */}
          <Card className="w-full lg:w-80 animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary mb-2">{team.trustScore}/100</div>
                <Progress value={team.trustScore} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{team.projects}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{team.members}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{team.totalFunding}</div>
                  <div className="text-xs text-muted-foreground">Raised</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Past Projects</TabsTrigger>
          <TabsTrigger value="funding">Funding History</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        {/* Past Projects */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6">
            {team.pastProjects.map((project, index) => (
              <Card key={project.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{project.title}</h3>
                        <Badge
                          variant={project.status === "Completed" ? "default" : "secondary"}
                          className={project.status === "Completed" ? "bg-green-500" : ""}
                        >
                          {project.status === "Completed" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.contributors.map((contributor) => (
                          <Badge key={contributor} variant="outline" className="text-xs">
                            {contributor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary mb-1">{project.funding}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.date}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Funding History */}
        <TabsContent value="funding" className="space-y-6">
          <div className="grid gap-6">
            {team.fundingHistory.map((funding, index) => (
              <Card key={funding.round} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">{funding.round}</h3>
                      </div>
                      <p className="text-muted-foreground">Led by {funding.investors}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary mb-1">{funding.amount}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {funding.date}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contributors */}
        <TabsContent value="contributors" className="space-y-6">
          <div className="grid gap-4">
            {team.contributors.map((contributor, index) => (
              <Card key={contributor.name} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                        {contributor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{contributor.name}</h3>
                          {contributor.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-muted-foreground">{contributor.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary mb-1">
                        {contributor.contributions} contributions
                      </div>
                      <div className="text-sm text-muted-foreground">Joined {contributor.joinDate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
