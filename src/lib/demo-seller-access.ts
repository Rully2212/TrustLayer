export const DEMO_SELLER_STORAGE_KEY = "trustlayer_demo_seller";

export function hasDemoSellerAccess() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(DEMO_SELLER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function grantDemoSellerAccess() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEMO_SELLER_STORAGE_KEY, "true");
  } catch {
    window.alert("Demo seller access is available, but local storage is blocked in this browser.");
  }
}

export function clearDemoSellerAccess() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DEMO_SELLER_STORAGE_KEY);
  } catch {
    // Frontend-only demo access should fail closed if storage is unavailable.
  }
}

export function sellerAccessUrl(redirect: string) {
  return `/seller-access?redirect=${encodeURIComponent(redirect)}`;
}

export function resolveSellerRedirect(redirect?: string) {
  if (!redirect) return "/dashboard";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/dashboard";
  if (redirect.startsWith("/seller-access")) return "/dashboard";

  return redirect;
}
