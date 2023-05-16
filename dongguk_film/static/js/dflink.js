let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];

//
// Sub functions
//

function searchDflink() {
    let urlParams = new URLSearchParams(location.search);
    if (urlParams.has("q")) {
        id_dflink_q.value = urlParams.get("q");
        ["click", "keyup"].forEach(type => {
            id_search_dflink_init.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    location.href = `${originLocation}/dflink`;
                    id_dflink_q.readOnly = true;
                    id_search_dflink.disabled = true;
                };
            });
        });
    };

    id_dflink_q.addEventListener("keyup", (event) => {
        if (event.key == "Enter") {
            id_search_dflink.click();
        };
    });

    ["click", "keyup"].forEach(type => {
        id_search_dflink.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter") {
                location.href = `${originLocation}/dflink?q=${id_dflink_q.value}`;
                id_dflink_q.readOnly = true;
                id_search_dflink.disabled = true;
            };
        });
    });
}

searchDflink();

function initDflinkForm() {
    id_original_url.value = null;
    id_dflink_slug.value = null;
    id_title.value = null;
    id_category.value = null;
    id_category_work.checked = false;
    id_category_dept.checked = false;
    id_expiration_date.value = null;
    inputs.forEach((input) => {
        displayError(false, input);
    });
    displayButtonMsg(false, id_create_or_update_dflink, "error");
    displayButtonMsg(false, id_delete_dflink, "error");
}

function controlDflinkModal() {
    let class_opens = document.querySelectorAll(".class-open");
    let class_keywords = document.querySelectorAll(".class-keyword");
    let class_adjusts = document.querySelectorAll(".class-adjust");

    class_opens.forEach(open => {
        // All users
        ["click", "keyup"].forEach(type => {
            open.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    id_dflink_modal.hidden = false;
                    class_keywords.forEach(keyword => {
                        keyword.innerText = "만들기";
                    });
                    initDflinkForm();
                    id_delete_dflink.classList.replace("inline-flex", "hidden");
                    id_dflink_modal.setAttribute("x-data", "{ open: true }");
                }
            });
        });

        // Authenticated users
        class_adjusts.forEach(adjust => {
            if (open == adjust) {
                ["click", "keyup"].forEach(type => {
                    adjust.addEventListener(type, (event) => {
                        if (type == "click" || event.key == "Enter") {
                            let dflink_id = adjust.id.replace("id_adjust_dflink_", "");
                            let dflink = code("id_dflink_", dflink_id).value.split(",");
                            class_keywords.forEach(keyword => {
                                keyword.innerText = "수정하기";
                            });
                            id_string_id.value = dflink[0];
                            id_original_url.value = dflink[1];
                            id_dflink_slug.value = dflink[2];
                            id_title.value = dflink[3];
                            if (dflink[4] == "작품") {
                                id_category.value = "작품";
                                id_category_work.checked = true;
                            } else if (dflink[4] == "학과") {
                                id_category.value = "학과";
                                id_category_dept.checked = true;
                            };
                            id_expiration_date.value = dflink[5];
                            id_delete_dflink.classList.replace("hidden", "inline-flex");
                        };
                    });
                });
            };
        });
    });
}

controlDflinkModal();

//
// Main functions
//

function requestCreateDflink() {
    request.url = `${originLocation}/dflink/utils/dflink`;
    request.type = "GET";
    request.data = { id: "create_dflink", original_url: `${id_original_url.value}`, dflink_slug: `${id_dflink_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_or_update_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateDflink() {
    request.url = `${originLocation}/dflink/utils/dflink`;
    request.type = "GET";
    request.data = { id: "update_dflink", string_id: `${id_string_id.value}`, original_url: `${id_original_url.value}`, dflink_slug: `${id_dflink_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_or_update_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteDflink() {
    request.url = `${originLocation}/dflink/utils/dflink`;
    request.type = "GET";
    request.data = { id: "delete_dflink", string_id: `${id_string_id.value}`, original_url: `${id_original_url.value}`, dflink_slug: `${id_dflink_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    code(id_delete_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    // Init
    let categoryInputs = document.querySelectorAll("input[name='id_category']");
    id_expiration_date.setAttribute("min", yyyymmddWithDash);
    id_expiration_date.setAttribute("max", yyyymmddOfAfter90DaysWithDash);
    id_expiration_date_help.innerText = `유효 범위는 ${yyyymmddWithDash}부터 ${yyyymmddOfAfter90DaysWithDash}까지예요.`;
    categoryInputs.forEach((input) => {
        input.addEventListener("click", () => {
            if (input == id_category_work) {
                id_category.value = input.value;
            } else if (input == id_category_dept) {
                id_category.value = input.value;
            };
        });
    });

    // Step one (first and last)
    initValidation(stepOnes, id_create_or_update_dflink);
    ["click", "keyup"].forEach(type => {
        id_create_or_update_dflink.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter") {
                Array.from(radios).forEach((radio) => {
                    let idx = inputs.indexOf(radio);
                    while (idx > -1) {
                        inputs.splice(idx, 1);
                        idx = inputs.indexOf(radio);
                    };
                });
                filteredInputs = inputs.filter(isValid);
                if (filteredInputs.length == inputs.length) {
                    if (id_create_or_update_dflink.innerText == "만들기") {
                        requestCreateDflink();
                    } else if (id_create_or_update_dflink.innerText == "수정하기") {
                        requestUpdateDflink();
                    };
                    displayButtonMsg(true, id_create_or_update_dflink, "descr", "잠시만 기다려주세요.");
                    displayButtonMsg(false, id_create_or_update_dflink, "error");
                } else {
                    inputs.forEach((input) => {
                        controlError(input);
                    });
                };
            };
            ["keydown", "focusin"].forEach((type) => {
                inputs.forEach((input) => {
                    input.addEventListener(type, () => {
                        displayButtonMsg(false, id_create_or_update_dflink, "error");
                    });
                });
            });
        });
        ["click", "keyup"].forEach(type => {
            id_delete_dflink.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    requestDeleteDflink();
                    displayButtonMsg(true, id_delete_dflink, "descr", "잠시만 기다려주세요.");
                };
            });
        });
    });
}

if (id_dflink_modal != null) { setPage() };