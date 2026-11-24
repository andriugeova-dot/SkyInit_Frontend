/**
 * Utilidades y mensajes compartidos para el panel de Agente.
 */

export const MENSAJE_SIN_INMOBILIARIA =
  "Aún no estás vinculado a una inmobiliaria. Pídele al administrador que te asigne una.";

/**
 * Determina si una respuesta o error del backend indica que el agente no cuenta con inmobiliaria asignada.
 */
export function esErrorSinInmobiliaria(err: unknown): boolean {
  if (!err) return false;

  const texto = (
    typeof err === "string"
      ? err
      : (err as any)?.error ||
        (err as any)?.message ||
        (err as any)?.mensaje ||
        (err as Error)?.message ||
        ""
  ).toLowerCase();

  return (
    texto.includes("inmobiliaria") &&
    (
      texto.includes("no") ||
      texto.includes("sin") ||
      texto.includes("asign") ||
      texto.includes("vinc") ||
      texto.includes("falta") ||
      texto.includes("encontr") ||
      texto.includes("pertenec") ||
      texto.includes("asociad") ||
      texto.includes("cuenta")
    )
  );
}
