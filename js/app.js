/* Módulos OE1, OE2, OE3 */
(function () {
  "use strict";

  const ROUTES = ["home", "analisis", "config", "repositorio"];

  let documentos = [];
  let filterText = "";
  let filterEstado = "";
  let selectedAnalId = null;
  let selectedRepoId = null;
  let fileDraft = null;

  function showToast(msg, isErr) {
    const t = document.getElementById("globalToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    t.style.background = isErr ? "#7f1d1d" : "#0f172a";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.classList.remove("show"); }, 3000);
  }

  function formatTiempoDoc(doc) {
    const d = doc.diasEnEstado;
    if (d == null || d === undefined) return "—";
    if (d < 1) {
      const h = Math.max(1, Math.round((doc.diasEnEstado || 0) * 24));
      return h + (h === 1 ? " hora" : " horas");
    }
    return d + (d === 1 ? " día" : " días");
  }

  function isBottleneck(doc) {
    if (doc.estado === "En revisión" && doc.diasEnEstado > 2) return true;
    if (doc.estado === "Pendiente" && doc.diasEnEstado > 3) return true;
    return false;
  }

  function getBadgeEstado(estado) {
    let clase = "";
    if (estado === "En revisión") clase = "badge-enrevision";
    else if (estado === "Aprobado") clase = "badge-aprobado";
    else if (estado === "Pendiente") clase = "badge-pendiente";
    else if (estado === "Firmado") clase = "badge-firmado";
    else if (estado === "Rechazado") clase = "badge-rechazado";
    return "<span class=\"badge " + clase + "\"><i class=\"fas fa-file-alt\"></i> " + escapeHtml(estado) + "</span>";
  }

  function getRoute() {
    const raw = (location.hash || "#home").replace("#", "").toLowerCase();
    if (!raw || raw === "home") {
      return "home";
    }
    const head = raw.split("/")[0];
    if (head === "mockups") {
      if (location.hash !== "#home") {
        history.replaceState(null, document.title, location.pathname + location.search + "#home");
      }
      return "home";
    }
    return ROUTES.includes(head) ? head : "home";
  }

  function showView(name) {
    if (!ROUTES.includes(name)) name = "home";
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === name);
    });
    if (name === "analisis") renderAnalisis();
    if (name === "config") renderConfig();
    if (name === "repositorio") renderRepositorio();
    if (name === "home") renderHome();
  }

  function applyFilters() {
    const q = (filterText || "").trim().toLowerCase();
    const st = filterEstado || "";
    return documentos.filter(function (d) {
      const nameOk = !q || (d.nombre && d.nombre.toLowerCase().includes(q));
      const stOk = !st || d.estado === st;
      return nameOk && stOk;
    });
  }

  function stateChartBars(list) {
    const counts = {};
    list.forEach(function (d) { counts[d.estado] = (counts[d.estado] || 0) + 1; });
    const max = Math.max(1, list.length);
    const keys = Object.keys(counts);
    if (!keys.length) {
      return "<p class='subtitle'>Sin documentos en esta vista</p>";
    }
    return keys.map(function (k) {
      const w = (counts[k] / max) * 100;
      return (
        "<div class='c-bar'><span style='min-width:7rem;font-size:0.75rem'>" + escapeHtml(k) + "</span>" +
        "<div class='track'><div class='fill' style='width:" + w + "%'></div></div>" +
        "<span style='min-width:2rem;font-size:0.75rem'>" + counts[k] + "</span></div>"
      );
    }).join("");
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAnalisis() {
    documentos = GestionDoc.getDocumentosAnalisis();
    const tbody = document.getElementById("tableBody");
    const kpiBox = document.getElementById("kpiContainer");
    const toShow = applyFilters();
    if (!toShow.length) {
      const noDataAtAll = !documentos.length;
      tbody.innerHTML =
        "<div class='list-mock-empty' role='status'>" +
        (noDataAtAll
          ? "<i class='fas fa-folder-open'></i> No existen documentos. Use <b>Registros</b> para cargar."
          : "<i class='fas fa-filter'></i> Ningún documento coincide con el filtro.") +
        "</div>";
      if (kpiBox) {
        kpiBox.innerHTML = "<div class='kpi-card'><div class='kpi-title'>Sin datos en vista</div><div class='kpi-value'>—</div></div>";
      }
      document.getElementById("viewFlowBtn").disabled = true;
      document.getElementById("selectedInfo").innerHTML = "<i class='fas fa-info-circle'></i> " + (noDataAtAll ? "Sin documentos" : "Ajuste filtros");
      const emptyChart = document.getElementById("estadoChart");
      if (emptyChart) emptyChart.innerHTML = "";
      return;
    }
    const enriched = toShow.map(function (d) { return d; });
    const totalDocs = enriched.length;
    const aprob = enriched.filter(function (d) { return d.estado === "Aprobado" || d.estado === "Firmado"; });
    const sumD = aprob.reduce(function (s, d) { return s + (d.diasEnEstado || 0); }, 0);
    const prom = aprob.length ? (sumD / aprob.length).toFixed(1) : "—";
    const bCount = enriched.filter(function (d) { return isBottleneck(d); }).length;
    const pctB = totalDocs ? ((bCount / totalDocs) * 100).toFixed(0) : 0;
    if (kpiBox) {
      kpiBox.innerHTML =
        "<div class='kpi-card'><div class='kpi-title'><i class='fas fa-file-alt'></i> Total (vista)</div><div class='kpi-value'>" +
        totalDocs + "</div><div class='kpi-sub'>Documentos en el análisis</div></div>" +
        "<div class='kpi-card'><div class='kpi-title'><i class='fas fa-hourglass-half'></i> Promedio aprob./firm.</div><div class='kpi-value'>" + prom + " <span style='font-size:0.9rem'>d</span></div><div class='kpi-sub'>Días en etapa (datos de ejemplo)</div></div>" +
        "<div class='kpi-card'><div class='kpi-title'><i class='fas fa-triangle-exclamation'></i> Cuellos de botella</div><div class='kpi-value'>" + bCount + " <span style='font-size:0.9rem'>/ " + totalDocs + "</span></div><div class='kpi-sub'>" + pctB + "% con retraso vs. umbral OE1</div></div>";
    }
    var ex = document.getElementById("estadoChart");
    if (ex) ex.innerHTML = "<h3>Distribución por estado (vista actual)</h3>" + stateChartBars(enriched);
    tbody.innerHTML = "";
    enriched.forEach(function (doc) {
      const b = isBottleneck(doc);
      const row = document.createElement("div");
      row.setAttribute("role", "listitem");
      row.className =
        "list-mock-row selectable-row" +
        (b ? " bottleneck-row" : "") +
        (selectedAnalId === doc.id ? " row-selected" : "");
      row.innerHTML =
        "<span class='l-dot' aria-hidden='true'></span><div class='l-cells'>" +
        "<span class='l-cell l-doc-name'>" +
        "<strong class='l-doc-tit'>" +
        escapeHtml(doc.nombre) +
        "</strong> " +
        (b ? "<i class='fas fa-exclamation-circle warning-icon' title='Cuello de botella'></i> " : "") +
        "<span class='l-subline'>" + escapeHtml(doc.referencia || "—") + "</span></span>" +
        "<span class='l-pipe' aria-hidden='true'>|</span>" +
        "<span class='l-cell l-area'>" + escapeHtml(doc.area || "—") + "</span>" +
        "<span class='l-pipe' aria-hidden='true'>|</span>" +
        "<span class='l-cell l-resp'>" + escapeHtml(doc.responsable || "—") + "</span>" +
        "<span class='l-pipe' aria-hidden='true'>|</span>" +
        "<span class='l-cell l-estado'>" + getBadgeEstado(doc.estado) + "</span>" +
        "<span class='l-pipe' aria-hidden='true'>|</span>" +
        "<span class='l-cell l-tiempo'>" + formatTiempoDoc(doc) + "</span>" +
        "</div>";
      row.addEventListener("click", function (e) {
        e.stopPropagation();
        selectedAnalId = selectedAnalId === doc.id ? null : doc.id;
        renderAnalisis();
      });
      tbody.appendChild(row);
    });
    const sel = toShow.find(function (d) { return d.id === selectedAnalId; });
    if (selectedAnalId && !sel) selectedAnalId = null;
    const s2 = toShow.find(function (d) { return d.id === selectedAnalId; });
    document.getElementById("viewFlowBtn").disabled = !s2;
    document.getElementById("selectedInfo").innerHTML = s2
      ? "<i class='fas fa-check-circle'></i> " + escapeHtml(s2.nombre) + " · " + escapeHtml(s2.responsable || "—")
      : "<i class='fas fa-info-circle'></i> Ningún documento seleccionado. Seleccione fila y use <b>Ver flujo</b>.";
  }

  function openFlowModal() {
    const list = applyFilters();
    const doc = list.find(function (d) { return d.id === selectedAnalId; });
    if (!doc) return;
    const modal = document.getElementById("flowModal");
    document.getElementById("modalDocName").textContent = doc.nombre;
    const t = document.getElementById("timelineContent");
    t.innerHTML = "";
    (doc.historial || []).forEach(function (ev) {
      const div = document.createElement("div");
      div.className = "timeline-item";
      div.innerHTML = "<div class='timeline-icon'><i class='fas fa-user-check'></i></div><div><div class='timeline-date'>" + escapeHtml(ev.fecha) + "</div><div class='timeline-action'>" + escapeHtml(ev.accion) + " · " + escapeHtml(ev.usuario) + "</div><div class='subtitle'>" + escapeHtml(ev.obs) + "</div></div>";
      t.appendChild(div);
    });
    if (!(doc.historial && doc.historial.length)) {
      t.innerHTML = "<div class='empty-message'><i class='far fa-clock'></i> Sin eventos de trazabilidad.</div>";
    }
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
  function closeFlowModal() {
    document.getElementById("flowModal").classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  function exportCsv() {
    const toExport = applyFilters();
    if (!toExport.length) {
      showToast("Nada que exportar con el filtro actual", true);
      return;
    }
    const rows = [
      ["Documento", "Referencia", "Responsable", "Área", "Estado", "Tiempo en etapa", "Cuello de botella"]
    ];
    toExport.forEach(function (d) {
      rows.push([d.nombre, d.referencia || "—", d.responsable || "—", d.area || "—", d.estado, formatTiempoDoc(d), isBottleneck(d) ? "Sí" : "No"]);
    });
    const csv = rows
      .map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); })
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reporte_flujo_documental.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Reporte CSV generado (HU4 / requisito informes)");
  }

  var configTab = "tipos";
  function renderConfig() {
    const d = GestionDoc.load();
    const isAd = d.session.role === "admin";
    document.querySelectorAll(".admin-only").forEach(function (e) { e.classList.toggle("hidden", !isAd); });
    var wMsg = document.getElementById("configWarn");
    if (wMsg) wMsg.style.display = isAd ? "none" : "block";
    document.getElementById("paneTipos").classList.toggle("show", configTab === "tipos");
    document.getElementById("paneFlujos").classList.toggle("show", configTab === "flujos");
    document.getElementById("panePerms").classList.toggle("show", configTab === "perms");
    document.getElementById("tabtipos").classList.toggle("active", configTab === "tipos");
    document.getElementById("tabflujos").classList.toggle("active", configTab === "flujos");
    document.getElementById("tabperms").classList.toggle("active", configTab === "perms");

    var tipBody = document.getElementById("tablaTipos");
    if (tipBody) {
      tipBody.innerHTML = d.tiposDocumental
        .map(function (t) {
          return (
            "<div class='list-mock-row list-mock-row--static' role='listitem'>" +
            "<span class='l-dot' aria-hidden='true'></span><div class='l-cells l-cells--3'>" +
            "<span class='l-cell l-tipo-nombre'>" + escapeHtml(t.nombre) + "</span>" +
            "<span class='l-pipe' aria-hidden='true'>|</span>" +
            "<span class='l-cell l-exts'>" + (t.exts || []).map(escapeHtml).join(" ") + "</span>" +
            "<span class='l-pipe' aria-hidden='true'>|</span>" +
            "<span class='l-cell l-meta'>" + (t.campos || []).map(escapeHtml).join(", ") + "</span>" +
            "</div></div>"
          );
        })
        .join("");
    }
    var fBody = document.getElementById("listaFlujos");
    if (fBody) {
      fBody.innerHTML = d.flujosAprobacion
        .map(function (f) {
          var tnom = (d.tiposDocumental.find(function (x) { return x.id === f.tipoId; }) || {}).nombre || f.tipoId;
          return (
            "<div class='detail-box' style='margin:0.5rem 0'> <h3>" + escapeHtml(tnom) + " <small style='color:#94a3b8'>(" + escapeHtml(f.modo) + ")</small></h3> " +
            f.niveles
              .map(function (n) { return "<div class='detail-row'><span>Orden " + n.orden + "</span><span>" + escapeHtml(n.rol) + " → " + escapeHtml(n.responsable) + "</span></div>"; })
              .join("") + "</div>"
          );
        })
        .join("");
    }
    var pBody = document.getElementById("tablaMatriz");
    if (pBody) {
      pBody.innerHTML = d.matrizPermisos
        .map(function (m) { return buildMatrizRow(m); })
        .join("");
    }
    var au = document.getElementById("configAudit");
    if (au) {
      au.innerHTML = d.logConfig
        .slice()
        .reverse()
        .slice(0, 8)
        .map(function (l) { return "<div>" + formatEsFor(l.fecha) + " — <b>" + escapeHtml(l.usuario) + "</b> " + escapeHtml(l.accion) + (l.detalle ? " · " + escapeHtml(l.detalle) : "") + "</div>"; })
        .join("");
    }
  }

  function formatEsFor(iso) {
    try { return new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }); } catch (e) { return iso; }
  }

  function detRow(k, v) {
    return "<div class='detail-row'><span>" + escapeHtml(k) + "</span><span>" + escapeHtml(String(v == null || v === "" ? "—" : v)) + "</span></div>";
  }

  function buildMatrizRow(m) {
    return (
      "<tr data-rol='" + escapeHtml(m.rol) + "'><td><strong>" + escapeHtml(m.rol) + "</strong></td>" +
      matCell(m, "cargar") + matCell(m, "consultar") + matCell(m, "revisar") + matCell(m, "aprobar") + matCell(m, "config") + matCell(m, "reportes") + "</tr>"
    );
  }
  function matCell(m, k) {
    return "<td style='text-align:center'><input type='checkbox' data-mkey='" + k + "' " + (m[k] ? " checked" : "") + " " + (GestionDoc.isAdmin() ? "" : "disabled") + " /></td>";
  }

  function saveMatriz() {
    const d = GestionDoc.load();
    const newRows = [];
    document.querySelectorAll("#tablaMatriz tr[data-rol]").forEach(function (tr) {
      const r = { rol: tr.getAttribute("data-rol") };
      tr.querySelectorAll("input[type=checkbox]").forEach(function (c) { r[c.getAttribute("data-mkey")] = c.checked; });
      newRows.push(r);
    });
    GestionDoc.updateMatrizPermisos(newRows);
    showToast("Matriz de permisos guardada");
    renderConfig();
  }

  function addTipo() {
    const nombre = (document.getElementById("newTipoNombre") || {}).value;
    const exts = (document.getElementById("newTipoExts") || {}).value;
    if (!nombre || !nombre.trim()) { showToast("Indique el nombre del tipo (AF-03)", true); return; }
    const arr = (exts || "")
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(function (e) { return e.startsWith(".") ? e : "." + e; });
    const t = { nombre: nombre.trim(), exts: arr, campos: ["asunto", "area", "monto", "referencia"] };
    var r = GestionDoc.addTipo(t);
    if (r.ok) { showToast("Tipo documental creado"); (document.getElementById("newTipoNombre") || {}).value = ""; (document.getElementById("newTipoExts") || {}).value = ".pdf"; renderConfig(); } else { showToast(r.msg, true); }
  }

  function getTipoById(tid) {
    const d = GestionDoc.load();
    return d.tiposDocumental.find(function (t) { return t.id === tid; });
  }

  var repoFiltro = { q: "", estado: "" };
  function renderRepositorio() {
    const d = GestionDoc.load();
    var list = d.documentos.filter(function (doc) {
      var m = !repoFiltro.q || (doc.nombre + " " + (doc.referencia || "")).toLowerCase().indexOf(repoFiltro.q.toLowerCase()) >= 0;
      var e = !repoFiltro.estado || doc.estado === repoFiltro.estado;
      return m && e;
    });
    const grid = document.getElementById("repoGrid");
    if (!list.length) {
      grid.innerHTML = "<div class='list-mock-empty' role='status'>No hay resultados. Ajuste filtros o <b>Nuevo documento</b>.</div>";
    } else {
      grid.innerHTML = list
        .map(function (x) {
          const sel = selectedRepoId === x.id ? " row-selected" : "";
          return (
            "<button type='button' class='list-mock-row list-mock-row--btn" + sel + "' data-did='" + x.id + "'>" +
            "<span class='l-dot' aria-hidden='true'></span><div class='l-cells l-cells--repo'>" +
            "<span class='l-cell l-doc-name'><strong class='l-doc-tit'>" + escapeHtml(x.nombre) + "</strong>" +
            "<span class='l-subline'>v" + (x.versionActual || 1) + " · " + escapeHtml(x.fileName || "—") + "</span></span>" +
            "<span class='l-pipe' aria-hidden='true'>|</span>" +
            "<span class='l-cell l-repo-ref'>" + escapeHtml(x.referencia || "—") + " · " + escapeHtml((getTipoById(x.tipoId) || {}).nombre || "") + "</span>" +
            "<span class='l-pipe' aria-hidden='true'>|</span>" +
            "<span class='l-cell l-estado'>" + getBadgeEstado(x.estado) + "</span>" +
            "<span class='l-pipe' aria-hidden='true'>|</span>" +
            "<span class='l-cell l-ver'>v" + (x.versionActual || 1) + "</span>" +
            "</div></button>"
          );
        })
        .join("");
      grid.querySelectorAll(".list-mock-row--btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectedRepoId = parseInt(btn.getAttribute("data-did"), 10);
          renderRepositorio();
        });
      });
    }
    if (selectedRepoId) showRepoDetail();
  }

  function showRepoDetail() {
    const d = GestionDoc.load();
    const doc = d.documentos.find(function (x) { return x.id === selectedRepoId; });
    const box = document.getElementById("repoDetail");
    if (!doc) {
      box.innerHTML = "<p class='subtitle'>Seleccione un registro en la lista de la izquierda.</p>";
      return;
    }
    const tipo = getTipoById(doc.tipoId);
    const can = d.session.role === "admin" || d.session.role === "aprobador" || d.session.userName; /* flujo: simplificado */
    var acciones = "";
    if (doc.estado === "Pendiente" || doc.estado === "En revisión") {
      if (d.session.role === "admin" || d.session.role === "aprobador" || d.session.role === "usuario") {
        acciones += "<div class='pend-box'><b>Revisión / aprobación</b><br> <input id='revObs' placeholder='Observaciones' style='width:100%;padding:0.35rem;margin:0.3rem 0;border-radius:6px;border:1px solid #ccc'/> " +
          "<div style='display:flex;gap:0.4rem;flex-wrap:wrap;'> " +
          "<button type='button' class='btn btn-primary btn-sm' id='btnAprobar'><i class='fas fa-check'></i> Aprobar</button> " +
          "<button type='button' class='btn btn-danger btn-sm' id='btnRechaz'><i class='fas fa-xmark'></i> Rechazar</button> " +
          "</div></div>";
      }
    }
    if (doc.estado === "Aprobado") {
      acciones += "<p><button type='button' class='btn btn-primary' id='btnFirmar'><i class='fas fa-signature'></i> Registrar firma electrónica (HU1)</button> <span class='subtitle'>(DEMO: marca de tiempo y estado Firmado)</span></p>";
    }
    acciones += "<p class='admin-only" + (GestionDoc.isAdmin() ? "" : " hidden") + "'><button type='button' class='btn btn-outline btn-sm' id='btnNuevaV'><i class='fas fa-code-branch'></i> Registrar nueva versión (metadatos)</button></p>";

    box.innerHTML =
      "<h3>" + escapeHtml(doc.nombre) + " <span class='badge'>" + escapeHtml(doc.referencia || "") + "</span></h3> " +
      "<div class='detail-box'><h3>Metadatos</h3> " +
      detRow("Tipo", (tipo && tipo.nombre) || "—") + detRow("Área", doc.area) + detRow("Responsable", doc.responsable) + detRow("Asunto", doc.asunto) + detRow("Monto", doc.monto) + detRow("Archivo", doc.fileName) + "</div> " +
      "<div class='detail-box' style='margin-top:0.5rem'> <h3>Versiones</h3> <ul class='ver-list'>" + (doc.versiones || [])
        .map(function (v) { return "<li>v" + v.n + " — " + formatEsFor(v.fecha) + " — " + escapeHtml(v.usuario) + (v.nota ? " · " + escapeHtml(v.nota) : "") + "</li>"; })
        .join("") + "</ul></div> " +
      "<div class='detail-box' style='margin-top:0.5rem'> <h3>Trazabilidad (inmutable, auditoría OE3)</h3> <ul class='traz-list'> " + (doc.trazabilidad || [])
        .slice()
        .reverse()
        .map(function (t) { return "<li><b>" + formatEsFor(t.fecha) + "</b> " + escapeHtml(t.usuario) + " — " + escapeHtml(t.accion) + (t.obs ? " <em>" + escapeHtml(t.obs) + "</em>" : "") + "</li>"; })
        .join("") + "</ul></div> " + acciones;
    setTimeout(function () {
      var a = document.getElementById("btnAprobar");
      if (a) a.onclick = function () {
        const obs = (document.getElementById("revObs") || {}).value;
        GestionDoc.setDocEstado(doc.id, "Aprobado", "Aprobación de documento", obs);
        showToast("Aprobado (AF-07)"); showRepoDetail(); if (getRoute() === "analisis") documentos = GestionDoc.getDocumentosAnalisis();
        renderRepositorio();
      };
      var r = document.getElementById("btnRechaz");
      if (r) r.onclick = function () {
        const obs = (document.getElementById("revObs") || {}).value || "Sin motivo detallado";
        GestionDoc.setDocEstado(doc.id, "Rechazado", "Rechazo con observaciones", obs);
        showToast("Rechazado (AF-08)"); showRepoDetail(); if (getRoute() === "analisis") documentos = GestionDoc.getDocumentosAnalisis();
        renderRepositorio();
      };
      var f = document.getElementById("btnFirmar");
      if (f) f.onclick = function () {
        GestionDoc.setDocEstado(doc.id, "Firmado", "Firma electrónica aplicada (HU1)", "Marca de tiempo " + new Date().toISOString());
        showToast("Documento firmado y notificación enviada (simulada)");
        showRepoDetail(); if (getRoute() === "analisis") documentos = GestionDoc.getDocumentosAnalisis();
        renderRepositorio();
      };
      var n = document.getElementById("btnNuevaV");
      if (n) n.onclick = function () {
        var n2 = (prompt("Comentario de la nueva versión:", "Actualización de adjunto") || "");
        if (n2) {
          var x = GestionDoc.nuevaVersion(doc.id, n2);
          if (x.ok) { showToast("Nueva versión registrada"); showRepoDetail(); } else { showToast(x.msg, true); }
        }
      };
    }, 0);
  }

  function openUploadModal() {
    const d = GestionDoc.load();
    const sel = document.getElementById("upTipoId");
    sel.innerHTML = d.tiposDocumental.map(function (t) { return "<option value='" + t.id + "'>" + escapeHtml(t.nombre) + "</option>"; }).join("");
    (document.getElementById("upRef") || {}).value = "DOC-2026-" + Math.floor(200 + Math.random() * 700);
    var m = document.getElementById("upModal");
    if (m) m.classList.add("active");
    fileDraft = null;
  }
  function closeUpload() {
    var m = document.getElementById("upModal");
    if (m) m.classList.remove("active");
  }
  function submitUpload() {
    const d = GestionDoc.load();
    const tipo = getTipoById(document.getElementById("upTipoId").value);
    if (!tipo) { showToast("Tipo inválido", true); return; }
    const ref = (document.getElementById("upRef") || {}).value;
    if (!ref || !ref.trim()) { showToast("La referencia es obligatoria (integridad, AF-03)", true); return; }
    const monto = parseFloat((document.getElementById("upMonto") || {}).value) || 0;
    if (!monto) { showToast("Indique monto (validación de metadatos)", true); return; }
    if (!fileDraft) { showToast("Seleccione un archivo (extensión permitida)", true); return; }
    const ext = fileDraft.name.slice(fileDraft.name.lastIndexOf(".")).toLowerCase();
    if (tipo.exts && tipo.exts.length && tipo.exts.indexOf(ext) < 0) {
      showToast("Formato no permitido para " + tipo.nombre + " (AF-02). Use: " + tipo.exts.join(" "), true);
      return;
    }
    if (d.documentos.some(function (x) { return x.referencia === ref; })) {
      showToast("Posible duplicado por referencia (AF-04).", true);
      return;
    }
    const meta = {
      referencia: ref.trim(),
      nombre: (document.getElementById("upNombre") || {}).value || fileDraft.name,
      tipoId: tipo.id,
      area: (document.getElementById("upArea") || {}).value,
      responsable: d.session.userName,
      estado: "Pendiente",
      diasEnEstado: 1,
      asunto: (document.getElementById("upAsunto") || {}).value || "—",
      monto: monto,
      fileName: fileDraft.name
    };
    for (var i = 0; i < (tipo.campos || []).length; i++) {
      var c = tipo.campos[i];
      if (c === "area" && !meta.area) { showToast("Campo requerido: área (AF-03)", true); return; }
    }
    var r = GestionDoc.addDocumento(meta);
    if (r.ok) {
      showToast("Documento cargado (AF-01)");
      closeUpload();
      selectedRepoId = r.id;
      renderRepositorio();
      if (getRoute() === "analisis") { documentos = GestionDoc.getDocumentosAnalisis(); renderAnalisis(); }
    } else { showToast(r.msg, true); }
  }

  function renderHome() {
    const d = GestionDoc.load();
    const ul = document.getElementById("homeNotif");
    if (ul) {
      var unread = 0;
      d.notificaciones
        .slice(0, 5)
        .forEach(function (n) { if (!n.leida) unread++; });
      ul.innerHTML = d.notificaciones
        .slice(0, 6)
        .map(function (n) { return "<li> " + escapeHtml(n.texto) + " <span>" + formatEsFor(n.fecha) + "</span></li>"; })
        .join("");
    }
    var b = document.querySelector(".notif-dot");
    if (b) b.classList.toggle("show", (d.notificaciones || []).some(function (n) { return !n.leida; }));
  }

  function onHash() {
    showView(getRoute());
  }

  function init() {
    window.addEventListener("hashchange", onHash);
    onHash();
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var n = a.getAttribute("data-nav");
        if (n) location.hash = n;
      });
    });
    document.getElementById("welcome1").addEventListener("click", function () { location.hash = "analisis"; });
    document.getElementById("welcome2").addEventListener("click", function () { location.hash = "config"; });
    document.getElementById("welcome3").addEventListener("click", function () { location.hash = "repositorio"; });

    document.getElementById("searchInput").addEventListener("input", function () { filterText = this.value; renderAnalisis(); });
    document.getElementById("filterEstado").addEventListener("change", function () { filterEstado = this.value; renderAnalisis(); });
    document.getElementById("viewFlowBtn").addEventListener("click", openFlowModal);
    document.getElementById("closeModalBtn").addEventListener("click", closeFlowModal);
    document.getElementById("flowModal").addEventListener("click", function (e) { if (e.target.id === "flowModal") closeFlowModal(); });
    document.getElementById("exportReportBtn").addEventListener("click", exportCsv);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeFlowModal();
        closeUpload();
      }
    });

    var roleSel = document.getElementById("roleSelect");
    if (roleSel) {
      roleSel.addEventListener("change", function () {
        GestionDoc.setSession({ role: this.value });
        renderConfig();
        if (getRoute() === "repositorio") renderRepositorio();
        showToast("Rol: " + this.value);
      });
      roleSel.value = GestionDoc.load().session.role;
    }

    document.getElementById("tabtipos").addEventListener("click", function () { configTab = "tipos"; renderConfig(); });
    document.getElementById("tabflujos").addEventListener("click", function () { configTab = "flujos"; renderConfig(); });
    document.getElementById("tabperms").addEventListener("click", function () { configTab = "perms"; renderConfig(); });
    document.getElementById("addTipoBtn").addEventListener("click", addTipo);
    var saveM = document.getElementById("saveMatrizBtn");
    if (saveM) saveM.addEventListener("click", saveMatriz);
    var btnNew = document.getElementById("openUploadBtn");
    if (btnNew) btnNew.addEventListener("click", openUploadModal);
    var closeUp = document.getElementById("closeUpModal");
    if (closeUp) closeUp.addEventListener("click", closeUpload);
    var doUp = document.getElementById("submitUpload");
    if (doUp) doUp.addEventListener("click", submitUpload);
    var fInp = document.getElementById("upFile");
    if (fInp) fInp.addEventListener("change", function () { fileDraft = this.files && this.files[0] ? this.files[0] : null; });
    var dz = document.getElementById("dropBox");
    if (dz) {
      dz.addEventListener("click", function () { document.getElementById("upFile").click(); });
    }
    var mUp = document.getElementById("upModal");
    if (mUp) mUp.addEventListener("click", function (e) { if (e.target.id === "upModal") closeUpload(); });
    document.getElementById("repoSearch").addEventListener("input", function () { repoFiltro.q = this.value; renderRepositorio(); });
    document.getElementById("repoEstado").addEventListener("change", function () { repoFiltro.estado = this.value; renderRepositorio(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
