/* =========================================================
   TANTSAHA MATIHANINA — VENTE LAB
   js/app.js
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const APP_CONFIG = {
  storageKey: "tantsaha_vente_lab_data_v1",

  whatsappGroup:
    "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",

  whatsappPurchase:
    "https://wa.me/261385651378",

  facebook:
    "https://www.facebook.com/share/1Zfiu8oj3m/",

  currency: "Ar"
};


/* =========================================================
   2. SUPABASE CONFIG
   =========================================================
   Aza apetraka eto mihitsy ny service_role key.
   Publishable key ihany no azo ampiasaina amin'ny frontend.
   ========================================================= */

const SUPABASE_CONFIG = {
  url: "https://sdzybetralbaincrxddf.supabase.co",

  publishableKey:
    "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"
};

let supabaseClient = null;


/* =========================================================
   3. STATE
   ========================================================= */

const defaultState = {
  calculations: [],
  orders: [],
  prospects: [],
  publications: [],
  simulations: [],
  evaluations: [],

  funnel: {
    prospects: 0,
    responses: 0,
    discussions: 0,
    orders: 0,
    clients: 0
  }
};

let state = loadState();


/* =========================================================
   4. DOM HELPERS
   ========================================================= */

function $(selector, parent = document) {
  return parent.querySelector(selector);
}

function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function byId(id) {
  return document.getElementById(id);
}

function safeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function numberValue(value) {
  const number = Number(
    String(value ?? "")
      .replace(/\s/g, "")
      .replace(",", ".")
  );

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(
    Math.round(numberValue(value))
  );
}

function formatAr(value) {
  return `${formatNumber(value)} Ar`;
}

function today() {
  return new Date().toISOString();
}

function escapeHTML(value) {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   5. LOCAL STORAGE
   ========================================================= */

function loadState() {
  try {
    const saved = localStorage.getItem(APP_CONFIG.storageKey);

    if (!saved) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultState),
      ...parsed,
      funnel: {
        ...defaultState.funnel,
        ...(parsed.funnel || {})
      }
    };
  } catch (error) {
    console.error("Erreur chargement localStorage :", error);

    return structuredClone(defaultState);
  }
}


function saveState() {
  try {
    localStorage.setItem(
      APP_CONFIG.storageKey,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error("Erreur sauvegarde :", error);
  }
}


/* =========================================================
   6. TOAST
   ========================================================= */

function showToast(message, type = "success") {
  let container = byId("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(12px)";

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3000);
}


/* =========================================================
   7. MOBILE NAVIGATION
   ========================================================= */

function initMobileNavigation() {
  const toggle = $(".nav-toggle");
  const nav = $(".main-nav");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    nav.classList.toggle("active");

    const opened = nav.classList.contains("active");

    toggle.setAttribute(
      "aria-expanded",
      String(opened)
    );
  });

  $$(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });
}


/* =========================================================
   8. SMOOTH SCROLL
   ========================================================= */

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}


/* =========================================================
   9. TOOL WORKSPACE
   ========================================================= */

function initToolWorkspace() {
  const workspace = byId("toolWorkspace");

  if (!workspace) {
    return;
  }

  $$("[data-tool]").forEach(button => {
    button.addEventListener("click", () => {
      const tool = button.dataset.tool;

      openTool(tool);
    });
  });

  const closeButton =
    $(".workspace-close", workspace);

  if (closeButton) {
    closeButton.addEventListener("click", closeTool);
  }
}


function openTool(tool) {
  const workspace = byId("toolWorkspace");

  if (!workspace) {
    return;
  }

  workspace.classList.add("active");

  let content = "";

  switch (tool) {
    case "price":
      content = renderPriceTool();
      break;

    case "elevage":
      content = renderElevageTool();
      break;

    case "offer":
      content = renderOfferTool();
      break;

    case "publication":
      content = renderPublicationTool();
      break;

    case "simulation":
      content = renderSimulationTool();
      break;

    case "order":
      content = renderOrderTool();
      break;

    case "receipt":
      content = renderReceiptTool();
      break;

    case "guide":
      content = renderGuideTool();
      break;

    case "challenge":
      content = renderChallengeTool();
      break;

    default:
      content = renderDefaultTool();
  }

  workspace.innerHTML = content;

  workspace.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  bindWorkspaceEvents();
}


function closeTool() {
  const workspace = byId("toolWorkspace");

  if (!workspace) {
    return;
  }

  workspace.classList.remove("active");
}


/* =========================================================
   10. WORKSPACE HEADER
   ========================================================= */

function workspaceHeader(title, description) {
  return `
    <div class="workspace-header">
      <div>
        <div class="workspace-title">
          ${escapeHTML(title)}
        </div>

        <div class="workspace-description">
          ${escapeHTML(description)}
        </div>
      </div>

      <button
        type="button"
        class="workspace-close"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  `;
}


/* =========================================================
   11. PRICE CALCULATOR
   ========================================================= */

function renderPriceTool() {
  return `
    ${workspaceHeader(
      "Kajy Prix & Tombony",
      "Fantaro ny vidiny, ny coût ary ny tombony alohan'ny hivarotana."
    )}

    <form id="priceForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Anaran'ny vokatra
          </label>

          <input
            id="priceProduct"
            class="form-control"
            type="text"
            placeholder="Ohatra: Akoho Gasy"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Isan'ny vokatra
          </label>

          <input
            id="priceQuantity"
            class="form-control"
            type="number"
            min="1"
            value="1"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Coût total
          </label>

          <input
            id="priceCost"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ohatra: 60000"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Prix de vente / unité
          </label>

          <input
            id="priceSale"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ohatra: 15000"
            required
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Kajio ny tombony
        </button>

        <button
          type="button"
          class="btn btn-outline"
          id="clearPrice"
        >
          Hamafa
        </button>

      </div>

    </form>

    <div id="priceResult" class="result-box"></div>
  `;
}


