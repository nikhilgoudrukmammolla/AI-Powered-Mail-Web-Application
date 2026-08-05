"use client";

import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { CopilotKit } from "@copilotkit/react-core";
import { MailProvider } from "@/lib/mail-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AIConfigProvider, useAIConfig } from "@/lib/ai-config-context";
import { configToHeaders } from "@/lib/ai-config";
import "@copilotkit/react-ui/styles.css";

// Forwards the user's locally-stored provider config to the runtime route as
// request headers. Re-renders (and thus updates headers) whenever the config changes.
function CopilotWithConfig({ children }: { children: React.ReactNode }) {
  const { config } = useAIConfig();
  const headers = useMemo(() => configToHeaders(config), [config]);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" headers={headers}>
      {children}
    </CopilotKit>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AIConfigProvider>
          <CopilotWithConfig>
            <MailProvider>{children}</MailProvider>
          </CopilotWithConfig>
        </AIConfigProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
