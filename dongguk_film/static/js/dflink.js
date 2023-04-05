let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];

//
// Main functions
//

function displayForm(bool) {
    let id_open_form = document.querySelector("#id_open_form");
    if (id_open_form && bool == true) {
        id_open_form.addEventListener("click", () => {
            id_form.classList.remove("hidden");
            id_form.setAttribute("x-data", "{ open: true }");
        });
    } else if (bool == false) {
        id_form.setAttribute("x-data", "{ open: false }");
    };
}

displayForm(true);

function requestValidateSite() {
    request.url = `${originLocation}/utility/utils/dflink`;
    request.type = "GET";
    request.data = { id: "validate_site", original_url: `${id_original_url.value}`, slug: `${id_dflink_slug.value}`, title: `${id_dflink_title.value}`, category: `${id_category.value}`, expiration_date: `${id_dflink_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    let originalInputs = document.querySelectorAll("input[name='id_category']");

    id_dflink_expiration_date.setAttribute("min", yyyymmddWithDash);
    id_dflink_expiration_date.setAttribute("max", yyyymmddOfAfter90DaysWithDash);
    id_dflink_expiration_date_help.innerText = `유효 범위는 ${yyyymmddWithDash}부터 ${yyyymmddOfAfter90DaysWithDash}까지예요.`;

    originalInputs.forEach((input) => {
        input.addEventListener("click", () => {
            if (input == id_category_work) {
                id_category.value = input.value;
            } else if (input == id_category_dept) {
                id_category.value = input.value;
            };
        });
    });

    initValidation(stepOnes, id_create_dflink);
    id_create_dflink.addEventListener("click", () => {
        Array.from(radios).forEach((radio) => {
            let idx = inputs.indexOf(radio);
            while (idx > -1) {
                inputs.splice(idx, 1);
                idx = inputs.indexOf(radio);
            };
        });
        filteredInputs = inputs.filter(isValid);
        if (filteredInputs.length == inputs.length) {
            requestValidateSite();
            id_create_dflink_div.classList.replace("justify-between", "justify-end");
            displayButtonMsg(false, id_create_dflink, "descr");
            displayButtonMsg(false, id_create_dflink, "error");
        } else {
            inputs.forEach((input) => {
                controlError(input);
            });
        };
    });
    ["keydown", "focusin"].forEach((type) => {
        inputs.forEach((input) => {
            input.addEventListener(type, () => {
                id_create_dflink_div.classList.replace("justify-between", "justify-end");
                displayButtonMsg(false, id_create_dflink, "descr");
                displayButtonMsg(false, id_create_dflink, "error");
            });
        });
    });
}

setPage();