function calculatePrice() {
  const product =
    byId("priceProduct")?.value.trim() || "Vokatra";

  const quantity =
    numberValue(byId("priceQuantity")?.value) || 1;

  const cost =
    numberValue(byId("priceCost")?.value);

  const sale =
    numberValue(byId("priceSale")?.value);

  const revenue = sale * quantity;

  const profit = revenue - cost;

  const margin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  const costPerUnit =
    quantity > 0
      ? cost / quantity
      : 0;

  const profitPerUnit =
    quantity > 0
      ? profit / quantity
      : 0;

  state.calculations.unshift({
    id: Date.now(),
    product,
    quantity,
    cost,
    sale,
    revenue,
    profit,
    margin,
    createdAt: today()
  });

  state.calculations =
    state.calculations.slice(0, 100);

  saveState();

  updateDashboard();

  const result = byId("priceResult");

  if (!result) {
    return;
  }

  const status =
    profit > 0
      ? "result-positive"
      : profit < 0
        ? "result-negative"
        : "result-neutral";

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Résultat — ${escapeHTML(product)}
    </div>

    <div class="result-value ${status}">
      ${formatAr(profit)}
    </div>

    <div class="result-note">
      CA: <strong>${formatAr(revenue)}</strong>
      · Coût: <strong>${formatAr(cost)}</strong>
      · Marge: <strong>${margin.toFixed(2)}%</strong>
    </div>

    <div class="result-note">
      Coût/unité: ${formatAr(costPerUnit)}
      · Tombony/unité: ${formatAr(profitPerUnit)}
    </div>

    ${
      profit > 0
        ? `<div class="alert alert-success" style="margin-top:15px;margin-bottom:0">
             Mahazo tombony ianao amin'ity calcul ity.
           </div>`
        : profit < 0
          ? `<div class="alert alert-danger" style="margin-top:15px;margin-bottom:0">
               Misy perte. Avereno jerena ny coût na ny prix de vente.
             </div>`
          : `<div class="alert alert-warning" style="margin-top:15px;margin-bottom:0">
               Tsy mbola misy tombony.
             </div>`
    }
  `;

  showToast(
    "Vita ny calcul Prix & Tombony.",
    "success"
  );
}


/* =========================================================
   12. ELEVAGE CALCULATOR
   ========================================================= */

function renderElevageTool() {
  return `
    ${workspaceHeader(
      "Kajy Fiompiana",
      "Kajio ny coût, CA ary tombony amin'ny fiompiana."
    )}

    <form id="elevageForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Karazana fiompiana
          </label>

          <select
            id="elevageType"
            class="form-control"
          >
            <option value="Akoho Gasy">Akoho Gasy</option>
            <option value="Pondeuse">Pondeuse</option>
            <option value="Poulet de chair">Poulet de chair</option>
            <option value="Kisoa">Kisoa</option>
            <option value="Osy">Osy</option>
            <option value="Ondry">Ondry</option>
            <option value="Bitro">Bitro</option>
            <option value="Gana">Gana</option>
            <option value="Gisa">Gisa</option>
            <option value="Vorontsiloza">Vorontsiloza</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">
            Isan'ny biby
          </label>

          <input
            id="elevageQuantity"
            class="form-control"
            type="number"
            min="1"
            value="1"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Achat / investissement
          </label>

          <input
            id="elevagePurchase"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Sakafo
          </label>

          <input
            id="elevageFeed"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Fanafody / vaksiny
          </label>

          <input
            id="elevageHealth"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Hafa
          </label>

          <input
            id="elevageOther"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
          >
        </div>

        <div class="form-group full">
          <label class="form-label">
            Prix de vente / biby
          </label>

          <input
            id="elevageSale"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
            required
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Kajio
        </button>

      </div>

    </form>

    <div id="elevageResult" class="result-box"></div>
  `;
}


function calculateElevage() {
  const type =
    byId("elevageType")?.value || "Fiompiana";

  const quantity =
    numberValue(byId("elevageQuantity")?.value) || 1;

  const purchase =
    numberValue(byId("elevagePurchase")?.value);

  const feed =
    numberValue(byId("elevageFeed")?.value);

  const health =
    numberValue(byId("elevageHealth")?.value);

  const other =
    numberValue(byId("elevageOther")?.value);

  const sale =
    numberValue(byId("elevageSale")?.value);

  const totalCost =
    purchase + feed + health + other;

  const revenue =
    quantity * sale;

  const profit =
    revenue - totalCost;

  const margin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  const record = {
    id: Date.now(),
    type,
    quantity,
    purchase,
    feed,
    health,
    other,
    totalCost,
    revenue,
    profit,
    margin,
    createdAt: today()
  };

  state.calculations.unshift(record);

  state.calculations =
    state.calculations.slice(0, 100);

  saveState();

  updateDashboard();

  const result =
    byId("elevageResult");

  if (!result) {
    return;
  }

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      ${escapeHTML(type)}
    </div>

    <div class="result-value ${
      profit >= 0
        ? "result-positive"
        : "result-negative"
    }">
      ${formatAr(profit)}
    </div>

    <div class="result-note">
      Coût total:
      <strong>${formatAr(totalCost)}</strong>
    </div>

    <div class="result-note">
      CA estimé:
      <strong>${formatAr(revenue)}</strong>
    </div>

    <div class="result-note">
      Marge:
      <strong>${margin.toFixed(2)}%</strong>
    </div>
  `;

  showToast(
    "Vita ny kajy fiompiana.",
    "success"
  );
}


/* =========================================================
   13. OFFER CREATOR
   ========================================================= */

function renderOfferTool() {
  return `
    ${workspaceHeader(
      "Créer une Offre",
      "Amboary ny offre-nao amin'ny fomba mora takatry ny client."
    )}

    <form id="offerForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Produit / Service
          </label>

          <input
            id="offerProduct"
            class="form-control"
            type="text"
            placeholder="Ohatra: Akoho Gasy"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Client cible
          </label>

          <input
            id="offerClient"
            class="form-control"
            type="text"
            placeholder="Ohatra: Mpiompy vao manomboka"
            required
          >
        </div>

        <div class="form-group full">
          <label class="form-label">
            Olana / besoin
          </label>

          <textarea
            id="offerProblem"
            class="form-control"
            placeholder="Inona no olana ananan'ilay client?"
            required
          ></textarea>
        </div>

        <div class="form-group full">
          <label class="form-label">
            Vahaolana / bénéfice
          </label>

          <textarea
            id="offerBenefit"
            class="form-control"
            placeholder="Inona no tombontsoa azony?"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            Prix
          </label>

          <input
            id="offerPrice"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            CTA
          </label>

          <input
            id="offerCTA"
            class="form-control"
            type="text"
            value="Alefaso MP raha mila"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Mamorona Offre
        </button>

      </div>

    </form>

    <div id="offerResult" class="result-box"></div>
  `;
}


