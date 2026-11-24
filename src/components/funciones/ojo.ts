/** Añade a cada <input type="password" data-ojo> un boton con icono de ojo para ver u ocultar la contraseña. */
export function activarOjos(raiz: ParentNode = document) {
  raiz.querySelectorAll<HTMLInputElement>("input[data-ojo]").forEach((input) => {
    if (input.parentElement?.classList.contains("fn-ojo")) return;
    const caja = document.createElement("span");
    caja.className = "fn-ojo";
    input.replaceWith(caja);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("aria-label", "Mostrar contraseña");
    boton.setAttribute("aria-pressed", "false");
    boton.innerHTML = `<i class="bi bi-eye" aria-hidden="true"></i>`;
    boton.addEventListener("click", () => {
      const ver = input.type === "password";
      input.type = ver ? "text" : "password";
      boton.setAttribute("aria-pressed", String(ver));
      boton.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
      boton.innerHTML = `<i class="bi ${ver ? "bi-eye-slash" : "bi-eye"}" aria-hidden="true"></i>`;
    });
    caja.append(input, boton);
  });
}
