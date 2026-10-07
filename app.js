/* =========================================================
   TANTSAHA MATIHANINA • VENTE LAB
   APP.JS — PARTIE 1/3
   ========================================================= */

(function () {
  "use strict";


  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const CONFIG = {

    whatsappGroup:
      "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",

    whatsappPurchase:
      "https://wa.me/261385651378",

    facebook:
      "https://www.facebook.com/share/1Zfiu8oj3m/",

    supabaseUrl:
      "https://sdzybetralbaincrxddf4.supabase.co",

    supabaseKey:
      "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"

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

    lastActivity: null

  };


  let state = loadState();

  let sb = null;


  /* =========================================================
     BASIC UTILITIES
     ========================================================= */

  const $ = (id) =>
    document.getElementById(id);


  function clone(obj) {

    return JSON.parse(
      JSON.stringify(obj)
    );

  }


  function num(value) {

    const n =
      Number(
        String(value ?? "")
          .replace(/\s/g, "")
          .replace(",", ".")
      );

    return Number.isFinite(n)
      ? n
      : 0;

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

    return new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Math.round(num(value))
    ) + " Ar";

  }


  function fmtDate(value) {

    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return value;
    }

    return d.toLocaleDateString(
      "fr-FR"
    );

  }


  function todayISO() {

    const d = new Date();

    const p = (n) =>
      String(n).padStart(2, "0");

    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate())
    );

  }


  function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return d;
}


  /* =========================================================
     LOCAL STORAGE
     ========================================================= */

  function loadState() {

    try {

      const raw =
        localStorage.getItem(KEY);

      if (!raw) {
        return clone(defaults);
      }

      const saved =
        JSON.parse(raw);

      return {
        ...clone(defaults),
        ...saved
      };

    } catch (error) {

      console.error(
        "Erreur chargement state:",
        error
      );

      return clone(defaults);

    }

  }


  function saveState() {

    try {

      localStorage.setItem(
        KEY,
        JSON.stringify(state)
      );

    } catch (error) {

      console.error(
        "Erreur sauvegarde state:",
        error
      );

    }

  }


  function touch() {

    state.lastActivity =
      new Date().toISOString();

    saveState();

  }


  /* =========================================================
     TOAST
     ========================================================= */

  function toast(
    message,
    type = "success"
  ) {

    const el =
      $("toast");

    if (!el) return;

    el.textContent =
      message;

    el.className =
      "toast " + type;

    el.classList.add(
      "is-visible"
    );

    clearTimeout(
      el._toastTimer
    );

    el._toastTimer =
      setTimeout(
        function () {

          el.classList.remove(
            "is-visible"
          );

        },
        3000
      );

  }


  /* =========================================================
     COPY TEXT
     ========================================================= */

  async function copyText(text) {

    if (!text) return false;

    try {

      await navigator.clipboard.writeText(
        text
      );

      toast(
        "Voakopia.",
        "success"
      );

      return true;

    } catch (error) {

      try {

        const area =
          document.createElement(
            "textarea"
          );

        area.value = text;

        area.style.position =
          "fixed";

        area.style.opacity =
          "0";

        document.body.appendChild(
          area
        );

        area.select();

        document.execCommand(
          "copy"
        );

        area.remove();

        toast(
          "Voakopia.",
          "success"
        );

        return true;

      } catch (err) {

        toast(
          "Tsy afaka manao copie.",
          "error"
        );

        return false;

      }

    }

  }


  /* =========================================================
     REMOTE / SUPABASE HELPER
     ========================================================= */

  async function remote(
    path,
    options = {}
  ) {

    if (!CONFIG.supabaseUrl ||
        !CONFIG.supabaseKey) {

      return null;

    }

    try {

      const response =
        await fetch(
          CONFIG.supabaseUrl +
          "/rest/v1/" +
          path,
          {

            ...options,

            headers: {

              "apikey":
                CONFIG.supabaseKey,

              "Authorization":
                "Bearer " +
                CONFIG.supabaseKey,

              "Content-Type":
                "application/json",

              ...(options.headers || {})

            }

          }
        );

      if (!response.ok) {

        console.warn(
          "Remote error:",
          response.status
        );

        return null;

      }

      const text =
        await response.text();

      return text
        ? JSON.parse(text)
        : null;

    } catch (error) {

      console.warn(
        "Remote request failed:",
        error
      );

      return null;

    }

  }


  /* =========================================================
     TOOLS DISPATCHER
     ========================================================= */

  function initTools() {

    document.addEventListener(
      "click",
      function (e) {

        const button =
          e.target.closest(
            "[data-tool]"
          );

        if (!button) return;

        openTool(
          button.dataset.tool
        );

      }
    );

  }


  function openTool(tool) {

    const ws =
      tool === "calendar"

        ? $("calendarWorkspace")

        : $("toolWorkspace");


    if (!ws) return;


    const tools = {

      price:
        renderPriceTool,

      livestock:
        renderLivestockTool,

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
        renderChallengeTool,

      calendar:
        renderCalendarTool

    };


    if (!tools[tool]) {

      ws.innerHTML = `

        <div class="workspace-empty">

          <h3>
            Outil mbola tsy voaomana
          </h3>

          <p>
            Hampidirina amin'ny
            version manaraka.
          </p>

        </div>

      `;

      return;

    }


    tools[tool](ws);

    ws.dataset.activeTool =
      tool;

  }

/* =========================================================
   FARAN'NY PARTIE 1/3
   ========================================================= */


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


  function head(
    eyebrow,
    title,
    description
  ) {

    return `
      <div class="workspace-header">

        <span class="eyebrow">
          ${esc(eyebrow)}
        </span>

        <h2>
          ${esc(title)}
        </h2>

        <p>
          ${esc(description)}
        </p>

      </div>
    `;

  }


  function field(
    label,
    name,
    type = "text",
    attrs = ""
  ) {

    return `
      <label>

        ${esc(label)}

        <input
          type="${esc(type)}"
          name="${esc(name)}"
          ${attrs}
        >

      </label>
    `;

  }


  function area(
    label,
    name,
    attrs = ""
  ) {

    return `
      <label>

        ${esc(label)}

        <textarea
          name="${esc(name)}"
          rows="4"
          ${attrs}
        ></textarea>

      </label>
    `;

  }


  function select(
    label,
    name,
    options
  ) {

    return `
      <label>

        ${esc(label)}

        <select name="${esc(name)}">

          ${options.map(
            (option) => `
              <option value="${esc(option)}">
                ${esc(option)}
              </option>
            `
          ).join("")}

        </select>

      </label>
    `;

  }


  function getData(form) {

    const fd =
      new FormData(form);

    return Object.fromEntries(fd.entries());

  }
   
