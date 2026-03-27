import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { ArticleCategory } from "@/types";
import { articlesApi } from "@/api/articles";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: ArticleCategory | "all"; label: string }[] = [
  { value: "all",           label: "All" },
  { value: "news",          label: "Pharmacy News" },
  { value: "health_tips",   label: "Health Tips" },
  { value: "medicine_info", label: "Medicine Info" },
];

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

export default function ArticlesPage() {
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [page, setPage] = useState(0);
  const limit = 9;

  const { data, isLoading } = useQuery({
    queryKey: ["articles", category, page],
    queryFn: () => articlesApi.getArticles({
      category: category === "all" ? undefined : category,
      skip: page * limit,
      limit,
    }),
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Health Articles</h1>
          <p className="text-muted-foreground mt-2">
            Expert health advice, pharmacy news, and medicine information from our team.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(0); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                category === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No articles found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items.map((article, i) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className={cn(
                  "group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200",
                  i === 0 && page === 0 && category === "all"
                    ? "sm:col-span-2 lg:col-span-2"
                    : ""
                )}
              >
                {/* Cover image */}
                <div className={cn(
                  "bg-muted overflow-hidden shrink-0",
                  i === 0 && page === 0 && category === "all" ? "h-56" : "h-44"
                )}>
                  {article.cover_image_url ? (
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/5">
                      <span className="text-5xl">📰</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-0.5 rounded-full",
                      CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-800"
                    )}>
                      {CATEGORIES.find((c) => c.value === article.category)?.label}
                    </span>
                  </div>

                  <h3 className={cn(
                    "font-display font-bold leading-snug group-hover:text-primary transition-colors",
                    i === 0 && page === 0 && category === "all" ? "text-xl" : "text-base"
                  )}>
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
                    {article.author && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {article.author.full_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(article.published_at ?? article.created_at)}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex justify-center items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil(data.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= data.total}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}