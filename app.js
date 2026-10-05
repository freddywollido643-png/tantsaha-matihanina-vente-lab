/* ============================================================
   TANTSAHA MATIHANINA • VENTE LAB
   APP.JS — VERSION COMPLETE

   Modules:
   - Mobile navigation
   - Smooth navigation
   - Tool workspace
   - Prix & Tombony
   - Kajy Fiompiana
   - Calendrier Mpiompy & Vente
   - Créer une Offre
   - Publication
   - Simulation Client
   - Commande
   - Reçu
   - Guide
   - Challenge 7 Jours
   - Dashboard
   - Funnel
   - Retour & Évaluation
   - Supabase Reviews
   - Modal
   - LocalStorage
============================================================ */


/* ============================================================
   1. CONFIGURATION
============================================================ */

const TM_CONFIG = {

  whatsappGroup:
    "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",

  whatsappPurchase:
    "https://wa.me/261385651378",

  facebook:
    "https://www.facebook.com/share/1Zfiu8oj3m/",

  supabaseUrl:
    "https://sdzybetralbaincrxddf.supabase.co",

  supabaseKey:
    "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"

};


/* ============================================================
   2. SUPABASE
============================================================ */

let supabaseClient = null;

function initSupabase() {

  try {

    if (
      window.supabase &&
      typeof window.supabase.createClient === "function"
    ) {

      supabaseClient = window.supabase.createClient(
        TM_CONFIG.supabaseUrl,
        TM_CONFIG.supabaseKey
      );

    }

  } catch (error) {

    console.warn(
      "Supabase non disponible:",
      error
    );

  }

}


/* ============================================================
   3. LOCAL STORAGE
============================================================ */

const STORAGE_KEY =
  "tantsaha_matihanina_vente_lab_v2";


function defaultState() {

  return {

    calculations: [],

    livestockCalculations: [],

    calendarPlans: [],

    offers: [],

    publications: [],

    simulations: [],

    orders: [],

    evaluations: [],

    challenge: {},

    lastUpdated: null

  };

}


function loadState() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {

      return defaultState();

    }

    const parsed =
      JSON.parse(raw);

    return {
      ...defaultState(),
      ...parsed
    };

  } catch (error) {

    console.warn(
      "Erreur localStorage:",
      error
    );

    return defaultState();

  }

}


let state = loadState();


function saveState() {

  state.lastUpdated =
    new Date().toISOString();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


/* ============================================================
   4. HELPERS
============================================================ */

function $(selector) {

  return document.querySelector(selector);

}


function $all(selector) {

  return Array.from(
    document.querySelectorAll(selector)
  );

}


function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatNumber(value) {

  const number =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "fr-FR"
  ).format(number);

}


function formatAr(value) {

  return `${formatNumber(value)} Ar`;

}


function round(value, decimals = 2) {

  const factor =
    Math.pow(10, decimals);

  return Math.round(
    (Number(value) || 0) * factor
  ) / factor;

}


function todayISO() {

  const date =
    new Date();

  return date.toISOString()
    .split("T")[0];

}


function parseDate(dateString) {

  const date =
    new Date(`${dateString}T00:00:00`);

  return date;

}


