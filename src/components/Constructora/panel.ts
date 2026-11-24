/** Utilidades compartidas por Propiedades y Proyectos del panel de constructora. */
import { api, esc, urlArchivo, aviso } from "../funciones/comun";

const BASE = "/backend/panel/constructora";

/** Llama a /panel/constructora/... por el proxy del mismo origen. Lanza Error con el mensaje del servidor. */
export async function pedir<T = any>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  const esForm = cuerpo instanceof FormData;
  const res = await fetch(BASE + ruta, {
    method: metodo,
    credentials: "same-origin",
    headers: cuerpo !== undefined && !esForm ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo === undefined ? undefined : esForm ? (cuerpo as FormData) : JSON.stringify(cuerpo),
  });
  if (res.status === 401) {
    window.location.href = "/login?redirect=" + encodeURIComponent(location.pathname + location.search);
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok || datos.success === false) {
    throw new Error(datos.message ?? datos.error ?? "No se pudo completar la operación");
  }
  return datos as T;
}

export type Coordenadas = { latitud: number | null; longitud: number | null };

/** Coordenadas guardadas de las propiedades y proyectos de la constructora (id -> coordenadas). */
export async function cargarCoordenadas(tipo: "propiedades" | "proyectos"): Promise<Map<number, Coordenadas>> {
  const mapa = new Map<number, Coordenadas>();
  try {
    const datos = await api<any>("/geo/editables");
    for (const x of datos?.[tipo] ?? []) mapa.set(Number(x.id), { latitud: x.latitud ?? null, longitud: x.longitud ?? null });
  } catch { /* sin coordenadas: el resto de la pantalla sigue funcionando */ }
  return mapa;
}

export const selector = () => (window as any).selectorUbicacion as
  | { fijar(lat: unknown, lng: unknown): void; leer(): Partial<Coordenadas> }
  | undefined;

/** Guarda la ubicacion elegida en el mapa del formulario (si se toco). Devuelve un mensaje de error o null. */
export async function guardarUbicacion(tipo: "propiedades" | "proyectos", id: number): Promise<string | null> {
  const ubi = selector()?.leer() ?? {};
  if (!("latitud" in ubi)) return null;
  try {
    await api(`/geo/${tipo}/${id}`, "PUT", { latitud: ubi.latitud, longitud: ubi.longitud });
    return null;
  } catch (e) {
    return (e as Error).message || "No se pudo guardar la ubicación";
  }
}

export function mostrarError(caja: HTMLElement, texto: string | null): void {
  const span = caja.querySelector("span") ?? caja;
  span.textContent = texto ?? "";
  caja.hidden = !texto;
  if (texto) caja.scrollIntoView({ block: "nearest" });
}

/** Cierra el dialogo con los botones [data-cerrar] y al hacer clic en el fondo. */
export function prepararDialogo(dlg: HTMLDialogElement, cerrarConFondo = true): void {
  if (dlg.dataset.listo) return;
  dlg.dataset.listo = "1";
  dlg.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if ((cerrarConFondo && t === dlg) || t.closest("[data-cerrar]")) dlg.close();
  });
}

/** Dialogo de confirmacion propio (sin confirm()). Resuelve true si el usuario confirma. */
export function confirmar(opciones: { titulo: string; texto: string; accion?: string }): Promise<boolean> {
  const dlg = document.getElementById("cpConfirmar") as HTMLDialogElement;
  prepararDialogo(dlg);
  dlg.querySelector<HTMLElement>("#cpConfirmarTitulo span")!.textContent = opciones.titulo;
  dlg.querySelector<HTMLElement>("#cpConfirmarTexto")!.textContent = opciones.texto;
  const si = dlg.querySelector<HTMLButtonElement>("#cpConfirmarSi")!;
  si.querySelector("span")!.textContent = opciones.accion ?? "Eliminar";
  return new Promise((resolver) => {
    let respuesta = false;
    const alConfirmar = () => { respuesta = true; dlg.close(); };
    si.addEventListener("click", alConfirmar);
    dlg.addEventListener("close", () => { si.removeEventListener("click", alConfirmar); resolver(respuesta); }, { once: true });
    dlg.showModal();
    dlg.querySelector<HTMLButtonElement>("[data-cerrar].fn-btn")?.focus();
  });
}

type Imagen = { imagenID: number | null; url: string };

/**
 * Modal de fotos (ver, subir y borrar). `recurso` es "propiedades" o "proyectos".
 * Devuelve la funcion para abrirlo; `alCambiar` se llama cuando cambian las fotos (para refrescar la lista).
 */
