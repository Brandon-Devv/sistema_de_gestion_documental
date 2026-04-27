/**
 * Estado local (localStorage) — simula API / backend
 * OE1 análisis, OE2 configuración, OE3 repositorio
 */
const STORAGE_KEY = "gdm_app_v1";
/** Migración: datos guardados con la clave anterior del prototipo */
const LEGACY_STORAGE_KEY = "envelope_app_v1";

function nowIso() {
  return new Date().toISOString();
}
function formatEsShort(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const SEED = {
  session: { userName: "Analista documental", role: "admin" },
  tiposDocumental: [
    { id: "t1", nombre: "Contrato / proveedor", exts: [".pdf", ".docx"], campos: ["asunto", "monto", "area"] },
    { id: "t2", nombre: "Orden de compra", exts: [".pdf", ".xlsx", ".xls"], campos: ["asunto", "monto", "area", "referencia"] },
    { id: "t3", nombre: "Reporte operativo", exts: [".pdf", ".xlsx", ".xls", ".png"], campos: ["asunto", "area"] }
  ],
  flujosAprobacion: [
    {
      id: "f1",
      tipoId: "t1",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor", responsable: "Ana Vivas" },
        { orden: 2, rol: "Aprobador", responsable: "María Gómez" }
      ]
    },
    {
      id: "f2",
      tipoId: "t2",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor", responsable: "Juan Díaz" }
      ]
    }
  ],
  matrizPermisos: [
    { rol: "Solicitante", cargar: true, consultar: true, revisar: false, aprobar: false, config: false, reportes: true },
    { rol: "Revisor", cargar: true, consultar: true, revisar: true, aprobar: false, config: false, reportes: true },
    { rol: "Aprobador", cargar: true, consultar: true, revisar: true, aprobar: true, config: false, reportes: true },
    { rol: "Consultor", cargar: false, consultar: true, revisar: false, aprobar: false, config: false, reportes: true },
    { rol: "Admin", cargar: true, consultar: true, revisar: true, aprobar: true, config: true, reportes: true }
  ],
  documentos: [
    {
      id: 1,
      referencia: "DOC-2026-001",
      nombre: "Contrato proveedor",
      tipoId: "t1",
      area: "Compras",
      responsable: "Ana Vivas",
      estado: "En revisión",
      diasEnEstado: 3,
      asunto: "Mantenimiento 2026",
      monto: 125000000,
      fileName: "contrato_prov_mtto.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-10T12:00:00.000Z", usuario: "Luis Mora", nota: "Carga inicial" }],
      trazabilidad: [
        { fecha: "2026-04-10T12:00:00.000Z", usuario: "Luis Mora", accion: "Carga y registro", obs: "Documento ingresado al flujo" },
        { fecha: "2026-04-11T15:00:00.000Z", usuario: "Sistema", accion: "Paso a revisión", obs: "Asignado a Ana Vivas" }
      ]
    },
    {
      id: 2,
      referencia: "DOC-2026-014",
      nombre: "Factura proyecto A",
      tipoId: "t2",
      area: "Finanzas",
      responsable: "Carlos Castellanos",
      estado: "Aprobado",
      diasEnEstado: 1,
      asunto: "Facturación fase 1",
      monto: 45000000,
      fileName: "factura_proyA.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-20T09:15:00.000Z", usuario: "Carlos Castellanos", nota: "Recepción" }],
      trazabilidad: [
        { fecha: "2026-04-20T09:15:00.000Z", usuario: "Carlos Castellanos", accion: "Revisión contable", obs: "Conforme" },
        { fecha: "2026-04-22T16:30:00.000Z", usuario: "María Gómez", accion: "Aprobado", obs: "Pago autorizado" }
      ]
    },
    {
      id: 3,
      referencia: "OC-2026-103",
      nombre: "Solicitud de compra",
      tipoId: "t2",
      area: "Compras",
      responsable: "Juan Díaz",
      estado: "Pendiente",
      diasEnEstado: 5,
      asunto: "Suministros Q2",
      monto: 8900000,
      fileName: "sol_compra_103.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-18T11:00:00.000Z", usuario: "Juan Díaz", nota: "Carga" }],
      trazabilidad: [
        { fecha: "2026-04-18T11:00:00.000Z", usuario: "Juan Díaz", accion: "Solicitud creada", obs: "En espera de aprobación de jefe de área" }
      ]
    }
  ],
  notificaciones: [
    { id: 1, fecha: "2026-04-22T16:35:00.000Z", texto: "Factura proyecto A fue aprobada por María Gómez", leida: true },
    { id: 2, fecha: "2026-04-23T08:00:00.000Z", texto: "Solicitud de compra (OC-2026-103) requiere su aprobación", leida: false }
  ],
  logConfig: [
    { fecha: "2026-04-01T10:00:00.000Z", usuario: "Admin", accion: "Carga de políticas base", detalle: "Tipos y flujos iniciales" }
  ],
  nextDocId: 4,
  nextNotifId: 3
};

