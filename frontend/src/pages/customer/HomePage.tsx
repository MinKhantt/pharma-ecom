import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Truck, MessageCircle,
  Bot, Search, Star, Quote,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/ProductCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { productsApi } from "@/api/products";
import { reviewsApi } from "@/api/reviews";
import { useAuthStore } from "@/store/authStore";
import { articlesApi } from "@/api/articles";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productsApi.getProducts({ limit: 8 }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: () => reviewsApi.getPublicReviews({ limit: 6 }),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles-preview"],
    queryFn: () => articlesApi.getArticles({ limit: 3 }),
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim())
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Products",
      desc: "All medicines sourced from certified manufacturers",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: "Same-day delivery for orders placed before 2 PM",
    },
    {
      icon: MessageCircle,
      title: "Expert Support",
      desc: "Chat with licensed pharmacists anytime",
    },
    {
      icon: Bot,
      title: "AI Assistant",
      desc: "24/7 AI-powered health guidance",
    },
  ];

  // Average rating calculation
  const reviews = reviewsData?.items ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative rounded-2xl bg-primary overflow-hidden p-8 md:p-12 lg:p-16">
        <div className="relative z-10 max-w-2xl">
          <p className="text-primary-foreground/70 text-sm font-medium mb-3 uppercase tracking-wider">
            Myanmar's Trusted Online Pharmacy
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-4">
            Your health,<br />delivered
          </h1>
          <p className="text-primary-foreground/70 text-lg mb-8 leading-relaxed">
            Browse thousands of medicines and healthcare products. Order with
            confidence, delivered to your door.
          </p>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for medicines..."
                className="w-full pl-9 pr-4 h-11 rounded-lg border-0 bg-primary-foreground/95 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" variant="secondary" size="lg" className="shrink-0">
              Search
            </Button>
          </form>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-primary-foreground/5 rounded-l-[100px] hidden lg:block" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 text-primary-foreground/10 text-[200px] font-display font-bold hidden lg:block select-none">
          SLM
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">
              Browse Categories
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category_id=${cat.id}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-center"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="text-lg">💊</span>
                </div>
                <span className="text-xs font-medium leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">
            Featured Products
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsData?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Customer Reviews ─────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold">
                What our customers say
              </h2>
              <p className="text-muted-foreground text-sm">
                Real reviews from verified customers
              </p>
            </div>

            {/* Average rating summary */}
            <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-3 w-fit">
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-primary leading-none">
                  {avgRating.toFixed(1)}
                </p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-semibold text-sm leading-none">
                  {reviewsData?.total ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  reviews
                </p>
              </div>
            </div>
          </div>

          {/* Review cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200"
              >
                {/* Quote icon */}
                <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/10" />

                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4">
                  "{review.comment}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-1 border-t border-border">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={review.user?.avatar_url ?? ""} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {review.user?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {review.user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verified Customer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA for non-authenticated users */}
          {!isAuthenticated && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Join thousands of satisfied customers
              </p>
              <Button asChild>
                <Link to="/register">Create an Account</Link>
              </Button>
            </div>
          )}
        </section>
      )}

      {/* ── Articles Preview ─────────────────────────────────────────────────── */}
      {articlesData && articlesData.items.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Health Articles</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Expert advice from our pharmacists
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/articles">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {articlesData.items.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="h-36 bg-muted overflow-hidden">
                  {article.cover_image_url ? (
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-primary/5 text-4xl">📰</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-xs font-medium text-primary">
                    {article.category === "news" ? "Pharmacy News"
                      : article.category === "health_tips" ? "Health Tips"
                      : "Medicine Info"}
                  </span>
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}