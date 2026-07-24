
CREATE TABLE public.subject_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  mastery numeric(5,2) NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  chapters_done integer NOT NULL DEFAULT 0,
  revision_score numeric(5,2) NOT NULL DEFAULT 0,
  difficulty_bonus numeric(5,2) NOT NULL DEFAULT 0,
  quizzes_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_mastery TO authenticated;
GRANT ALL ON public.subject_mastery TO service_role;
ALTER TABLE public.subject_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all subject_mastery" ON public.subject_mastery FOR SELECT TO authenticated USING (true);
CREATE POLICY "own subject_mastery write" ON public.subject_mastery FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subject_mastery update" ON public.subject_mastery FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subject_mastery delete" ON public.subject_mastery FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  mastery numeric(5,2) NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_mastery TO authenticated;
GRANT ALL ON public.topic_mastery TO service_role;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all topic_mastery" ON public.topic_mastery FOR SELECT TO authenticated USING (true);
CREATE POLICY "own topic_mastery write" ON public.topic_mastery FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own topic_mastery update" ON public.topic_mastery FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own topic_mastery delete" ON public.topic_mastery FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  target integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 100,
  reward_coins integer NOT NULL DEFAULT 40,
  reward_badge_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_challenges TO authenticated;
GRANT ALL ON public.weekly_challenges TO service_role;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weekly_challenges" ON public.weekly_challenges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tg_subject_mastery_updated BEFORE UPDATE ON public.subject_mastery FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER tg_topic_mastery_updated BEFORE UPDATE ON public.topic_mastery FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER tg_weekly_challenges_updated BEFORE UPDATE ON public.weekly_challenges FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

INSERT INTO public.badges (id, name, description, icon) VALUES
  ('dsa_expert', 'DSA Expert', 'Reach 85% mastery in Data Structures & Algorithms', '🧠'),
  ('calculus_master', 'Calculus Master', 'Reach 85% mastery in Calculus', '∫'),
  ('physics_pro', 'Physics Pro', 'Reach 85% mastery in Physics', '⚛️'),
  ('chemistry_champ', 'Chemistry Champ', 'Reach 85% mastery in Chemistry', '🧪'),
  ('biology_boss', 'Biology Boss', 'Reach 85% mastery in Biology', '🧬'),
  ('consistency_champion', 'Consistency Champion', 'Maintain a 14+ day streak', '🔥'),
  ('accuracy_ace', 'Accuracy Ace', 'Reach 90% quiz accuracy across 10+ quizzes', '🎯'),
  ('most_improved', 'Most Improved', 'Improve any subject mastery by 15%+ in a week', '📈')
ON CONFLICT (id) DO NOTHING;