const GestionDoc = {
  load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          localStorage.setItem(STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          raw = legacy;
        }
      }
      if (!raw) {
        this.save(structuredClone ? structuredClone(SEED) : JSON.parse(JSON.stringify(SEED)));
        return this.load();
      }
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      this.save(structuredClone ? structuredClone(SEED) : JSON.parse(JSON.stringify(SEED)));
      return this.load();
    }
  },

  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /** Documentos con campo historial = traz (para OE1 modal) */
  getDocumentosAnalisis() {
    const d = this.load();
    return d.documentos.map((doc) => ({
      ...doc,
      historial: (doc.trazabilidad || []).map((e) => ({
        fecha: formatEsShort(e.fecha),
        accion: e.accion,
        usuario: e.usuario,
        obs: e.obs || ""
      }))
    }));
  },

  getState() {
    return this.load();
  },

  setSession(patch) {
    const d = this.load();
    d.session = { ...d.session, ...patch };
    this.save(d);
  },

  isAdmin() {
    return this.load().session.role === "admin";
  },

  pushTrazabilidad(docId, entry) {
    const d = this.load();
    const doc = d.documentos.find((x) => x.id === docId);
    if (!doc) return;
    if (!doc.trazabilidad) doc.trazabilidad = [];
    doc.trazabilidad.push({ fecha: nowIso(), ...entry });
    this.save(d);
  },

  addNotificacion(texto) {
    const d = this.load();
    d.notificaciones.unshift({
      id: d.nextNotifId++,
      fecha: nowIso(),
      texto,
      leida: false
    });
    this.save(d);
  },

  validateFlujo(flujo) {
    if (!flujo.niveles || !flujo.niveles.length) return { ok: false, msg: "Debe existir al menos un nivel de aprobación." };
    for (const n of flujo.niveles) {
      if (!n.responsable || !String(n.responsable).trim()) {
        return { ok: false, msg: "Cada nivel debe tener un responsable (integridad de configuración)." };
      }
    }
    return { ok: true };
  },

  upsertFlujo(flujo) {
    const d = this.load();
    const v = this.validateFlujo(flujo);
    if (!v.ok) return v;
    const i = d.flujosAprobacion.findIndex((f) => f.id === flujo.id);
    if (i >= 0) d.flujosAprobacion[i] = flujo;
    else d.flujosAprobacion.push(flujo);
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Guardar flujo", detalle: flujo.tipoId });
    this.save(d);
    return { ok: true };
  },

  addTipo(tipo) {
    const d = this.load();
    if (!tipo.nombre || !tipo.nombre.trim()) return { ok: false, msg: "El nombre del tipo es obligatorio." };
    tipo.id = "t" + (Date.now() + "").slice(-8);
    tipo.exts = (tipo.exts || []).map((e) => (e.startsWith(".") ? e : "." + e));
    d.tiposDocumental.push(tipo);
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Alta tipo documental", detalle: tipo.nombre });
    this.save(d);
    return { ok: true, tipo };
  },

  addDocumento(meta) {
    const d = this.load();
    if (d.documentos.some((x) => x.referencia === meta.referencia)) {
      return { ok: false, code: "AF-04", msg: "Posible documento duplicado: la referencia ya existe." };
    }
    const id = d.nextDocId++;
    const doc = {
      id,
      ...meta,
      versionActual: 1,
      versiones: [{ n: 1, fecha: nowIso(), usuario: d.session.userName, nota: "Carga inicial" }],
      trazabilidad: [
        {
          fecha: nowIso(),
          usuario: d.session.userName,
          accion: "Carga y registro",
          obs: "Validación de metadatos y formato"
        }
      ]
    };
    d.documentos.push(doc);
    this.save(d);
    this.addNotificacion("Nuevo documento registrado: " + doc.nombre + " (" + doc.referencia + ")");
    return { ok: true, id };
  },

  nuevaVersion(docId, nota) {
    const d = this.load();
    const doc = d.documentos.find((x) => x.id === docId);
    if (!doc) return { ok: false, msg: "Documento no encontrado." };
    doc.versionActual = (doc.versionActual || 1) + 1;
    if (!doc.versiones) doc.versiones = [];
    doc.versiones.push({ n: doc.versionActual, fecha: nowIso(), usuario: d.session.userName, nota: nota || "Nueva versión" });
    if (!doc.trazabilidad) doc.trazabilidad = [];
    doc.trazabilidad.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Nueva versión", obs: nota || "—" });
    this.save(d);
    this.addNotificacion("Nueva versión v" + doc.versionActual + " de " + doc.nombre);
    return { ok: true };
  },

  setDocEstado(docId, estado, accion, obs) {
    const d = this.load();
    const doc = d.documentos.find((x) => x.id === docId);
    if (!doc) return { ok: false, msg: "Documento no encontrado." };
    doc.estado = estado;
    if (!doc.trazabilidad) doc.trazabilidad = [];
    doc.trazabilidad.push({ fecha: nowIso(), usuario: d.session.userName, accion, obs: obs || "" });
    this.save(d);
    this.addNotificacion(accion + ": " + doc.nombre + " — " + estado);
    return { ok: true };
  },

  updateMatrizPermisos(rows) {
    const d = this.load();
    d.matrizPermisos = rows;
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Matriz de permisos", detalle: "Actualización" });
    this.save(d);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GestionDoc, nowIso, formatEsShort, SEED };
}
