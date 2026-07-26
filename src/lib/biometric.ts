// Biometric-auth wrapper around @aparajita/capacitor-biometric-auth.
// Gracefully no-ops on the web preview (where no hardware is available).

export type BiometricStatus = "available" | "unavailable";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timer);
        resolve(null);
      });
  });
}

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
    const info = await withTimeout<{ isAvailable?: boolean }>(
      (mod as any).BiometricAuth.checkBiometry(),
      5000,
    );
    return info?.isAvailable ? "available" : "unavailable";
  } catch {
    return "unavailable";
  }
}

/** Prompts the OS biometric dialog. Resolves true on success. */
export async function authenticateBiometric(
  reason = "Unlock badiyo",
  timeoutMs = 8000,
): Promise<boolean> {
  const mod = await biom();
  if (!mod) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await withTimeout((mod as any).BiometricAuth.authenticate({
      reason,
      cancelTitle: "Use PIN instead",
      allowDeviceCredential: false,
      iosFallbackTitle: "Use PIN",
      androidTitle: "Unlock badiyo",
      androidSubtitle: "Use your fingerprint or face",
      androidConfirmationRequired: false,
    }), timeoutMs);
    return result !== null;
  } catch {
    return false;
  }
}
