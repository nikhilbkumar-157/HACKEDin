import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, UserSearch, Inbox, Lock, MessageSquare, ArrowRight, FolderKanban, Bell } from "lucide-react";

export default function Landing() {
  const features = [
    { icon: UserSearch, title: "Find the right people", desc: "Discover participants with the exact skills your team needs." },
    { icon: FolderKanban, title: "Showcase your team", desc: "Create a team profile, list open roles, and attract talent." },
    { icon: Inbox, title: "Two-way requests", desc: "Send join requests or invitations. Accept, decline, and manage your roster." },
    { icon: Lock, title: "Lock your team", desc: "Finalize your roster and freeze it when you're ready to compete." },
    { icon: MessageSquare, title: "Private team chat", desc: "Once locked, get a private workspace with chat for your team." },
    { icon: Bell, title: "Stay notified", desc: "Get in-app notifications for every request, invite, and update." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">HACKEDin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Built for hackathon builders
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
          Where hackathon teams <span className="text-primary">come together</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Team leaders find students with the skills they need. Students find teams that need their skills. Build your roster, lock your team, and ship.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/register"><Button size="lg" className="h-12 px-6">Create your account <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="h-12 px-6">I already have an account</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to build your team?</h2>
          <p className="text-muted-foreground mt-2">Join HACKEDin in minutes. Pick your role and start connecting.</p>
          <Link to="/register" className="inline-block mt-6"><Button size="lg" className="h-12 px-6">Get started — it's free</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">HACKEDin</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HACKEDin. Hackathon networking, reimagined.</p>
        </div>
      </footer>
    </div>
  );
}
