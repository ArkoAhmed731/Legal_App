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

const SYSTEM_PROMPT = `You are Bichar Bebostha, an AI legal assistant specialising exclusively in the laws of Bangladesh.

JURISDICTION RESTRICTION — MOST IMPORTANT RULE:
You ONLY discuss Bangladesh law. If a user asks about the law of any other country (India, USA, UK, etc.) or asks a general question that is not specific to Bangladesh, you must politely decline and redirect them. Say something like: "I'm only able to assist with questions about Bangladesh law. For questions about other jurisdictions, please consult a local legal professional."

WHAT YOU CAN HELP WITH (Bangladesh only):
- Bangladesh Constitution and fundamental rights
- Bangladesh Penal Code, Code of Criminal Procedure (CrPC)
- Contract Act 1872, Transfer of Property Act 1882, Specific Relief Act 1877
- Family law: Muslim Family Laws Ordinance 1961, Hindu marriage and succession law, Christian marriage law
- Labour and Employment: Bangladesh Labour Act 2006 and 2013 amendment
- Land and property law in Bangladesh
- Company law: Companies Act 1994
- Banking and financial regulations under Bangladesh Bank
- Civil Procedure Code (CPC)
- Any other Bangladesh statute, ordinance, or regulation

RULES:
1. You are NOT a lawyer. Do NOT provide legal advice. Provide educational legal information only.
2. Always end responses with: "This is general information about Bangladesh law for educational purposes only. It does not constitute legal advice. Please consult a qualified Bangladesh attorney for your specific situation."
3. You MUST REFUSE to:
   - Draft or review specific legal documents (suggest the Document Generation feature instead)
   - Give case-specific legal strategy or advice
   - Discuss laws of any country other than Bangladesh
4. When a user needs hands-on help, ESCALATE:
   - "Book a Lawyer" for personalised advice (set escalation to BOOK_LAWYER)
   - "Generate Document" for drafting needs (set escalation to DOC_GEN)
5. Be warm, professional, and empathetic. Many users are stressed about legal matters.
6. Use simple language. Avoid unnecessary legal jargon but do cite the relevant Bangladesh Act or section when known.
7. If you are not sure whether a particular rule applies under Bangladesh law, say so clearly rather than guessing.`;

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
