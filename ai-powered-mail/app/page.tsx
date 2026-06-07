import Image from "next/image";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white dark:bg-zinc-950">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-zinc-900 sm:items-start">
        <div>
          <h1 className="text-2xl text-zinc-900 dark:text-zinc-50">AI-Powered Mail</h1>
          <CopilotSidebar />
        </div>
      </main>
    </div>
  );
}