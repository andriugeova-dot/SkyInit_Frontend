import { BACKEND_URL } from "../../../../utils/config";
import type { APIRoute } from "astro";

const BACKEND = `${BACKEND_URL}/api/agente/panel/proyectos`;

export const GET: APIRoute = async ({ request }) => {
  try {
    const res = await fetch(BACKEND, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
        Accept: "application/json",
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Error de conexión con el backend." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};