function formatDate(dateString) {

  if (!dateString) {
    return "—";
  }

  const date =
    parseDate(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(date);

}


function addDays(dateString, days) {

  const date =
    parseDate(dateString);

  date.setDate(
    date.getDate() + Number(days)
  );

  return date
    .toISOString()
    .split("T")[0];

}


function showToast(
  message,
  type = "success"
) {

  const container =
    $("#toastContainer");

  if (!container) {
    return;
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast toast-${type}`;

  toast.textContent =
    message;

  container.appendChild(toast);

  setTimeout(() => {

    toast.classList.add("show");

  }, 20);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3500);

}


function scrollToSection(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* ============================================================
   5. MOBILE NAVIGATION
============================================================ */

function initNavigation() {

  const toggle =
    $(".nav-toggle");

  const nav =
    $(".main-nav");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener(
    "click",
    () => {

      const open =
        nav.classList.toggle("open");

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

    }
  );


  $all(".main-nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          nav.classList.remove("open");

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });

}


/* ============================================================
   6. SMOOTH LINKS
============================================================ */

function initSmoothLinks() {

  $all('a[href^="#"]')
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          const href =
            link.getAttribute("href");

          if (
            !href ||
            href === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(href);

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }
      );

    });

}


/* ============================================================
   7. TOOL WORKSPACE
============================================================ */

function openTool(tool) {

  const workspace =
    $("#toolWorkspace");

  if (!workspace) {
    return;
  }

  const renderers = {

    price:
      renderPriceTool,

    elevage:
      renderLivestockTool,

    calendar:
      renderCalendarTool,

    offer:
      renderOfferTool,

    publication:
      renderPublicationTool,

    simulation:
      renderSimulationTool,

    order:
      renderOrderTool,

    receipt:
      renderReceiptTool,

    guide:
      renderGuideTool,

    challenge:
      renderChallengeTool

  };


  const renderer =
    renderers[tool];

  if (!renderer) {

    workspace.innerHTML = `
      <div class="workspace-placeholder">
        <h3>Outil mbola tsy voaomana</h3>
        <p>
          Havaozina tsy ho ela ity fonctionnalité ity.
        </p>
      </div>
    `;

    return;

  }

  renderer(workspace);

  setTimeout(() => {

    workspace.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 50);

}


function initTools() {

  $all("[data-tool]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const tool =
            button.dataset.tool;

          openTool(tool);

        }
      );

    });

}


/* ============================================================
   8. TOOL HEADER
============================================================ */

function toolHeader(
  icon,
  title,
  description
) {

  return `

    <div class="workspace-header">

      <div class="workspace-icon">
        ${icon}
      </div>

      <div>

        <span class="eyebrow">
          VENTE LAB
        </span>

        <h2>
          ${escapeHTML(title)}
        </h2>

        <p>
          ${escapeHTML(description)}
        </p>

      </div>

    </div>

  `;

}


/* ============================================================
   9. PRIX & TOMBONY
============================================================ */

function renderPriceTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🧮",
      "Kajy Prix & Tombony",
      "Fantaro aloha ny coût sy ny tombony alohan'ny hivarotana."
    )}

    <div class="tool-explanation">

      <h3>Inona no ataon'ity outil ity?</h3>

      <p>
        Izy ity dia manampy anao hahafantatra
        hoe ohatrinona ny vola lany, ny CA,
        ny tombony ary ny marge.
      </p>

      <h3>Rahoviana no ampiasaina?</h3>

      <p>
        Ampiasao izy alohan'ny hametrahana prix
        na hamoahana publication.
      </p>

      <div class="example-box">

        <strong>Ohatra:</strong>

        <p>
          Coût total = 100 000 Ar
        </p>

        <p>
          Prix = 15 000 Ar / unité
        </p>

        <p>
          Raha 10 no amidy:
          CA = 150 000 Ar
        </p>

        <p>
          Tombony = 50 000 Ar
        </p>

      </div>

    </div>


    <form id="priceForm" class="tool-form">

      <div class="form-group">

        <label>
          Anaran'ny vokatra
        </label>

        <input
          name="product"
          type="text"
          placeholder="Ohatra: Akoho Gasy"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Isan'ny vokatra
        </label>

        <input
          name="quantity"
          type="number"
          min="1"
          value="1"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Coût total
        </label>

        <input
          name="cost"
          type="number"
          min="0"
          placeholder="Ohatra: 60000"
          required
        >

        <small>
          Vola tena lany amin'ny vokatra rehetra.
        </small>

      </div>


      <div class="form-group">

        <label>
          Prix de vente / unité
        </label>

        <input
          name="price"
          type="number"
          min="0"
          placeholder="Ohatra: 15000"
          required
        >

      </div>


      <button
        type="submit"
        class="btn btn-primary"
      >
        Kajio ny tombony
      </button>

    </form>


    <div
      id="priceResult"
      class="tool-result"
    ></div>

  `;


  $("#priceForm")
    .addEventListener(
      "submit",
      calculatePrice
    );

}


function calculatePrice(event) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const data =
    new FormData(form);

  const product =
    data.get("product");

  const quantity =
    Number(data.get("quantity"));

  const cost =
    Number(data.get("cost"));

  const price =
    Number(data.get("price"));

  if (
    quantity <= 0 ||
    cost < 0 ||
    price < 0
  ) {

    showToast(
      "Jereo tsara ny isa nampidirina.",
      "error"
    );

    return;

  }


  const revenue =
    quantity * price;

  const profit =
    revenue - cost;

  const margin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  const unitCost =
    cost / quantity;

  const result =
    {

      id: Date.now(),

      product,

      quantity,

      cost,

      price,

      revenue,

      profit,

      margin: round(margin),

      unitCost: round(unitCost),

      createdAt:
        new Date().toISOString()

    };


  state.calculations.unshift(
    result
  );

  saveState();

  const resultBox =
    $("#priceResult");

  resultBox.innerHTML = `

    <div class="result-card">

      <div class="result-card-header">

        <span>
          📊 Résultat
        </span>

        <strong>
          ${escapeHTML(product)}
        </strong>

      </div>


      <div class="result-grid">

        <div>
          <small>Coût total</small>
          <strong>${formatAr(cost)}</strong>
        </div>

        <div>
          <small>CA</small>
          <strong>${formatAr(revenue)}</strong>
        </div>

        <div>
          <small>Tombony</small>
          <strong>${formatAr(profit)}</strong>
        </div>

        <div>
          <small>Marge</small>
          <strong>${formatNumber(result.margin)} %</strong>
        </div>

      </div>


      <div class="result-explanation">

        ${
          profit > 0
            ? `
              <strong>✅ Misy tombony.</strong>
              <p>
                Amin'ity prix ity dia
                ${formatAr(profit)}
                ny tombony vinavinana.
              </p>
            `
            : profit === 0
              ? `
                <strong>⚠️ Tsy misy tombony.</strong>
                <p>
                  Mitovy ny CA sy ny coût.
                  Mila dinihina indray ny prix.
                </p>
              `
              : `
                <strong>❌ Perte.</strong>
                <p>
                  Ambany noho ny coût ny CA.
                  Aza maika hivarotra amin'ity prix ity.
                </p>
              `
        }

      </div>

    </div>

  `;


  updateDashboard();

  showToast(
    "Calcul vita ary voatahiry.",
    "success"
  );

}


/* ============================================================
   10. KAJY FIOMPIANA
============================================================ */

function renderLivestockTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🐔",
      "Kajy Fiompiana",
      "Kajio ny coût, prix de vente ary tombony amin'ny fiompiana."
    )}


    <div class="tool-explanation">

      <h3>Inona no tokony ho fantatra?</h3>

      <p>
        Tsy ny vidin'ny biby ihany no coût.
        Tokony hojerena koa ny sakafo sy ny dépenses hafa.
      </p>

      <div class="example-box">

        <strong>Ohatra:</strong>

        <p>
          Biby = 10
        </p>

        <p>
          Achat = 100 000 Ar
        </p>

        <p>
          Sakafo = 60 000 Ar
        </p>

        <p>
          Autres = 10 000 Ar
        </p>

        <p>
          Coût total = 170 000 Ar
        </p>

      </div>

    </div>


    <form id="livestockForm" class="tool-form">

      <div class="form-group">

        <label>
          Karazana fiompiana
        </label>

        <select name="animal" required>

          <option value="">
            Safidio
          </option>

          <option>Akoho Gasy</option>
          <option>Poulet de chair</option>
          <option>Pondeuse</option>
          <option>Kisoa</option>
          <option>Osy</option>
          <option>Ondry</option>
          <option>Bitro</option>
          <option>Gana</option>
          <option>Gisa</option>
          <option>Vorontsiloza</option>
          <option>Trondro</option>
          <option>Omby</option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Isan'ny biby
        </label>

        <input
          name="quantity"
          type="number"
          min="1"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Coût achat
        </label>

        <input
          name="purchase"
          type="number"
          min="0"
          value="0"
        >

      </div>


      <div class="form-group">

        <label>
          Coût sakafo
        </label>

        <input
          name="feed"
          type="number"
          min="0"
          value="0"
        >

      </div>


      <div class="form-group">

        <label>
          Autres coûts
        </label>

        <input
          name="other"
          type="number"
          min="0"
          value="0"
        >

      </div>


      <div class="form-group">

        <label>
          Prix de vente / biby
        </label>

        <input
          name="price"
          type="number"
          min="0"
          required
        >

      </div>


      <button
        type="submit"
        class="btn btn-primary"
      >
        Kajio ny fiompiana
      </button>

    </form>


    <div
      id="livestockResult"
      class="tool-result"
    ></div>

  `;


  $("#livestockForm")
    .addEventListener(
      "submit",
      calculateLivestock
    );

}


function calculateLivestock(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );

  const animal =
    data.get("animal");

  const quantity =
    Number(data.get("quantity"));

  const purchase =
    Number(data.get("purchase")) || 0;

  const feed =
    Number(data.get("feed")) || 0;

  const other =
    Number(data.get("other")) || 0;

  const price =
    Number(data.get("price")) || 0;


  const totalCost =
    purchase + feed + other;

  const revenue =
    quantity * price;

  const profit =
    revenue - totalCost;

  const margin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  const costPerAnimal =
    quantity > 0
      ? totalCost / quantity
      : 0;


  const result = {

    id: Date.now(),

    animal,

    quantity,

    purchase,

    feed,

    other,

    totalCost,

    price,

    revenue,

    profit,

    margin: round(margin),

    costPerAnimal:
      round(costPerAnimal),

    createdAt:
      new Date().toISOString()

  };


  state.livestockCalculations.unshift(
    result
  );

  saveState();


  $("#livestockResult").innerHTML = `

    <div class="result-card">

      <div class="result-card-header">

        <span>🐔 ${escapeHTML(animal)}</span>

        <strong>
          ${quantity} biby
        </strong>

      </div>


      <div class="result-grid">

        <div>
          <small>Coût total</small>
          <strong>${formatAr(totalCost)}</strong>
        </div>

        <div>
          <small>Coût / biby</small>
          <strong>${formatAr(costPerAnimal)}</strong>
        </div>

        <div>
          <small>CA</small>
          <strong>${formatAr(revenue)}</strong>
        </div>

        <div>
          <small>Tombony</small>
          <strong>${formatAr(profit)}</strong>
        </div>

      </div>


      <div class="result-explanation">

        ${
          profit > 0
            ? `
              <strong>✅ Fiompiana mahazo tombony.</strong>
              <p>
                Tombony vinavinana:
                ${formatAr(profit)}.
              </p>
            `
            : `
              <strong>⚠️ Mila dinihina.</strong>
              <p>
                Tsy mbola tsara ny différence
                entre coût sy CA.
              </p>
            `
        }

      </div>

    </div>

  `;


  updateDashboard();

  showToast(
    "Kajy fiompiana vita.",
    "success"
  );

}


/* ============================================================
   11. CALENDRIER MPIOMPY & VENTE
============================================================ */

/*
   IMPORTANT:
   Ireo durations ireo dia "base pédagogique".
   Tsy daty ara-pahasalamana raikitra.
   Ny tena fotoana dia miankina amin'ny race,
   alimentation, santé, poids ary marché.
*/

const ELEVAGE_RULES = {

  "Poulet de chair": {

    cycle: 45,

    preparation: 7,

    prospecting: 7,

    publication: 5,

    followup: 1,

    weightNote:
      "Jereo ny lanja sy ny toe-pahasalamana alohan'ny vente."

  },

  "Akoho Gasy": {

    cycle: 120,

    preparation: 14,

    prospecting: 10,

    publication: 7,

    followup: 1,

    weightNote:
      "Ny taona sy lanja no tokony hanampy amin'ny fanapahan-kevitra."

  },

  "Pondeuse": {

    cycle: 140,

    preparation: 14,

    prospecting: 10,

    publication: 7,

    followup: 1,

    weightNote:
      "Miova arakaraka ny tanjona: atody sa vente de sujet."

  },

  "Kisoa": {

    cycle: 180,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Araho indrindra ny lanja, alimentation ary prix marché."

  },

  "Osy": {

    cycle: 180,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Tsy daty raikitra ny vente; lanja sy tanjona no jerena."

  },

  "Ondry": {

    cycle: 180,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Araho ny lanja, santé ary tsena."

  },

  "Bitro": {

    cycle: 90,

    preparation: 10,

    prospecting: 7,

    publication: 5,

    followup: 1,

    weightNote:
      "Miankina amin'ny karazana sy tanjona ny fotoana."

  },

  "Gana": {

    cycle: 90,

    preparation: 14,

    prospecting: 10,

    publication: 7,

    followup: 1,

    weightNote:
      "Araho ny lanja sy ny tsena."

  },

  "Gisa": {

    cycle: 150,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Ny lanja sy ny tsena no tena tokony hojerena."

  },

  "Vorontsiloza": {

    cycle: 150,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Miankina amin'ny lanja sy tanjona ny vente."

  },

  "Trondro": {

    cycle: 180,

    preparation: 21,

    prospecting: 14,

    publication: 7,

    followup: 1,

    weightNote:
      "Ny poids moyen sy ny marché no tokony harahina."

  },

  "Omby": {

    cycle: 365,

    preparation: 30,

    prospecting: 21,

    publication: 14,

    followup: 1,

    weightNote:
      "Miova be arakaraka ny âge, poids, race ary marché."

  }

};


function renderCalendarTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "📅",
      "Calendrier Mpiompy & Vente",
      "Omano mialoha ny fiompiana, ny prospection ary ny vente."
    )}


    <div class="tool-explanation">

      <h3>
        🎯 Inona no ataon'ity outil ity?
      </h3>

      <p>
        Ampifandraisiny ny daty nanombohanao niompy
        sy ny fotoana tokony hanomanana ny vente.
      </p>

      <p>
        Tsy hoe milaza hoe “ity daty ity dia tsy maintsy
        mivarotra” izy. Manome <strong>période vinavinana</strong>
        ary mampahatsiahy anao ny fotoana tokony hanombohana
        mitady client.
      </p>


      <div class="example-box">

        <strong>Ohatra:</strong>

        <p>
          Nanomboka niompy:
          <strong>05 Oktobra</strong>
        </p>

        <p>
          Préparation:
          alohan'ny vente
        </p>

        <p>
          Prospection:
          manomboka mialoha
        </p>

        <p>
          Publication:
          rehefa manakaiky ny stock disponible
        </p>

      </div>


      <div class="important-note">

        <strong>
          ⚠️ Fanamarihana:
        </strong>

        <p>
          Vinavina pédagogique ihany ireo daty.
          Ny lanja tena izy, santé, alimentation,
          coût ary prix marché no tokony hanapaka
          ny décision farany.
        </p>

      </div>

    </div>


    <form
      id="calendarForm"
      class="tool-form"
    >

      <div class="form-group">

        <label>
          Karazana fiompiana
        </label>

        <select
          name="animal"
          id="calendarAnimal"
          required
        >

          <option value="">
            Safidio
          </option>

          ${Object.keys(ELEVAGE_RULES)
            .map(
              animal =>
                `<option value="${escapeHTML(animal)}">
                  ${escapeHTML(animal)}
                </option>`
            )
            .join("")}

        </select>

      </div>


      <div class="form-group">

        <label>
          Daty nanombohana
        </label>

        <input
          type="date"
          name="startDate"
          value="${todayISO()}"
          required
        >

        <small>
          Daty tena nanombohanao ny fiompiana.
        </small>

      </div>


      <div class="form-group">

        <label>
          Isan'ny biby
        </label>

        <input
          type="number"
          name="quantity"
          min="1"
          placeholder="Ohatra: 50"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Lanja ankehitriny (raha fantatra)
        </label>

        <input
          type="number"
          name="weight"
          min="0"
          step="0.01"
          placeholder="Ohatra: 1.2 kg"
        >

        <small>
          Tsy voatery. Ampiasao rehefa fantatra.
        </small>

      </div>


      <div class="form-group">

        <label>
          Tanjona
        </label>

        <select name="goal">

          <option value="Vente">
            Vente
          </option>

          <option value="Reproduction">
            Reproduction
          </option>

          <option value="Élevage">
            Élevage
          </option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Prix marché fantatra? (optionnel)
        </label>

        <input
          type="number"
          name="marketPrice"
          min="0"
          placeholder="Ohatra: 15000"
        >

      </div>


      <button
        type="submit"
        class="btn btn-primary"
      >
        Mamorona Calendrier
      </button>

    </form>


    <div
      id="calendarResult"
      class="tool-result"
    ></div>

  `;


  $("#calendarForm")
    .addEventListener(
      "submit",
      calculateCalendar
    );

}


