import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { validateCsrfToken, validateFileUpload, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId } from "@/lib/auth";
import { uploadRateLimiter } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await uploadRateLimiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Upload quota exceeded. Max 5 per hour." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const validation = validateFileUpload(file.name, file.size, file.type, fileBuffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Store with a server-generated random key (not trusting fileName)
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const storageKey = crypto.randomUUID();

    // Store in database
    const [newResume] = await db.insert(resumes).values({
      userId,
      originalFileName: file.name,
      fileUrl: `https://storage.applysmart.io/resumes/${storageKey}`,
      fileSize: file.size,
      mimeType: file.type,
      fileHash,
      parsedContent: file.type === "text/plain" ? await file.text() : null,
    }).returning();

    return NextResponse.json({
      success: true,
      resume: {
        id: newResume.id,
        fileName: newResume.originalFileName,
        fileUrl: newResume.fileUrl,
      },
    }, { status: 201 });
  } catch (error) {
    redactedLog("error", "Upload error", { error: "Internal server error" });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
