import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TeamCard from "@/components/TeamCard";
import { Search, SlidersHorizontal, Loader2, Check, Lock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function DiscoverTeams() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [pendingAction, setPendingAction] = useState(null);

  const isLeader = profile?.role === "team_leader";

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["allTeams"],
    queryFn: async () => base44.entities.Team.list("-created_date", 200),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => base44.entities.Profile.list("-created_date", 200),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: async () => base44.entities.TeamMember.list("-created_date", 500),
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["mySentRequests", user?.id],
    queryFn: async () => base44.entities.Request.filter({ sender_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.id],
    queryFn: async () => base44.entities.TeamMember.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const leaderMap = useMemo(() => {
    const m = {};
    profiles.forEach((p) => { m[p.user_id] = p; });
    return m;
  }, [profiles]);

  const memberCountMap = useMemo(() => {
    const m = {};
    members.forEach((mem) => { m[mem.team_id] = (m[mem.team_id] || 0) + 1; });
    return m;
  }, [members]);

  const myTeamIds = new Set(myMemberships.map((m) => m.team_id));
  const myPendingTeamIds = new Set(myRequests.filter((r) => r.status === "pending" && r.request_type === "join_request").map((r) => r.team_id));

  const allSkills = useMemo(() => {
    const s = new Set();
    teams.forEach((t) => t.required_skills?.forEach((sk) => s.add(sk)));
    return Array.from(s).sort();
  }, [teams]);

  const allRoles = useMemo(() => {
    const r = new Set();
    teams.forEach((t) => t.required_roles?.forEach((ro) => r.add(ro)));
    return Array.from(r).sort();
  }, [teams]);

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (skillFilter && !t.required_skills?.includes(skillFilter)) return false;
      if (roleFilter && !t.required_roles?.includes(roleFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.team_name} ${t.hackathon_name} ${t.project_title} ${t.project_description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [teams, statusFilter, skillFilter, roleFilter, search]);

  const handleJoin = async (team) => {
    if (team.status === "locked") {
      toast({ title: "Team is locked", description: "This team is no longer accepting requests.", variant: "destructive" });
      return;
    }
    if (myTeamIds.has(team.id)) {
      toast({ title: "Already a member", description: "You're already on this team.", variant: "destructive" });
      return;
    }
    if (myPendingTeamIds.has(team.id)) {
      toast({ title: "Request pending", description: "You've already requested to join this team." });
      return;
    }
    if (memberCountMap[team.id] >= team.max_members) {
      toast({ title: "Team is full", description: "This team has reached its maximum size.", variant: "destructive" });
      return;
    }
    setPendingAction(team.id);
    try {
      await base44.entities.Request.create({
        sender_id: user.id,
        receiver_id: team.leader_id,
        team_id: team.id,
        request_type: "join_request",
        status: "pending",
      });
      await base44.entities.Notification.create({
        user_id: team.leader_id,
        type: "join_request",
        message: `${profile.full_name} requested to join ${team.team_name}`,
        related_id: team.id,
        link: "/requests",
      });
      queryClient.invalidateQueries({ queryKey: ["mySentRequests"] });
      toast({ title: "Request sent", description: `Your request to join ${team.team_name} was sent.` });
    } catch (err) {
      toast({ title: "Failed to send request", description: err.message, variant: "destructive" });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div>
      <PageHeader title="Discover Teams" description="Find teams looking for your skills." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams, hackathons, projects..." className="pl-10 h-11" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
          <option value="open">Open teams</option>
          <option value="locked">Locked teams</option>
          <option value="all">All</option>
        </select>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All skills</option>
          {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="No teams found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => {
            const isMember = myTeamIds.has(t.id);
            const isPending = myPendingTeamIds.has(t.id);
            const isFull = memberCountMap[t.id] >= t.max_members;
            let action;
            if (isLeader && t.leader_id === user.id) {
              action = <Button variant="outline" size="sm" asChild><a href={`/team/${t.id}`}>Manage</a></Button>;
            } else if (isMember) {
              action = <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Member</span>;
            } else if (t.status === "locked") {
              action = <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Locked</span>;
            } else if (isPending) {
              action = <span className="text-xs text-blue-600 font-medium">Pending</span>;
            } else if (isFull) {
              action = <span className="text-xs text-muted-foreground">Full</span>;
            } else {
              action = (
                <Button size="sm" disabled={pendingAction === t.id} onClick={() => handleJoin(t)}>
                  {pendingAction === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Request to join"}
                </Button>
              );
            }
            return (
              <TeamCard key={t.id} team={t} leaderProfile={leaderMap[t.leader_id]} memberCount={memberCountMap[t.id] || 0} action={action} />
            );
          })}
        </div>
      )}
    </div>
  );
}
