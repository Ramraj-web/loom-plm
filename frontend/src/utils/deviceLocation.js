// Device and Location detection utility for Loom PLM

/**
 * Detects device category (Laptop/Desktop vs Mobile vs Tablet), OS, and Browser.
 */
export function getDeviceInfo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceType: "Laptop / Desktop",
      os: "Unknown",
      browser: "Unknown",
      deviceSummary: "Desktop / Workstation",
      isMobile: false,
      isLaptop: true
    };
  }

  const ua = navigator.userAgent || "";
  const width = window.innerWidth || 1024;

  // Determine device type
  let isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  let isTablet = /iPad|Tablet/i.test(ua) || (isMobile && width >= 768);

  if (!isMobile && !isTablet && (width < 768 && "ontouchstart" in window)) {
    isMobile = true;
  }

  let deviceType = "Laptop / Desktop";
  if (isTablet) {
    deviceType = "Tablet";
  } else if (isMobile) {
    deviceType = "Mobile";
  }

  // Determine OS
  let os = "Unknown OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Determine Browser
  let browser = "Browser";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  const deviceSummary = `${deviceType} (${os} · ${browser})`;

  return {
    deviceType,
    os,
    browser,
    deviceSummary,
    isMobile: deviceType === "Mobile",
    isLaptop: deviceType === "Laptop / Desktop"
  };
}

/**
 * Fast offline lookup for Indian textile & manufacturing hubs based on GPS bounding boxes
 */
function lookupCityFromCoordinates(lat, lon) {
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (isNaN(nLat) || isNaN(nLon)) return null;

  // Tirupur / Avinashi / Palladam / Kangeyam / Uthukuli
  if (nLat >= 10.85 && nLat <= 11.45 && nLon >= 77.10 && nLon <= 77.65) {
    return "Tirupur, Tamil Nadu";
  }
  // Coimbatore / Sulur / Pollachi
  if (nLat >= 10.60 && nLat <= 11.20 && nLon >= 76.75 && nLon <= 77.15) {
    return "Coimbatore, Tamil Nadu";
  }
  // Erode / Perundurai / Bhavani
  if (nLat >= 11.15 && nLat <= 11.60 && nLon >= 77.50 && nLon <= 77.95) {
    return "Erode, Tamil Nadu";
  }
  // Salem / Sankari
  if (nLat >= 11.50 && nLat <= 11.85 && nLon >= 77.95 && nLon <= 78.35) {
    return "Salem, Tamil Nadu";
  }
  // Karur
  if (nLat >= 10.80 && nLat <= 11.15 && nLon >= 77.90 && nLon <= 78.30) {
    return "Karur, Tamil Nadu";
  }
  // Chennai & Kanchipuram / Tiruvallur
  if (nLat >= 12.75 && nLat <= 13.35 && nLon >= 79.90 && nLon <= 80.40) {
    return "Chennai, Tamil Nadu";
  }
  // Bengaluru
  if (nLat >= 12.75 && nLat <= 13.25 && nLon >= 77.35 && nLon <= 77.85) {
    return "Bengaluru, Karnataka";
  }
  // Madurai
  if (nLat >= 9.75 && nLat <= 10.15 && nLon >= 77.95 && nLon <= 78.30) {
    return "Madurai, Tamil Nadu";
  }
  // Surat, Gujarat
  if (nLat >= 21.05 && nLat <= 21.35 && nLon >= 72.70 && nLon <= 73.00) {
    return "Surat, Gujarat";
  }
  // Mumbai
  if (nLat >= 18.80 && nLat <= 19.35 && nLon >= 72.70 && nLon <= 73.10) {
    return "Mumbai, Maharashtra";
  }
  // Delhi / NCR
  if (nLat >= 28.35 && nLat <= 28.90 && nLon >= 76.85 && nLon <= 77.45) {
    return "Delhi / NCR";
  }

  return null;
}

/**
 * Reverse geocode latitude and longitude to a human-readable city and region
 */
async function reverseGeocode(lat, lon) {
  // 1. Instant precision match from coordinate lookup table
  const localMatch = lookupCityFromCoordinates(lat, lon);
  if (localMatch) return localMatch;

  // 2. Live reverse geocode from free client geocoding API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const districtAdmin = data.localityInfo?.administrative?.find(a => /district/i.test(a.name));
      const district = districtAdmin ? districtAdmin.name.replace(/ district/i, "") : null;
      const city = data.city || data.locality || district;
      const state = data.principalSubdivision;

      if (district && /tiruppur|tirupur/i.test(district)) {
        return "Tirupur, Tamil Nadu";
      }
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
    }
  } catch (e) {}

  return null;
}

/**
 * Cleans up legacy "Calcutta" entries that arose from the browser's default Asia/Calcutta IANA timezone identifier
 */
export function sanitizeLocationString(locStr) {
  if (!locStr || typeof locStr !== "string") return "Tirupur, Tamil Nadu";
  return locStr
    .replace(/Calcutta\s*\((11\.[0-9]+°,?\s*77\.[0-9]+°)\)/gi, "Tirupur, Tamil Nadu ($1)")
    .replace(/^Calcutta$/gi, "Tirupur, Tamil Nadu")
    .replace(/^Kolkata$/gi, "Tirupur, Tamil Nadu")
    .replace(/\bCalcutta\b/gi, "Tirupur, Tamil Nadu")
    .replace(/\bKolkata\b/gi, "Tirupur, Tamil Nadu");
}

/**
 * Detects approximate or GPS geolocation of the user.
 * 1. Checks GPS coordinates via navigator.geolocation.
 * 2. Reverse-geocodes coordinates to real city name (e.g. Tirupur, Tamil Nadu).
 * 3. Falls back to IP or regional location rather than raw timezone names.
 */
export async function getLocationInfo() {
  const timeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata";
  const isIndianTimezone = /Calcutta|Kolkata/i.test(timeZone);
  const defaultRegionFallback = isIndianTimezone ? "Tirupur, Tamil Nadu" : (timeZone.split("/")[1]?.replace(/_/g, " ") || timeZone);

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      location: defaultRegionFallback,
      coordinates: null,
      timeZone,
      source: "timezone"
    };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout")), 3000);
      navigator.geolocation.getCurrentPosition(
        pos => {
          clearTimeout(timer);
          resolve(pos);
        },
        err => {
          clearTimeout(timer);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
      );
    });

    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);

    // Resolve the real human-readable city from coordinates
    const resolvedCity = (await reverseGeocode(lat, lon)) || defaultRegionFallback;

    return {
      location: `${resolvedCity} (${lat}°, ${lon}°)`,
      cityName: resolvedCity,
      coordinates: { latitude: Number(lat), longitude: Number(lon) },
      timeZone,
      source: "gps"
    };
  } catch (e) {
    // Attempt IP-based location before falling back to default region
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const ipData = await res.json();
        const city = ipData.city || ipData.locality;
        const state = ipData.principalSubdivision;
        if (city && state) {
          return {
            location: `${city}, ${state}`,
            cityName: city,
            coordinates: ipData.latitude ? { latitude: ipData.latitude, longitude: ipData.longitude } : null,
            timeZone,
            source: "ip"
          };
        }
      }
    } catch (ipErr) {}

    return {
      location: defaultRegionFallback,
      coordinates: null,
      timeZone,
      source: "timezone"
    };
  }
}
