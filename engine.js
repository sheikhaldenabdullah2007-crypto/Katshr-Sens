(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KatshrEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /*
    منطق مشترك (المتصفح + api/analyze.js).
    شريط الحساسية في Free Fire الحالي (OB54/OB55، 2026) من 0 إلى 200؛
    ملاحظات Garena الرسمية تؤكد رفع الحد إلى 200 لكنها لا تعطي قيمًا موصى بها.
    القيم الأساسية مأخوذة من أدلة 2026 المنشورة (وهي متفاوتة) وهي نقاط بداية للتجربة فقط.
    تحذير: لا تخلط بها أرقام أدلة 0-100 القديمة ولا تضاعفها.
  */

  const MAX_SENSITIVITY = 200;
  const MAX_DEVIATION = 25;
  const FIRE_DEVIATION = 8; // أقصى انحراف مسموح لاقتراح الذكاء الاصطناعي عن القيمة الأساسية

  const SETTING_META = [
    { key: "general", label: "General", max: 200, unit: "", half: false },
    { key: "redDot", label: "Red Dot", max: 200, unit: "", half: false },
    { key: "scope2x", label: "2x Scope", max: 200, unit: "", half: false },
    { key: "scope4x", label: "4x Scope", max: 200, unit: "", half: false },
    { key: "sniper", label: "Sniper Scope", max: 200, unit: "", half: true },
    { key: "freeLook", label: "Free Look", max: 200, unit: "", half: true },
    { key: "fireButton", label: "Fire Button Size", max: 100, unit: "%", half: false, fire: true }
  ];

  const PROFILES = {
    balanced:  { general: 186, redDot: 175, scope2x: 155, scope4x: 135, sniper: 85, freeLook: 105, fireButton: 45 },
    rush:      { general: 192, redDot: 180, scope2x: 160, scope4x: 138, sniper: 85, freeLook: 110, fireButton: 45 },
    precision: { general: 176, redDot: 163, scope2x: 143, scope4x: 125, sniper: 75, freeLook: 95,  fireButton: 45 }
  };

  // فرق حسب فئة الجهاز (اقتصادي، متوسط، قوي، رائد): الأضعف يأخذ قيمًا أعلى لتعويض التأخر
  const TIER_SHIFT = [10, 0, -6, -12];
  const FIRE_SHIFT = [4, 0, -2, -4];

  const REFERENCES = [
    { title: "Garena — ملاحظات التحديثات الرسمية (تؤكد حد 200؛ بلا قيم موصى بها)", url: "https://ff.garena.com/en/news/20/" },
    { title: "AR-Pay — Free Fire OB54 0-200 sensitivity", url: "https://ar-pay.com/blog/en/news/free-fire-sensitivity-2026-0-200-scale-9th-anniversary/" },
    { title: "Takiff — Free Fire OB55 sensitivity tables by device tier", url: "https://takiff.online/blog/best-ff-sensitivity-for-ob55" },
    { title: "SensiAI Pro — 0-200 values by RAM", url: "https://sensiaipro.online/blog/brazil-sensitivity-free-fire-guide.html" },
    { title: "BitTopUp — Free Fire sensitivity (Aug 2026)", url: "https://bittopup.com/article/Free-Fire-Sensitivity-Settings-Guide-3040-Better-Aim" }
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

  // أدلة 2026 تتفق على الاتجاه (الجهاز الأضعف قيم أعلى) وتختلف في المقدار، لذلك التعديل متوسط ومعروض للمستخدم.
  function suggestSettings(device, style) {
    const base = baselineFor(style);
    const perf = devicePerformance(device);
    const cat = perf.category;

    const settings = SETTING_META.map((m) => {
      let shift = 0;
      if (cat !== null) shift = m.fire ? FIRE_SHIFT[cat] : Math.round(TIER_SHIFT[cat] * (m.half ? 0.5 : 1));
      return { key: m.key, label: m.label, max: m.max, unit: m.unit, value: clampInt(base[m.key] + shift, 0, m.max, base[m.key]) };
    });
    const adjustment = cat === null ? 0 : TIER_SHIFT[cat];
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

  /*
    وضع صارم: لا نخترع أي قيمة. إن نقصت قيمة أساسية، أو لم تُرفق مصادر صالحة، أو كان الترتيب
    غير منطقي (تقريب أعلى = حساسية أقل)، تُرفض النتيجة كلها ويعود الموقع للتقدير المحلي المعنوَن.
  */
  function sanitizeAiResult(raw, style, allowedUrls) {
    if (!raw || typeof raw !== "object") return null;

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
    const settings = [];
    for (const m of SETTING_META) {
      const n = Number(rs[m.key]);
      if (!Number.isFinite(n) || n < 0 || n > m.max) {
        if (m.fire) continue; // حجم الزر اختياري
        return null;
      }
      settings.push({ key: m.key, label: m.label, max: m.max, unit: m.unit, value: Math.round(n) });
    }
    const v = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    if (!(v.redDot >= v.scope2x && v.scope2x >= v.scope4x && v.scope4x >= v.sniper)) return null;

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
      if (sources.length >= 6) break;
    }
    if (sources.length < 2) return null; // بدون دليل لا نقبل أرقامًا

    const rg = raw.game && typeof raw.game === "object" ? raw.game : {};
    const changes = (Array.isArray(rg.changes) ? rg.changes : []).map((c) => cleanString(c, 200)).filter(Boolean).slice(0, 6);
    const game = {
      version: cleanString(rg.version, 40) || null,
      date: cleanString(rg.date, 40) || null,
      changes
    };

    const confidence = ["high", "medium", "low"].includes(raw.confidence) ? raw.confidence : "low";

    return {
      device, settings, dpi, game, confidence, sources,
      basis: cleanString(raw.basis, 700),
      summary: cleanString(raw.summary, 500)
    };
  }

  return {
    MAX_SENSITIVITY, SETTING_META, PROFILES, REFERENCES, CATEGORY_LABELS,
    normalizeText, searchDevices, parseRamMax, parseHz, chipTier, devicePerformance,
    baselineFor, suggestSettings, sanitizeAiResult, clampInt, safeUrl
  };
});
