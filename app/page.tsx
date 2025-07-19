import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Users, TrendingUp, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Build Trust with
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {" "}Blockchain
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              SquadTrust is a blockchain-based platform that helps teams build and verify reputation 
              through transparent contribution tracking and smart contract verification.
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

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Choose SquadTrust?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Build verifiable reputation in the Web3 ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verifiable Credentials
              </h3>
              <p className="text-muted-foreground">
                All contributions and verifications are stored on-chain, ensuring transparency 
                and immutability of reputation data.
              </p>
            </div>

            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Team Collaboration
              </h3>
              <p className="text-muted-foreground">
                Build teams, track contributions, and manage projects with built-in 
                reputation scoring and verification systems.
              </p>
            </div>

            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Reputation Scoring
              </h3>
              <p className="text-muted-foreground">
                Advanced algorithms calculate credibility scores based on verified 
                contributions and peer reviews.
              </p>
            </div>

            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Smart Contracts
              </h3>
              <p className="text-muted-foreground">
                Automated verification and dispute resolution through smart contracts 
                ensure fair and transparent processes.
              </p>
            </div>

            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Secure Authentication
              </h3>
              <p className="text-muted-foreground">
                Connect with your Web3 wallet for secure, decentralized authentication 
                without traditional passwords.
              </p>
            </div>

            <div className="relative p-6 bg-background rounded-xl border shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Community Driven
              </h3>
              <p className="text-muted-foreground">
                Join a community of builders, creators, and teams building the future 
                of decentralized reputation.
              </p>
            </div>
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
              Join thousands of builders and teams who are already using SquadTrust 
              to build verifiable reputation in the Web3 ecosystem.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Link href="/auth/signup">Connect Wallet & Start</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
