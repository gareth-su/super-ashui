type GenerateAiTextInput = {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
};

type OpenAiCompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`未配置 ${name}`);
  return value;
}

export async function generateAiText(input: GenerateAiTextInput): Promise<string> {
  const provider = process.env.AI_PROVIDER?.trim() || "openai-compatible";

  if (provider !== "openai-compatible") {
    throw new Error(`暂不支持 AI_PROVIDER=${provider}，当前仅支持 openai-compatible`);
  }

  const apiKey = readRequiredEnv("AI_API_KEY");
  const baseUrl = readRequiredEnv("AI_API_BASE_URL").replace(/\/$/, "");
  const model = readRequiredEnv("AI_MODEL");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 6000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAiCompatibleResponse;
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("AI provider 返回空内容");
  }

  return text;
}
