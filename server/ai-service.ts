import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are Bichar Bebostha Legal Assistant, an AI that provides educational legal information.

IMPORTANT RULES:
1. You provide GENERAL legal education and information ONLY. You are NOT a lawyer and do NOT provide legal advice.
2. Always include a disclaimer: "This is general legal information for educational purposes only. It does not constitute legal advice. Please consult a qualified attorney for your specific situation."
3. You can explain legal concepts, processes, rights, and procedures in general terms.
4. You can help users understand what type of lawyer they might need.
5. You MUST REFUSE to:
   - Draft or review specific legal documents (suggest the document generation feature instead)
   - Provide case-specific legal advice
   - Recommend specific legal strategies for ongoing cases
   - Interpret specific contracts or agreements
6. When a user needs specific legal help, ESCALATE by suggesting:
   - "Book a Lawyer" for personalized advice (set escalation to BOOK_LAWYER)
   - "Generate Document" for document needs (set escalation to DOC_GEN)
7. Be warm, professional, and empathetic. Many users are stressed about legal matters.
8. Provide information about common legal topics: employment, family, immigration, business, contracts, real estate, criminal defense, estate planning, intellectual property, and tax law.
9. When explaining, use simple language. Avoid unnecessary legal jargon.
10. Keep responses focused and practical. Provide actionable next steps when possible.`;

export async function embedText(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const BATCH = 100;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    results.push(...res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return results;
}

export async function streamLegalAssistant(
  messages: Array<{ role: string; content: string }>,
  onChunk: (data: { content?: string; done?: boolean; escalation?: string }) => void,
  ragContext?: string
): Promise<void> {
  const systemPrompt = ragContext
    ? `${SYSTEM_PROMPT}\n\n## Relevant Bangladesh Law References\n\nThe following excerpts are from official Bangladesh legal documents. Use them to inform your response where applicable. Cite them when you do.\n\n${ragContext}`
    : SYSTEM_PROMPT;

  const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onChunk({ content });
      }
    }

    let escalation: string | undefined;
    const lower = fullResponse.toLowerCase();
    if (
      lower.includes("book a lawyer") ||
      lower.includes("consult with a lawyer") ||
      lower.includes("speak with an attorney") ||
      lower.includes("hire an attorney") ||
      lower.includes("retain a lawyer")
    ) {
      escalation = "BOOK_LAWYER";
    } else if (
      lower.includes("generate a document") ||
      lower.includes("document generation") ||
      lower.includes("create a contract") ||
      lower.includes("draft a")
    ) {
      escalation = "DOC_GEN";
    }

    onChunk({ done: true, escalation });
  } catch (error: any) {
    console.error("AI streaming error:", error);
    onChunk({
      content:
        "\n\nI apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
    });
    onChunk({ done: true });
  }
}

export async function generateDocumentDraft(
  documentTypeName: string,
  intakeAnswers: Record<string, string>
): Promise<string> {
  const intakeInfo = Object.entries(intakeAnswers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a legal document drafting assistant. Generate a professional legal document draft based on the provided information. Include standard legal language, proper formatting, and placeholder text where specific details are needed. Add a header noting "DRAFT - FOR REVIEW ONLY" and a footer noting "This document was AI-generated and must be reviewed by a qualified attorney before use."`,
      },
      {
        role: "user",
        content: `Generate a ${documentTypeName} document with the following information:\n\n${intakeInfo}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  });

  return (
    response.choices[0]?.message?.content ||
    "Unable to generate document. Please try again."
  );
}
