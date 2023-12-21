//
// Global constants and variables
//

const id_search_equipment = document.getElementById("id_search_equipment");
const id_search_equipment_init = document.getElementById("id_search_equipment_init");
const id_equipment_q = document.getElementById("id_equipment_q");
const id_equipment_modal = document.getElementById("id_equipment_modal");
const id_category = document.getElementById("id_category");
const id_purpose = document.getElementById("id_purpose");
const id_filter_equipment = document.getElementById("id_filter_equipment");
const radioInputs = document.querySelectorAll("input[name='id_category'], input[name='id_purpose']");

let currentHistoryLength = history.length;
let lastClickedWasHash = false;
let modalOpen = false;

//
// Sub functions
//

function search() {
    if (urlParams.has("q")) {
        id_equipment_q.value = urlParams.get("q");
        ["click", "keyup"].forEach(type => {
            id_search_equipment_init.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    urlParams.delete("q");
                    location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
                    id_equipment_q.readOnly = true;
                    id_search_equipment.disabled = true;
                };
            });
        });
    };

    id_equipment_q.addEventListener("keyup", (event) => {
        if (event.key == "Enter") {
            id_search_equipment.click();
        };
    });

    ["click", "keyup"].forEach(type => {
        id_search_equipment.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter" || event.key == " ") {
                urlParams.delete("page");
                urlParams.delete("q");
                urlParams.append("q", id_equipment_q.value);
                location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
                id_equipment_q.readOnly = true;
                id_search_equipment.disabled = true;
            };
        });
    });
}

search();

function initForm() {
    radioInputs.forEach((input) => {
        const label = input.closest("label");
        const svg = label.querySelector("svg");

        input.addEventListener("click", () => {
            if (input.id.indexOf("category") != -1) {
                id_category.value = input.value;
            } else if (input.id.indexOf("purpose") != -1) {
                id_purpose.value = input.value;
            };
        });

        input.addEventListener("focus", () => {
            label.classList.add("df-focus-ring-inset");
            svg.classList.remove("invisible");
        });

        input.addEventListener("blur", () => {
            if (!input.checked) {
                svg.classList.add("invisible");
            } else if (input.checked) {
                label.classList.add("df-ring-inset-flamingo");
            };
            label.classList.remove("df-focus-ring-inset");
        });

        input.addEventListener("change", () => {
            if (input.checked) {
                label.classList.replace("df-ring-inset-gray", "df-ring-inset-flamingo");
                svg.classList.remove("invisible");
            } else {
                svg.classList.add("invisible");
            };

            const otherInputs = [...radioInputs].filter(i => i !== input);
            otherInputs.forEach(i => {
                const otherLabel = i.closest("label");
                const otherSvg = otherLabel.querySelector("svg");
                if (!i.checked) {
                    otherLabel.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                    otherSvg.classList.add("invisible");
                };
            });
        });

        if (input.value == id_category.value || input.value == id_purpose.value) {
            input.click();
        };

        if (!input.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });
}

function initModal() {
    let class_filters = document.querySelectorAll(".class-filter");

    function openModal() {
        id_equipment_modal.hidden = false;
        id_equipment_modal.setAttribute("x-data", "{ open: true }");
        disableFocusOutsideModal(id_equipment_modal);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && id_equipment_modal.getAttribute("x-data") == "{ open: true }") {
                enableFocus();
            };
        });
        sessionStorage.setItem("scrollPosition", window.scrollY);
        modalOpen = true;
        initForm();
    };

    class_filters.forEach(filter => {
        ["click", "keyup"].forEach(type => {
            filter.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    openModal();
                };
            });
        });
    });
}

initModal();

function detectHashLinkClick() {
    document.addEventListener("click", function (event) {
        let closestAnchor = event.target.closest("a");

        if (closestAnchor) {
            lastClickedWasHash = closestAnchor.getAttribute("href").startsWith("#");
        };
    });
}

detectHashLinkClick();

function preventGoBack() {
    if (currentHistoryLength == history.length) {
        history.pushState(null, null, location.href);
    };
    window.onpopstate = function () {
        if (modalOpen) {
            history.pushState(null, null, location.href);
            if (id_filter_equipment_descr.hidden) {
                id_equipment_modal.setAttribute("x-data", "{ open: false }");
                enableFocus();
                modalOpen = false;
            };
        } else if (!modalOpen) {
            if (!lastClickedWasHash) {
                history.go(-1);
            };
        };
    };
}

preventGoBack();

//
// Main functions
//

function requestFilterEquipment() {
    code(id_filter_equipment, "_descr").hidden = false;
    code(id_filter_equipment, "_spin").classList.remove("hidden");
    freezeForm(true);
    radioInputs.forEach((input) => {
        if (input.classList.contains("sr-only")) {
            let label = input.closest("label");
            label.classList.replace("hover:bg-gray-50", "bg-gray-100");
            label.classList.replace("cursor-pointer", "cursor-not-allowed");
        };
        radios.forEach((radio) => { radio.disabled = true });
    });
    location.href = `${originLocation}/equipment?sort=ascending&category=${id_category.value}&purpose=${id_purpose.value}`;
}

function setPage() {
    window.addEventListener("pageshow", function (event) {
        // Detect the web browser's back/forward buttons
        if (event.persisted) {
            // Enable Search
            urlParams = new URLSearchParams(location.search);
            id_equipment_q.readOnly = false;
            id_equipment_q.value = urlParams.get("q");
            id_search_equipment.disabled = false;

            // Close modal
            id_equipment_modal.hidden = true;
            id_equipment_modal.setAttribute("x-data", "{ open: false }");
            modalOpen = false;
        };

        // Init
        code(id_filter_equipment, "_descr").hidden = true;
        code(id_filter_equipment, "_spin").classList.add("hidden");
        freezeForm(false);
        radioInputs.forEach((input) => {
            if (input.classList.contains("sr-only")) {
                let label = input.closest("label");
                label.classList.replace("bg-gray-100", "hover:bg-gray-50");
                label.classList.replace("cursor-not-allowed", "cursor-pointer");
            };
            radios.forEach((radio) => { radio.disabled = false });
        });
        id_category.value = urlParams.get("category");
        id_purpose.value = urlParams.get("purpose");
        initForm();

        // Step one (first and last)
        ["click", "keyup"].forEach(type => {
            id_filter_equipment.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    requestFilterEquipment();
                };
            });
        });
    });
}

setPage();