function createOffer() {
  const product =
    byId("offerProduct")?.value.trim();

  const client =
    byId("offerClient")?.value.trim();

  const problem =
    byId("offerProblem")?.value.trim();

  const benefit =
    byId("offerBenefit")?.value.trim();

  const price =
    numberValue(byId("offerPrice")?.value);

  const cta =
    byId("offerCTA")?.value.trim()
    || "Alefaso MP raha mila";

  const result =
    byId("offerResult");

  if (!result) {
    return;
  }

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Offre vonona
    </div>

    <div class="alert alert-info">
      <strong>${escapeHTML(product)}</strong>
      <br><br>

      <strong>Ho an'ny:</strong>
      ${escapeHTML(client)}

      <br><br>

      <strong>Olana:</strong>
      ${escapeHTML(problem)}

      <br><br>

      <strong>Vahaolana:</strong>
      ${escapeHTML(benefit)}

      <br><br>

      <strong>Prix:</strong>
      ${formatAr(price)}

      <br><br>

      <strong>CTA:</strong>
      ${escapeHTML(cta)}
    </div>

    <button
      type="button"
      class="btn btn-primary"
      id="copyOffer"
    >
      Copier l'offre
    </button>
  `;

  const copyButton =
    byId("copyOffer");

  if (copyButton) {
    copyButton.addEventListener("click", () => {

      const text =
`OFFRE — ${product}

Ho an'ny: ${client}

Olana:
${problem}

Vahaolana:
${benefit}

Prix: ${formatAr(price)}

${cta}`;

      copyText(text);
    });
  }

  showToast(
    "Vita ny offre.",
    "success"
  );
}


/* =========================================================
   14. PUBLICATION CREATOR
   ========================================================= */

function renderPublicationTool() {
  return `
    ${workspaceHeader(
      "Publication",
      "Mamoròna publication Facebook na WhatsApp mifototra amin'ny offre."
    )}

    <form id="publicationForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Canal
          </label>

          <select
            id="publicationChannel"
            class="form-control"
          >
            <option value="Facebook">
              Facebook
            </option>

            <option value="WhatsApp">
              WhatsApp
            </option>

            <option value="Marketplace">
              Marketplace
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">
            Produit
          </label>

          <input
            id="publicationProduct"
            class="form-control"
            type="text"
            placeholder="Ohatra: Akoho Gasy"
            required
          >
        </div>

        <div class="form-group full">
          <label class="form-label">
            Olana / Hook
          </label>

          <textarea
            id="publicationHook"
            class="form-control"
            placeholder="Ohatra: Sahirana mahita akoho salama ve ianao?"
            required
          ></textarea>
        </div>

        <div class="form-group full">
          <label class="form-label">
            Vahaolana / bénéfice
          </label>

          <textarea
            id="publicationBenefit"
            class="form-control"
            placeholder="Lazao ny tombontsoa azon'ny client."
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            Prix
          </label>

          <input
            id="publicationPrice"
            class="form-control"
            type="number"
            min="0"
            placeholder="Ar"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            CTA
          </label>

          <input
            id="publicationCTA"
            class="form-control"
            type="text"
            value="Alefaso MP raha mila fanazavana"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Mamorona Publication
        </button>

      </div>

    </form>

    <div id="publicationResult" class="result-box"></div>
  `;
}


function createPublication() {
  const channel =
    byId("publicationChannel")?.value;

  const product =
    byId("publicationProduct")?.value.trim();

  const hook =
    byId("publicationHook")?.value.trim();

  const benefit =
    byId("publicationBenefit")?.value.trim();

  const price =
    numberValue(byId("publicationPrice")?.value);

  const cta =
    byId("publicationCTA")?.value.trim()
    || "Alefaso MP raha mila";

  const text =
`${hook}

Mitady ${product} ve ianao?

${benefit}

Prix:
${formatAr(price)}

${cta}

#TantsahaMatihanina`;

  const result =
    byId("publicationResult");

  if (!result) {
    return;
  }

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Publication — ${escapeHTML(channel)}
    </div>

    <div class="alert alert-info">
      ${escapeHTML(text).replaceAll("\n", "<br>")}
    </div>

    <button
      type="button"
      class="btn btn-primary"
      id="copyPublication"
    >
      Copier
    </button>
  `;

  state.publications.unshift({
    id: Date.now(),
    channel,
    product,
    text,
    createdAt: today()
  });

  state.publications =
    state.publications.slice(0, 100);

  saveState();

  const copyButton =
    byId("copyPublication");

  if (copyButton) {
    copyButton.addEventListener(
      "click",
      () => copyText(text)
    );
  }

  showToast(
    "Vita ny publication.",
    "success"
  );
}


/* =========================================================
   15. CLIENT SIMULATION
   ========================================================= */

const simulationScenarios = [
  {
    id: "price",
    client:
      "Lafo be izany tompoko. Misy mora kokoa ve?",
    answer:
      "Azoko tsara tompoko. Ny prix dia mifanaraka amin'ny kalitao sy ny zavatra tafiditra ao amin'ny offre. Raha tianao dia azoko hazavaina aminao aloha izay tena azonao amin'io prix io.",
    lesson:
      "Aza midina prix avy hatrany. Fantaro aloha ny objection ary avereno amin'ny valeur."
  },

  {
    id: "think",
    client:
      "Mbola hieritreritra aho aloha.",
    answer:
      "Tsy maninona tompoko. Mba hahafahako manampy anao tsara, inona no mbola mampisalasala anao indrindra: ny prix, ny qualité sa ny fomba handraisana azy?",
    lesson:
      "Ny tanjona dia ny hahitana ny tena objection fa tsy hanery ny client."
  },

  {
    id: "location",
    client:
      "Aiza no misy anareo?",
    answer:
      "Eto amin'ny [toerana] izahay tompoko. Raha tianao dia afaka omeko anao ny toerana sy ny fomba handraisana azy.",
    lesson:
      "Valio mazava ny toerana ary ampio next step."
  },

  {
    id: "discount",
    client:
      "Misy remise ve?",
    answer:
      "Misy offre manokana raha misy quantité maromaro tompoko. Lazao ahy azafady hoe firy no ilainao dia hojereko izay mety aminao.",
    lesson:
      "Aza manome remise tsy misy antony. Ampifandraiso amin'ny quantité na offre."
  },

  {
    id: "payment",
    client:
      "Alefaso aloha dia mandoa aho.",
    answer:
      "Mba hiarovana ny roa tonta dia arahintsika aloha ny fomba fandoavana sy ny fanamarinana ny commande. Rehefa voamarina dia afaka manomana ny livraison izahay.",
    lesson:
      "Ny confiance sy ny procédure mazava no miaro ny vendeur sy ny client."
  }
];


function renderSimulationTool() {
  return `
    ${workspaceHeader(
      "Simulation Client",
      "Mianara mamaly objection sy mitarika discussion mankany amin'ny commande."
    )}

    <div class="form-group">

      <label class="form-label">
        Safidio ny scénario
      </label>

      <select
        id="simulationScenario"
        class="form-control"
      >

        ${simulationScenarios.map(
          scenario => `
            <option value="${scenario.id}">
              ${escapeHTML(scenario.client)}
            </option>
          `
        ).join("")}

      </select>

    </div>

    <div
      id="simulationClient"
      class="alert alert-warning"
      style="margin-top:18px"
    ></div>

    <div class="form-group">

      <label class="form-label">
        Soraty eto ny valinteninao
      </label>

      <textarea
        id="simulationAnswer"
        class="form-control"
        placeholder="Inona no havalinao?"
      ></textarea>

    </div>

    <div class="form-actions">

      <button
        type="button"
        class="btn btn-primary"
        id="evaluateSimulation"
      >
        Hamarino ny valiko
      </button>

    </div>

    <div
      id="simulationResult"
      class="result-box"
    ></div>
  `;
}


function updateSimulationClient() {
  const select =
    byId("simulationScenario");

  const box =
    byId("simulationClient");

  if (!select || !box) {
    return;
  }

  const scenario =
    simulationScenarios.find(
      item => item.id === select.value
    );

  if (!scenario) {
    return;
  }

  box.innerHTML = `
    <strong>CLIENT:</strong><br>
    ${escapeHTML(scenario.client)}
  `;
}


function evaluateSimulation() {
  const select =
    byId("simulationScenario");

  const answer =
    byId("simulationAnswer")
      ?.value.trim();

  const result =
    byId("simulationResult");

  if (!select || !result) {
    return;
  }

  if (!answer) {
    showToast(
      "Soraty aloha ny valinteninao.",
      "warning"
    );

    return;
  }

  const scenario =
    simulationScenarios.find(
      item => item.id === select.value
    );

  if (!scenario) {
    return;
  }

  const words =
    answer
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

  let score = 40;

  const positiveWords = [
    "azoko",
    "mahatakatra",
    "misaotra",
    "tompoko",
    "hazavaiko",
    "fanazavana",
    "prix",
    "qualité",
    "offre",
    "inona",
    "firifiry",
    "ohatrinona",
    "commande",
    "commande"
  ];

  positiveWords.forEach(word => {
    if (words.some(item => item.includes(word))) {
      score += 5;
    }
  });

  if (answer.length >= 80) {
    score += 10;
  }

  if (answer.length >= 160) {
    score += 5;
  }

  score = Math.min(score, 100);

  let level;

  if (score >= 80) {
    level = "Tena tsara";
  } else if (score >= 65) {
    level = "Tsara";
  } else if (score >= 50) {
    level = "Mila fanatsarana";
  } else {
    level = "Avereno dinihina";
  }

  state.simulations.unshift({
    id: Date.now(),
    scenario: scenario.id,
    answer,
    score,
    createdAt: today()
  });

  state.simulations =
    state.simulations.slice(0, 100);

  saveState();

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Score: ${score}/100 — ${level}
    </div>

    <div class="result-note">
      <strong>Ohatra amin'ny valiny tsara:</strong>
    </div>

    <div class="alert alert-success">
      ${escapeHTML(scenario.answer)}
    </div>

    <div class="result-note">
      <strong>Lesona:</strong>
      ${escapeHTML(scenario.lesson)}
    </div>
  `;
}


