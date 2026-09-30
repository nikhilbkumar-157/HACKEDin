import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ParticipantCard from "@/components/ParticipantCard";
import { Search, Loader2, UserSearch, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DiscoverParticipants() {
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteTeam, setInviteTeam] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => base44.entities.Profile.list("-created_date", 200),
  });

  const { data: myTeams = [] } = useQuery({
    queryKey: ["myLedTeams", user?.id],
    queryFn: async () => base44.entities.Team.filter({ leader_id: user.id, status: "open" }, "-created_date"),
    enabled: !!user?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: async () => base44.entities.TeamMember.list("-created_date", 500),
  });

  const { data: mySentInvites = [] } = useQuery({
    queryKey: ["mySentInvites", user?.id],
    queryFn: async () => base44.entities.Request.filter({ sender_id: user.id, request_type: "invitation" }),
    enabled: !!user?.id,
  });

  const memberTeamMap = useMemo(() => {
    const m = {};
    members.forEach((mem) => {
      if (!m[mem.team_id]) m[mem.team_id] = new Set();
      m[mem.team_id].add(mem.user_id);
    });
    return m;
  }, [members]);

  const teamMemberCount = useMemo(() => {
    const m = {};
    members.forEach((mem) => { m[mem.team_id] = (m[mem.team_id] || 0) + 1; });
    return m;
  }, [members]);

  const pendingInviteMap = useMemo(() => {
    const m = {};
    mySentInvites.forEach((r) => {
      if (r.status === "pending") m[`${r.team_id}_${r.receiver_id}`] = true;
    });
    return m;
  }, [mySentInvites]);

  const allSkills = useMemo(() => {
    const s = new Set();
    profiles.forEach((p) => p.technical_skills?.forEach((sk) => s.add(sk)));
    return Array.from(s).sort();
  }, [profiles]);

  const allRoles = useMemo(() => {
    const r = new Set();
    profiles.forEach((p) => p.preferred_roles?.forEach((ro) => r.add(ro)));
    return Array.from(r).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (p.user_id === user.id) return false;
      if (p.role !== "participant") return false;
      if (skillFilter && !p.technical_skills?.includes(skillFilter)) return false;
      if (roleFilter && !p.preferred_roles?.includes(roleFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.full_name} ${p.college} ${p.bio} ${p.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, search, skillFilter, roleFilter, user.id]);

  const openInvite = (profile) => {
    if (myTeams.length === 0) {
      toast({ title: "No open teams", description: "Create a team first before inviting participants.", variant: "destructive" });
      return;
    }
    setInviteTarget(profile);
    setInviteTeam(myTeams[0].id);
    setInviteMessage("");
  };

  const handleSendInvite = async () => {
    const team = myTeams.find((t) => t.id === inviteTeam);
    if (!team) return;
    if (memberTeamMap[team.id]?.has(inviteTarget.user_id)) {
      toast({ title: "Already a member", description: "This participant is already on your team.", variant: "destructive" });
      return;
    }
    if (teamMemberCount[team.id] >= team.max_members) {
      toast({ title: "Team is full", description: "Your team has reached its maximum size.", variant: "destructive" });
      return;
    }
    if (pendingInviteMap[`${team.id}_${inviteTarget.user_id}`]) {
      toast({ title: "Invitation already sent", description: "You have a pending invitation for this participant." });
      return;
    }
    setSending(true);
    try {
      await base44.entities.Request.create({
        sender_id: user.id,
        receiver_id: inviteTarget.user_id,
        team_id: team.id,
        request_type: "invitation",
        status: "pending",
        message: inviteMessage.trim(),
      });
      await base44.entities.Notification.create({
        user_id: inviteTarget.user_id,
        type: "invitation",
        message: `${myProfile.full_name} invited you to join ${team.team_name}`,
        related_id: team.id,
        link: "/requests",
      });
      queryClient.invalidateQueries({ queryKey: ["mySentInvites"] });
      toast({ title: "Invitation sent", description: `Invited ${inviteTarget.full_name} to ${team.team_name}.` });
      setInviteTarget(null);
    } catch (err) {
      toast({ title: "Failed to send invitation", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Discover Participants" description="Find skilled participants to join your team." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, college, bio..." className="pl-10 h-11" />
        </div>
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
        <EmptyState icon={UserSearch} title="No participants found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ParticipantCard key={p.id} profile={p} action={
              <Button size="sm" onClick={() => openInvite(p)}><Send className="w-3.5 h-3.5 mr-1.5" /> Invite</Button>
            } />
          ))}
        </div>
      )}

      <Dialog open={!!inviteTarget} onOpenChange={(o) => !o && setInviteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to your team</DialogTitle>
            <DialogDescription>Send an invitation to {inviteTarget?.full_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select team</label>
              <select value={inviteTeam} onChange={(e) => setInviteTeam(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {myTeams.map((t) => <option key={t.id} value={t.id}>{t.team_name} ({teamMemberCount[t.id] || 0}/{t.max_members})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Why do you want them on your team?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteTarget(null)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
