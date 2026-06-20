import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { verifyAccessToken, validateCsrfToken, validateFileUpload, getClientIdentifier } from "@/lib/security";
import { uploadRateLimiter } from "@/lib/rate-limit";
import crypto from "crypto";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.userId || null;
}

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

    const validation = validateFileUpload(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // In a real implementation, upload to Vercel Blob or S3
    // For now, simulate with a hash-based URL
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Store in database
    const [newResume] = await db.insert(resumes).values({
      userId,
      originalFileName: file.name,
      fileUrl: `https://storage.applysmart.io/resumes/${fileHash}`,
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
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
