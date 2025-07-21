import { Shield, Users, TrendingUp, CheckCircle, History, Award, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              About <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">SquadTrust</span>
            </h1>
            <p className="text-xl text-muted-foreground mt-6 leading-relaxed max-w-2xl mx-auto">
              Building trust in blockchain teams through transparent reputation tracking, on-chain verification, and community-driven collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              SquadTrust empowers teams to build verifiable reputation in the Web3 ecosystem. Our mission is to make collaboration transparent, fair, and secure by leveraging blockchain technology for contribution tracking, role verification, and trust scoring.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section (reuse style) */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Platform <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to build, verify, and showcase your team's reputation on-chain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <History className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Track Past Projects</h3>
                <p className="text-muted-foreground leading-relaxed">Comprehensive project history with verified contributions and outcomes.</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Verify Contributor Roles</h3>
                <p className="text-muted-foreground leading-relaxed">Blockchain-verified role assignments and contribution validation.</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Build Trust Scores</h3>
                <p className="text-muted-foreground leading-relaxed">Algorithmic trust scoring based on verified project success and collaboration.</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Team Collaboration</h3>
                <p className="text-muted-foreground leading-relaxed">Transparent team formation with verified skill sets and past performance.</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Performance Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">Data-driven insights into team performance and project success rates.</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-500 to-green-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">Blockchain Security</h3>
                <p className="text-muted-foreground leading-relaxed">Immutable records ensuring data integrity and preventing reputation manipulation.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              SquadTrust leverages smart contracts and wallet authentication to ensure every contribution is transparent, verifiable, and secure.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 text-center">Connect Wallet</h3>
                <p className="text-muted-foreground text-center">Sign up and authenticate using your Web3 wallet for secure, passwordless access.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 text-center">On-Chain Verification</h3>
                <p className="text-muted-foreground text-center">All actions, roles, and contributions are recorded on-chain for full transparency and auditability.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 text-center">Team Up & Collaborate</h3>
                <p className="text-muted-foreground text-center">Form or join teams, manage projects, and track milestones with built-in reputation scoring.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 text-center">Earn & Showcase Reputation</h3>
                <p className="text-muted-foreground text-center">Build a verifiable reputation and showcase your team's credibility to the world.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community & Values Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Community & Values</h2>
            <p className="text-lg text-muted-foreground">
              Join a global community of builders, creators, and teams who believe in transparency, fairness, and the power of decentralized collaboration.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                <p className="text-muted-foreground">Every action is recorded on-chain, ensuring full transparency and accountability for all members.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
                <p className="text-muted-foreground">We foster a culture of open collaboration, where every contribution is valued and recognized.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Security</h3>
                <p className="text-muted-foreground">Smart contracts and cryptographic proofs protect your reputation and ensure data integrity.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur-sm animate-slide-up">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Community-Driven</h3>
                <p className="text-muted-foreground">Our platform is shaped by its users—builders, creators, and teams who drive the future of decentralized reputation.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Build Your Reputation?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of builders and teams already using SquadTrust to build verifiable reputation in the Web3 ecosystem.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/teams">Explore Teams</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
