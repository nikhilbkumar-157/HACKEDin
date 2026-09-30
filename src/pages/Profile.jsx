import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile, useInvalidateProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import SkillBadge from "@/components/SkillBadge";
import ProfileEdit from "@/components/ProfileEdit";
import { Github, Linkedin, Globe, MapPin, Briefcase, Trophy, FolderGit2, Pencil, ArrowLeft, Loader2 } from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const myProfile = useProfile();
  const invalidate = useInvalidateProfile();
  const [editing, setEditing] = useState(false);

  const isOwn = !userId || userId === user.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId || user.id],
    queryFn: async () => {
      const profiles = await base44.entities.Profile.filter({ user_id: userId || user.id });
      return profiles[0] || null;
    },
    enabled: isOwn ? !!myProfile.data : !!userId,
  });

  const displayProfile = isOwn ? myProfile.data : profile;

  if (isOwn && myProfile.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isOwn && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!displayProfile) {
    return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;
  }

  if (editing && isOwn) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
        <ProfileEdit profile={displayProfile} onSaved={async () => { await invalidate(); setEditing(false); }} />
      </div>
    );
  }

  return (
    <div>
      {!isOwn && (
        <Link to="/participants" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to participants
        </Link>
      )}

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <Avatar src={displayProfile.profile_photo} name={displayProfile.full_name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{displayProfile.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={displayProfile.role} />
                    <StatusBadge status={displayProfile.availability} />
                  </div>
                </div>
                {isOwn && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
                )}
              </div>
              {displayProfile.bio && <p className="text-sm text-muted-foreground mt-3">{displayProfile.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {displayProfile.college && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {displayProfile.college}</span>}
                {displayProfile.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {displayProfile.location}</span>}
              </div>
              <div className="flex items-center gap-3 mt-4">
                {displayProfile.linkedin_url && <a href={displayProfile.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Linkedin className="w-5 h-5" /></a>}
                {displayProfile.github_url && <a href={displayProfile.github_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="w-5 h-5" /></a>}
                {displayProfile.portfolio_url && <a href={displayProfile.portfolio_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="w-5 h-5" /></a>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {displayProfile.technical_skills?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Technical skills</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{displayProfile.technical_skills.map((s) => <SkillBadge key={s} variant="tech">{s}</SkillBadge>)}</div></CardContent>
          </Card>
        )}
        {displayProfile.non_technical_skills?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Non-technical skills</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{displayProfile.non_technical_skills.map((s) => <SkillBadge key={s} variant="nontech">{s}</SkillBadge>)}</div></CardContent>
          </Card>
        )}
        {displayProfile.preferred_roles?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Preferred roles</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{displayProfile.preferred_roles.map((r) => <SkillBadge key={r} variant="role">{r}</SkillBadge>)}</div></CardContent>
          </Card>
        )}
        {displayProfile.interests?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Areas of interest</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{displayProfile.interests.map((i) => <SkillBadge key={i}>{i}</SkillBadge>)}</div></CardContent>
          </Card>
        )}
        {displayProfile.experience && (
          <Card>
            <CardHeader><CardTitle className="text-base">Experience</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayProfile.experience}</p></CardContent>
          </Card>
        )}
        {displayProfile.hackathon_experience && (
          <Card>
            <CardHeader><CardTitle className="text-base">Hackathon experience</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayProfile.hackathon_experience}</p></CardContent>
          </Card>
        )}
        {displayProfile.projects?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderGit2 className="w-4 h-4" /> Projects</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2">{displayProfile.projects.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-foreground">•</span> {p}</li>)}</ul></CardContent>
          </Card>
        )}
        {displayProfile.achievements?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4" /> Achievements</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2">{displayProfile.achievements.map((a, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-foreground">•</span> {a}</li>)}</ul></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
