/* ============================================================
   TANTSAHA MATIHANINA • VENTE LAB
   APP.JS — VERSION PRATIQUE COMPLETE
   Mianatra • Mampihatra • Mahomby
============================================================ */

(function () {
  "use strict";

  /* ==========================================================
     1. CONFIGURATION
  ========================================================== */

  const CONFIG = {
    brand: "TANTSAHA MATIHANINA",
    whatsappGroup:
      "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",
    whatsappPurchase:
      "https://wa.me/261385651378",
    facebook:
      "https://www.facebook.com/share/1Zfiu8oj3m/",
    pdfPrice: 5000,

    supabaseUrl:
      "https://sdzybetralbaincrxddf.supabase.co",

    supabaseKey:
      "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"
  };

  const STORAGE_KEY = "tm_vente_lab_state_v3";

  /* ==========================================================
     2. STATE
  ========================================================== */

  const defaultState = {
    calculations: [],
    orders: [],
    evaluations: [],
    localReviews: [],
    prospects: [],
    calendarPlans: [],
    lastActivity: null
  };

  let state = loadState();

  let supabaseClient = null;

  /* ==========================================================
     3. INIT SUPABASE
  ========================================================== */

  function initSupabase() {
    try {
      if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        supabaseClient = window.supabase.createClient(
          CONFIG.supabaseUrl,
          CONFIG.supabaseKey
        );
      }
    } catch (error) {
      console.warn("Supabase non disponible:", error);
      supabaseClient = null;
    }
  }

  /* ==========================================================
     4. STORAGE
  ========================================================== */

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return structuredCloneSafe(defaultState);
      }

      const parsed = JSON.parse(raw);

      return {
        ...structuredCloneSafe(defaultState),
        ...parsed
      };
    } catch (error) {
      console.warn("Erreur localStorage:", error);
      return structuredCloneSafe(defaultState);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn("Impossible de sauvegarder:", error);
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(date) {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "—";
    }

    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function formatMoney(value) {
    const number = Number(value) || 0;

    return number.toLocaleString("fr-FR") + " Ar";
  }

  function numberValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ==========================================================
     5. TOAST
  ========================================================== */

  function showToast(message, type = "success") {
    let toast = document.getElementById("toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  /* ==========================================================
     6. MOBILE NAVIGATION
  ========================================================== */

  function initNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.setAttribute(
        "aria-expanded",
        nav.classList.contains("open")
      );
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ==========================================================
     7. SMOOTH SCROLL
  ========================================================== */

  function initSmoothScroll() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');

      if (!link) return;

      const id = link.getAttribute("href");

      if (!id || id === "#") return;

      const target = document.querySelector(id);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  /* ==========================================================
     8. EXTERNAL LINKS
  ========================================================== */

  function initExternalLinks() {
    document.querySelectorAll("[data-external]").forEach((element) => {
      element.addEventListener("click", () => {
        const destination = element.dataset.external;

        if (!destination) return;

        window.open(destination, "_blank", "noopener,noreferrer");
      });
    });

    document.querySelectorAll("[data-whatsapp]").forEach((element) => {
      element.addEventListener("click", () => {
        window.open(
          CONFIG.whatsappPurchase,
          "_blank",
          "noopener,noreferrer"
        );
      });
    });
  }

  /* ==========================================================
     9. TOOL WORKSPACE
  ========================================================== */

  function initTools() {
    const buttons = document.querySelectorAll("[data-tool]");
    const workspace = document.getElementById("toolWorkspace");

    if (!workspace || !buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const tool = button.dataset.tool;

        openTool(tool);

        workspace.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    });
  }

  function openTool(tool) {
    const workspace = document.getElementById("toolWorkspace");

    if (!workspace) return;

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
      workspace.innerHTML = `
        <div class="workspace-empty">
          <h3>Outil mbola tsy voaomana</h3>
          <p>Hampidirina amin'ny version manaraka.</p>
        </div>
      `;
      return;
    }

    tools[tool](workspace);

    workspace.dataset.activeTool = tool;
  }

  /* ==========================================================
     10. PRICE & PROFIT
  ========================================================== */

  function renderPriceTool(container) {
    container.innerHTML = `
      <div class="workspace-header">
        <span class="eyebrow">LAB 01</span>
        <h2>Kajy Prix & Tombony</h2>
        <p>
          Fantaro aloha ny coût, ny prix de vente ary ny tombony
          vao mamorona offre.
        </p>
      </div>

      <form id="priceForm" class="lab-form">

        <div class="form-grid">

          <label>
            Vokatra
            <input
              type="text"
              name="product"
              placeholder="Ohatra: Akoho Gasy"
              required
            >
          </label>

          <label>
            Isan'ny vokatra
            <input
              type="number"
              name="quantity"
              min="1"
              value="1"
              required
            >
          </label>

          <label>
            Coût total
            <input
              type="number"
              name="cost"
              min="0"
              placeholder="Ohatra: 60000"
              required
            >
          </label>

          <label>
            Prix de vente / unité
            <input
              type="number"
              name="price"
              min="0"
              placeholder="Ohatra: 30000"
              required
            >
          </label>

        </div>

        <button class="btn btn-primary" type="submit">
          🧮 Kajio ny tombony
        </button>
      </form>

      <div id="priceResult" class="lab-result"></div>
    `;

    const form = document.getElementById("priceForm");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);

      const product = data.get("product");
      const quantity = numberValue(data.get("quantity"));
      const cost = numberValue(data.get("cost"));
      const price = numberValue(data.get("price"));

      const revenue = quantity * price;
      const profit = revenue - cost;

      const margin =
        revenue > 0
          ? (profit / revenue) * 100
          : 0;

      const result = {
        date: new Date().toISOString(),
        product,
        quantity,
        cost,
        price,
        revenue,
        profit,
        margin
      };

      state.calculations.push(result);
      state.lastActivity = new Date().toISOString();

      saveState();

      renderPriceResult(result);
      updateDashboard();

      showToast("Kajy vita ary voatahiry.");
    });
  }

  function renderPriceResult(result) {
    const box = document.getElementById("priceResult");

    if (!box) return;

    const positive = result.profit >= 0;

    box.innerHTML = `
      <div class="result-card ${positive ? "result-positive" : "result-negative"}">

        <div class="result-title">
          ${positive ? "✅ Mahazo tombony" : "⚠️ Misy fatiantoka"}
        </div>

        <div class="result-grid">

          <div>
            <span>Vola miditra</span>
            <strong>${formatMoney(result.revenue)}</strong>
          </div>

          <div>
            <span>Coût</span>
            <strong>${formatMoney(result.cost)}</strong>
          </div>

          <div>
            <span>Tombony</span>
            <strong>${formatMoney(result.profit)}</strong>
          </div>

          <div>
            <span>Margin</span>
            <strong>${result.margin.toFixed(2)}%</strong>
          </div>

        </div>

        <div class="result-advice">
          ${
            positive
              ? "Afaka mandroso amin'ny famoronana offre sy publication ianao."
              : "Avereno jerena ny coût na ny prix de vente alohan'ny hivarotana."
          }
        </div>

      </div>
    `;
  }

  /* ==========================================================
     11. LIVESTOCK CALCULATOR
  ========================================================== */

  function renderLivestockTool(container) {
    container.innerHTML = `
      <div class="workspace-header">
        <span class="eyebrow">LAB 02</span>
        <h2>Kajy Fiompiana</h2>

        <p>
          Ampidiro ny karazana biby, isan'ny biby ary ny dépenses
          hahitana ny coût sy ny potentiel de vente.
        </p>
      </div>

      <form id="livestockForm" class="lab-form">

        <div class="form-grid">

          <label>
            Karazana
            <select name="animal" required>
              <option value="">-- Misafidiana --</option>
              <option>Akoho Gasy</option>
              <option>Pondeuse</option>
              <option>Poulet de chair</option>
              <option>Kisoa</option>
              <option>Osy</option>
              <option>Ondry</option>
              <option>Bitro</option>
              <option>Gana</option>
              <option>Gisa</option>
              <option>Vorontsiloza</option>
              <option>Omby</option>
            </select>
          </label>

          <label>
            Isan'ny biby
            <input
              type="number"
              name="quantity"
              min="1"
              value="10"
              required
            >
          </label>

          <label>
            Coût sakafo
            <input
              type="number"
              name="feed"
              min="0"
              value="0"
            >
          </label>

          <label>
            Fanafody / vaksiny
            <input
              type="number"
              name="health"
              min="0"
              value="0"
            >
          </label>

          <label>
            Achat biby
            <input
              type="number"
              name="purchase"
              min="0"
              value="0"
            >
          </label>

          <label>
            Dépenses hafa
            <input
              type="number"
              name="other"
              min="0"
              value="0"
            >
          </label>

          <label>
            Prix de vente / biby
            <input
              type="number"
              name="salePrice"
              min="0"
              value="0"
            >
          </label>

        </div>

        <button class="btn btn-primary" type="submit">
          🐓 Kajio ny fiompiana
        </button>

      </form>

      <div id="livestockResult" class="lab-result"></div>
    `;

    document
      .getElementById("livestockForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);

        const animal = data.get("animal");
        const quantity = numberValue(data.get("quantity"));
        const feed = numberValue(data.get("feed"));
        const health = numberValue(data.get("health"));
        const purchase = numberValue(data.get("purchase"));
        const other = numberValue(data.get("other"));
        const salePrice = numberValue(data.get("salePrice"));

        const cost =
          feed +
          health +
          purchase +
          other;

        const revenue =
          quantity * salePrice;

        const profit =
          revenue - cost;

        const costPerAnimal =
          quantity > 0
            ? cost / quantity
            : 0;

        const result = {
          date: new Date().toISOString(),
          animal,
          quantity,
          feed,
          health,
          purchase,
          other,
          salePrice,
          cost,
          revenue,
          profit,
          costPerAnimal
        };

        state.calculations.push(result);
        state.lastActivity = new Date().toISOString();

        saveState();

        document.getElementById("livestockResult").innerHTML = `
          <div class="result-card">

            <div class="result-title">
              ${escapeHTML(animal)} — Résultat
            </div>

            <div class="result-grid">

              <div>
                <span>Isan'ny biby</span>
                <strong>${quantity}</strong>
              </div>

              <div>
                <span>Coût total</span>
                <strong>${formatMoney(cost)}</strong>
              </div>

              <div>
                <span>Coût / biby</span>
                <strong>${formatMoney(costPerAnimal)}</strong>
              </div>

              <div>
                <span>Vola miditra</span>
                <strong>${formatMoney(revenue)}</strong>
              </div>

              <div>
                <span>Tombony</span>
                <strong>${formatMoney(profit)}</strong>
              </div>

            </div>

            <div class="result-advice">
              ${
                profit > 0
                  ? "Tsara: afaka manohy amin'ny préparation de vente ianao."
                  : "Tandremo: mety tsy hahazo tombony amin'ity prix ity."
              }
            </div>

          </div>
        `;

        updateDashboard();

        showToast("Kajy fiompiana vita.");
      });
  }

  /* ==========================================================
     12. CALENDRIER MPIOMPY & VENTE
  ========================================================== */

  const animalProfiles = {
    "Akoho Gasy": {
      defaultDays: 150,
      minDays: 120,
      maxDays: 210
    },

    "Pondeuse": {
      defaultDays: 140,
      minDays: 120,
      maxDays: 180
    },

    "Poulet de chair": {
      defaultDays: 45,
      minDays: 35,
      maxDays: 60
    },

    "Kisoa": {
      defaultDays: 180,
      minDays: 150,
      maxDays: 240
    },

    "Bitro": {
      defaultDays: 90,
      minDays: 70,
      maxDays: 120
    },

    "Gana": {
      defaultDays: 100,
      minDays: 80,
      maxDays: 130
    },

    "Gisa": {
      defaultDays: 150,
      minDays: 120,
      maxDays: 200
    },

    "Vorontsiloza": {
      defaultDays: 150,
      minDays: 120,
      maxDays: 200
    },

    "Osy": {
      defaultDays: 240,
      minDays: 180,
      maxDays: 300
    },

    "Ondry": {
      defaultDays: 240,
      minDays: 180,
      maxDays: 300
    }
  };

  function renderCalendarTool(container) {
    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 10 • OUTIL STRATÉGIQUE</span>

        <h2>📅 Calendrier Mpiompy & Vente</h2>

        <p>
          Tsy ny daty hivarotana ihany no kajiana.
          Hamboarina miaraka aminao ny plan:
          fiompiana → préparation → prospection → publication
          → commande → vente → suivi.
        </p>

      </div>

      <div class="info-box">

        <strong>Ahoana no fampiasana azy?</strong>

        <ol>
          <li>Safidio ny karazana biby.</li>
          <li>Apidiro ny daty nanombohana.</li>
          <li>Raha fantatra dia ampidiro ny taona/andro ananany.</li>
          <li>Raha fantatra dia ampidiro ny lanja.</li>
          <li>Tsindrio <strong>Hamorona Calendrier</strong>.</li>
        </ol>

        <p>
          ⚠️ Tombana ihany ny daty. Ny lanja, fahasalamana,
          sakafo, tahan'ny fitomboana ary vidin'ny tsena no
          tokony hanamafy ny tena fotoana hivarotana.
        </p>

      </div>

      <form id="calendarForm" class="lab-form">

        <div class="form-grid">

          <label>
            Karazana biby
            <select name="animal" required>
              <option value="">-- Misafidiana --</option>
              <option>Akoho Gasy</option>
              <option>Pondeuse</option>
              <option>Poulet de chair</option>
              <option>Kisoa</option>
              <option>Bitro</option>
              <option>Gana</option>
              <option>Gisa</option>
              <option>Vorontsiloza</option>
              <option>Osy</option>
              <option>Ondry</option>
            </select>
          </label>

          <label>
            Isan'ny biby
            <input
              type="number"
              name="quantity"
              min="1"
              value="10"
              required
            >
          </label>

          <label>
            Daty nanombohana
            <input
              type="date"
              name="startDate"
              value="${todayISO()}"
              required
            >
          </label>

          <label>
            Taona/andro ananan'ny biby izao
            <input
              type="number"
              name="currentAge"
              min="0"
              placeholder="Ohatra: 30"
            >
            <small>
              Azo avela ho 0 raha vao manomboka.
            </small>
          </label>

          <label>
            Unité
            <select name="ageUnit">
              <option value="days">Andro</option>
              <option value="weeks">Herinandro</option>
              <option value="months">Volana</option>
            </select>
          </label>

          <label>
            Lanja ankehitriny (kg)
            <input
              type="number"
              name="weight"
              min="0"
              step="0.01"
              placeholder="Raha fantatra"
            >
          </label>

          <label>
            Coût efa lany (Ar)
            <input
              type="number"
              name="cost"
              min="0"
              value="0"
            >
          </label>

          <label>
            Prix vinavinana / biby (Ar)
            <input
              type="number"
              name="salePrice"
              min="0"
              value="0"
            >
          </label>

        </div>

        <label class="checkbox-row">
          <input
            type="checkbox"
            name="marketReady"
          >
          <span>
            Efa manana mpividy / marché kendrena ve?
          </span>
        </label>

        <button
          class="btn btn-primary"
          type="submit"
        >
          📅 Hamorona Calendrier
        </button>

      </form>

      <div id="calendarResult" class="lab-result"></div>
    `;

    const form =
      document.getElementById("calendarForm");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);

      const animal = data.get("animal");
      const quantity = numberValue(data.get("quantity"));
      const startDate = data.get("startDate");
      const currentAge = numberValue(data.get("currentAge"));
      const ageUnit = data.get("ageUnit");
      const weight = numberValue(data.get("weight"));
      const cost = numberValue(data.get("cost"));
      const salePrice = numberValue(data.get("salePrice"));
      const marketReady =
        data.get("marketReady") === "on";

      const profile =
        animalProfiles[animal] || {
          defaultDays: 90,
          minDays: 60,
          maxDays: 120
        };

      let ageDays = currentAge;

      if (ageUnit === "weeks") {
        ageDays = currentAge * 7;
      }

      if (ageUnit === "months") {
        ageDays = currentAge * 30;
      }

      /*
        Ny "startDate" dia raisina ho daty nanombohana
        ny fiompiana/lot.
        Raha misy age > 0 dia esorina amin'ny durée cible.
      */

      let remainingDays =
        profile.defaultDays - ageDays;

      if (remainingDays < 7) {
        remainingDays = 7;
      }

      /*
        Lanja dia ampiasaina ho signal fanitsiana kely,
        fa TSY milaza fa vonona hivarotra noho ny lanja fotsiny.
      */

      if (weight > 0) {
        if (
          animal === "Poulet de chair" &&
          weight >= 1.8
        ) {
          remainingDays = Math.min(
            remainingDays,
            14
          );
        }

        if (
          animal === "Akoho Gasy" &&
          weight >= 1.2
        ) {
          remainingDays = Math.min(
            remainingDays,
            30
          );
        }
      }

      const saleDate =
        addDays(startDate, remainingDays);

      const prospectDate =
        addDays(saleDate, -14);

      const publicationDate =
        addDays(saleDate, -7);

      const followupDate =
        addDays(saleDate, -3);

      const confirmationDate =
        addDays(saleDate, -1);

      const afterSaleDate =
        addDays(saleDate, 1);

      const revenue =
        quantity * salePrice;

      const estimatedProfit =
        revenue - cost;

      const plan = {
        id: "cal_" + Date.now(),

        createdAt:
          new Date().toISOString(),

        animal,
        quantity,
        startDate,
        currentAge,
        ageUnit,
        ageDays,
        weight,
        cost,
        salePrice,
        marketReady,

        remainingDays,

        saleDate,
        prospectDate,
        publicationDate,
        followupDate,
        confirmationDate,
        afterSaleDate,

        revenue,
        estimatedProfit
      };

      state.calendarPlans.push(plan);
      state.lastActivity =
        new Date().toISOString();

      saveState();

      renderCalendarResult(plan);

      showToast(
        "Calendrier de vente voaforona."
      );
    });
  }

  function addDays(dateString, days) {
    const date = new Date(dateString + "T12:00:00");

    date.setDate(
      date.getDate() + Number(days)
    );

    return date.toISOString().slice(0, 10);
  }

  function renderCalendarResult(plan) {
    const box =
      document.getElementById("calendarResult");

    if (!box) return;

    const profitClass =
      plan.estimatedProfit >= 0
        ? "result-positive"
        : "result-negative";

    box.innerHTML = `
      <div class="result-card ${profitClass}">

        <div class="result-title">
          📅 Plan de Vente —
          ${escapeHTML(plan.animal)}
        </div>

        <div class="result-summary">

          <p>
            <strong>${plan.quantity}</strong>
            biby
          </p>

          <p>
            Daty tombanana:
            <strong>${formatDate(plan.saleDate)}</strong>
          </p>

          <p>
            Fotoana mbola ilaina:
            <strong>${plan.remainingDays} andro</strong>
          </p>

        </div>

        <div class="calendar-timeline">

          ${calendarEvent(
            "🔎",
            "Mitady prospects",
            plan.prospectDate,
            "Atombohy ny fitadiavana olona tena mety hividy."
          )}

          ${calendarEvent(
            "📢",
            "Publication",
            plan.publicationDate,
            "Asehoy ny biby/vokatra, ny tombony ary ny CTA."
          )}

          ${calendarEvent(
            "💬",
            "Relance",
            plan.followupDate,
            "Mifandraisa indray amin'ireo olona namaly."
          )}

          ${calendarEvent(
            "📦",
            "Confirmation",
            plan.confirmationDate,
            "Hamafiso ny quantité, prix, toerana ary fotoana."
          )}

          ${calendarEvent(
            "💰",
            "Vente",
            plan.saleDate,
            "Ataovy ny vente ary mamoròna reçu."
          )}

          ${calendarEvent(
            "🤝",
            "Suivi après-vente",
            plan.afterSaleDate,
            "Anontanio raha afa-po ny client ary tadiavo ny prochaine commande."
          )}

        </div>

        <div class="result-grid">

          <div>
            <span>Coût efa lany</span>
            <strong>${formatMoney(plan.cost)}</strong>
          </div>

          <div>
            <span>CA vinavinana</span>
            <strong>${formatMoney(plan.revenue)}</strong>
          </div>

          <div>
            <span>Tombony vinavinana</span>
            <strong>${formatMoney(plan.estimatedProfit)}</strong>
          </div>

        </div>

        <div class="result-advice">

          <strong>👉 Dingana manaraka:</strong>

          ${
            plan.marketReady
              ? "Efa manana marché kendrena ianao. Atombohy ny qualification des prospects."
              : "Mbola tsy manana mpividy voamarina ianao. Aza miandry ny andro hivarotana vao mitady client."
          }

        </div>

        <div class="result-actions">

          <button
            class="btn btn-secondary"
            type="button"
            data-open-next="offer"
          >
            ✍️ Mamorona Offre
          </button>

          <button
            class="btn btn-secondary"
            type="button"
            data-open-next="publication"
          >
            📢 Mamorona Publication
          </button>

          <button
            class="btn btn-secondary"
            type="button"
            data-open-next="order"
          >
            📦 Commande
          </button>

        </div>

        <div class="warning-box">
          ⚠️ <strong>Zava-dehibe:</strong>
          estimation pédagogique ity calendrier ity.
          Tsy tokony hamidy noho ny daty fotsiny ny biby.
          Jereo hatrany ny lanja, fahasalamana,
          sakafo, coût réel ary prix marché.
        </div>

      </div>
    `;

    box
      .querySelectorAll("[data-open-next]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const tool =
            button.dataset.openNext;

          openTool(tool);

          document
            .getElementById("toolWorkspace")
            ?.scrollIntoView({
              behavior: "smooth"
            });
        });
      });
  }

  function calendarEvent(
    icon,
    title,
    date,
    description
  ) {
    return `
      <div class="calendar-event">

        <div class="calendar-event-icon">
          ${icon}
        </div>

        <div class="calendar-event-content">

          <strong>${title}</strong>

          <span class="calendar-date">
            ${formatDate(date)}
          </span>

          <p>
            ${description}
          </p>

        </div>

      </div>
    `;
  }

  /* ==========================================================
     13. OFFER CREATOR
  ========================================================== */

  function renderOfferTool(container) {
    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 03</span>

        <h2>✍️ Créer une Offre</h2>

        <p>
          Ataovy mazava ny vokatra, ny tombony,
          ny prix ary ny antso ho amin'ny action.
        </p>

      </div>

      <form id="offerForm" class="lab-form">

        <div class="form-grid">

          <label>
            Vokatra
            <input
              name="product"
              placeholder="Akoho Gasy"
              required
            >
          </label>

          <label>
            Client cible
            <input
              name="client"
              placeholder="Mpianakavy / restaurant / revendeur"
              required
            >
          </label>

          <label>
            Tombony lehibe
            <input
              name="benefit"
              placeholder="Vonona hatao sakafo..."
              required
            >
          </label>

          <label>
            Prix
            <input
              type="number"
              name="price"
              placeholder="30000"
              required
            >
          </label>

          <label>
            Quantité
            <input
              type="number"
              name="quantity"
              value="1"
            >
          </label>

          <label>
            Toerana
            <input
              name="location"
              placeholder="Mahanoro..."
            >
          </label>

        </div>

        <button class="btn btn-primary" type="submit">
          ✨ Mamorona Offre
        </button>

      </form>

      <div id="offerResult" class="lab-result"></div>
    `;

    document
      .getElementById("offerForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();

        const data =
          new FormData(event.currentTarget);

        const product =
          data.get("product");

        const client =
          data.get("client");

        const benefit =
          data.get("benefit");

        const price =
          numberValue(data.get("price"));

        const quantity =
          numberValue(data.get("quantity"));

        const location =
          data.get("location");

        const offer = `
🔥 OFFRE DISPONIBLE — ${product}

Mitady ${client} ve ianao?

✅ ${benefit}

📦 Quantité: ${quantity}
💰 Prix: ${formatMoney(price)}
📍 Toerana: ${location || "Antsoy/MP"}

📩 Raha liana ianao dia manorata MP
na mifandraisa aminay.
        `.trim();

        document.getElementById(
          "offerResult"
        ).innerHTML = `
          <div class="result-card">

            <div class="result-title">
              Offre vonona
            </div>

            <pre class="generated-text">${escapeHTML(offer)}</pre>

            <button
              class="btn btn-secondary"
              type="button"
              id="copyOffer"
            >
              📋 Adikao
            </button>

          </div>
        `;

        document
          .getElementById("copyOffer")
          .addEventListener("click", () => {
            copyText(offer);
          });

        showToast("Offre voaforona.");
      });
  }

  /* ==========================================================
     14. PUBLICATION
  ========================================================== */

  function renderPublicationTool(container) {
    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 04</span>

        <h2>📢 Publication</h2>

        <p>
          Ampiasao ny formule:
          Hook → Problème → Solution → Offre → Preuve → Prix → CTA.
        </p>

      </div>

      <form id="publicationForm" class="lab-form">

        <div class="form-grid">

          <label>
            Vokatra
            <input
              name="product"
              placeholder="Poulet de chair"
              required
            >
          </label>

          <label>
            Olana / besoin
            <input
              name="problem"
              placeholder="Mitady akoho vonona..."
              required
            >
          </label>

          <label>
            Solution / tombony
            <input
              name="solution"
              placeholder="Akoho salama..."
              required
            >
          </label>

          <label>
            Prix
            <input
              type="number"
              name="price"
              required
            >
          </label>

          <label>
            Quantité disponible
            <input
              type="number"
              name="quantity"
              value="10"
            >
          </label>

          <label>
            Toerana
            <input
              name="location"
              placeholder="Toerana"
            >
          </label>

        </div>

        <button
          class="btn btn-primary"
          type="submit"
        >
          📢 Mamorona Publication
        </button>

      </form>

      <div id="publicationResult"
           class="lab-result">
      </div>
    `;

    document
      .getElementById("publicationForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();

        const data =
          new FormData(event.currentTarget);

        const product =
          data.get("product");

        const problem =
          data.get("problem");

        const solution =
          data.get("solution");

        const price =
          numberValue(data.get("price"));

        const quantity =
          numberValue(data.get("quantity"));

        const location =
          data.get("location");

        const publication = `
🔥 MITADY ${product} VE IANAO?

${problem}

✅ Vahaolana:
${solution}

📦 Disponible: ${quantity}

💰 Prix: ${formatMoney(price)}

📍 ${location || "Toerana araka ny fifanarahana"}

📩 Manorata MP raha liana.

⚠️ Quantité voafetra — aza miandry ela.
        `.trim();

        document.getElementById(
          "publicationResult"
        ).innerHTML = `
          <div class="result-card">

            <div class="result-title">
              Publication vonona
            </div>

            <pre class="generated-text">${escapeHTML(publication)}</pre>

            <button
              class="btn btn-secondary"
              type="button"
              id="copyPublication"
            >
              📋 Adikao
            </button>

          </div>
        `;

        document
          .getElementById("copyPublication")
          .addEventListener("click", () => {
            copyText(publication);
          });

        showToast("Publication voaforona.");
      });
  }

  /* ==========================================================
     15. SIMULATION CLIENT
  ========================================================== */

  const simulationScenarios = [
    {
      client:
        "Lafo loatra ilay izy.",
      options: [
        "Eny, lafo tokoa.",
        "Azafady tompoko, inona no budget noeritreretinao? Afaka jerentsika izay quantité mifanaraka aminy.",
        "Tsy afaka mampidina prix aho."
      ],
      correct: 1
    },

    {
      client:
        "Mbola hieritreritra aho.",
      options: [
        "Eny ary.",
        "Tsy maninona tompoko. Inona indrindra no mbola tianao hohamarinina alohan'ny hanapahanao hevitra?",
        "Raha tsy mividy ianao dia tsy maninona."
      ],
      correct: 1
    },

    {
      client:
        "Misy remise ve?",
      options: [
        "Eny, ahena fotsiny.",
        "Miankina amin'ny quantité tompoko. Firy no ilainao dia kajiantsika izay offre mety?",
        "Tsy misy remise mihitsy."
      ],
      correct: 1
    },

    {
      client:
        "Aiza no misy anareo?",
      options: [
        "Eto Madagascar.",
        "Aiza no misy anao tompoko? Dia hojereko ny toerana sy ny fomba hahazoanao azy.",
        "Aza manahy fa halefanay."
      ],
      correct: 1
    },

    {
      client:
        "Alefaso aloha dia mandoa aho.",
      options: [
        "Eny, halefako.",
        "Andao aloha hamafisina ny commande sy ny fomba fandoavana ary ny fandefasana mba samy ho voaaro.",
        "Tsy azo atao."
      ],
      correct: 1
    }
  ];

  function renderSimulationTool(container) {
    const scenario =
      simulationScenarios[
        Math.floor(
          Math.random() *
          simulationScenarios.length
        )
      ];

    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 05</span>

        <h2>💬 Simulation Client</h2>

        <p>
          Mifidiana ny valiny tsara indrindra.
          Ny tanjona dia tsy ny hanery ny client,
          fa ny hahafantarana ny tena objection.
        </p>

      </div>

      <div class="simulation-card">

        <div class="client-message">
          <span>CLIENT</span>
          <strong>
            "${escapeHTML(scenario.client)}"
          </strong>
        </div>

        <div class="simulation-options">

          ${scenario.options
            .map(
              (option, index) => `
                <button
                  type="button"
                  class="simulation-option"
                  data-answer="${index}"
                >
/* ==========================================================
   15. SIMULATION CLIENT • GEMINI
========================================================== */

const simulationScenarios = [
  {
    title: "Client — Lafo loatra",
    objection: "Lafo loatra ilay izy.",
    objective:
      "Hahay hamantatra ny budget sy hanazava ny valeur fa tsy hifamaly amin'ny client."
  },

  {
    title: "Client — Mbola hieritreritra",
    objection: "Mbola hieritreritra aho.",
    objective:
      "Hahay hamantatra izay mbola mampisalasala ny client."
  },

  {
    title: "Client — Mitady remise",
    objection: "Misy remise ve?",
    objective:
      "Hahay hifampiraharaha amin'ny quantité sy offre fa tsy hampidina prix avy hatrany."
  },

  {
    title: "Client — Aiza no misy anareo?",
    objection: "Aiza no misy anareo?",
    objective:
      "Hahay hamantatra ny toerana misy ny client sy ny fomba livraison."
  },

  {
    title: "Client — Alefaso aloha",
    objection: "Alefaso aloha dia mandoa aho.",
    objective:
      "Hahay hiaro ny vendeur sy ny client amin'ny fomba fandoavana sy livraison mazava."
  }
];


function renderSimulationTool(container) {

  container.innerHTML = `

    <div class="workspace-header">

      <span class="eyebrow">LAB 05 • PRATIQUE</span>

      <h2>💬 Simulation Client</h2>

      <p>
        Manaova pratique toy ny hoe miresaka amin'ny client tena izy.
        Afaka mampiasa simulation rapide ianao na manao simulation
        libre miaraka amin'i Gemini.
      </p>

    </div>


    <div class="simulation-mode-grid">

      <button
        type="button"
        class="simulation-mode-card active"
        data-simulation-mode="quick"
      >
        <span class="simulation-mode-icon">🎯</span>

        <strong>Simulation Rapide</strong>

        <small>
          Misafidy valiny tsara indrindra
        </small>
      </button>


      <button
        type="button"
        class="simulation-mode-card"
        data-simulation-mode="gemini"
      >
        <span class="simulation-mode-icon">🤖</span>

        <strong>Simulation Libre</strong>

        <small>
          Client simulé avec Gemini
        </small>
      </button>

    </div>


    <div id="simulationQuick">

      <div class="simulation-card">

        <div class="simulation-config">

          <label>
            Scénario

            <select id="quickScenario">

              ${simulationScenarios
                .map(
                  (scenario, index) => `
                    <option value="${index}">
                      ${escapeHTML(scenario.title)}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>

        </div>


        <div
          id="quickScenarioContent"
          class="client-message"
        ></div>


        <div
          id="quickOptions"
          class="simulation-options"
        ></div>


        <div
          id="quickSimulationResult"
          class="lab-result"
        ></div>

      </div>

    </div>


    <div
      id="simulationGemini"
      class="simulation-gemini"
      hidden
    >

      <div class="gemini-intro">

        <div class="gemini-icon">
          🤖
        </div>

        <div>

          <h3>Simulation Client avec Gemini</h3>

          <p>
            Gemini jouera le rôle du client.
            Ianao kosa no vendeur.
            Aza mitady valiny mialoha: valio toy ny
            hoe miresaka amin'ny client tena izy ianao.
          </p>

        </div>

      </div>


      <div class="lab-form">

        <div class="form-grid">

          <label>
            Produit

            <select id="geminiProduct">

              <option>Akoho Gasy</option>
              <option>Pondeuse</option>
              <option>Poulet de chair</option>
              <option>Kisoa</option>
              <option>Bitro</option>
              <option>Osy</option>
              <option>Ondry</option>
              <option>Gana</option>
              <option>Gisa</option>
              <option>Vorontsiloza</option>
              <option>Tantely</option>
              <option>Masomboly</option>
              <option>Vokatra hafa</option>

            </select>

          </label>


          <label>
            Niveau

            <select id="geminiLevel">

              <option value="facile">
                🟢 Facile
              </option>

              <option value="intermediaire" selected>
                🟡 Intermédiaire
              </option>

              <option value="difficile">
                🟠 Difficile
              </option>

              <option value="expert">
                🔴 Client exigeant
              </option>

            </select>

          </label>


          <label>
            Scénario / Objection

            <select id="geminiScenario">

              ${simulationScenarios
                .map(
                  (scenario, index) => `
                    <option value="${index}">
                      ${escapeHTML(scenario.title)}
                    </option>
                  `
                )
                .join("")}

            </select>

          </label>

        </div>


        <label class="full-field">

          Information supplémentaire
          
          <textarea
            id="geminiContext"
            rows="3"
            placeholder="Ohatra: Vente ao amin'ny Facebook, client any Toamasina..."
          ></textarea>

        </label>


        <div class="gemini-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="generateGeminiPrompt"
          >
            ✨ Hamorona Prompt
          </button>

        </div>

      </div>


      <div
        id="geminiPromptBox"
        class="gemini-prompt-box"
        hidden
      >

        <div class="prompt-header">

          <div>
            <span class="eyebrow">
              PROMPT CLIENT
            </span>

            <h3>
              Vonona ampiasaina ao Gemini
            </h3>
          </div>

        </div>


        <textarea
          id="geminiPrompt"
          readonly
          rows="16"
        ></textarea>


        <div class="gemini-actions">

          <button
            type="button"
            class="btn btn-secondary"
            id="copyGeminiPrompt"
          >
            📋 Copier le prompt
          </button>


          <button
            type="button"
            class="btn btn-primary"
            id="openGemini"
          >
            🤖 Ouvrir Gemini
          </button>

        </div>


        <div class="info-box">

          <strong>🎯 Toromarika</strong>

          <p>
            Rehefa misokatra Gemini dia apetaho ilay prompt.
            Aza mangataka valiny amin'i Gemini.
            Ianao no tokony hivarotra.
          </p>

          <p>
            Rehefa vita ny simulation dia miverena eto
            ary ampiasao ny <strong>Retour & Evaluation</strong>
            hanombanana ny performance-nao.
          </p>

        </div>

      </div>

    </div>

  `;


  /* ========================================================
     QUICK SIMULATION
  ======================================================== */

  const quickScenario =
    document.getElementById("quickScenario");

  const quickScenarioContent =
    document.getElementById("quickScenarioContent");

  const quickOptions =
    document.getElementById("quickOptions");

  const quickResult =
    document.getElementById("quickSimulationResult");


  function renderQuickScenario() {

    const scenario =
      simulationScenarios[
        Number(quickScenario.value)
      ];


    quickScenarioContent.innerHTML = `

      <span>CLIENT</span>

      <strong>
        "${escapeHTML(scenario.objection)}"
      </strong>

    `;


    const answers = [
      "Eny, lafo tokoa.",

      "Azafady tompoko, inona no budget noeritreretinao? Afaka jerentsika izay quantité na offre mifanaraka aminao.",

      "Tsy afaka mampidina prix aho."
    ];


    quickOptions.innerHTML =
      answers
        .map(
          (answer, index) => `
            <button
              type="button"
              class="simulation-option"
              data-quick-answer="${index}"
            >
              ${escapeHTML(answer)}
            </button>
          `
        )
        .join("");


    quickResult.innerHTML = "";


    quickOptions
      .querySelectorAll("[data-quick-answer]")
      .forEach((button) => {

        button.addEventListener("click", () => {

          const answer =
            Number(
              button.dataset.quickAnswer
            );


          if (answer === 1) {

            quickResult.innerHTML = `

              <div class="result-card result-positive">

                <div class="result-title">
                  ✅ Tsara!
                </div>

                <p>
                  Tsy niady tamin'ny client ianao.
                  Nanontany ny budget ary nitady solution.
                </p>

              </div>

            `;

          } else {

            quickResult.innerHTML = `

              <div class="result-card result-negative">

                <div class="result-title">
                  ⚠️ Mbola azo hatsaraina
                </div>

                <p>
                  Aza mamaly amin'ny fanoherana avy hatrany.
                  Fantaro aloha ny tena besoin,
                  budget na objection-n'ilay client.
                </p>

              </div>

            `;

          }

        });

      });

  }


  quickScenario.addEventListener(
    "change",
    renderQuickScenario
  );


  renderQuickScenario();


  /* ========================================================
     MODE SWITCH
  ======================================================== */

  const quickMode =
    document.getElementById(
      "simulationQuick"
    );

  const geminiMode =
    document.getElementById(
      "simulationGemini"
    );


  container
    .querySelectorAll(
      "[data-simulation-mode]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          container
            .querySelectorAll(
              "[data-simulation-mode]"
            )
            .forEach((item) => {
              item.classList.remove(
                "active"
              );
            });


          button.classList.add(
            "active"
          );


          const mode =
            button.dataset.simulationMode;


          if (mode === "gemini") {

            quickMode.hidden = true;
            geminiMode.hidden = false;

          } else {

            quickMode.hidden = false;
            geminiMode.hidden = true;

          }

        }
      );

    });


  /* ========================================================
     GEMINI PROMPT GENERATOR
  ======================================================== */

  const generateButton =
    document.getElementById(
      "generateGeminiPrompt"
    );


  generateButton.addEventListener(
    "click",
    () => {

      const product =
        document.getElementById(
          "geminiProduct"
        ).value;


      const level =
        document.getElementById(
          "geminiLevel"
        ).value;


      const scenarioIndex =
        Number(
          document.getElementById(
            "geminiScenario"
          ).value
        );


      const context =
        document.getElementById(
          "geminiContext"
        ).value.trim();


      const scenario =
        simulationScenarios[
          scenarioIndex
        ];


      const levelInstruction = {

        facile:
          "Ataovy client tsotra sy sariaka. Manontania zavatra fototra ary omeo fotoana hamalian'ilay vendeur.",

        intermediaire:
          "Aza mora resy lahatra. Mametraha fanontaniana ary manaova objection iray na roa arakaraka ny valiny.",

        difficile:
          "Aoka ianao ho client misalasala. Manaova objection maromaro, anontanio ny prix, qualité, avantage ary conditions.",

        expert:
          "Aoka ianao ho client exigeant sy négociateur. Aza manaiky mora. Manaova objection mifandimby ary jereo raha mahay mamantatra besoin, valeur, budget ary closing ilay vendeur."

      }[level];


      const prompt = `

IANAO DIA CLIENT AO AMIN'NY SIMULATION DE VENTE.

Tanjona:
Hanampy mpianatra Vente Lab hanao pratique
amin'ny resaka varotra tena izy.

RÔLE:
Ianao = CLIENT
Mpianatra = VENDEUR

PRODUIT:
${product}

SCÉNARIO:
${scenario.objection}

OBJECTIF PÉDAGOGIQUE:
${scenario.objective}

NIVEAU:
${level}

TOROMARIKA HO ANAO:
${levelInstruction}

${context
  ? `CONTEXTE FANAMPINY:
${context}`
  : ""}

RÈGLES:

1. Aza milaza fa simulation ianao rehefa manomboka.
2. Mitenena toy ny client tena izy.
3. Aza manome mialoha ny valiny tokony holazain'ny vendeur.
4. Aza manao paragraphe lava be.
5. Manontania fanontaniana iray na roa isaky ny valiny.
6. Rehefa mamaly ilay vendeur dia tohizo araka ny valiny nomeny.
7. Raha ratsy ny valiny dia manaova objection mifanaraka amin'izany.
8. Raha tsara ny valiny dia asehoy fa mety ho liana kokoa ianao, fa aza manaiky avy hatrany.
9. Ampidiro tsikelikely ny objection:
   prix, qualité, confiance, livraison, délai, paiement na remise.
10. Ny tanjona dia tsy ny handresy lahatra azy.
    Ny tanjona dia ny hanome azy client réaliste.
11. Aza manome score mandritra ny simulation.
12. Rehefa milaza aho hoe "FIN DE SIMULATION",
    dia ajanony ny rôle client ary omeo évaluation fohy:
    - Qualification client
    - Écoute
    - Réponse aux objections
    - Valeur de l'offre
    - Closing
    - Score /100
    - 3 zavatra tokony hatsaraina
    - 2 zavatra natao tsara.

Atombohy amin'ny maha-client anao.

Ataovy naturel, fohy ary réaliste.
`.trim();


      document.getElementById(
        "geminiPrompt"
      ).value = prompt;


      document.getElementById(
        "geminiPromptBox"
      ).hidden = false;


      showToast(
        "Prompt Gemini vonona."
      );

    }
  );


  /* ========================================================
     COPY PROMPT
  ======================================================== */

  document
    .getElementById(
      "copyGeminiPrompt"
    )
    .addEventListener(
      "click",
      () => {

        const prompt =
          document.getElementById(
            "geminiPrompt"
          ).value;

        copyText(prompt);

      }
    );


  /* ========================================================
     OPEN GEMINI
  ======================================================== */

  document
    .getElementById(
      "openGemini"
    )
    .addEventListener(
      "click",
      () => {

        const prompt =
          document.getElementById(
            "geminiPrompt"
          ).value.trim();


        if (!prompt) {

          showToast(
            "Mamoròna aloha ny prompt.",
            "error"
          );

          return;

        }


        copyText(prompt);


        window.open(
          "https://gemini.google.com/app",
          "_blank",
          "noopener,noreferrer"
        );

      }
    );

}

  /* ==========================================================
     16. ORDER
  ========================================================== */

  function renderOrderTool(container) {
    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 06</span>

        <h2>📦 Commande</h2>

        <p>
          Rehefa efa vonona ny client dia aza avela
          hikorontana ny informations.
        </p>

      </div>

      <form id="orderForm" class="lab-form">

        <div class="form-grid">

          <label>
            Anaran'ny client
            <input
              name="client"
              required
            >
          </label>

          <label>
            Téléphone
            <input
              name="phone"
              required
            >
          </label>

          <label>
            Vokatra
            <input
              name="product"
              required
            >
          </label>

          <label>
            Quantité
            <input
              type="number"
              name="quantity"
              value="1"
              min="1"
              required
            >
          </label>

          <label>
            Prix / unité
            <input
              type="number"
              name="price"
              required
            >
          </label>

          <label>
            Toerana
            <input
              name="location"
            >
          </label>

        </div>

        <button
          class="btn btn-primary"
          type="submit"
        >
          📦 Enregistrer Commande
        </button>

      </form>

      <div
        id="orderResult"
        class="lab-result"
      ></div>
    `;

    document
      .getElementById("orderForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();

        const data =
          new FormData(event.currentTarget);

        const order = {
          id:
            "CMD-" +
            Date.now(),

          createdAt:
            new Date().toISOString(),

          client:
            data.get("client"),

          phone:
            data.get("phone"),

          product:
            data.get("product"),

          quantity:
            numberValue(data.get("quantity")),

          price:
            numberValue(data.get("price")),

          location:
            data.get("location"),

          status:
            "nouvelle"
        };

        order.total =
          order.quantity *
          order.price;

        state.orders.push(order);
        state.lastActivity =
          new Date().toISOString();

        saveState();

        document.getElementById(
          "orderResult"
        ).innerHTML = `
          <div class="result-card result-positive">

            <div class="result-title">
              ✅ Commande enregistrée
            </div>

            <p>
              Référence:
              <strong>${escapeHTML(order.id)}</strong>
            </p>

            <p>
              Total:
              <strong>${formatMoney(order.total)}</strong>
            </p>

            <button
              class="btn btn-secondary"
              type="button"
              data-open-next="receipt"
            >
              🧾 Créer le reçu
            </button>

          </div>
        `;

        const next =
          document.querySelector(
            "[data-open-next='receipt']"
          );

        next?.addEventListener("click", () => {
          openTool("receipt");
        });

        updateDashboard();

        showToast("Commande voatahiry.");
      });
  }

  /* ==========================================================
     17. RECEIPT
  ========================================================== */

  function renderReceiptTool(container) {
    const lastOrder =
      state.orders[state.orders.length - 1];

    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 07</span>

        <h2>🧾 Reçu de Vente</h2>

        <p>
          Reçu tsotra azo aseho amin'ny client
          na tehirizina ho preuve de vente.
        </p>

      </div>

      <form id="receiptForm" class="lab-form">

        <div class="form-grid">

          <label>
            Client
            <input
              name="client"
              value="${escapeHTML(lastOrder?.client || "")}"
              required
            >
          </label>

          <label>
            Produit
            <input
              name="product"
              value="${escapeHTML(lastOrder?.product || "")}"
              required
            >
          </label>

          <label>
            Quantité
            <input
              type="number"
              name="quantity"
              value="${lastOrder?.quantity || 1}"
              required
            >
          </label>

          <label>
            Prix unitaire
            <input
              type="number"
              name="price"
              value="${lastOrder?.price || 0}"
              required
            >
          </label>

          <label>
            Vendeur
            <input
              name="seller"
              value="Tantsaha Matihanina"
            >
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value="${todayISO()}"
            >
          </label>

        </div>

        <button
          class="btn btn-primary"
          type="submit"
        >
          🧾 Générer le Reçu
        </button>

      </form>

      <div
        id="receiptResult"
        class="lab-result"
      ></div>
    `;

    document
      .getElementById("receiptForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();

        const data =
          new FormData(event.currentTarget);

        const client =
          data.get("client");

        const product =
          data.get("product");

        const quantity =
          numberValue(data.get("quantity"));

        const price =
          numberValue(data.get("price"));

        const seller =
          data.get("seller");

        const date =
          data.get("date");

        const total =
          quantity * price;

        const receiptHTML = `
          <div class="receipt">

            <div class="receipt-header">
              <strong>TANTSAHA MATIHANINA</strong>
              <span>REÇU DE VENTE</span>
            </div>

            <div class="receipt-body">

              <p>
                <strong>Date:</strong>
                ${formatDate(date)}
              </p>

              <p>
                <strong>Client:</strong>
                ${escapeHTML(client)}
              </p>

              <hr>

              <p>
                ${escapeHTML(product)}
                × ${quantity}
              </p>

              <p>
                Prix unitaire:
                ${formatMoney(price)}
              </p>

              <hr>

              <p class="receipt-total">
                TOTAL:
                ${formatMoney(total)}
              </p>

            </div>

            <div class="receipt-footer">
              Merci pour votre confiance.
              <br>
              ${escapeHTML(seller)}
            </div>

          </div>

          <button
            type="button"
            class="btn btn-secondary"
            id="printReceipt"
          >
            🖨️ Imprimer / PDF
          </button>
        `;

        document.getElementById(
          "receiptResult"
        ).innerHTML = receiptHTML;

        document
          .getElementById("printReceipt")
          .addEventListener("click", () => {
            window.print();
          });

        showToast("Reçu vonona.");
      });
  }

  /* ==========================================================
     18. GUIDE
  ========================================================== */

  function renderGuideTool(container) {
    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 08</span>

        <h2>📘 Guide Pratique</h2>

        <p>
          Tsy tokony hamaky fotsiny ianao.
          Araho ity ordre ity rehefa manao vente.
        </p>

      </div>

      <div class="guide-steps">

        ${guideStep(
          "1",
          "Fantaro ny vokatra",
          "Inona no amidinao? Inona no mampiavaka azy?"
        )}

        ${guideStep(
          "2",
          "Fantaro ny client",
          "Iza no tena mila azy? Inona ny olany?"
        )}

        ${guideStep(
          "3",
          "Kajio ny prix",
          "Fantaro ny coût, prix, CA ary tombony."
        )}

        ${guideStep(
          "4",
          "Mamorona offre",
          "Asehoy mazava ny bénéfice, prix ary CTA."
        )}

        ${guideStep(
          "5",
          "Publieo",
          "Aza publication tsy misy objectif."
        )}

        ${guideStep(
          "6",
          "Prospecte",
          "Valio ny message ary qualification-o ny prospect."
        )}

        ${guideStep(
          "7",
          "Close",
          "Ataovy mazava ny quantité, prix, livraison ary paiement."
        )}

        ${guideStep(
          "8",
          "Suivi",
          "Aza tapahana ny relation rehefa vita ny vente."
        )}

      </div>
    `;
  }

  function guideStep(number, title, description) {
    return `
      <div class="guide-step">

        <div class="guide-number">
          ${number}
        </div>

        <div>
          <strong>${title}</strong>
          <p>${description}</p>
        </div>

      </div>
    `;
  }

  /* ==========================================================
     19. CHALLENGE 7 DAYS
  ========================================================== */

  const challengeDays = [
    {
      day: 1,
      title: "Fototry ny Vente",
      task:
        "Farito ny vokatrao, client cible ary tombony iray."
    },

    {
      day: 2,
      title: "Client Cible",
      task:
        "Soraty ny olona tena mety hividy sy ny olany."
    },

    {
      day: 3,
      title: "Offre & Prix",
      task:
        "Kajio ny coût, prix, CA ary tombony."
    },

    {
      day: 4,
      title: "Publication",
      task:
        "Mamoròna publication mampiasa Hook → Offre → CTA."
    },

    {
      day: 5,
      title: "Prospection",
      task:
        "Mitadiava prospects 5 ary qualification-o."
    },

    {
      day: 6,
      title: "Objection & Closing",
      task:
        "Manaova simulation amin'ny objection 3."
    },

    {
      day: 7,
      title: "Suivi",
      task:
        "Araho client iray ary soraty izay lesona azonao."
    }
  ];

  function renderChallengeTool(container) {
    const completed =
      JSON.parse(
        localStorage.getItem(
          "tm_vente_challenge"
        ) || "[]"
      );

    container.innerHTML = `
      <div class="workspace-header">

        <span class="eyebrow">LAB 09</span>

        <h2>🔥 Challenge 7 Jours</h2>

        <p>
          7 andro. 7 pratique.
          Ny tanjona dia ny hianatra amin'ny fanaovana.
        </p>

      </div>

      <div class="challenge-list">

        ${challengeDays
          .map(
            (item) => `
              <div
                class="challenge-item ${
                  completed.includes(item.day)
                    ? "completed"
                    : ""
                }"
              >

                <div class="challenge-day">
                  J${item.day}
                </div>

                <div class="challenge-content">

                  <strong>
                    ${item.title}
                  </strong>

                  <p>
                    ${item.task}
                  </p>

                </div>

                <button
                  type="button"
                  class="btn btn-small challenge-complete"
                  data-day="${item.day}"
                >
                  ${
                    completed.includes(item.day)
                      ? "✓ Vita"
                      : "Vitaiko"
                  }
                </button>

              </div>
            `
          )
          .join("")}

      </div>
    `;

    container
      .querySelectorAll(".challenge-complete")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const day =
            Number(button.dataset.day);

          let current =
            JSON.parse(
              localStorage.getItem(
                "tm_vente_challenge"
              ) || "[]"
            );

          if (current.includes(day)) {
            current =
              current.filter(
                (item) => item !== day
              );
          } else {
            current.push(day);
          }

          localStorage.setItem(
            "tm_vente_challenge",
            JSON.stringify(current)
          );

          renderChallengeTool(container);

          showToast(
            current.includes(day)
              ? `Jour ${day} vita.`
              : `Jour ${day} averina atao.`
          );
        });
      });
  }

  /* ==========================================================
     20. COPY
  ========================================================== */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);

      showToast("Voadika.");
    } catch (error) {
      const textarea =
        document.createElement("textarea");

      textarea.value = text;
      document.body.appendChild(textarea);

      textarea.select();

      document.execCommand("copy");

      textarea.remove();

      showToast("Voadika.");
    }
  }

  /* ==========================================================
     21. DASHBOARD
  ========================================================== */

  function updateDashboard() {
    const calculations =
      state.calculations || [];

    const orders =
      state.orders || [];

    const calculationCount =
      document.getElementById(
        "statCalculations"
      );

    const orderCount =
      document.getElementById(
        "statOrders"
      );

    const revenueElement =
      document.getElementById(
        "statRevenue"
      );

    const profitElement =
      document.getElementById(
        "statProfit"
      );

    if (calculationCount) {
      calculationCount.textContent =
        calculations.length;
    }

    if (orderCount) {
      orderCount.textContent =
        orders.length;
    }

    const revenue =
      orders.reduce(
        (sum, order) =>
          sum + numberValue(order.total),
        0
      );

    const profit =
      calculations.reduce(
        (sum, item) =>
          sum + numberValue(item.profit),
        0
      );

    if (revenueElement) {
      revenueElement.textContent =
        formatMoney(revenue);
    }

    if (profitElement) {
      profitElement.textContent =
        formatMoney(profit);
    }

    updateRecentCalculations();
    updateRecentOrders();
    updateFunnel();
  }

  function updateRecentCalculations() {
    const box =
      document.getElementById(
        "recentCalculations"
      );

    if (!box) return;

    const items =
      [...state.calculations]
        .slice(-5)
        .reverse();

    if (!items.length) {
      box.innerHTML =
        "<p>Aucun calcul mbola vita.</p>";
      return;
    }

    box.innerHTML = items
      .map(
        (item) => `
          <div class="dashboard-item">

            <strong>
              ${escapeHTML(
                item.product ||
                item.animal ||
                "Calcul"
              )}
            </strong>

            <span>
              Tombony:
              ${formatMoney(item.profit)}
            </span>

            <small>
              ${formatDate(item.date)}
            </small>

          </div>
        `
      )
      .join("");
  }

  function updateRecentOrders() {
    const box =
      document.getElementById(
        "recentOrders"
      );

    if (!box) return;

    const items =
      [...state.orders]
        .slice(-5)
        .reverse();

    if (!items.length) {
      box.innerHTML =
        "<p>Aucune commande mbola voatahiry.</p>";
      return;
    }

    box.innerHTML = items
      .map(
        (order) => `
          <div class="dashboard-item">

            <strong>
              ${escapeHTML(order.client)}
            </strong>

            <span>
              ${escapeHTML(order.product)}
              × ${order.quantity}
            </span>

            <small>
              ${formatMoney(order.total)}
            </small>

          </div>
        `
      )
      .join("");
  }

  /* ==========================================================
     22. FUNNEL
  ========================================================== */

  function updateFunnel() {
    const counts = {
      prospects:
        state.prospects?.length || 0,

      responses:
        state.prospects?.filter(
          (p) => p.responded
        ).length || 0,

      discussions:
        state.prospects?.filter(
          (p) => p.discussion
        ).length || 0,

      orders:
        state.orders?.length || 0,

      clients:
        new Set(
          (state.orders || [])
            .map((o) => o.phone)
            .filter(Boolean)
        ).size
    };

    const max =
      Math.max(
        1,
        ...Object.values(counts)
      );

    const mappings = [
      ["Prospects", counts.prospects],
      ["Responses", counts.responses],
      ["Discussions", counts.discussions],
      ["Orders", counts.orders],
      ["Clients", counts.clients]
    ];

    mappings.forEach(([name, value]) => {
      const id =
        name.charAt(0).toLowerCase() +
        name.slice(1);

      const numberElement =
        document.getElementById(
          "funnel" + name
        );

      const barElement =
        document.getElementById(
          "funnelBar" + name
        );

      if (numberElement) {
        numberElement.textContent =
          value;
      }

      if (barElement) {
        barElement.style.width =
          `${Math.max(
            5,
            (value / max) * 100
          )}%`;
      }
    });
  }

  /* ==========================================================
     23. EVALUATION
  ========================================================== */

  function initEvaluation() {
    const form =
      document.getElementById(
        "evaluationForm"
      );

    if (!form) return;

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const data =
          new FormData(form);

        const evaluation =
          Object.fromEntries(data.entries());

        evaluation.createdAt =
          new Date().toISOString();

        state.evaluations.push(
          evaluation
        );

        saveState();

        form.reset();

        showToast(
          "Evaluation voatahiry. Misaotra!"
        );
      }
    );
  }

  /* ==========================================================
     24. REVIEWS
  ========================================================== */

  async function loadReviews() {
    const box =
      document.getElementById(
        "reviewsList"
      );

    if (!box) return;

    if (!supabaseClient) {
      renderLocalReviews(box);
      return;
    }

    try {
      const { data, error } =
        await supabaseClient
          .from("vente_reviews")
          .select(
            "id,name,rating,learning,applied,result,message,created_at"
          )
          .eq("status", "approved")
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(20);

      if (error) {
        console.warn(
          "Reviews error:",
          error
        );

        renderLocalReviews(box);
        return;
      }

      if (!data || !data.length) {
        renderLocalReviews(box);
        return;
      }

      box.innerHTML =
        data
          .map(renderReview)
          .join("");
    } catch (error) {
      console.warn(
        "Review loading error:",
        error
      );

      renderLocalReviews(box);
    }
  }

  function renderLocalReviews(box) {
    const reviews =
      state.localReviews || [];

    if (!reviews.length) {
      box.innerHTML = `
        <div class="empty-state">
          <p>
            Tsy mbola misy avis eto.
            Aoka ianao ho voalohany hizara expérience.
          </p>
        </div>
      `;

      return;
    }

    box.innerHTML =
      reviews
        .map(renderReview)
        .join("");
  }

  function renderReview(review) {
    const stars =
      "★".repeat(
        numberValue(review.rating)
      ) +
      "☆".repeat(
        5 - numberValue(review.rating)
      );

    return `
      <article class="review-card">

        <div class="review-stars">
          ${stars}
        </div>

        <strong>
          ${escapeHTML(review.name)}
        </strong>

        ${
          review.message
            ? `<p>${escapeHTML(
                review.message
              )}</p>`
            : ""
        }

        ${
          review.learning
            ? `
              <small>
                Nianarako:
                ${escapeHTML(
                  review.learning
                )}
              </small>
            `
            : ""
        }

        ${
          review.result
            ? `
              <small>
                Résultat:
                ${escapeHTML(
                  review.result
                )}
              </small>
            `
            : ""
        }

      </article>
    `;
  }

  async function submitReview(form) {
    const data =
      new FormData(form);

    const review = {
      name:
        String(
          data.get("name") || ""
        ).trim(),

      rating:
        numberValue(
          data.get("rating")
        ),

      learning:
        String(
          data.get("learning") || ""
        ).trim(),

      applied:
        String(
          data.get("applied") || ""
        ).trim(),

      result:
        String(
          data.get("result") || ""
        ).trim(),

      message:
        String(
          data.get("message") || ""
        ).trim(),

      consent:
        data.get("consent") === "on",

      status:
        "pending"
    };

    if (!review.name) {
      showToast(
        "Ampidiro aloha ny anaranao.",
        "error"
      );
      return;
    }

    if (
      review.rating < 1 ||
      review.rating > 5
    ) {
      showToast(
        "Misafidiana note 1 hatramin'ny 5.",
        "error"
      );
      return;
    }

    if (!review.consent) {
      showToast(
        "Tokony hanaiky ny publication ianao.",
        "error"
      );
      return;
    }

    if (supabaseClient) {
      try {
        const { error } =
          await supabaseClient
            .from("vente_reviews")
            .insert(review);

        if (!error) {
          showToast(
            "Avis voaray. Hojerena alohan'ny publication."
          );

          form.reset();

          closeModal();

          return;
        }

        console.warn(
          "Supabase review insert error:",
          error
        );
      } catch (error) {
        console.warn(error);
      }
    }

    /*
      Fallback local raha tsy misy Supabase.
    */

    state.localReviews.push({
      ...review,
      created_at:
        new Date().toISOString()
    });

    saveState();

    showToast(
      "Avis voatahiry ao amin'ity appareil ity."
    );

    form.reset();

    closeModal();

    loadReviews();
  }

  /* ==========================================================
     25. REVIEW MODAL
  ========================================================== */

  function initReviewModal() {
    const modal =
      document.getElementById(
        "reviewModal"
      );

    if (!modal) return;

    document
      .querySelectorAll(
        '[data-modal-open="reviewModal"]'
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            modal.classList.add("open");
          }
        );
      });

    modal
      .querySelectorAll("[data-modal-close]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          closeModal
        );
      });

    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal
        ) {
          closeModal();
        }
      }
    );

    const form =
      document.getElementById(
        "reviewForm"
      );

    if (form) {
      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          submitReview(form);
        }
      );
    }
  }

  function closeModal() {
    const modal =
      document.getElementById(
        "reviewModal"
      );

    modal?.classList.remove("open");
  }

  /* ==========================================================
     26. RESET
  ========================================================== */

  function initReset() {
    const reset =
      document.querySelector(
        "[data-reset-data]"
      );

    if (!reset) return;

    reset.addEventListener(
      "click",
      () => {
        const confirmed =
          window.confirm(
            "Hofafana daholo ve ny données ao amin'ity appareil ity?"
          );

        if (!confirmed) return;

        localStorage.removeItem(
          STORAGE_KEY
        );

        localStorage.removeItem(
          "tm_vente_challenge"
        );

        state =
          structuredCloneSafe(
            defaultState
          );

        updateDashboard();

        showToast(
          "Données voafafa."
        );
      }
    );
  }

  /* ==========================================================
     27. LAST ACTIVITY
  ========================================================== */

  function recordActivity() {
    state.lastActivity =
      new Date().toISOString();

    saveState();
  }

  /* ==========================================================
     28. KEYBOARD SHORTCUTS
  ========================================================== */

  function initKeyboard() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          closeModal();
        }
      }
    );
  }

  /* ==========================================================
     29. INITIAL TOOL
  ========================================================== */

  function initDefaultTool() {
    const workspace =
      document.getElementById(
        "toolWorkspace"
      );

    if (!workspace) return;

    /*
      Tsy manokatra outil automatique
      raha mbola tsy misafidy ny utilisateur.
    */

    if (
      workspace.innerHTML.trim() === ""
    ) {
      workspace.innerHTML = `
        <div class="workspace-empty">

          <div class="workspace-empty-icon">
            🧪
          </div>

          <h3>
            Vonona hanao pratique?
          </h3>

          <p>
            Safidio etsy ambony ny outil
            tianao hampiasaina.
          </p>

        </div>
      `;
    }
  }

  /* ==========================================================
     30. START
  ========================================================== */

  function init() {
    initSupabase();

    initNavigation();
    initSmoothScroll();
    initExternalLinks();
    initTools();

    initEvaluation();
    initReviewModal();
    initReset();
    initKeyboard();

    initDefaultTool();

    updateDashboard();
    loadReviews();

    recordActivity();

    console.log(
      "Tantsaha Matihanina • Vente Lab chargé."
    );
  }

  /* ==========================================================
     31. DOM READY
  ========================================================== */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
