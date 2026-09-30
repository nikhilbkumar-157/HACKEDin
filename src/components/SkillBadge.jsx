import { cn } from "@/lib/utils";

export default function SkillBadge({ children, className, variant = "default" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground border-border",
    tech: "bg-blue-50 text-blue-700 border-blue-200",
    nontech: "bg-purple-50 text-purple-700 border-purple-200",
    role: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
}
