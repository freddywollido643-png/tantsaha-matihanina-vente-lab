/* =========================================================
   TANTSAHA MATIHANINA • VENTE LAB
   APP.JS — VERSION VOAMBOARA
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CONFIG = {
    whatsappGroup: "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",
    whatsappPractice: "https://chat.whatsapp.com/FU0bIEq9nmVI6W4VDH6GlI",
    whatsappReturn: "https://chat.whatsapp.com/KdpFGACZvDg30syTi9N7mC",
    whatsappPurchase: "https://wa.me/261385651378",
    facebook: "https://www.facebook.com/share/1Zfiu8oj3m/",
    supabaseUrl: "https://sdzybetralbaincrxddf4.supabase.co",
    supabaseKey: "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"
  };

  /* =========================================================
     STATE
     ========================================================= */

  const KEY = "tm_vente_lab_state_v3";

  const defaults = {
    calculations: [],
    orders: [],
    evaluations: [],
    localReviews: [],
    prospects: [],
    calendarPlans: [],
    challenge: [],
    receipts: [],
    simulations: [],
    challengeNotes: {},
    lastOffer: null,
    lastActivity: null
  };

  let state = loadState();
  let sb = null;

  /* =========================================================
     BASIC UTILITIES
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function num(value) {
    const n = Number(
      String(value ?? "")
        .replace(/\s/g, "")
        .replace(",", ".")
    );
    return Number.isFinite(n) ? n : 0;
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return new Intl.NumberFormat("fr-FR").format(Math.round(num(value))) + " Ar";
  }

  function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    return d.toLocaleDateString("fr-FR");
  }

  function todayISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function addDays(date, days) {
    const d =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(date + "T00:00:00")
        : new Date(date);
    d.setDate(d.getDate() + Number(days));
    return d;
  }

  /* =========================================================
     LOCAL STORAGE
     ========================================================= */

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return clone(defaults);
      }
      const saved = JSON.parse(raw);
      return {
        ...clone(defaults),
        ...saved
      };
    } catch (error) {
      console.error("Erreur chargement state:", error);
      return clone(defaults);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Erreur sauvegarde state:", error);
    }
  }

  function touch() {
    state.lastActivity = new Date().toISOString();
    saveState();
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function toast(message, type = "success") {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.className = "toast " + type;
    el.classList.add("is-visible");

    clearTimeout(el._toastTimer);

    el._toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
    }, 3000);
  }

  /* =========================================================
     COPY TEXT
     ========================================================= */

  async function copyText(text) {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      toast("Voakopia.", "success");
      return true;
    } catch (error) {
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        toast("Voakopia.", "success");
        return true;
      } catch (err) {
        toast("Tsy afaka manao copie.", "error");
        return false;
      }
    }
  }

  /* =========================================================
     REMOTE / SUPABASE HELPER
     ========================================================= */

  async function remote(path, options = {}) {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
      return null;
    }

    try {
      const response = await fetch(
        CONFIG.supabaseUrl + "/rest/v1/" + path,
        {
          ...options,
          headers: {
            "apikey": CONFIG.supabaseKey,
            "Authorization": "Bearer " + CONFIG.supabaseKey,
            "Content-Type": "application/json",
            ...(options.headers || {})
          }
        }
      );

      if (!response.ok) {
        console.warn("Remote error:", response.status);
        return null;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn("Remote request failed:", error);
      return null;
    }
  }

  /* =========================================================
     TOOLS DISPATCHER
     ========================================================= */

  function initTools() {
    document.addEventListener("click", function (e) {
      const button = e.target.closest("[data-tool]");
      if (!button) return;
      openTool(button.dataset.tool);
    });
  }

  function openTool(tool) {
    const ws =
      tool === "calendar"
        ? $("calendarWorkspace")
        : $("toolWorkspace");

    if (!ws) return;

    const tools = {
      price: renderPriceTool,
      livestock: renderLivestockTool,
      offer: renderOfferTool,
      publication: renderPublicationTool,
      simulation: renderSimulationTool,
      order: renderOrderTool,
      receipt: renderReceiptTool,
      guide: renderGuideTool,
      challenge: renderChallengeTool,
      calendar: renderCalendarTool
    };

    if (!tools[tool]) {
      ws.innerHTML = `
        <div class="workspace-empty">
          <h3>Outil mbola tsy voaomana</h3>
          <p>Hampidirina amin'ny version manaraka.</p>
        </div>
      `;
      return;
    }

    tools[tool](ws);
    ws.dataset.activeTool = tool;
  }

  /* =========================================================
     1. KAJY PRIX & TOMBONY
     ========================================================= */

  const ANIMALS = [
    "Akoho Gasy",
    "Pondeuse",
    "Poulet de chair",
    "Kisoa",
    "Bitro",
    "Gana",
    "Gisa",
    "Vorontsiloza",
    "Osy",
    "Ondry"
  ];

  function head(eyebrow, title, description) {
    return `
      <div class="workspace-header">
        <span class="eyebrow">${esc(eyebrow)}</span>
        <h2>${esc(title)}</h2>
        <p>${esc(description)}</p>
      </div>
    `;
  }

  function field(label, name, type = "text", attrs = "") {
    return `
      <label>
        ${esc(label)}
        <input type="${esc(type)}" name="${esc(name)}" ${attrs}>
      </label>
    `;
  }

  function area(label, name, attrs = "") {
    return `
      <label>
        ${esc(label)}
        <textarea name="${esc(name)}" rows="4" ${attrs}></textarea>
      </label>
    `;
  }

  function select(label, name, options) {
    return `
      <label>
        ${esc(label)}
        <select name="${esc(name)}">
          ${options.map(
            (option) => `
              <option value="${esc(option)}">${esc(option)}</option>
            `
          ).join("")}
        </select>
      </label>
    `;
  }

  function getData(form) {
    const fd = new FormData(form);
    return Object.fromEntries(fd.entries());
  }

  function priceCalc(d) {
    const q = Math.max(1, num(d.quantity));
    const loss = Math.min(99, Math.max(0, num(d.loss)));
    const sellable = Math.max(1, q * (1 - loss / 100));

    const totalCost =
      Math.max(0, num(d.purchaseCost)) +
      Math.max(0, num(d.feedCost)) +
      Math.max(0, num(d.healthCost)) +
      Math.max(0, num(d.laborCost)) +
      Math.max(0, num(d.packagingCost)) +
      Math.max(0, num(d.transportCost)) +
      Math.max(0, num(d.otherCost));

    const fee = Math.min(50, Math.max(0, num(d.feePct))) / 100;
    const targetProfit = Math.max(0, num(d.targetProfit));
    const targetMargin = Math.min(90, Math.max(0, num(d.targetMargin))) / 100;
    const salePrice = Math.max(0, num(d.salePrice));

    const costPerUnit = totalCost / sellable;

    const minPrice = totalCost / (sellable * (1 - fee));

    let recRevenue = (totalCost + targetProfit) / (1 - fee);

    if (targetMargin > 0 && 1 - fee - targetMargin > 0) {
      recRevenue = Math.max(recRevenue, totalCost / (1 - fee - targetMargin));
    }

    const recommendedPrice = recRevenue / sellable;

    const outcome = (price) => {
      const revenue = sellable * price;
      const fees = revenue * fee;
      const profit = revenue - fees - totalCost;
      return {
        price,
        revenue,
        fees,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0
      };
    };

    const cur = outcome(salePrice);

    const unitNet = salePrice * (1 - fee) - costPerUnit;

    return {
      q, loss, sellable, totalCost, costPerUnit, minPrice, recommendedPrice,
      targetProfit, salePrice, cur,
      markup: costPerUnit > 0 ? (unitNet / costPerUnit) * 100 : 0,
      profitPerUnit: unitNet,
      breakEvenQty: salePrice * (1 - fee) > 0 ? Math.ceil(totalCost / (salePrice * (1 - fee))) : 0,
      scenarios: [
        ["Prix -10%", outcome(salePrice * 0.9)],
        ["Prix actuel", cur],
        ["Prix +10%", outcome(salePrice * 1.1)],
        ["Prix conseillé", outcome(recommendedPrice)]
      ]
    };
  }

  function renderPriceTool(c) {
    c.innerHTML =
      head(
        "LAB 01",
        "💰 Kajy Prix & Tombony",
        "Hahafantatra ny prix minimum, prix conseillé, tombony, marge ary ny isa tsy maintsy amidy mba tsy ho very."
      ) +

      `<form id="priceForm" class="tool-form">

        ${field("Vokatra", "product", "text", 'placeholder="Ohatra: Akoho Gasy, Tantely, Vary" required')}

        ${select("Unité de vente", "unit", ["biby / pièce", "kg", "litre", "sac", "boaty / pot"])}

        ${field("Isan'ny vokatra natomboka", "quantity", "number", 'min="1" value="1" required')}

        ${field("Fahavery / fahafatesana (%)", "loss", "number", 'min="0" max="99" step="0.5" value="0"')}

        <div class="section-title">💸 Coûts</div>

        ${field("Achat / Matières", "purchaseCost", "number", 'min="0" value="0"')}

        ${field("Sakafo", "feedCost", "number", 'min="0" value="0"')}

        ${field("Fanafody / Vaksiny", "healthCost", "number", 'min="0" value="0"')}

        ${field("Mpiasa / main d'œuvre", "laborCost", "number", 'min="0" value="0"')}

        ${field("Emballage / fonosana", "packagingCost", "number", 'min="0" value="0"')}

        ${field("Transport", "transportCost", "number", 'min="0" value="0"')}

        ${field("Autres dépenses", "otherCost", "number", 'min="0" value="0"')}

        <div class="section-title">🎯 Vidy sy tanjona</div>

        ${field("Prix de vente / unité", "salePrice", "number", 'min="0" value="0"')}

        ${field("Frais paiement / commission (%)", "feePct", "number", 'min="0" max="50" step="0.1" value="0"')}

        ${field("Tombony kendrena (Ar)", "targetProfit", "number", 'min="0" value="0"')}

        ${field("Marge kendrena (%)", "targetMargin", "number", 'min="0" max="90" step="1" value="0"')}

        <div id="pricePreview" class="preview-box"></div>

        <button type="submit" class="btn-primary">
          💰 Kajio ny Prix & Tombony
        </button>

      </form>

      <div id="priceResult"></div>`;

    const form = document.getElementById("priceForm");
    const preview = document.getElementById("pricePreview");
    const result = document.getElementById("priceResult");

    function calculatePreview() {
      const r = priceCalc(getData(form));

      preview.innerHTML = `
        <div class="preview-title">📊 Tombana</div>

        <div class="result-grid">

          <div>
            <span>Coût total</span>
            <strong>${money(r.totalCost)}</strong>
          </div>

          <div>
            <span>Coût / unité vendable</span>
            <strong>${money(r.costPerUnit)}</strong>
          </div>

          <div>
            <span>Prix minimum rentable</span>
            <strong>${money(r.minPrice)}</strong>
          </div>

          <div>
            <span>Prix conseillé</span>
            <strong>${money(r.recommendedPrice)}</strong>
          </div>

        </div>
      `;
    }

    form.addEventListener("input", calculatePreview);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const d = getData(form);

      const product = String(d.product || "").trim();

      const r = priceCalc(d);

      const ok = r.cur.profit > 0;

      const targetReached = r.cur.profit >= r.targetProfit;

      let advice = "";

      if (r.salePrice < r.minPrice) {
        advice = `
          <div class="advice warning">
            ⚠️ Ambany noho ny prix minimum rentable (${money(r.minPrice)}) ny prix de vente.
            Misy fatiantoka. Ampiakaro ny prix na ahenao ny coûts.
          </div>
        `;
      } else if (!targetReached) {
        advice = `
          <div class="advice warning">
            ⚠️ Mahazo tombony ianao, fa mbola tsy tonga ny tombony kendrena.
            Prix conseillé: ${money(r.recommendedPrice)}.
          </div>
        `;
      } else {
        advice = `
          <div class="advice success">
            ✅ Tsara! Tonga ny tombony kendrena.
          </div>
        `;
      }

      if (r.loss > 0 && r.salePrice >= r.minPrice) {
        advice += `
          <div class="advice warning">
            ℹ️ Voaisa ao amin'ny kajy ny fahavery ${r.loss}%: ${Math.round(r.sellable)} no vendable amin'ny ${Math.round(r.q)}.
          </div>
        `;
      }

      state.calculations.push({
        date: new Date().toISOString(),
        product,
        unit: d.unit,
        quantity: r.q,
        sellable: r.sellable,
        loss: r.loss,
        cost: r.totalCost,
        costPerUnit: r.costPerUnit,
        minPrice: r.minPrice,
        recommendedPrice: r.recommendedPrice,
        salePrice: r.salePrice,
        targetProfit: r.targetProfit,
        revenue: r.cur.revenue,
        profit: r.cur.profit,
        margin: r.cur.margin
      });

      touch();
      updateDashboard();

      result.innerHTML = `
        <div class="result-card ${ok ? "result-positive" : "result-negative"}">

          <div class="result-title">
            ${ok ? "✅ Vokatra azo amidy" : "⚠️ Misy fatiantoka"}
          </div>

          <div class="result-grid">

            <div><span>Vokatra</span><strong>${esc(product)}</strong></div>

            <div><span>Vendable / natomboka</span><strong>${Math.round(r.sellable)} / ${Math.round(r.q)}</strong></div>

            <div><span>Coût total</span><strong>${money(r.totalCost)}</strong></div>

            <div><span>Coût / ${esc(d.unit)}</span><strong>${money(r.costPerUnit)}</strong></div>

            <div><span>Prix minimum rentable</span><strong>${money(r.minPrice)}</strong></div>

            <div><span>Prix conseillé</span><strong>${money(r.recommendedPrice)}</strong></div>

            <div><span>Prix de vente</span><strong>${money(r.salePrice)}</strong></div>

            <div><span>Vola miditra / CA</span><strong>${money(r.cur.revenue)}</strong></div>

            <div><span>Frais / commission</span><strong>${money(r.cur.fees)}</strong></div>

            <div><span>Tombony</span><strong>${money(r.cur.profit)}</strong></div>

            <div><span>Tombony / ${esc(d.unit)}</span><strong>${money(r.profitPerUnit)}</strong></div>

            <div><span>Marge</span><strong>${r.cur.margin.toFixed(2)}%</strong></div>

            <div><span>Markup (/ coût)</span><strong>${r.markup.toFixed(1)}%</strong></div>

            <div><span>Isa tsy maintsy amidy (seuil)</span><strong>${r.breakEvenQty}</strong></div>

          </div>

          ${advice}

          <div class="preview-title">🔁 Scénarios de prix</div>

          <div class="result-grid">

            ${r.scenarios.map(([label, s]) => `
              <div>
                <span>${label} (${money(s.price)})</span>
                <strong>${money(s.profit)} • ${s.margin.toFixed(1)}%</strong>
              </div>
            `).join("")}

          </div>

        </div>
      `;

      toast(
        ok
          ? "Kajy vita. Tombony tsara!"
          : "Kajy vita. Tandremo ny fatiantoka."
      );
    });

    calculatePreview();
  }

  /* =========================================================
     2. FIOMPIANA
     ========================================================= */

  const LIVESTOCK_MORTALITY = {
    "Akoho Gasy": 15, "Pondeuse": 8, "Poulet de chair": 5, "Kisoa": 8, "Bitro": 10,
    "Gana": 12, "Gisa": 12, "Vorontsiloza": 12, "Osy": 6, "Ondry": 6
  };

  function renderLivestockTool(c) {
    c.innerHTML =
      head(
        "LAB 02",
        "🐓 Kajy Fiompiana Professionnel",
        "Kajy tena izy: fahafatesana, coût tsirairay, prix minimum, ROI ary tombony isam-bolana."
      ) +
      `
      <form id="livestockForm" class="lab-form">
        <div class="form-grid">
          ${select("Karazana", "animal", ANIMALS)}
          ${field("Isan'ny biby natomboka", "quantity", "number", 'min="1" value="10" required')}
          ${field("Fahafatesana tombanana (%)", "mortality", "number", 'min="0" max="100" step="0.5" value="15"')}
          ${field("Faharetan'ny fiompiana (andro)", "days", "number", 'min="1" value="150"')}

          <div class="section-title">💸 Coûts</div>
          ${field("Achat biby (total)", "purchase", "number", 'min="0" value="0"')}
          ${field("Sakafo (total)", "feed", "number", 'min="0" value="0"')}
          ${field("Fanafody / vaksiny", "health", "number", 'min="0" value="0"')}
          ${field("Mpiasa / main d'œuvre", "labor", "number", 'min="0" value="0"')}
          ${field("Trano, rano, herinaratra, litière", "housing", "number", 'min="0" value="0"')}
          ${field("Transport", "transport", "number", 'min="0" value="0"')}
          ${field("Dépenses hafa", "other", "number", 'min="0" value="0"')}

          <div class="section-title">🎯 Vidiny</div>
          ${field("Prix de vente / biby velona", "salePrice", "number", 'min="0" value="0"')}
          ${field("Na: lanja salanisa (kg)", "avgWeight", "number", 'min="0" step="0.1" value="0"')}
          ${field("Na: prix / kg", "pricePerKg", "number", 'min="0" value="0"')}
          ${field("Vola hafa miditra (zezika, atody...)", "extraRevenue", "number", 'min="0" value="0"')}
        </div>

        <button class="btn btn-primary" type="submit">
          🐓 Kajio ny fiompiana
        </button>
      </form>

      <div id="livestockResult" class="lab-result"></div>
      `;

    const form = $("livestockForm");

    form.elements.animal.addEventListener("change", () => {
      const a = form.elements.animal.value;
      form.elements.mortality.value = LIVESTOCK_MORTALITY[a] ?? 10;
      form.elements.days.value = (profiles[a] || [150])[0];
    });

    form.elements.animal.dispatchEvent(new Event("change"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(form);

      const q = Math.max(1, num(d.quantity));
      const mort = Math.min(100, Math.max(0, num(d.mortality)));
      const days = Math.max(1, num(d.days));

      const survivors = Math.round(q * (1 - mort / 100));

      const cost =
        num(d.purchase) + num(d.feed) + num(d.health) + num(d.labor) +
        num(d.housing) + num(d.transport) + num(d.other);

      const price =
        num(d.pricePerKg) > 0 && num(d.avgWeight) > 0
          ? num(d.pricePerKg) * num(d.avgWeight)
          : num(d.salePrice);

      const extra = num(d.extraRevenue);
      const revenue = survivors * price + extra;
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;
      const perMonth = profit / (days / 30);
      const costPerSurvivor = survivors > 0 ? cost / survivors : 0;
      const breakEven = survivors > 0 ? Math.max(0, cost - extra) / survivors : 0;

      const mort2 = Math.min(100, mort + 10);
      const survivors2 = Math.round(q * (1 - mort2 / 100));
      const profit2 = survivors2 * price + extra - cost;

      state.calculations.push({
        date: new Date().toISOString(),
        animal: d.animal,
        product: d.animal,
        quantity: q,
        survivors,
        mortality: mort,
        days,
        cost,
        costPerAnimal: costPerSurvivor,
        revenue,
        profit,
        margin,
        roi
      });

      touch();

      let advice;
      if (survivors === 0) {
        advice = "⚠️ Tsy misy biby velona hamidy amin'ity fahafatesana ity.";
      } else if (price < breakEven) {
        advice = "⚠️ Ambany noho ny prix minimum rentable (" + money(breakEven) + " / biby) ny prix de vente. Misy fatiantoka.";
      } else if (profit2 < 0) {
        advice = "⚠️ Tombony ankehitriny, fa raha miakatra +10 points ny fahafatesana dia lasa fatiantoka. Hamafiso ny fiarovana (vaksiny, trano, sakafo).";
      } else {
        advice = "✅ Tsara: mbola tombony na dia miakatra +10 points aza ny fahafatesana.";
      }

      $("livestockResult").innerHTML = `

        <div class="result-card ${profit > 0 ? "result-positive" : "result-negative"}">

          <div class="result-title">${esc(d.animal)} — Résultat</div>

          <div class="result-grid">
            <div><span>Natomboka → velona</span><strong>${q} → ${survivors}</strong></div>
            <div><span>Coût total</span><strong>${money(cost)}</strong></div>
            <div><span>Coût / biby velona</span><strong>${money(costPerSurvivor)}</strong></div>
            <div><span>Prix minimum rentable</span><strong>${money(breakEven)}</strong></div>
            <div><span>Prix de vente / biby</span><strong>${money(price)}</strong></div>
            <div><span>Vola miditra (CA)</span><strong>${money(revenue)}</strong></div>
            <div><span>Tombony</span><strong>${money(profit)}</strong></div>
            <div><span>Marge</span><strong>${margin.toFixed(1)}%</strong></div>
            <div><span>ROI</span><strong>${roi.toFixed(1)}%</strong></div>
            <div><span>Tombony / volana</span><strong>${money(perMonth)}</strong></div>
            <div><span>Raha fahafatesana ${mort2}%</span><strong>${money(profit2)}</strong></div>
          </div>

          <div class="result-advice">${advice}</div>

        </div>

      `;

      updateDashboard();

      toast("Kajy fiompiana vita.");
    });
  }

  /* =========================================================
     3. CALENDRIER
     ========================================================= */

  const profiles = {
    "Akoho Gasy": [150, 120, 210],
    "Pondeuse": [140, 120, 180],
    "Poulet de chair": [45, 35, 60],
    "Kisoa": [180, 150, 240],
    "Bitro": [90, 70, 120],
    "Gana": [100, 80, 130],
    "Gisa": [150, 120, 200],
    "Vorontsiloza": [150, 120, 200],
    "Osy": [240, 180, 300],
    "Ondry": [240, 180, 300]
  };

  /* Protocole de soins et sakafo isaky ny karazana (andro nanomboka tamin'ny fiterahana) */
  const CARE_PLANS = {
    "Poulet de chair": [
      [1, "🍼", "Démarrage", "Sakafo démarrage, hafanana mety (32-34°C), rano madio."],
      [7, "💉", "Vaksiny Newcastle", "Hamafiso amin'ny vétérinaire ny vaksiny sy ny fotoana."],
      [12, "💉", "Vaksiny Gumboro", "Hamafiso amin'ny vétérinaire."],
      [15, "🌾", "Sakafo croissance", "Ovay ny sakafo démarrage ho croissance."],
      [21, "💉", "Rappel Newcastle", "Hamafiso amin'ny vétérinaire."],
      [29, "🌾", "Sakafo finition", "Sakafo finition hatramin'ny vente."],
      [35, "⚖️", "Pesée", "Karajao ny lanja salanisa."]
    ],
    "Akoho Gasy": [
      [7, "💉", "Vaksiny Newcastle", "Hamafiso amin'ny vétérinaire."],
      [21, "💉", "Rappel Newcastle", "Hamafiso amin'ny vétérinaire."],
      [30, "💊", "Déparasitage", "Fanafody parasite anatiny sy ivelany."],
      [90, "⚖️", "Pesée", "Karajao ny lanja salanisa."],
      [120, "💉", "Rappel Newcastle", "Isaky ny 3-4 volana araka ny vétérinaire."]
    ],
    "Pondeuse": [
      [7, "💉", "Vaksiny Newcastle", "Hamafiso amin'ny vétérinaire."],
      [14, "💉", "Vaksiny Gumboro", "Hamafiso amin'ny vétérinaire."],
      [21, "💉", "Rappel Newcastle", "Hamafiso amin'ny vétérinaire."],
      [42, "💊", "Déparasitage", "Fanafody parasite."],
      [112, "🌾", "Sakafo pondeuse", "Miomana amin'ny fanombohan'ny atody: ovay ny sakafo."]
    ],
    "Kisoa": [
      [3, "💉", "Fanampiana vy (fer)", "Hataon'ny vétérinaire na technicien."],
      [14, "🌾", "Manomboka sakafo mafy", "Atombohy ny sakafo ho an'ny zanak'kisoa."],
      [28, "🐷", "Sevrage", "Fanasarahana amin'ny reny (28-45 andro)."],
      [30, "💊", "Déparasitage", "Fanafody parasite."],
      [60, "⚖️", "Pesée", "Karajao ny lanja."],
      [120, "⚖️", "Pesée", "Jereo raha mifanaraka amin'ny lanja kendrena."],
      [150, "🧰", "Famaranana", "Sakafo finition sy fanamarinana ny lanja."]
    ],
    "Osy": [
      [30, "💊", "Déparasitage", "Fanafody parasite."],
      [90, "💊", "Déparasitage", "Isaky ny 3 volana araka ny vétérinaire."],
      [120, "⚖️", "Pesée", "Karajao ny lanja."],
      [180, "⚖️", "Pesée", "Jereo ny fivoaran'ny lanja."]
    ],
    "Ondry": [
      [30, "💊", "Déparasitage", "Fanafody parasite."],
      [90, "💊", "Déparasitage", "Isaky ny 3 volana araka ny vétérinaire."],
      [120, "⚖️", "Pesée", "Karajao ny lanja."],
      [180, "⚖️", "Pesée", "Jereo ny fivoaran'ny lanja."]
    ]
  };

  const CARE_GENERIC = [
    [7, "💊", "Vitamines / prophylaxie", "Hamafiso amin'ny vétérinaire."],
    [21, "💊", "Déparasitage", "Fanafody parasite."],
    [45, "⚖️", "Pesée", "Karajao ny lanja salanisa."],
    [90, "⚖️", "Pesée", "Jereo ny fivoaran'ny lanja."]
  ];

  const TARGET_WEIGHT = {
    "Akoho Gasy": 1.5, "Poulet de chair": 2, "Kisoa": 80, "Bitro": 3,
    "Gana": 4, "Gisa": 5, "Vorontsiloza": 2.5, "Osy": 25, "Ondry": 25
  };

  function renderCalendarTool(c) {
    c.innerHTML =
      head(
        "LAB 10 • OUTIL STRATÉGIQUE",
        "📅 Calendrier Mpiompy & Vente",
        "Fiompiana, fikarakarana (vaksiny, fanafody, sakafo, pesée) ary vente ao anaty calendrier iray."
      ) +

      `
      <div class="info-box">
        <strong>Ahoana no fampiasana azy?</strong>
        <ol>
          <li>Safidio ny karazana biby.</li>
          <li>Ampidiro ny daty nanombohana sy ny andro ananan'ny biby.</li>
          <li>Tsindrio <strong>Hamorona Calendrier</strong>.</li>
          <li>Tsindrio <strong>Adikao</strong> raha tianao alefa amin'ny WhatsApp.</li>
        </ol>
        <p>
          ⚠️ Tombana ihany ny daty. Ny vaksiny sy fanafody dia tokony hamafisina
          amin'ny vétérinaire na technicien eo an-toerana.
        </p>
      </div>

      <form id="calendarForm" class="lab-form">
        <div class="form-grid">
          ${select("Karazana biby", "animal", Object.keys(profiles))}
          ${field("Isan'ny biby", "quantity", "number", 'min="1" value="10" required')}
          ${field("Daty nanombohana", "startDate", "date", `value="${todayISO()}" required`)}
          ${field("Andro ananan'ny biby (raha fantatra)", "ageDays", "number", 'min="0" value="0"')}
          ${field("Lanja ankehitriny kg (raha fantatra)", "weight", "number", 'min="0" step="0.1" value="0"')}
          ${field("Prix de vente / biby", "salePrice", "number", 'min="0" value="0"')}
        </div>
        <button class="btn btn-primary" type="submit">
          📅 Hamorona Calendrier
        </button>
      </form>

      <div id="calendarResult" class="lab-result"></div>
      `;

    $("calendarForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(e.currentTarget);

      const [def, min, max] = profiles[d.animal];

      const age = num(d.ageDays);
      const q = Math.max(1, num(d.quantity));
      const weight = num(d.weight);

      const left = Math.max(def - age, 0);
      const sale = addDays(d.startDate, left);
      const rangeA = addDays(d.startDate, Math.max(min - age, 0));
      const rangeB = addDays(d.startDate, Math.max(max - age, 0));

      const at = (n) => new Date(sale.getTime() - n * 86400000);

      const events = [
        { date: addDays(d.startDate, 0), icon: "🐣", title: "Fiandohana fiompiana", note: "Manomboka ny fiompiana sy ny fanaraha-maso." }
      ];

      (CARE_PLANS[d.animal] || CARE_GENERIC).forEach(([day, icon, title, note]) => {
        if (day >= age && day < def) {
          events.push({ date: addDays(d.startDate, day - age), icon, title, note, care: true });
        }
      });

      events.push(
        { date: at(30), icon: "🧰", title: "Préparation de vente", note: "Jereo ny lanja, fahasalamana ary ny fitaovana." },
        { date: at(21), icon: "🔎", title: "Prospection", note: "Mitady client: namana, tsena, vondrom-piarahamonina." },
        { date: at(14), icon: "📢", title: "Publication", note: "Alefaso ny publication sy ny sary/vidéo ny biby." },
        { date: at(7), icon: "🛒", title: "Commande", note: "Raiso ny commande sy ny acompte." },
        { date: sale, icon: "💰", title: "Vente", note: "Andro tombanana hivarotana (hamafisina araka ny lanja sy ny tsena).", main: true },
        { date: new Date(sale.getTime() + 7 * 86400000), icon: "🤝", title: "Suivi client", note: "Angataho ny retour ary tehirizo ny client." }
      );

      events.sort((a, b) => a.date - b.date);

      const revenue = q * num(d.salePrice);

      let weightInfo = "";
      const target = TARGET_WEIGHT[d.animal];
      if (weight > 0 && target) {
        const pct = Math.round((weight / target) * 100);
        weightInfo = `
          <li>
            Lanja ankehitriny: <strong>${weight} kg</strong>
            (${pct}% amin'ny lanja kendrena ~${target} kg).
            ${pct < 50 && left < 30 ? "⚠️ Mety tsy ho tonga ny lanja amin'ny daty vente: eritrereto ny hanemotra azy." : ""}
          </li>
        `;
      }

      state.calendarPlans.push({
        date: new Date().toISOString(),
        animal: d.animal,
        quantity: q,
        sale: sale.toISOString()
      });

      touch();

      $("calendarResult").innerHTML = `

        <div class="result-card" id="calendarText">

          <div class="result-card-header">
            <span>${esc(d.animal)} × ${q}</span>
            <strong>Vente: ${fmtDate(sale)}</strong>
          </div>

          <div class="calendar-result-warning">
            ⚠️
            <span>
              Fetra tombana: ${fmtDate(rangeA)} → ${fmtDate(rangeB)}.
              Tombana ihany ny daty.
            </span>
          </div>

          <div class="calendar-timeline">

            ${events.map((ev) => `

              <div class="calendar-event ${ev.main ? "calendar-event-main" : ""} ${ev.care ? "calendar-event-care" : ""}">

                <div class="calendar-event-icon">${ev.icon}</div>

                <div>
                  <strong>${esc(ev.title)}</strong>
                  <small>${fmtDate(ev.date)}</small>
                  <p>${esc(ev.note)}</p>
                </div>

              </div>

            `).join("")}

          </div>

          <div class="calendar-action-plan">

            <h3>Plan d'action</h3>

            <ul>
              <li>Andro sisa alohan'ny vente: <strong>${left}</strong></li>
              ${weightInfo}
              ${revenue > 0 ? `<li>CA mety azo: <strong>${money(revenue)}</strong></li>` : ""}
              <li>Manomboka mitady client farafahakeliny 3 herinandro mialoha.</li>
            </ul>

          </div>

          <div class="calendar-note">
            <strong>Fampitandremana</strong>
            <p>
              Raha tsy mahatratra ny lanja kendrena ny biby dia ampiato
              ny daty hivarotana.
            </p>
          </div>

        </div>

        <div class="result-actions">
          <button class="btn btn-secondary" type="button" data-copy="calendarText">
            📋 Adikao
          </button>
        </div>

      `;

      toast("Calendrier vita.");
    });
  }

  /* =========================================================
     4. CRÉER UNE OFFRE
     ========================================================= */

  function offerText(d) {
    const price = num(d.price);
    const old = num(d.oldPrice);
    const lines = [
      "🎁 OFFRE: " + d.product,
      "",
      d.client ? "👤 Ho an'ny: " + d.client : "",
      d.problem ? "❗ Olana: " + d.problem : "",
      d.solution ? "✅ Vahaolana: " + d.solution : "",
      "💰 Prix: " + money(price) +
        (old > price ? " (fa tsy " + money(old) + " — mitsitsy " + Math.round((1 - price / old) * 100) + "%)" : ""),
      d.bonus ? "🎯 Bonus: " + d.bonus : "",
      d.guarantee ? "🛡️ Garantie: " + d.guarantee : "",
      d.delivery ? "🚚 Livraison: " + d.delivery : "",
      d.stock ? "📦 Stock voafetra: " + d.stock : "",
      d.deadline ? "⏳ Valable hatramin'ny: " + fmtDate(d.deadline) : "",
      d.payment ? "💳 Fandoavana: " + d.payment : "",
      "",
      "📲 Commande: " + (d.contact || "Alefaso ny hafatra") 
    ];
    return lines.filter((l, i) => l !== "" || (i > 0 && lines[i - 1] !== "")).join("\n").trim();
  }

  function offerShort(d) {
    return d.product + ": " + money(num(d.price)) +
      (d.bonus ? " + " + d.bonus : "") +
      (d.deadline ? " (hatramin'ny " + fmtDate(d.deadline) + ")" : "") +
      ". Commande: " + (d.contact || "alefaso ny hafatra");
  }

  function renderOfferTool(c) {
    c.innerHTML =
      head(
        "LAB 03",
        "🎁 Créer une Offre",
        "Client → Problème → Solution → Prix → Bonus → Garantie → Urgence → CTA."
      ) +

      `
      <form id="offerForm" class="lab-form">

        <div class="form-grid">

          ${field("Vokatra / service", "product", "text", "required")}
          ${field("Client kendrena", "client", "text", 'placeholder="Ohatra: mpandrafitra fety" required')}
          ${area("Olana amin'ny client", "problem")}
          ${area("Vahaolana atolotra", "solution")}
          ${field("Prix (Ar)", "price", "number", 'min="0" required')}
          ${field("Prix taloha / tsy promo (Ar)", "oldPrice", "number", 'min="0"')}
          ${field("Bonus", "bonus", "text")}
          ${field("Garantie", "guarantee", "text", 'placeholder="Ohatra: avadika raha maty tao anatin'+"'"+'ny 48 ora"')}
          ${field("Livraison (toerana / vidiny)", "delivery", "text")}
          ${field("Stock / isa voafetra", "stock", "text")}
          ${field("Valable hatramin'ny", "deadline", "date")}
          ${field("Fandoavana (Mvola, espèces...)", "payment", "text")}
          ${field("Contact commande", "contact", "text", 'placeholder="WhatsApp 034..."')}

        </div>

        <button class="btn btn-primary" type="submit">
          🎁 Hamorona Offre
        </button>

      </form>

      <div id="offerResult" class="lab-result"></div>
      `;

    $("offerForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(e.currentTarget);

      const full = offerText(d);
      const short = offerShort(d);

      const checks = [
        ["Client kendrena mazava", !!d.client, "Lazao hoe iza ilay client."],
        ["Olana voalaza", !!d.problem, "Ampio ny olan'ny client."],
        ["Vahaolana mazava", !!d.solution, "Lazao ny vokatra mamaha ny olana."],
        ["Prix voalaza", num(d.price) > 0, "Ampio ny prix."],
        ["Bonus", !!d.bonus, "Ampio bonus kely mba hanasarotra ny fanitsahana."],
        ["Garantie / fiarovana", !!d.guarantee, "Ny garantie dia mampihena ny tahotra hividy."],
        ["Urgence (daty na stock)", !!(d.deadline || d.stock), "Ampio daty farany na stock voafetra."],
        ["Contact commande", !!d.contact, "Ampio ny laharana hanaovana commande."]
      ];

      const score = checks.filter((x) => x[1]).length;

      $("offerResult").innerHTML = `

        <div class="result-card">

          <div class="result-title">Kalitaon'ny offre: ${score}/8</div>

          <ul>
            ${checks.map((x) => `<li>${x[1] ? "✅" : "⚪"} ${esc(x[0])}${x[1] ? "" : " — " + esc(x[2])}</li>`).join("")}
          </ul>

        </div>

        <div class="preview-title">Offre feno</div>

        <div class="generated-copy" id="offerText">
          ${esc(full).replace(/\n/g, "<br>")}
        </div>

        <div class="preview-title">Version fohy (SMS)</div>

        <div class="generated-copy" id="offerShortText">
          ${esc(short)}
        </div>

        <div class="result-actions">

          <button class="btn btn-secondary" type="button" data-copy="offerText">
            📋 Adikao ny feno
          </button>

          <button class="btn btn-secondary" type="button" data-copy="offerShortText">
            📋 Adikao ny fohy
          </button>

          <button class="btn btn-primary" type="button" data-tool="publication">
            📢 Hamorona publication avy amin'ity offre ity
          </button>

        </div>

      `;

      state.lastOffer = d;

      touch();

      toast("Offre vita.");
    });
  }

  /* =========================================================
     5. PUBLICATION
     ========================================================= */

  const PUB_PLATFORMS = ["Facebook", "WhatsApp", "SMS"];

  const PUB_HOOKS = ["Fanontaniana", "Olana", "Promo", "Faneriterena"];

  function pubHook(d, style) {
    const price = num(d.price);
    const old = num(d.oldPrice);

    if (d.hook) return d.hook;

    if (style === "Olana") {
      return d.problem ? "❗ " + d.problem : "Sahirana amin'ny " + d.product + " ve ianao?";
    }

    if (style === "Promo") {
      return old > price
        ? "🔥 PROMO: " + d.product + " " + money(price) + " fa tsy " + money(old) + "!"
        : "🔥 Vaovao tsara: " + d.product + "!";
    }

    if (style === "Faneriterena") {
      if (d.stock) return "⏳ " + d.product + " — voafetra: " + d.stock + "!";
      if (d.deadline) return "⏳ " + d.product + " — hatramin'ny " + fmtDate(d.deadline) + " ihany!";
      return "⏳ " + d.product + " — mandehana haingana!";
    }

    return "Mila " + d.product + " tsara ve ianao?";
  }

  function pubText(d) {
    const price = num(d.price);
    const old = num(d.oldPrice);
    const hook = pubHook(d, d.hookStyle);
    const tag = "#" + String(d.product || "").replace(/[^\p{L}\p{N}]/gu, "");
    const priceLine =
      "💰 Prix: " + money(price) +
      (old > price ? " (fa tsy " + money(old) + ")" : "");

    if (d.platform === "SMS") {
      return (
        hook + " " + d.product + " " + money(price) +
        (d.deadline ? " hatramin'ny " + fmtDate(d.deadline) : "") +
        ". " + (d.contact || "Alefaso ny hafatra")
      ).slice(0, 320);
    }

    const bold = (t) => (d.platform === "WhatsApp" ? "*" + t + "*" : t);

    const lines = [
      bold(hook),
      "",
      d.problem && d.hookStyle !== "Olana" ? "❗ " + d.problem : "",
      "✅ " + d.product,
      d.solution || "",
      priceLine,
      d.bonus ? "🎯 Bonus: " + d.bonus : "",
      d.guarantee ? "🛡️ Garantie: " + d.guarantee : "",
      d.delivery ? "🚚 " + d.delivery : "",
      d.deadline ? "⏳ Hatramin'ny " + fmtDate(d.deadline) : "",
      "",
      "👉 Commande: " + (d.contact || "alefaso ny hafatra ankehitriny"),
      d.location ? "📍 " + d.location : "",
      d.platform === "Facebook" ? "\n#TantsahaMatihanina #Madagascar " + tag : ""
    ];

    return lines.filter((l, i) => l !== "" || (i > 0 && lines[i - 1] !== "")).join("\n").trim();
  }

  const PUB_IDEAS = {
    Facebook: [
      "Sary 1: ny vokatra akaiky sy mazava (jiro voajanahary).",
      "Sary 2: ny toerana fiompiana/fambolena mba hanampy ny fahatokisana.",
      "Vidéo 15-30 s: asehoy ny vokatra ary lazao ny prix sy ny fomba commande."
    ],
    WhatsApp: [
      "Alefaso amin'ny Statut miaraka amin'ny sary iray mazava.",
      "Alefaso mivantana amin'ny client efa nividy na nanontany."
    ],
    SMS: [
      "Ampiasao ho an'ny client efa fantatra. Tazony fohy: vokatra, prix, contact."
    ]
  };

  function renderPublicationTool(c) {
    const o = state.lastOffer || {};

    const v = (k) => `value="${esc(o[k] || "")}"`;

    c.innerHTML =
      head(
        "LAB 04",
        "📢 Publication",
        "Hook → Problème → Solution → Offre → Prix → CTA, mifanaraka amin'ny Facebook, WhatsApp na SMS."
      ) +

      `
      <form id="pubForm" class="lab-form">

        <div class="form-grid">

          ${select("Plateforme", "platform", PUB_PLATFORMS)}
          ${select("Karazana hook", "hookStyle", PUB_HOOKS)}
          ${field("Hook manokana (raha tianao)", "hook", "text", 'placeholder="Avelao foana raha te hampiasa ilay automatique"')}
          ${field("Vokatra", "product", "text", v("product") + " required")}
          ${area("Olana", "problem", "")}
          ${area("Vahaolana / offre", "solution", "")}
          ${field("Prix (Ar)", "price", "number", `min="0" value="${esc(o.price || "")}"`)}
          ${field("Prix taloha (Ar)", "oldPrice", "number", `min="0" value="${esc(o.oldPrice || "")}"`)}
          ${field("Bonus", "bonus", "text", v("bonus"))}
          ${field("Garantie", "guarantee", "text", v("guarantee"))}
          ${field("Livraison", "delivery", "text", v("delivery"))}
          ${field("Stock voafetra", "stock", "text", v("stock"))}
          ${field("Valable hatramin'ny", "deadline", "date", v("deadline"))}
          ${field("Contact commande", "contact", "text", v("contact") + ' placeholder="WhatsApp, 034..."')}
          ${field("Toerana", "location", "text", 'placeholder="Toamasina..."')}

        </div>

        <button class="btn btn-primary" type="submit">
          📢 Hamorona Publication
        </button>

      </form>

      <div id="pubResult" class="lab-result"></div>
      `;

    const form = $("pubForm");

    if (o.problem) form.elements.problem.value = o.problem;
    if (o.solution) form.elements.solution.value = o.solution;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(form);

      const text = pubText(d);

      const share = "https://wa.me/?text=" + encodeURIComponent(text);

      $("pubResult").innerHTML = `

        <div class="generated-copy" id="pubText">
          ${esc(text).replace(/\n/g, "<br>")}
        </div>

        <small>${text.length} tarehintsoratra${d.platform === "SMS" ? " (SMS: tsara raha ≤ 160 ho an'ny 1 SMS)" : ""}</small>

        <div class="result-actions">

          <button class="btn btn-secondary" type="button" data-copy="pubText">
            📋 Adikao
          </button>

          <a class="btn btn-secondary" href="${esc(share)}" target="_blank" rel="noopener noreferrer">
            💬 Zarao amin'ny WhatsApp
          </a>

          <button class="btn btn-primary" type="button" id="pubSendGroup">
            🧪 Alefaso ao amin'ny groupe fanandramana
          </button>

        </div>

        <div class="info-box">

          <strong>Hevitra sary / vidéo</strong>

          <ul>
            ${(PUB_IDEAS[d.platform] || []).map((t) => `<li>${esc(t)}</li>`).join("")}
          </ul>

        </div>

      `;

      $("pubSendGroup").addEventListener("click", () => {
        copyText(text);

        window.open(CONFIG.whatsappPractice, "_blank", "noopener,noreferrer");

        toast("Voakopia ny publication. Apetaho ao amin'ny groupe.");
      });

      touch();

      toast("Publication vita.");
    });
  }

  /* =========================================================
     6. SIMULATION CLIENT
        RAPIDE + GEMINI
     ========================================================= */

  const showToast = toast;

  const escapeHTML = esc;

  const simulationScenarios = [
    {
      client: "Lafo loatra ilay izy.",
      options: [
        "Eny, lafo tokoa.",
        "Azafady tompoko, inona no budget noeritreretinao? Afaka jerentsika izay quantité mifanaraka aminy.",
        "Tsy afaka mampidina prix aho."
      ],
      correct: 1
    },
    {
      client: "Mbola hieritreritra aho.",
      options: [
        "Eny ary.",
        "Tsy maninona tompoko. Inona indrindra no mbola tianao hohamarinina alohan'ny hanapahanao hevitra?",
        "Raha tsy mividy ianao dia tsy maninona."
      ],
      correct: 1
    },
    {
      client: "Misy remise ve?",
      options: [
        "Eny, ahena fotsiny.",
        "Miankina amin'ny quantité tompoko. Firy no ilainao dia kajiantsika izay offre mety?",
        "Tsy misy remise mihitsy."
      ],
      correct: 1
    },
    {
      client: "Aiza no misy anareo?",
      options: [
        "Eto Madagascar.",
        "Aiza no misy anao tompoko? Dia hojereko ny toerana sy ny fomba hahazoanao azy.",
        "Aza manahy fa halefanay."
      ],
      correct: 1
    },
    {
      client: "Alefaso aloha dia mandoa aho.",
      options: [
        "Eny, halefako.",
        "Andao aloha hamafisina ny commande sy ny fomba fandoavana ary ny fandefasana mba samy ho voaaro.",
        "Tsy azo atao."
      ],
      correct: 1
    }
  ];

  const geminiProducts = [
    "Akoho Gasy",
    "Pondeuse",
    "Poulet de chair",
    "Kisoa",
    "Bitro",
    "Osy",
    "Ondry",
    "Gana",
    "Gisa",
    "Vorontsiloza",
    "Tantely",
    "Masomboly",
    "Vokatra hafa"
  ];

  const geminiDifficulties = [
    {
      value: "facile",
      label: "Facile",
      description: "Client mbola mora resena lahatra ary tsy dia misy objection."
    },
    {
      value: "intermediaire",
      label: "Intermédiaire",
      description: "Client manontany sy manao objection tsindraindray."
    },
    {
      value: "difficile",
      label: "Difficile",
      description: "Client misalasala, mampitaha prix ary manery."
    },
    {
      value: "exigeant",
      label: "Client exigeant",
      description: "Client tena mitaky preuve, prix, garantie ary assurance."
    }
  ];

  function generateGeminiPrompt() {
    const product = $("geminiProduct")?.value || "vokatra iray";

    const difficulty = $("geminiDifficulty")?.value || "intermediaire";

    const scenario = $("geminiScenario")?.value || "Lafo loatra";

    const context = $("geminiContext")?.value?.trim() || "";

    return `
TANTSAHA MATIHANINA — VENTE LAB
SIMULATION CLIENT AVEC GEMINI

ANJARANAO:
Ianao no CLIENT.
Ny utilisateur no VENDEUR.

VOKATRA:
${product}

NIVEAU:
${difficulty}

OBJECTIF / OBJECTION:
${scenario}

CONTEXTE FANAMPINY:
${context || "Tsy misy contexte fanampiny."}


════════════════════════════════════
IDENTITÉ SY CONTEXTE DU CLIENT
════════════════════════════════════

Ianao dia CLIENT Malagasy tena izy izay liana amin'ilay
VOKATRA voalaza etsy ambony.

ZAVA-DEHIBE:

- Ny produit ${product} ihany no resahina.
- Aza manova produit.
- Aza mampiditra biby, vokatra, service na activité hafa
  tsy mifandray amin'ny ${product}.
- Aza mamorona contexte vaovao tsy voalaza.
- Aza mamorona toerana, prix, quantité, poids, livraison,
  garantie, qualité, paiement na détail hafa.
- Malagasy voajanahary no ampiasao.
- Afaka mampiasa teny français ara-barotra mahazatra
  raha ilaina.
- Aza mampiasa teny hafahafa na teny avy amin'ny fiteny
  tsy mifandray amin'ny conversation.


════════════════════════════════════
SOURCE OF TRUTH — TENA ZAVA-DEHIBE
════════════════════════════════════

Ny zavatra tena nolazain'ny VENDEUR tao amin'ny
conversation ihany no azo ampiasaina amin'ny
evaluation.

Aza mamorona zavatra nolazain'ny vendeur.

Raha tsy voalaza mazava tao amin'ny conversation
ny information iray:

- Aza lazaina fa nolazain'ny vendeur.
- Aza ampidirina ao amin'ny evaluation.
- Aza ampiasaina hanomezana score.
- Aza ampiasaina ho anton'ny critique.

Ny evaluation dia tsy maintsy mifototra amin'ny
dialogue tena nitranga ihany.

Tsy azo atao ny manombana zavatra tsy nomena
fahafahana nasehon'ny vendeur.


════════════════════════════════════
FITSIPIKA HO AN'NY CLIENT
════════════════════════════════════

1. Ataovy réaliste ilay client.

2. Aza miteny hoe AI ianao.

3. Aza manome score mandritra ny simulation.

4. Aza manampy ny vendeur amin'ny valiny.

5. Avelao izy hametraka fanontaniana sy hanao
   qualification.

6. Manaova objection tsikelikely.

7. Aza mamoaka objection rehetra indray mandeha.

8. Miovaova arakaraka ny valintenin'ny vendeur
   ny fihetsiky ny client.

9. Raha tsara ny réponse dia afaka mihalefy
   ny objection.

10. Raha ratsy na tsy mazava ny réponse dia afaka
    mitombo ny doute.

11. Mitondrà tena toy ny client Malagasy tena izy.

12. Mampiasà fiteny Malagasy voajanahary sy mora vakina.

13. Raha tsy ampy ny information dia anontanio.

14. Aza manome information tsy mbola fantatry ny client.

15. Aza manome information tsy mbola nolazain'ny vendeur.

16. Aza mamorona prix, toerana, quantité, poids,
    garantie, livraison, vaccin, qualité na détail hafa
    raha tsy efa voalaza tao amin'ny conversation.

17. Raha tsy mazava ny valintenin'ny vendeur,
    mangataha fanazavana fa aza mamorona valiny.

18. Ny fanontaniana apetraky ny client dia tsy maintsy
    mifandray amin'ny ${product}.

19. Aza mampiditra produit hafa raha tsy ny vendeur
    mihitsy no mampiditra azy.

20. Aza mampiasa fehezanteny tsy misy dikany.

21. Aza miala amin'ny contexte efa napetraka.

22. Tadidio izay zavatra efa nolazain'ny vendeur.

23. Aza mamerina fanontaniana efa voavaly raha tsy misy
    antony tena ilaina.

24. Aza manampy ny vendeur hamaly objection.

25. Aza manome conseil pendant la simulation.

26. Aza manao analyse pendant la simulation.

27. Aza miala amin'ny rôle client.


════════════════════════════════════
MÉMOIRE DE LA CONVERSATION
════════════════════════════════════

Alohan'ny hamalianao ny message tsirairay avy amin'ny
vendeur dia diniho:

- Inona ilay produit?
- Inona no nolazain'ny vendeur farany?
- Inona no efa fantatry ny client?
- Inona no mbola tsy fantatry ny client?
- Inona ny objection efa nipoitra?
- Inona ny fanontaniana efa napetraky ny client?
- Inona ny information efa nomen'ny vendeur?

Ny valinteninao manaraka dia tsy maintsy mifandray
amin'ny valintenin'ny vendeur farany.

Aza manomboka contexte vaovao tampoka.

Aza mamorona tantara vaovao rehefa tsy ilaina.


════════════════════════════════════
DÉROULEMENT DE LA SIMULATION
════════════════════════════════════

Atombohy amin'ny message client fohy sy naturel.

Ohatra:

"Salama tompoko, liana amin'ilay ${product} aho
fa mbola te hahalala kely."

Avy eo MIANDRASA ny vendeur.

Aza manohy miteny raha tsy mbola namaly
ny vendeur.

Mandritra ny simulation dia:

CLIENT
→ miandry

VENDEUR
→ mamaly

CLIENT
→ mamaly arakaraka izay nolazain'ny vendeur

VENDEUR
→ mamaly

CLIENT
→ mamaly

Tohizo io rythme io mandra-pahatongan'ny
"FIN DE SIMULATION".


════════════════════════════════════
OBJECTIF / OBJECTION
════════════════════════════════════

Ny client dia manana hésitation mifandraika amin'ny:

"${scenario}"

Aza avoaka avy hatrany ny objection rehetra.

Avelao hivoatra tsikelikely ny resaka.

Raha tsara ny qualification sy ny réponse
ataon'ny vendeur dia afaka mihalefy ny hésitation.

Raha tsy ampy, tsy mazava na tsy maharesy lahatra
ny réponse dia afaka mitombo ny doute.

Tsy voatery hiseho daholo ny objection rehetra.

Aza manery ny conversation hifarana amin'ny vente.

Avelao ny réaction du client hifanaraka amin'ny
tena valintenin'ny vendeur.


════════════════════════════════════
MANDRITRA NY SIMULATION
════════════════════════════════════

- Client ihany no ataonao.
- Aza manao analyse.
- Aza manao correction.
- Aza manome score.
- Aza manome conseil.
- Aza manazava stratégie de vente.
- Aza miala amin'ny rôle.
- Aza miteny izay tokony hataon'ny vendeur.
- Aza manampy azy hamaly objection.
- Aza manome evaluation alohan'ny FIN DE SIMULATION.


════════════════════════════════════
FIN DE SIMULATION
════════════════════════════════════

Rehefa manoratra ny vendeur hoe:

"FIN DE SIMULATION"

dia:

1. Ajanony avy hatrany ny rôle client.
2. Aza manohy manao dialogue client.
3. Ataovy evaluation professionnelle.
4. Ny evaluation dia tsy maintsy mifototra amin'ny
   dialogue tena nitranga ihany.


════════════════════════════════════
RÈGLE SPÉCIALE — QUALIFICATION
════════════════════════════════════

Aza manasazy ny vendeur satria tsy nanontany
information iray tany am-piandohana.

Diniho kosa:

- Niezaka hahafantatra ny filàn'ny client ve izy?
- Nanao fanontaniana mifanaraka amin'ny valintenin'ny
  client ve izy?
- Nampiasa tsara ireo opportunités nomen'ny client ve izy?
- Nifanaraka tamin'ny zavatra nolazain'ny client ve
  ny proposition nataony?

Ny qualification dia tokony hojerena araka izay
tena nitranga tao amin'ny conversation.


════════════════════════════════════
RÈGLE SPÉCIALE — OBJECTION
════════════════════════════════════

Diniho raha:

- Nihaino tsara ny objection ve ny vendeur?
- Namaly ilay tena objection ve izy?
- Nanome valeur mifanaraka amin'ny objection ve izy?
- Nanao clarification ve izy raha ilaina?
- Nampihena ny doute ve ny réponse?

Aza mamorona objection tsy nisy.


════════════════════════════════════
RÈGLE SPÉCIALE — CLOSING
════════════════════════════════════

TENA ZAVA-DEHIBE:

Ny CLOSING dia tsy tokony hotsaraina mafy raha
tsy mbola tonga tamin'ny dingana tena ahafahan'ny
vendeur manao closing ny conversation.

Raha tsy mbola nisy opportunity mazava hanaovana
closing:

- Aza mamorona closing tsy natao.
- Aza manome score ambany noho izany fotsiny.
- Aza milaza fa tsy nahay closing ilay vendeur
  raha tsy nomena opportunity.
- Soraty hoe:

"Ny closing mbola tsy voasedra tamin'ity simulation ity."

Raha nisy opportunity mazava hanaovana closing
ary tsy nampiasain'ny vendeur izany, vao azo
ahena ny score.

Raha nisy closing natao, diniho:

- fahazavan'ny proposition;
- confiance;
- next step;
- fahafahana mamita ny vente;
- fomba famaliana ny dernière hésitation.


════════════════════════════════════
EVALUATION
════════════════════════════════════

Omeo:

1. QUALIFICATION CLIENT — /20
2. ÉCOUTE — /20
3. RÉPONSE AUX OBJECTIONS — /20
4. VALEUR DE L'OFFRE — /20
5. CLOSING — /20

TOTAL — /100


ZAVA-DEHIBE:

Ny score tsirairay dia tsy maintsy mifototra
amin'ny zavatra tena hita tao amin'ny dialogue.

Aza mamorona erreur tsy nataon'ny vendeur.

Aza manasazy zavatra tsy nomena fahafahana.

Raha tsy ampy ny evidence hanomezana score marina,
lazao izany fa aza mamorona.


════════════════════════════════════
APRÈS L'EVALUATION
════════════════════════════════════

Omeo:

✅ ZAVATRA 2 NAHAY TSARA

1.
2.

⚠️ ZAVATRA 3 TOKONY HATSARAINA

1.
2.
3.

🎯 CONSEIL PRINCIPAL

Omeo torohevitra IRAY tena azo ampiharina
amin'ny prochaine simulation.

Aza manao evaluation lava be.

Ataovy mazava, professionnel ary pédagogique.

Aza mamerina ny conversation manontolo.

════════════════════════════════════
ATOMBOHY IZAO NY SIMULATION
════════════════════════════════════

Manomboka amin'ny message client fohy,
naturel ary mifandray amin'ny ${product}.

Aza manazava ireo instructions ireo.

Aza milaza fa simulation ny valinteninao.

Aza manome analyse.

MIANDRY NY VENDEUR.

  `.trim();
  }

  const SIM_WHY = [
    [
      "Miaiky fa lafo ianao nefa tsy mbola hay ny budget: very ny fahafahana mifampiraharaha.",
      null,
      "Mamono ny resaka: tsy mamaly ny filan'ny client."
    ],
    [
      "Avela handeha ny client tsy fantatra izay mahasalasala azy.",
      null,
      "Manery ary mampihena ny fitokisana."
    ],
    [
      "Mampihena ny prix tsy misy antony: very ny tombony sy ny fahatokisana ny vidiny.",
      null,
      "Mikatona ny varavarana: tsy mitondra mankany amin'ny offre mety."
    ],
    [
      "Valiny mikatona: tsy manampy ny client hahazo ny vokatra.",
      null,
      "Fampanantenana tsy mazava: tsy voafaritra ny antsipiriany."
    ],
    [
      "Mety mampidi-doza ny fandefasana tsy misy commande sy fandoavana voafaritra.",
      null,
      "Mandà tsy misy vahaolana: very ny vente."
    ]
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderSimulationTool(container) {
    async function copyGeminiPrompt() {
      try {
        await copyText(generateGeminiPrompt());

        toast("Prompt Gemini voadika. Apetaho ao amin'i Gemini.");
      } catch (error) {
        console.error("Erreur copie Gemini:", error);

        toast("Tsy afaka nandika ilay prompt.");
      }
    }

    function openGemini() {
      try {
        const prompt = generateGeminiPrompt();

        copyText(prompt);

        window.open(
          "https://gemini.google.com/app",
          "_blank",
          "noopener,noreferrer"
        );

        toast("Gemini nosokafana. Apetaho ilay prompt voadika.");
      } catch (error) {
        console.error("Erreur ouverture Gemini:", error);

        toast("Tsy afaka nanokatra Gemini.");
      }
    }

    container.innerHTML = `

      <div class="workspace-header">

        <span class="eyebrow">LAB 05</span>

        <h2>🎯 Simulation Client</h2>

        <p>
          Manao pratique amin'ny objection ianao
          ary mianatra mamaly toy ny vendeur professionnel.
        </p>

      </div>

      <div class="simulation-mode-grid">

        <button type="button" class="simulation-mode-card active" data-simulation-mode="quick">

          <strong>🎯 Simulation Rapide</strong>

          <span>Fanontaniana 5, misy score sy correction isaky ny valiny.</span>

        </button>

        <button type="button" class="simulation-mode-card" data-simulation-mode="gemini">

          <strong>🤖 Simulation Libre avec Gemini</strong>

          <span>Gemini no CLIENT, ianao no VENDEUR.</span>

        </button>

      </div>

      <div id="quickSimulation" class="simulation-panel"></div>

      <div id="geminiSimulation" class="simulation-panel" style="display:none;">

        <div class="gemini-panel">

          <div class="gemini-intro">

            <span class="eyebrow">🤖 GEMINI CLIENT</span>

            <h3>Simulation libre — Client réaliste</h3>

            <p>
              Gemini joue le rôle du client.
              Ianao no vendeur.
              Tsy misy score mandritra ny simulation.
            </p>

          </div>

          <div class="form-grid">

            <label>
              Vokatra

              <select id="geminiProduct">

                ${geminiProducts.map(
                  (p) => `
                    <option value="${escapeHTML(p)}">${escapeHTML(p)}</option>
                  `
                ).join("")}

              </select>

            </label>

            <label>
              Niveau

              <select id="geminiDifficulty">

                ${geminiDifficulties.map(
                  (i) => `
                    <option value="${i.value}">${i.label}</option>
                  `
                ).join("")}

              </select>

            </label>

            <label>
              Objection / scénario

              <select id="geminiScenario">

                <option>Lafo loatra</option>

                <option>Mbola hieritreritra</option>

                <option>Mitady remise</option>

                <option>Aiza no misy anareo?</option>

                <option>Alefaso aloha dia mandoa aho</option>

              </select>

            </label>

          </div>

          <label>
            Contexte fanampiny

            <textarea
              id="geminiContext"
              rows="4"
              placeholder="Ohatra: Client avy any Antananarivo, mitady akoho 20, mbola mampitaha prix..."
            ></textarea>

          </label>

          <div class="gemini-actions">

            <button type="button" class="btn btn-secondary" id="copyGeminiPrompt">
              📋 Copier le prompt
            </button>

            <button type="button" class="btn btn-primary" id="openGemini">
              🤖 Ouvrir Gemini
            </button>

          </div>

          <div class="gemini-instructions">

            <strong>Ahoana no fanaovana azy?</strong>

            <ol>

              <li>Safidio ny produit sy ny niveau.</li>

              <li>Tsindrio <strong>Ouvrir Gemini</strong>.</li>

              <li>Apetaho ilay prompt raha tsy efa voapaste.</li>

              <li>Gemini no client.</li>

              <li>Ianao mamaly amin'ny maha-vendeur anao.</li>

              <li>
                Rehefa vita dia soraty:
                <strong>FIN DE SIMULATION</strong>.
              </li>

              <li>Gemini no manao evaluation /100.</li>

              <li>
                Zarao ao amin'ny groupe fanandramana ny valiny raha te hahazo retour.
              </li>

            </ol>

            <button
              type="button"
              class="btn btn-secondary"
              data-external="${esc(CONFIG.whatsappPractice)}"
            >
              👥 Groupe fanandramana
            </button>

          </div>

        </div>

      </div>

    `;

    const modeButtons = container.querySelectorAll("[data-simulation-mode]");

    const quickPanel = container.querySelector("#quickSimulation");

    const geminiPanel = container.querySelector("#geminiSimulation");

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        modeButtons.forEach((item) => item.classList.remove("active"));

        button.classList.add("active");

        const gem = button.dataset.simulationMode === "gemini";

        quickPanel.style.display = gem ? "none" : "block";

        geminiPanel.style.display = gem ? "block" : "none";
      });
    });

    /* ---------- Simulation rapide: session 5 fanontaniana ---------- */

    const pool = simulationScenarios.map((s, i) => ({ ...s, why: SIM_WHY[i] }));

    let order = shuffle(pool);
    let idx = 0;
    let score = 0;
    let misses = [];

    function drawSummary() {
      const total = order.length;

      const level =
        score === total
          ? "🏆 Excellent: mahay mamaly objection ianao."
          : score >= Math.ceil(total * 0.6)
            ? "👍 Tsara: mbola ampy fanatsarana kely."
            : "📚 Mila fanazarana bebe kokoa: averina ny simulation.";

      const text =
        "Simulation Client — Tantsaha Matihanina\n" +
        "Score: " + score + "/" + total + "\n" + level +
        (misses.length
          ? "\n\nZavatra hatsaraina:\n" +
            misses.map((m) => "- " + m.client + " → " + m.better).join("\n")
          : "");

      state.simulations.push({
        date: new Date().toISOString(),
        score,
        total
      });

      touch();

      quickPanel.innerHTML = `

        <div class="result-card ${score >= Math.ceil(total * 0.6) ? "result-positive" : "result-negative"}">

          <div class="result-title">Score: ${score}/${total}</div>

          <p>${escapeHTML(level)}</p>

          <div id="simSummaryText">

            ${
              misses.length
                ? `
                  <strong>Zavatra hatsaraina:</strong>
                  <ul>
                    ${misses.map((m) => `<li>"${escapeHTML(m.client)}" → ${escapeHTML(m.better)}</li>`).join("")}
                  </ul>
                `
                : `<p>Tsy nisy diso. Tohizo amin'ny Simulation Libre miaraka amin'i Gemini.</p>`
            }

            <span style="display:none">${escapeHTML(text)}</span>

          </div>

        </div>

        <div class="result-actions">

          <button type="button" class="btn btn-primary" id="simRestart">🔄 Averina</button>

          <button type="button" class="btn btn-secondary" id="simCopy">📋 Adikao ny valiny</button>

          <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappPractice)}">
            👥 Zarao ao amin'ny groupe fanandramana
          </button>

        </div>

      `;

      quickPanel.querySelector("#simRestart").addEventListener("click", () => {
        order = shuffle(pool);
        idx = 0;
        score = 0;
        misses = [];
        drawQuick();
      });

      quickPanel.querySelector("#simCopy").addEventListener("click", () => copyText(text));
    }

    function drawQuick() {
      if (idx >= order.length) return drawSummary();

      const s = order[idx];

      const opts = shuffle(
        s.options.map((text, k) => ({ text, k, correct: k === s.correct }))
      );

      quickPanel.innerHTML = `

        <div class="simulation-client-card">

          <span class="eyebrow">CLIENT • ${idx + 1}/${order.length}</span>

          <h3>"${escapeHTML(s.client)}"</h3>

        </div>

        <div class="simulation-options">

          ${opts.map(
            (o, i) => `
              <button type="button" class="simulation-option" data-i="${i}">
                ${escapeHTML(o.text)}
              </button>
            `
          ).join("")}

        </div>

        <div id="simulationFeedback" class="simulation-feedback"></div>

      `;

      const feedback = quickPanel.querySelector("#simulationFeedback");

      quickPanel.querySelectorAll(".simulation-option").forEach((button) => {
        button.addEventListener("click", () => {
          const o = opts[Number(button.dataset.i)];

          quickPanel
            .querySelectorAll(".simulation-option")
            .forEach((item) => (item.disabled = true));

          if (o.correct) {
            score++;

            feedback.innerHTML = `

              <div class="result-card result-positive">

                <strong>✅ Bonne réponse</strong>

                <p>
                  Tsara ny fomba namalianao: niezaka namantatra ny besoin
                  ianao ary nitondra ny conversation nankany amin'ny solution.
                </p>

              </div>

            `;
          } else {
            misses.push({ client: s.client, better: s.options[s.correct] });

            feedback.innerHTML = `

              <div class="result-card result-negative">

                <strong>⚠️ Azo hatsaraina</strong>

                <p>${escapeHTML(s.why[o.k] || "Miezaha aloha hahatakatra ny antony mahatonga ny client hisalasala.")}</p>

                <p>
                  <strong>Réponse recommandée:</strong>
                  ${escapeHTML(s.options[s.correct])}
                </p>

              </div>

            `;
          }

          feedback.insertAdjacentHTML(
            "beforeend",
            `<button type="button" class="btn btn-primary" id="simNext">
               ${idx + 1 < order.length ? "Manaraka →" : "Hijery ny valiny →"}
             </button>`
          );

          feedback.querySelector("#simNext").addEventListener("click", () => {
            idx++;
            drawQuick();
          });
        });
      });
    }

    drawQuick();

    container
      .querySelector("#copyGeminiPrompt")
      ?.addEventListener("click", copyGeminiPrompt);

    container
      .querySelector("#openGemini")
      ?.addEventListener("click", openGemini);
  }

  /* =========================================================
     7. COMMANDE
     ========================================================= */

  let pendingReceiptOrder = null;

  const ORDER_STATUS = ["En attente", "Acompte reçu", "Payé", "Livré", "Annulé"];

  const PAY_METHODS = ["Espèces", "Mvola", "Orange Money", "Airtel Money"];

  function waLink(phone, text) {
    let p = String(phone || "").replace(/\D/g, "");
    if (!p) return "";
    if (p.startsWith("0")) p = "261" + p.slice(1);
    return "https://wa.me/" + p + "?text=" + encodeURIComponent(text);
  }

  function orderPaid(o) {
    if (o.paid !== undefined && o.paid !== null) return num(o.paid);
    return o.status === "Payé" || o.status === "Livré" ? num(o.total) : 0;
  }

  function orderBalance(o) {
    return Math.max(0, num(o.total) - orderPaid(o));
  }

  function renderOrderTool(c) {
    c.innerHTML =
      head(
        "LAB 07",
        "🛒 Commande",
        "Client → Produit → Acompte → Livraison → Reçu."
      ) +

      `
      <form id="orderForm" class="lab-form">

        <div class="form-grid">

          ${field("Client", "client", "text", "required")}
          ${field("Téléphone (WhatsApp)", "phone", "tel", 'placeholder="034 00 000 00"')}
          ${field("Produit", "product", "text", "required")}
          ${field("Isa", "quantity", "number", 'min="1" value="1" required')}
          ${field("Prix / unité", "price", "number", 'min="0" value="0" required')}
          ${field("Remise (Ar)", "discount", "number", 'min="0" value="0"')}
          ${field("Frais de livraison (Ar)", "fee", "number", 'min="0" value="0"')}
          ${field("Acompte reçu (Ar)", "deposit", "number", 'min="0" value="0"')}
          ${select("Paiement", "method", PAY_METHODS)}
          ${field("Daty livraison", "deliveryDate", "date")}
          ${field("Toerana livraison", "place", "text")}
          ${select("Statut", "status", ORDER_STATUS)}

        </div>

        <div id="orderPreview" class="preview-box"></div>

        <button class="btn btn-primary" type="submit">
          🛒 Tahiry ny commande
        </button>

      </form>

      <div id="orderSummary" class="preview-box"></div>

      <div id="orderList" class="dashboard-list"></div>
      `;

    const form = $("orderForm");

    const calc = () => {
      const d = getData(form);
      const total = Math.max(
        0,
        Math.max(1, num(d.quantity)) * num(d.price) - num(d.discount) + num(d.fee)
      );
      const deposit = Math.min(total, Math.max(0, num(d.deposit)));
      return { d, total, deposit, rest: total - deposit };
    };

    const preview = () => {
      const r = calc();
      $("orderPreview").innerHTML = `
        <div class="result-grid">
          <div><span>Total</span><strong>${money(r.total)}</strong></div>
          <div><span>Acompte</span><strong>${money(r.deposit)}</strong></div>
          <div><span>Sisa haloa</span><strong>${money(r.rest)}</strong></div>
        </div>
      `;
    };

    form.addEventListener("input", preview);

    preview();

    const list = () => {
      const active = state.orders.filter((o) => o.status !== "Annulé");
      const toCollect = active.reduce((s, o) => s + orderBalance(o), 0);

      $("orderSummary").innerHTML = `
        <div class="result-grid">
          <div><span>Commande mavitrika</span><strong>${active.length}</strong></div>
          <div><span>Sisa horaisina</span><strong>${money(toCollect)}</strong></div>
        </div>
      `;

      $("orderList").innerHTML = state.orders.length
        ? state.orders
            .slice(-15)
            .reverse()
            .map((o) => {
              const bal = orderBalance(o);
              const wa = waLink(
                o.phone,
                "Salama " + o.client + ", momba ny commande " + o.product +
                " (" + money(o.total) + "). Sisa haloa: " + money(bal) + ". Misaotra!"
              );
              return `

                <div class="dashboard-item">

                  <div>

                    <strong>${esc(o.client)} — ${esc(o.product)} × ${esc(o.quantity)}</strong>

                    <small>
                      ${fmtDate(o.date)} • ${esc(o.status)}
                      ${o.deliveryDate ? " • Livraison: " + fmtDate(o.deliveryDate) : ""}
                      ${o.place ? " • " + esc(o.place) : ""}
                    </small>

                    <small>
                      Total: ${money(o.total)} • Voaloa: ${money(orderPaid(o))} •
                      Sisa: ${money(bal)}
                    </small>

                    <div class="result-actions">
                      <button class="btn btn-secondary" type="button" data-order-action="receipt" data-id="${o.id}">🧾 Reçu</button>
                      ${bal > 0 && o.status !== "Annulé" ? `<button class="btn btn-secondary" type="button" data-order-action="paid" data-id="${o.id}">💰 Payé</button>` : ""}
                      ${o.status !== "Livré" && o.status !== "Annulé" ? `<button class="btn btn-secondary" type="button" data-order-action="delivered" data-id="${o.id}">🚚 Livré</button>` : ""}
                      ${wa ? `<a class="btn btn-secondary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>` : ""}
                      <button class="btn btn-secondary" type="button" data-order-action="delete" data-id="${o.id}">🗑️</button>
                    </div>

                  </div>

                  <strong>${money(o.total)}</strong>

                </div>

              `;
            })
            .join("")
        : `
            <p class="empty-state">Tsy mbola misy commande.</p>
          `;
    };

    list();

    $("orderList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-order-action]");
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const o = state.orders.find((x) => x.id === id);
      if (!o) return;

      const action = btn.dataset.orderAction;

      if (action === "receipt") {
        pendingReceiptOrder = id;
        return openTool("receipt");
      }

      if (action === "paid") {
        o.paid = num(o.total);
        o.status = o.status === "Livré" ? "Livré" : "Payé";
      }

      if (action === "delivered") {
        o.status = "Livré";
      }

      if (action === "delete") {
        if (!confirm("Hamafa ity commande ity?")) return;
        state.orders = state.orders.filter((x) => x.id !== id);
      }

      touch();
      list();
      updateDashboard();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const { d, total, deposit } = calc();

      let status = d.status;
      let paid = deposit;

      if (status === "Payé" || status === "Livré") {
        paid = total;
      } else if (status === "En attente" && deposit > 0) {
        status = "Acompte reçu";
      }

      state.orders.push({
        id: Date.now(),
        date: new Date().toISOString(),
        client: d.client,
        phone: d.phone,
        product: d.product,
        quantity: Math.max(1, num(d.quantity)),
        price: num(d.price),
        discount: num(d.discount),
        fee: num(d.fee),
        total: total,
        paid: paid,
        method: d.method,
        deliveryDate: d.deliveryDate,
        place: d.place,
        status: status
      });

      touch();

      list();

      updateDashboard();

      form.reset();

      preview();

      toast("Commande voatahiry.");
    });
  }

  /* =========================================================
     8. REÇU
     ========================================================= */

  function renderReceiptTool(c) {
    const o = state.orders.find((x) => x.id === pendingReceiptOrder) || null;

    pendingReceiptOrder = null;

    const prior = o ? orderPaid(o) : 0;

    c.innerHTML =
      head(
        "LAB 08",
        "🧾 Reçu de Vente",
        "Vente → Paiement → Reçu numéroté, miaraka amin'ny sisa haloa."
      ) +

      `
      <form id="receiptForm" class="lab-form">

        <input type="hidden" name="orderId" value="${o ? o.id : ""}">

        <div class="form-grid">

          ${field("Client", "client", "text", `value="${esc(o ? o.client : "")}" required`)}
          ${field("Téléphone (WhatsApp)", "phone", "tel", `value="${esc(o ? o.phone || "" : "")}"`)}
          ${field("Produit", "product", "text", `value="${esc(o ? o.product : "")}" required`)}
          ${field("Total commande (Ar)", "total", "number", `min="0" value="${o ? num(o.total) : ""}" required`)}
          ${field("Voaloa ankehitriny (Ar)", "paid", "number", `min="0" value="${o ? orderBalance(o) : ""}" required`)}
          ${select("Paiement", "method", PAY_METHODS)}
          ${field("Référence (Mvola, Orange...)", "reference", "text")}

        </div>

        ${o && prior > 0 ? `<p class="empty-state">Efa voaloa teo aloha: ${money(prior)}</p>` : ""}

        <button class="btn btn-primary" type="submit">
          🧾 Hamorona Reçu
        </button>

      </form>

      <div id="receiptResult" class="lab-result"></div>
      `;

    $("receiptForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(e.currentTarget);

      const total = num(d.total);
      const paid = num(d.paid);
      const linked = state.orders.find((x) => String(x.id) === String(d.orderId)) || null;
      const before = linked ? orderPaid(linked) : 0;
      const rest = Math.max(0, total - before - paid);
      const settled = rest === 0;

      const number =
        "REC-" + new Date().getFullYear() + "-" +
        String(state.receipts.length + 1).padStart(4, "0");

      if (linked) {
        linked.paid = Math.min(num(linked.total), before + paid);
        if (linked.status !== "Livré" && linked.status !== "Annulé") {
          linked.status = settled ? "Payé" : "Acompte reçu";
        }
      }

      state.receipts.push({
        number,
        date: new Date().toISOString(),
        client: d.client,
        product: d.product,
        total,
        paid,
        rest,
        method: d.method,
        reference: d.reference,
        orderId: linked ? linked.id : null
      });

      touch();

      updateDashboard();

      const txt =
`REÇU N° ${number} — TANTSAHA MATIHANINA
Date: ${fmtDate(new Date())}
Client: ${d.client}
Produit: ${d.product}
Total: ${money(total)}${before > 0 ? `\nEfa voaloa: ${money(before)}` : ""}
Voaloa androany: ${money(paid)}
Sisa haloa: ${money(rest)}
Paiement: ${d.method}${d.reference ? ` (Réf: ${d.reference})` : ""}
Statut: ${settled ? "SOLDÉ" : "ACOMPTE"}
Misaotra!`;

      const wa = waLink(d.phone, txt);

      $("receiptResult").innerHTML = `

        <div class="receipt-preview" id="receiptText">

          <div class="receipt-brand">TANTSAHA MATIHANINA</div>

          <h3>REÇU DE VENTE N° ${esc(number)}</h3>

          <hr>

          <p><strong>Date:</strong> ${fmtDate(new Date())}</p>
          <p><strong>Client:</strong> ${esc(d.client)}</p>
          <p><strong>Produit:</strong> ${esc(d.product)}</p>
          <p><strong>Total:</strong> ${money(total)}</p>
          ${before > 0 ? `<p><strong>Efa voaloa:</strong> ${money(before)}</p>` : ""}
          <p><strong>Voaloa androany:</strong> ${money(paid)}</p>
          <p><strong>Sisa haloa:</strong> ${money(rest)}</p>
          <p><strong>Paiement:</strong> ${esc(d.method)}${d.reference ? " (Réf: " + esc(d.reference) + ")" : ""}</p>
          <p><strong>Statut:</strong> ${settled ? "SOLDÉ ✅" : "ACOMPTE"}</p>

          <hr>

          <p>Misaotra!</p>

        </div>

        <div class="result-actions">

          <button class="btn btn-secondary" type="button" id="rcCopy">
            📋 Adikao
          </button>

          ${wa ? `<a class="btn btn-secondary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">💬 Alefaso amin'ny WhatsApp</a>` : ""}

        </div>

      `;

      $("rcCopy").addEventListener("click", () => copyText(txt));

      toast("Reçu vita.");
    });
  }

  /* =========================================================
     9. GUIDE FORMATION
     ========================================================= */

  const days = [
    ["Fototry ny Vente", "Fantaro ny valeur atolotra ny client."],
    ["Client Cible", "Fantaro hoe iza no hividy sy inona ny olany."],
    ["Offre & Prix", "Kajio ny coût, prix ary tombony."],
    ["Publication & Copywriting", "Hook → Problème → Solution → Offre → CTA."],
    ["Prospection & Discussion", "Comment → MP → Qualification → Proposition."],
    ["Objection & Closing", "Valio ny objection ary akatony ny vente."],
    ["Suivi & Fidélisation", "Araho ny client ary angataho ny retour."]
  ];

  const DAY_GUIDE = [
    {
      goal: "Ny vente dia famahana olana ho an'ny client, tsy fanindronana vokatra fotsiny.",
      steps: [
        "Soraty ny vokatra 3 azonao amidy.",
        "Isaky ny vokatra: inona ny olana vahaoliny ho an'ny client?",
        "Fantaro ny coût tena izy alohan'ny hilaza prix."
      ],
      action: "Soraty ny vokatra 3 azonao amidy sy ny olana vahaoliny.",
      tool: "price", toolLabel: "💰 Kajy Prix",
      mistake: "Mametraka prix tsy nanao kajy coût."
    },
    {
      goal: "Mivarotra amin'ny client IRAY mazava aloha, fa tsy amin'ny rehetra.",
      steps: [
        "Safidio mpividy iray tena mety (ohatra: mpandrafitra fety).",
        "Fantaro ny filany, ny budget ary ny toerana misy azy.",
        "Fantaro ny toerana hitana azy (Facebook, tsena, WhatsApp)."
      ],
      action: "Safidio ny client IRAY kendrena ary soraty ny filany.",
      tool: "offer", toolLabel: "🎁 Offre",
      mistake: "Te hivarotra amin'ny olona rehetra."
    },
    {
      goal: "Ny offre mahomby dia mampifandray ny client, ny olana, ny vahaolana ary ny prix.",
      steps: [
        "Kajio ny coût sy ny prix conseillé.",
        "Ampio bonus na garantie.",
        "Ampio daty farany na stock voafetra."
      ],
      action: "Kajio ny coût sy ny prix conseillé, avy eo mamorona offre.",
      tool: "price", toolLabel: "💰 Kajy Prix",
      mistake: "Mivarotra amin'ny prix ambany noho ny coût."
    },
    {
      goal: "Ny publication tsara dia misarika ao amin'ny andalana voalohany.",
      steps: [
        "Hook mahasarika ao amin'ny andalana voalohany.",
        "Olana → vahaolana → prix → CTA.",
        "Sary na vidéo mazava sy jiro voajanahary."
      ],
      action: "Mamoròna publication ary alefaso (Facebook na WhatsApp).",
      tool: "publication", toolLabel: "📢 Publication",
      mistake: "Publication lava be tsy misy CTA."
    },
    {
      goal: "Miresaka amin'ny olona ianao fa tsy mandefa publication ihany.",
      steps: [
        "Mitadiava olona 10 mety hividy (namana, groupes, tsena).",
        "Manomboka amin'ny fanontaniana, fa tsy amin'ny prix.",
        "Ahafantaro ny filany alohan'ny hanolotra."
      ],
      action: "Miresaka amin'ny olona 5 farafahakeliny: mametraha fanontaniana aloha.",
      tool: "simulation", toolLabel: "🎯 Simulation",
      mistake: "Mandefa publication ihany nefa tsy miresaka amin'ny olona."
    },
    {
      goal: "Ny objection dia famantarana fa mbola mila fanazavana ny client.",
      steps: [
        "Henoy tsara ny objection alohan'ny hamaly.",
        "Mamaly amin'ny fanontaniana sy valeur.",
        "Manolora dingana manaraka mazava (commande + acompte)."
      ],
      action: "Mamaly objection iray ary manolora commande + acompte.",
      tool: "simulation", toolLabel: "🎯 Simulation",
      mistake: "Mampidina prix avy hatrany."
    },
    {
      goal: "Ny client efa nividy no mora indrindra hividy indray.",
      steps: [
        "Alefaso ny reçu sy ny fisaorana.",
        "Angataho ny retour sy ny avis.",
        "Tehirizo ny client ho an'ny vente manaraka."
      ],
      action: "Alefaso ny reçu, angataho ny retour ary tehirizo ny client.",
      tool: "receipt", toolLabel: "🧾 Reçu",
      mistake: "Manadino ny client aorian'ny vente."
    }
  ];

  function groupButtons() {
    return `
      <div class="result-actions">

        <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappGroup)}">
          👥 Groupe formation
        </button>

        <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappPractice)}">
          🧪 Groupe fanandramana
        </button>

        <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappReturn)}">
          📝 Groupe retour
        </button>

      </div>
    `;
  }

  function renderGuideTool(c) {
    c.innerHTML =
      head(
        "GUIDE",
        "📘 Guide Formation",
        "Lesona, hetsika sy fanazaran-tena isan'andro (7 andro)."
      ) +

      `

      <div class="info-box">

        <p>
          <strong>Dingana:</strong>
          1) Mianara ny lesona androany →
          2) Ataovy ny fanazaran-tena ao amin'ny site →
          3) Zarao ao amin'ny groupe fanandramana →
          4) Rehefa vita ny formation dia manaova retour.
        </p>

        ${groupButtons()}

      </div>

      <div class="guide-content">

        ${days.map(
          (d, i) => `

            <div class="guide-step">

              <span>${i + 1}</span>

              <div>

                <h3>${esc(d[0])}</h3>

                <p>${esc(d[1])}</p>

                <details>

                  <summary>Hijery ny lesona</summary>

                  <p><strong>Tanjona:</strong> ${esc(DAY_GUIDE[i].goal)}</p>

                  <ol>
                    ${DAY_GUIDE[i].steps.map((s) => `<li>${esc(s)}</li>`).join("")}
                  </ol>

                  <p><strong>Hetsika androany:</strong> ${esc(DAY_GUIDE[i].action)}</p>

                  <p>⚠️ <strong>Diso tokony hialana:</strong> ${esc(DAY_GUIDE[i].mistake)}</p>

                  <button type="button" class="btn btn-primary" data-tool="${DAY_GUIDE[i].tool}">
                    ${DAY_GUIDE[i].toolLabel}
                  </button>

                </details>

              </div>

            </div>

          `
        ).join("")}

      </div>

      `;
  }

  /* =========================================================
     10. CHALLENGE
     ========================================================= */

  function renderChallengeTool(c) {
    const draw = () => {
      const done = state.challenge.length;

      c.innerHTML =
        head(
          "CHALLENGE",
          "🏆 Challenge 7 Jours",
          "Action → Résultat → Retour. Isan'andro: hetsika iray, vokatra iray, fanamarihana iray."
        ) +

        `

        <div class="challenge-list">

          ${days.map(
            (d, i) => `

              <div class="challenge-item">

                <label>

                  <input
                    type="checkbox"
                    data-day="${i}"
                    ${state.challenge.includes(i) ? "checked" : ""}
                  >

                  <span class="challenge-check">${i + 1}</span>

                  <span>

                    <strong>${esc(d[0])}</strong>

                    <small>${esc(DAY_GUIDE[i].action)}</small>

                  </span>

                </label>

                <textarea
                  rows="2"
                  data-note="${i}"
                  placeholder="Résultat: inona no vokatra? (client, commande, sary...)"
                >${esc(state.challengeNotes[i] || "")}</textarea>

                <button type="button" class="btn btn-secondary" data-tool="${DAY_GUIDE[i].tool}">
                  ${DAY_GUIDE[i].toolLabel}
                </button>

              </div>

            `
          ).join("")}

        </div>

        <div class="challenge-progress">

          <strong>${done}/7 vita</strong>

          <div class="progress-track">

            <i style="width:${(done / 7) * 100}%"></i>

          </div>

        </div>

        ${
          done === 7
            ? `
              <div class="result-card result-positive">

                <strong>🎉 Arahabaina! Vita ny challenge 7 andro.</strong>

                <p>
                  Manaova retour ankehitriny: lazao ny nianaranao, ny nampiharinao ary ny vokatra azonao.
                </p>

                <div class="result-actions">

                  <button type="button" class="btn btn-primary" data-modal-open="reviewModal">
                    ⭐ Manaova avis
                  </button>

                  <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappReturn)}">
                    📝 Groupe retour
                  </button>

                </div>

              </div>
            `
            : `
              <div class="result-actions">

                <button type="button" class="btn btn-secondary" data-external="${esc(CONFIG.whatsappPractice)}">
                  🧪 Zarao ao amin'ny groupe fanandramana
                </button>

              </div>
            `
        }

        `;

      c.querySelectorAll("[data-day]").forEach((cb) => {
        cb.addEventListener("change", () => {
          const i = num(cb.dataset.day);

          state.challenge = cb.checked
            ? [...new Set([...state.challenge, i])]
            : state.challenge.filter((x) => x !== i);

          touch();

          draw();
        });
      });

      c.querySelectorAll("[data-note]").forEach((ta) => {
        ta.addEventListener("change", () => {
          state.challengeNotes[ta.dataset.note] = ta.value;

          touch();
        });
      });
    };

    draw();
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function updateDashboard() {
    const set = (id, v) => {
      const el = $(id);

      if (el) {
        el.textContent = v;
      }
    };

    const ev = state.evaluations;

    const sum = (arr, key) =>
      arr.reduce((s, x) => s + num(x[key]), 0);

    set("statCalculations", state.calculations.length);

    set("statOrders", state.orders.length + sum(ev, "orders"));

    set(
      "statRevenue",
      money(sum(state.orders.filter((o) => o.status !== "Annulé"), "total") + sum(ev, "revenue"))
    );

    set(
      "statProfit",
      money(sum(state.calculations, "profit") + sum(ev, "profit"))
    );

    const f = {
      Prospects: sum(ev, "prospects"),
      Responses: sum(ev, "responses"),
      Discussions: sum(ev, "discussions"),
      Orders: state.orders.length + sum(ev, "orders"),
      Clients: state.orders.filter(
        (o) => o.status === "Payé" || o.status === "Livré"
      ).length
    };

    const max = Math.max(...Object.values(f), 1);

    Object.entries(f).forEach(([key, value]) => {
      const bar = $("funnel" + key);

      if (bar) {
        bar.style.width = (value / max) * 100 + "%";
      }

      set("funnel" + key + "Count", value);
    });

    const rc = $("recentCalculations");

    if (rc) {
      rc.innerHTML = state.calculations.length
        ? state.calculations
            .slice(-5)
            .reverse()
            .map(
              (x) => `

                <div class="dashboard-item">

                  <div>

                    <strong>${esc(x.product || x.animal)}</strong>

                    <small>${fmtDate(x.date)}</small>

                  </div>

                  <strong>${money(x.profit)}</strong>

                </div>

              `
            )
            .join("")
        : `
            <p>Aucun calcul mbola vita.</p>
          `;
    }

    const ro = $("recentOrders");

    if (ro) {
      ro.innerHTML = state.orders.length
        ? state.orders
            .slice(-5)
            .reverse()
            .map(
              (x) => `

                <div class="dashboard-item">

                  <div>

                    <strong>${esc(x.client)}</strong>

                    <small>
                      ${fmtDate(x.date)} • ${esc(x.status)}
                    </small>

                  </div>

                  <strong>${money(x.total)}</strong>

                </div>

              `
            )
            .join("")
        : `
            <p>Aucune commande mbola voatahiry.</p>
          `;
    }
  }

  /* =========================================================
     EVALUATION
     ========================================================= */

  function initEvaluation() {
    const f = $("evaluationForm");

    if (!f) return;

    f.addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(f);

      const row = {
        ...d,
        date: new Date().toISOString()
      };

      [
        "views",
        "messages",
        "prospects",
        "responses",
        "discussions",
        "orders",
        "revenue",
        "profit"
      ].forEach((key) => {
        row[key] = num(row[key]);
      });

      state.evaluations.push(row);

      touch();

      remote("evaluations", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(row)
      });

      f.reset();

      updateDashboard();

      toast("Misaotra! Voatahiry ny retour.");
    });
  }

  /* =========================================================
     AVIS / REVIEWS
     ========================================================= */

  function renderReviews() {
    const box = $("reviewsList");

    if (!box) return;

    /*
     * Raha tsy mbola misy avis,
     * tokony hamafa ny contenu taloha
     * koa mba tsy hijanona rehefa Reset.
     */

    if (!state.localReviews.length) {
      box.innerHTML = `

        <div class="empty-state">

          <p>
            Tsy mbola misy avis eto.
            Aoka ianao ho voalohany
            hizara expérience.
          </p>

        </div>

      `;

      return;
    }

    box.innerHTML = state.localReviews
      .slice()
      .reverse()
      .map(
        (r) => `

          <div class="review-card">

            <div class="review-header">

              <strong>${esc(r.name)}</strong>

              <span>${"⭐".repeat(num(r.rating))}</span>

            </div>

            ${
              r.learning
                ? `
                  <p>
                    <strong>Nianarana:</strong>
                    ${esc(r.learning)}
                  </p>
                `
                : ""
            }

            ${
              r.applied
                ? `
                  <p>
                    <strong>Nampiharina:</strong>
                    ${esc(r.applied)}
                  </p>
                `
                : ""
            }

            ${
              r.result
                ? `
                  <p>
                    <strong>Résultat:</strong>
                    ${esc(r.result)}
                  </p>
                `
                : ""
            }

            ${
              r.message
                ? `
                  <blockquote>${esc(r.message)}</blockquote>
                `
                : ""
            }

          </div>

        `
      )
      .join("");
  }

  function initReviews() {
    const f = $("reviewForm");

    if (!f) return;

    f.addEventListener("submit", (e) => {
      e.preventDefault();

      const d = getData(f);

      const row = {
        ...d,
        date: new Date().toISOString()
      };

      delete row.consent;

      state.localReviews.push(row);

      touch();

      remote("reviews", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(row)
      });

      f.reset();

      closeModal("reviewModal");

      renderReviews();

      toast("Misaotra tamin'ny avis-nao!");
    });
  }

  /* =========================================================
     MODAL
     ========================================================= */

  function openModal(id) {
    const m = $(id);

    if (!m) return;

    m.classList.add("open");

    m.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
  }

  function closeModal(id) {
    const m = id ? $(id) : document.querySelector(".modal.open");

    if (!m) return;

    m.classList.remove("open");

    m.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");
  }

  /* =========================================================
     GLOBAL CLICKS
     ========================================================= */

  function initGlobalClicks() {
    document.addEventListener("click", (e) => {
      const t = e.target;

      let el;

      /* Modal open */
      if ((el = t.closest("[data-modal-open]"))) {
        return openModal(el.dataset.modalOpen);
      }

      /* Modal close */
      if (t.closest("[data-modal-close]")) {
        return closeModal();
      }

      /* Click outside modal */
      if (t.classList && t.classList.contains("modal")) {
        return closeModal();
      }

      /* Copy */
      if ((el = t.closest("[data-copy]"))) {
        const src = $(el.dataset.copy);

        return src && copyText(src.innerText);
      }

      /* External links */
      if ((el = t.closest("[data-external]")) && el.dataset.external) {
        return window.open(el.dataset.external, "_blank", "noopener,noreferrer");
      }

      /* WhatsApp */
      if (
        t.closest("[data-whatsapp-purchase]") ||
        t.closest("[data-whatsapp]")
      ) {
        return window.open(
          CONFIG.whatsappPurchase,
          "_blank",
          "noopener,noreferrer"
        );
      }

      /* Reset data */
      if (t.closest("[data-reset-data]")) {
        if (confirm("Hamafa ny données rehetra ao amin'ity appareil ity?")) {
          state = clone(defaults);

          saveState();

          updateDashboard();

          renderReviews();

          toast("Voafafa ny données.", "warning");
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  /* =========================================================
     SUPABASE
     ========================================================= */

  function initSupabase() {
    try {
      if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        sb = window.supabase.createClient(
          CONFIG.supabaseUrl,
          CONFIG.supabaseKey
        );
      }
    } catch (e) {
      console.warn("Supabase tsy misy:", e);

      sb = null;
    }
  }

  /* =========================================================
     INITIALISATION
     ========================================================= */

  function init() {
    initTools();

    initGlobalClicks();

    initEvaluation();

    initReviews();

    renderReviews();

    updateDashboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", initSupabase);

  /* =========================================================
     FARAN'NY APP.JS
     ========================================================= */
})();
