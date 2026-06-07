import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createAzure } from "@ai-sdk/azure";
import dotenv from "dotenv";
dotenv.config();

const resourceName = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;

if (!resourceName || !apiKey || !deploymentName) {
  throw new Error(
    "One or more Azure OpenAI env variables are missing or empty!"
  );
}
const azure = createAzure({
  resourceName: resourceName as string,
  apiKey: apiKey as string,
});
export const aiModel = azure(deploymentName as string);

export const agent = new BuiltInAgent({
  model: aiModel,
});