export function montarFotos(
  recurso: "propiedades" | "proyectos",
  alCambiar: () => void,
  /** Portada y total conocidos por la lista, por si el servidor no devuelve el detalle */
  respaldo?: (id: number) => { url: string | null; total: number } | null,
) {
  const dlg = document.getElementById("cpFotos") as HTMLDialogElement;
  const titulo = dlg.querySelector<HTMLElement>("#cpFotosTitulo span")!;
  const lista = dlg.querySelector<HTMLElement>("#cpFotosLista")!;
  const entrada = dlg.querySelector<HTMLInputElement>("#cpFotosArchivo")!;
  const subir = dlg.querySelector<HTMLButtonElement>("#cpFotosSubir")!;
  const error = dlg.querySelector<HTMLElement>("#cpFotosError")!;
  const nota = dlg.querySelector<HTMLElement>("#cpFotosNota")!;
  let idActivo = 0;
  let nombreActivo = "";
  let cambio = false;

  function pintar(imagenes: Imagen[], total = imagenes.length, sinDetalle = false) {
    titulo.textContent = `Fotos de ${nombreActivo} (${total})`;
    mostrarError(nota, sinDetalle
      ? "El servidor solo entrega la galería completa cuando la propiedad está \"Disponible\". Puedes subir fotos nuevas; para ver todas o borrarlas, vuelve a ponerla como Disponible."
      : null);
    if (!imagenes.length) {
      lista.innerHTML = `<div class="cp-fotos-vacio"><i class="bi bi-images" aria-hidden="true"></i>Aún no hay fotos. Sube la primera: será la portada de la tarjeta.</div>`;
      return;
    }
    lista.innerHTML = imagenes.map((img, i) => `
      <div class="cp-foto">
        <img src="${esc(urlArchivo(img.url))}" alt="Foto ${i + 1} de ${esc(nombreActivo)}" loading="lazy" />
        ${i === 0 ? `<span class="cp-foto-portada">Portada</span>` : ""}
        ${img.imagenID != null ? `<button type="button" class="cp-foto-borrar" data-borrar-foto="${esc(img.imagenID)}" aria-label="Eliminar la foto ${i + 1}" title="Eliminar foto"><i class="bi bi-trash" aria-hidden="true"></i></button>` : ""}
      </div>`).join("");
  }

  async function cargar() {
    try {
      const r = await pedir<any>(`/${recurso}/${idActivo}`);
      if (!r.data) {
        // Sin detalle: se muestra lo que se sabe por la lista (portada y total), sin opcion de borrar
        const r2 = await pedir<any>(`/${recurso}`).catch(() => null);
        const fila = (r2?.data ?? []).find((x: any) => Number(x.propiedadID ?? x.proyectoID) === idActivo);
        const conocido = fila ? { url: fila.imagenUrl ?? null, total: Number(fila.totalImagenes) || 0 } : respaldo?.(idActivo) ?? null;
        pintar(conocido?.url ? [{ imagenID: null, url: conocido.url }] : [], conocido?.total ?? 0, true);
        return;
      }
      const imgs = (r.data.imagenes ?? []).map((x: any) => (typeof x === "string" ? { imagenID: null, url: x } : x));
      pintar(imgs);
    } catch (e) {
      lista.innerHTML = "";
      mostrarError(error, (e as Error).message);
    }
  }

  lista.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-borrar-foto]");
    if (!btn) return;
    const ok = await confirmar({ titulo: "Eliminar foto", texto: "La foto se borrará de forma permanente. ¿Quieres continuar?", accion: "Eliminar foto" });
    if (!ok) return;
    btn.disabled = true;
    mostrarError(error, null);
    try {
      await pedir(`/${recurso}/${idActivo}/imagenes/${btn.dataset.borrarFoto}`, "DELETE");
      cambio = true;
      aviso("Foto eliminada");
      await cargar();
    } catch (err) {
      btn.disabled = false;
      mostrarError(error, (err as Error).message);
    }
  });

  subir.addEventListener("click", async () => {
    const archivos = Array.from(entrada.files ?? []);
    mostrarError(error, null);
    if (!archivos.length) { mostrarError(error, "Elige al menos una imagen (JPG, PNG o WebP, máximo 5 MB)."); return; }
    const grande = archivos.find((a) => a.size > 5 * 1024 * 1024);
    if (grande) { mostrarError(error, `"${grande.name}" supera los 5 MB.`); return; }
    subir.disabled = true;
    const etiqueta = subir.querySelector("span")!;
    const textoPrevio = etiqueta.textContent;
    let subidas = 0;
    try {
      for (const archivo of archivos) {
        etiqueta.textContent = `Subiendo ${subidas + 1} de ${archivos.length}…`;
        const fd = new FormData();
        fd.append("imagen", archivo);
        await pedir(`/${recurso}/${idActivo}/imagenes`, "POST", fd);
        subidas++;
      }
      entrada.value = "";
      aviso(subidas === 1 ? "Foto agregada" : `${subidas} fotos agregadas`);
    } catch (err) {
      mostrarError(error, (err as Error).message);
    } finally {
      if (subidas) cambio = true;
      etiqueta.textContent = textoPrevio;
      subir.disabled = false;
      await cargar();
    }
  });

  dlg.addEventListener("close", () => { if (cambio) alCambiar(); });
  prepararDialogo(dlg);

  return function abrir(id: number, nombre: string) {
    idActivo = id;
    nombreActivo = nombre;
    cambio = false;
    entrada.value = "";
    mostrarError(error, null);
    mostrarError(nota, null);
    titulo.textContent = `Fotos de ${nombre}`;
    lista.innerHTML = `<div class="cp-fotos-vacio">Cargando fotos…</div>`;
    dlg.showModal();
    cargar();
  };
}
