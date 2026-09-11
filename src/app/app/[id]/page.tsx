import ProjectPageClient from "./ProjectPageClient";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ProjectPageClient id={resolvedParams.id} />;
}
