
CREATE POLICY "Referred users can view own referral record"
  ON public.referral_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);
