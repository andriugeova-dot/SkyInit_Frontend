/**
 * Unico lugar donde se define la direccion del backend.
 *
 *  - BACKEND_URL: la usa SOLO el servidor de Astro (frontmatter y rutas /api).
 *    Se configura con la variable de entorno BACKEND_URL (ver .env.example).
 *  - ASSETS_BASE: prefijo que usa el NAVEGADOR. Es una ruta relativa que el
 *    propio Astro reenvia al backend (src/pages/backend/[...path].ts), asi el
 *    navegador nunca necesita conocer la direccion real del backend.
 */
const desdeEntorno = import.meta.env.BACKEND_URL ??
  (typeof process !== "undefined" ? process.env.BACKEND_URL : undefined);

export const BACKEND_URL: string = (desdeEntorno ?? "http://localhost:8001").replace(/\/+$/, "");
export const ASSETS_BASE = "/backend";

/** Convierte una ruta guardada en BD (/uploads/...) en una URL que el navegador puede cargar */
export function urlArchivo(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${ASSETS_BASE}${ruta.startsWith("/") ? ruta : "/" + ruta}`;
}