/* =========================================================
   16. ORDER
   ========================================================= */

function renderOrderTool() {
  return `
    ${workspaceHeader(
      "Commande",
      "Raketo ny commande mba hanarahana ny fivoaran'ny vente."
    )}

    <form id="orderForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Anaran'ny client
          </label>

          <input
            id="orderClient"
            class="form-control"
            type="text"
            placeholder="Anaran'ny client"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Téléphone
          </label>

          <input
            id="orderPhone"
            class="form-control"
            type="tel"
            placeholder="034..."
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Produit
          </label>

          <input
            id="orderProduct"
            class="form-control"
            type="text"
            placeholder="Ohatra: Akoho Gasy"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Quantité
          </label>

          <input
            id="orderQuantity"
            class="form-control"
            type="number"
            min="1"
            value="1"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Prix / unité
          </label>

          <input
            id="orderUnitPrice"
            class="form-control"
            type="number"
            min="0"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Coût total estimé
          </label>

          <input
            id="orderCost"
            class="form-control"
            type="number"
            min="0"
          >
        </div>

        <div class="form-group full">
          <label class="form-label">
            Statut
          </label>

          <select
            id="orderStatus"
            class="form-control"
          >
            <option value="Commande">
              Commande
            </option>

            <option value="Payée">
              Payée
            </option>

            <option value="Livrée">
              Livrée
            </option>

            <option value="Annulée">
              Annulée
            </option>
          </select>
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Enregistrer commande
        </button>

      </div>

    </form>

    <div
      id="orderResult"
      class="result-box"
    ></div>
  `;
}