function calculateCalendar(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );

  const animal =
    data.get("animal");

  const startDate =
    data.get("startDate");

  const quantity =
    Number(data.get("quantity"));

  const weight =
    Number(data.get("weight")) || null;

  const goal =
    data.get("goal");

  const marketPrice =
    Number(data.get("marketPrice")) || null;


  if (!animal || !startDate || quantity <= 0) {

    showToast(
      "Fenoy tsara ny informations ilaina.",
      "error"
    );

    return;

  }


  const rules =
    ELEVAGE_RULES[animal];


  const estimatedSale =
    addDays(
      startDate,
      rules.cycle
    );


  const preparationDate =
    addDays(
      estimatedSale,
      -rules.preparation
    );


  const prospectingDate =
    addDays(
      estimatedSale,
      -rules.prospecting
    );


  const publicationDate =
    addDays(
      estimatedSale,
      -rules.publication
    );


  const verificationDate =
    addDays(
      estimatedSale,
      -3
    );


  const followupDate =
    addDays(
      estimatedSale,
      rules.followup
    );


  const plan = {

    id: Date.now(),

    animal,

    startDate,

    quantity,

    weight,

    goal,

    marketPrice,

    estimatedSale,

    preparationDate,

    prospectingDate,

    publicationDate,

    verificationDate,

    followupDate,

    createdAt:
      new Date().toISOString()

  };


  state.calendarPlans.unshift(
    plan
  );

  saveState();


  $("#calendarResult").innerHTML = `

    <div class="result-card calendar-result">

      <div class="result-card-header">

        <span>
          📅 ${escapeHTML(animal)}
        </span>

        <strong>
          ${quantity} biby
        </strong>

      </div>


      <div class="calendar-result-warning">

        ⚠️
        <span>
          Ireo dia ireo dia
          <strong>vinavina</strong>.
          Hamarino hatrany ny lanja,
          santé, coût ary prix marché.
        </span>

      </div>


      <div class="calendar-timeline">


        <div class="calendar-event">

          <span class="calendar-event-icon">
            🌱
          </span>

          <div>

            <strong>
              Fanombohana
            </strong>

            <small>
              ${formatDate(startDate)}
            </small>

            <p>
              Nanomboka ny fiompiana.
            </p>

          </div>

        </div>


        <div class="calendar-event">

          <span class="calendar-event-icon">
            📊
          </span>

          <div>

            <strong>
              Préparation vente
            </strong>

            <small>
              ${formatDate(preparationDate)}
            </small>

            <p>
              Jereo ny lanja, coût,
              santé ary prix marché.
            </p>

          </div>

        </div>


        <div class="calendar-event">

          <span class="calendar-event-icon">
            🔎
          </span>

          <div>

            <strong>
              Manomboka mitady prospects
            </strong>

            <small>
              ${formatDate(prospectingDate)}
            </small>

            <p>
              Mitadiava client sy
              précommandes raha mety.
            </p>

          </div>

        </div>


        <div class="calendar-event">

          <span class="calendar-event-icon">
            📢
          </span>

          <div>

            <strong>
              Publication
            </strong>

            <small>
              ${formatDate(publicationDate)}
            </small>

            <p>
              Mamoaha publication
              mifanaraka amin'ny stock.
            </p>

          </div>

        </div>


        <div class="calendar-event">

          <span class="calendar-event-icon">
            ⚖️
          </span>

          <div>

            <strong>
              Contrôle final
            </strong>

            <small>
              ${formatDate(verificationDate)}
            </small>

            <p>
              Jereo indray ny lanja sy
              ny condition avant vente.
            </p>

          </div>

        </div>


        <div class="calendar-event calendar-event-main">

          <span class="calendar-event-icon">
            🛒
          </span>

          <div>

            <strong>
              Période de vente estimée
            </strong>

            <small>
              Manodidina ny ${formatDate(estimatedSale)}
            </small>

            <p>
              Tsy daty raikitra.
              Ny lanja sy ny tsena no manamafy
              ny fotoana tena mety.
            </p>

          </div>

        </div>


        <div class="calendar-event">

          <span class="calendar-event-icon">
            🤝
          </span>

          <div>

            <strong>
              Suivi client
            </strong>

            <small>
              ${formatDate(followupDate)}
            </small>

            <p>
              Anontanio ny satisfaction
              ary diniho ny repeat order.
            </p>

          </div>

        </div>


      </div>


      <div class="calendar-action-plan">

        <h3>
          🎯 Plan Vente
        </h3>

        <ul>

          <li>
            <strong>
              7–14 andro mialoha:
            </strong>
            manomboka mitady prospects.
          </li>

          <li>
            <strong>
              5–7 andro mialoha:
            </strong>
            mamoaka publication.
          </li>

          <li>
            <strong>
              3 andro mialoha:
            </strong>
            manao relance.
          </li>

          <li>
            <strong>
              1 andro mialoha:
            </strong>
            manamarina commandes.
          </li>

          <li>
            <strong>
              Jour de vente:
            </strong>
            vente + reçu.
          </li>

          <li>
            <strong>
              Aorian'ny vente:
            </strong>
            suivi + évaluation.
          </li>

        </ul>

      </div>


      <div class="calendar-note">

        <strong>
          ${escapeHTML(rules.weightNote)}
        </strong>

        ${
          marketPrice
            ? `
              <p>
                Prix marché nampidirinao:
                <strong>
                  ${formatAr(marketPrice)}
                </strong>
              </p>
            `
            : `
              <p>
                Tsy mbola nampiditra prix marché ianao.
                Jereo ny tsena alohan'ny hametrahana prix.
              </p>
            `
        }

      </div>


      <div class="result-actions">

        <button
          type="button"
          class="btn btn-secondary"
          id="calendarOfferButton"
        >
          Hanamboatra Offre
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          id="calendarPublicationButton"
        >
          Hanao Publication
        </button>

      </div>

    </div>

  `;


  const offerButton =
    $("#calendarOfferButton");

  if (offerButton) {

    offerButton.addEventListener(
      "click",
      () => openTool("offer")
    );

  }


  const publicationButton =
    $("#calendarPublicationButton");

  if (publicationButton) {

    publicationButton.addEventListener(
      "click",
      () => openTool("publication")
    );

  }


  showToast(
    "Calendrier de vente vita.",
    "success"
  );

}


