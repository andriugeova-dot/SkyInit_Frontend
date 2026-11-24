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
  if (!ruta || !ruta.trim()) return "";
  const r = ruta.trim();
  if (/^(https?:\/\/|data:)/i.test(r)) return r;
  if (r.startsWith("/backend/") || r.startsWith("/img/") || r.startsWith("/assets/")) return r;
  return "/backend" + (r.startsWith("/") ? r : "/" + r);
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
