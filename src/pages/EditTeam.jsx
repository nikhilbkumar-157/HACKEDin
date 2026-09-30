import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import TeamForm from "@/components/TeamForm";
import PageHeader from "@/components/PageHeader";
import { Loader2 } from "lucide-react";

export default function EditTeam() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => base44.entities.Team.get(id),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!team) return <p className="text-center py-20 text-muted-foreground">Team not found.</p>;
  if (team.leader_id !== user.id) return <p className="text-center py-20 text-muted-foreground">You can only edit your own team.</p>;
  if (team.status === "locked") return <p className="text-center py-20 text-muted-foreground">This team is locked and can't be edited.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Edit team" description="Update your team details and recruiting needs." />
      <TeamForm team={team} leaderId={user.id} onSaved={() => navigate(`/team/${id}`)} />
    </div>
  );
}