/* ============================================================
   12. CREER UNE OFFRE
============================================================ */

function renderOfferTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🎁",
      "Créer une Offre",
      "Avadiho ho offre mazava ny produit-nao."
    )}


    <div class="tool-explanation">

      <h3>
        Tsy produit fotsiny no aseho.
      </h3>

      <p>
        Ny offre dia tokony hamaly hoe:
        iza no client, inona ny olany,
        inona ny solution, inona ny valeur
        ary inona no action tokony hataony.
      </p>

      <div class="formula-box">
        Client → Problème → Solution → Valeur → Prix → CTA
      </div>

    </div>


    <form
      id="offerForm"
      class="tool-form"
    >

      <div class="form-group">

        <label>
          Produit / Service
        </label>

        <input
          name="product"
          placeholder="Ohatra: Akoho Gasy"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Client cible
        </label>

        <input
          name="client"
          placeholder="Ohatra: Mpiompy vao manomboka"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Problème
        </label>

        <textarea
          name="problem"
          rows="3"
          placeholder="Inona ny olana ananan'ny client?"
          required
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Solution
        </label>

        <textarea
          name="solution"
          rows="3"
          placeholder="Ahoana no anampian'ny produit?"
          required
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Valeur / Tombontsoa
        </label>

        <textarea
          name="value"
          rows="3"
          placeholder="Inona no tombontsoa lehibe?"
          required
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Prix
        </label>

        <input
          name="price"
          type="number"
          min="0"
          placeholder="Ohatra: 15000"
          required
        >

      </div>


      <div class="form-group">

        <label>
          CTA
        </label>

        <input
          name="cta"
          placeholder="Ohatra: Alefaso MP raha mila"
          required
        >

      </div>


      <button
        type="submit"
        class="btn btn-primary"
      >
        Mamorona Offre
      </button>

    </form>


    <div
      id="offerResult"
      class="tool-result"
    ></div>

  `;


  $("#offerForm")
    .addEventListener(
      "submit",
      createOffer
    );

}


function createOffer(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );


  const offer = {

    id: Date.now(),

    product:
      data.get("product"),

    client:
      data.get("client"),

    problem:
      data.get("problem"),

    solution:
      data.get("solution"),

    value:
      data.get("value"),

    price:
      Number(data.get("price")),

    cta:
      data.get("cta"),

    createdAt:
      new Date().toISOString()

  };


  state.offers.unshift(
    offer
  );

  saveState();


  $("#offerResult").innerHTML = `

    <div class="result-card">

      <div class="result-card-header">

        <span>🎁 Offre</span>

        <strong>
          ${escapeHTML(offer.product)}
        </strong>

      </div>


      <div class="generated-copy">

        <p>
          <strong>
            ${escapeHTML(offer.product)}
          </strong>
        </p>

        <p>
          Ho an'ny
          <strong>
            ${escapeHTML(offer.client)}
          </strong>,
          raha sendra
          ${escapeHTML(offer.problem)},
          dia afaka manampy anao ny
          ${escapeHTML(offer.product)}.
        </p>

        <p>
          ${escapeHTML(offer.solution)}
        </p>

        <p>
          <strong>
            Tombontsoa:
          </strong>
          ${escapeHTML(offer.value)}
        </p>

        <p>
          <strong>
            Prix:
          </strong>
          ${formatAr(offer.price)}
        </p>

        <p>
          <strong>
            ${escapeHTML(offer.cta)}
          </strong>
        </p>

      </div>


      <button
        type="button"
        class="btn btn-secondary"
        id="copyOfferButton"
      >
        Adikao ny Offre
      </button>

    </div>

  `;


  $("#copyOfferButton")
    .addEventListener(
      "click",
      () => {

        const text =
          buildOfferText(offer);

        copyText(text);

      }
    );


  showToast(
    "Offre vita.",
    "success"
  );

}


function buildOfferText(offer) {

  return `
${offer.product}

Ho an'ny ${offer.client}.

Olana:
${offer.problem}

Solution:
${offer.solution}

Tombontsoa:
${offer.value}

Prix:
${formatAr(offer.price)}

