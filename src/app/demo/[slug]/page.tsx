import { notFound } from "next/navigation";
import { getDonutBySlug, getAllSlugs } from "@/data/donuts";
import DemoViewer from "@/components/DemoViewer";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const donut = getDonutBySlug(slug);
  if (!donut) notFound();

  return <DemoViewer donut={donut} />;
}
