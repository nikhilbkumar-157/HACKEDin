import { cn } from "@/lib/utils";

const variants = {
  open: "bg-emerald-100 text-emerald-700 border-emerald-200",
  locked: "bg-amber-100 text-amber-700 border-amber-200",
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  busy: "bg-amber-100 text-amber-700 border-amber-200",
  unavailable: "bg-rose-100 text-rose-700 border-rose-200",
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  participant: "bg-violet-100 text-violet-700 border-violet-200",
  team_leader: "bg-sky-100 text-sky-700 border-sky-200",
};

export default function StatusBadge({ status, className }) {
  const variant = variants[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variant, className)}>
      {status?.replace("_", " ")}
    </span>
  );
}
