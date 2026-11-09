import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/lib/router-compat";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  COMMUNITY_IMAGE_TYPES,
  COMMUNITY_MAX_POST_LENGTH,
  COMMUNITY_MAX_TAGS,
  parseCropTags,
  validateCommunityImage,
  validateCommunityPost,
  validateCommunityText,
} from "@/lib/community";
import {
  Check,
  Globe2,
  Heart,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ShieldAlert,
  Sprout,
  Trash2,
  UsersRound,
} from "lucide-react";

type Visibility = "private" | "public";
type FeedFilter = "latest" | "nearby" | "crop" | "popular";

interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  visibility: Visibility;
  village: string | null;
  district: string | null;
  crop_tags: string[];
  image_path: string | null;
  moderation_status: "pending" | "approved" | "hidden" | "removed";
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  image_url: string | null;
}

interface CommunityComment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const imageBucket = "community-images";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

async function removeImage(path: string) {
  const { error } = await supabase.storage.from(imageBucket).remove([path]);
  if (error) throw error;
}

async function prepareImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 30_000_000) {
    bitmap.close();
    throw new Error("Choose an image with no more than 30 megapixels.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not prepare the image safely.");
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, file.type, file.type === "image/png" ? undefined : 0.9),
  );
  if (!blob || blob.type !== file.type) {
    throw new Error("This browser could not remove private image metadata. Try another image.");
  }
  const prepared = new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
  const validationError = validateCommunityImage(prepared);
  if (validationError) throw new Error(validationError);
  return prepared;
}

function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  throw new Error("Unsupported image format.");
}

