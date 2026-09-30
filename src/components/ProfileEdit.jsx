import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const AVAILABILITY = ["available", "busy", "unavailable"];

export default function ProfileEdit({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    profile_photo: profile?.profile_photo || "",
    bio: profile?.bio || "",
    college: profile?.college || "",
    location: profile?.location || "",
    experience: profile?.experience || "",
    hackathon_experience: profile?.hackathon_experience || "",
    availability: profile?.availability || "available",
    technical_skills: profile?.technical_skills || [],
    non_technical_skills: profile?.non_technical_skills || [],
    preferred_roles: profile?.preferred_roles || [],
    interests: profile?.interests || [],
    projects: profile?.projects || [],
    achievements: profile?.achievements || [],
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    portfolio_url: profile?.portfolio_url || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Profile.update(profile.id, form);
      toast({ title: "Profile saved", description: "Your changes have been saved." });
      onSaved();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Basics">
        <Field label="Full name"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></Field>
        <Field label="Profile photo URL"><Input value={form.profile_photo} onChange={(e) => set("profile_photo", e.target.value)} placeholder="https://..." /></Field>
        <Field label="Bio" full><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} placeholder="Tell teams about yourself..." /></Field>
        <Field label="College / University"><Input value={form.college} onChange={(e) => set("college", e.target.value)} /></Field>
        <Field label="Location"><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
        <Field label="Availability">
          <select value={form.availability} onChange={(e) => set("availability", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Skills & Roles">
        <Field label="Technical skills" full><TagInput values={form.technical_skills} onChange={(v) => set("technical_skills", v)} placeholder="Type a skill and press Enter" variant="tech" /></Field>
        <Field label="Non-technical skills" full><TagInput values={form.non_technical_skills} onChange={(v) => set("non_technical_skills", v)} placeholder="e.g. Design, PM, Writing" variant="nontech" /></Field>
        <Field label="Preferred roles" full><TagInput values={form.preferred_roles} onChange={(v) => set("preferred_roles", v)} placeholder="e.g. Frontend, Backend, Designer" variant="role" /></Field>
        <Field label="Areas of interest" full><TagInput values={form.interests} onChange={(v) => set("interests", v)} placeholder="e.g. AI, Web3, Climate" /></Field>
      </Section>

      <Section title="Experience">
        <Field label="Experience" full><Textarea value={form.experience} onChange={(e) => set("experience", e.target.value)} rows={3} placeholder="Past roles, internships..." /></Field>
        <Field label="Hackathon experience" full><Textarea value={form.hackathon_experience} onChange={(e) => set("hackathon_experience", e.target.value)} rows={2} placeholder="Hackathons you've participated in..." /></Field>
        <Field label="Projects (one per line)" full><Textarea value={form.projects.join("\n")} onChange={(e) => set("projects", e.target.value.split("\n").filter(Boolean))} rows={3} /></Field>
        <Field label="Achievements (one per line)" full><Textarea value={form.achievements.join("\n")} onChange={(e) => set("achievements", e.target.value.split("\n").filter(Boolean))} rows={3} /></Field>
      </Section>

      <Section title="Links">
        <Field label="LinkedIn URL"><Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." /></Field>
        <Field label="GitHub URL"><Input value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/..." /></Field>
        <Field label="Portfolio URL"><Input value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} placeholder="https://..." /></Field>
      </Section>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button type="submit" disabled={saving} className="shadow-lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4 text-foreground">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-2" : "space-y-2"}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
