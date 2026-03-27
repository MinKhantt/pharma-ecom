import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/ProductCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { productsApi } from "@/api/products";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") ?? "");
  const [rxFilter, setRxFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 12;

  useEffect(() => {
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category_id");
    if (searchParam) { setSearch(searchParam); setSearchInput(searchParam); }
    if (categoryParam) setCategoryId(categoryParam);
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryId, rxFilter, page],
    queryFn: () =>
      productsApi.getProducts({
        skip: page * limit,
        limit,
        search: search || undefined,
        category_id: categoryId || undefined,
        requires_prescription: rxFilter === "" ? undefined : rxFilter === "true",
      }),
  });

  useEffect(() => {
    setPage(0);
  }, [search, categoryId, rxFilter]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(0);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setCategoryId("");
    setRxFilter("");
    setSearchParams({});
    setPage(0);
  };

  const hasFilters = search || categoryId || rxFilter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-1">
          Browse our full range of medicines and healthcare products
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} className="shrink-0">
            Search
          </Button>
        </div>

        {/* Category filter */}
        <Select
          value={categoryId || "all"}
          onValueChange={(v) => { setCategoryId(v === "all" ? "" : v); setPage(0); }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Prescription filter */}
        <Select
          value={rxFilter || "all"}
          onValueChange={(v) => { setRxFilter(v === "all" ? "" : v); setPage(0); }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Prescription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="false">Over-the-counter</SelectItem>
            <SelectItem value="true">Prescription only</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters} className="shrink-0">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {data && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {data.total} product{data.total !== 1 ? "s" : ""} found
          </p>
          {hasFilters && (
            <div className="flex gap-2 flex-wrap">
              {search && (
                <Badge variant="secondary" className="gap-1">
                  "{search}"
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => { setSearch(""); setSearchInput(""); }}
                  />
                </Badge>
              )}
              {categoryId && (
                <Badge variant="secondary" className="gap-1">
                  {categories?.find((c) => c.id === categoryId)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setCategoryId("")}
                  />
                </Badge>
              )}
              {rxFilter && (
                <Badge variant="secondary" className="gap-1">
                  {rxFilter === "true" ? "Prescription only" : "Over-the-counter"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setRxFilter("")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-display text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search term
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data && data.total > limit && (
            <div className="flex items-center justify-center gap-3 pt-4">
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