${offer.cta}
  `.trim();

}


/* ============================================================
   13. PUBLICATION
============================================================ */

function renderPublicationTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "📢",
      "Créer une Publication",
      "Mamoròna publication ho an'ny Facebook, WhatsApp na Marketplace."
    )}


    <div class="tool-explanation">

      <h3>
        🧠 Structure simple
      </h3>

      <div class="formula-box">
        Hook → Problème → Solution → Offre → Preuve → Prix → CTA
      </div>

      <p>
        Aza manomboka amin'ny prix fotsiny.
        Ataovy mazava aloha ny olana sy ny tombontsoa.
      </p>

    </div>


    <form
      id="publicationForm"
      class="tool-form"
    >

      <div class="form-group">

        <label>
          Canal
        </label>

        <select name="channel">

          <option>Facebook</option>
          <option>WhatsApp</option>
          <option>Marketplace</option>

        </select>

      </div>


      <div class="form-group">

        <label>
          Produit
        </label>

        <input
          name="product"
          placeholder="Ohatra: Akoho Gasy"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Client cible
        </label>

        <input
          name="client"
          placeholder="Iza no tianao hahita azy?"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Problème
        </label>

        <textarea
          name="problem"
          rows="3"
          required
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Solution / Tombontsoa
        </label>

        <textarea
          name="solution"
          rows="3"
          required
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Preuve / Information mampitombo confiance
        </label>

        <textarea
          name="proof"
          rows="2"
          placeholder="Ohatra: lanja, quantité disponible, expérience..."
        ></textarea>

      </div>


      <div class="form-group">

        <label>
          Prix
        </label>

        <input
          name="price"
          type="number"
          min="0"
          required
        >

      </div>


      <div class="form-group">

        <label>
          CTA
        </label>

        <input
          name="cta"
          value="Alefaso MP raha mila"
          required
        >

      </div>


      <button
        type="submit"
        class="btn btn-primary"
      >
        Mamorona Publication
      </button>

    </form>


    <div
      id="publicationResult"
      class="tool-result"
    ></div>

  `;


  $("#publicationForm")
    .addEventListener(
      "submit",
      createPublication
    );

}


function createPublication(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );


  const publication = {

    id: Date.now(),

    channel:
      data.get("channel"),

    product:
      data.get("product"),

    client:
      data.get("client"),

    problem:
      data.get("problem"),

    solution:
      data.get("solution"),

    proof:
      data.get("proof"),

    price:
      Number(data.get("price")),

    cta:
      data.get("cta"),

    createdAt:
      new Date().toISOString()

  };


  state.publications.unshift(
    publication
  );

  saveState();


  const text =
    buildPublicationText(
      publication
    );


  $("#publicationResult").innerHTML = `

    <div class="result-card">

      <div class="result-card-header">

        <span>
          📢 ${escapeHTML(publication.channel)}
        </span>

        <strong>
          Publication prête
        </strong>

      </div>


      <div class="generated-copy">

        ${escapeHTML(text)
          .replace(/\n/g, "<br>")}

      </div>


      <button
        type="button"
        class="btn btn-secondary"
        id="copyPublicationButton"
      >
        Adikao ny Publication
      </button>

    </div>

  `;


  $("#copyPublicationButton")
    .addEventListener(
      "click",
      () => copyText(text)
    );


  showToast(
    "Publication vita.",
    "success"
  );

}


function buildPublicationText(item) {

  return `
🔥 ${item.product}

${item.problem}

${item.solution}

${item.proof}

💰 Prix:
${formatAr(item.price)}

📩 ${item.cta}
  `.trim();

}


/* ============================================================
   14. SIMULATION CLIENT
============================================================ */

const SIMULATION_SCENARIOS = [

  {
    id: "expensive",

    title:
      "Lafo loatra",

    client:
      "“Lafo be izany. Any amin'ny olona hafa mbola mora kokoa.”",

    expected:
      "Aza miady amin'ny client. Hazavao ny valeur, ny différence ary anontanio izay tena ilainy."

  },

  {
    id: "think",

    title:
      "Mbola hieritreritra",

    client:
      "“Mbola hieritreritra aloha aho dia hiverina.”",

    expected:
      "Aza manery. Fantaro izay mampisalasala azy ary omeo information ilainy."

  },

  {
    id: "discount",

    title:
      "Misy remise ve?",

    client:
      "“Misy remise ve raha maka betsaka?”",

    expected:
      "Fantaro aloha ny quantité sy ny marge vao manolotra remise."

  },

  {
    id: "location",

    title:
      "Aiza no misy anareo?",

    client:
      "“Aiza no misy anareo? Afaka maka mivantana ve?”",

    expected:
      "Valio mazava ny toerana, disponibilité ary fomba fandraisana commande."

  },

  {
    id: "pay-later",

    title:
      "Alefaso aloha",

    client:
      "“Alefaso aloha ilay produit dia mandoa aho rehefa tonga.”",

    expected:
      "Aza manaiky risika tsy voafehy. Hazavao mazava ny fepetra fandoavana sy livraison."

  }

];


function renderSimulationTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "💬",
      "Simulation Client",
      "Manao pratique amin'ny objection sy closing."
    )}


    <div class="tool-explanation">

      <h3>
        🎯 Inona no tanjona?
      </h3>

      <p>
        Tsy ampy ny mahafantatra théorie.
        Mila mahay mamaly client koa ianao rehefa misy objection.
      </p>

      <p>
        Safidio ny scenario, vakio ny hafatr'ilay client,
        soraty ny valinteninao, ary jereo ny fanombanana.
      </p>

    </div>


    <div class="simulation-selector">

      ${SIMULATION_SCENARIOS
        .map(
          scenario => `
            <button
              type="button"
              class="simulation-option"
              data-simulation="${scenario.id}"
            >
              ${escapeHTML(scenario.title)}
            </button>
          `
        )
        .join("")}

    </div>


    <div
      id="simulationArea"
      class="simulation-area"
    >

      <div class="workspace-placeholder">

        <h3>
          Safidio aloha ny objection
        </h3>

        <p>
          Hanomboka ny simulation rehefa misafidy scenario ianao.
        </p>

      </div>

    </div>

  `;


  $all("[data-simulation]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          renderSimulationScenario(
            button.dataset.simulation
          );

        }
      );

    });

}


function renderSimulationScenario(id) {

  const scenario =
    SIMULATION_SCENARIOS.find(
      item => item.id === id
    );

  if (!scenario) {
    return;
  }


  const area =
    $("#simulationArea");

  area.innerHTML = `

    <div class="simulation-card">

      <span class="eyebrow">
        CLIENT
      </span>

      <blockquote>
        ${escapeHTML(scenario.client)}
      </blockquote>


      <form id="simulationForm">

        <div class="form-group">

          <label>
            Inona no hamalianao?
          </label>

          <textarea
            name="answer"
            rows="6"
            placeholder="Soraty eto ny valinteninao..."
            required
          ></textarea>

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          Hamarino ny valiny
        </button>

      </form>


      <div
        id="simulationResult"
        class="tool-result"
      ></div>

    </div>

  `;


  $("#simulationForm")
    .addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const answer =
          new FormData(
            event.currentTarget
          ).get("answer");

        evaluateSimulation(
          scenario,
          answer
        );

      }
    );

}


function evaluateSimulation(
  scenario,
  answer
) {

  const text =
    String(answer)
      .toLowerCase();


  let score = 0;

  const positiveWords = [

    "hoy",

    "fantatro",

    "azavao",

    "tombony",

    "valeur",

    "olana",

    "mila",

    "prix",

    "qualité",

    "kalitao",

    "commande",

    "manazava",

    "misy"

  ];


  positiveWords.forEach(
    word => {

      if (text.includes(word)) {
        score += 1;
      }

    }
  );


  if (text.length >= 80) {
    score += 1;
  }


  score =
    Math.min(
      10,
      score
    );


  const saved = {

    id: Date.now(),

    scenario:
      scenario.title,

    answer,

    score,

    createdAt:
      new Date().toISOString()

  };


  state.simulations.unshift(
    saved
  );

  saveState();


  const result =
    $("#simulationResult");


  result.innerHTML = `

    <div class="result-card">

      <div class="score-display">

        <span>
          Score
        </span>

        <strong>
          ${score}/10
        </strong>

      </div>


      <div class="result-explanation">

        <strong>
          🧠 Torohevitra:
        </strong>

        <p>
          ${escapeHTML(scenario.expected)}
        </p>

      </div>


      ${
        score >= 7
          ? `
            <div class="success-message">
              ✅ Tsara ny orientation-n'ny valinteninao.
            </div>
          `
          : `
            <div class="warning-message">
              💡 Mbola azo hatsaraina.
              Aza mamaly amin'ny “prix” fotsiny;
              fantaro aloha ny tena objection.
            </div>
          `
      }

    </div>

  `;


  showToast(
    "Simulation évaluée.",
    "success"
  );

}


/* ============================================================
   15. COMMANDE
============================================================ */

function renderOrderTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🛒",
      "Commande",
      "Raketo ny commande sy ny statut mba tsy hisy very."
    )}


    <div class="tool-explanation">

      <h3>
        Nahoana no raketina?
      </h3>

      <p>
        Rehefa betsaka ny prospects sy commandes
        dia mora very ny information.
        Ny fiche commande dia manampy anao hanaraka
        izay mbola miandry, izay efa voaloa ary izay vita.
      </p>

    </div>


    <form
      id="orderForm"
      class="tool-form"
    >

      <div class="form-group">

        <label>
          Anaran'ny client
        </label>

        <input
          name="client"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Produit
        </label>

        <input
          name="product"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Quantité
        </label>

        <input
          name="quantity"
          type="number"
          min="1"
          value="1"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Prix / unité
        </label>

        <input
          name="price"
          type="number"
          min="0"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Statut
        </label>

        <select name="status">

          <option value="En attente">
            En attente
          </option>

          <option value="Confirmée">
            Confirmée
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


      <button
        type="submit"
        class="btn btn-primary"
      >
        Enregistrer Commande
      </button>

    </form>


    <div
      id="orderResult"
      class="tool-result"
    ></div>

  `;


  $("#orderForm")
    .addEventListener(
      "submit",
      createOrder
    );

}


