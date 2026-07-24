import { ArrowLeft, User, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("users")
        .select("full_name, email, phone, avatar_url")
        .eq("id", uid)
        .single();
      if (data) {
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName || null, email: email || null })
      .eq("id", uid);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
        </header>

        <section className="mt-6 flex flex-col items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-primary/60 bg-primary/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tap to change photo</p>
        </section>

        <section className="mt-8 space-y-4">
          <Field label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-[14px] border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[14px] border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={phone}
              readOnly
              className="w-full rounded-[14px] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Phone number cannot be changed.</p>
          </Field>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 w-full rounded-[14px] bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
