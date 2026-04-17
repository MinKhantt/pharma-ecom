import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Article } from "@/types";
import { articlesApi } from "@/api/articles";

// ── Rich text editor using Quill ─────────────────────────────────────────────
import { useEffect } from "react";

function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Don't initialize if already initialized or no ref
    if (!editorRef.current || quillRef.current) return;

    let isMounted = true;

    const loadQuill = async () => {
      try {
        const Quill = (await import("quill")).default;
        
        // Only create if still mounted and ref still exists
        if (!isMounted || !editorRef.current) return;
        
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "code-block"],
              ["link"],
              ["clean"],
            ],
          },
        });

        if (value) quillRef.current.root.innerHTML = value;

        quillRef.current.on("text-change", () => {
          if (quillRef.current) {
            onChange(quillRef.current.root.innerHTML);
          }
        });
      } catch (error) {
        console.error("Failed to load Quill:", error);
      }
    };

    loadQuill();

    // Cleanup function
    return () => {
      isMounted = false;
      if (quillRef.current) {
        // Remove all event listeners
        quillRef.current.off("text-change");
        quillRef.current = null;
      }
      // Clear the container's inner HTML
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []); // Empty dependency array - only run once

  // Update content when external value changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      const isDifferent = quillRef.current.root.innerHTML !== value;
      if (isDifferent) {
        quillRef.current.root.innerHTML = value || '';
      }
    }
  }, [value]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.quilljs.com/1.3.7/quill.snow.css" />
      <div ref={editorRef} className="min-h-[300px] bg-background" />
    </>
  );
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "news",          label: "Pharmacy News" },
  { value: "health_tips",   label: "Health Tips" },
  { value: "medicine_info", label: "Medicine Info" },
];

const CATEGORY_COLORS: Record<string, string> = {
  news:          "bg-blue-100 text-blue-800 border-blue-200",
  health_tips:   "bg-green-100 text-green-800 border-green-200",
  medicine_info: "bg-purple-100 text-purple-800 border-purple-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Article form ──────────────────────────────────────────────────────────────
interface ArticleForm {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  is_published: boolean;
}

const emptyForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "news",
  is_published: false,
};

export default function ArticlesAdminPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [form, setForm]             = useState<ArticleForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn:  () => articlesApi.adminGetArticles({ limit: 100 }),
  });

  const { mutate: createArticle, isPending: isCreating } = useMutation({
    mutationFn: () => articlesApi.createArticle(form),
    onSuccess: () => {
      toast.success("Article created");
      setShowForm(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to create"),
  });

  const { mutate: updateArticle, isPending: isUpdating } = useMutation({
    mutationFn: () => articlesApi.updateArticle(editTarget!.id, form),
    onSuccess: () => {
      toast.success("Article updated");
      setEditTarget(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to update"),
  });

  const { mutate: togglePublish } = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      articlesApi.updateArticle(id, { is_published }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_published ? "Article published" : "Article unpublished");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: () => toast.error("Failed to update"),
  });

  const { mutate: deleteArticle, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => articlesApi.deleteArticle(id),
    onSuccess: () => {
      toast.success("Article deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const { mutate: uploadCover, isPending: isUploading } = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      articlesApi.uploadCover(id, file),
    onSuccess: () => {
      toast.success("Cover image uploaded");
      setUploadTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: () => toast.error("Failed to upload cover"),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (article: Article) => {
    setEditTarget(article);
    setForm({
      title:        article.title,
      excerpt:      article.excerpt ?? "",
      content:      article.content,
      category:     article.category,
      is_published: article.is_published,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (editTarget) updateArticle();
    else createArticle();
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} articles
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Article
        </Button>
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {data?.items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No articles yet. Create your first one.
          </div>
        ) : (
          data?.items.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Cover thumbnail */}
                  <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                    {article.cover_image_url ? (
                      <img
                        src={article.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl">
                        📰
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[article.category]}`}>
                        {CATEGORIES.find((c) => c.value === article.category)?.label}
                      </span>
                      <Badge variant={article.is_published ? "default" : "secondary"} className="text-xs">
                        {article.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm leading-tight">
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {article.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(article.created_at)}
                      {article.author && ` · ${article.author.full_name}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Upload cover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadTarget(article.id);
                        fileRef.current?.click();
                      }}
                      disabled={isUploading && uploadTarget === article.id}
                      title="Upload cover image"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>

                    {/* Toggle publish */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        togglePublish({
                          id: article.id,
                          is_published: !article.is_published,
                        })
                      }
                      title={article.is_published ? "Unpublish" : "Publish"}
                    >
                      {article.is_published ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(article)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(article)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Hidden file input for cover upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTarget) {
            uploadCover({ id: uploadTarget, file });
          }
          e.target.value = "";
        }}
      />

      {/* ── Create/Edit dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditTarget(null); } }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Article title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label>Excerpt (optional)</Label>
              <Textarea
                placeholder="Short summary shown in article cards..."
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>

            {/* Category + Published */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.is_published ? "published" : "draft"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, is_published: v === "published" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rich text editor */}
            <div className="space-y-2">
              <Label>Content *</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <RichEditor
                  value={form.content}
                  onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setEditTarget(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : editTarget ? "Save changes" : "Create article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete article</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              "{deleteTarget?.title}"
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteArticle(deleteTarget.id)}
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