"use strict";

(() => {
  const Engine = window.KatshrEngine;
  const CATALOG = window.DEVICE_CATALOG;
  const API_ENDPOINT = window.KATSHR_API || "/api/analyze";
  const AI_TIMEOUT_MS = 125000;

  if (!Engine || !CATALOG) {
    console.error("Katshr: engine.js أو catalog.js لم يُحمّلا.");
    return;
  }

  const $ = (id) => document.getElementById(id);
  const brandSelect = $("brandSelect");
  const modelSelect = $("modelSelect");
  const modelSearch = $("modelSearch");
  const searchResults = $("searchResults");
  const modelHint = $("modelHint");
  const generateBtn = $("generateBtn");
  const analysisModal = $("analysisModal");
  const resultModal = $("resultModal");
  const toast = $("toast");
  const modeBadge = $("modeBadge");

  const state = {
    device: null,       // { brand, name, year, processor, ram, refresh, platform, custom }
    aiAvailable: false,
    runId: 0,           // يُلغي أي تحليل قديم عند الإغلاق أو بدء تحليل جديد
    controller: null,
    toastTimer: null,
    lastFocus: null,
    lastView: null
  };

  /* ---------------- الأجهزة ---------------- */

  function entryToDevice(brand, entry) {
    return {
      brand,
      name: entry[0],
      year: entry[1],
      processor: entry[2],
      ram: entry[3],
      refresh: entry[4],
      platform: brand === "Apple" ? "ios" : "android",
      custom: false
    };
  }

  function setOptions(select, items, placeholder) {
    select.replaceChildren();
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);
    for (const item of items) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    }
  }

  function populateModels(brand) {
    const models = CATALOG[brand];
    if (!brand || !models) {
      modelSelect.disabled = true;
      setOptions(modelSelect, [], "اختر الشركة أولًا");
      modelHint.textContent = "اختر الشركة لعرض الموديلات المتاحة.";
      return;
    }
    setOptions(
      modelSelect,
      models.map((m, i) => ({ value: String(i), label: m[0] })),
      "اختر موديل هاتفك"
    );
    modelSelect.disabled = false;
    modelHint.textContent = `${models.length} موديلات في القائمة المحلية لشركة ${brand}. القائمة مختصرة وليست شاملة؛ إن لم تجد هاتفك ابحث عنه بالاسم.`;
  }

  function initBrands() {
    const brands = Object.keys(CATALOG).sort((a, b) => a.localeCompare(b));
    setOptions(brandSelect, brands.map((b) => ({ value: b, label: b })), "اختر شركة هاتفك");
  }

  function selectDevice(device) {
    state.device = device;
    generateBtn.disabled = !device;
  }

  function chooseCatalogDevice(brand, index) {
    const entry = CATALOG[brand] && CATALOG[brand][index];
    if (!entry) return;
    selectDevice(entryToDevice(brand, entry));
    if (brandSelect.value !== brand) brandSelect.value = brand;
    if (modelSelect.dataset.brand !== brand) populateModels(brand);
    modelSelect.dataset.brand = brand;
    modelSelect.value = String(index);
    modelSearch.value = `${brand} ${entry[0]}`;
    searchResults.classList.add("hidden");
    modelHint.textContent = `تم اختيار ${brand} ${entry[0]}.`;
  }

  function chooseCustomDevice(name) {
    selectDevice({
      brand: "", name, year: null, processor: null, ram: null, refresh: null,
      platform: /iphone|ايفون|آيفون|apple|ابل|أبل/i.test(name) ? "ios" : "android",
      custom: true
    });
    brandSelect.value = "";
    modelSelect.dataset.brand = "";
    populateModels("");
    modelSearch.value = name;
    searchResults.classList.add("hidden");
    modelHint.textContent = state.aiAvailable
      ? `الموديل «${name}» خارج القائمة المحلية؛ سيبحث الذكاء الاصطناعي عن مواصفاته.`
      : `الموديل «${name}» خارج القائمة المحلية ولا يوجد بحث مباشر، لذلك ستُعرض إعدادات عامة بدون مواصفات.`;
  }

  function renderSearchResults(query) {
    searchResults.replaceChildren();
    const q = query.trim();
    if (!q) {
      searchResults.classList.add("hidden");
      return;
    }

    const matches = Engine.searchDevices(CATALOG, q, 8);
    for (const m of matches) {
      const index = CATALOG[m.brand].indexOf(m.entry);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      const name = document.createElement("span");
      name.textContent = `${m.brand} ${m.entry[0]}`;
      const detail = document.createElement("small");
      detail.textContent = `${m.entry[1]} · ${m.entry[2] || "المعالج يختلف حسب النسخة"}`;
      button.append(name, detail);
      button.addEventListener("click", () => chooseCatalogDevice(m.brand, index));
      searchResults.appendChild(button);
    }

    if (q.length >= 2) {
      const custom = document.createElement("button");
      custom.type = "button";
      custom.className = "search-result action";
      const label = document.createElement("span");
      label.textContent = state.aiAvailable
        ? `ابحث عن «${q}» بالذكاء الاصطناعي`
        : `استخدم إعدادات عامة لـ «${q}»`;
      const hint = document.createElement("small");
      hint.textContent = state.aiAvailable
        ? "للهواتف غير الموجودة في القائمة"
        : "بدون مواصفات (لا يوجد بحث مباشر)";
      custom.append(label, hint);
      custom.addEventListener("click", () => chooseCustomDevice(q.slice(0, 60)));
      searchResults.appendChild(custom);
    }

    searchResults.classList.remove("hidden");
  }

  /* ---------------- أسلوب اللعب ---------------- */

  function selectedStyle() {
    const checked = document.querySelector('input[name="gameStyle"]:checked');
    return checked ? checked.value : "balanced";
  }

  function updateStyleCards() {
    document.querySelectorAll(".style-option").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("selected", Boolean(input && input.checked));
    });
  }

  /* ---------------- DPI (كثافة شاشة أندرويد فقط) ---------------- */

  function browserDpiEstimate() {
    // تقدير من المتصفح، ويصح فقط إذا كان المستخدم يتصفح من هاتفه.
    const isPhone =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches &&
      Math.min(screen.width, screen.height) <= 900 && window.devicePixelRatio >= 1.5;
    return isPhone ? Math.round(window.devicePixelRatio * 160) : null;
  }

  function buildDpi(device, aiDpi) {
    if (device.platform === "ios" || (aiDpi && aiDpi.applicable === false)) {
      return { value: "—", label: "DPI", note: "لا ينطبق على iPhone: iOS لا يسمح بتغيير كثافة الشاشة. اعتمد على حساسية اللعبة فقط." };
    }
    const general =
      "DPI هنا هو كثافة شاشة أندرويد (Smallest width في خيارات المطوّر) وليس حساسية. القيمة الافتراضية غالبًا هي الأفضل، وتغييرها يغيّر حجم الواجهة بالكامل وقد يسبب مشاكل.";
    if (aiDpi && aiDpi.value) {
      return { value: String(aiDpi.value), label: "DPI المذكور في المصادر", note: (aiDpi.note || "") + " " + general };
    }
    const est = browserDpiEstimate();
    if (est) {
      return { value: String(est), label: "DPI شاشتك الحالية (تقدير)", note: "تقدير من المتصفح، ويصح فقط إن كنت تتصفح من نفس الهاتف. " + general };
    }
    return { value: "—", label: "DPI (كثافة الشاشة)", note: (aiDpi && aiDpi.note ? aiDpi.note + " " : "") + general };
  }

  /* ---------------- بناء نتيجة العرض ---------------- */

  function specText(value, suffix) {
    return value === null || value === undefined || value === "" ? "غير محدد" : suffix ? `${value} ${suffix}` : String(value);
  }

  function localView(device, style, reason) {
    const r = Engine.suggestSettings(device, style);
    const known = device.processor || device.ram || device.refresh;
    let status =
      "المواصفات من قائمة محلية مختصرة وليست متحققة آنيًا. قيم الحساسية (مقياس 0–200 الحالي) مبنية على أدلة 2026 المنشورة، وهي متفاوتة فيما بينها، مع تعديل حسب فئة الجهاز. لم يُجرَ بحث مباشر. ملاحظات Garena الرسمية تؤكد حد 200 فقط ولا توصي بقيم.";
    if (reason) status = reason + " " + status;
    if (!known) status += " لا توجد مواصفات لهذا الموديل، فالقيم عامة.";
    if (r.adjustment !== 0) {
      status += ` فئة الجهاز المقدّرة: ${r.performance.label}؛ عُدّلت القيم الرئيسية بمقدار ${r.adjustment > 0 ? "+" : ""}${r.adjustment} (الجهاز الأضعف يأخذ قيمًا أعلى لتعويض التأخر).`;
    }
    return {
      mode: "local",
      game: null,
      title: device.brand ? `${device.brand} ${device.name}` : device.name,
      specs: { processor: specText(device.processor), ram: specText(device.ram), refresh: specText(device.refresh) },
      settings: r.settings,
      dpi: buildDpi(device, null),
      summary: "",
      notice: "أرقام تجريبية مولّدة بقواعد محلية، وليست بيانات جُمعت من الإنترنت ولا إعدادات مختبرة على هذا الهاتف.",
      status,
      sources: Engine.REFERENCES,
      sourcesTitle: "مراجع القيم الأساسية"
    };
  }

  function aiView(device, ai) {
    const d = ai.device;
    const conf = { high: "عالية", medium: "متوسطة", low: "منخفضة" }[ai.confidence];
    return {
      mode: "ai",
      title: d.name || (device.brand ? `${device.brand} ${device.name}` : device.name),
      specs: {
        processor: specText(d.processor || device.processor),
        ram: d.ramGb !== null ? `${d.ramGb} GB` : specText(device.ram),
        refresh: d.refreshHz !== null ? `${d.refreshHz} Hz` : specText(device.refresh)
      },
      settings: ai.settings,
      dpi: buildDpi({ ...device, platform: d.platform }, ai.dpi),
      game: ai.game,
      summary: [ai.basis, ai.summary].filter(Boolean).join(" "),
      notice: `الأرقام مشتقة من أدلة وجدها البحث لهذه النسخة (درجة الثقة: ${conf}). هي نقطة بداية للتجربة وليست إعدادات رسمية من Garena.`,
      status: "المصادر التالية هي ما استند إليه البحث؛ افتحها وتحقق منها قبل الاعتماد على الأرقام.",
      sources: ai.sources,
      sourcesTitle: ""
    };
  }

  /* ---------------- النوافذ ---------------- */

  function openModal(modal, returnTo) {
    state.lastFocus = returnTo || document.activeElement;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const focusable = modal.querySelector(".icon-button");
    if (focusable) focusable.focus();
  }

  function closeModal(type) {
    const modal = type === "analysis" ? analysisModal : resultModal;
    if (type === "analysis") cancelRun(); // أغلقت التحليل = ألغِ الطلب فعلًا
    modal.classList.add("hidden");
    if (analysisModal.classList.contains("hidden") && resultModal.classList.contains("hidden")) {
      document.body.style.overflow = "";
    }
    if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
  }

  function cancelRun() {
    state.runId++;
    if (state.controller) state.controller.abort();
    state.controller = null;
  }

  function trapTab(event, modal) {
    const items = [...modal.querySelectorAll("button, a[href], input, select")].filter((el) => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function setStep(id, status) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("active", "done");
    if (status) el.classList.add(status);
  }

  /* ---------------- الذكاء الاصطناعي ---------------- */

  async function fetchJson(url, options, timeoutMs) {
    const controller = options.controller || new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(timer);
    }
  }

  async function checkAi() {
    try {
      const { ok, data } = await fetchJson(API_ENDPOINT, { method: "GET" }, 5000);
      state.aiAvailable = Boolean(ok && data && data.ai === true);
    } catch (e) {
      state.aiAvailable = false;
    }
    modeBadge.classList.toggle("ai", state.aiAvailable);
    modeBadge.textContent = state.aiAvailable
      ? "الذكاء الاصطناعي مفعّل: يبحث عن مواصفات هاتفك في الإنترنت قبل التوصية، ويُرسَل اسم الموديل فقط إلى السيرفر."
      : "الوضع المحلي: تقدير مبني على نطاقات منشورة بدون بحث مباشر. اربط الذكاء الاصطناعي (انظر README) لتفعيل البحث.";
  }

  function aiErrorMessage(status, code) {
    if (code === "rate_limited" || status === 429) return "تجاوزت عدد الطلبات المسموح مؤقتًا.";
    if (code === "timeout" || status === 504) return "انتهت مهلة البحث.";
    if (code === "bad_device") return "اسم الموديل غير صالح للبحث.";
    if (code === "insufficient_evidence") return "لم يجد البحث أدلة كافية وموثوقة لهذا الجهاز على النسخة الحالية، فلم تُعرض أرقام مخمّنة.";
    return "تعذّر الاتصال بخدمة الذكاء الاصطناعي.";
  }

  async function runAi(device, style, runId) {
    const controller = new AbortController();
    state.controller = controller;
    const { ok, status, data } = await fetchJson(
      API_ENDPOINT,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brand: device.brand, name: device.name, style }),
        controller
      },
      AI_TIMEOUT_MS
    );
    if (runId !== state.runId) return { cancelled: true };
    if (!ok || !data || !data.ok) return { error: aiErrorMessage(status, data && data.error) };
    const clean = Engine.sanitizeAiResult(data.result, style);
    if (!clean) return { error: "رجع الذكاء الاصطناعي ناتجًا غير صالح." };
    return { ai: clean };
  }

  async function generate() {
    const device = state.device;
    if (!device) {
      showToast("اختر هاتفك أولًا.");
      return;
    }
    const style = selectedStyle();

    if (!state.aiAvailable) {
      showView(localView(device, style, ""));
      return;
    }

    const runId = ++state.runId;
    $("analysisTitle").textContent = "جاري البحث والتحليل";
    $("analysisSubtitle").textContent = "يبحث عن آخر تحديث للعبة ثم عن جهازك ثم عن إعدادات هذه النسخة، وقد يستغرق دقيقة أو دقيقتين.";
    $("analysisDisclaimer").textContent =
      "يُرسَل اسم الموديل وأسلوب اللعب فقط. لا تُعرض أرقام إلا إذا وُجدت لها مصادر، وإلا ستظهر رسالة صريحة.";
    ["stepDevice", "stepSpecs", "stepSettings"].forEach((id) => setStep(id, ""));
    setStep("stepDevice", "active");
    openModal(analysisModal, generateBtn);

    let outcome;
    try {
      outcome = await runAi(device, style, runId);
    } catch (e) {
      outcome = runId !== state.runId ? { cancelled: true } : { error: e && e.name === "AbortError" ? "انتهت مهلة البحث." : "تعذّر الاتصال بخدمة الذكاء الاصطناعي." };
    }
    if (outcome.cancelled || runId !== state.runId) return;

    state.controller = null;
    setStep("stepDevice", "done");
    setStep("stepSpecs", "done");
    setStep("stepSettings", "done");
    analysisModal.classList.add("hidden");

    const view = outcome.ai
      ? aiView(device, outcome.ai)
      : localView(device, style, `${outcome.error} عُرضت إعدادات محلية بدلًا منها.`);
    showView(view);
  }

  /* ---------------- عرض النتيجة ---------------- */

  function addSpecBox(container, label, value) {
    const box = document.createElement("div");
    box.className = "spec-box";
    const title = document.createElement("span");
    title.textContent = label;
    const detail = document.createElement("strong");
    detail.textContent = value;
    box.append(title, detail);
    container.appendChild(box);
  }

  function renderSettings(settings) {
    const container = $("sensitivityList");
    container.replaceChildren();
    for (const s of settings) {
      const row = document.createElement("div");
      row.className = "sense-row";
      const head = document.createElement("div");
      head.className = "sense-head";
      const label = document.createElement("span");
      label.textContent = s.label;
      const value = document.createElement("strong");
      value.textContent = `${s.value}${s.unit || ""}`;
      head.append(label, value);
      const track = document.createElement("div");
      track.className = "sense-track";
      const fill = document.createElement("div");
      fill.className = "sense-fill";
      fill.style.width = `${(s.value / (s.max || Engine.MAX_SENSITIVITY)) * 100}%`;
      track.appendChild(fill);
      row.append(head, track);
      container.appendChild(row);
    }
  }

  function renderSources(view) {
    const status = $("sourceStatus");
    status.textContent = view.status;
    const list = $("sourcesList");
    list.replaceChildren();
    for (const s of view.sources) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.title;
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  function renderGame(game) {
    const box = $("gameInfo");
    const list = $("gameChanges");
    list.replaceChildren();
    if (!game || (!game.version && !game.date && !game.changes.length)) {
      box.classList.add("hidden");
      return;
    }
    $("gameVersion").textContent = [game.version, game.date].filter(Boolean).join(" · ") || "غير محدد";
    for (const c of game.changes) {
      const li = document.createElement("li");
      li.textContent = c;
      list.appendChild(li);
    }
    box.classList.remove("hidden");
  }

  function showView(view) {
    state.lastView = view;
    $("resultDevice").textContent = view.title;
    const mode = $("resultMode");
    mode.textContent = view.mode === "ai" ? "تحليل بالذكاء الاصطناعي + بحث" : "تقدير محلي";
    mode.classList.toggle("local", view.mode !== "ai");
    $("resultNotice").textContent = view.notice;

    const summary = $("aiSummary");
    summary.textContent = view.summary;
    summary.classList.toggle("hidden", !view.summary);

    const specs = $("specSummary");
    specs.replaceChildren();
    addSpecBox(specs, "المعالج", view.specs.processor);
    addSpecBox(specs, "الذاكرة", view.specs.ram);
    addSpecBox(specs, "الشاشة", view.specs.refresh);

    renderGame(view.game);
    renderSettings(view.settings);

    $("dpiLabel").textContent = view.dpi.label;
    $("dpiNote").textContent = view.dpi.note;
    $("dpiValue").textContent = view.dpi.value;

    renderSources(view);
    openModal(resultModal, generateBtn);
  }

  async function copySettings() {
    const view = state.lastView;
    if (!view) return;
    const text = [
      "Katshr Sensitivity",
      `Device: ${view.title}`,
      "",
      ...view.settings.map((s) => `${s.label}: ${s.value}${s.unit || ""}`),
      "",
      "Note: starting-point suggestions (0-200 scale), not official settings."
    ].join("\n");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("copy failed");
      }
      showToast("تم نسخ الإعدادات.");
    } catch (e) {
      showToast("تعذّر النسخ تلقائيًا. جرّب فتح الموقع عبر HTTPS.");
    }
  }

  function resetForm() {
    closeModal("result");
    state.device = null;
    brandSelect.value = "";
    modelSelect.dataset.brand = "";
    populateModels("");
    modelSearch.value = "";
    searchResults.classList.add("hidden");
    generateBtn.disabled = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- الأحداث ---------------- */

  brandSelect.addEventListener("change", () => {
    selectDevice(null);
    modelSelect.dataset.brand = brandSelect.value;
    modelSearch.value = "";
    populateModels(brandSelect.value);
  });

  modelSelect.addEventListener("change", () => {
    const brand = brandSelect.value;
    if (!brand || modelSelect.value === "") {
      selectDevice(null);
      return;
    }
    chooseCatalogDevice(brand, Number(modelSelect.value));
  });

  modelSearch.addEventListener("input", () => renderSearchResults(modelSearch.value));
  modelSearch.addEventListener("focus", () => { if (modelSearch.value.trim()) renderSearchResults(modelSearch.value); });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrap") && !event.target.closest("#searchResults")) {
      searchResults.classList.add("hidden");
    }
  });

  document.querySelectorAll('input[name="gameStyle"]').forEach((input) => input.addEventListener("change", updateStyleCards));
  generateBtn.addEventListener("click", generate);
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => closeModal(el.dataset.close)));
  $("copyBtn").addEventListener("click", copySettings);
  $("newDeviceBtn").addEventListener("click", resetForm);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!analysisModal.classList.contains("hidden")) closeModal("analysis");
      else if (!resultModal.classList.contains("hidden")) closeModal("result");
    } else if (event.key === "Tab") {
      if (!analysisModal.classList.contains("hidden")) trapTab(event, analysisModal);
      else if (!resultModal.classList.contains("hidden")) trapTab(event, resultModal);
    }
  });

  initBrands();
  populateModels("");
  updateStyleCards();
  checkAi();
})();
