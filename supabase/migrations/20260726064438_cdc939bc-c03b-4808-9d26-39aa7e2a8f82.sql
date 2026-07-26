
ALTER TABLE public.ai_roadmaps
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'brand',
  ADD COLUMN IF NOT EXISTS estimated_hours integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'skill_tree';

UPDATE public.ai_roadmaps SET name = COALESCE(name, exam, 'My Roadmap') WHERE name IS NULL;

ALTER TABLE public.ai_roadmap_tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS youtube_video_id text,
  ADD COLUMN IF NOT EXISTS youtube_title text,
  ADD COLUMN IF NOT EXISTS youtube_channel text,
  ADD COLUMN IF NOT EXISTS youtube_thumbnail text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS practice_task text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS prereq_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS node_key text,
  ADD COLUMN IF NOT EXISTS position_x real DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y real DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

ALTER TABLE public.ai_roadmap_tasks ALTER COLUMN day DROP NOT NULL;

DROP TRIGGER IF EXISTS trg_ai_roadmaps_updated ON public.ai_roadmaps;
CREATE TRIGGER trg_ai_roadmaps_updated BEFORE UPDATE ON public.ai_roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
