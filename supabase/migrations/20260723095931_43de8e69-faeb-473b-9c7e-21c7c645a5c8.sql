
-- AI feature tables
CREATE TABLE public.ai_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exam text NOT NULL,
  target_date date,
  subjects text[] NOT NULL DEFAULT '{}',
  weak_topics text[] NOT NULL DEFAULT '{}',
  strong_topics text[] NOT NULL DEFAULT '{}',
  hours_per_day int NOT NULL DEFAULT 2,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_roadmaps TO authenticated;
GRANT ALL ON public.ai_roadmaps TO service_role;
ALTER TABLE public.ai_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roadmaps" ON public.ai_roadmaps FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_roadmaps_updated BEFORE UPDATE ON public.ai_roadmaps FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.ai_roadmap_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES public.ai_roadmaps ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  subject text,
  minutes int NOT NULL DEFAULT 30,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_roadmap_tasks TO authenticated;
GRANT ALL ON public.ai_roadmap_tasks TO service_role;
ALTER TABLE public.ai_roadmap_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.ai_roadmap_tasks FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX ai_tasks_user_day ON public.ai_roadmap_tasks(user_id, day);

CREATE TABLE public.ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chats TO authenticated;
GRANT ALL ON public.ai_chats TO service_role;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chats" ON public.ai_chats FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_chats_updated BEFORE UPDATE ON public.ai_chats FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.ai_chats ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.ai_messages FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX ai_messages_chat ON public.ai_messages(chat_id, created_at);

CREATE TABLE public.ai_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  topic text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  ease real NOT NULL DEFAULT 2.5,
  interval_days int NOT NULL DEFAULT 1,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  last_score int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_flashcards TO authenticated;
GRANT ALL ON public.ai_flashcards TO service_role;
ALTER TABLE public.ai_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own flashcards" ON public.ai_flashcards FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.ai_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  battle_id uuid,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  questions jsonb NOT NULL,
  answers jsonb,
  score int,
  duration_sec int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_quizzes TO authenticated;
GRANT ALL ON public.ai_quizzes TO service_role;
ALTER TABLE public.ai_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quizzes" ON public.ai_quizzes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "battle quizzes readable" ON public.ai_quizzes FOR SELECT USING (battle_id IS NOT NULL);

CREATE TABLE public.ai_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  questions jsonb NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_battles TO authenticated;
GRANT ALL ON public.ai_battles TO service_role;
ALTER TABLE public.ai_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battles readable" ON public.ai_battles FOR SELECT USING (true);
CREATE POLICY "host manages battle" ON public.ai_battles FOR ALL USING (auth.uid()=host_id) WITH CHECK (auth.uid()=host_id);

CREATE TABLE public.ai_battle_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.ai_battles ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  accuracy real NOT NULL DEFAULT 0,
  duration_sec int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_battle_scores TO authenticated;
GRANT ALL ON public.ai_battle_scores TO service_role;
ALTER TABLE public.ai_battle_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores readable" ON public.ai_battle_scores FOR SELECT USING (true);
CREATE POLICY "own score writes" ON public.ai_battle_scores FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own score update" ON public.ai_battle_scores FOR UPDATE USING (auth.uid()=user_id);

CREATE TABLE public.ai_career_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  goal text NOT NULL,
  milestones jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_career_roadmaps TO authenticated;
GRANT ALL ON public.ai_career_roadmaps TO service_role;
ALTER TABLE public.ai_career_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own career" ON public.ai_career_roadmaps FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_cache TO authenticated;
GRANT ALL ON public.ai_cache TO service_role;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cache readable" ON public.ai_cache FOR SELECT USING (true);
CREATE POLICY "cache writable" ON public.ai_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
