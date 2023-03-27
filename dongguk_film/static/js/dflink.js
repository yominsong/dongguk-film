let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];

//
// Main functions
//

function openForm() {
    id_open_form.addEventListener("click", () => {
        id_form.classList.remove("hidden");
        id_form.setAttribute("x-data", "{ open: true }");
    });
}

openForm();

function setPage() {
    initValidation(stepOnes, id_create_dflink);
    id_create_dflink.addEventListener("click", () => {
        filteredInputs = inputs.filter(isValid);
        if (filteredInputs.length == inputs.length) {
            alert("성공");
        } else {
            inputs.forEach((input) => {
                controlError(input);
            });
        };
    });
}

setPage();