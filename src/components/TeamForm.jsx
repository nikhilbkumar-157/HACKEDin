import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function TeamForm({ team, leaderId, onSaved }) {
  const [form, setForm] = useState({
    team_name: team?.team_name || "",
    hackathon_name: team?.hackathon_name || "",
    project_title: team?.project_title || "",
    project_description: team?.project_description || "",
    problem_statement: team?.problem_statement || "",
    solution: team?.solution || "",
    max_members: team?.max_members || 4,
    required_roles: team?.required_roles || [],
    required_skills: team?.required_skills || [],
    team_logo: team?.team_logo || "",
    hackathon_logo: team?.hackathon_logo || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogoUpload = async (field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Images must be under 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set(field, file_url);
      toast({ title: "Image uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.max_members < 1 || form.max_members > 10) {
      toast({ title: "Invalid team size", description: "Team size must be between 1 and 10.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (team) {
        await base44.entities.Team.update(team.id, { ...form, max_members: Number(form.max_members) });
        toast({ title: "Team updated", description: "Your team details have been saved." });
      } else {
        const created = await base44.entities.Team.create({
          ...form, max_members: Number(form.max_members), leader_id: leaderId, status: "open",
        });
        await base44.entities.TeamMember.create({
          team_id: created.id, user_id: leaderId, leader_id: leaderId, status: "member",
        });
        toast({ title: "Team created", description: "Your team is live. Start recruiting!" });
      }
      onSaved();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Team basics">
        <Field label="Team name" required><Input value={form.team_name} onChange={(e) => set("team_name", e.target.value)} required placeholder="e.g. Code Crusaders" /></Field>
        <Field label="Hackathon name" required><Input value={form.hackathon_name} onChange={(e) => set("hackathon_name", e.target.value)} required placeholder="e.g. HackMIT 2026" /></Field>
        <Field label="Max team size" required>
          <Input type="number" min={1} max={10} value={form.max_members} onChange={(e) => set("max_members", e.target.value)} required />
        </Field>
      </Section>

      <Section title="Project">
        <Field label="Project title" required full><Input value={form.project_title} onChange={(e) => set("project_title", e.target.value)} required placeholder="e.g. AI-Powered Study Buddy" /></Field>
        <Field label="Project description" full><Textarea value={form.project_description} onChange={(e) => set("project_description", e.target.value)} rows={3} placeholder="What are you building?" /></Field>
        <Field label="Problem statement" full><Textarea value={form.problem_statement} onChange={(e) => set("problem_statement", e.target.value)} rows={2} placeholder="What problem does it solve?" /></Field>
        <Field label="Proposed solution" full><Textarea value={form.solution} onChange={(e) => set("solution", e.target.value)} rows={2} placeholder="How does your project solve it?" /></Field>
      </Section>

      <Section title="Recruiting">
        <Field label="Required roles" full><TagInput values={form.required_roles} onChange={(v) => set("required_roles", v)} placeholder="e.g. Frontend, Backend, Designer" variant="role" /></Field>
        <Field label="Required skills" full><TagInput values={form.required_skills} onChange={(v) => set("required_skills", v)} placeholder="e.g. React, Python, Figma" variant="tech" /></Field>
      </Section>

      <Section title="Logos">
        <LogoField label="Team logo" value={form.team_logo} uploading={uploading === "team_logo"} onPick={(file) => handleLogoUpload("team_logo", file)} onClear={() => set("team_logo", "")} />
        <LogoField label="Hackathon logo" value={form.hackathon_logo} uploading={uploading === "hackathon_logo"} onPick={(file) => handleLogoUpload("hackathon_logo", file)} onClear={() => set("hackathon_logo", "")} />
      </Section>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {team ? "Save changes" : "Create team"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children, full, required }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-2" : "space-y-2"}>
      <Label className="text-xs font-medium text-muted-foreground">{label}{required && " *"}</Label>
      {children}
    </div>
  );
}

function LogoField({ label, value, uploading, onPick, onClear }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm hover:bg-accent cursor-pointer">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            <span>{value ? "Replace" : "Upload"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
              disabled={uploading}
            />
          </label>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={uploading}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