function createOrder(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );


  const quantity =
    Number(data.get("quantity"));

  const price =
    Number(data.get("price"));

  const order = {

    id: Date.now(),

    client:
      data.get("client"),

    product:
      data.get("product"),

    quantity,

    price,

    total:
      quantity * price,

    status:
      data.get("status"),

    createdAt:
      new Date().toISOString()

  };


  state.orders.unshift(
    order
  );

  saveState();


  $("#orderResult").innerHTML = `

    <div class="result-card">

      <div class="result-card-header">

        <span>🛒 Commande</span>

        <strong>
          ${escapeHTML(order.client)}
        </strong>

      </div>


      <div class="result-grid">

        <div>
          <small>Produit</small>
          <strong>
            ${escapeHTML(order.product)}
          </strong>
        </div>

        <div>
          <small>Quantité</small>
          <strong>
            ${order.quantity}
          </strong>
        </div>

        <div>
          <small>Total</small>
          <strong>
            ${formatAr(order.total)}
          </strong>
        </div>

        <div>
          <small>Statut</small>
          <strong>
            ${escapeHTML(order.status)}
          </strong>
        </div>

      </div>

    </div>

  `;


  updateDashboard();

  showToast(
    "Commande voatahiry.",
    "success"
  );

}


/* ============================================================
   16. REÇU DE VENTE
============================================================ */

function renderReceiptTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🧾",
      "Reçu de Vente",
      "Mamoròna reçu tsotra ho an'ny client."
    )}


    <div class="tool-explanation">

      <p>
        Ampiasao rehefa mila manome preuve simple
        momba ny vente sy ny paiement ianao.
      </p>

    </div>


    <form
      id="receiptForm"
      class="tool-form"
    >

      <div class="form-group">

        <label>
          Nom client
        </label>

        <input
          name="client"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Produit
        </label>

        <input
          name="product"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Quantité
        </label>

        <input
          name="quantity"
          type="number"
          min="1"
          value="1"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Prix / unité
        </label>

        <input
          name="price"
          type="number"
          min="0"
          required
        >

      </div>


      <div class="form-group">

        <label>
          Paiement
        </label>

        <select name="payment">

          <option>Cash</option>
          <option>MVola</option>
          <option>Orange Money</option>
          <option>Airtel Money</option>
          <option>Autre</option>

        </select>

      </div>


      <button
        class="btn btn-primary"
        type="submit"
      >
        Mamorona Reçu
      </button>

    </form>


    <div
      id="receiptResult"
      class="tool-result"
    ></div>

  `;


  $("#receiptForm")
    .addEventListener(
      "submit",
      createReceipt
    );

}


function createReceipt(event) {

  event.preventDefault();

  const data =
    new FormData(
      event.currentTarget
    );


  const quantity =
    Number(data.get("quantity"));

  const price =
    Number(data.get("price"));

  const total =
    quantity * price;


  const receiptNumber =
    `TM-${Date.now()
      .toString()
      .slice(-8)}`;


  $("#receiptResult").innerHTML = `

    <div
      class="receipt-preview"
      id="receiptPreview"
    >

      <div class="receipt-brand">
        TANTSAHA MATIHANINA
      </div>

      <h3>
        REÇU DE VENTE
      </h3>

      <p>
        N° ${receiptNumber}
      </p>

      <hr>

      <p>
        <strong>Client:</strong>
        ${escapeHTML(data.get("client"))}
      </p>

      <p>
        <strong>Produit:</strong>
        ${escapeHTML(data.get("product"))}
      </p>

      <p>
        <strong>Quantité:</strong>
        ${quantity}
      </p>

      <p>
        <strong>Prix unitaire:</strong>
        ${formatAr(price)}
      </p>

      <p>
        <strong>Total:</strong>
        ${formatAr(total)}
      </p>

      <p>
        <strong>Paiement:</strong>
        ${escapeHTML(data.get("payment"))}
      </p>

      <hr>

      <p>
        Misaotra tompoko.
      </p>

      <small>
        ${new Date().toLocaleString("fr-FR")}
      </small>

    </div>


    <button
      type="button"
      class="btn btn-secondary"
      id="printReceiptButton"
    >
      🖨️ Hanao impression
    </button>

  `;


  $("#printReceiptButton")
    .addEventListener(
      "click",
      () => {

        const content =
          $("#receiptPreview").innerHTML;

        const printWindow =
          window.open(
            "",
            "_blank",
            "width=600,height=800"
          );

        if (!printWindow) {

          showToast(
            "Tsy afaka nanokatra fenêtre impression.",
            "error"
          );

          return;

        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Reçu de Vente</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 30px;
                  max-width: 500px;
                  margin: auto;
                }
                hr {
                  border: 0;
                  border-top: 1px solid #ccc;
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);

        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {

          printWindow.print();

        }, 300);

      }
    );


  showToast(
    "Reçu voaforona.",
    "success"
  );

}


/* ============================================================
   17. GUIDE
============================================================ */

function renderGuideTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "📘",
      "Guide Vente Lab",
      "Torolalana fohy hahafantaranao izay tokony hatao."
    )}


    <div class="guide-content">

      <div class="guide-step">

        <span>01</span>

        <div>

          <h3>
            Vakio ny lesona
          </h3>

          <p>
            Atombohy amin'ny Formation WhatsApp.
          </p>

        </div>

      </div>


      <div class="guide-step">

        <span>02</span>

        <div>

          <h3>
            Safidio ny outil
          </h3>

          <p>
            Ohatra: Kajy Prix, Offre na Calendrier.
          </p>

        </div>

      </div>


      <div class="guide-step">

        <span>03</span>

        <div>

          <h3>
            Ampidiro ny données tena izy
          </h3>

          <p>
            Aza mampiasa isa kisendrasendra rehefa
            manao exercice réel.
          </p>

        </div>

      </div>


      <div class="guide-step">

        <span>04</span>

        <div>

          <h3>
            Ampiharo amin'ny tsena
          </h3>

          <p>
            Facebook, WhatsApp, Marketplace
            na vente locale.
          </p>

        </div>

      </div>


      <div class="guide-step">

        <span>05</span>

        <div>

          <h3>
            Raketo ny résultat
          </h3>

          <p>
            Prospects → Réponses → Discussions
            → Commandes → Clients.
          </p>

        </div>

      </div>


      <div class="guide-step">

        <span>06</span>

        <div>

          <h3>
            Fenoy ny Retour
          </h3>

          <p>
            Soraty izay nety, izay tsy nety
            ary izay hatsarainao.
          </p>

        </div>

      </div>

    </div>

  `;

}