function saveOrder() {
  const client =
    byId("orderClient")?.value.trim();

  const phone =
    byId("orderPhone")?.value.trim();

  const product =
    byId("orderProduct")?.value.trim();

  const quantity =
    numberValue(byId("orderQuantity")?.value) || 1;

  const unitPrice =
    numberValue(byId("orderUnitPrice")?.value);

  const cost =
    numberValue(byId("orderCost")?.value);

  const status =
    byId("orderStatus")?.value || "Commande";

  const revenue =
    quantity * unitPrice;

  const profit =
    revenue - cost;

  const order = {
    id: Date.now(),
    client,
    phone,
    product,
    quantity,
    unitPrice,
    cost,
    revenue,
    profit,
    status,
    paid: status === "Payée" || status === "Livrée",
    createdAt: today()
  };

  state.orders.unshift(order);

  state.orders =
    state.orders.slice(0, 100);

  state.funnel.orders += 1;

  if (status === "Payée" || status === "Livrée") {
    state.funnel.clients += 1;
  }

  saveState();

  updateDashboard();

  const result =
    byId("orderResult");

  if (!result) {
    return;
  }

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Commande enregistrée
    </div>

    <div class="result-value">
      ${formatAr(revenue)}
    </div>

    <div class="result-note">
      Client:
      <strong>${escapeHTML(client)}</strong>
    </div>

    <div class="result-note">
      ${escapeHTML(product)}
      × ${quantity}
    </div>

    <div class="result-note">
      Tombony estimé:
      <strong>${formatAr(profit)}</strong>
    </div>

    <div class="badge badge-green">
      ${escapeHTML(status)}
    </div>
  `;

  showToast(
    "Commande voatahiry.",
    "success"
  );
}


/* =========================================================
   17. RECEIPT
   ========================================================= */

function renderReceiptTool() {
  return `
    ${workspaceHeader(
      "Reçu de Vente",
      "Mamoròna reçu tsotra azo adika na alefa amin'ny client."
    )}

    <form id="receiptForm">

      <div class="form-grid">

        <div class="form-group">
          <label class="form-label">
            Client
          </label>

          <input
            id="receiptClient"
            class="form-control"
            type="text"
            placeholder="Anaran'ny client"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Produit
          </label>

          <input
            id="receiptProduct"
            class="form-control"
            type="text"
            placeholder="Produit"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Quantité
          </label>

          <input
            id="receiptQuantity"
            class="form-control"
            type="number"
            min="1"
            value="1"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            Prix unitaire
          </label>

          <input
            id="receiptPrice"
            class="form-control"
            type="number"
            min="0"
            required
          >
        </div>

        <div class="form-group full">
          <label class="form-label">
            Fanamarihana
          </label>

          <textarea
            id="receiptNote"
            class="form-control"
            placeholder="Livraison, paiement, etc."
          ></textarea>
        </div>

      </div>

      <div class="form-actions">

        <button
          type="submit"
          class="btn btn-primary"
        >
          Créer reçu
        </button>

      </div>

    </form>

    <div
      id="receiptResult"
      class="result-box"
    ></div>
  `;
}


function createReceipt() {
  const client =
    byId("receiptClient")?.value.trim()
    || "Client";

  const product =
    byId("receiptProduct")?.value.trim();

  const quantity =
    numberValue(byId("receiptQuantity")?.value) || 1;

  const price =
    numberValue(byId("receiptPrice")?.value);

  const note =
    byId("receiptNote")?.value.trim();

  const total =
    quantity * price;

  const receiptNumber =
    `TM-${Date.now().toString().slice(-8)}`;

  const text =
`TANTSAHA MATIHANINA
REÇU DE VENTE

N°: ${receiptNumber}
Date: ${new Date().toLocaleDateString("fr-FR")}

Client: ${client}

Produit: ${product}
Quantité: ${quantity}
Prix unitaire: ${formatAr(price)}

TOTAL: ${formatAr(total)}

${note ? `Note: ${note}\n` : ""}

Misaotra tompoko.
Mianatra • Mampihatra • Mahomby`;

  const result =
    byId("receiptResult");

  if (!result) {
    return;
  }

  result.classList.add("active");

  result.innerHTML = `
    <div class="result-title">
      Reçu ${receiptNumber}
    </div>

    <div class="alert alert-info">
      ${escapeHTML(text).replaceAll("\n", "<br>")}
    </div>

    <button
      type="button"
      class="btn btn-primary"
      id="copyReceipt"
    >
      Copier le reçu
    </button>
  `;

  const copy =
    byId("copyReceipt");

  if (copy) {
    copy.addEventListener(
      "click",
      () => copyText(text)
    );
  }

  showToast(
    "Reçu créé.",
    "success"
  );
}


/* =========================================================
   18. GUIDE
   ========================================================= */

function renderGuideTool() {
  return `
    ${workspaceHeader(
      "Guide Vente",
      "Fomba fohy hampiasana ny Vente Lab."
    )}

    <div class="alert alert-info">
      <strong>Règle principale:</strong>
      Vakio aloha ny lesona ao amin'ny WhatsApp Formation,
      avy eo ampiharo eto amin'ny Lab,
      farany alefaso ao amin'ny Retour & Évaluation ny vokatra.
    </div>

    <div class="formation-list">

      <div class="formation-day">
        <div class="day-number">1</div>

        <div class="day-content">
          <h3>Fototry ny Vente</h3>
          <p>
            Fantaro fa tsy produit ihany no amidina,
            fa valeur sy solution.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">2</div>

        <div class="day-content">
          <h3>Client Cible</h3>
          <p>
            Fantaro hoe iza no tena mila ilay vokatra.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">3</div>

        <div class="day-content">
          <h3>Offre & Prix</h3>
          <p>
            Amboary ny offre ary kajio ny tombony.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">4</div>

        <div class="day-content">
          <h3>Publication</h3>
          <p>
            Hook → Problème → Solution → Offre → CTA.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">5</div>

        <div class="day-content">
          <h3>Prospection</h3>
          <p>
            Comment → MP → Qualification → Discussion.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">6</div>

        <div class="day-content">
          <h3>Objection & Closing</h3>
          <p>
            Mianara mamaly objection ary mitarika mankany amin'ny commande.
          </p>
        </div>
      </div>

      <div class="formation-day">
        <div class="day-number">7</div>

        <div class="day-content">
          <h3>Suivi & Fidélisation</h3>
          <p>
            Araho ny client ary jereo ny résultat.
          </p>
        </div>
      </div>

    </div>

    <div class="form-actions">

      <a
        class="btn btn-primary"
        href="${APP_CONFIG.whatsappGroup}"
        target="_blank"
        rel="noopener"
      >
        Miditra amin'ny Formation WhatsApp
      </a>

    </div>
  `;
}


/* =========================================================
   19. CHALLENGE 7 DAYS
   ========================================================= */

function renderChallengeTool() {
  return `
    ${workspaceHeader(
      "Challenge 7 Jours",
      "Manao zavatra iray azo refesina isan'andro."
    )}

    <div class="formation-list">

      ${[
        ["Jour 1", "Farito ny produit sy ny valeur amidinao."],
        ["Jour 2", "Farito ny client cible."],
        ["Jour 3", "Kajio ny coût, prix ary tombony."],
        ["Jour 4", "Mamoròna publication iray."],
        ["Jour 5", "Mifandraisa amin'ny prospects."],
        ["Jour 6", "Manaova simulation objection."],
        ["Jour 7", "Ataovy ny suivi ary kajio ny résultat."]
      ].map((item, index) => `
        <div class="formation-day">

          <div class="day-number">
            ${index + 1}
          </div>

          <div class="day-content">

            <h3>
              ${item[0]}
            </h3>

            <p>
              ${escapeHTML(item[1])}
            </p>

            <label class="check-item">
              <input
                type="checkbox"
                class="challenge-check"
                data-day="${index + 1}"
              >

              Vita
            </label>

          </div>

        </div>
      `).join("")}

    </div>

    <div
      id="challengeProgress"
      class="result-box active"
    ></div>
  `;
}


function updateChallengeProgress() {
  const checks =
    $$(".challenge-check");

  const completed =
    checks.filter(
      checkbox => checkbox.checked
    ).length;

  const total =
    checks.length;

  const percent =
    total > 0
      ? (completed / total) * 100
      : 0;

  const result =
    byId("challengeProgress");

  if (!result) {
    return;
  }

  result.innerHTML = `
    <div class="result-title">
      Progression
    </div>

    <div class="result-value">
      ${completed}/${total}
    </div>

    <div class="result-note">
      ${percent.toFixed(0)}% vita
    </div>
  `;
}


/* =========================================================
   20. DEFAULT TOOL
   ========================================================= */

function renderDefaultTool() {
  return `
    ${workspaceHeader(
      "Vente Lab",
      "Misafidiana outil iray hanombohana."
    )}

    <div class="empty-state">
      <div class="empty-icon">🧪</div>

      <div class="empty-title">
        Vente Lab
      </div>

      <div class="empty-description">
        Safidio ny outil tianao hampiasaina.
      </div>
    </div>
  `;
}


/* =========================================================
   21. WORKSPACE EVENTS
   ========================================================= */

function bindWorkspaceEvents() {

  /* Close */

  const close =
    $(".workspace-close");

  if (close) {
    close.addEventListener(
      "click",
      closeTool
    );
  }


  /* Price */

  const priceForm =
    byId("priceForm");

  if (priceForm) {

    priceForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        calculatePrice();
      }
    );

  }


  const clearPrice =
    byId("clearPrice");

  if (clearPrice) {

    clearPrice.addEventListener(
      "click",
      () => {
        byId("priceForm")?.reset();
        byId("priceResult")?.classList.remove("active");
      }
    );

  }


  /* Elevage */

  const elevageForm =
    byId("elevageForm");

  if (elevageForm) {

    elevageForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        calculateElevage();
      }
    );

  }


  /* Offer */

  const offerForm =
    byId("offerForm");

  if (offerForm) {

    offerForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        createOffer();
      }
    );

  }


  /* Publication */

  const publicationForm =
    byId("publicationForm");

  if (publicationForm) {

    publicationForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        createPublication();
      }
    );

  }


  /* Simulation */

  const simulationSelect =
    byId("simulationScenario");

  if (simulationSelect) {

    simulationSelect.addEventListener(
      "change",
      updateSimulationClient
    );

    updateSimulationClient();
  }


  const evaluate =
    byId("evaluateSimulation");

  if (evaluate) {

    evaluate.addEventListener(
      "click",
      evaluateSimulation
    );

  }


  /* Order */

  const orderForm =
    byId("orderForm");

  if (orderForm) {

    orderForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        saveOrder();
      }
    );

  }


  /* Receipt */

  const receiptForm =
    byId("receiptForm");

  if (receiptForm) {

    receiptForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        createReceipt();
      }
    );

  }


  /* Challenge */

  $$(".challenge-check").forEach(
    checkbox => {

      checkbox.addEventListener(
        "change",
        updateChallengeProgress
      );

    }
  );

  if ($$(".challenge-check").length) {
    updateChallengeProgress();
  }
}


/* =========================================================
   22. COPY TEXT
   ========================================================= */

async function copyText(text) {

  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        text
      );

    } else {

      const textarea =
        document.createElement("textarea");

      textarea.value = text;

      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand("copy");

      textarea.remove();
    }

    showToast(
      "Voakopia.",
      "success"
    );

  } catch (error) {

    console.error(
      "Erreur copie:",
      error
    );

    showToast(
      "Tsy afaka manao copie automatique.",
      "error"
    );
  }
}


/* =========================================================
   23. DASHBOARD
   ========================================================= */

function updateDashboard() {

  const calculations =
    state.calculations || [];

  const orders =
    state.orders || [];

  const totalCalculations =
    calculations.length;

  const totalOrders =
    orders.length;

  const paidOrders =
    orders.filter(
      order =>
        order.status === "Payée" ||
        order.status === "Livrée"
    );

  const revenue =
    paidOrders.reduce(
      (sum, order) =>
        sum + numberValue(order.revenue),
      0
    );

  const estimatedProfit =
    calculations.reduce(
      (sum, calculation) =>
        sum + numberValue(calculation.profit),
      0
    );

  const realizedProfit =
    paidOrders.reduce(
      (sum, order) =>
        sum + numberValue(order.profit),
      0
    );


  /* Stats */

  setText(
    "statCalculations",
    formatNumber(totalCalculations)
  );

  setText(
    "statOrders",
    formatNumber(totalOrders)
  );

  setText(
    "statRevenue",
    formatAr(revenue)
  );

  setText(
    "statProfit",
    formatAr(realizedProfit)
  );


  /* Optional alternative IDs */

  setText(
    "calculationsCount",
    formatNumber(totalCalculations)
  );

  setText(
    "ordersCount",
    formatNumber(totalOrders)
  );

  setText(
    "revenueValue",
    formatAr(revenue)
  );

  setText(
    "profitValue",
    formatAr(realizedProfit)
  );

  setText(
    "estimatedProfit",
    formatAr(estimatedProfit)
  );


  updateFunnel();

  renderRecentCalculations();

  renderRecentOrders();
}


function setText(id, value) {

  const element =
    byId(id);

  if (element) {
    element.textContent = value;
  }
}


/* =========================================================
   24. RECENT CALCULATIONS
   ========================================================= */

function renderRecentCalculations() {

  const container =
    byId("recentCalculations");

  if (!container) {
    return;
  }

  const items =
    state.calculations.slice(0, 5);

  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          🧮
        </div>

        <div class="empty-title">
          Tsy mbola misy calcul
        </div>

        <div class="empty-description">
          Ampiasao aloha ny Kajy Prix & Tombony.
        </div>

      </div>
    `;

    return;
  }

  container.innerHTML =
    items.map(item => `
      <div class="recent-item">

        <div class="recent-main">

          <div class="recent-title">
            ${escapeHTML(item.product || item.type || "Calcul")}
          </div>

          <div class="recent-meta">
            ${formatDate(item.createdAt)}
          </div>

        </div>

        <div class="recent-value">
          ${formatAr(item.profit)}
        </div>

      </div>
    `).join("");
}


