// Settings dropdown: voice toggle, speed, language, theme.
import { Settings, Volume2, VolumeX, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVoiceSettings } from "@/contexts/VoiceSettingsContext";

const RATES = [0.75, 1, 1.25, 1.5];
const LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ja-JP", label: "Japanese" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
];

export function VoiceSettingsMenu() {
  const s = useVoiceSettings();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3 space-y-3">
        <DropdownMenuLabel className="px-0">Voice & Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Voice on/off */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Speak responses</span>
          <Button
            variant={s.voiceEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => s.setVoiceEnabled(!s.voiceEnabled)}
            className="h-8"
          >
            {s.voiceEnabled ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
            {s.voiceEnabled ? "On" : "Off"}
          </Button>
        </div>

        {/* Voice speed */}
        <div>
          <div className="text-sm mb-1.5">Voice speed</div>
          <div className="grid grid-cols-4 gap-1">
            {RATES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={s.rate === r ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => s.setRate(r)}
              >
                {r}x
              </Button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-sm block mb-1.5">Recognition language</label>
          <select
            value={s.lang}
            onChange={(e) => s.setLang(e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => s.setTheme(s.theme === "dark" ? "light" : "dark")}
          >
            {s.theme === "dark" ? (
              <><Sun className="h-3.5 w-3.5 mr-1" /> Light</>
            ) : (
              <><Moon className="h-3.5 w-3.5 mr-1" /> Dark</>
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
