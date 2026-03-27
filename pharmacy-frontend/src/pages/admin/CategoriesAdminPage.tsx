import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { productsApi } from "@/api/products";
import type { Category } from "@/types";

interface CategoryForm {
  name: string;
  description: string;
}

export default function CategoriesAdminPage() {
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CategoryForm>({ name: "", description: "" });
  const [editForm, setEditForm]     = useState<CategoryForm>({ name: "", description: "" });

  // Delete confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn:  productsApi.getCategories,
  });

  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: (data: CategoryForm) => productsApi.createCategory(data),
    onSuccess: () => {
      toast.success("Category created");
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to create category"),
  });

  const { mutate: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      productsApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success("Category updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to update category"),
  });

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to delete category"),
  });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, description: cat.description ?? "" });
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {categories?.length ?? 0} categories
          </p>
        </div>
        <Button
          onClick={() => { setShowCreate(true); setEditingId(null); }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Category name *"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Textarea
              placeholder="Description (optional)"
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => createCategory(createForm)}
                disabled={isCreating || !createForm.name.trim()}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setCreateForm({ name: "", description: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories list */}
      <div className="space-y-2">
        {categories?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No categories yet. Create one to get started.
          </div>
        ) : (
          categories?.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                {editingId === cat.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Category name *"
                    />
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Description (optional)"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateCategory({ id: cat.id, data: editForm })}
                        disabled={isUpdating || !editForm.name.trim()}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{cat.name}</p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete category</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.name}"
              </span>
              ? Products in this category may be affected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteTarget && deleteCategory(deleteTarget.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}