import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import TeamForm from "@/components/TeamForm";
import PageHeader from "@/components/PageHeader";

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Create a team" description="Set up your team profile and start recruiting." />
      <TeamForm leaderId={user.id} onSaved={() => navigate("/my-teams")} />
    </div>
  );
}
