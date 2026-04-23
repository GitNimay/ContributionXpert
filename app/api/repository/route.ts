import { getRepositoryPreview, parseRepositoryInput } from "@/lib/github";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo") ?? "";

  try {
    parseRepositoryInput(repo);
    const preview = await getRepositoryPreview(repo);
    return Response.json({ preview });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to read repository." },
      { status: 400 },
    );
  }
}
