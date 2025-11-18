import { Hero } from "@/components/home/Hero";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import { WhyTravunited } from "@/components/home/WhyTravunited";
import { Testimonials } from "@/components/home/Testimonials";
import { BlogHighlights } from "@/components/home/BlogHighlights";
import { prisma } from "@/lib/prisma";
import { getMediaProxyUrl } from "@/lib/media";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const latestPosts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const blogCards = latestPosts.map((post) => ({
    id: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    image: getMediaProxyUrl(post.coverImage),
    date: (post.publishedAt ?? post.createdAt).toISOString(),
    category: post.category,
  }));

  return (
    <div className="flex flex-col">
      <Hero />
      <PopularDestinations />
      <FeaturedTours />
      <WhyTravunited />
      <Testimonials />
      <BlogHighlights posts={blogCards} />
    </div>
  );
}

