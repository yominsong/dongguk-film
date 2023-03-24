function openForm() {
    id_open_form.addEventListener("click", () => {
        id_form.classList.remove("hidden");
        id_form.setAttribute("x-data", "{ open: true }");
    });
}

openForm();