/* ============================================================
   18. CHALLENGE 7 JOURS
============================================================ */

const CHALLENGE_DAYS = [

  {
    day: 1,
    title: "Fantaro ny produit",
    action:
      "Soraty ny produit sy ny valeur amidinao."
  },

  {
    day: 2,
    title: "Fantaro ny client",
    action:
      "Farito ny client cible iray."
  },

  {
    day: 3,
    title: "Amboary ny offre",
    action:
      "Mamoròna offre misy prix sy CTA."
  },

  {
    day: 4,
    title: "Mamoaha publication",
    action:
      "Mamoaha publication iray."
  },

  {
    day: 5,
    title: "Mitadiava prospects",
    action:
      "Mitadiava prospects ary raketo ny réponses."
  },

  {
    day: 6,
    title: "Manao closing",
    action:
      "Manaova pratique amin'ny objection."
  },

  {
    day: 7,
    title: "Mandrefy",
    action:
      "Fenoy ny Retour & Évaluation."
  }

];


function renderChallengeTool(workspace) {

  workspace.innerHTML = `

    ${toolHeader(
      "🏆",
      "Challenge 7 Jours",
      "Action iray azo refesina isan'andro."
    )}


    <div class="tool-explanation">

      <p>
        Ny challenge dia natao hanampy anao
        tsy hijanona amin'ny théorie.
      </p>

      <p>
        Isan'andro dia manaova action iray,
        avy eo jereo ny résultat.
      </p>

    </div>


    <div class="challenge-list">

      ${CHALLENGE_DAYS
        .map(
          item => {

            const done =
              state.challenge[item.day] === true;

            return `

              <label class="challenge-item">

                <input
                  type="checkbox"
                  data-challenge-day="${item.day}"
                  ${done ? "checked" : ""}
                >

                <span class="challenge-check">
                  ${done ? "✓" : ""}
                </span>

                <span>

                  <strong>
                    Jour ${item.day} —
                    ${escapeHTML(item.title)}
                  </strong>

                  <small>
                    ${escapeHTML(item.action)}
                  </small>

                </span>

              </label>

            `;

          }
        )
        .join("")}

    </div>


    <div
      id="challengeProgress"
      class="challenge-progress"
    ></div>

  `;


  $all("[data-challenge-day]")
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          const day =
            input.dataset.challengeDay;

          state.challenge[day] =
            input.checked;

          saveState();

          updateChallengeProgress();

        }
      );

    });


  updateChallengeProgress();

}


function updateChallengeProgress() {

  const box =
    $("#challengeProgress");

  if (!box) {
    return;
  }

  const completed =
    CHALLENGE_DAYS.filter(
      item =>
        state.challenge[item.day] === true
    ).length;


  const percentage =
    Math.round(
      completed /
      CHALLENGE_DAYS.length *
      100
    );


  box.innerHTML = `

    <strong>
      ${completed}/7 jours vita
    </strong>

    <div class="progress-track">

      <i
        style="width:${percentage}%"
      ></i>

    </div>

    <small>
      ${percentage}% progression
    </small>

  `;

}


/* ============================================================
   19. DASHBOARD
============================================================ */

function updateDashboard() {

  const calculations =
    state.calculations;

  const livestock =
    state.livestockCalculations;

  const orders =
    state.orders;


  const statCalculations =
    $("#statCalculations");

  const statOrders =
    $("#statOrders");

  const statRevenue =
    $("#statRevenue");

  const statProfit =
    $("#statProfit");


  if (statCalculations) {

    statCalculations.textContent =
      calculations.length +
      livestock.length;

  }


  if (statOrders) {

    statOrders.textContent =
      orders.length;

  }


  const revenue =
    orders.reduce(
      (sum, order) =>
        sum + (
          Number(order.total) || 0
        ),
      0
    );


  const profit =
    calculations.reduce(
      (sum, item) =>
        sum + (
          Number(item.profit) || 0
        ),
      0
    )
    +
    livestock.reduce(
      (sum, item) =>
        sum + (
          Number(item.profit) || 0
        ),
      0
    );


  if (statRevenue) {

    statRevenue.textContent =
      formatAr(revenue);

  }


  if (statProfit) {

    statProfit.textContent =
      formatAr(profit);

  }


  renderRecentCalculations();

  renderRecentOrders();

  updateFunnel();

}


function renderRecentCalculations() {

  const container =
    $("#recentCalculations");

  if (!container) {
    return;
  }


  const all = [

    ...state.calculations.map(
      item => ({
        ...item,
        type: "Prix"
      })
    ),

    ...state.livestockCalculations.map(
      item => ({
        ...item,
        type: "Fiompiana"
      })
    )

  ]
  .sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  )
  .slice(0, 5);


  if (!all.length) {

    container.innerHTML = `
      <p class="empty-state">
        Tsy mbola misy calcul.
      </p>
    `;

    return;

  }


  container.innerHTML =
    all
      .map(
        item => `

          <div class="dashboard-item">

            <div>

              <strong>
                ${escapeHTML(
                  item.product ||
                  item.animal ||
                  "Calcul"
                )}
              </strong>

              <small>
                ${escapeHTML(item.type)}
              </small>

            </div>

            <strong>
              ${formatAr(item.profit)}
            </strong>

          </div>

        `
      )
      .join("");

}


function renderRecentOrders() {

  const container =
    $("#recentOrders");

  if (!container) {
    return;
  }


  const orders =
    state.orders
      .slice(0, 5);


  if (!orders.length) {

    container.innerHTML = `
      <p class="empty-state">
        Tsy mbola misy commande.
      </p>
    `;

    return;

  }


  container.innerHTML =
    orders
      .map(
        order => `

          <div class="dashboard-item">

            <div>

              <strong>
                ${escapeHTML(order.client)}
              </strong>

              <small>
                ${escapeHTML(order.product)}
              </small>

            </div>

            <strong>
              ${formatAr(order.total)}
            </strong>

          </div>

        `
      )
      .join("");

}


/* ============================================================
   20. FUNNEL
============================================================ */

