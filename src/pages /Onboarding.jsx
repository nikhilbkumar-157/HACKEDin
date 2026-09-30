import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useRefetchProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Code2, User, Users, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Onboarding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const refetchProfile = useRefetchProfile();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ full_name: "", college: "", bio: "" });
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r) => setRole(r);

  const handleContinue = () => {
    if (!role) return;
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setLoading(true);
    try {
      await base44.entities.Profile.create({
        user_id: user.id,
        full_name: form.full_name.trim(),
        role,
        college: form.college.trim(),
        bio: form.bio.trim(),
        technical_skills: [],
        non_technical_skills: [],
        projects: [],
        achievements: [],
        preferred_roles: [],
        interests: [],
        availability: "available",
      });
      await refetchProfile();
      toast({ title: "Welcome to HACKEDin!", description: "Your profile is ready. Let's complete it." });
      navigate("/");
    } catch (err) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">HACKEDin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to HACKEDin</h1>
                <p className="text-muted-foreground mt-2">Choose your role to get started. You can build a profile next.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelect("participant")}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${role === "participant" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">I'm a Participant</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Find teams that need your skills and send join requests.</p>
                </button>
                <button
                  onClick={() => handleRoleSelect("team_leader")}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${role === "team_leader" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">I'm a Team Leader</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Create a team, define roles, and recruit the right participants.</p>
                </button>
              </div>
              <Button className="w-full h-12 mt-6" disabled={!role} onClick={handleContinue}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Let's set up your profile</h1>
                <p className="text-muted-foreground mt-2">Just the basics for now — you can add more details later.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Alex Carter" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College / University</Label>
                  <Input id="college" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="e.g. MIT" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Short bio (optional)</Label>
                  <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A line or two about you..." rows={3} />
                </div>
                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating profile...</>) : (<>Complete setup <ArrowRight className="w-4 h-4 ml-2" /></>)}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
