(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KatshrEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /*
    منطق مشترك (المتصفح + api/analyze.js).
    مهم: شريط الحساسية داخل Free Fire أقصاه 100 وليس 200.
    القيم الأساسية مأخوذة من نطاقات منشورة (Sportskeeda, AFK Gaming, esports.net)
    وهي نقاط بداية للتجربة وليست إعدادات رسمية من Garena.
  */

  const MAX_SENSITIVITY = 100;
  const MAX_DEVIATION = 15; // أقصى انحراف مسموح لاقتراح الذكاء الاصطناعي عن القيمة الأساسية

  const SETTING_META = [
    { key: "general", label: "General" },
    { key: "redDot", label: "Red Dot" },
    { key: "scope2x", label: "2x Scope" },
    { key: "scope4x", label: "4x Scope" },
    { key: "sniper", label: "Sniper Scope" },
    { key: "freeLook", label: "Free Look" }
  ];

  const PROFILES = {
    balanced:  { general: 97,  redDot: 92, scope2x: 82, scope4x: 65, sniper: 48, freeLook: 78 },
    rush:      { general: 100, redDot: 96, scope2x: 88, scope4x: 72, sniper: 52, freeLook: 82 },
    precision: { general: 92,  redDot: 87, scope2x: 76, scope4x: 60, sniper: 42, freeLook: 70 }
  };

  const REFERENCES = [
    { title: "Sportskeeda — Best Free Fire MAX sensitivity settings", url: "https://sportskeeda.com/free-fire/best-free-fire-max-sensitivity-settings" },
    { title: "AFK Gaming — Free Fire MAX best settings", url: "https://afkgaming.com/mobileesports/guide/free-fire-max-best-settings-for-more-accuracy-and-aiming" },
    { title: "esports.net — Best sensitivity for Free Fire", url: "https://www.esports.net/news/mobile-games/best-sensitivity-for-free-fire" }
  ];

  const CATEGORY_LABELS = ["اقتصادي", "متوسط", "قوي", "رائد"];

  /* ---------- نصوص وبحث ---------- */

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
      .trim();
  }

  const RAW_ALIASES = {
    "سامسونج": "samsung", "سامسونغ": "samsung", "جالكسي": "galaxy", "جالاكسي": "galaxy", "غالكسي": "galaxy",
    "ايفون": "iphone", "آيفون": "iphone", "ابل": "apple", "أبل": "apple",
    "شاومي": "xiaomi", "ريدمي": "redmi", "بوكو": "poco", "هواوي": "huawei", "هونر": "honor",
    "اوبو": "oppo", "فيفو": "vivo", "ريلمي": "realme", "انفينكس": "infinix", "انفينيكس": "infinix",
    "تكنو": "tecno", "ونبلس": "oneplus", "موتورولا": "motorola", "جوجل": "google", "بيكسل": "pixel",
    "سوني": "sony", "اسوس": "asus", "ناثينج": "nothing",
    "نوت": "note", "برو": "pro", "ماكس": "max", "الترا": "ultra", "بلس": "plus", "لايت": "lite"
  };
  const ALIASES = {};
  for (const [k, v] of Object.entries(RAW_ALIASES)) ALIASES[normalizeText(k)] = v;

  function queryTokens(query) {
    return normalizeText(query)
      .split(" ")
      .filter(Boolean)
      .map((t) => ALIASES[t] || t);
  }

  function searchDevices(catalog, query, limit) {
    const tokens = queryTokens(query);
    if (!tokens.length) return [];
    const found = [];
    for (const [brand, list] of Object.entries(catalog)) {
      for (const entry of list) {
        const hay = normalizeText(brand + " " + entry[0]);
        if (tokens.every((t) => hay.includes(t))) found.push({ brand, entry });
        if (found.length >= (limit || 10)) return found;
      }
    }
    return found;
  }

  /* ---------- مواصفات ---------- */

  function parseRamMax(text) {
    const nums = String(text == null ? "" : text).match(/\d+(?:\.\d+)?/g);
    if (!nums || !/gb/i.test(String(text))) return null;
    return Math.max(...nums.map(Number));
  }

  function parseHz(text) {
    const m = String(text == null ? "" : text).match(/(\d{2,3})\s*hz/i);
    return m ? Number(m[1]) : null;
  }

  const TIER_RULES = [
    [3, /snapdragon 8|dimensity 9|apple a1[6-9]|exynos 2\d{3}|tensor g[3-9]/],
    [2, /snapdragon 7|dimensity 8|dimensity 7[23]\d\d|apple a1[3-5]|tensor|exynos (1280|1380|1480)|kirin 9/],
    [1, /snapdragon 695|snapdragon 6|dimensity [67]|exynos 13|helio g(9\d|100)/],
    [0, /snapdragon 4|snapdragon 6[0-8]\d|helio|unisoc|kirin 7|exynos 8|exynos 9/]
  ];

  function tierOfVariant(variant) {
    const p = normalizeText(variant);
    for (const [tier, re] of TIER_RULES) if (re.test(p)) return tier;
    return null;
  }

  // عند وجود أكثر من معالج ("A / B") نأخذ الأضعف احتياطًا.
  function chipTier(processor) {
    if (!processor) return null;
    const tiers = String(processor).split("/").map(tierOfVariant).filter((t) => t !== null);
    return tiers.length ? Math.min(...tiers) : null;
  }

  function devicePerformance(device) {
    const tier = chipTier(device.processor);
    const ram = parseRamMax(device.ram);
    const hz = parseHz(device.refresh);
    if (tier === null) return { category: null, label: "غير معروف", ram, hz };
    let cat = tier;
    if (ram !== null && ram <= 3) cat -= 1;
    cat = Math.max(0, Math.min(3, cat));
    return { category: cat, label: CATEGORY_LABELS[cat], ram, hz };
  }

  /* ---------- الحساسية ---------- */

  function clampInt(v, lo, hi, fallback) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, n));
  }

  function baselineFor(style) {
    return { ...(PROFILES[style] || PROFILES.balanced) };
  }

  // المصادر متضاربة حول أثر قوة الجهاز، لذلك التعديل صغير (±2) ويُعرض للمستخدم.
  function suggestSettings(device, style) {
    const base = baselineFor(style);
    const perf = devicePerformance(device);
    let adjustment = 0;
    if (perf.category === 0) adjustment = -2;
    else if (perf.category === 3 && perf.hz !== null && perf.hz >= 90) adjustment = 2;

    const settings = SETTING_META.map((m) => ({
      key: m.key,
      label: m.label,
      value: clampInt(base[m.key] + adjustment, 0, MAX_SENSITIVITY, base[m.key])
    }));
    return { settings, adjustment, performance: perf };
  }

  /* ---------- التحقق من ناتج الذكاء الاصطناعي ---------- */

  function cleanString(v, max) {
    return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
  }

  function safeUrl(u, allowed) {
    try {
      const url = new URL(String(u));
      if (url.protocol !== "https:") return null;
      const host = url.hostname;
      if (host === "localhost" || /^[\d.]+$/.test(host) || host.includes(":")) return null;
      if (allowed && !allowed.has(url.href)) return null;
      return url.href;
    } catch (e) {
      return null;
    }
  }

  function sanitizeAiResult(raw, style, allowedUrls) {
    if (!raw || typeof raw !== "object") return null;
    const base = baselineFor(style);

    const rd = raw.device && typeof raw.device === "object" ? raw.device : {};
    const ram = Number(rd.ram_gb);
    const hz = Number(rd.refresh_hz);
    const platform = rd.platform === "ios" ? "ios" : "android";
    const device = {
      name: cleanString(rd.name, 80),
      processor: cleanString(rd.processor, 80) || null,
      ramGb: Number.isFinite(ram) && ram >= 0.5 && ram <= 64 ? ram : null,
      refreshHz: Number.isFinite(hz) && hz >= 30 && hz <= 240 ? Math.round(hz) : null,
      platform
    };

    const rs = raw.sensitivity && typeof raw.sensitivity === "object" ? raw.sensitivity : {};
    const settings = SETTING_META.map((m) => {
      const lo = Math.max(0, base[m.key] - MAX_DEVIATION);
      const hi = Math.min(MAX_SENSITIVITY, base[m.key] + MAX_DEVIATION);
      return { key: m.key, label: m.label, value: clampInt(rs[m.key], lo, hi, base[m.key]) };
    });

    const rdpi = raw.dpi && typeof raw.dpi === "object" ? raw.dpi : {};
    const dpiValue = Number(rdpi.value);
    const dpi = {
      applicable: platform !== "ios" && rdpi.applicable !== false,
      value: Number.isFinite(dpiValue) && dpiValue >= 120 && dpiValue <= 640 ? Math.round(dpiValue) : null,
      note: cleanString(rdpi.note, 240)
    };

    const sources = [];
    for (const s of Array.isArray(raw.sources) ? raw.sources : []) {
      const href = safeUrl(s && s.url, allowedUrls);
      if (href && !sources.some((x) => x.url === href)) {
        sources.push({ title: cleanString(s.title, 100) || new URL(href).hostname, url: href });
      }
      if (sources.length >= 5) break;
    }

    return { device, settings, dpi, summary: cleanString(raw.summary, 500), sources };
  }

  return {
    MAX_SENSITIVITY, SETTING_META, PROFILES, REFERENCES, CATEGORY_LABELS,
    normalizeText, searchDevices, parseRamMax, parseHz, chipTier, devicePerformance,
    baselineFor, suggestSettings, sanitizeAiResult, clampInt, safeUrl
  };
});
