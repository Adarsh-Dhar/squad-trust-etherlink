import { Card, CardContent } from "@/components/ui/card"
import { Shield, Users, TrendingUp, CheckCircle, History, Award } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: History,
      title: "Track Past Projects",
      description: "Comprehensive project history with verified contributions and outcomes.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CheckCircle,
      title: "Verify Contributor Roles",
      description: "Blockchain-verified role assignments and contribution validation.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Award,
      title: "Build Trust Scores",
      description: "Algorithmic trust scoring based on verified project success and collaboration.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Transparent team formation with verified skill sets and past performance.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Data-driven insights into team performance and project success rates.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable records ensuring data integrity and preventing reputation manipulation.",
      color: "from-teal-500 to-green-500",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            How SquadTrust{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform combines blockchain technology with intelligent reputation tracking to create the most trusted
            environment for team collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
