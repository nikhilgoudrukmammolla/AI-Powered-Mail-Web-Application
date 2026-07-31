"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AIProviderConfig,
  AI_CONFIG_STORAGE_KEY,
  isConfigComplete,
} from "@/lib/ai-config";

interface AIConfigContextType {
  config: AIProviderConfig | null;
  isConfigured: boolean;
  // True until we've read localStorage on the client (avoids SSR flash).
  hydrated: boolean;
  saveConfig: (config: AIProviderConfig) => void;
  clearConfig: () => void;
  // Controls the settings modal.
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function AIConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AIProviderConfig | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AIProviderConfig;
        setConfig(parsed);
      }
    } catch {
      // Corrupt/unavailable storage — ignore and start fresh.
    } finally {
      setHydrated(true);
    }
  }, []);

  const saveConfig = useCallback((next: AIProviderConfig) => {
    setConfig(next);
    try {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage might be full/blocked; the in-memory config still works this session.
    }
  }, []);

  const clearConfig = useCallback(() => {
    setConfig(null);
    try {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <AIConfigContext.Provider
      value={{
        config,
        isConfigured: isConfigComplete(config),
        hydrated,
        saveConfig,
        clearConfig,
        settingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfig() {
  const ctx = useContext(AIConfigContext);
  if (!ctx) throw new Error("useAIConfig must be used within an AIConfigProvider");
  return ctx;
}
