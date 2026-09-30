import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import SkillBadge from "@/components/SkillBadge";
import { FolderKanban, Inbox, Users, UserPlus, ArrowRight, CheckCircle2, Bell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const isLeader = profile?.role === "team_leader";

  const { data: myTeams = [] } = useQuery({
    queryKey: ["myLedTeams", user?.id],
    queryFn: async () => base44.entities.Team.filter({ leader_id: user.id }, "-created_date"),
    enabled: !!user?.id && isLeader,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.id],
    queryFn: async () => base44.entities.TeamMember.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const memberTeamIds = memberships.map((m) => m.team_id);
  const { data: memberTeams = [] } = useQuery({
    queryKey: ["memberTeams", memberTeamIds.join(",")],
    queryFn: async () => {
      if (memberTeamIds.length === 0) return [];
      const teams = await base44.entities.Team.list("-created_date", 100);
      return teams.filter((t) => memberTeamIds.includes(t.id));
    },
    enabled: memberTeamIds.length > 0,
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sentRequests", user?.id],
    queryFn: async () => base44.entities.Request.filter({ sender_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["receivedRequests", user?.id],
    queryFn: async () => base44.entities.Request.filter({ receiver_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });

  const pendingInvitations = receivedRequests.filter((r) => r.request_type === "invitation" && r.status === "pending");
  const pendingJoinRequests = receivedRequests.filter((r) => r.request_type === "join_request" && r.status === "pending");
  const myPendingRequests = sentRequests.filter((r) => r.status === "pending");

  // Open teams for participants
  const { data: openTeams = [] } = useQuery({
    queryKey: ["openTeams"],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ status: "open" }, "-created_date", 6);
      return teams;
    },
    enabled: !isLeader,
  });

  // Profile completion
  const completionFields = ["bio", "college", "location", "technical_skills", "non_technical_skills", "preferred_roles", "github_url", "linkedin_url"];
  const filled = completionFields.filter((f) => {
    const val = profile?.[f];
    return Array.isArray(val) ? val.length > 0 : !!val;
  }).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  return (
    <div>
      <PageHeader title={`Welcome back, ${profile?.full_name?.split(" ")[0] || ""}`} description={isLeader ? "Manage your teams and find participants." : "Find teams and track your requests."}>
        {isLeader && (
          <Link to="/teams/create"><Button><UserPlus className="w-4 h-4 mr-2" /> Create team</Button></Link>
        )}
        {!isLeader && (
          <Link to="/teams"><Button><FolderKanban className="w-4 h-4 mr-2" /> Discover teams</Button></Link>
        )}
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="My teams" value={isLeader ? myTeams.length : memberTeams.length} to="/my-teams" />
        <StatCard icon={Inbox} label={isLeader ? "Incoming requests" : "Pending requests"} value={isLeader ? pendingJoinRequests.length : myPendingRequests.length} to="/requests" />
        <StatCard icon={Bell} label="Invitations" value={pendingInvitations.length} to="/requests" />
        <StatCard icon={CheckCircle2} label="Profile complete" value={`${completion}%`} to="/profile" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {isLeader ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Your teams</CardTitle>
                <Link to="/my-teams" className="text-sm text-primary hover:underline">View all</Link>
              </CardHeader>
              <CardContent>
                {myTeams.length === 0 ? (
                  <EmptyState icon={FolderKanban} title="No teams yet" description="Create your first team to start recruiting." action={<Link to="/teams/create"><Button size="sm">Create team</Button></Link>} />
                ) : (
                  <div className="space-y-3">
                    {myTeams.slice(0, 4).map((t) => (
                      <Link key={t.id} to={`/team/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{t.team_name}</p>
                          <p className="text-xs text-muted-foreground">{t.hackathon_name}</p>
                        </div>
                        <StatusBadge status={t.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Open teams for you</CardTitle>
                <Link to="/teams" className="text-sm text-primary hover:underline">Browse all</Link>
              </CardHeader>
              <CardContent>
                {openTeams.length === 0 ? (
                  <EmptyState icon={FolderKanban} title="No open teams yet" description="Check back soon — new teams are created regularly." />
                ) : (
                  <div className="space-y-3">
                    {openTeams.slice(0, 4).map((t) => (
                      <Link key={t.id} to={`/team/${t.id}`} className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{t.team_name}</p>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.hackathon_name} · {t.project_title}</p>
                        {t.required_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.required_skills.slice(0, 4).map((s) => <SkillBadge key={s}>{s}</SkillBadge>)}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current teams (member) */}
          {!isLeader && memberTeams.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Teams you're on</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {memberTeams.map((t) => (
                    <Link key={t.id} to={`/team/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{t.team_name}</p>
                        <p className="text-xs text-muted-foreground">{t.hackathon_name}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Invitations</CardTitle>
              <Link to="/requests" className="text-sm text-primary hover:underline">View</Link>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No pending invitations.</p>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.slice(0, 3).map((r) => (
                    <Link key={r.id} to="/requests" className="block p-2.5 rounded-lg border border-border hover:bg-muted/50">
                      <p className="text-sm font-medium">Team invitation</p>
                      <p className="text-xs text-muted-foreground">{r.message || "You've been invited to join a team."}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isLeader && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Join requests</CardTitle>
                <Link to="/requests" className="text-sm text-primary hover:underline">View</Link>
              </CardHeader>
              <CardContent>
                {pendingJoinRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No pending requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingJoinRequests.slice(0, 3).map((r) => (
                      <Link key={r.id} to="/requests" className="block p-2.5 rounded-lg border border-border hover:bg-muted/50">
                        <p className="text-sm font-medium">New join request</p>
                        <p className="text-xs text-muted-foreground">{r.message || "Someone wants to join your team."}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {completion < 100 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Complete your profile</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">A complete profile helps you get found. You're {completion}% done.</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completion}%` }} />
                </div>
                <Link to="/profile"><Button variant="outline" size="sm" className="w-full">Finish profile <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
