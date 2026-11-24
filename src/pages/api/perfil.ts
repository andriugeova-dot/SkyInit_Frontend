import { BACKEND_URL } from "../../utils/config";
import type { APIRoute } from "astro";
import { COOKIE_NAME, getTokenSSR } from "../../utils/auth";


export const GET: APIRoute = async ({ cookies }) => {
    const token = getTokenSSR(cookies);
    if (!token) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/perfil`, {
        headers: {
            Cookie: `${COOKIE_NAME}=${token}`,
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await backendRes.json();
    return new Response(JSON.stringify(data), {
        status: backendRes.status,
        headers: { "Content-Type": "application/json" },
    });
};