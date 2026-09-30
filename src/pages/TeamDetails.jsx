import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import SkillBadge from "@/components/SkillBadge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Lock, UserPlus, Users, Loader2, ArrowLeft, Trash2, MessageSquare, Check, X, Inbox } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function TeamDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lockOpen, setLockOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [actingRequest, setActingRequest] = useState(null);

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => base44.entities.Team.get(id),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["teamMembers", id],
    queryFn: async () => base44.entities.TeamMember.filter({ team_id: id }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => base44.entities.Profile.list("-created_date", 200),
  });

  const { data: incomingRequests = [] } = useQuery({
    queryKey: ["teamRequests", id],
    queryFn: async () => base44.entities.Request.filter({ team_id: id, request_type: "join_request", status: "pending" }, "-created_date"),
    enabled: !!team && team.leader_id === user.id,
  });

  const profileMap = useMemo(() => {
    const m = {};
    profiles.forEach((p) => { m[p.user_id] = p; });
    return m;
  }, [profiles]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!team) return <p className="text-center py-20 text-muted-foreground">Team not found.</p>;

  const isLeader = team.leader_id === user.id;
  const isMember = members.some((m) => m.user_id === user.id);
  const isLocked = team.status === "locked";
  const memberProfiles = members.map((m) => ({ ...m, profile: profileMap[m.user_id] })).filter((m) => m.profile);
  const capacity = team.max_members - members.length;

  const handleLock = async () => {
    setLocking(true);
    try {
      await base44.entities.Team.update(team.id, { status: "locked", locked_at: new Date().toISOString() });
      await Promise.all(members.map((m) =>
        m.user_id !== user.id && base44.entities.Notification.create({
          user_id: m.user_id, type: "team_locked",
          message: `${team.team_name} has been locked. Your private workspace is ready.`,
          related_id: team.id, link: `/workspace/${team.id}`,
        })
      ));
      queryClient.invalidateQueries({ queryKey: ["team", id] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", id] });
      setLockOpen(false);
      toast({ title: "Team locked", description: "Roster finalized. Private workspace is now available." });
    } catch (err) {
      toast({ title: "Failed to lock team", description: err.message, variant: "destructive" });
    } finally {
      setLocking(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (isLocked) { toast({ title: "Team is locked", description: "You can't remove members from a locked team.", variant: "destructive" }); return; }
    setRemoving(member.id);
    try {
      await base44.entities.TeamMember.delete(member.id);
      await base44.entities.Notification.create({
        user_id: member.user_id, type: "roster_change",
        message: `You were removed from ${team.team_name}.`,
        related_id: team.id,
      });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", id] });
      toast({ title: "Member removed" });
    } catch (err) {
      toast({ title: "Failed to remove member", description: err.message, variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  const handleAcceptRequest = async (req) => {
    if (isLocked) { toast({ title: "Team is locked", variant: "destructive" }); return; }
    if (members.length >= team.max_members) { toast({ title: "Team is full", variant: "destructive" }); return; }
    setActingRequest(req.id);
    try {
      await base44.entities.Request.update(req.id, { status: "accepted" });
      await base44.entities.TeamMember.create({
        team_id: team.id, user_id: req.sender_id, leader_id: user.id, status: "member",
      });
      await base44.entities.Notification.create({
        user_id: req.sender_id, type: "request_accepted",
        message: `Your request to join ${team.team_name} was accepted!`,
        related_id: team.id, link: `/team/${team.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", id] });
      queryClient.invalidateQueries({ queryKey: ["teamRequests", id] });
      toast({ title: "Request accepted", description: `${profileMap[req.sender_id]?.full_name} is now on your team.` });
    } catch (err) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setActingRequest(null);
    }
  };

  const handleDeclineRequest = async (req) => {
    setActingRequest(req.id);
    try {
      await base44.entities.Request.update(req.id, { status: "declined" });
      await base44.entities.Notification.create({
        user_id: req.sender_id, type: "request_declined",
        message: `Your request to join ${team.team_name} was declined.`,
        related_id: team.id,
      });
      queryClient.invalidateQueries({ queryKey: ["teamRequests", id] });
      toast({ title: "Request declined" });
    } catch (err) {
      toast({ title: "Failed to decline", description: err.message, variant: "destructive" });
    } finally {
      setActingRequest(null);
    }
  };

  return (
    <div>
      <Link to={isLeader ? "/my-teams" : "/teams"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight">{team.team_name}</h1>
                <StatusBadge status={team.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{team.hackathon_name}</p>
              <p className="text-base font-medium mt-3">{team.project_title}</p>
              {team.project_description && <p className="text-sm text-muted-foreground mt-1">{team.project_description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {isLeader && !isLocked && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/team/${id}/edit`)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => setLockOpen(true)}><Lock className="w-3.5 h-3.5 mr-1.5" /> Lock team</Button>
                </>
              )}
              {isLocked && isMember && (
                <Button size="sm" onClick={() => navigate(`/workspace/${id}`)}><MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open workspace</Button>
              )}
            </div>
          </div>

          {isLocked && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" /> This team is locked. The roster is finalized and a private workspace is available to members.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Problem & solution */}
          {(team.problem_statement || team.solution) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Project details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {team.problem_statement && <div><p className="text-xs font-medium text-muted-foreground">Problem</p><p className="text-sm mt-1">{team.problem_statement}</p></div>}
                {team.solution && <div><p className="text-xs font-medium text-muted-foreground">Solution</p><p className="text-sm mt-1">{team.solution}</p></div>}
              </CardContent>
            </Card>
          )}

          {/* Roster */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Roster ({members.length}/{team.max_members})</CardTitle>
              {isLeader && !isLocked && <Link to="/participants"><Button variant="outline" size="sm"><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite</Button></Link>}
            </CardHeader>
            <CardContent>
              {memberProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {memberProfiles.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                      <Link to={`/profile/${m.user_id}`} className="flex items-center gap-3 min-w-0">
                        <Avatar src={m.profile.profile_photo} name={m.profile.full_name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.profile.full_name}{m.user_id === team.leader_id && <span className="text-xs text-muted-foreground ml-1">· Leader</span>}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.profile.college || m.profile.bio}</p>
                        </div>
                      </Link>
                      {isLeader && !isLocked && m.user_id !== user.id && (
                        <Button variant="ghost" size="sm" disabled={removing === m.id} onClick={() => handleRemoveMember(m)}>
                          {removing === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!isLocked && capacity > 0 && <p className="text-xs text-muted-foreground mt-3">{capacity} open {capacity === 1 ? "spot" : "spots"} remaining</p>}
            </CardContent>
          </Card>

          {/* Incoming requests (leader) */}
          {isLeader && !isLocked && incomingRequests.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Inbox className="w-4 h-4" /> Join requests ({incomingRequests.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomingRequests.map((req) => {
                    const p = profileMap[req.sender_id];
                    return (
                      <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                        <Link to={`/profile/${req.sender_id}`} className="flex items-center gap-3 min-w-0">
                          <Avatar src={p?.profile_photo} name={p?.full_name} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p?.full_name}</p>
                            {req.message && <p className="text-xs text-muted-foreground truncate">"{req.message}"</p>}
                          </div>
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" disabled={actingRequest === req.id} onClick={() => handleAcceptRequest(req)}><Check className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" disabled={actingRequest === req.id} onClick={() => handleDeclineRequest(req)}><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Required roles</CardTitle></CardHeader>
            <CardContent>
              {team.required_roles?.length > 0 ? (
                <div className="flex flex-wrap gap-2">{team.required_roles.map((r) => <SkillBadge key={r} variant="role">{r}</SkillBadge>)}</div>
              ) : <p className="text-sm text-muted-foreground">No specific roles listed.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Required skills</CardTitle></CardHeader>
            <CardContent>
              {team.required_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">{team.required_skills.map((s) => <SkillBadge key={s} variant="tech">{s}</SkillBadge>)}</div>
              ) : <p className="text-sm text-muted-foreground">No specific skills listed.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Team leader</CardTitle></CardHeader>
            <CardContent>
              <Link to={`/profile/${team.leader_id}`} className="flex items-center gap-3">
                <Avatar src={profileMap[team.leader_id]?.profile_photo} name={profileMap[team.leader_id]?.full_name} size="md" />
                <div><p className="text-sm font-medium">{profileMap[team.leader_id]?.full_name}</p><p className="text-xs text-muted-foreground">{profileMap[team.leader_id]?.college}</p></div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lock confirmation */}
      <AlertDialog open={lockOpen} onOpenChange={setLockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock this team?</AlertDialogTitle>
            <AlertDialogDescription>
              Locking finalizes your roster. Once locked, no new members can join, no members can be removed, and no new requests can be sent. A private team workspace with chat will be created for your members. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLock} disabled={locking}>
              {locking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Lock team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
