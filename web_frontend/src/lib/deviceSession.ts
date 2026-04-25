const DEVICE_KEY = "dw_device_id";

/** Stable per-browser id (survives refresh, not cross-device). */
export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

export function getBrowserUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

/** Short label e.g. "Chrome on Windows", "Safari on macOS". */
export function getDeviceLabel(userAgent: string): string {
  if (!userAgent) return "Unknown device";

  let browser = "Browser";
  if (/Edg\//.test(userAgent)) browser = "Edge";
  else if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) browser = "Chrome";
  else if (/Firefox\//.test(userAgent)) browser = "Firefox";
  else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) browser = "Safari";
  else if (/OPR\//.test(userAgent) || /Opera/.test(userAgent)) browser = "Opera";

  let os = "Unknown OS";
  if (/Windows NT/.test(userAgent)) os = "Windows";
  else if (/Mac OS X/.test(userAgent)) os = "macOS";
  else if (/Linux/.test(userAgent) && !/Android/.test(userAgent)) os = "Linux";
  else if (/Android/.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";

  return `${browser} on ${os}`;
}

export function isMobileUserAgent(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}
