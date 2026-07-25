
-- Profile FKs for PostgREST embeds (fixes chat/resources author joins)
ALTER TABLE public.messages ADD CONSTRAINT messages_user_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.resources ADD CONSTRAINT resources_user_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.room_members ADD CONSTRAINT room_members_user_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Room extras
ALTER TABLE public.rooms
  ADD COLUMN playlist_url text,
  ADD COLUMN playlist_kind text,
  ADD COLUMN break_ends_at timestamptz;

-- Todos
CREATE TABLE public.room_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  done_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_todos TO authenticated;
GRANT ALL ON public.room_todos TO service_role;
ALTER TABLE public.room_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos read" ON public.room_todos FOR SELECT USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "todos insert" ON public.room_todos FOR INSERT WITH CHECK (auth.uid()=user_id AND is_room_member(room_id, auth.uid()));
CREATE POLICY "todos update" ON public.room_todos FOR UPDATE USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "todos delete" ON public.room_todos FOR DELETE USING (auth.uid()=user_id OR is_room_owner(room_id, auth.uid()));
CREATE TRIGGER trg_room_todos_upd BEFORE UPDATE ON public.room_todos FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Polls
CREATE TABLE public.room_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_polls TO authenticated;
GRANT ALL ON public.room_polls TO service_role;
ALTER TABLE public.room_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls read" ON public.room_polls FOR SELECT USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "polls insert" ON public.room_polls FOR INSERT WITH CHECK (auth.uid()=user_id AND is_room_member(room_id, auth.uid()));
CREATE POLICY "polls update" ON public.room_polls FOR UPDATE USING (auth.uid()=user_id OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "polls delete" ON public.room_polls FOR DELETE USING (auth.uid()=user_id OR is_room_owner(room_id, auth.uid()));

CREATE TABLE public.room_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.room_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_idx int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_poll_votes TO authenticated;
GRANT ALL ON public.room_poll_votes TO service_role;
ALTER TABLE public.room_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes read" ON public.room_poll_votes FOR SELECT USING (EXISTS (SELECT 1 FROM public.room_polls p WHERE p.id=poll_id AND (is_room_member(p.room_id, auth.uid()) OR is_room_owner(p.room_id, auth.uid()))));
CREATE POLICY "votes insert" ON public.room_poll_votes FOR INSERT WITH CHECK (auth.uid()=user_id AND EXISTS (SELECT 1 FROM public.room_polls p WHERE p.id=poll_id AND is_room_member(p.room_id, auth.uid())));
CREATE POLICY "votes update" ON public.room_poll_votes FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "votes delete" ON public.room_poll_votes FOR DELETE USING (auth.uid()=user_id);

-- Goals
CREATE TABLE public.room_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target int NOT NULL DEFAULT 1,
  progress int NOT NULL DEFAULT 0,
  unit text,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_goals TO authenticated;
GRANT ALL ON public.room_goals TO service_role;
ALTER TABLE public.room_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals select" ON public.room_goals FOR SELECT USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "goals insert" ON public.room_goals FOR INSERT WITH CHECK (is_room_owner(room_id, auth.uid()) AND auth.uid()=user_id);
CREATE POLICY "goals update" ON public.room_goals FOR UPDATE USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "goals delete" ON public.room_goals FOR DELETE USING (is_room_owner(room_id, auth.uid()));
CREATE TRIGGER trg_room_goals_upd BEFORE UPDATE ON public.room_goals FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Milestone feed
CREATE TABLE public.room_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_events TO authenticated;
GRANT ALL ON public.room_events TO service_role;
ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read" ON public.room_events FOR SELECT USING (is_room_member(room_id, auth.uid()) OR is_room_owner(room_id, auth.uid()));
CREATE POLICY "events insert" ON public.room_events FOR INSERT WITH CHECK (auth.uid()=user_id AND is_room_member(room_id, auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_events;
