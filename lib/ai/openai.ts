import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not defined. AI features will be disabled.");
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export { openai };

//============================================
// Resume Analysis Prompts
//============================================
export const RESUME_ANALYSIS_PROMPT = `
You are an expert ATS (Applicant Tracking System) analyst and resume optimization specialist. 
Analyze the following resume and provide structured feedback in JSON format.

Analyze for:
1. ATS compatibility (format, parsing-friendliness)
2. Keyword optimization for the target role
3. Readability and clarity
4. Quantifiable achievements
5. Formatting and structure

Return ONLY a JSON object with this structure:
{
  "atsScore": number (0-100),
  "readabilityScore": number (0-100),
  "keywordDensity": { "keyword": frequency },
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": [string],
  "optimizedSummary": string (2-3 sentences),
  "missingKeywords": [string]
}
`;

//============================================
// Interview Question Generation
//============================================
export const INTERVIEW_PROMPT = `
You are a senior technical interviewer with 15+ years of experience at top tech companies.
Generate realistic interview questions based on the role and difficulty level.

Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "id": number,
      "question": string,
      "type": "technical" | "behavioral" | "system_design" | "coding",
      "difficulty": "junior" | "mid" | "senior" | "staff",
      "expectedPoints": [string],
      "timeEstimate": string (e.g., "5-10 min")
    }
  ]
}
`;

//============================================
// Interview Feedback
//============================================
export const INTERVIEW_FEEDBACK_PROMPT = `
You are a supportive but honest technical interviewer. 
Evaluate the candidate's response and provide constructive feedback.

Return ONLY a JSON object with this structure:
{
  "score": number (0-100),
  "strengths": [string],
  "areasToImprove": [string],
  "modelAnswer": string,
  "followUpQuestions": [string]
}
`;

//============================================
// Career Coach
//============================================
export const COACH_SYSTEM_PROMPT = `
You are ApplySmart AI Career Coach — a supportive, knowledgeable career advisor specializing in tech job searches.
You help with:
- Resume optimization strategies
- Interview preparation and techniques
- Salary negotiation tactics
- Career path planning
- Networking strategies
- Job search optimization

Be encouraging but realistic. Use specific examples. Reference the user's context when provided.
Keep responses concise but actionable (under 300 words when possible).
`;

//============================================
// Job Matching
//============================================
export const JOB_MATCH_PROMPT = `
You are a job matching specialist. Given a user's skills and preferences, score how well a job matches them.

Return ONLY a JSON object with this structure:
{
  "matchScore": number (0-100),
  "skillMatches": [string],
  "skillGaps": [string],
  "recommendation": string (why this is or isn't a good fit)
}
`;

//============================================
// Portfolio Generation
//============================================
export const PORTFOLIO_PROMPT = `
You are a professional portfolio designer. Generate HTML/CSS for a stunning developer portfolio.

Guidelines:
- Use modern, clean design with excellent typography
- Include semantic HTML5
- Use CSS custom properties for theming
- Make it responsive
- Include smooth animations
- Optimize for performance

Return ONLY the HTML content as a string (no markdown code blocks).
`;

//============================================
// Safe AI Call Wrapper
//============================================
export async function safeAiCall<T>(
  prompt: string,
  content: string,
  systemPrompt?: string
): Promise<T | null> {
  if (!openai) {
    console.warn("OpenAI not configured. Returning mock data.");
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful assistant." },
        { role: "user", content: `${prompt}\n\n${content}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = response.choices[0].message.content;
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error) {
    console.error("AI call error:", error);
    return null;
  }
}
