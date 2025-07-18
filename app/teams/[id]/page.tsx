import { TeamProfile } from "@/components/team-profile"

export default function TeamPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen py-8">
      <TeamProfile teamId={params.id} />
    </div>
  )
}
