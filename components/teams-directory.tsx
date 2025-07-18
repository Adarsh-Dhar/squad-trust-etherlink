"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import Link from "next/link"

// Mock data for teams
const teams = [
  {
    id: 1,
    name: "DeFi Innovators",
    logo: "🚀",
    description: "Building the future of decentralized finance",
    trustScore: 94,
    members: 8,
    projects: 12,
    funding: "$2.4M",
    tags: ["DeFi", "Smart Contracts", "Ethereum"],
  },
  {
    id: 2,
    name: "NFT Creators",
    logo: "🎨",
    description: "Revolutionary NFT marketplace and tools",
    trustScore: 87,
    members: 6,
    projects: 8,
    funding: "$1.8M",
    tags: ["NFT", "Marketplace", "Art"],
  },
  {
    id: 3,
    name: "Web3 Security",
    logo: "🔒",
    description: "Blockchain security auditing and consulting",
    trustScore: 96,
    members: 12,
    projects: 24,
    funding: "$3.2M",
    tags: ["Security", "Auditing", "Consulting"],
  },
  {
    id: 4,
    name: "GameFi Studios",
    logo: "🎮",
    description: "Play-to-earn gaming experiences",
    trustScore: 82,
    members: 15,
    projects: 6,
    funding: "$5.1M",
    tags: ["Gaming", "P2E", "Metaverse"],
  },
  {
    id: 5,
    name: "DAO Builders",
    logo: "🏛️",
    description: "Decentralized governance solutions",
    trustScore: 91,
    members: 10,
    projects: 16,
    funding: "$2.9M",
    tags: ["DAO", "Governance", "Community"],
  },
  {
    id: 6,
    name: "Layer 2 Labs",
    logo: "⚡",
    description: "Scaling solutions for blockchain networks",
    trustScore: 89,
    members: 14,
    projects: 9,
    funding: "$4.5M",
    tags: ["Layer 2", "Scaling", "Infrastructure"],
  },
]

export function TeamsDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTeams, setFilteredTeams] = useState(teams)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = teams.filter(
      (team) =>
        team.name.toLowerCase().includes(term.toLowerCase()) ||
        team.description.toLowerCase().includes(term.toLowerCase()) ||
        team.tags.some((tag) => tag.toLowerCase().includes(term.toLowerCase())),
    )
    setFilteredTeams(filtered)
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-blue-500 to-cyan-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
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
            placeholder="Search teams, skills, or projects..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team, index) => (
          <Card
            key={team.id}
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Link href={`/teams/${team.id}`}>
              <CardContent className="p-6">
                {/* Team Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl">{team.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  </div>
                </div>

                {/* Trust Score */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Trust Score</span>
                    <span className="text-sm font-bold text-primary">{team.trustScore}/100</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${getTrustScoreColor(team.trustScore)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${team.trustScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{team.projects}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">{team.members}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">{team.funding}</div>
                    <div className="text-xs text-muted-foreground">Raised</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {team.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No teams found matching your search criteria.</p>
        </div>
      )}
    </div>
  )
}