const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("latest");
  const [cropFilter, setCropFilter] = useState("");
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [shareQueryReady, setShareQueryReady] = useState(false);

  const profileName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const profileVillage =
    typeof user?.user_metadata?.village === "string" ? user.user_metadata.village.trim() : "";
  const isSignedIn = Boolean(user);

  const [authorName, setAuthorName] = useState(profileName);
  const [body, setBody] = useState("");
  const [cropInput, setCropInput] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [showLocation, setShowLocation] = useState(false);
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  const imagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!editingPost) setAuthorName(profileName);
  }, [profileName, editingPost]);

  useEffect(() => {
    if (isSignedIn && profileVillage) return;
    setNearbyEnabled(false);
    setFilter((current) => (current === "nearby" ? "latest" : current));
  }, [isSignedIn, profileVillage]);

  useEffect(() => {
    setSharedPostId(new URLSearchParams(window.location.search).get("post"));
    setShareQueryReady(true);
  }, []);

  const refreshFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as Omit<
        CommunityPost,
        "like_count" | "comment_count" | "liked_by_me" | "image_url"
      >[];
      if (sharedPostId && !rows.some((post) => post.id === sharedPostId)) {
        const { data: sharedPost, error: sharedPostError } = await supabase
          .from("community_posts")
          .select("*")
          .eq("id", sharedPostId)
          .maybeSingle();
        if (sharedPostError) throw sharedPostError;
        if (sharedPost) {
          rows.unshift(sharedPost);
          if (rows.length > 100) rows.pop();
        }
      }

      const [metricsResult, hydratedPosts] = await Promise.all([
        supabase.rpc("community_feed_metrics", {
          p_post_ids: rows.map((post) => post.id),
        }),
        Promise.all(
          rows.map(async (post) => {
            if (!post.image_path) return { ...post, image_url: null };
            const { data: image, error: imageError } = await supabase.storage
              .from(imageBucket)
              .createSignedUrl(post.image_path, 60 * 60);
            if (imageError) throw imageError;
            return { ...post, image_url: image.signedUrl };
          }),
        ),
      ]);
      if (metricsResult.error) throw metricsResult.error;
      type FeedMetric = {
        post_id: string;
        like_count: number;
        comment_count: number;
        liked_by_me: boolean;
      };
      const metrics = new Map<string, FeedMetric>(
        (metricsResult.data ?? []).map((item: FeedMetric) => [item.post_id, item]),
      );
      setPosts(
        hydratedPosts.map((post) => {
          const item = metrics.get(post.id);
          return {
            ...post,
            like_count: item?.like_count ?? 0,
            comment_count: item?.comment_count ?? 0,
            liked_by_me: item?.liked_by_me ?? false,
          };
        }),
      );
    } catch (error) {
      const message = getErrorMessage(error, "Could not load the community feed.");
      setFeedError(message);
      throw error;
    } finally {
      setFeedLoading(false);
    }
  }, [sharedPostId]);

  useEffect(() => {
    if (authLoading || !shareQueryReady) return;
    void refreshFeed().catch((error: unknown) => {
      console.error("Could not load the community feed", error);
    });
  }, [authLoading, user?.id, refreshFeed, shareQueryReady]);

  useEffect(() => {
    if (feedLoading || !sharedPostId || !posts.some((post) => post.id === sharedPostId)) return;
    requestAnimationFrame(() => {
      document.getElementById(`post-${sharedPostId}`)?.scrollIntoView({ behavior: "smooth" });
    });
  }, [feedLoading, posts, sharedPostId]);

  const visiblePosts = useMemo(() => {
    let result = [...posts];
    if (filter === "nearby") {
      result =
        nearbyEnabled && profileVillage
          ? result.filter(
              (post) => post.village?.toLocaleLowerCase() === profileVillage.toLocaleLowerCase(),
            )
          : [];
    }
    if (filter === "crop" && cropFilter) {
      result = result.filter((post) =>
        post.crop_tags.some((tag) => tag.toLocaleLowerCase() === cropFilter.toLocaleLowerCase()),
      );
    }
    if (filter === "popular") result.sort((a, b) => b.like_count - a.like_count);
    return result;
  }, [posts, filter, cropFilter, profileVillage, nearbyEnabled]);

  const allCrops = useMemo(
    () => [...new Set(posts.flatMap((post) => post.crop_tags))].sort((a, b) => a.localeCompare(b)),
    [posts],
  );

  const clearComposer = () => {
    setBody("");
    setCropInput("");
    setVisibility("private");
    setShowLocation(false);
    setVillage("");
    setDistrict("");
    setSelectedImage(null);
    setRemoveCurrentImage(false);
    setEditingPost(null);
    setAuthorName(profileName);
  };

  const startEditing = (post: CommunityPost) => {
    setEditingPost(post);
    setAuthorName(post.author_name);
    setBody(post.body);
    setCropInput(post.crop_tags.join(", "));
    setVisibility(post.visibility);
    setShowLocation(Boolean(post.village || post.district));
    setVillage(post.village ?? "");
    setDistrict(post.district ?? "");
    setSelectedImage(null);
    setRemoveCurrentImage(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({
        title: "Sign in to post",
        description: "Only signed-in farmers can publish updates.",
      });
      return;
    }
    const cropTags = parseCropTags(cropInput);
    const nextVillage = showLocation ? village.trim() || null : null;
    const nextDistrict = showLocation ? district.trim() || null : null;
    const validationError = validateCommunityPost({
      body,
      authorName,
      cropTags,
      village: nextVillage ?? "",
      district: nextDistrict ?? "",
    });
    if (validationError) {
      toast({ title: "Check your update", description: validationError, variant: "destructive" });
      return;
    }
    if (cropTags.length > COMMUNITY_MAX_TAGS) {
      toast({
        title: "Too many crop tags",
        description: `Use up to ${COMMUNITY_MAX_TAGS} comma-separated tags.`,
        variant: "destructive",
      });
      return;
    }
    if (selectedImage) {
      const imageError = validateCommunityImage(selectedImage);
      if (imageError) {
        toast({ title: "Image not accepted", description: imageError, variant: "destructive" });
        return;
      }
    }

    setSavingPost(true);
    let uploadedPath: string | null = null;
    let createdPostId: string | null = null;
    try {
      const previousImagePath = editingPost?.image_path ?? null;
      let nextImagePath = removeCurrentImage ? null : previousImagePath;

      if (editingPost) {
        if (selectedImage) {
          const prepared = await prepareImage(selectedImage);
          uploadedPath = `${user.id}/${editingPost.id}/${crypto.randomUUID()}.${imageExtension(prepared.type)}`;
          const { error: uploadError } = await supabase.storage
            .from(imageBucket)
            .upload(uploadedPath, prepared, { contentType: prepared.type, upsert: false });
          if (uploadError) throw uploadError;
          nextImagePath = uploadedPath;
        }
        const { error } = await supabase
          .from("community_posts")
          .update({
            author_name: authorName.trim(),
            body: body.trim(),
            visibility,
            village: nextVillage,
            district: nextDistrict,
            crop_tags: cropTags,
            image_path: nextImagePath,
          })
          .eq("id", editingPost.id);
        if (error) throw error;
        if (previousImagePath && previousImagePath !== nextImagePath) {
          try {
            await removeImage(previousImagePath);
          } catch (error) {
            console.error("Could not remove the replaced community image", error);
            toast({
              title: "Update saved",
              description: "The previous image could not be removed.",
              variant: "destructive",
            });
          }
        }
      } else {
        const { data, error } = await supabase
          .from("community_posts")
          .insert({
            user_id: user.id,
            author_name: authorName.trim(),
            body: body.trim(),
            visibility,
            village: nextVillage,
            district: nextDistrict,
            crop_tags: cropTags,
          })
          .select("id")
          .single();
        if (error) throw error;
        createdPostId = data.id;

        if (selectedImage) {
          const prepared = await prepareImage(selectedImage);
          uploadedPath = `${user.id}/${createdPostId}/${crypto.randomUUID()}.${imageExtension(prepared.type)}`;
          const { error: uploadError } = await supabase.storage
            .from(imageBucket)
            .upload(uploadedPath, prepared, { contentType: prepared.type, upsert: false });
          if (uploadError) throw uploadError;
          const { error: updateError } = await supabase
            .from("community_posts")
            .update({ image_path: uploadedPath })
            .eq("id", createdPostId);
          if (updateError) throw updateError;
        }
      }

      toast({
        title: editingPost ? "Update saved" : "Update published",
        description:
          visibility === "public"
            ? "Public updates appear after moderator approval."
            : "This update is private and visible only to you.",
      });
      clearComposer();
      await refreshFeed().catch((error: unknown) => {
        console.error("Could not refresh the community feed after saving", error);
      });
    } catch (error) {
      const message = getErrorMessage(error, "Could not save your update.");
      if (uploadedPath) {
        try {
          await removeImage(uploadedPath);
        } catch (cleanupError) {
          console.error("Could not clean up an incomplete community image upload", cleanupError);
        }
      }
      if (createdPostId) {
        const { error: cleanupError } = await supabase
          .from("community_posts")
          .delete()
          .eq("id", createdPostId);
        if (cleanupError) {
          console.error("Could not clean up an incomplete community post", cleanupError);
        }
      }
      toast({ title: "Could not save update", description: message, variant: "destructive" });
    } finally {
      setSavingPost(false);
    }
  };

  const deletePost = async (post: CommunityPost) => {
    if (!user || !window.confirm("Delete this update? This cannot be undone.")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
    if (error) {
      toast({
        title: "Could not delete update",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    if (post.image_path) {
      try {
        await removeImage(post.image_path);
      } catch (error) {
        console.error("Could not remove the deleted post image", error);
        toast({
          title: "Update deleted",
          description: "Its image could not be removed from storage.",
          variant: "destructive",
        });
      }
    }
    toast({ title: "Update deleted" });
    if (editingPost?.id === post.id) clearComposer();
    await refreshFeed().catch((error: unknown) => {
      console.error("Could not refresh the community feed", error);
    });
  };

  const toggleLike = async (post: CommunityPost) => {
    if (!user) {
      toast({ title: "Sign in to like updates" });
      return;
    }
    const result = post.liked_by_me
      ? await supabase
          .from("community_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
      : await supabase.from("community_post_likes").insert({
          post_id: post.id,
          user_id: user.id,
        });
    if (result.error) {
      toast({
        title: "Could not update like",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }
    await refreshFeed().catch((error: unknown) => {
      console.error("Could not refresh the community feed", error);
    });
  };

  const changeFilter = (nextFilter: FeedFilter) => setFilter(nextFilter);

  return (
    <AppLayout title="Farmer Community" showBack>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <section className="rounded-2xl bg-gradient-hero p-5 text-primary-foreground shadow-card sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <UsersRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary-foreground/80">Growing together</p>
              <h1 className="mt-1 text-2xl font-bold">Farmer Community</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/90">
                Exchange field lessons, ask questions, and share what is working on your farm.
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-black/10 px-3 py-2 text-xs leading-relaxed">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Phone numbers and exact farm coordinates are not allowed. Image metadata is removed
            before upload.
          </p>
        </section>

        {user ? (
          <form
            onSubmit={savePost}
            className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">
                {editingPost ? "Edit your update" : "Share an update"}
              </h2>
              <span className="text-xs text-muted-foreground">
                Up to {COMMUNITY_MAX_POST_LENGTH} characters
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-author">Farmer name</Label>
              <Input
                id="community-author"
                maxLength={80}
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Name shown with your update"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-body">Your farming update</Label>
              <Textarea
                id="community-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={COMMUNITY_MAX_POST_LENGTH}
                placeholder="What are you growing, trying, or learning?"
                className="min-h-28 resize-y"
                required
              />
              <div className="text-right text-xs text-muted-foreground">
                {body.length}/{COMMUNITY_MAX_POST_LENGTH}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-crops">Crop tags</Label>
              <Input
                id="community-crops"
                value={cropInput}
                onChange={(event) => setCropInput(event.target.value)}
                placeholder="Wheat, cotton, tomato (up to 5)"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Who can see this?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="community-visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <LockKeyhole className="h-4 w-4 text-primary" /> Only me
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Private, visible only to you.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="community-visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Globe2 className="h-4 w-4 text-primary" /> Public
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Visitors can see it after moderator approval.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="space-y-3 rounded-xl bg-muted/60 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(event) => setShowLocation(event.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-primary" /> Show my village or district
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Optional; only the area you enter below is shown, never exact coordinates.
                  </span>
                </span>
              </label>
              {showLocation && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="community-village">Village (optional)</Label>
                    <Input
                      id="community-village"
                      maxLength={100}
                      value={village}
                      onChange={(event) => setVillage(event.target.value)}
                      placeholder="Village"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="community-district">District (optional)</Label>
                    <Input
                      id="community-district"
                      maxLength={100}
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      placeholder="District"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-image">Photo (optional)</Label>
              <Input
                id="community-image"
                type="file"
                accept={COMMUNITY_IMAGE_TYPES.join(",")}
                className="h-auto min-h-11 file:mr-3 file:rounded-md file:px-2 file:py-1"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    const imageError = validateCommunityImage(file);
                    if (imageError) {
                      toast({
                        title: "Image not accepted",
                        description: imageError,
                        variant: "destructive",
                      });
                      event.target.value = "";
                      return;
                    }
                  }
                  setSelectedImage(file);
                  setRemoveCurrentImage(false);
                }}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP up to 5 MB. Private metadata is stripped.
              </p>
              {editingPost?.image_url && !selectedImage && !removeCurrentImage && (
                <img
                  src={editingPost.image_url}
                  alt="Current attachment"
                  className="max-h-48 rounded-xl object-cover"
                />
              )}
              {selectedImage && imagePreview && (
                <img
                  src={imagePreview}
                  alt="Selected attachment preview"
                  className="max-h-48 rounded-xl object-cover"
                />
              )}
              {editingPost?.image_path && !selectedImage && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeCurrentImage}
                    onChange={(event) => setRemoveCurrentImage(event.target.checked)}
                    className="accent-primary"
                  />
                  Remove current image
                </label>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {editingPost && (
                <Button type="button" variant="ghost" onClick={clearComposer}>
                  Cancel edit
                </Button>
              )}
              <Button type="submit" disabled={savingPost}>
                {savingPost ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : editingPost ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {savingPost ? "Saving…" : editingPost ? "Save changes" : "Publish update"}
              </Button>
            </div>
          </form>
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div>
              <h2 className="font-semibold">Join the farmer conversation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to publish, like, comment, or report a post.
              </p>
            </div>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </section>
        )}

        <section aria-label="Community feed" className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Community feed</h2>
              {user && profileVillage && !nearbyEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNearbyEnabled(true)}
                  className="h-9"
                >
                  <MapPin className="h-4 w-4" /> Enable Nearby with my village
                </Button>
              )}
              {nearbyEnabled && (
                <p className="text-xs text-muted-foreground">
                  Nearby uses your sign-up village on this device only.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Feed filters">
              {(
                [
                  ["latest", "Latest"],
                  ["nearby", "Nearby"],
                  ["crop", "Crop"],
                  ["popular", "Popular"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  disabled={
                    value === "nearby" && (!nearbyEnabled || !isSignedIn || !profileVillage)
                  }
                  variant={filter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeFilter(value)}
                >
                  {value === "nearby" && <MapPin className="h-4 w-4" />}
                  {value === "crop" && <Sprout className="h-4 w-4" />}
                  {label}
                </Button>
              ))}
              {filter === "crop" && (
                <select
                  aria-label="Filter by crop"
                  value={cropFilter}
                  onChange={(event) => setCropFilter(event.target.value)}
                  className="h-9 min-w-36 rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="">All crops</option>
                  {allCrops.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {feedError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            >
              <p className="text-sm font-medium">The community feed could not be loaded.</p>
              <p className="mt-1 break-words text-sm text-muted-foreground">{feedError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  void refreshFeed().catch((error: unknown) =>
                    console.error("Feed retry failed", error),
                  );
                }}
              >
                Retry
              </Button>
            </div>
          )}
          {feedLoading && !feedError && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading farmer updates…
            </div>
          )}
          {!feedLoading && !feedError && visiblePosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
              <Leaf className="mx-auto h-8 w-8 text-primary/60" />
              <h3 className="mt-3 font-semibold">No updates here yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "nearby"
                  ? "No public updates are shared from your village yet."
                  : filter === "crop" && cropFilter
                    ? `No updates tagged ${cropFilter} yet.`
                    : "Be the first to share a farming lesson with the community."}
              </p>
            </div>
          )}
          {!feedLoading &&
            !feedError &&
            visiblePosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                userId={user?.id ?? null}
                userName={profileName || "Farmer"}
                onLike={() => toggleLike(post)}
                onEdit={() => startEditing(post)}
                onDelete={() => void deletePost(post)}
                onRefresh={() =>
                  refreshFeed().catch((error: unknown) => {
                    console.error("Could not refresh the community feed", error);
                  })
                }
                toast={toast}
              />
            ))}
        </section>
      </main>
    </AppLayout>
  );
};

function CommunityPostCard({
  post,
  userId,
  userName,
  onLike,
  onEdit,
  onDelete,
  onRefresh,
  toast,
}: {
  post: CommunityPost;
  userId: string | null;
  userName: string;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [comments, setComments] = useState<CommunityComment[] | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSaving, setReportSaving] = useState(false);
  const isOwner = userId === post.user_id;
  const publicAndApproved = post.visibility === "public" && post.moderation_status === "approved";

  const loadComments = async () => {
    setCommentLoading(true);
    const { data, error } = await supabase
      .from("community_post_comments")
      .select("id, author_name, body, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setCommentLoading(false);
    if (error) {
      toast({
        title: "Could not load comments",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setComments((data ?? []) as CommunityComment[]);
  };

  const openComments = async () => {
    const open = !commentsOpen;
    setCommentsOpen(open);
    if (open && comments === null) await loadComments();
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast({ title: "Sign in to comment" });
      return;
    }
    const text = commentBody.trim();
    const privateDataError = validateCommunityText(`${userName} ${text}`);
    if (!text || text.length > 500 || privateDataError) {
      toast({
        title: "Check your comment",
        description: privateDataError ?? "Comments must be between 1 and 500 characters.",
        variant: "destructive",
      });
      return;
    }
    setCommentSaving(true);
    const { error } = await supabase.from("community_post_comments").insert({
      post_id: post.id,
      user_id: userId,
      author_name: userName,
      body: text,
    });
    setCommentSaving(false);
    if (error) {
      toast({ title: "Could not add comment", description: error.message, variant: "destructive" });
      return;
    }
    setCommentBody("");
    await loadComments();
    onRefresh();
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast({ title: "Sign in to report a post" });
      return;
    }
    if (reportDetails.length > 500) {
      toast({ title: "Report details must be 500 characters or fewer.", variant: "destructive" });
      return;
    }
    setReportSaving(true);
    const { error } = await supabase.from("community_post_reports").insert({
      post_id: post.id,
      user_id: userId,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setReportSaving(false);
    if (error) {
      toast({
        title: "Could not submit report",
        description:
          error.code === "23505" ? "You have already reported this post." : error.message,
        variant: "destructive",
      });
      return;
    }
    setReportOpen(false);
    setReportDetails("");
    toast({ title: "Report sent", description: "A moderator will review this post." });
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/community?post=${post.id}#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Update from ${post.author_name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Share link copied" });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast({
        title: "Could not share link",
        description:
          error instanceof Error ? error.message : "Copy the page address to share this update.",
        variant: "destructive",
      });
    }
  };

  const location = [post.village, post.district].filter(Boolean).join(", ");
  const statusLabel =
    post.visibility === "private"
      ? "Private"
      : post.moderation_status === "approved"
        ? "Public"
        : post.moderation_status === "pending"
          ? "Awaiting review"
          : "Hidden by moderation";

  return (
    <article
      id={`post-${post.id}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-semibold">{post.author_name}</h3>
              {location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {location}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
              {isOwner && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{statusLabel}</span>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onEdit}
                aria-label="Edit update"
              >
                Edit
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onDelete}
                aria-label="Delete update"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </header>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{post.body}</p>

        {post.crop_tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Crop tags">
            {post.crop_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                <Leaf className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>
        )}
        {post.image_url && (
          <img
            src={post.image_url}
            alt={`Photo shared by ${post.author_name}`}
            className="max-h-[28rem] w-full rounded-xl bg-muted object-cover"
            loading="lazy"
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onLike}
              disabled={!publicAndApproved}
              aria-pressed={post.liked_by_me}
              className={post.liked_by_me ? "text-primary" : ""}
            >
              <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
              {post.like_count} Like
            </Button>
            {publicAndApproved && (
              <Button type="button" size="sm" variant="ghost" onClick={() => void openComments()}>
                <MessageCircle className="h-4 w-4" />
                {post.comment_count} Comment
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {publicAndApproved && (
              <Button type="button" size="sm" variant="ghost" onClick={() => void sharePost()}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            )}
            {!isOwner && publicAndApproved && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setReportOpen((open) => !open)}
              >
                <ShieldAlert className="h-4 w-4" /> Report
              </Button>
            )}
          </div>
        </div>

        {commentsOpen && publicAndApproved && (
          <section aria-label="Comments" className="space-y-3 border-t border-border pt-3">
            {commentLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
            {!commentLoading && comments?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No comments yet. Share a helpful thought.
              </p>
            )}
            {comments?.map((comment) => (
              <div key={comment.id} className="rounded-xl bg-muted/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{comment.author_name}</span>
                  <time className="text-xs text-muted-foreground" dateTime={comment.created_at}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.body}</p>
              </div>
            ))}
            {userId ? (
              <form onSubmit={submitComment} className="flex items-end gap-2">
                <Textarea
                  aria-label="Write a comment"
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  maxLength={500}
                  placeholder="Add a helpful comment…"
                  className="min-h-10 resize-y"
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={commentSaving}
                  aria-label="Send comment"
                >
                  {commentSaving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link to="/auth" className="font-medium text-primary underline">
                  Sign in
                </Link>{" "}
                to comment.
              </p>
            )}
          </section>
        )}

        {reportOpen && (
          <form
            onSubmit={submitReport}
            className="space-y-3 rounded-xl border border-border bg-muted/40 p-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Report this post
            </div>
            <label className="block space-y-1 text-sm">
              <span>Reason</span>
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="spam">Spam</option>
                <option value="misinformation">Misleading or unsafe advice</option>
                <option value="harassment">Harassment</option>
                <option value="privacy">Private information</option>
                <option value="other">Other</option>
              </select>
            </label>
            <Textarea
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              maxLength={500}
              placeholder="Details (optional)"
              aria-label="Report details"
              className="min-h-16"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              {userId ? (
                <Button type="submit" size="sm" variant="destructive" disabled={reportSaving}>
                  {reportSaving ? "Sending…" : "Send report"}
                </Button>
              ) : (
                <Button asChild size="sm" variant="destructive">
                  <Link to="/auth">Sign in to report</Link>
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export default Community;
