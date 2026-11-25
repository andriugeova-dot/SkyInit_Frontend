/** Utilidades compartidas por las pantallas nuevas (agenda, organizacion, seguimiento, mapa, etc.) */

const BASE = "/backend/api";

export function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Llama al backend por el proxy del mismo origen. Lanza Error con el mensaje del servidor. */
export async function api<T = any>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    credentials: "same-origin",
    headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (res.status === 401) {
    window.location.href = "/login?redirect=" + encodeURIComponent(location.pathname + location.search);
    throw new Error("Sesion expirada");
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error ?? datos.message ?? "No se pudo completar la operacion");
  return datos as T;
}

export function urlArchivo(ruta: string | null | undefined): string {
  if (!ruta) return "";
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return "/backend" + (ruta.startsWith("/") ? ruta : "/" + ruta);
}

export function fechaHora(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

/** Para fechas sin hora (DATE): evita el corrimiento de un dia por zona horaria */
export function fechaCorta(v: string | null | undefined): string {
  if (!v) return "—";
  const [a, m, d] = String(v).slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return "—";
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { dateStyle: "medium" });
}

export function vencida(fechaLimite: string | null | undefined, estado: string): boolean {
  if (!fechaLimite || estado === "Completada") return false;
  const [a, m, d] = String(fechaLimite).slice(0, 10).split("-").map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return new Date(a, m - 1, d) < hoy;
}

export function aviso(texto: string, tipo: "ok" | "error" = "ok"): void {
  let caja = document.getElementById("fnAviso");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "fnAviso";
    caja.setAttribute("role", "status");
    document.body.appendChild(caja);
  }
  caja.textContent = texto;
  caja.className = "fn-aviso fn-aviso--" + tipo + " fn-aviso--visible";
  window.clearTimeout((caja as any)._t);
  (caja as any)._t = window.setTimeout(() => caja!.classList.remove("fn-aviso--visible"), 3500);
}

export const claseEstado = (estado: string): string =>
  ({ "Pendiente": "fn-chip--pend", "En progreso": "fn-chip--prog", "Completada": "fn-chip--ok",
     "Confirmada": "fn-chip--prog", "Finalizada": "fn-chip--ok", "Cancelada": "fn-chip--mal" } as Record<string, string>)[estado] ?? "fn-chip--pend";

/** Exporta un arreglo tabular a CSV UTF-8 con BOM (compatible con Excel en español). */
export function exportarCsv(nombreArchivo: string, encabezados: string[], filas: unknown[][]): void {
  const celda = (v: unknown): string => {
    const s = String(v ?? "").replace(/\r?\n/g, " ").trim();
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [encabezados.map(celda).join(","), ...filas.map((f) => f.map(celda).join(","))];
  const blob = new Blob(["\uFEFF" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Genera un enlace directo a Google Maps a partir de coordenadas o dirección. */
export function urlComoLlegar(item: {
  latitud?: number | string | null;
  longitud?: number | string | null;
  direccion?: string | null;
  ciudad?: string | null;
  propiedad?: string | null;
}): string | null {
  const lat = Number(item.latitud);
  const lng = Number(item.longitud);
  if (item.latitud !== null && item.latitud !== undefined && item.longitud !== null && item.longitud !== undefined && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const texto = [item.direccion, item.ciudad].filter(Boolean).join(", ") || item.propiedad || "";
  if (!texto.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
}
