import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, body: emailBody, replyToId } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "To and subject are required" },
        { status: 400 }
      );
    }

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      emailBody || "",
    ];

    if (replyToId) {
      emailLines.splice(2, 0, `In-Reply-To: ${replyToId}`);
    }

    const raw = Buffer.from(emailLines.join("\r\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error("Gmail send error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    const sendData = await sendResponse.json();

    return NextResponse.json({
      success: true,
      id: sendData.id,
      threadId: sendData.threadId,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