function updateFunnel() {

  const evaluations =
    state.evaluations;


  const prospects =
    evaluations.reduce(
      (sum, item) =>
        sum + (
          Number(item.prospects) || 0
        ),
      0
    );


  const responses =
    evaluations.reduce(
      (sum, item) =>
        sum + (
          Number(item.responses) || 0
        ),
      0
    );


  const discussions =
    evaluations.reduce(
      (sum, item) =>
        sum + (
          Number(item.discussions) || 0
        ),
      0
    );


  const ordersFromEvaluation =
    evaluations.reduce(
      (sum, item) =>
        sum + (
          Number(item.orders) || 0
        ),
      0
    );


  const ordersFromTool =
    state.orders.length;


  const orders =
    Math.max(
      ordersFromEvaluation,
      ordersFromTool
    );


  const clients =
    state.orders.filter(
      order =>
        [
          "Payée",
          "Livrée"
        ].includes(
          order.status
        )
    ).length;


  setText(
    "#funnelProspects",
    prospects
  );

  setText(
    "#funnelResponses",
    responses
  );

  setText(
    "#funnelDiscussions",
    discussions
  );

  setText(
    "#funnelOrders",
    orders
  );

  setText(
    "#funnelClients",
    clients
  );


  const max =
    Math.max(
      prospects,
      responses,
      discussions,
      orders,
      clients,
      1
    );


  setWidth(
    "#funnelBarProspects",
    prospects,
    max
  );

  setWidth(
    "#funnelBarResponses",
    responses,
    max
  );

  setWidth(
    "#funnelBarDiscussions",
    discussions,
    max
  );

  setWidth(
    "#funnelBarOrders",
    orders,
    max
  );

  setWidth(
    "#funnelBarClients",
    clients,
    max
  );

}


function setText(
  selector,
  value
) {

  const element =
    $(selector);

  if (element) {

    element.textContent =
      formatNumber(value);

  }

}


function setWidth(
  selector,
  value,
  max
) {

  const element =
    $(selector);

  if (!element) {
    return;
  }

  const percentage =
    max > 0
      ? (value / max) * 100
      : 0;

  element.style.width =
    `${Math.max(percentage, 2)}%`;

}


/* ============================================================
   21. EVALUATION
============================================================ */

function initEvaluationForm() {

  const form =
    $("#evaluationForm");

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
          data.get("channel"),

        publication:
          data.get("publication"),

        views:
          Number(data.get("views")) || 0,

        messages:
          Number(data.get("messages")) || 0,

        prospects:
          Number(data.get("prospects")) || 0,

        responses:
          Number(data.get("responses")) || 0,

        discussions:
          Number(data.get("discussions")) || 0,

        orders:
          Number(data.get("orders")) || 0,

        revenue:
          Number(data.get("revenue")) || 0,

        profit:
          Number(data.get("profit")) || 0,

        objection:
          data.get("objection"),

        lesson:
          data.get("lesson"),

        createdAt:
          new Date().toISOString()

      };


      state.evaluations.unshift(
        evaluation
      );

      saveState();

      updateDashboard();

      form.reset();

      showToast(
        "Retour voatahiry. Jereo ny Dashboard.",
        "success"
      );

    }
  );

}


/* ============================================================
   22. REVIEWS SUPABASE
============================================================ */

async function loadReviews() {

  const container =
    $("#reviewsList");

  if (!container) {
    return;
  }


  if (!supabaseClient) {

    container.innerHTML = `
      <p class="empty-state">
        Avis mbola tsy azo alaina izao.
      </p>
    `;

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
        .eq(
          "status",
          "approved"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(12);


    if (error) {
      throw error;
    }


    if (!data || !data.length) {

      container.innerHTML = `
        <p class="empty-state">
          Mbola tsy misy avis approuvé.
        </p>
      `;

      return;

    }


    container.innerHTML =
      data
        .map(
          review => `

            <article class="review-card">

              <div class="review-header">

                <strong>
                  ${escapeHTML(review.name)}
                </strong>

                <span>
                  ${"⭐".repeat(
                    Number(review.rating) || 0
                  )}
                </span>

              </div>


              ${
                review.learning
                  ? `
                    <p>
                      <strong>Nianarana:</strong>
                      ${escapeHTML(review.learning)}
                    </p>
                  `
                  : ""
              }


              ${
                review.applied
                  ? `
                    <p>
                      <strong>Nampiharina:</strong>
                      ${escapeHTML(review.applied)}
                    </p>
                  `
                  : ""
              }


              ${
                review.result
                  ? `
                    <p>
                      <strong>Résultat:</strong>
                      ${escapeHTML(review.result)}
                    </p>
                  `
                  : ""
              }


              <blockquote>
                ${escapeHTML(review.message)}
              </blockquote>

            </article>

          `
        )
        .join("");


  } catch (error) {

    console.warn(
      "Impossible de charger les avis:",
      error
    );

    container.innerHTML = `
      <p class="empty-state">
        Tsy afaka naka avis izao.
      </p>
    `;

  }

}


/* ============================================================
   23. REVIEW FORM
============================================================ */

function initReviewForm() {

  const form =
    $("#reviewForm");

  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!supabaseClient) {

        showToast(
          "Supabase tsy mbola disponible.",
          "error"
        );

        return;

      }


      const data =
        new FormData(form);


      const review = {

        name:
          String(
            data.get("name") || ""
          ).trim(),

        rating:
          Number(
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


      if (
        !review.name ||
        !review.rating ||
        !review.message ||
        !review.consent
      ) {

        showToast(
          "Fenoy tsara ny champs ilaina.",
          "error"
        );

        return;

      }


      try {

        const {
          error
        } =
          await supabaseClient
            .from("vente_reviews")
            .insert(
              review
            );


        if (error) {
          throw error;
        }


        form.reset();

        closeModal(
          "reviewModal"
        );


        showToast(
          "Avis nalefa. Miandry validation.",
          "success"
        );


      } catch (error) {

        console.error(
          error
        );

        showToast(
          "Tsy voaray ilay avis. Avereno azafady.",
          "error"
        );

      }

    }
  );

}


/* ============================================================
   24. MODALS
============================================================ */

function initModals() {

  $all("[data-modal-open]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.modalOpen;

          openModal(id);

        }
      );

    });


  $all("[data-modal-close]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const modal =
            button.closest(".modal");

          if (!modal) {
            return;
          }

          closeModal(
            modal.id
          );

        }
      );

    });


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      $all(".modal")
        .forEach(
          modal => {

            if (
              modal.getAttribute(
                "aria-hidden"
              ) === "false"
            ) {

              closeModal(
                modal.id
              );

            }

          }
        );

    }
  );

}


function openModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) {
    return;
  }


  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

}


function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (!modal) {
    return;
  }


  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

}


/* ============================================================
   25. EXTERNAL LINKS
============================================================ */

function initExternalLinks() {

  const links = {

    "whatsapp-group":
      TM_CONFIG.whatsappGroup,

    "whatsapp-purchase":
      TM_CONFIG.whatsappPurchase,

    "facebook":
      TM_CONFIG.facebook

  };


  $all("[data-link]")
    .forEach(element => {

      const key =
        element.dataset.link;

      if (!links[key]) {
        return;
      }

      element.href =
        links[key];

    });

}


/* ============================================================
   26. COPY
============================================================ */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "Voadika ao amin'ny presse-papier.",
      "success"
    );

  } catch (error) {

    const textarea =
      document.createElement("textarea");

    textarea.value =
      text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    try {

      document.execCommand(
        "copy"
      );

      showToast(
        "Voadika.",
        "success"
      );

    } catch {

      showToast(
        "Tsy afaka nandika automatique. Adikao manually.",
        "error"
      );

    }

    textarea.remove();

  }

}


/* ============================================================
   27. RESET LOCAL DATA
============================================================ */

function resetLocalData() {

  const confirmed =
    window.confirm(
      "Hofafana daholo ve ny données locales ao amin'ny Vente Lab?"
    );

  if (!confirmed) {
    return;
  }


  state =
    defaultState();

  saveState();

  updateDashboard();

  showToast(
    "Données locales voafafa.",
    "success"
  );

}


/* ============================================================
   28. GLOBAL KEYBOARD SHORTCUT
============================================================ */

function initKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        scrollToSection(
          "lab"
        );

      }

    }
  );

}


/* ============================================================
   29. INITIALIZATION
============================================================ */

async function initApp() {

  initSupabase();

  initNavigation();

  initSmoothLinks();

  initTools();

  initEvaluationForm();

  initReviewForm();

  initModals();

  initExternalLinks();

  initKeyboardShortcuts();

  updateDashboard();

  await loadReviews();

}


/* ============================================================
   30. START
============================================================ */

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
