CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1200),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  village text CHECK (village IS NULL OR char_length(btrim(village)) <= 100),
  district text CHECK (district IS NULL OR char_length(btrim(district)) <= 100),
  crop_tags text[] NOT NULL DEFAULT '{}',
  image_path text,
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_tag_count CHECK (cardinality(crop_tags) <= 5),
  CONSTRAINT community_post_tags_not_null CHECK (array_position(crop_tags, NULL) IS NULL)
);

CREATE TABLE public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_likes_once UNIQUE (post_id, user_id)
);

CREATE TABLE public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (
    reason IN ('spam', 'misinformation', 'harassment', 'privacy', 'other')
  ),
  details text CHECK (details IS NULL OR char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_report_once UNIQUE (post_id, user_id)
);

CREATE INDEX community_posts_public_latest
  ON public.community_posts (created_at DESC)
  WHERE visibility = 'public' AND moderation_status = 'approved';
CREATE INDEX community_posts_owner_latest
  ON public.community_posts (user_id, created_at DESC);
CREATE INDEX community_posts_crop_tags ON public.community_posts USING gin (crop_tags);
CREATE INDEX community_comments_post_created
  ON public.community_post_comments (post_id, created_at);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT (user_id, author_name, body, visibility, village, district, crop_tags, image_path)
  ON public.community_posts TO authenticated;
GRANT UPDATE (author_name, body, visibility, village, district, crop_tags, image_path, moderation_status)
  ON public.community_posts TO authenticated;
GRANT DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

GRANT SELECT, INSERT, DELETE ON public.community_post_likes TO authenticated;
GRANT ALL ON public.community_post_likes TO service_role;
GRANT SELECT ON public.community_post_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.community_post_comments TO authenticated;
GRANT ALL ON public.community_post_comments TO service_role;
GRANT SELECT, INSERT ON public.community_post_reports TO authenticated;
GRANT ALL ON public.community_post_reports TO service_role;

CREATE OR REPLACE FUNCTION public.is_community_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'moderator', false);
$$;
GRANT EXECUTE ON FUNCTION public.is_community_moderator() TO authenticated;

CREATE POLICY "Visitors see approved public posts"
  ON public.community_posts FOR SELECT TO anon
  USING (visibility = 'public' AND moderation_status = 'approved');
CREATE POLICY "Farmers see public and own posts"
  ON public.community_posts FOR SELECT TO authenticated
  USING (
    (visibility = 'public' AND moderation_status = 'approved')
    OR user_id = auth.uid()
    OR public.is_community_moderator()
  );
CREATE POLICY "Farmers create own posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND moderation_status = 'pending');
CREATE POLICY "Farmers edit own posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_community_moderator())
  WITH CHECK (user_id = auth.uid() OR public.is_community_moderator());
CREATE POLICY "Farmers delete own posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_community_moderator());

CREATE POLICY "Farmers see own likes"
  ON public.community_post_likes FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Farmers like visible posts"
  ON public.community_post_likes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.moderation_status = 'approved'
    )
  );
CREATE POLICY "Farmers remove own likes"
  ON public.community_post_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Read comments on visible posts"
  ON public.community_post_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id
        AND (
          (p.visibility = 'public' AND p.moderation_status = 'approved')
          OR p.user_id = auth.uid()
        )
    )
    OR public.is_community_moderator()
  );
CREATE POLICY "Visitors read comments on approved public posts"
  ON public.community_post_comments FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.moderation_status = 'approved'
    )
  );
CREATE POLICY "Comment on approved public posts"
  ON public.community_post_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.moderation_status = 'approved'
    )
  );
CREATE POLICY "Farmers delete own comments"
  ON public.community_post_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_community_moderator());

CREATE POLICY "Farmers submit reports"
  ON public.community_post_reports FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id
        AND p.visibility = 'public'
        AND p.moderation_status = 'approved'
        AND p.user_id <> auth.uid()
    )
  );
CREATE POLICY "Reporters and moderators read reports"
  ON public.community_post_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_community_moderator());

CREATE OR REPLACE FUNCTION public.community_guard_post()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.body := btrim(NEW.body);
  NEW.author_name := btrim(NEW.author_name);
  IF NEW.body ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)'
     OR coalesce(NEW.village, '') ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)'
     OR coalesce(NEW.district, '') ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)'
     OR NEW.author_name ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)'
     OR array_to_string(NEW.crop_tags, ' ') ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)' THEN
    RAISE EXCEPTION 'Phone numbers cannot be included in community posts';
  END IF;
  IF NEW.body ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}'
     OR coalesce(NEW.village, '') ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}'
     OR coalesce(NEW.district, '') ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}'
     OR NEW.author_name ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}'
     OR array_to_string(NEW.crop_tags, ' ') ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}' THEN
    RAISE EXCEPTION 'Exact GPS coordinates cannot be included in community posts';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.crop_tags) AS tags(tag)
    WHERE char_length(btrim(tag)) NOT BETWEEN 1 AND 32
  ) THEN
    RAISE EXCEPTION 'Crop tags must be between 1 and 32 characters';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.moderation_status <> 'pending' THEN
      RAISE EXCEPTION 'New community posts must await moderation';
    END IF;
  ELSIF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
    AND NOT public.is_community_moderator()
    AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only moderators may change post moderation status';
  END IF;
  IF TG_OP = 'UPDATE'
    AND NEW.visibility = 'public'
    AND (
      NEW.author_name IS DISTINCT FROM OLD.author_name
      OR NEW.body IS DISTINCT FROM OLD.body
      OR NEW.visibility IS DISTINCT FROM OLD.visibility
      OR NEW.village IS DISTINCT FROM OLD.village
      OR NEW.district IS DISTINCT FROM OLD.district
      OR NEW.crop_tags IS DISTINCT FROM OLD.crop_tags
      OR NEW.image_path IS DISTINCT FROM OLD.image_path
    )
    AND NOT public.is_community_moderator()
    AND coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.moderation_status := 'pending';
  END IF;
  IF NEW.image_path IS NOT NULL AND (
    split_part(NEW.image_path, '/', 1) <> NEW.user_id::text
    OR split_part(NEW.image_path, '/', 2) <> NEW.id::text
    OR NEW.image_path LIKE '%..%'
  ) THEN
    RAISE EXCEPTION 'Invalid community image path';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_posts_guard
  BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_post();

