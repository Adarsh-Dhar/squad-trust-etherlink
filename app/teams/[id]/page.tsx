import { TeamProfile } from "@/components/team-profile"

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen py-8 bg-background">
      <TeamProfile teamId={id} />
    </div>
  )
}