/* =========================================================
   25. RECENT ORDERS
   ========================================================= */

function renderRecentOrders() {

  const container =
    byId("recentOrders");

  if (!container) {
    return;
  }

  const items =
    state.orders.slice(0, 5);

  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          🛒
        </div>

        <div class="empty-title">
          Tsy mbola misy commande
        </div>

        <div class="empty-description">
          Ny commande voatahiry eto dia hita eto.
        </div>

      </div>
    `;

    return;
  }

  container.innerHTML =
    items.map(item => `
      <div class="recent-item">

        <div class="recent-main">

          <div class="recent-title">
            ${escapeHTML(item.client)}
          </div>

          <div class="recent-meta">
            ${escapeHTML(item.product)}
            · ${escapeHTML(item.status)}
          </div>

        </div>

        <div class="recent-value">
          ${formatAr(item.revenue)}
        </div>

      </div>
    `).join("");
}


/* =========================================================
   26. FUNNEL
   ========================================================= */

function updateFunnel() {

  const funnel =
    state.funnel || defaultState.funnel;

  updateFunnelItem(
    "funnelProspects",
    "funnelBarProspects",
    funnel.prospects
  );

  updateFunnelItem(
    "funnelResponses",
    "funnelBarResponses",
    funnel.responses
  );

  updateFunnelItem(
    "funnelDiscussions",
    "funnelBarDiscussions",
    funnel.discussions
  );

  updateFunnelItem(
    "funnelOrders",
    "funnelBarOrders",
    funnel.orders
  );

  updateFunnelItem(
    "funnelClients",
    "funnelBarClients",
    funnel.clients
  );
}


function updateFunnelItem(
  numberId,
  barId,
  value
) {

  setText(
    numberId,
    formatNumber(value)
  );

  const bar =
    byId(barId);

  if (!bar) {
    return;
  }

  const max =
    Math.max(
      state.funnel.prospects,
      1
    );

  const percentage =
    Math.min(
      100,
      (numberValue(value) / max) * 100
    );

  bar.style.width =
    `${percentage}%`;
}


/* =========================================================
   27. EVALUATION
   ========================================================= */

function initEvaluation() {

  const form =
    byId("evaluationForm");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const data =
        new FormData(form);

      const evaluation = {
        id: Date.now(),

        channel:
          data.get("channel") || "",

        publication:
          data.get("publication") || "",

        views:
          numberValue(data.get("views")),

        messages:
          numberValue(data.get("messages")),

        prospects:
          numberValue(data.get("prospects")),

        responses:
          numberValue(data.get("responses")),

        discussions:
          numberValue(data.get("discussions")),

        orders:
          numberValue(data.get("orders")),

        revenue:
          numberValue(data.get("revenue")),

        profit:
          numberValue(data.get("profit")),

        objection:
          data.get("objection") || "",

        lesson:
          data.get("lesson") || "",

        createdAt:
          today()
      };

      state.evaluations.unshift(
        evaluation
      );

      state.evaluations =
        state.evaluations.slice(0, 100);

      state.funnel.prospects +=
        evaluation.prospects;

      state.funnel.responses +=
        evaluation.responses;

      state.funnel.discussions +=
        evaluation.discussions;

      state.funnel.orders +=
        evaluation.orders;

      saveState();

      updateDashboard();

      form.reset();

      showToast(
        "Retour & Évaluation voatahiry.",
        "success"
      );
    }
  );
}


/* =========================================================
   28. SIMPLE EVALUATION FALLBACK
   ========================================================= */

function initEvaluationButton() {

  $$("[data-action='evaluation']").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            byId("evaluation");

          if (section) {
            section.scrollIntoView({
              behavior: "smooth"
            });
          }

        }
      );

    }
  );
}


/* =========================================================
   29. SUPABASE INITIALIZATION
   ========================================================= */

function initSupabase() {

  if (
    typeof window.supabase === "undefined"
  ) {

    console.warn(
      "Supabase JS n'est pas chargé."
    );

    return;
  }

  try {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey
      );

    console.log(
      "Supabase connecté."
    );

    loadApprovedReviews();

  } catch (error) {

    console.error(
      "Erreur Supabase:",
      error
    );
  }
}


/* =========================================================
   30. LOAD APPROVED REVIEWS
   ========================================================= */

async function loadApprovedReviews() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("vente_reviews")
        .select(
          "id,rating,name,learning,applied,result,message,created_at"
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
      throw error;
    }

    renderReviews(data || []);

  } catch (error) {

    console.error(
      "Erreur chargement avis:",
      error
    );
  }
}


/* =========================================================
   31. RENDER REVIEWS
   ========================================================= */

function renderReviews(reviews) {

  const container =
    byId("reviewsList");

  if (!container) {
    return;
  }

  if (!reviews.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ⭐
        </div>

        <div class="empty-title">
          Mbola tsy misy avis public
        </div>

        <div class="empty-description">
          Ny avis dia miseho rehefa ankatoavin'ny admin.
        </div>

      </div>
    `;

    return;
  }

  container.innerHTML =
    reviews.map(review => {

      const rating =
        Math.max(
          1,
          Math.min(
            5,
            numberValue(review.rating)
          )
        );

      const stars =
        "★".repeat(rating) +
        "☆".repeat(5 - rating);

      return `
        <article class="review-card">

          <div class="review-stars">
            ${stars}
          </div>

          <div class="review-message">
            ${escapeHTML(review.message)}
          </div>

          <div class="review-author">
            ${escapeHTML(review.name)}
          </div>

          ${
            review.result
              ? `
                <div class="review-result">
                  ${escapeHTML(review.result)}
                </div>
              `
              : ""
          }

        </article>
      `;

    }).join("");
}


