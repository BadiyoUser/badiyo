// Biometric-auth wrapper around @aparajita/capacitor-biometric-auth.
// Gracefully no-ops on the web preview (where no hardware is available).

export type BiometricStatus = "available" | "unavailable";

async function biom() {
  try {
    const mod = await import("@aparajita/capacitor-biometric-auth");
    return mod;
  } catch {
    return null;
  }
}

export async function checkBiometric(): Promise<BiometricStatus> {
  const mod = await biom();
  if (!mod) return "unavailable";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = await (mod as any).BiometricAuth.checkBiometry();
    return info?.isAvailable ? "available" : "unavailable";
  } catch {
    return "unavailable";
  }
}

/** Prompts the OS biometric dialog. Resolves true on success. */
export async function authenticateBiometric(reason = "Unlock badiyo"): Promise<boolean> {
  const mod = await biom();
  if (!mod) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (mod as any).BiometricAuth.authenticate({
      reason,
      cancelTitle: "Use PIN instead",
      allowDeviceCredential: false,
      iosFallbackTitle: "Use PIN",
      androidTitle: "Unlock badiyo",
      androidSubtitle: "Use your fingerprint or face",
      androidConfirmationRequired: false,
    });
    return true;
  } catch {
    return false;
  }
}
