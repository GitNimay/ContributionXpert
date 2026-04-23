import { analyzeRepository, normalizeAnalysisRequest } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const config = normalizeAnalysisRequest(body);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        try {
          const analysis = await analyzeRepository(config, (stage, progress) => {
            send({ type: "progress", stage, progress });
          });
          send({ type: "complete", analysis });
          controller.close();
        } catch (error) {
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "The repository scan failed. Check the repo URL and credentials.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to process analysis request.",
      },
      { status: 400 },
    );
  }
}
