import { BACKEND_URL } from "../../../../../../utils/config";
import type { APIRoute } from "astro";

const BACKEND = `${BACKEND_URL}/api/agente/panel/propiedades`;

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const res = await fetch(`${BACKEND}/${params.id}/imagenes/${params.imagenId}`, {
      method: "DELETE", 
      headers: {
        Cookie: request.headers.get("cookie") || "",
        Accept: "application/json",
      },
    });
    const data = await res.json().catch(() => ({
      success: false,
      error: "Respuesta inválida del backend",
    }));
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Error de conexión al eliminar la imagen." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};