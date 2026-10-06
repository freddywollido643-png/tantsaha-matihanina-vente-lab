/* TANTSAHA MATIHANINA • VENTE LAB — APP.JS (feno, voahitsy) */
(function () {
  "use strict";

  const CONFIG = {
    whatsappGroup: "https://chat.whatsapp.com/InDOPztfXnCC6crJfJ368B",
    whatsappPurchase: "https://wa.me/261385651378",
    facebook: "https://www.facebook.com/share/1Zfiu8oj3m/",
    supabaseUrl: "https://sdzybetralbaincrxddf.supabase.co",
    supabaseKey: "sb_publishable_3ByjJyxXteRPkG7cWHHFxw_3wVXU9Qy"
  };
  const KEY = "tm_vente_lab_state_v3";
  const defaults = {
    calculations: [], orders: [], evaluations: [], localReviews: [],
    prospects: [], calendarPlans: [], challenge: [], lastActivity: null
  };
  let state = loadState();
  let sb = null;

  /* ---------- Utils ---------- */
  const $ = (id) => document.getElementById(id);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const money = (v) => num(v).toLocaleString("fr-FR") + " Ar";
  const fmtDate = (d) => {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? "—" :
      x.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const todayISO = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  };
  const addDays = (iso, n) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d;
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      return { ...clone(defaults), ...(raw ? JSON.parse(raw) : {}) };
    } catch (e) { return clone(defaults); }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Tsy voatahiry:", e); }
  }
  function touch() { state.lastActivity = new Date().toISOString(); saveState(); }

  function toast(msg, type = "success") {
    let t = $("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 3500);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    toast("Voadika (copié).");
  }

  async function remote(table, row) {
    if (!sb) return;
    try {
      const { error } = await sb.from(table).insert(row);
      if (error) console.warn("Supabase:", error.message);
    } catch (e) { console.warn("Supabase:", e); }
  }

  /* ---------- Template helpers ---------- */
  const head = (eb, title, text) => `
    <div class="workspace-header"><div>
      <span class="eyebrow">${eb}</span><h2>${title}</h2><p>${text}</p></div></div>`;
  const field = (label, name, type = "text", extra = "") =>
    `<label>${label}<input type="${type}" name="${name}" ${extra}></label>`;
  const area = (label, name, extra = "") =>
    `<label>${label}<textarea name="${name}" rows="3" ${extra}></textarea></label>`;
  const select = (label, name, opts, req = true) =>
    `<label>${label}<select name="${name}" ${req ? "required" : ""}>
      <option value="">-- Misafidiana --</option>${opts.map((o) => `<option>${esc(o)}</option>`).join("")}
    </select></label>`;
  const getData = (form) => Object.fromEntries(new FormData(form).entries());

  const ANIMALS = ["Akoho Gasy", "Pondeuse", "Poulet de chair", "Kisoa", "Osy", "Ondry",
    "Bitro", "Gana", "Gisa", "Vorontsiloza", "Omby"];

  /* ---------- Tools dispatcher ---------- */
  function initTools() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tool]");
      if (b) openTool(b.dataset.tool);
    });
  }

  function openTool(tool) {
    const ws = $("toolWorkspace");
    if (!ws) return;
    const tools = {
      price: renderPriceTool, livestock: renderLivestockTool, offer: renderOfferTool,
      publication: renderPublicationTool, simulation: renderSimulationTool,
      order: renderOrderTool, receipt: renderReceiptTool, guide: renderGuideTool,
      challenge: renderChallengeTool, calendar: renderCalendarTool
    };
    if (!tools[tool]) {
      ws.innerHTML = `<div class="workspace-empty"><h3>Outil mbola tsy voaomana</h3>
        <p>Hampidirina amin'ny version manaraka.</p></div>`;
      return;
    }
    tools[tool](ws);
    ws.dataset.activeTool = tool;
  }

  /* ---------- 1. Prix & Tombony ---------- */
  function renderPriceTool(c) {
    c.innerHTML = head("LAB 01", "Kajy Prix & Tombony",
      "Fantaro aloha ny coût, ny prix de vente ary ny tombony vao mamorona offre.") + `
      <form id="priceForm" class="lab-form"><div class="form-grid">
        ${field("Vokatra", "product", "text", 'placeholder="Ohatra: Akoho Gasy" required')}
        ${field("Isan'ny vokatra", "quantity", "number", 'min="1" value="1" required')}
        ${field("Coût total", "cost", "number", 'min="0" placeholder="Ohatra: 60000" required')}
        ${field("Prix de vente / unité", "price", "number", 'min="0" placeholder="Ohatra: 30000" required')}
      </div><button class="btn btn-primary" type="submit">🧮 Kajio ny tombony</button></form>
      <div id="priceResult" class="lab-result"></div>`;
    $("priceForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const quantity = num(d.quantity), cost = num(d.cost), price = num(d.price);
      const revenue = quantity * price, profit = revenue - cost;
      const r = {
        date: new Date().toISOString(), product: d.product, quantity, cost, price,
        revenue, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0
      };
      state.calculations.push(r); touch();
      const ok = r.profit >= 0;
      $("priceResult").innerHTML = `
        <div class="result-card ${ok ? "result-positive" : "result-negative"}">
          <div class="result-title">${ok ? "✅ Mahazo tombony" : "⚠️ Misy fatiantoka"}</div>
          <div class="result-grid">
            <div><span>Vola miditra</span><strong>${money(r.revenue)}</strong></div>
            <div><span>Coût</span><strong>${money(r.cost)}</strong></div>
            <div><span>Tombony</span><strong>${money(r.profit)}</strong></div>
            <div><span>Margin</span><strong>${r.margin.toFixed(2)}%</strong></div>
          </div>
          <div class="result-advice">${ok
            ? "Afaka mandroso amin'ny famoronana offre sy publication ianao."
            : "Avereno jerena ny coût na ny prix de vente alohan'ny hivarotana."}</div>
        </div>`;
      updateDashboard(); toast("Kajy vita ary voatahiry.");
    });
  }

  /* ---------- 2. Fiompiana ---------- */
  function renderLivestockTool(c) {
    c.innerHTML = head("LAB 02", "Kajy Fiompiana",
      "Ampidiro ny karazana biby, isan'ny biby ary ny dépenses hahitana ny coût sy ny potentiel de vente.") + `
      <form id="livestockForm" class="lab-form"><div class="form-grid">
        ${select("Karazana", "animal", ANIMALS)}
        ${field("Isan'ny biby", "quantity", "number", 'min="1" value="10" required')}
        ${field("Coût sakafo", "feed", "number", 'min="0" value="0"')}
        ${field("Fanafody / vaksiny", "health", "number", 'min="0" value="0"')}
        ${field("Achat biby", "purchase", "number", 'min="0" value="0"')}
        ${field("Dépenses hafa", "other", "number", 'min="0" value="0"')}
        ${field("Prix de vente / biby", "salePrice", "number", 'min="0" value="0"')}
      </div><button class="btn btn-primary" type="submit">🐓 Kajio ny fiompiana</button></form>
      <div id="livestockResult" class="lab-result"></div>`;
    $("livestockForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const q = num(d.quantity);
      const cost = num(d.feed) + num(d.health) + num(d.purchase) + num(d.other);
      const revenue = q * num(d.salePrice), profit = revenue - cost;
      const per = q > 0 ? cost / q : 0;
      state.calculations.push({
        date: new Date().toISOString(), animal: d.animal, product: d.animal,
        quantity: q, cost, revenue, profit, costPerAnimal: per
      });
      touch();
      $("livestockResult").innerHTML = `
        <div class="result-card">
          <div class="result-title">${esc(d.animal)} — Résultat</div>
          <div class="result-grid">
            <div><span>Isan'ny biby</span><strong>${q}</strong></div>
            <div><span>Coût total</span><strong>${money(cost)}</strong></div>
            <div><span>Coût / biby</span><strong>${money(per)}</strong></div>
            <div><span>Vola miditra</span><strong>${money(revenue)}</strong></div>
            <div><span>Tombony</span><strong>${money(profit)}</strong></div>
          </div>
          <div class="result-advice">${profit > 0
            ? "Tsara: afaka manohy amin'ny préparation de vente ianao."
            : "Tandremo: mety tsy hahazo tombony amin'ity prix ity."}</div>
        </div>`;
      updateDashboard(); toast("Kajy fiompiana vita.");
    });
  }

  /* ---------- 3. Calendrier ---------- */
  const profiles = {
    "Akoho Gasy": [150, 120, 210], "Pondeuse": [140, 120, 180],
    "Poulet de chair": [45, 35, 60], "Kisoa": [180, 150, 240],
    "Bitro": [90, 70, 120], "Gana": [100, 80, 130], "Gisa": [150, 120, 200],
    "Vorontsiloza": [150, 120, 200], "Osy": [240, 180, 300], "Ondry": [240, 180, 300]
  };

  function renderCalendarTool(c) {
    c.innerHTML = head("LAB 10 • OUTIL STRATÉGIQUE", "📅 Calendrier Mpiompy & Vente",
      "Tsy ny daty hivarotana ihany no kajiana: fiompiana → préparation → prospection → publication → commande → vente → suivi.") + `
      <div class="info-box"><strong>Ahoana no fampiasana azy?</strong>
        <ol><li>Safidio ny karazana biby.</li><li>Ampidiro ny daty nanombohana.</li>
        <li>Raha fantatra, ampidiro ny andro ananany.</li><li>Tsindrio <strong>Hamorona Calendrier</strong>.</li></ol>
        <p>⚠️ Tombana ihany ny daty. Ny lanja, fahasalamana, sakafo ary vidin'ny tsena no manamafy ny tena fotoana hivarotana.</p></div>
      <form id="calendarForm" class="lab-form"><div class="form-grid">
        ${select("Karazana biby", "animal", Object.keys(profiles))}
        ${field("Isan'ny biby", "quantity", "number", 'min="1" value="10" required')}
        ${field("Daty nanombohana", "startDate", "date", `value="${todayISO()}" required`)}
        ${field("Andro ananan'ny biby (raha fantatra)", "ageDays", "number", 'min="0" value="0"')}
        ${field("Lanja ankehitriny kg (raha fantatra)", "weight", "number", 'min="0" step="0.1" value="0"')}
        ${field("Prix de vente / biby", "salePrice", "number", 'min="0" value="0"')}
      </div><button class="btn btn-primary" type="submit">📅 Hamorona Calendrier</button></form>
      <div id="calendarResult" class="lab-result"></div>`;
    $("calendarForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const [def, min, max] = profiles[d.animal];
      const age = num(d.ageDays), q = num(d.quantity);
      const left = Math.max(def - age, 0);
      const sale = addDays(d.startDate, left);
      const rangeA = addDays(d.startDate, Math.max(min - age, 0));
      const rangeB = addDays(d.startDate, Math.max(max - age, 0));
      const at = (n) => new Date(sale.getTime() - n * 86400000);
      const events = [
        ["🐣", "Fiandohana fiompiana", new Date(d.startDate + "T00:00:00"), "Manomboka ny fiompiana sy ny fanaraha-maso."],
        ["🧰", "Préparation de vente", at(30), "Jereo ny lanja, fahasalamana, fitaovana ary lanja kendrena."],
        ["🔎", "Prospection", at(21), "Mitady client: namana, tsena, vondrom-piarahamonina."],
        ["📢", "Publication", at(14), "Alefaso ny publication sy ny sary/vidéo ny biby."],
        ["🛒", "Commande", at(7), "Raiso ny commande sy ny acompte."],
        ["💰", "Vente", sale, "Andro tombanana hivarotana (hamafisina araka ny lanja sy ny tsena)."],
        ["🤝", "Suivi client", new Date(sale.getTime() + 7 * 86400000), "Angataho ny retour ary tehirizo ny client."]
      ];
      const revenue = q * num(d.salePrice);
      state.calendarPlans.push({ date: new Date().toISOString(), animal: d.animal, quantity: q, sale: sale.toISOString() });
      touch();
      $("calendarResult").innerHTML = `
        <div class="result-card">
          <div class="result-card-header"><span>${esc(d.animal)} × ${q}</span><strong>Vente: ${fmtDate(sale)}</strong></div>
          <div class="calendar-result-warning">⚠️ <span>Fetra tombana: ${fmtDate(rangeA)} → ${fmtDate(rangeB)}. Tombana ihany ny daty.</span></div>
          <div class="calendar-timeline">${events.map((ev, i) => `
            <div class="calendar-event ${ev[1] === "Vente" ? "calendar-event-main" : ""}">
              <div class="calendar-event-icon">${ev[0]}</div>
              <div><strong>${ev[1]}</strong><small>${fmtDate(ev[2])}</small><p>${ev[3]}</p></div>
            </div>`).join("")}</div>
          <div class="calendar-action-plan"><h3>Plan d'action</h3><ul>
            <li>Andro sisa alohan'ny vente: <strong>${left}</strong></li>
            ${revenue > 0 ? `<li>CA mety azo: <strong>${money(revenue)}</strong></li>` : ""}
            <li>Manomboka mitady client farafahakeliny 3 herinandro mialoha.</li></ul></div>
          <div class="calendar-note"><strong>Fampitandremana</strong>
            <p>Raha tsy mahatratra ny lanja kendrena ny biby dia ampiato ny daty hivarotana.</p></div>
        </div>`;
      toast("Calendrier vita.");
    });
  }

  /* ---------- 4. Offre ---------- */
  function renderOfferTool(c) {
    c.innerHTML = head("LAB 03", "🎁 Créer une Offre", "Client → Problème → Solution → Prix → CTA.") + `
      <form id="offerForm" class="lab-form"><div class="form-grid">
        ${field("Vokatra / service", "product", "text", "required")}
        ${field("Client kendrena", "client", "text", 'placeholder="Ohatra: mpandrafitra fety" required')}
        ${area("Olana amin'ny client", "problem")}
        ${area("Vahaolana atolotra", "solution")}
        ${field("Prix (Ar)", "price", "number", 'min="0"')}
        ${field("Bonus / garantie", "bonus", "text")}
      </div><button class="btn btn-primary" type="submit">🎁 Hamorona Offre</button></form>
      <div id="offerResult" class="lab-result"></div>`;
    $("offerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const text = `🎁 OFFRE: ${d.product}\n\n👤 Ho an'ny: ${d.client}\n❗ Olana: ${d.problem || "—"}\n✅ Vahaolana: ${d.solution || "—"}\n💰 Prix: ${money(d.price)}${d.bonus ? `\n🎯 Bonus: ${d.bonus}` : ""}\n\n📲 Alefaso ny hafatra hanaovana commande.`;
      $("offerResult").innerHTML = `<div class="generated-copy" id="offerText">${esc(text).replace(/\n/g, "<br>")}</div>
        <div class="result-actions"><button class="btn btn-secondary" type="button" data-copy="offerText">📋 Adikao</button></div>`;
      state.lastOffer = d; touch(); toast("Offre vita.");
    });
  }

  /* ---------- 5. Publication ---------- */
  function renderPublicationTool(c) {
    const o = state.lastOffer || {};
    c.innerHTML = head("LAB 04", "📢 Publication", "Hook → Problème → Solution → Offre → Prix → CTA.") + `
      <form id="pubForm" class="lab-form"><div class="form-grid">
        ${field("Vokatra", "product", "text", `value="${esc(o.product || "")}" required`)}
        ${field("Hook (fanombohana)", "hook", "text", 'placeholder="Ohatra: Mila akoho tsara ve ianao?"')}
        ${area("Olana", "problem", "")}
        ${area("Vahaolana / offre", "solution", "")}
        ${field("Prix (Ar)", "price", "number", `min="0" value="${esc(o.price || "")}"`)}
        ${field("Contact / lieu", "contact", "text", 'placeholder="WhatsApp, Toamasina..."')}
      </div><button class="btn btn-primary" type="submit">📢 Hamorona Publication</button></form>
      <div id="pubResult" class="lab-result"></div>`;
    $("pubForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const text = `${d.hook || "🔥 Vaovao tsara!"}\n\n${d.problem ? "❗ " + d.problem + "\n\n" : ""}✅ ${d.product}\n${d.solution || ""}\n\n💰 Prix: ${money(d.price)}\n📍 ${d.contact || ""}\n\n👉 Alefaso ny hafatra ankehitriny hanaovana commande.`;
      $("pubResult").innerHTML = `<div class="generated-copy" id="pubText">${esc(text).replace(/\n/g, "<br>")}</div>
        <div class="result-actions">
          <button class="btn btn-secondary" type="button" data-copy="pubText">📋 Adikao</button>
        </div>`;
      touch(); toast("Publication vita.");
    });
  }

  /* ---------- 6. Simulation client ---------- */
  const objections = [
    "Lafo loatra!", "Mbola hieritreritra aho.", "Misy remise ve?",
    "Tsy matoky aho.", "Misy hafa mora kokoa."
  ];
  function renderSimulationTool(c) {
    c.innerHTML = head("LAB 06", "💬 Simulation Client", "Misafidiana objection, valio, dia jereo ny score.") + `
      <div class="simulation-selector">${objections.map((o, i) =>
        `<button type="button" class="simulation-option" data-obj="${i}">${esc(o)}</button>`).join("")}</div>
      <div id="simBox"></div>`;
    c.querySelectorAll("[data-obj]").forEach((b) => b.addEventListener("click", () => showSim(num(b.dataset.obj))));
  }
  function showSim(i) {
    $("simBox").innerHTML = `<div class="simulation-card"><strong>Client:</strong>
      <blockquote>“${esc(objections[i])}”</blockquote>
      <label>Ny valinao<textarea id="simAnswer" rows="4" placeholder="Soraty eto ny valinao..."></textarea></label>
      <div class="result-actions"><button class="btn btn-primary" type="button" id="simGo">Hizaha score</button></div>
      <div id="simScore"></div></div>`;
    $("simGo").addEventListener("click", () => {
      const a = ($("simAnswer").value || "").toLowerCase();
      const crit = [
        [/azafady|misaotra|azoko|ekena|tiako/, "Fihaonana (empathie)"],
        [/tombony|valeur|kalitao|tsara|vokatra|vahaolana|antoka/, "Valeur / tombony"],
        [/\?/, "Fanontaniana hanazava"],
        [/commande|alefaso|androany|hanomboka|raiso|mandefa/, "Closing / CTA"]
      ];
      const hit = crit.filter((x) => x[0].test(a));
      const score = hit.length * 25;
      $("simScore").innerHTML = `<div class="score-display"><span>Score</span><strong>${score}/100</strong></div>
        <p>${hit.length === 4 ? "Tena tsara!" : "Mbola azo hatsaraina: " +
        crit.filter((x) => !x[0].test(a)).map((x) => x[1]).join(", ")}</p>`;
      touch();
    });
  }

  /* ---------- 7. Commande ---------- */
  function renderOrderTool(c) {
    c.innerHTML = head("LAB 07", "🛒 Commande", "Client → Produit → Total → Statut.") + `
      <form id="orderForm" class="lab-form"><div class="form-grid">
        ${field("Client", "client", "text", "required")}
        ${field("Téléphone", "phone", "tel")}
        ${field("Produit", "product", "text", "required")}
        ${field("Isa", "quantity", "number", 'min="1" value="1" required')}
        ${field("Prix / unité", "price", "number", 'min="0" required')}
        ${select("Statut", "status", ["En attente", "Payé", "Livré", "Annulé"])}
      </div><button class="btn btn-primary" type="submit">🛒 Tahiry ny commande</button></form>
      <div id="orderList" class="dashboard-list"></div>`;
    const list = () => {
      $("orderList").innerHTML = state.orders.length ? state.orders.slice(-8).reverse().map((o) =>
        `<div class="dashboard-item"><div><strong>${esc(o.client)} — ${esc(o.product)}</strong>
        <small>${fmtDate(o.date)} • ${esc(o.status)}</small></div><strong>${money(o.total)}</strong></div>`).join("")
        : '<p class="empty-state">Tsy mbola misy commande.</p>';
    };
    list();
    $("orderForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      state.orders.push({
        id: Date.now(), date: new Date().toISOString(), client: d.client, phone: d.phone,
        product: d.product, quantity: num(d.quantity), price: num(d.price),
        total: num(d.quantity) * num(d.price), status: d.status
      });
      touch(); list(); updateDashboard(); e.currentTarget.reset(); toast("Commande voatahiry.");
    });
  }

  /* ---------- 8. Reçu ---------- */
  function renderReceiptTool(c) {
    c.innerHTML = head("LAB 08", "🧾 Reçu de Vente", "Vente → Paiement → Reçu.") + `
      <form id="receiptForm" class="lab-form"><div class="form-grid">
        ${field("Client", "client", "text", "required")}
        ${field("Produit", "product", "text", "required")}
        ${field("Montant (Ar)", "amount", "number", 'min="0" required')}
        ${select("Paiement", "method", ["Espèces", "Mvola", "Orange Money", "Airtel Money"])}
      </div><button class="btn btn-primary" type="submit">🧾 Hamorona Reçu</button></form>
      <div id="receiptResult" class="lab-result"></div>`;
    $("receiptForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(e.currentTarget);
      const txt = `REÇU — TANTSAHA MATIHANINA\nDate: ${fmtDate(new Date())}\nClient: ${d.client}\nProduit: ${d.product}\nMontant: ${money(d.amount)}\nPaiement: ${d.method}\nMisaotra!`;
      $("receiptResult").innerHTML = `<div class="receipt-preview" id="receiptText">
        <div class="receipt-brand">TANTSAHA MATIHANINA</div><h3>REÇU DE VENTE</h3><hr>
        <p><strong>Date:</strong> ${fmtDate(new Date())}</p>
        <p><strong>Client:</strong> ${esc(d.client)}</p>
        <p><strong>Produit:</strong> ${esc(d.product)}</p>
        <p><strong>Montant:</strong> ${money(d.amount)}</p>
        <p><strong>Paiement:</strong> ${esc(d.method)}</p><hr><p>Misaotra!</p></div>
        <div class="result-actions"><button class="btn btn-secondary" type="button" id="rcCopy">📋 Adikao</button></div>`;
      $("rcCopy").addEventListener("click", () => copyText(txt));
      touch();
    });
  }

  /* ---------- 9. Guide & 10. Challenge ---------- */
  const days = [
    ["Fototry ny Vente", "Fantaro ny valeur atolotra ny client."],
    ["Client Cible", "Fantaro hoe iza no hividy sy inona ny olany."],
    ["Offre & Prix", "Kajio ny coût, prix ary tombony."],
    ["Publication & Copywriting", "Hook → Problème → Solution → Offre → CTA."],
    ["Prospection & Discussion", "Comment → MP → Qualification → Proposition."],
    ["Objection & Closing", "Valio ny objection ary akatony ny vente."],
    ["Suivi & Fidélisation", "Araho ny client ary angataho ny retour."]
  ];
  function renderGuideTool(c) {
    c.innerHTML = head("GUIDE", "📘 Guide Formation", "Lesona sy pratique isan'andro.") +
      `<div class="guide-content">${days.map((d, i) => `<div class="guide-step">
        <span>${i + 1}</span><div><h3>${d[0]}</h3><p>${d[1]}</p></div></div>`).join("")}</div>`;
  }
  function renderChallengeTool(c) {
    const draw = () => {
      const done = state.challenge.length;
      c.innerHTML = head("CHALLENGE", "🏆 Challenge 7 Jours", "Action → Résultat → Retour.") +
        `<div class="challenge-list">${days.map((d, i) => `<label class="challenge-item">
          <input type="checkbox" data-day="${i}" ${state.challenge.includes(i) ? "checked" : ""}>
          <span class="challenge-check">${i + 1}</span>
          <span><strong>${d[0]}</strong><small>${d[1]}</small></span></label>`).join("")}</div>
        <div class="challenge-progress"><strong>${done}/7 vita</strong>
        <div class="progress-track"><i style="width:${(done / 7) * 100}%"></i></div></div>`;
      c.querySelectorAll("[data-day]").forEach((cb) => cb.addEventListener("change", () => {
        const i = num(cb.dataset.day);
        state.challenge = cb.checked ? [...new Set([...state.challenge, i])] : state.challenge.filter((x) => x !== i);
        touch(); draw();
      }));
    };
    draw();
  }

  /* ---------- Dashboard ---------- */
  function updateDashboard() {
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    const ev = state.evaluations;
    const sum = (arr, k) => arr.reduce((s, x) => s + num(x[k]), 0);
    set("statCalculations", state.calculations.length);
    set("statOrders", state.orders.length + sum(ev, "orders"));
    set("statRevenue", money(sum(state.orders, "total") + sum(ev, "revenue")));
    set("statProfit", money(sum(state.calculations, "profit") + sum(ev, "profit")));
    const f = {
      Prospects: sum(ev, "prospects"), Responses: sum(ev, "responses"),
      Discussions: sum(ev, "discussions"), Orders: state.orders.length + sum(ev, "orders"),
      Clients: state.orders.filter((o) => o.status === "Payé" || o.status === "Livré").length
    };
    const max = Math.max(...Object.values(f), 1);
    Object.entries(f).forEach(([k, v]) => {
      const bar = $("funnel" + k); if (bar) bar.style.width = (v / max) * 100 + "%";
      set("funnel" + k + "Count", v);
    });
    const rc = $("recentCalculations");
    if (rc) rc.innerHTML = state.calculations.length ? state.calculations.slice(-5).reverse().map((x) =>
      `<div class="dashboard-item"><div><strong>${esc(x.product || x.animal)}</strong><small>${fmtDate(x.date)}</small></div>
      <strong>${money(x.profit)}</strong></div>`).join("") : "<p>Aucun calcul mbola vita.</p>";
    const ro = $("recentOrders");
    if (ro) ro.innerHTML = state.orders.length ? state.orders.slice(-5).reverse().map((x) =>
      `<div class="dashboard-item"><div><strong>${esc(x.client)}</strong><small>${fmtDate(x.date)} • ${esc(x.status)}</small></div>
      <strong>${money(x.total)}</strong></div>`).join("") : "<p>Aucune commande mbola voatahiry.</p>";
  }

  /* ---------- Evaluation & Avis ---------- */
  function initEvaluation() {
    const f = $("evaluationForm");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(f);
      const row = { ...d, date: new Date().toISOString() };
      ["views", "messages", "prospects", "responses", "discussions", "orders", "revenue", "profit"]
        .forEach((k) => (row[k] = num(row[k])));
      state.evaluations.push(row); touch();
      remote("evaluations", row);
      f.reset(); updateDashboard(); toast("Misaotra! Voatahiry ny retour.");
    });
  }

  function renderReviews() {
    const box = $("reviewsList");
    if (!box) return;
    if (!state.localReviews.length) return;
    box.innerHTML = state.localReviews.slice().reverse().map((r) => `
      <div class="review-card"><div class="review-header"><strong>${esc(r.name)}</strong>
        <span>${"⭐".repeat(num(r.rating))}</span></div>
        ${r.learning ? `<p><strong>Nianarana:</strong> ${esc(r.learning)}</p>` : ""}
        ${r.applied ? `<p><strong>Nampiharina:</strong> ${esc(r.applied)}</p>` : ""}
        ${r.result ? `<p><strong>Résultat:</strong> ${esc(r.result)}</p>` : ""}
        ${r.message ? `<blockquote>${esc(r.message)}</blockquote>` : ""}</div>`).join("");
  }
  function initReviews() {
    const f = $("reviewForm");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = getData(f);
      const row = { ...d, date: new Date().toISOString() };
      delete row.consent;
      state.localReviews.push(row); touch();
      remote("reviews", row);
      f.reset(); closeModal("reviewModal"); renderReviews(); toast("Misaotra tamin'ny avis-nao!");
    });
  }

  /* ---------- Modal & global clicks ---------- */
  function openModal(id) {
    const m = $(id); if (!m) return;
    m.classList.add("open"); m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeModal(id) {
    const m = id ? $(id) : document.querySelector(".modal.open");
    if (!m) return;
    m.classList.remove("open"); m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function initGlobalClicks() {
    document.addEventListener("click", (e) => {
      const t = e.target;
      let el;
      if ((el = t.closest("[data-modal-open]"))) return openModal(el.dataset.modalOpen);
      if (t.closest("[data-modal-close]")) return closeModal();
      if (t.classList && t.classList.contains("modal")) return closeModal();
      if ((el = t.closest("[data-copy]"))) {
        const src = $(el.dataset.copy);
        return src && copyText(src.innerText);
      }
      if ((el = t.closest("[data-external]")) && el.dataset.external)
        return window.open(el.dataset.external, "_blank", "noopener,noreferrer");
      if (t.closest("[data-whatsapp-purchase]") || t.closest("[data-whatsapp]"))
        return window.open(CONFIG.whatsappPurchase, "_blank", "noopener,noreferrer");
      if (t.closest("[data-reset-data]")) {
        if (confirm("Hamafa ny données rehetra ao amin'ity appareil ity?")) {
          state = clone(defaults); saveState(); updateDashboard(); renderReviews();
          toast("Voafafa ny données.", "warning");
        }
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  /* ---------- Supabase (aorian'ny load, satria defer ny script) ---------- */
  function initSupabase() {
    try {
      if (window.supabase && typeof window.supabase.createClient === "function")
        sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    } catch (e) { console.warn("Supabase tsy misy:", e); sb = null; }
  }

  /* ---------- Init ---------- */
  function init() {
    initTools();
    initGlobalClicks();
    initEvaluation();
    initReviews();
    renderReviews();
    updateDashboard();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("load", initSupabase);
})();
