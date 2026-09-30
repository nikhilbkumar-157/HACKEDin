import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TagInput({ values = [], onChange, placeholder, variant = "default" }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setInput("");
  };

  const remove = (v) => onChange(values.filter((x) => x !== v));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !input && values.length) {
      remove(values[values.length - 1]);
    }
  };

  const variants = {
    default: "bg-secondary text-secondary-foreground",
    tech: "bg-blue-50 text-blue-700",
    nontech: "bg-purple-50 text-purple-700",
    role: "bg-violet-50 text-violet-700",
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 min-h-[42px] w-full rounded-md border border-input bg-background px-2 py-1.5")}>
      {values.map((v) => (
        <span key={v} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", variants[variant])}>
          {v}
          <button type="button" onClick={() => remove(v)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm py-0.5 px-1"
      />
    </div>
  );
}