/* =========================================================
   32. REVIEW MODAL
   ========================================================= */

function initReviewForm() {

  const form =
    byId("reviewForm");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!supabaseClient) {

        showToast(
          "Supabase mbola tsy connecté.",
          "error"
        );

        return;
      }

      const formData =
        new FormData(form);

      const consent =
        formData.get("consent") === "on";

      if (!consent) {

        showToast(
          "Tokony hanaiky ny publication ianao.",
          "warning"
        );

        return;
      }

      const payload = {

        name:
          String(
            formData.get("name") || ""
          ).trim(),

        rating:
          numberValue(
            formData.get("rating")
          ),

        learning:
          String(
            formData.get("learning") || ""
          ).trim(),

        applied:
          String(
            formData.get("applied") || ""
          ).trim(),

        result:
          String(
            formData.get("result") || ""
          ).trim(),

        message:
          String(
            formData.get("message") || ""
          ).trim(),

        consent: true,

        status: "pending"
      };

      if (
        !payload.name ||
        !payload.rating ||
        !payload.message
      ) {

        showToast(
          "Fenoy aloha ny champs ilaina.",
          "warning"
        );

        return;
      }

      try {

        const {
          error
        } =
          await supabaseClient
            .from("vente_reviews")
            .insert(payload);

        if (error) {
          throw error;
        }

        form.reset();

        closeModal();

        showToast(
          "Misaotra! Nalefa ny avis-nao ary miandry validation.",
          "success"
        );

      } catch (error) {

        console.error(
          "Erreur insertion review:",
          error
        );

        showToast(
          "Nisy olana tamin'ny fandefasana avis.",
          "error"
        );
      }
    }
  );
}


