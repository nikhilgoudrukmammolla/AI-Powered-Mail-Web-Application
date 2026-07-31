"use client";

import { useEffect, useState } from "react";
import { X, Eye, EyeOff, KeyRound, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIConfig } from "@/lib/ai-config-context";
import { AIProvider, AIProviderConfig, isConfigComplete } from "@/lib/ai-config";
import { cn } from "@/lib/utils";

const EMPTY: AIProviderConfig = {
  provider: "openai",
  apiKey: "",
  azureResourceName: "",
  azureDeployment: "",
  azureApiVersion: "",
  openaiModel: "gpt-4o-mini",
  openaiBaseURL: "",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function AIProviderSettings() {
  const { config, saveConfig, clearConfig, settingsOpen, closeSettings, isConfigured } =
    useAIConfig();

  const [draft, setDraft] = useState<AIProviderConfig>(config ?? EMPTY);
  const [showKey, setShowKey] = useState(false);

  // Sync the form with the stored config each time the modal opens.
  useEffect(() => {
    if (settingsOpen) {
      setDraft(config ?? EMPTY);
      setShowKey(false);
    }
  }, [settingsOpen, config]);

  if (!settingsOpen) return null;

  const set = (patch: Partial<AIProviderConfig>) => setDraft((d) => ({ ...d, ...patch }));
  const complete = isConfigComplete(draft);

  const handleSave = () => {
    if (!complete) return;
    saveConfig(draft);
    closeSettings();
  };

  const providerBtn = (p: AIProvider, label: string) => (
    <button
      type="button"
      onClick={() => set({ provider: p })}
      className={cn(
        "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
        draft.provider === p
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-accent/50"
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {draft.provider === p && <Check className="h-4 w-4 text-primary" />}
        {label}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeSettings} />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground flex-1">AI Provider Keys</h2>
          <Button variant="ghost" size="icon" onClick={closeSettings}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            Choose your provider and enter your credentials. These are stored only in your
            browser and sent securely with each AI request — never saved on our servers.
          </p>

          {/* Provider selector */}
          <div className="flex gap-2">
            {providerBtn("openai", "OpenAI")}
            {providerBtn("azure", "Azure OpenAI")}
          </div>

          {/* API key (shared) */}
          <Field label="API Key">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={draft.apiKey}
                onChange={(e) => set({ apiKey: e.target.value })}
                placeholder={draft.provider === "azure" ? "Azure OpenAI key" : "sk-..."}
                className="pr-9"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Provider-specific fields */}
          {draft.provider === "openai" ? (
            <>
              <Field label="Model" hint="e.g. gpt-4o-mini, gpt-4o, gpt-4.1">
                <Input
                  value={draft.openaiModel ?? ""}
                  onChange={(e) => set({ openaiModel: e.target.value })}
                  placeholder="gpt-4o-mini"
                />
              </Field>
              <Field label="Base URL (optional)" hint="Only for OpenAI-compatible endpoints">
                <Input
                  value={draft.openaiBaseURL ?? ""}
                  onChange={(e) => set({ openaiBaseURL: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Resource / Instance Name" hint="The name in your Azure endpoint URL">
                <Input
                  value={draft.azureResourceName ?? ""}
                  onChange={(e) => set({ azureResourceName: e.target.value })}
                  placeholder="my-azure-resource"
                />
              </Field>
              <Field label="Deployment Name">
                <Input
                  value={draft.azureDeployment ?? ""}
                  onChange={(e) => set({ azureDeployment: e.target.value })}
                  placeholder="gpt-4o-deployment"
                />
              </Field>
              <Field label="API Version (optional)" hint="Defaults to the SDK's version">
                <Input
                  value={draft.azureApiVersion ?? ""}
                  onChange={(e) => set({ azureApiVersion: e.target.value })}
                  placeholder="2024-08-01-preview"
                />
              </Field>
            </>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Stored locally in this browser only. Clear them anytime from this panel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          {isConfigured && (
            <Button
              variant="ghost"
              onClick={() => {
                clearConfig();
                setDraft(EMPTY);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Clear
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={closeSettings}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!complete} className="disabled:opacity-50">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
