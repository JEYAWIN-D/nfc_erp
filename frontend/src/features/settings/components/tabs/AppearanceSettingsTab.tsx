import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function AppearanceSettingsTab() {
  const { theme: activeTheme, setTheme } = useTheme();

  const THEMES = [
    { id: "dark", label: "Dark Theme", class: "bg-zinc-950 border-white/10" },
    { id: "light", label: "Light Theme", class: "bg-white border-zinc-200" },
    { id: "system", label: "System Theme", class: "bg-slate-800 border-slate-700" },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Appearance & UI</h2>
        <p className="text-sm text-white/50 mt-1">Customize the visual presentation of the ERP application.</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Color Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const isSelected = activeTheme === t.id;
            return (
              <div 
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "border rounded-xl p-4 cursor-pointer transition-all hover:scale-105 select-none relative",
                  t.class,
                  isSelected ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] opacity-100" : "opacity-60 hover:opacity-100"
                )}
              >
                <div className="flex flex-col gap-2 h-16">
                  <div className="h-2 w-1/3 bg-current opacity-20 rounded" />
                  <div className="h-2 w-2/3 bg-current opacity-20 rounded" />
                  <div className="h-2 w-1/2 bg-current opacity-20 rounded" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className={cn("text-xs font-bold", t.id === "light" ? "text-zinc-900" : "text-white")}>
                    {t.label}
                  </p>
                  {isSelected && <span className="text-xs font-bold text-blue-500">Active ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 space-y-6">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Layout Options</h3>
        
        <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Compact Sidebar Mode</h3>
            <p className="text-xs text-white/40 mt-1">Collapse the main navigation to icons only, saving horizontal space.</p>
          </div>
          <Switch />
        </div>

        <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">High Contrast Text</h3>
            <p className="text-xs text-white/40 mt-1">Increase contrast ratios for all textual elements.</p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  );
}
