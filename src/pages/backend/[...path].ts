import type { APIRoute } from "astro";
import { BACKEND_URL } from "../../utils/config";

/**
 * Proxy generico: /backend/<ruta> -> BACKEND_URL/<ruta>
 * Permite que el navegador hable con el backend por el mismo origen
 * (imagenes de /uploads y llamadas fetch de los paneles) sin URLs fijas.
 */
const CABECERAS_IDA = ["cookie", "content-type", "accept", "authorization"];
const CABECERAS_VUELTA = ["content-type", "cache-control", "etag", "last-modified", "content-length", "retry-after"];

export const ALL: APIRoute = async ({ request, params, url, clientAddress }) => {
  const ruta = params.path ?? "";
  if (ruta.includes("..")) return new Response("Ruta invalida", { status: 400 });

  const headers = new Headers();
  for (const h of CABECERAS_IDA) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("x-forwarded-for", clientAddress);

  const conCuerpo = !["GET", "HEAD"].includes(request.method);
  try {
    const res = await fetch(`${BACKEND_URL}/${ruta}${url.search}`, {
      method: request.method,
      headers,
      body: conCuerpo ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
    const salida = new Headers();
    for (const h of CABECERAS_VUELTA) {
      const v = res.headers.get(h);
      if (v) salida.set(h, v);
    }
    return new Response(res.body, { status: res.status, headers: salida });
  } catch {
    return new Response(JSON.stringify({ error: "No se pudo conectar con el backend" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
