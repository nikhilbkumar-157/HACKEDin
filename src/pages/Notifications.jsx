import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Bell, CheckCheck, Loader2, Inbox, UserPlus, Check, X, Lock, MessageSquare } from "lucide-react";

const ICONS = {
  invitation: UserPlus,
  join_request: Inbox,
  request_accepted: Check,
  request_declined: X,
  roster_change: Bell,
  team_locked: Lock,
  chat_message: MessageSquare,
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const markRead = async (n) => {
    if (n.read_status) return;
    await base44.entities.Notification.update(n.id, { read_status: true });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read_status);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { read_status: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
  };

  return (
    <div>
      <PageHeader title="Notifications" description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.` : "You're all caught up."}>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read</Button>}
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You'll be notified about invitations, requests, and team updates here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            const content = (
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.read_status ? "bg-muted" : "bg-primary/10"}`}>
                  <Icon className={`w-4.5 h-4.5 ${n.read_status ? "text-muted-foreground" : "text-primary"}`} style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read_status ? "text-muted-foreground" : "font-medium text-foreground"}`}>{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.created_date).toLocaleString()}</p>
                </div>
                {!n.read_status && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </CardContent>
            );
            return (
              <Card key={n.id} className={`hover:shadow-sm transition-shadow ${!n.read_status ? "border-primary/30" : ""}`}>
                {n.link ? (
                  <a href={n.link} onClick={() => markRead(n)} className="block">{content}</a>
                ) : (
                  <button onClick={() => markRead(n)} className="w-full text-left">{content}</button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
