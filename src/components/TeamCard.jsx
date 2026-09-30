import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import SkillBadge from "@/components/SkillBadge";
import Avatar from "@/components/Avatar";
import { Users } from "lucide-react";

export default function TeamCard({ team, leaderProfile, memberCount, action }) {
  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {team.team_logo ? (
              <img src={team.team_logo} alt={team.team_name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border" />
            ) : null}
            <div className="min-w-0">
              <Link to={`/team/${team.id}`}>
                <h3 className="font-semibold text-foreground hover:text-primary truncate">{team.team_name}</h3>
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{team.hackathon_name}</p>
            </div>
          </div>
          <StatusBadge status={team.status} />
        </div>

        <p className="text-sm font-medium mt-3">{team.project_title}</p>
        {team.project_description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{team.project_description}</p>
        )}

        {team.required_skills?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills needed</p>
            <div className="flex flex-wrap gap-1.5">
              {team.required_skills.slice(0, 5).map((s) => <SkillBadge key={s} variant="tech">{s}</SkillBadge>)}
            </div>
          </div>
        )}

        {team.required_roles?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Roles needed</p>
            <div className="flex flex-wrap gap-1.5">
              {team.required_roles.slice(0, 4).map((r) => <SkillBadge key={r} variant="role">{r}</SkillBadge>)}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {memberCount}/{team.max_members}</span>
            {leaderProfile && (
              <span className="flex items-center gap-1.5">
                <Avatar src={leaderProfile.profile_photo} name={leaderProfile.full_name} size="sm" className="!w-5 !h-5 !text-[10px]" />
                <span className="truncate max-w-[80px]">{leaderProfile.full_name}</span>
              </span>
            )}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
