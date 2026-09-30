import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Avatar from "@/components/Avatar";
import SkillBadge from "@/components/SkillBadge";
import StatusBadge from "@/components/StatusBadge";
import { Github, Linkedin, Globe, Briefcase } from "lucide-react";

export default function ParticipantCard({ profile, action }) {
  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <Avatar src={profile.profile_photo} name={profile.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <Link to={`/profile/${profile.user_id}`}>
              <h3 className="font-semibold text-foreground hover:text-primary truncate">{profile.full_name}</h3>
            </Link>
            {profile.college && <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.college}</p>}
            <div className="mt-1.5"><StatusBadge status={profile.availability} /></div>
          </div>
        </div>

        {profile.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{profile.bio}</p>}

        {profile.preferred_roles?.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {profile.preferred_roles.slice(0, 3).map((r) => <SkillBadge key={r} variant="role">{r}</SkillBadge>)}
            </div>
          </div>
        )}

        {profile.technical_skills?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.technical_skills.slice(0, 5).map((s) => <SkillBadge key={s} variant="tech">{s}</SkillBadge>)}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-2.5">
            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="w-4 h-4" /></a>}
            {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Linkedin className="w-4 h-4" /></a>}
            {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="w-4 h-4" /></a>}
            {profile.experience && <span className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Exp</span>}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
