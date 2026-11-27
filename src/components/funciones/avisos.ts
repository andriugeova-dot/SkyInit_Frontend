/**
 * Notificaciones en tiempo casi real: consulta cada 20 s las no leidas, actualiza el contador,
 * muestra una ventana emergente por cada notificacion nueva y, si el usuario lo permitio,
 * tambien una notificacion del navegador (aparece aunque la pestaña este en segundo plano).
 */
import { esc } from "./comun";

type Notif = { notificacionID: number; titulo: string; mensaje: string; tipoNotificacion: string };
const CLAVE = "skyinit_ultima_notif";

export function enlaceNotificacion(tipo: string, rol: string): string {
  const porRol: Record<string, Record<string, string>> = {
    agenda: { Usuario: "/usuario/agenda", Administrador: "/admin/agenda", Agente: "/agente/agenda", Trabajador: "/trabajador/agenda" },
    mantenimiento: { Usuario: "/usuario/solicitudes", Administrador: "/admin/mantenimiento", Constructora: "/constructora/mantenimiento", Trabajador: "/trabajador" },
    calificacion: { Administrador: "/admin/propiedades", Agente: "/agente/propiedades" },
    comentario: { Administrador: "/admin/propiedades", Agente: "/agente/propiedades" },
  };
  return porRol[tipo]?.[rol] ?? "/notificaciones";
}

const ICONOS: Record<string, string> = {
  agenda: "bi-calendar-check", mantenimiento: "bi-tools", calificacion: "bi-star-fill", comentario: "bi-chat-dots",
};
export const iconoNotificacion = (tipo: string) => ICONOS[tipo] ?? "bi-bell";

function emergente(n: Notif, rol: string) {
  let pila = document.getElementById("avisosPila");
  if (!pila) {
    pila = document.createElement("div");
    pila.id = "avisosPila";
    pila.setAttribute("aria-live", "polite");
    document.body.appendChild(pila);
  }
  const a = document.createElement("a");
  a.className = "aviso-emergente";
  a.href = enlaceNotificacion(n.tipoNotificacion, rol);
  a.innerHTML = `<i class="bi ${iconoNotificacion(n.tipoNotificacion)}" aria-hidden="true"></i>
    <span><strong>${esc(n.titulo)}</strong><small>${esc(n.mensaje)}</small></span>
    <button type="button" aria-label="Cerrar aviso"><i class="bi bi-x-lg" aria-hidden="true"></i></button>`;
  a.querySelector("button")!.addEventListener("click", (e) => { e.preventDefault(); a.remove(); });
  pila.appendChild(a);
  setTimeout(() => a.remove(), 9000);
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    try {
      const sistema = new Notification(n.titulo, { body: n.mensaje, tag: "skyinit-" + n.notificacionID });
      sistema.onclick = () => { window.focus(); location.href = a.href; };
    } catch { /* algunos navegadores solo permiten notificaciones desde un service worker */ }
  }
}

export function iniciarAvisos(rol: string, idsContador: string[]) {
  let ultima = Number((() => { try { return sessionStorage.getItem(CLAVE); } catch { return null; } })() ?? -1);
  async function consultar() {
    try {
      const res = await fetch("/backend/api/notificaciones?soloNoLeidas=1", { credentials: "same-origin" });
      if (!res.ok) return;
      const { noLeidas, notificaciones } = await res.json() as { noLeidas: number; notificaciones: Notif[] };
      for (const id of idsContador) {
        const el = document.getElementById(id);
        if (el) { el.hidden = !noLeidas; el.textContent = noLeidas > 99 ? "99+" : String(noLeidas); }
      }
      const maxima = notificaciones.reduce((m, n) => Math.max(m, n.notificacionID), 0);
      // Primera consulta de la sesion: solo se toma el punto de partida, sin inundar de avisos viejos
      if (ultima >= 0) notificaciones.filter((n) => n.notificacionID > ultima).reverse().slice(-4).forEach((n) => emergente(n, rol));
      if (maxima > ultima || ultima < 0) { ultima = Math.max(maxima, 0); try { sessionStorage.setItem(CLAVE, String(ultima)); } catch { /* sin almacenamiento */ } }
      document.dispatchEvent(new CustomEvent("avisos:actualizados", { detail: { noLeidas } }));
    } catch { /* sin conexion: se reintenta */ }
  }
  consultar();
  setInterval(consultar, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) consultar(); });
}
