import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile, useInvalidateProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import { Mail, Pencil, LogOut, User, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const invalidateProfile = useInvalidateProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [changingRole, setChangingRole] = useState(false);

  const handleLogout = () => {
    queryClient.clear();
    logout(false);
    navigate("/login");
  };

  const handleChangeRole = async () => {
    if (!profile) return;
    const newRole = profile.role === "team_leader" ? "participant" : "team_leader";
    setChangingRole(true);
    try {
      await base44.entities.Profile.update(profile.id, { role: newRole });
      await invalidateProfile();
      queryClient.invalidateQueries();
      toast({ title: "Role updated", description: `You are now a ${newRole === "team_leader" ? "Team Leader" : "Participant"}.` });
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setChangingRole(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Card className="mb-6">
        <CardContent className="p-5 flex items-center gap-4">
          <Avatar src={profile?.profile_photo} name={profile?.full_name} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {profile && <StatusBadge status={profile.role} />}
              {profile && <StatusBadge status={profile.availability} />}
            </div>
          </div>
          <Link to="/profile"><Button variant="outline" size="sm"><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit profile</Button></Link>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /> Email</div>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-2.5 text-sm"><User className="w-4 h-4 text-muted-foreground" /> Role</div>
            <div className="flex items-center gap-2">
              <StatusBadge status={profile?.role || "participant"} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={changingRole || !profile}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Change role
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Switch to {profile?.role === "team_leader" ? "Participant" : "Team Leader"}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {profile?.role === "team_leader"
                        ? "You'll be able to browse and join teams as a participant. Your existing teams and memberships are kept."
                        : "You'll be able to create teams and invite participants. Your existing memberships are kept."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleChangeRole} disabled={changingRole}>
                      {changingRole ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Session</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
