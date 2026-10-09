export type DeviceType = "desktop" | "tablet" | "mobile";

/** Best-effort browser classification. It is a UX gate, not proof of device identity. */
export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return "desktop";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIPad =
    /iPad/i.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isTabletUA =
    /Tablet|PlayBook|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua));
  if (isIPad || isTabletUA) return "tablet";
  if (/Android.*Mobile|iPhone|iPod|Windows Phone|Mobile/i.test(ua))
    return "mobile";
  if (
    window.matchMedia("(pointer: coarse)").matches &&
    window.innerWidth < 900
  ) {
    return window.innerWidth < 600 ? "mobile" : "tablet";
  }
  return "desktop";
}