function renderPriceTool(c) {
  c.innerHTML =
    head(
      "LAB 01",
      "💰 Kajy Prix & Tombony",
      "Fantaro ny coût, prix de vente, tombony ary marge alohan'ny hivarotana."
    ) +

    `<form id="priceForm" class="tool-form">

      ${field(
        "Vokatra",
        "product",
        "text",
        'placeholder="Ohatra: Akoho Gasy" required'
      )}

      ${field(
        "Isan'ny vokatra",
        "quantity",
        "number",
        'min="1" value="1" required'
      )}

      <div class="section-title">💸 Coûts</div>

      ${field(
        "Achat / Matières",
        "purchaseCost",
        "number",
        'min="0" value="0"'
      )}

      ${field(
        "Sakafo",
        "feedCost",
        "number",
        'min="0" value="0"'
      )}

      ${field(
        "Fanafody / Vaksiny",
        "healthCost",
        "number",
        'min="0" value="0"'
      )}

      ${field(
        "Transport",
        "transportCost",
        "number",
        'min="0" value="0"'
      )}

      ${field(
        "Autres dépenses",
        "otherCost",
        "number",
        'min="0" value="0"'
      )}

      <div class="section-title">🎯 Vidy sy tanjona</div>

      ${field(
        "Prix de vente / unité",
        "salePrice",
        "number",
        'min="0" value="0"'
      )}

      ${field(
        "Tombony kendrena",
        "targetProfit",
        "number",
        'min="0" value="0"'
      )}

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
    const d = getData(form);

    const q = Math.max(1, num(d.quantity));

    const purchaseCost = Math.max(0, num(d.purchaseCost));
    const feedCost = Math.max(0, num(d.feedCost));
    const healthCost = Math.max(0, num(d.healthCost));
    const transportCost = Math.max(0, num(d.transportCost));
    const otherCost = Math.max(0, num(d.otherCost));
    const targetProfit = Math.max(0, num(d.targetProfit));

    const totalCost =
      purchaseCost +
      feedCost +
      healthCost +
      transportCost +
      otherCost;

    const costPerUnit = totalCost / q;

    const minPrice = costPerUnit;

    const recommendedPrice =
      (totalCost + targetProfit) / q;

    preview.innerHTML = `
      <div class="preview-title">📊 Tombana</div>

      <div class="result-grid">

        <div>
          <span>Coût total</span>
          <strong>${money(totalCost)}</strong>
        </div>

        <div>
          <span>Coût / unité</span>
          <strong>${money(costPerUnit)}</strong>
        </div>

        <div>
          <span>Prix minimum rentable</span>
          <strong>${money(minPrice)}</strong>
        </div>

        <div>
          <span>Prix conseillé</span>
          <strong>${money(recommendedPrice)}</strong>
        </div>

      </div>
    `;
  }

  form.addEventListener("input", calculatePreview);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const d = getData(form);

    const product = String(d.product || "").trim();

    const q = Math.max(1, num(d.quantity));

    const purchaseCost = Math.max(
      0,
      num(d.purchaseCost)
    );

    const feedCost = Math.max(
      0,
      num(d.feedCost)
    );

    const healthCost = Math.max(
      0,
      num(d.healthCost)
    );

    const transportCost = Math.max(
      0,
      num(d.transportCost)
    );

    const otherCost = Math.max(
      0,
      num(d.otherCost)
    );

    const salePrice = Math.max(
      0,
      num(d.salePrice)
    );

    const targetProfit = Math.max(
      0,
      num(d.targetProfit)
    );

    const totalCost =
      purchaseCost +
      feedCost +
      healthCost +
      transportCost +
      otherCost;

    const costPerUnit =
      totalCost / q;

    const minPrice =
      costPerUnit;

    const recommendedPrice =
      (totalCost + targetProfit) / q;

    const revenue =
      q * salePrice;

    const profit =
      revenue - totalCost;

    const margin =
      revenue > 0
        ? (profit / revenue) * 100
        : 0;

    const targetReached =
      profit >= targetProfit;

    const ok =
      profit > 0;

    let advice = "";

    if (salePrice < minPrice) {
      advice = `
        <div class="advice warning">
          ⚠️ Attention : votre prix de vente est inférieur
          au coût de revient. Vous risquez une perte.
        </div>
      `;
    } else if (!targetReached) {
      advice = `
        <div class="advice warning">
          ⚠️ Vous êtes rentable, mais le bénéfice cible
          n'est pas encore atteint.
        </div>
      `;
    } else {
      advice = `
        <div class="advice success">
          ✅ Très bien ! Le bénéfice cible est atteint.
        </div>
      `;
    }

    state.calculations.push({
      date: new Date().toISOString(),
      product,
      quantity: q,

      cost: totalCost,

      purchaseCost,
      feedCost,
      healthCost,
      transportCost,
      otherCost,

      costPerUnit,
      minPrice,
      recommendedPrice,

      salePrice,
      targetProfit,

      revenue,
      profit,
      margin
    });

    touch();
    updateDashboard();

    result.innerHTML = `
      <div class="result-card ${
        ok
          ? "result-positive"
          : "result-negative"
      }">

        <div class="result-title">
          ${
            ok
              ? "✅ Vokatra azo amidy"
              : "⚠️ Misy fatiantoka"
          }
        </div>

        <div class="result-grid">

          <div>
            <span>Vokatra</span>
            <strong>${esc(product)}</strong>
          </div>

          <div>
            <span>Quantité</span>
            <strong>${q}</strong>
          </div>

          <div>
            <span>Coût total</span>
            <strong>${money(totalCost)}</strong>
          </div>

          <div>
            <span>Coût / unité</span>
            <strong>${money(costPerUnit)}</strong>
          </div>

          <div>
            <span>Prix minimum rentable</span>
            <strong>${money(minPrice)}</strong>
          </div>

          <div>
            <span>Prix conseillé</span>
            <strong>${money(recommendedPrice)}</strong>
          </div>

          <div>
            <span>Prix de vente</span>
            <strong>${money(salePrice)}</strong>
          </div>

          <div>
            <span>Vola miditra / CA</span>
            <strong>${money(revenue)}</strong>
          </div>

          <div>
            <span>Tombony</span>
            <strong>${money(profit)}</strong>
          </div>

          <div>
            <span>Tombony kendrena</span>
            <strong>${money(targetProfit)}</strong>
          </div>

          <div>
            <span>Marge</span>
            <strong>${margin.toFixed(2)}%</strong>
          </div>

        </div>

        ${advice}

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

  function renderLivestockTool(c) {

    c.innerHTML =
      head(
        "LAB 02",
        "Kajy Fiompiana",
        "Ampidiro ny karazana biby, isan'ny biby ary ny dépenses hahitana ny coût sy ny potentiel de vente."
      ) +

      `
      <form
        id="livestockForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${select(
            "Karazana",
            "animal",
            ANIMALS
          )}

          ${field(
            "Isan'ny biby",
            "quantity",
            "number",
            'min="1" value="10" required'
          )}

          ${field(
            "Coût sakafo",
            "feed",
            "number",
            'min="0" value="0"'
          )}

          ${field(
            "Fanafody / vaksiny",
            "health",
            "number",
            'min="0" value="0"'
          )}

          ${field(
            "Achat biby",
            "purchase",
            "number",
            'min="0" value="0"'
          )}

          ${field(
            "Dépenses hafa",
            "other",
            "number",
            'min="0" value="0"'
          )}

          ${field(
            "Prix de vente / biby",
            "salePrice",
            "number",
            'min="0" value="0"'
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          🐓 Kajio ny fiompiana
        </button>

      </form>


      <div
        id="livestockResult"
        class="lab-result"
      ></div>
      `;


    $("livestockForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);

        const q =
          num(d.quantity);

        const cost =
          num(d.feed) +
          num(d.health) +
          num(d.purchase) +
          num(d.other);

        const revenue =
          q * num(d.salePrice);

        const profit =
          revenue - cost;

        const per =
          q > 0
            ? cost / q
            : 0;


        state.calculations.push({

          date:
            new Date().toISOString(),

          animal:
            d.animal,

          product:
            d.animal,

          quantity:
            q,

          cost:
            cost,

          revenue:
            revenue,

          profit:
            profit,

          costPerAnimal:
            per

        });


        touch();


        $("livestockResult").innerHTML = `

          <div class="result-card">

            <div class="result-title">

              ${esc(d.animal)}
              — Résultat

            </div>


            <div class="result-grid">

              <div>
                <span>Isan'ny biby</span>
                <strong>${q}</strong>
              </div>


              <div>
                <span>Coût total</span>
                <strong>
                  ${money(cost)}
                </strong>
              </div>


              <div>
                <span>Coût / biby</span>
                <strong>
                  ${money(per)}
                </strong>
              </div>


              <div>
                <span>Vola miditra</span>
                <strong>
                  ${money(revenue)}
                </strong>
              </div>


              <div>
                <span>Tombony</span>
                <strong>
                  ${money(profit)}
                </strong>
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

        toast(
          "Kajy fiompiana vita."
        );

      }
    );

  }


  /* =========================================================
     3. CALENDRIER
     ========================================================= */

  const profiles = {

    "Akoho Gasy":
      [150, 120, 210],

    "Pondeuse":
      [140, 120, 180],

    "Poulet de chair":
      [45, 35, 60],

    "Kisoa":
      [180, 150, 240],

    "Bitro":
      [90, 70, 120],

    "Gana":
      [100, 80, 130],

    "Gisa":
      [150, 120, 200],

    "Vorontsiloza":
      [150, 120, 200],

    "Osy":
      [240, 180, 300],

    "Ondry":
      [240, 180, 300]

  };


  function renderCalendarTool(c) {

    c.innerHTML =
      head(
        "LAB 10 • OUTIL STRATÉGIQUE",
        "📅 Calendrier Mpiompy & Vente",
        "Tsy ny daty hivarotana ihany no kajiana: fiompiana → préparation → prospection → publication → commande → vente → suivi."
      ) +

      `

      <div class="info-box">

        <strong>
          Ahoana no fampiasana azy?
        </strong>

        <ol>

          <li>
            Safidio ny karazana biby.
          </li>

          <li>
            Ampidiro ny daty nanombohana.
          </li>

          <li>
            Raha fantatra, ampidiro
            ny andro ananany.
          </li>

          <li>
            Tsindrio
            <strong>
              Hamorona Calendrier
            </strong>.
          </li>

        </ol>


        <p>
          ⚠️ Tombana ihany ny daty.
          Ny lanja, fahasalamana, sakafo
          ary vidin'ny tsena no manamafy
          ny tena fotoana hivarotana.
        </p>

      </div>


      <form
        id="calendarForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${select(
            "Karazana biby",
            "animal",
            Object.keys(profiles)
          )}

          ${field(
            "Isan'ny biby",
            "quantity",
            "number",
            'min="1" value="10" required'
          )}

          ${field(
            "Daty nanombohana",
            "startDate",
            "date",
            `value="${todayISO()}" required`
          )}

          ${field(
            "Andro ananan'ny biby (raha fantatra)",
            "ageDays",
            "number",
            'min="0" value="0"'
          )}

          ${field(
            "Lanja ankehitriny kg (raha fantatra)",
            "weight",
            "number",
            'min="0" step="0.1" value="0"'
          )}

          ${field(
            "Prix de vente / biby",
            "salePrice",
            "number",
            'min="0" value="0"'
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          📅 Hamorona Calendrier
        </button>

      </form>


      <div
        id="calendarResult"
        class="lab-result"
      ></div>

      `;


    $("calendarForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);

        const [
          def,
          min,
          max
        ] =
          profiles[d.animal];

        const age =
          num(d.ageDays);

        const q =
          num(d.quantity);

        const left =
          Math.max(
            def - age,
            0
          );

        const sale =
          addDays(
            d.startDate,
            left
          );

        const rangeA =
          addDays(
            d.startDate,
            Math.max(
              min - age,
              0
            )
          );

        const rangeB =
          addDays(
            d.startDate,
            Math.max(
              max - age,
              0
            )
          );


        const at =
          (n) =>
            new Date(
              sale.getTime() -
              n * 86400000
            );


        const events = [

          [
            "🐣",
            "Fiandohana fiompiana",
            new Date(
              d.startDate +
              "T00:00:00"
            ),
            "Manomboka ny fiompiana sy ny fanaraha-maso."
          ],

          [
            "🧰",
            "Préparation de vente",
            at(30),
            "Jereo ny lanja, fahasalamana, fitaovana ary lanja kendrena."
          ],

          [
            "🔎",
            "Prospection",
            at(21),
            "Mitady client: namana, tsena, vondrom-piarahamonina."
          ],

          [
            "📢",
            "Publication",
            at(14),
            "Alefaso ny publication sy ny sary/vidéo ny biby."
          ],

          [
            "🛒",
            "Commande",
            at(7),
            "Raiso ny commande sy ny acompte."
          ],

          [
            "💰",
            "Vente",
            sale,
            "Andro tombanana hivarotana (hamafisina araka ny lanja sy ny tsena)."
          ],

          [
            "🤝",
            "Suivi client",
            new Date(
              sale.getTime() +
              7 * 86400000
            ),
            "Angataho ny retour ary tehirizo ny client."
          ]

        ];


        const revenue =
          q *
          num(d.salePrice);


        state.calendarPlans.push({

          date:
            new Date().toISOString(),

          animal:
            d.animal,

          quantity:
            q,

          sale:
            sale.toISOString()

        });


        touch();


        $("calendarResult").innerHTML = `

          <div class="result-card">

            <div
              class="result-card-header"
            >

              <span>
                ${esc(d.animal)}
                × ${q}
              </span>

              <strong>
                Vente:
                ${fmtDate(sale)}
              </strong>

            </div>


            <div
              class="calendar-result-warning"
            >

              ⚠️

              <span>
                Fetra tombana:
                ${fmtDate(rangeA)}
                →
                ${fmtDate(rangeB)}.
                Tombana ihany ny daty.
              </span>

            </div>


            <div
              class="calendar-timeline"
            >

              ${events.map(
                (ev) => `

                <div
                  class="
                    calendar-event
                    ${
                      ev[1] === "Vente"
                        ? "calendar-event-main"
                        : ""
                    }
                  "
                >

                  <div
                    class="calendar-event-icon"
                  >
                    ${ev[0]}
                  </div>


                  <div>

                    <strong>
                      ${ev[1]}
                    </strong>

                    <small>
                      ${fmtDate(ev[2])}
                    </small>

                    <p>
                      ${ev[3]}
                    </p>

                  </div>

                </div>

              `).join("")}

            </div>


            <div
              class="calendar-action-plan"
            >

              <h3>
                Plan d'action
              </h3>

              <ul>

                <li>
                  Andro sisa alohan'ny
                  vente:
                  <strong>
                    ${left}
                  </strong>
                </li>


                ${
                  revenue > 0

                    ? `
                      <li>
                        CA mety azo:
                        <strong>
                          ${money(revenue)}
                        </strong>
                      </li>
                    `

                    : ""
                }


                <li>
                  Manomboka mitady client
                  farafahakeliny
                  3 herinandro mialoha.
                </li>

              </ul>

            </div>


            <div class="calendar-note">

              <strong>
                Fampitandremana
              </strong>

              <p>
                Raha tsy mahatratra
                ny lanja kendrena
                ny biby dia ampiato
                ny daty hivarotana.
              </p>

            </div>

          </div>

        `;


        toast(
          "Calendrier vita."
        );

      }
    );

  }


  /* =========================================================
     4. CRÉER UNE OFFRE
     ========================================================= */

  function renderOfferTool(c) {

    c.innerHTML =
      head(
        "LAB 03",
        "🎁 Créer une Offre",
        "Client → Problème → Solution → Prix → CTA."
      ) +

      `
      <form
        id="offerForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${field(
            "Vokatra / service",
            "product",
            "text",
            "required"
          )}

          ${field(
            "Client kendrena",
            "client",
            "text",
            'placeholder="Ohatra: mpandrafitra fety" required'
          )}

          ${area(
            "Olana amin'ny client",
            "problem"
          )}

          ${area(
            "Vahaolana atolotra",
            "solution"
          )}

          ${field(
            "Prix (Ar)",
            "price",
            "number",
            'min="0"'
          )}

          ${field(
            "Bonus / garantie",
            "bonus",
            "text"
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          🎁 Hamorona Offre
        </button>

      </form>


      <div
        id="offerResult"
        class="lab-result"
      ></div>
      `;


    $("offerForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);


        const text =
`🎁 OFFRE: ${d.product}

👤 Ho an'ny: ${d.client}
❗ Olana: ${d.problem || "—"}
✅ Vahaolana: ${d.solution || "—"}
💰 Prix: ${money(d.price)}${
  d.bonus
    ? `\n🎯 Bonus: ${d.bonus}`
    : ""
}

📲 Alefaso ny hafatra hanaovana commande.`;


        $("offerResult").innerHTML = `

          <div
            class="generated-copy"
            id="offerText"
          >
            ${esc(text)
              .replace(/\n/g, "<br>")}
          </div>


          <div class="result-actions">

            <button
              class="btn btn-secondary"
              type="button"
              data-copy="offerText"
            >
              📋 Adikao
            </button>

          </div>

        `;


        state.lastOffer =
          d;

        touch();

        toast(
          "Offre vita."
        );

      }
    );

  }


  /* =========================================================
     5. PUBLICATION
     ========================================================= */

  function renderPublicationTool(c) {

    const o =
      state.lastOffer || {};


    c.innerHTML =
      head(
        "LAB 04",
        "📢 Publication",
        "Hook → Problème → Solution → Offre → Prix → CTA."
      ) +

      `
      <form
        id="pubForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${field(
            "Vokatra",
            "product",
            "text",
            `value="${esc(
              o.product || ""
            )}" required`
          )}

          ${field(
            "Hook (fanombohana)",
            "hook",
            "text",
            'placeholder="Ohatra: Mila akoho tsara ve ianao?"'
          )}

          ${area(
            "Olana",
            "problem",
            ""
          )}

          ${area(
            "Vahaolana / offre",
            "solution",
            ""
          )}

          ${field(
            "Prix (Ar)",
            "price",
            "number",
            `min="0" value="${esc(
              o.price || ""
            )}"`
          )}

          ${field(
            "Contact / lieu",
            "contact",
            "text",
            'placeholder="WhatsApp, Toamasina..."'
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          📢 Hamorona Publication
        </button>

      </form>


      <div
        id="pubResult"
        class="lab-result"
      ></div>
      `;


    $("pubForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);


        const text =
`${d.hook || "🔥 Vaovao tsara!"}

${d.problem
  ? "❗ " + d.problem + "\n\n"
  : ""}✅ ${d.product}
${d.solution || ""}

💰 Prix: ${money(d.price)}
📍 ${d.contact || ""}

👉 Alefaso ny hafatra ankehitriny hanaovana commande.`;


        $("pubResult").innerHTML = `

          <div
            class="generated-copy"
            id="pubText"
          >
            ${esc(text)
              .replace(/\n/g, "<br>")}
          </div>


          <div class="result-actions">

            <button
              class="btn btn-secondary"
              type="button"
              data-copy="pubText"
            >
              📋 Adikao
            </button>

          </div>

        `;


        touch();

        toast(
          "Publication vita."
        );

      }
    );

  }


  /* =========================================================
     6. SIMULATION CLIENT
        RAPIDE + GEMINI
     ========================================================= */

  const showToast =
    toast;

  const escapeHTML =
    esc;


  const simulationScenarios = [

    {
      client:
        "Lafo loatra ilay izy.",

      options: [

        "Eny, lafo tokoa.",

        "Azafady tompoko, inona no budget noeritreretinao? Afaka jerentsika izay quantité mifanaraka aminy.",

        "Tsy afaka mampidina prix aho."

      ],

      correct:
        1
    },


    {
      client:
        "Mbola hieritreritra aho.",

      options: [

        "Eny ary.",

        "Tsy maninona tompoko. Inona indrindra no mbola tianao hohamarinina alohan'ny hanapahanao hevitra?",

        "Raha tsy mividy ianao dia tsy maninona."

      ],

      correct:
        1
    },


    {
      client:
        "Misy remise ve?",

      options: [

        "Eny, ahena fotsiny.",

        "Miankina amin'ny quantité tompoko. Firy no ilainao dia kajiantsika izay offre mety?",

        "Tsy misy remise mihitsy."

      ],

      correct:
        1
    },


    {
      client:
        "Aiza no misy anareo?",

      options: [

        "Eto Madagascar.",

        "Aiza no misy anao tompoko? Dia hojereko ny toerana sy ny fomba hahazoanao azy.",

        "Aza manahy fa halefanay."

      ],

      correct:
        1
    },


    {
      client:
        "Alefaso aloha dia mandoa aho.",

      options: [

        "Eny, halefako.",

        "Andao aloha hamafisina ny commande sy ny fomba fandoavana ary ny fandefasana mba samy ho voaaro.",

        "Tsy azo atao."

      ],

      correct:
        1
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
      value:
        "facile",

      label:
        "Facile",

      description:
        "Client mbola mora resena lahatra ary tsy dia misy objection."
    },

    {
      value:
        "intermediaire",

      label:
        "Intermédiaire",

      description:
        "Client manontany sy manao objection tsindraindray."
    },

    {
      value:
        "difficile",

      label:
        "Difficile",

      description:
        "Client misalasala, mampitaha prix ary manery."
    },

    {
      value:
        "exigeant",

      label:
        "Client exigeant",

      description:
        "Client tena mitaky preuve, prix, garantie ary assurance."
    }

  ];
function generateGeminiPrompt() {

  const product =
    $("geminiProduct")?.value ||
    "vokatra iray";

  const difficulty =
    $("geminiDifficulty")?.value ||
    "intermediaire";

  const scenario =
    $("geminiScenario")?.value ||
    "Lafo loatra";

  const context =
    $("geminiContext")?.value?.trim() ||
    "";


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

async function copyGeminiPrompt() {
  try {
    await copyText(
      generateGeminiPrompt()
    );

    toast(
      "Prompt Gemini voadika. Apetaho ao amin'i Gemini."
    );

  } catch (error) {

    console.error(
      "Erreur copie Gemini:",
      error
    );

    toast(
      "Tsy afaka nandika ilay prompt."
    );
}


function openGemini() {
  try {

    const prompt =
      generateGeminiPrompt();

    copyText(prompt);

    window.open(
      "https://gemini.google.com/app",
      "_blank",
      "noopener,noreferrer"
    );

    toast(
      "Gemini nosokafana. Apetaho ilay prompt voadika."
    );

  } catch (error) {

    console.error(
      "Erreur ouverture Gemini:",
      error
    );

    toast(
      "Tsy afaka nanokatra Gemini."
    );
}


  function renderSimulationTool(
    container
  ) {

    const scenario =
      simulationScenarios[
        Math.floor(
          Math.random() *
          simulationScenarios.length
        )
      ];


    container.innerHTML = `

      <div class="workspace-header">

        <span class="eyebrow">
          LAB 05
        </span>

        <h2>
          🎯 Simulation Client
        </h2>

        <p>
          Manao pratique amin'ny objection ianao
          ary mianatra mamaly toy ny vendeur professionnel.
        </p>

      </div>


      <div class="simulation-mode-grid">

        <button
          type="button"
          class="simulation-mode-card active"
          data-simulation-mode="quick"
        >

          <strong>
            🎯 Simulation Rapide
          </strong>

          <span>
            Scenario fohy misy objection
            sy correction avy hatrany.
          </span>

        </button>


        <button
          type="button"
          class="simulation-mode-card"
          data-simulation-mode="gemini"
        >

          <strong>
            🤖 Simulation Libre avec Gemini
          </strong>

          <span>
            Gemini no CLIENT,
            ianao no VENDEUR.
          </span>

        </button>

      </div>


      <div
        id="quickSimulation"
        class="simulation-panel"
      >

        <div
          class="simulation-client-card"
        >

          <span class="eyebrow">
            CLIENT
          </span>

          <h3>
            "${escapeHTML(
              scenario.client
            )}"
          </h3>

        </div>


        <div
          class="simulation-options"
        >

          ${scenario.options.map(
            (option, index) => `

            <button
              type="button"
              class="simulation-option"
              data-answer="${index}"
            >
              ${escapeHTML(option)}
            </button>

          `
          ).join("")}

        </div>


        <div
          id="simulationFeedback"
          class="simulation-feedback"
        ></div>


        <button
          type="button"
          class="btn btn-secondary"
          data-new-simulation
        >
          🔄 Scenario hafa
        </button>

      </div>


      <div
        id="geminiSimulation"
        class="simulation-panel"
        style="display:none;"
      >

        <div class="gemini-panel">

          <div class="gemini-intro">

            <span class="eyebrow">
              🤖 GEMINI CLIENT
            </span>

            <h3>
              Simulation libre — Client réaliste
            </h3>

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
                    <option value="${escapeHTML(p)}">
                      ${escapeHTML(p)}
                    </option>
                  `
                ).join("")}

              </select>

            </label>


            <label>
              Niveau

              <select id="geminiDifficulty">

                ${geminiDifficulties.map(
                  (i) => `
                    <option value="${i.value}">
                      ${i.label}
                    </option>
                  `
                ).join("")}

              </select>

            </label>


            <label>
              Objection / scénario

              <select id="geminiScenario">

                <option>
                  Lafo loatra
                </option>

                <option>
                  Mbola hieritreritra
                </option>

                <option>
                  Mitady remise
                </option>

                <option>
                  Aiza no misy anareo?
                </option>

                <option>
                  Alefaso aloha dia mandoa aho
                </option>

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


          <div
            class="gemini-instructions"
          >

            <strong>
              Ahoana no fanaovana azy?
            </strong>

            <ol>

              <li>
                Safidio ny produit sy ny niveau.
              </li>

              <li>
                Tsindrio
                <strong>
                  Ouvrir Gemini
                </strong>.
              </li>

              <li>
                Apetaho ilay prompt
                raha tsy efa voapaste.
              </li>

              <li>
                Gemini no client.
              </li>

              <li>
                Ianao mamaly amin'ny
                maha-vendeur anao.
              </li>

              <li>
                Rehefa vita dia soraty:
                <strong>
                  FIN DE SIMULATION
                </strong>.
              </li>

              <li>
                Gemini no manao
                evaluation /100.
              </li>

            </ol>

          </div>

        </div>

      </div>

    `;


    const modeButtons =
      container.querySelectorAll(
        "[data-simulation-mode]"
      );

    const quickPanel =
      container.querySelector(
        "#quickSimulation"
      );

    const geminiPanel =
      container.querySelector(
        "#geminiSimulation"
      );


    modeButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            modeButtons.forEach(
              (item) =>
                item.classList.remove(
                  "active"
                )
            );


            button.classList.add(
              "active"
            );


            const gem =
              button.dataset
                .simulationMode ===
              "gemini";


            quickPanel.style.display =
              gem
                ? "none"
                : "block";


            geminiPanel.style.display =
              gem
                ? "block"
                : "none";

          }
        );

      }
    );


    container
      .querySelectorAll(
        ".simulation-option"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const answer =
                Number(
                  button.dataset.answer
                );


              const feedback =
                container.querySelector(
                  "#simulationFeedback"
                );


              container
                .querySelectorAll(
                  ".simulation-option"
                )
                .forEach(
                  (item) =>
                    (item.disabled = true)
                );


              if (
                answer ===
                scenario.correct
              ) {

                feedback.innerHTML = `

                  <div
                    class="
                      result-card
                      result-positive
                    "
                  >

                    <strong>
                      ✅ Bonne réponse
                    </strong>

                    <p>
                      Tsara ny fomba
                      namalianao.
                      Niezaka namantatra
                      ny besoin sy nitondra
                      ny conversation
                      nankany amin'ny
                      solution ianao.
                    </p>

                  </div>

                `;

              } else {

                feedback.innerHTML = `

                  <div
                    class="
                      result-card
                      result-negative
                    "
                  >

                    <strong>
                      ⚠️ Azo hatsaraina
                    </strong>

                    <p>
                      Aza mamaly objection
                      fotsiny.
                      Miezaha aloha hahatakatra
                      ny antony mahatonga
                      ilay client hisalasala.
                    </p>

                    <p>

                      <strong>
                        Réponse recommandée:
                      </strong>

                      ${escapeHTML(
                        scenario.options[
                          scenario.correct
                        ]
                      )}

                    </p>

                  </div>

                `;

              }


              touch();

            }
          );

        }
      );


    container
      .querySelector(
        "[data-new-simulation]"
      )
      ?.addEventListener(
        "click",
        () =>
          renderSimulationTool(
            container
          )
      );


    container
      .querySelector(
        "#copyGeminiPrompt"
      )
      ?.addEventListener(
        "click",
        copyGeminiPrompt
      );


    container
      .querySelector(
        "#openGemini"
      )
      ?.addEventListener(
        "click",
        openGemini
      );

  }


  /* =========================================================
     FARAN'NY PARTIE 2/3
     ========================================================= */
  /* =========================================================
     7. COMMANDE
     ========================================================= */

  function renderOrderTool(c) {

    c.innerHTML =
      head(
        "LAB 07",
        "🛒 Commande",
        "Client → Produit → Total → Statut."
      ) +

      `
      <form
        id="orderForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${field(
            "Client",
            "client",
            "text",
            "required"
          )}

          ${field(
            "Téléphone",
            "phone",
            "tel"
          )}

          ${field(
            "Produit",
            "product",
            "text",
            "required"
          )}

          ${field(
            "Isa",
            "quantity",
            "number",
            'min="1" value="1" required'
          )}

          ${field(
            "Prix / unité",
            "price",
            "number",
            'min="0" required'
          )}

          ${select(
            "Statut",
            "status",
            [
              "En attente",
              "Payé",
              "Livré",
              "Annulé"
            ]
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          🛒 Tahiry ny commande
        </button>

      </form>


      <div
        id="orderList"
        class="dashboard-list"
      ></div>
      `;


    const list = () => {

      $("orderList").innerHTML =
        state.orders.length

          ? state.orders
              .slice(-8)
              .reverse()
              .map(
                (o) => `

                  <div
                    class="dashboard-item"
                  >

                    <div>

                      <strong>
                        ${esc(o.client)}
                        —
                        ${esc(o.product)}
                      </strong>

                      <small>
                        ${fmtDate(o.date)}
                        •
                        ${esc(o.status)}
                      </small>

                    </div>

                    <strong>
                      ${money(o.total)}
                    </strong>

                  </div>

                `
              )
              .join("")

          : `
              <p class="empty-state">
                Tsy mbola misy commande.
              </p>
            `;

    };


    list();


    $("orderForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);


        state.orders.push({

          id:
            Date.now(),

          date:
            new Date().toISOString(),

          client:
            d.client,

          phone:
            d.phone,

          product:
            d.product,

          quantity:
            num(d.quantity),

          price:
            num(d.price),

          total:
            num(d.quantity) *
            num(d.price),

          status:
            d.status

        });


        touch();

        list();

        updateDashboard();

        e.currentTarget.reset();

        toast(
          "Commande voatahiry."
        );

      }
    );

  }


  /* =========================================================
     8. REÇU
     ========================================================= */

  function renderReceiptTool(c) {

    c.innerHTML =
      head(
        "LAB 08",
        "🧾 Reçu de Vente",
        "Vente → Paiement → Reçu."
      ) +

      `
      <form
        id="receiptForm"
        class="lab-form"
      >

        <div class="form-grid">

          ${field(
            "Client",
            "client",
            "text",
            "required"
          )}

          ${field(
            "Produit",
            "product",
            "text",
            "required"
          )}

          ${field(
            "Montant (Ar)",
            "amount",
            "number",
            'min="0" required'
          )}

          ${select(
            "Paiement",
            "method",
            [
              "Espèces",
              "Mvola",
              "Orange Money",
              "Airtel Money"
            ]
          )}

        </div>


        <button
          class="btn btn-primary"
          type="submit"
        >
          🧾 Hamorona Reçu
        </button>

      </form>


      <div
        id="receiptResult"
        class="lab-result"
      ></div>
      `;


    $("receiptForm").addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const d =
          getData(e.currentTarget);


        const txt =
`REÇU — TANTSAHA MATIHANINA
Date: ${fmtDate(new Date())}
Client: ${d.client}
Produit: ${d.product}
Montant: ${money(d.amount)}
Paiement: ${d.method}
Misaotra!`;


        $("receiptResult").innerHTML = `

          <div
            class="receipt-preview"
            id="receiptText"
          >

            <div class="receipt-brand">
              TANTSAHA MATIHANINA
            </div>

            <h3>
              REÇU DE VENTE
            </h3>

            <hr>

            <p>
              <strong>Date:</strong>
              ${fmtDate(new Date())}
            </p>

            <p>
              <strong>Client:</strong>
              ${esc(d.client)}
            </p>

            <p>
              <strong>Produit:</strong>
              ${esc(d.product)}
            </p>

            <p>
              <strong>Montant:</strong>
              ${money(d.amount)}
            </p>

            <p>
              <strong>Paiement:</strong>
              ${esc(d.method)}
            </p>

            <hr>

            <p>
              Misaotra!
            </p>

          </div>


          <div class="result-actions">

            <button
              class="btn btn-secondary"
              type="button"
              id="rcCopy"
            >
              📋 Adikao
            </button>

          </div>

        `;


        $("rcCopy").addEventListener(
          "click",
          () => copyText(txt)
        );


        touch();

      }
    );

  }


  /* =========================================================
     9. GUIDE FORMATION
     ========================================================= */

  const days = [

    [
      "Fototry ny Vente",
      "Fantaro ny valeur atolotra ny client."
    ],

    [
      "Client Cible",
      "Fantaro hoe iza no hividy sy inona ny olany."
    ],

    [
      "Offre & Prix",
      "Kajio ny coût, prix ary tombony."
    ],

    [
      "Publication & Copywriting",
      "Hook → Problème → Solution → Offre → CTA."
    ],

    [
      "Prospection & Discussion",
      "Comment → MP → Qualification → Proposition."
    ],

    [
      "Objection & Closing",
      "Valio ny objection ary akatony ny vente."
    ],

    [
      "Suivi & Fidélisation",
      "Araho ny client ary angataho ny retour."
    ]

  ];


  function renderGuideTool(c) {

    c.innerHTML =
      head(
        "GUIDE",
        "📘 Guide Formation",
        "Lesona sy pratique isan'andro."
      ) +

      `

      <div class="guide-content">

        ${days.map(
          (d, i) => `

            <div
              class="guide-step"
            >

              <span>
                ${i + 1}
              </span>

              <div>

                <h3>
                  ${d[0]}
                </h3>

                <p>
                  ${d[1]}
                </p>

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

      const done =
        state.challenge.length;


      c.innerHTML =
        head(
          "CHALLENGE",
          "🏆 Challenge 7 Jours",
          "Action → Résultat → Retour."
        ) +

        `

        <div class="challenge-list">

          ${days.map(
            (d, i) => `

              <label
                class="challenge-item"
              >

                <input
                  type="checkbox"
                  data-day="${i}"
                  ${
                    state.challenge.includes(i)
                      ? "checked"
                      : ""
                  }
                >

                <span
                  class="challenge-check"
                >
                  ${i + 1}
                </span>

                <span>

                  <strong>
                    ${d[0]}
                  </strong>

                  <small>
                    ${d[1]}
                  </small>

                </span>

              </label>

            `
          ).join("")}

        </div>


        <div
          class="challenge-progress"
        >

          <strong>
            ${done}/7 vita
          </strong>

          <div
            class="progress-track"
          >

            <i
              style="
                width:${(done / 7) * 100}%
              "
            ></i>

          </div>

        </div>

        `;


      c.querySelectorAll(
        "[data-day]"
      ).forEach(
        (cb) => {

          cb.addEventListener(
            "change",
            () => {

              const i =
                num(cb.dataset.day);


              state.challenge =
                cb.checked

                  ? [
                      ...new Set([
                        ...state.challenge,
                        i
                      ])
                    ]

                  : state.challenge.filter(
                      (x) => x !== i
                    );


              touch();

              draw();

            }
          );

        }
      );

    };


    draw();

  }


  /* =========================================================
     DASHBOARD
     ========================================================= */

  function updateDashboard() {

    const set =
      (id, v) => {

        const el =
          $(id);

        if (el) {
          el.textContent = v;
        }

      };


    const ev =
      state.evaluations;


    const sum =
      (arr, key) =>
        arr.reduce(
          (s, x) =>
            s + num(x[key]),
          0
        );


    set(
      "statCalculations",
      state.calculations.length
    );


    set(
      "statOrders",
      state.orders.length +
      sum(ev, "orders")
    );


    set(
      "statRevenue",
      money(
        sum(
          state.orders,
          "total"
        ) +
        sum(
          ev,
          "revenue"
        )
      )
    );


    set(
      "statProfit",
      money(
        sum(
          state.calculations,
          "profit"
        ) +
        sum(
          ev,
          "profit"
        )
      )
    );


    const f = {

      Prospects:
        sum(ev, "prospects"),

      Responses:
        sum(ev, "responses"),

      Discussions:
        sum(ev, "discussions"),

      Orders:
        state.orders.length +
        sum(ev, "orders"),

      Clients:
        state.orders.filter(
          (o) =>
            o.status === "Payé" ||
            o.status === "Livré"
        ).length

    };


    const max =
      Math.max(
        ...Object.values(f),
        1
      );


    Object.entries(f).forEach(
      ([key, value]) => {

        const bar =
          $("funnel" + key);


        if (bar) {

          bar.style.width =
            (value / max) *
            100 +
            "%";

        }


        set(
          "funnel" +
          key +
          "Count",
          value
        );

      }
    );


    const rc =
      $("recentCalculations");


    if (rc) {

      rc.innerHTML =
        state.calculations.length

          ? state.calculations
              .slice(-5)
              .reverse()
              .map(
                (x) => `

                  <div
                    class="dashboard-item"
                  >

                    <div>

                      <strong>
                        ${esc(
                          x.product ||
                          x.animal
                        )}
                      </strong>

                      <small>
                        ${fmtDate(x.date)}
                      </small>

                    </div>

                    <strong>
                      ${money(x.profit)}
                    </strong>

                  </div>

                `
              )
              .join("")

          : `
              <p>
                Aucun calcul mbola vita.
              </p>
            `;

    }


    const ro =
      $("recentOrders");


    if (ro) {

      ro.innerHTML =
        state.orders.length

          ? state.orders
              .slice(-5)
              .reverse()
              .map(
                (x) => `

                  <div
                    class="dashboard-item"
                  >

                    <div>

                      <strong>
                        ${esc(x.client)}
                      </strong>

                      <small>
                        ${fmtDate(x.date)}
                        •
                        ${esc(x.status)}
                      </small>

                    </div>

                    <strong>
                      ${money(x.total)}
                    </strong>

                  </div>

                `
              )
              .join("")

          : `
              <p>
                Aucune commande
                mbola voatahiry.
              </p>
            `;

    }

  }


  /* =========================================================
     EVALUATION
     ========================================================= */

  function initEvaluation() {

    const f =
      $("evaluationForm");


    if (!f) return;


    f.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        const d =
          getData(f);


        const row = {

          ...d,

          date:
            new Date().toISOString()

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
        ].forEach(
          (key) => {

            row[key] =
              num(row[key]);

          }
        );


        state.evaluations.push(
          row
        );


        touch();


        remote(
          "evaluations",
          row
        );


        f.reset();

        updateDashboard();


        toast(
          "Misaotra! Voatahiry ny retour."
        );

      }
    );

  }


  /* =========================================================
     AVIS / REVIEWS
     ========================================================= */

  function renderReviews() {

    const box =
      $("reviewsList");


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


    box.innerHTML =
      state.localReviews
        .slice()
        .reverse()
        .map(
          (r) => `

            <div
              class="review-card"
            >

              <div
                class="review-header"
              >

                <strong>
                  ${esc(r.name)}
                </strong>

                <span>
                  ${
                    "⭐".repeat(
                      num(r.rating)
                    )
                  }
                </span>

              </div>


              ${
                r.learning
                  ? `
                    <p>
                      <strong>
                        Nianarana:
                      </strong>

                      ${esc(
                        r.learning
                      )}

                    </p>
                  `
                  : ""
              }


              ${
                r.applied
                  ? `
                    <p>

                      <strong>
                        Nampiharina:
                      </strong>

                      ${esc(
                        r.applied
                      )}

                    </p>
                  `
                  : ""
              }


              ${
                r.result
                  ? `
                    <p>

                      <strong>
                        Résultat:
                      </strong>

                      ${esc(
                        r.result
                      )}

                    </p>
                  `
                  : ""
              }


              ${
                r.message
                  ? `
                    <blockquote>
                      ${esc(
                        r.message
                      )}
                    </blockquote>
                  `
                  : ""
              }

            </div>

          `
        )
        .join("");

  }


  function initReviews() {

    const f =
      $("reviewForm");


    if (!f) return;


    f.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        const d =
          getData(f);


        const row = {

          ...d,

          date:
            new Date().toISOString()

        };


        delete row.consent;


        state.localReviews.push(
          row
        );


        touch();


        remote(
          "reviews",
          row
        );


        f.reset();


        closeModal(
          "reviewModal"
        );


        renderReviews();


        toast(
          "Misaotra tamin'ny avis-nao!"
        );

      }
    );

  }


  /* =========================================================
     MODAL
     ========================================================= */

  function openModal(id) {

    const m =
      $(id);


    if (!m) return;


    m.classList.add(
      "open"
    );


    m.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "modal-open"
    );

  }


  function closeModal(id) {

    const m =
      id
        ? $(id)
        : document.querySelector(
            ".modal.open"
          );


    if (!m) return;


    m.classList.remove(
      "open"
    );


    m.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "modal-open"
    );

  }


  /* =========================================================
     GLOBAL CLICKS
     ========================================================= */

  function initGlobalClicks() {

    document.addEventListener(
      "click",
      (e) => {

        const t =
          e.target;

        let el;


        /*
         * Modal open
         */

        if (
          (el =
            t.closest(
              "[data-modal-open]"
            ))
        ) {

          return openModal(
            el.dataset.modalOpen
          );

        }


        /*
         * Modal close
         */

        if (
          t.closest(
            "[data-modal-close]"
          )
        ) {

          return closeModal();

        }


        /*
         * Click outside modal
         */

        if (
          t.classList &&
          t.classList.contains(
            "modal"
          )
        ) {

          return closeModal();

        }


        /*
         * Copy
         */

        if (
          (el =
            t.closest(
              "[data-copy]"
            ))
        ) {

          const src =
            $(el.dataset.copy);


          return (
            src &&
            copyText(
              src.innerText
            )
          );

        }


        /*
         * External links
         */

        if (
          (el =
            t.closest(
              "[data-external]"
            ))
          &&
          el.dataset.external
        ) {

          return window.open(
            el.dataset.external,
            "_blank",
            "noopener,noreferrer"
          );

        }


        /*
         * WhatsApp
         */

        if (
          t.closest(
            "[data-whatsapp-purchase]"
          )
          ||
          t.closest(
            "[data-whatsapp]"
          )
        ) {

          return window.open(
            CONFIG.whatsappPurchase,
            "_blank",
            "noopener,noreferrer"
          );

        }


        /*
         * Reset data
         */

        if (
          t.closest(
            "[data-reset-data]"
          )
        ) {

          if (
            confirm(
              "Hamafa ny données rehetra ao amin'ity appareil ity?"
            )
          ) {

            state =
              clone(defaults);


            saveState();


            updateDashboard();


            renderReviews();


            toast(
              "Voafafa ny données.",
              "warning"
            );

          }

        }

      }
    );


    document.addEventListener(
      "keydown",
      (e) => {

        if (
          e.key === "Escape"
        ) {

          closeModal();

        }

      }
    );

  }


  /* =========================================================
     SUPABASE
     ========================================================= */

  function initSupabase() {

    try {

      if (
        window.supabase &&
        typeof window.supabase.createClient ===
          "function"
      ) {

        sb =
          window.supabase.createClient(
            CONFIG.supabaseUrl,
            CONFIG.supabaseKey
          );

      }

    } catch (e) {

      console.warn(
        "Supabase tsy misy:",
        e
      );

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


window.addEventListener(
  "load",
  initSupabase
);


/* =========================================================
   FARAN'NY APP.JS
   ========================================================= */
})();
