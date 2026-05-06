/**
 * Estado local (localStorage) — simula API / backend
 * OE1 análisis, OE2 configuración, OE3 repositorio
 */
const STORAGE_KEY = "gdm_app_v2";
/** Claves anteriores: se migran o se descartan al cargar el SEED v2 enriquecido. */
const LEGACY_STORAGE_KEYS = ["gdm_app_v1", "envelope_app_v1"];

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
  session: { userName: "Ana Vivas", role: "admin" },
  /**
   * OE2 — Tipos documentales con su política de archivos y metadatos
   * obligatorios. Estos campos se aplican como reglas de validación durante
   * la carga de documentos (motor del módulo OE3).
   */
  tiposDocumental: [
    { id: "t1", nombre: "Contrato / proveedor", exts: [".pdf", ".docx"], campos: ["asunto", "monto", "area"] },
    { id: "t2", nombre: "Orden de compra", exts: [".pdf", ".xlsx", ".xls"], campos: ["asunto", "monto", "area", "referencia"] },
    { id: "t3", nombre: "Reporte operativo", exts: [".pdf", ".xlsx", ".xls", ".png"], campos: ["asunto", "area"] },
    { id: "t4", nombre: "Factura", exts: [".pdf", ".xml"], campos: ["asunto", "monto", "area", "referencia"] },
    { id: "t5", nombre: "Política interna", exts: [".pdf", ".docx"], campos: ["asunto", "area"] },
    { id: "t6", nombre: "Acta de comité", exts: [".pdf", ".docx"], campos: ["asunto", "area"] },
    { id: "t7", nombre: "Anexo técnico", exts: [".pdf", ".docx", ".dwg"], campos: ["asunto", "area"] },
    { id: "t8", nombre: "Solicitud de viaje", exts: [".pdf", ".xlsx"], campos: ["asunto", "monto", "area"] }
  ],
  /**
   * OE2 — Flujos de aprobación: cada flujo vincula un tipo documental con
   * niveles secuenciales o paralelos y sus responsables. La verificación
   * de integridad impide guardar niveles sin responsable asignado.
   */
  flujosAprobacion: [
    {
      id: "f1",
      tipoId: "t1",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor jurídico", responsable: "Laura Moreno" },
        { orden: 2, rol: "Aprobador área", responsable: "María Gómez" },
        { orden: 3, rol: "Director", responsable: "Patricia Vargas" }
      ]
    },
    {
      id: "f2",
      tipoId: "t2",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor compras", responsable: "Juan Díaz" },
        { orden: 2, rol: "Aprobador", responsable: "Felipe Castro" }
      ]
    },
    {
      id: "f3",
      tipoId: "t3",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor operativo", responsable: "Diana Restrepo" },
        { orden: 2, rol: "Aprobador área", responsable: "Andrés Pineda" }
      ]
    },
    {
      id: "f4",
      tipoId: "t4",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor contable", responsable: "Carlos Castellanos" },
        { orden: 2, rol: "Aprobador finanzas", responsable: "María Gómez" },
        { orden: 3, rol: "Director financiero", responsable: "Patricia Vargas" }
      ]
    },
    {
      id: "f5",
      tipoId: "t5",
      modo: "paralelo",
      niveles: [
        { orden: 1, rol: "Aprobador legal", responsable: "Laura Moreno" },
        { orden: 1, rol: "Aprobador admin", responsable: "Felipe Castro" },
        { orden: 2, rol: "Director", responsable: "Patricia Vargas" }
      ]
    },
    {
      id: "f6",
      tipoId: "t6",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Aprobador comité", responsable: "Andrés Pineda" }
      ]
    },
    {
      id: "f7",
      tipoId: "t7",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Revisor técnico", responsable: "Diana Restrepo" },
        { orden: 2, rol: "Aprobador ingeniería", responsable: "Felipe Castro" }
      ]
    },
    {
      id: "f8",
      tipoId: "t8",
      modo: "secuencial",
      niveles: [
        { orden: 1, rol: "Aprobador jefe", responsable: "Andrés Pineda" }
      ]
    }
  ],
  /**
   * OE2 — Definición de roles con permiso resumido y nivel de aprobación.
   * Cada `id` debe coincidir con la opción del selector superior (Rol).
   */
  roles: [
    { id: "admin", nombre: "Administrador", permiso: "Acceso total", nivel: "Final" },
    { id: "aprobador", nombre: "Aprobador", permiso: "Revisar y aprobar", nivel: "Nivel 2" },
    { id: "analista", nombre: "Analista", permiso: "Crear y editar docs", nivel: "Nivel 2" },
    { id: "usuario", nombre: "Usuario", permiso: "Subir documentos", nivel: "Nivel 1" },
    { id: "consulta", nombre: "Solo consulta", permiso: "Solo lectura", nivel: "—" }
  ],
  /**
   * OE2 — Usuarios habilitados en el sistema.
   * Los usuarios inactivos no pueden iniciar sesión simulada (selector superior).
   */
  usuarios: [
    { id: "u1", nombre: "Ana Vivas", rolId: "admin", estado: "Activo" },
    { id: "u2", nombre: "Patricia Vargas", rolId: "admin", estado: "Activo" },
    { id: "u3", nombre: "María Gómez", rolId: "aprobador", estado: "Activo" },
    { id: "u4", nombre: "Felipe Castro", rolId: "aprobador", estado: "Activo" },
    { id: "u5", nombre: "Andrés Pineda", rolId: "aprobador", estado: "Activo" },
    { id: "u6", nombre: "Laura Moreno", rolId: "analista", estado: "Activo" },
    { id: "u7", nombre: "Diana Restrepo", rolId: "analista", estado: "Activo" },
    { id: "u8", nombre: "Luis Mora", rolId: "analista", estado: "Inactivo" },
    { id: "u9", nombre: "Carlos Castellanos", rolId: "usuario", estado: "Activo" },
    { id: "u10", nombre: "Camila Rojas", rolId: "usuario", estado: "Activo" },
    { id: "u11", nombre: "Juan Díaz", rolId: "usuario", estado: "Inactivo" },
    { id: "u12", nombre: "Roberto Silva", rolId: "consulta", estado: "Activo" }
  ],
  matrizPermisos: [
    { rol: "Usuario", cargar: true, consultar: true, revisar: false, aprobar: false, config: false, reportes: true },
    { rol: "Analista", cargar: true, consultar: true, revisar: true, aprobar: false, config: false, reportes: true },
    { rol: "Aprobador", cargar: true, consultar: true, revisar: true, aprobar: true, config: false, reportes: true },
    { rol: "Solo consulta", cargar: false, consultar: true, revisar: false, aprobar: false, config: false, reportes: true },
    { rol: "Administrador", cargar: true, consultar: true, revisar: true, aprobar: true, config: true, reportes: true }
  ],
  documentos: [
    {
      id: 1,
      referencia: "DOC-2026-001",
      nombre: "Contrato mantenimiento equipos",
      tipoId: "t1",
      area: "Compras",
      responsable: "Laura Moreno",
      estado: "En revisión",
      diasEnEstado: 3,
      asunto: "Mantenimiento 2026",
      monto: 125000000,
      fileName: "contrato_prov_mtto.pdf",
      versionActual: 2,
      versiones: [
        { n: 1, fecha: "2026-04-10T12:00:00.000Z", usuario: "Luis Mora", nota: "Carga inicial" },
        { n: 2, fecha: "2026-04-12T09:30:00.000Z", usuario: "Laura Moreno", nota: "Ajuste cláusula 4" }
      ],
      trazabilidad: [
        { fecha: "2026-04-10T12:00:00.000Z", usuario: "Luis Mora", accion: "Carga y registro", obs: "Documento ingresado al flujo" },
        { fecha: "2026-04-11T15:00:00.000Z", usuario: "Sistema", accion: "Paso a revisión", obs: "Asignado a Laura Moreno" },
        { fecha: "2026-04-12T09:30:00.000Z", usuario: "Laura Moreno", accion: "Nueva versión", obs: "Ajuste cláusula 4" }
      ]
    },
    {
      id: 2,
      referencia: "FAC-2026-014",
      nombre: "Factura proyecto Casanare A",
      tipoId: "t4",
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
      nombre: "Solicitud de compra suministros",
      tipoId: "t2",
      area: "Compras",
      responsable: "Camila Rojas",
      estado: "Pendiente",
      diasEnEstado: 5,
      asunto: "Suministros Q2",
      monto: 8900000,
      fileName: "sol_compra_103.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-18T11:00:00.000Z", usuario: "Camila Rojas", nota: "Carga" }],
      trazabilidad: [
        { fecha: "2026-04-18T11:00:00.000Z", usuario: "Camila Rojas", accion: "Solicitud creada", obs: "En espera de aprobación de jefe de área" }
      ]
    },
    {
      id: 4,
      referencia: "RPT-2026-027",
      nombre: "Reporte producción pozo Pirí",
      tipoId: "t3",
      area: "Operaciones",
      responsable: "Diana Restrepo",
      estado: "Firmado",
      diasEnEstado: 2,
      asunto: "Producción semana 16",
      monto: 0,
      fileName: "reporte_pozo_piri_w16.xlsx",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-19T08:00:00.000Z", usuario: "Diana Restrepo", nota: "Reporte semanal" }],
      trazabilidad: [
        { fecha: "2026-04-19T08:00:00.000Z", usuario: "Diana Restrepo", accion: "Carga y registro", obs: "Reporte semanal" },
        { fecha: "2026-04-19T15:20:00.000Z", usuario: "Andrés Pineda", accion: "Aprobado", obs: "Coherente con campo" },
        { fecha: "2026-04-20T10:00:00.000Z", usuario: "Patricia Vargas", accion: "Firma electrónica aplicada", obs: "Cierre operativo" }
      ]
    },
    {
      id: 5,
      referencia: "POL-2026-005",
      nombre: "Política de gestión documental v2",
      tipoId: "t5",
      area: "Jurídica",
      responsable: "Laura Moreno",
      estado: "En revisión",
      diasEnEstado: 4,
      asunto: "Actualización política gobierno doc.",
      monto: 0,
      fileName: "politica_gd_v2.docx",
      versionActual: 2,
      versiones: [
        { n: 1, fecha: "2026-04-15T10:00:00.000Z", usuario: "Laura Moreno", nota: "Borrador" },
        { n: 2, fecha: "2026-04-21T09:00:00.000Z", usuario: "Laura Moreno", nota: "Incorpora observaciones de auditoría" }
      ],
      trazabilidad: [
        { fecha: "2026-04-15T10:00:00.000Z", usuario: "Laura Moreno", accion: "Carga y registro", obs: "Borrador para discusión" },
        { fecha: "2026-04-21T09:00:00.000Z", usuario: "Laura Moreno", accion: "Nueva versión", obs: "Incorpora observaciones de auditoría" }
      ]
    },
    {
      id: 6,
      referencia: "ACT-2026-018",
      nombre: "Acta comité de inversiones abril",
      tipoId: "t6",
      area: "Dirección",
      responsable: "Andrés Pineda",
      estado: "Aprobado",
      diasEnEstado: 1,
      asunto: "Decisiones inversiones abril 2026",
      monto: 0,
      fileName: "acta_inversiones_abr_2026.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-25T17:00:00.000Z", usuario: "Andrés Pineda", nota: "Acta firmada por asistentes" }],
      trazabilidad: [
        { fecha: "2026-04-25T17:00:00.000Z", usuario: "Andrés Pineda", accion: "Carga y registro", obs: "Acta firmada por asistentes" },
        { fecha: "2026-04-26T08:30:00.000Z", usuario: "Patricia Vargas", accion: "Aprobado", obs: "Conforme" }
      ]
    },
    {
      id: 7,
      referencia: "ANX-2026-042",
      nombre: "Anexo técnico oleoducto Tauramena",
      tipoId: "t7",
      area: "Ingeniería",
      responsable: "Diana Restrepo",
      estado: "Pendiente",
      diasEnEstado: 6,
      asunto: "Especificaciones técnicas tramo 4",
      monto: 0,
      fileName: "anexo_tec_tauramena_tramo4.dwg",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-16T11:30:00.000Z", usuario: "Diana Restrepo", nota: "Diseño preliminar" }],
      trazabilidad: [
        { fecha: "2026-04-16T11:30:00.000Z", usuario: "Diana Restrepo", accion: "Carga y registro", obs: "Diseño preliminar" }
      ]
    },
    {
      id: 8,
      referencia: "VJE-2026-009",
      nombre: "Solicitud viaje supervisión Casanare",
      tipoId: "t8",
      area: "Operaciones",
      responsable: "Camila Rojas",
      estado: "Aprobado",
      diasEnEstado: 1,
      asunto: "Viaje supervisión 28-30 abril",
      monto: 3500000,
      fileName: "viaje_casanare_abr.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-22T09:00:00.000Z", usuario: "Camila Rojas", nota: "Solicitud" }],
      trazabilidad: [
        { fecha: "2026-04-22T09:00:00.000Z", usuario: "Camila Rojas", accion: "Solicitud creada", obs: "Viaje supervisión técnica" },
        { fecha: "2026-04-23T11:15:00.000Z", usuario: "Andrés Pineda", accion: "Aprobado", obs: "Presupuesto disponible" }
      ]
    },
    {
      id: 9,
      referencia: "FAC-2026-031",
      nombre: "Factura servicios geofísica",
      tipoId: "t4",
      area: "Finanzas",
      responsable: "Carlos Castellanos",
      estado: "Rechazado",
      diasEnEstado: 2,
      asunto: "Servicios sísmica Q1",
      monto: 87500000,
      fileName: "factura_geofisica_q1.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-21T14:00:00.000Z", usuario: "Carlos Castellanos", nota: "Recepción" }],
      trazabilidad: [
        { fecha: "2026-04-21T14:00:00.000Z", usuario: "Carlos Castellanos", accion: "Revisión contable", obs: "Inconsistencia entre orden y factura" },
        { fecha: "2026-04-22T10:00:00.000Z", usuario: "María Gómez", accion: "Rechazo con observaciones", obs: "Devolver al proveedor" }
      ]
    },
    {
      id: 10,
      referencia: "DOC-2026-022",
      nombre: "Contrato consultoría ambiental",
      tipoId: "t1",
      area: "HSE",
      responsable: "Laura Moreno",
      estado: "Pendiente",
      diasEnEstado: 4,
      asunto: "Estudios impacto ambiental 2026",
      monto: 65000000,
      fileName: "contrato_consult_ambiental.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-22T15:00:00.000Z", usuario: "Laura Moreno", nota: "Borrador con proveedor" }],
      trazabilidad: [
        { fecha: "2026-04-22T15:00:00.000Z", usuario: "Laura Moreno", accion: "Carga y registro", obs: "En espera de revisión jurídica" }
      ]
    },
    {
      id: 11,
      referencia: "OC-2026-118",
      nombre: "Orden compra repuestos turbina",
      tipoId: "t2",
      area: "Compras",
      responsable: "Felipe Castro",
      estado: "En revisión",
      diasEnEstado: 1,
      asunto: "Repuestos turbina T-3",
      monto: 22300000,
      fileName: "oc_118_repuestos_t3.xlsx",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-26T10:00:00.000Z", usuario: "Felipe Castro", nota: "Carga" }],
      trazabilidad: [
        { fecha: "2026-04-26T10:00:00.000Z", usuario: "Felipe Castro", accion: "Carga y registro", obs: "Orden urgente" }
      ]
    },
    {
      id: 12,
      referencia: "RPT-2026-031",
      nombre: "Reporte HSE incidentes abril",
      tipoId: "t3",
      area: "HSE",
      responsable: "Diana Restrepo",
      estado: "En revisión",
      diasEnEstado: 3,
      asunto: "Resumen incidentes mes abril",
      monto: 0,
      fileName: "hse_incidentes_abr.pdf",
      versionActual: 1,
      versiones: [{ n: 1, fecha: "2026-04-24T08:30:00.000Z", usuario: "Diana Restrepo", nota: "Reporte mensual" }],
      trazabilidad: [
        { fecha: "2026-04-24T08:30:00.000Z", usuario: "Diana Restrepo", accion: "Carga y registro", obs: "Reporte mensual HSE" },
        { fecha: "2026-04-24T16:00:00.000Z", usuario: "Sistema", accion: "Paso a revisión", obs: "Asignado a Andrés Pineda" }
      ]
    }
  ],
  notificaciones: [
    { id: 1, fecha: "2026-04-22T16:35:00.000Z", texto: "Factura proyecto Casanare A fue aprobada por María Gómez", leida: true },
    { id: 2, fecha: "2026-04-23T08:00:00.000Z", texto: "Solicitud de compra (OC-2026-103) requiere su aprobación", leida: false },
    { id: 3, fecha: "2026-04-23T11:15:00.000Z", texto: "Solicitud de viaje (VJE-2026-009) aprobada por Andrés Pineda", leida: false },
    { id: 4, fecha: "2026-04-24T08:30:00.000Z", texto: "Nuevo reporte HSE de incidentes cargado", leida: true },
    { id: 5, fecha: "2026-04-22T10:00:00.000Z", texto: "Factura servicios geofísica fue rechazada (FAC-2026-031)", leida: false },
    { id: 6, fecha: "2026-04-26T08:30:00.000Z", texto: "Acta comité de inversiones abril aprobada por Patricia Vargas", leida: true },
    { id: 7, fecha: "2026-04-26T10:05:00.000Z", texto: "Orden de compra OC-2026-118 ingresó al flujo de revisión", leida: false }
  ],
  logConfig: [
    { fecha: "2026-04-01T10:00:00.000Z", usuario: "Patricia Vargas", accion: "Carga de políticas base", detalle: "Tipos y flujos iniciales" },
    { fecha: "2026-04-02T09:15:00.000Z", usuario: "Patricia Vargas", accion: "Alta tipo documental", detalle: "Política interna" },
    { fecha: "2026-04-02T09:18:00.000Z", usuario: "Patricia Vargas", accion: "Alta tipo documental", detalle: "Acta de comité" },
    { fecha: "2026-04-03T14:20:00.000Z", usuario: "Ana Vivas", accion: "Guardar flujo", detalle: "Contrato / proveedor (3 niveles)" },
    { fecha: "2026-04-03T14:35:00.000Z", usuario: "Ana Vivas", accion: "Guardar flujo", detalle: "Factura (3 niveles)" },
    { fecha: "2026-04-05T11:00:00.000Z", usuario: "Ana Vivas", accion: "Matriz de permisos", detalle: "Actualización inicial" },
    { fecha: "2026-04-08T16:45:00.000Z", usuario: "Patricia Vargas", accion: "Alta de usuario", detalle: "Diana Restrepo" },
    { fecha: "2026-04-10T08:30:00.000Z", usuario: "Ana Vivas", accion: "Configuración de roles", detalle: "5 roles" },
    { fecha: "2026-04-15T10:10:00.000Z", usuario: "Patricia Vargas", accion: "Alta de usuario", detalle: "Roberto Silva (Solo consulta)" },
    { fecha: "2026-04-18T09:25:00.000Z", usuario: "Ana Vivas", accion: "Cambio de estado", detalle: "Juan Díaz → Inactivo" },
    { fecha: "2026-04-20T15:00:00.000Z", usuario: "Patricia Vargas", accion: "Alta tipo documental", detalle: "Anexo técnico" }
  ],
  nextDocId: 13,
  nextNotifId: 8
};

