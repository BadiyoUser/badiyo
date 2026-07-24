
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rating integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS review_text text;

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