CREATE OR REPLACE FUNCTION public.community_guard_comment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.body := btrim(NEW.body);
  NEW.author_name := btrim(NEW.author_name);
  IF NEW.body ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)'
     OR NEW.author_name ~ '(^|[^0-9])[+]?[0-9][0-9(). -]{8,}[0-9]([^0-9]|$)' THEN
    RAISE EXCEPTION 'Phone numbers cannot be included in community comments';
  END IF;
  IF NEW.body ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}'
     OR NEW.author_name ~ '-?[0-9]{1,3}\.[0-9]{4,}[[:space:]]*[,/][[:space:]]*-?[0-9]{1,3}\.[0-9]{4,}' THEN
    RAISE EXCEPTION 'Exact GPS coordinates cannot be included in community comments';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_comments_guard
  BEFORE INSERT OR UPDATE ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_comment();

CREATE TABLE public.community_rate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('post', 'comment', 'report')),
  body_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX community_rate_events_user_action_time
  ON public.community_rate_events (user_id, action, created_at DESC);
ALTER TABLE public.community_rate_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_rate_events FROM anon, authenticated;
GRANT ALL ON public.community_rate_events TO service_role;

CREATE OR REPLACE FUNCTION public.community_limit_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
  DELETE FROM public.community_rate_events
  WHERE user_id = NEW.user_id AND created_at < now() - interval '24 hours';
  IF (
    SELECT count(*) FROM public.community_rate_events
    WHERE user_id = NEW.user_id AND action = 'post'
      AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'You can publish up to 5 updates per hour';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.community_rate_events
    WHERE user_id = NEW.user_id AND action = 'post'
      AND body_hash = md5(lower(btrim(NEW.body)))
      AND created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'A similar update was posted recently';
  END IF;
  INSERT INTO public.community_rate_events (user_id, action, body_hash)
  VALUES (NEW.user_id, 'post', md5(lower(btrim(NEW.body))));
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_posts_rate_limit
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_limit_posts();

CREATE OR REPLACE FUNCTION public.community_limit_comments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
  DELETE FROM public.community_rate_events
  WHERE user_id = NEW.user_id AND created_at < now() - interval '24 hours';
  IF (
    SELECT count(*) FROM public.community_rate_events
    WHERE user_id = NEW.user_id AND action = 'comment'
      AND created_at > now() - interval '10 minutes'
  ) >= 10 THEN
    RAISE EXCEPTION 'You can add up to 10 comments every 10 minutes';
  END IF;
  INSERT INTO public.community_rate_events (user_id, action)
  VALUES (NEW.user_id, 'comment');
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_comments_rate_limit
  BEFORE INSERT ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_limit_comments();

CREATE OR REPLACE FUNCTION public.community_limit_reports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));
  DELETE FROM public.community_rate_events
  WHERE user_id = NEW.user_id AND created_at < now() - interval '24 hours';
  IF (
    SELECT count(*) FROM public.community_rate_events
    WHERE user_id = NEW.user_id AND action = 'report'
      AND created_at > now() - interval '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'You can submit up to 10 reports per hour';
  END IF;
  INSERT INTO public.community_rate_events (user_id, action)
  VALUES (NEW.user_id, 'report');
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_reports_rate_limit
  BEFORE INSERT ON public.community_post_reports
  FOR EACH ROW EXECUTE FUNCTION public.community_limit_reports();

CREATE OR REPLACE FUNCTION public.community_feed_metrics(p_post_ids uuid[])
RETURNS TABLE (post_id uuid, like_count bigint, comment_count bigint, liked_by_me boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
    likes.total,
    comments.total,
    EXISTS (
      SELECT 1 FROM public.community_post_likes mine
      WHERE mine.post_id = p.id AND mine.user_id = auth.uid()
    )
  FROM public.community_posts p
  CROSS JOIN LATERAL (
    SELECT count(*)::bigint AS total
    FROM public.community_post_likes l WHERE l.post_id = p.id
  ) likes
  CROSS JOIN LATERAL (
    SELECT count(*)::bigint AS total
    FROM public.community_post_comments c WHERE c.post_id = p.id
  ) comments
  WHERE p.id = ANY(coalesce(p_post_ids, '{}'::uuid[]))
    AND cardinality(p_post_ids) <= 100
    AND (
      (p.visibility = 'public' AND p.moderation_status = 'approved')
      OR p.user_id = auth.uid()
      OR public.is_community_moderator()
    );
$$;
GRANT EXECUTE ON FUNCTION public.community_feed_metrics(uuid[]) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

CREATE POLICY "Owners upload community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners and public viewers read community images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.community_posts p
        WHERE p.id::text = (storage.foldername(name))[2]
          AND p.user_id::text = (storage.foldername(name))[1]
          AND p.image_path = name
          AND p.visibility = 'public'
          AND p.moderation_status = 'approved'
      )
    )
  );
CREATE POLICY "Visitors read approved public community images"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'community-images'
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.user_id::text = (storage.foldername(name))[1]
        AND p.image_path = name
        AND p.visibility = 'public'
        AND p.moderation_status = 'approved'
    )
  );
CREATE POLICY "Owners delete community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
