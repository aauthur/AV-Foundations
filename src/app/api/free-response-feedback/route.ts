import OpenAI from "openai";
import { NextResponse } from "next/server";

console.log("OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function getModerationReason(result: any): string {
  if (!result?.categories) return "Content did not pass moderation.";

  const flaggedCategories = Object.entries(result.categories)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (flaggedCategories.length === 0) {
    return "Content did not pass moderation.";
  }

  return `Content flagged for: ${flaggedCategories.join(", ")}.`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const question = formData.get("question");
    const image = formData.get("image");
    const responseText = formData.get("responseText");

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Missing question." },
        { status: 400 }
      );
    }

    const hasImage = image instanceof File;
    const typedResponse =
      typeof responseText === "string" ? responseText.trim() : "";

    if (!hasImage && !typedResponse) {
      return NextResponse.json(
        { error: "Missing free response. Upload an image or enter a typed response." },
        { status: 400 }
      );
    }

    // Basic file validation before moderation
    if (hasImage) {
      if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
        return NextResponse.json(
          { error: "Unsupported image type. Please upload PNG, JPEG, WEBP, or GIF." },
          { status: 400 }
        );
      }

      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Image is too large. Please upload an image under 8 MB." },
          { status: 400 }
        );
      }
    }

    // Moderate typed text first
    if (typedResponse) {
      const textModeration = await client.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "text",
            text: typedResponse,
          },
        ],
      });

      const textResult = textModeration.results?.[0];
      if (textResult?.flagged) {
        return NextResponse.json(
          {
            error:
              "Your typed response could not be submitted because it violates the content policy.",
            details: getModerationReason(textResult),
          },
          { status: 400 }
        );
      }
    }

    let imageDataUrl: string | null = null;

    // Moderate uploaded image before sending it to the model
    if (hasImage) {
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = image.type || "image/png";

      imageDataUrl = `data:${mimeType};base64,${base64}`;

      const imageModeration = await client.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      });

      const imageResult = imageModeration.results?.[0];
      if (imageResult?.flagged) {
        return NextResponse.json(
          {
            error:
              "Your uploaded image could not be submitted because it violates the content policy.",
            details: getModerationReason(imageResult),
          },
          { status: 400 }
        );
      }
    }

    const responseContent: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "auto" }
    > = [
      {
        type: "input_text",
        text: `
You are a thoughtful math tutor giving feedback on a student's work.

Question:
${question}

Instructions:
- Give feedback, not a full solution.
- Any mathematical notation MUST!! be wrapped in LaTeX math delimiters:
  - Use $...$ for inline math
  - Use $$...$$ for displayed equations
- Never output raw LaTeX like \\sum, \\dots, \\frac unless it is inside math delimiters
- If the student response is unclear, say so explicitly.
- Focus on mathematical correctness, reasoning, and whether the student's overall method makes sense.
- Judge the work by a reasonable undergraduate standard unless the problem itself clearly demands a higher level of rigor.
- Do not be unnecessarily pedantic.
- Standard informal arguments and commonly accepted classroom shortcuts are acceptable if they are mathematically reasonable in context.
- Do not mark an argument wrong merely because it omits advanced real-analysis-style justification, unless that missing justification creates a genuine mathematical gap at the level of the problem.
- Distinguish between:
  1. a truly incorrect step,
  2. a minor omission of rigor,
  3. a valid argument that could be explained more clearly.
- Prefer "correct" or "partially correct" over "incorrect" when the main mathematical idea is right and the issue is a slight gap in rigor that is typical acceptable at the undergraduate level.
- "Partially correct" should be reserved for cases when students are almost there but miss a serious step that must be mentioned. Prefer incorrect in cases where students do not get close to a complete proof.
- In the summary and issues, prioritize the most important mathematical point rather than listing every small possible criticism.
- Keep feedback concise, helpful, and aligned with how a good instructor would respond in an ordinary undergrad math course.
- The next hint should help the student improve the work without giving away a full solution.

When deciding the verdict:
- "correct" = the solution is mathematically sound for the expected course level, even if it could be written more rigorously or cleanly.
- "partially_correct" = the main idea is good, but there is a meaningful gap, omission, or error that should be fixed.
- "incorrect" = there is a substantial mathematical mistake or the method does not work.
- "unclear" = This verdict is EXCLUSIVELY for the situation where the handwriting is illegible to the point where you cannot understand what the student wrote. This should be communicated in the feedback you send back.
        `.trim(),
      },
    ];

    if (typedResponse) {
      responseContent.push({
        type: "input_text",
        text: `Student response (typed):\n${typedResponse}`,
      });
    }

    if (imageDataUrl) {
      responseContent.push({
        type: "input_image",
        image_url: imageDataUrl,
        detail: "auto",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "user",
          content: responseContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "free_response_feedback",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              verdict: {
                type: "string",
                enum: ["correct", "partially_correct", "incorrect", "unclear"],
              },
              summary: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              issues: {
                type: "array",
                items: { type: "string" },
              },
              next_hint: { type: "string" },
            },
            required: ["verdict", "summary", "strengths", "issues", "next_hint"],
          },
        },
      },
    });

    const text = response.output_text;
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate feedback." },
      { status: 500 }
    );
  }
}