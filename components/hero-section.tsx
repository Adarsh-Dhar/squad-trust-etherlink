import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-slide-in-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Build Trust in{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Blockchain Teams
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mt-6 leading-relaxed">
              SquadTrust revolutionizes team reputation with blockchain-verified contributions, transparent project
              histories, and trustworthy collaboration tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 group"
                asChild
              >
                <Link href="/teams">
                  Explore Teams
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="animate-slide-in-right">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card border rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">DeFi Innovators</h3>
                    <p className="text-sm text-muted-foreground">Trust Score: 94/100</p>
                  </div>
                </div>

                {/* Trust Score Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Trust Score</span>
                    <span className="text-primary font-semibold">94%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-purple-600 h-2 rounded-full w-[94%] animate-pulse"></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">8</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">$2.4M</div>
                    <div className="text-xs text-muted-foreground">Raised</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center animate-bounce">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>

              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-primary rounded-full flex items-center justify-center animate-pulse">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
