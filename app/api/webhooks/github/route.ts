import { createHmac, timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return Response.json(
      {
        ok: false,
        error: "GITHUB_WEBHOOK_SECRET is not configured.",
      },
      { status: 501 },
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event") ?? "unknown";
  const delivery = request.headers.get("x-github-delivery") ?? "unknown";
  const body = await request.text();

  if (!signature || !verifyGitHubSignature(body, signature, secret)) {
    return Response.json({ ok: false, error: "Invalid GitHub webhook signature." }, { status: 401 });
  }

  // Production hook point: enqueue an incremental rescan for push/pull_request/review events.
  return Response.json({
    ok: true,
    event,
    delivery,
    queued: ["push", "pull_request", "pull_request_review", "pull_request_review_comment"].includes(event),
  });
}

function verifyGitHubSignature(body: string, signature: string, secret: string) {
  const digest = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature, "utf8");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
