import type { APIRoute } from "astro";
import { BACKEND_URL } from "../../../utils/config";

/** Inicia el acceso con Google. PUBLIC_BACKEND_URL es la direccion del backend vista desde el navegador. */
export const GET: APIRoute = ({ redirect }) => {
  const publico = (import.meta.env.PUBLIC_BACKEND_URL ?? BACKEND_URL).replace(/\/+$/, "");
  return redirect(`${publico}/auth/google`);
};
