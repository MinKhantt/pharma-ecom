import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { 
  Plus, Pencil, Trash2, Image, Search, 
  ChevronLeft, ChevronRight, Package, AlertCircle 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { productsApi } from "@/api/products";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  inventory: z.coerce.number().min(0, "Cannot be negative"),
  description: z.string().optional(),
  requires_prescription: z.boolean(),
  category_id: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof schema>;

export default function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  
  // --- STATE ---
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageProductId, setImageProductId] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const LIMIT = 8;

  // --- QUERIES ---
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, page],
    queryFn: () => productsApi.getProducts({ 
      search: search || undefined, 
      limit: LIMIT, 
      skip: page * LIMIT 
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.getCategories,
  });

  // --- FORM ---
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requires_prescription: false, inventory: 0 },
  });

  const rxValue = watch("requires_prescription");

  // --- ACTIONS ---
  const openCreate = () => {
    setEditing(null);
    reset({ requires_prescription: false, inventory: 0, name: "", description: "", manufacturer: "" });
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({
      name: product.name,
      manufacturer: product.manufacturer ?? "",
      price: Number(product.price),
      inventory: product.inventory,
      description: product.description ?? "",
      requires_prescription: product.requires_prescription,
      category_id: product.category.id,
    });
    setOpen(true);
  };

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (formData: FormData) =>
      editing
        ? productsApi.updateProduct(editing.id, formData)
        : productsApi.createProduct(formData),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Save failed"),
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Delete failed"),
  });

  const { mutate: uploadImage, isPending: isUploading } = useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      productsApi.uploadImage(productId, file, true),
    onSuccess: () => {
      toast.success("Image updated");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setImageProductId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Upload failed"),
  });

  // --- HELPERS ---
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Product Catalogue</h1>
          <p className="text-muted-foreground text-sm">
            {data?.total ?? 0} total items in inventory
          </p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mt-4">Loading your products...</p>
        </div>
      ) : data?.items.length === 0 ? (
        <Card className="border-dashed py-20 flex flex-col items-center justify-center text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Try adjusting your search or add a new product to your catalogue.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.items.map((product) => {
              const img = product.images.find((i) => i.is_primary) ?? product.images[0];
              const isLowStock = product.inventory < 10;

              return (
                <Card key={product.id} className="group overflow-hidden border-slate-200 hover:shadow-md transition-all duration-200">
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {img ? (
                      <img src={img.url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl grayscale opacity-50">📦</div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-sm"
                        disabled={isUploading}
                        onClick={() => { setImageProductId(product.id); fileRef.current?.click(); }}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>

                    {isLowStock && (
                      <Badge variant="destructive" className="absolute bottom-2 left-2 text-[10px] uppercase font-bold px-1.5 h-5">
                        Low Stock
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                        {product.requires_prescription && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px] font-bold">Rx</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{product.category.name}</p>
                    </div>

                    <div className="flex items-end justify-between border-t pt-3">
                      <div>
                        <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                        <p className={cn("text-xs font-medium", isLowStock ? "text-destructive" : "text-muted-foreground")}>
                          Qty: {product.inventory}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { if(confirm("Delete product?")) deleteProduct(product.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? "default" : "ghost"}
                    size="sm"
                    className="w-9 h-9"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => p + 1)}
                disabled={page + 1 >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Upload Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && imageProductId) uploadImage({ productId: imageProductId, file });
        }}
      />

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editing ? "Update Product" : "Create Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => save(d))} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="font-semibold">Product Name *</Label>
              <Input {...register("name")} placeholder="e.g. Paracetamol 500mg" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Price (MMK) *</Label>
                <Input type="number" {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Initial Stock *</Label>
                <Input type="number" {...register("inventory")} />
                {errors.inventory && <p className="text-xs text-destructive">{errors.inventory.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Category *</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(v) => setValue("category_id", v)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Manufacturer</Label>
              <Input {...register("manufacturer")} placeholder="Company name" />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Detailed Description</Label>
              <Textarea rows={4} {...register("description")} placeholder="Usage, side effects, etc." />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border">
              <input
                type="checkbox"
                id="rx"
                checked={rxValue}
                onChange={(e) => setValue("requires_prescription", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="rx" className="font-bold cursor-pointer">Require Prescription</Label>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Regulation check required for checkout</p>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving ? <LoadingSpinner size="xs" /> : editing ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}