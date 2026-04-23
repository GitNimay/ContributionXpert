import { analyzeRepository, normalizeAnalysisRequest } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const analysis = await analyzeRepository(normalizeAnalysisRequest(body));

    return Response.json({ analysis });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The repository scan failed. Check the repo URL and credentials.",
      },
      { status: 400 },
    );
  }
}
