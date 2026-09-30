import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TeamCard from "@/components/TeamCard";
import { UserPlus, FolderKanban, Loader2, MessageSquare } from "lucide-react";

export default function MyTeams() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const isLeader = profile?.role === "team_leader";

  const { data: ledTeams = [], isLoading: ledLoading } = useQuery({
    queryKey: ["myLedTeams", user?.id],
    queryFn: async () => base44.entities.Team.filter({ leader_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.id],
    queryFn: async () => base44.entities.TeamMember.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const memberTeamIds = useMemo(() => memberships.map((m) => m.team_id), [memberships]);

  const { data: memberTeams = [], isLoading: memLoading } = useQuery({
    queryKey: ["memberTeams", memberTeamIds.join(",")],
    queryFn: async () => {
      if (memberTeamIds.length === 0) return [];
      const teams = await base44.entities.Team.list("-created_date", 100);
      return teams.filter((t) => memberTeamIds.includes(t.id) && t.leader_id !== user.id);
    },
    enabled: memberTeamIds.length > 0,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => base44.entities.Profile.list("-created_date", 200),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: async () => base44.entities.TeamMember.list("-created_date", 500),
  });
  const leaderMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p])), [profiles]);
  const memberCountMap = useMemo(() => {
    const m = {};
    members.forEach((mem) => { m[mem.team_id] = (m[mem.team_id] || 0) + 1; });
    return m;
  }, [members]);

  const isLoading = ledLoading || memLoading;

  return (
    <div>
      <PageHeader title="My Teams" description="Teams you lead and teams you're a member of.">
        {isLeader && <Link to="/teams/create"><Button><UserPlus className="w-4 h-4 mr-2" /> Create team</Button></Link>}
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">
          {isLeader && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Teams you lead</h2>
              {ledTeams.length === 0 ? (
                <EmptyState icon={FolderKanban} title="No teams yet" description="Create your first team to start recruiting." action={<Link to="/teams/create"><Button size="sm">Create team</Button></Link>} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ledTeams.map((t) => (
                    <TeamCard key={t.id} team={t} leaderProfile={leaderMap[t.leader_id]} memberCount={memberCountMap[t.id] || 0}
                      action={t.status === "locked"
                        ? <Button size="sm" variant="outline" asChild><Link to={`/workspace/${t.id}`}><MessageSquare className="w-3.5 h-3.5 mr-1" /> Workspace</Link></Button>
                        : <Button size="sm" variant="outline" asChild><Link to={`/team/${t.id}`}>Manage</Link></Button>}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Teams you're on</h2>
            {memberTeams.length === 0 ? (
              <EmptyState icon={FolderKanban} title="Not on any teams yet" description="Discover teams and send join requests to get started." action={<Link to="/teams"><Button size="sm">Discover teams</Button></Link>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {memberTeams.map((t) => (
                  <TeamCard key={t.id} team={t} leaderProfile={leaderMap[t.leader_id]} memberCount={memberCountMap[t.id] || 0}
                    action={t.status === "locked"
                      ? <Button size="sm" variant="outline" asChild><Link to={`/workspace/${t.id}`}><MessageSquare className="w-3.5 h-3.5 mr-1" /> Workspace</Link></Button>
                      : <Button size="sm" variant="outline" asChild><Link to={`/team/${t.id}`}>View</Link></Button>}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
