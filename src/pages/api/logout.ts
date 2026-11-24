import { BACKEND_URL } from "../../utils/config";
import type { APIRoute } from "astro";
import { COOKIE_NAME, getTokenSSR } from "../../utils/auth";


function cookieBorrada(): string {
  return [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}

export const POST: APIRoute = async ({ cookies }) => {
  const token = getTokenSSR(cookies);

  // Aviso al backend (best-effort; no bloquea el logout local)
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${COOKIE_NAME}=${token}`,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignorar: igual borramos la cookie local
    }
  }

  return new Response(
    JSON.stringify({ success: true, mensaje: "Sesión cerrada exitosamente" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieBorrada(),
      },
    }
  );
};
