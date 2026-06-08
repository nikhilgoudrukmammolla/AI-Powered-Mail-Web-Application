import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { NextRequest } from "next/server";
import { aiModel } from "@/customModel";

const agent = new BuiltInAgent({
  model: aiModel,
});

const runtime = new CopilotRuntime({
  agents: { default: agent },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
  cors: false,
});

export const POST = async (req: NextRequest) => {
  return handler(req);
};