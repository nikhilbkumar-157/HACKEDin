import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Loader2, Inbox, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Requests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("received");
  const [acting, setActing] = useState(null);

  const { data: received = [] } = useQuery({
    queryKey: ["receivedRequests", user?.id],
    queryFn: async () => base44.entities.Request.filter({ receiver_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });
  const { data: sent = [] } = useQuery({
    queryKey: ["sentRequests", user?.id],
    queryFn: async () => base44.entities.Request.filter({ sender_id: user.id }, "-created_date"),
    enabled: !!user?.id,
  });
  const { data: teams = [] } = useQuery({
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

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p])), [profiles]);
  const memberCountMap = useMemo(() => {
    const m = {};
    members.forEach((mem) => { m[mem.team_id] = (m[mem.team_id] || 0) + 1; });
    return m;
  }, [members]);

  const accept = async (req) => {
    setActing(req.id);
    try {
      const res = await base44.functions.invoke("resolveRequest", { request_id: req.id, action: "accept" });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allMembers"] });
      queryClient.invalidateQueries({ queryKey: ["myMemberships"] });
      toast({ title: "Accepted", description: `You joined ${data?.team_name || "the team"}.` });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const decline = async (req) => {
    setActing(req.id);
    try {
      const res = await base44.functions.invoke("resolveRequest", { request_id: req.id, action: "decline" });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      toast({ title: "Declined" });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const cancel = async (req) => {
    setActing(req.id);
    try {
      await base44.entities.Request.update(req.id, { status: "cancelled" });
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      toast({ title: "Request cancelled" });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const pendingReceived = received.filter((r) => r.status === "pending");
  const otherReceived = received.filter((r) => r.status !== "pending");
  const pendingSent = sent.filter((r) => r.status === "pending");
  const otherSent = sent.filter((r) => r.status !== "pending");

  return (
    <div>
      <PageHeader title="Requests" description="Manage your invitations and join requests." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="received">Received ({pendingReceived.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({pendingSent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-6">
          {pendingReceived.length === 0 && otherReceived.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests yet" description="Invitations and join requests you receive will appear here." />
          ) : (
            <>
              <RequestList title="Pending" requests={pendingReceived} teamMap={teamMap} profileMap={profileMap}
                actions={(req) => req.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" disabled={acting === req.id} onClick={() => accept(req)}><Check className="w-3.5 h-3.5 mr-1" /> Accept</Button>
                    <Button size="sm" variant="outline" disabled={acting === req.id} onClick={() => decline(req)}><X className="w-3.5 h-3.5 mr-1" /> Decline</Button>
                  </div>
                )}
                acting={acting} viewer="receiver" />
              {otherReceived.length > 0 && <RequestList title="History" requests={otherReceived} teamMap={teamMap} profileMap={profileMap} acting={acting} viewer="receiver" />}
            </>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-6">
          {pendingSent.length === 0 && otherSent.length === 0 ? (
            <EmptyState icon={Send} title="No requests sent" description="Join requests and invitations you send will appear here." />
          ) : (
            <>
              <RequestList title="Pending" requests={pendingSent} teamMap={teamMap} profileMap={profileMap}
                actions={(req) => req.status === "pending" && (
                  <Button size="sm" variant="outline" disabled={acting === req.id} onClick={() => cancel(req)}>{acting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel"}</Button>
                )}
                acting={acting} viewer="sender" />
              {otherSent.length > 0 && <RequestList title="History" requests={otherSent} teamMap={teamMap} profileMap={profileMap} acting={acting} viewer="sender" />}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestList({ title, requests, teamMap, profileMap, actions, acting, viewer }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-2.5">
        {requests.map((req) => {
          const team = teamMap[req.team_id];
          const otherId = viewer === "receiver" ? req.sender_id : req.receiver_id;
          const otherProfile = profileMap[otherId];
          return (
            <Card key={req.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={otherProfile?.profile_photo} name={otherProfile?.full_name || "User"} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {req.request_type === "invitation" ? "Invitation" : "Join request"}
                      {team && <> · <Link to={`/team/${team.id}`} className="hover:text-primary">{team.team_name}</Link></>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {viewer === "receiver" ? `From ${otherProfile?.full_name || "a user"}` : `To ${otherProfile?.full_name || "a user"}`}
                      {req.message && ` — "${req.message}"`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={req.status} />
                  {actions && actions(req)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