const GestionDoc = {
  load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Limpia claves antiguas para forzar la carga del SEED v2 enriquecido.
        LEGACY_STORAGE_KEYS.forEach(function (k) {
          try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
        });
        this.save(structuredClone ? structuredClone(SEED) : JSON.parse(JSON.stringify(SEED)));
        return this.load();
      }
      const parsed = JSON.parse(raw);
      // Migración suave: agrega claves nuevas (roles, usuarios) si faltan en
      // un estado guardado por una versión anterior del prototipo.
      let migrated = false;
      if (!parsed.roles || !parsed.roles.length) { parsed.roles = JSON.parse(JSON.stringify(SEED.roles)); migrated = true; }
      if (!parsed.usuarios || !parsed.usuarios.length) { parsed.usuarios = JSON.parse(JSON.stringify(SEED.usuarios)); migrated = true; }
      if (migrated) this.save(parsed);
      return parsed;
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
  },

  /** OE2 — Roles: edición de la fila (permiso resumido y nivel) */
  updateRoles(rows) {
    const d = this.load();
    if (!Array.isArray(rows) || !rows.length) {
      return { ok: false, msg: "Debe existir al menos un rol definido." };
    }
    for (const r of rows) {
      if (!r.nombre || !r.permiso || !r.nivel) {
        return { ok: false, msg: "Cada rol debe tener nombre, permiso y nivel de aprobación (integridad)." };
      }
    }
    d.roles = rows.map((r) => ({
      id: r.id || ("r" + (Date.now() + "").slice(-7) + Math.floor(Math.random() * 99)),
      nombre: r.nombre,
      permiso: r.permiso,
      nivel: r.nivel
    }));
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Configuración de roles", detalle: rows.length + " roles" });
    this.save(d);
    return { ok: true };
  },

  /** OE2 — Usuarios: alta / edición / cambio de estado */
  upsertUsuario(u) {
    const d = this.load();
    if (!u || !u.nombre || !u.nombre.trim()) return { ok: false, msg: "El nombre del usuario es obligatorio." };
    if (!u.rolId) return { ok: false, msg: "Debe seleccionar un rol válido." };
    const rolValido = (d.roles || []).some((r) => r.id === u.rolId);
    if (!rolValido) return { ok: false, msg: "El rol seleccionado no existe (integridad)." };
    if (u.id) {
      const i = d.usuarios.findIndex((x) => x.id === u.id);
      if (i < 0) return { ok: false, msg: "Usuario no encontrado." };
      d.usuarios[i] = { ...d.usuarios[i], ...u };
      d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Edición de usuario", detalle: u.nombre });
    } else {
      const nuevo = {
        id: "u" + (Date.now() + "").slice(-7),
        nombre: u.nombre.trim(),
        rolId: u.rolId,
        estado: u.estado || "Activo"
      };
      d.usuarios.push(nuevo);
      d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Alta de usuario", detalle: nuevo.nombre });
    }
    this.save(d);
    return { ok: true };
  },

  toggleUsuarioEstado(id) {
    const d = this.load();
    const u = d.usuarios.find((x) => x.id === id);
    if (!u) return { ok: false, msg: "Usuario no encontrado." };
    u.estado = u.estado === "Activo" ? "Inactivo" : "Activo";
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Cambio de estado", detalle: u.nombre + " → " + u.estado });
    this.save(d);
    return { ok: true, estado: u.estado };
  },

  deleteUsuario(id) {
    const d = this.load();
    const i = d.usuarios.findIndex((x) => x.id === id);
    if (i < 0) return { ok: false, msg: "Usuario no encontrado." };
    const nombre = d.usuarios[i].nombre;
    d.usuarios.splice(i, 1);
    d.logConfig.push({ fecha: nowIso(), usuario: d.session.userName, accion: "Eliminación de usuario", detalle: nombre });
    this.save(d);
    return { ok: true };
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GestionDoc, nowIso, formatEsShort, SEED };
}
