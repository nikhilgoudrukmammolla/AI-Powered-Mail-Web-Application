import { createAzure } from "@ai-sdk/azure";

const resourceName = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;

if (!resourceName || !apiKey || !deploymentName) {
  throw new Error(
    "One or more Azure OpenAI env variables are missing or empty!"
  );
}

const azure = createAzure({
  resourceName,
  apiKey,
});

export const aiModel = azure(deploymentName);

