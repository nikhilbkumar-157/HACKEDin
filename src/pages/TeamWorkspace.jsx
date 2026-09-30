import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import { Lock, Users, ArrowLeft, Send, Loader2, MessageSquare, Target } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function TeamWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const messagesEndRef = useRef(null);

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

  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p])), [profiles]);
  const memberProfiles = members.map((m) => ({ ...m, profile: profileMap[m.user_id] })).filter((m) => m.profile);

  // Access check
  const isMember = members.some((m) => m.user_id === user.id);
  const isLocked = team?.status === "locked";

  // Fetch messages via backend function
  const fetchMessages = async () => {
    try {
      const res = await base44.functions.invoke("teamChat", { action: "fetch", team_id: id });
      setMessages(res.data?.messages || []);
    } catch (err) {
      // ignore polling errors
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (team && (!isLocked || !isMember)) return;
    if (!team) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [team, isLocked, isMember, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!team) return <p className="text-center py-20 text-muted-foreground">Team not found.</p>;
  if (!isLocked) return (
    <div className="text-center py-20">
      <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">This workspace is only available for locked teams.</p>
      <Link to={`/team/${id}`} className="text-primary hover:underline text-sm mt-2 inline-block">View team</Link>
    </div>
  );
  if (!isMember) return (
    <div className="text-center py-20">
      <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">You don't have access to this team's workspace.</p>
      <Link to="/my-teams" className="text-primary hover:underline text-sm mt-2 inline-block">Back to my teams</Link>
    </div>
  );

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    const text = message.trim();
    setMessage("");
    try {
      await base44.functions.invoke("teamChat", { action: "send", team_id: id, message: text });
      await fetchMessages();
    } catch (err) {
      setMessage(text);
      toast({ title: "Failed to send", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Link to="/my-teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to my teams
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[600px]">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-semibold text-sm">Team chat</h2>
                <p className="text-xs text-muted-foreground">{memberProfiles.length} members · private</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((m) => {
                  const own = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex gap-2.5 ${own ? "flex-row-reverse" : ""}`}>
                      <Avatar src={profileMap[m.sender_id]?.profile_photo} name={m.sender_name} size="sm" className="!w-8 !h-8" />
                      <div className={`max-w-[75%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="text-xs text-muted-foreground mb-0.5">{own ? "You" : m.sender_name} · {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${own ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." disabled={sending} className="h-11" autoFocus />
              <Button type="submit" size="icon" disabled={sending || !message.trim()} className="h-11 w-11 shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-lg">{team.team_name}</h2>
                <StatusBadge status={team.status} />
              </div>
              <p className="text-sm text-muted-foreground">{team.hackathon_name}</p>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Roster locked. This is your private workspace.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Project</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{team.project_title}</p>
              {team.project_description && <p className="text-sm text-muted-foreground mt-1">{team.project_description}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Members ({memberProfiles.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {memberProfiles.map((m) => (
                  <Link key={m.id} to={`/profile/${m.user_id}`} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted">
                    <Avatar src={m.profile.profile_photo} name={m.profile.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.profile.full_name}{m.user_id === team.leader_id && <span className="text-xs text-muted-foreground ml-1">· Leader</span>}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
