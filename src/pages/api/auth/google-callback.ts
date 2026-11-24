import type { APIRoute } from "astro";
import { COOKIE_NAME, obtenerRolDesdeToken } from "../../../utils/auth";
import { BACKEND_URL } from "../../../utils/config";

const RUTAS: Record<string, string> = {
  SuperAdmin:    "/superadmin",
  Administrador: "/admin",
  Agente:        "/agente",
  Constructora:  "/constructora",
  Trabajador:    "/trabajador",
  Usuario:       "/",
};

/**
 * El backend redirige aqui con ?code=<codigo de un solo uso> (nunca con el JWT).
 * Astro canjea el codigo servidor-a-servidor y guarda la sesion en cookie HttpOnly.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  if (!code) return redirect("/login?error=token_invalido");

  let datos: { token?: string; nuevo?: boolean };
  try {
    const res = await fetch(`${BACKEND_URL}/auth/google/canjear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return redirect("/login?error=token_invalido");
    datos = await res.json();
  } catch {
    return redirect("/login?error=oauth_error");
  }
  if (!datos.token) return redirect("/login?error=token_invalido");

  cookies.set(COOKIE_NAME, datos.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
    maxAge: 60 * 60,
  });

  if (datos.nuevo) return redirect("/terminos?nuevo=true");
  return redirect(RUTAS[obtenerRolDesdeToken(datos.token) ?? ""] ?? "/");
};
