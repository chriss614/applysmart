import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not defined. Email functionality will be disabled.");
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@applysmart.io";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("Email not sent: RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: `ApplySmart <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    to: email,
    subject: "Reset your ApplySmart password",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #4f46e5; font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset for your ApplySmart account. Click the button below to reset your password:
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Welcome to ApplySmart!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #4f46e5; font-size: 24px; margin-bottom: 16px;">Welcome to ApplySmart, ${name}!</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your AI-powered career acceleration starts now. Upload your resume to get your first ATS score, 
          explore remote tech jobs, and practice interviews with AI feedback.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/overview" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Go to Dashboard
        </a>
      </div>
    `,
    text: `Welcome to ApplySmart, ${name}! Start here: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/overview`,
  });
}