/* =========================================================
   33. MODAL
   ========================================================= */

function initModals() {

  $$("[data-modal-open]").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const modalId =
            button.dataset.modalOpen;

          openModal(modalId);
        }
      );

    }
  );


  $$("[data-modal-close]").forEach(
    button => {

      button.addEventListener(
        "click",
        closeModal
      );

    }
  );


  $$(".modal-overlay").forEach(
    overlay => {

      overlay.addEventListener(
        "click",
        event => {

          if (
            event.target === overlay
          ) {
            closeModal();
          }

        }
      );

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closeModal();
      }

    }
  );
}


function openModal(id) {

  const modal =
    byId(id);

  if (!modal) {
    return;
  }

  modal.classList.add("active");

  document.body.style.overflow =
    "hidden";
}


function closeModal() {

  $$(".modal-overlay.active")
    .forEach(modal => {
      modal.classList.remove("active");
    });

  document.body.style.overflow =
    "";
}


/* =========================================================
   34. EXTERNAL LINKS
   ========================================================= */

function initExternalLinks() {

  $$("[data-link='whatsapp-group']")
    .forEach(link => {

      link.href =
        APP_CONFIG.whatsappGroup;

      link.target = "_blank";
      link.rel = "noopener";

    });


  $$("[data-link='whatsapp-purchase']")
    .forEach(link => {

      link.href =
        APP_CONFIG.whatsappPurchase;

      link.target = "_blank";
      link.rel = "noopener";

    });


  $$("[data-link='facebook']")
    .forEach(link => {

      link.href =
        APP_CONFIG.facebook;

      link.target = "_blank";
      link.rel = "noopener";

    });
}


/* =========================================================
   35. FORMAT DATE
   ========================================================= */

function formatDate(date) {

  if (!date) {
    return "";
  }

  try {

    return new Date(date)
      .toLocaleDateString(
        "fr-FR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      );

  } catch {
    return "";
  }
}


/* =========================================================
   36. RESET LOCAL DATA
   ========================================================= */

function resetLocalData() {

  const confirmed =
    window.confirm(
      "Hamafa ny données rehetra ao amin'ity appareil ity ve?"
    );

  if (!confirmed) {
    return;
  }

  state =
    structuredClone(defaultState);

  saveState();

  updateDashboard();

  showToast(
    "Données voafafa.",
    "success"
  );
}


/* =========================================================
   37. OPTIONAL RESET BUTTON
   ========================================================= */

function initResetButton() {

  $$("[data-reset-local]")
    .forEach(button => {

      button.addEventListener(
        "click",
        resetLocalData
      );

    });
}


/* =========================================================
   38. DASHBOARD AUTO REFRESH
   ========================================================= */

function initDashboard() {

  updateDashboard();

  window.addEventListener(
    "storage",
    event => {

      if (
        event.key === APP_CONFIG.storageKey
      ) {

        state =
          loadState();

        updateDashboard();
      }

    }
  );
}


/* =========================================================
   39. FORM ENTER PROTECTION
   ========================================================= */

function initFormProtection() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter" ||
        event.target.tagName !== "INPUT"
      ) {
        return;
      }

      const form =
        event.target.closest("form");

      if (!form) {
        return;
      }

      const submit =
        form.querySelector(
          'button[type="submit"]'
        );

      if (submit) {
        event.preventDefault();
        submit.click();
      }

    }
  );
}


/* =========================================================
   40. INITIALIZATION
   ========================================================= */

function initApp() {

  console.log(
    "Tantsaha Matihanina — Vente Lab"
  );

  console.log(
    "Mianatra • Mampihatra • Mahomby"
  );

  initMobileNavigation();

  initSmoothScroll();

  initToolWorkspace();

  initEvaluation();

  initEvaluationButton();

  initSupabase();

  initReviewForm();

  initModals();

  initExternalLinks();

  initResetButton();

  initDashboard();

  initFormProtection();
}


/* =========================================================
   41. START
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

} else {

  initApp();

}