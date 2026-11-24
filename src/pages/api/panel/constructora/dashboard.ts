import { BACKEND_URL } from "../../../../utils/config";
import type { APIRoute } from "astro";
import { COOKIE_NAME, getTokenSSR } from "../../../../utils/auth";

const BACKEND = `${BACKEND_URL}`;

export const GET: APIRoute = async ({ cookies }) => {
    const token = getTokenSSR(cookies);
    if (!token) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
        });
    }

    const res = await fetch(`${BACKEND}/panel/constructora/dashboard`, {
        headers: { Cookie: `${COOKIE_NAME}=${token}` },
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
    });
    };