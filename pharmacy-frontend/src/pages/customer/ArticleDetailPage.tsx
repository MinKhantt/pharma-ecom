import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { articlesApi } from "@/api/articles";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  news:          "Pharmacy News",
  health_tips:   "Health Tips",
  medicine_info: "Medicine Information",
};

const CATEGORY_COLORS: Record<string, string> = {
  news:          "bg-blue-100 text-blue-800",
  health_tips:   "bg-green-100 text-green-800",
  medicine_info: "bg-purple-100 text-purple-800",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => articlesApi.getArticle(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <LoadingSpinner className="py-16" />;
  if (!article) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Article not found.</p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/articles">Back to articles</Link>
      </Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/articles">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full",
          CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-800"
        )}>
          <Tag className="h-3 w-3" />
          {CATEGORY_LABELS[article.category] ?? article.category}
        </span>

        <h1 className="font-display text-4xl font-bold leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b border-border">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.author.full_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(article.published_at ?? article.created_at)}
          </span>
        </div>
      </div>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="rounded-2xl overflow-hidden h-72 bg-muted">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content — render HTML from rich text editor */}
      <div
        className="prose prose-sm sm:prose max-w-none
          prose-headings:font-display prose-headings:font-bold
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-ul:text-muted-foreground prose-ol:text-muted-foreground
          prose-blockquote:border-primary prose-blockquote:text-muted-foreground
          prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Footer */}
      <div className="pt-8 border-t border-border flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to="/articles">
            <ArrowLeft className="h-4 w-4 mr-2" /> All articles
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Last updated {formatDate(article.updated_at)}
        </span>
      </div>
    </div>
  );
}