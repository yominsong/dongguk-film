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
    request.url = `${originLocation}/utility/utils/ai`;
    request.type = "GET";
    request.data = { id: "validate_site", original_url: `${id_original_url.value}`, title: `${id_dflink_title.value}`, dflink: `https://dgufilm.link/${id_dflink_slug.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    id_dflink_expiration_date.setAttribute("min", yyyymmddWithDash);
    id_dflink_expiration_date.setAttribute("max", yyyymmddOfAfter90DaysWithDash);
    id_dflink_expiration_date_info.innerText = `유효 범위는 ${yyyymmddWithDash}부터 ${yyyymmddOfAfter90DaysWithDash}까지예요.`;

    id_category_work.addEventListener("click", () => {
        if (id_category_work.checked) {
            id_category.value = id_category_work.value;
        };
    });
    id_category_dept.addEventListener("click", () => {
        if (id_category_dept.checked) {
            id_category.value = id_category_dept.value;
        };
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
        } else {
            inputs.forEach((input) => {
                controlError(input);
            });
        };
    });
}

setPage();