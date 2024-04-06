//
// Global variables
//

// detail
const appName = location.pathname.split("/")[1];

// boolean
let isModalOpen = false;
let isLastSelectedAnchorHash = false;

// miscellaneous
let currentHistoryLength = history.length;

//
// Sub functions
//

function isItOkayToCloseModal() {
    let bool = false;

    if (appName == "equipment") {
        const id_filter_descr = code(id_filter, "_descr");

        bool = id_filter_descr.hidden;
    } else {
        const id_create_or_update_descr = code(id_create_or_update, "_descr");
        const id_delete_descr = code(id_delete, "_descr");
        const id_delete_error = code(id_delete, "_error");

        bool = id_create_or_update_descr.hidden && id_delete_descr.hidden && id_delete_error.hidden;
    };

    return bool;
}

function preventGoBack() {
    if (currentHistoryLength === history.length) {
        history.pushState(null, null, location.href);
    };

    document.addEventListener("click", event => {
        const closestAnchor = event.target.closest("a");

        if (closestAnchor) {
            isLastSelectedAnchorHash = closestAnchor.getAttribute("href").startsWith("#");
        };
    });

    window.onpopstate = () => {
        if (isModalOpen) {
            history.pushState(null, null, location.href);

            if (isItOkayToCloseModal()) {
                const id_close_modal = code("id_close_", id_modal);

                id_close_modal.click();
            };
        } else if (!isModalOpen) {
            if (!isLastSelectedAnchorHash) {
                history.go(-1);
            };
        };
    };
}

preventGoBack();

function executeWhenModalIsClosed() {
    isModalOpen = false;
    handleFocusForModal(false);
}

//
// Main functions
//

function initSearchBar() {
    const id_query = document.getElementById("id_query");

    if (id_query == null) return;

    const id_submit_query = code("id_submit_", id_query);

    window.addEventListener("pageshow", event => {
        if (event.persisted) {  // Detect if a user used the web browser back or forward buttons
            id_query.readOnly = false;
            id_query.value = urlParams.get("q");
            id_submit_query.disabled = false;
        };
    });

    id_query.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            id_submit_query.click();
        };
    });

    ["click", "keyup"].forEach(type => {
        id_submit_query.addEventListener(type, event => {
            if (type === "click" || event.key === "Enter" || event.key === " ") {
                urlParams.set("q", id_query.value);
                location.href = `${location.origin}${location.pathname}?${urlParams.toString()}`;
                id_query.readOnly = true;
                id_submit_query.disabled = true;
            };
        });
    });

    if (urlParams.has("q")) {
        const id_init_query = document.getElementById("id_init_query");

        id_query.value = urlParams.get("q");

        ["click", "keyup"].forEach(type => {
            id_init_query.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    location.href = `${location.origin}${location.pathname}`;
                    id_query.readOnly = true;
                    id_submit_query.disabled = true;
                };
            });
        });
    };
}

initSearchBar();

function adjustHrefTarget() {
    if (appName !== "equipment" && !appName == "notice") return;

    const class_details = document.querySelectorAll(".class-detail");

    if (class_details !== null) {
        class_details.forEach((detail) => {
            if (location.search !== "") {
                const params = new URLSearchParams(location.search);

                params.delete("rentalLimited");

                if ([...params].length > 0) {
                    detail.href += `?${params}`;
                };
            };
        });
    };

    const id_back_to_list = document.getElementById("id_back_to_list");

    if (id_back_to_list !== null) {
        if (id_back_to_list.previousElementSibling === null) {
            id_back_to_list.classList.remove("mt-3");
        };

        ["click", "keyup"].forEach(type => {
            id_back_to_list.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    if (location.search !== "") {
                        location.href = `${location.origin}/${appName}/${location.search}`;
                    } else {
                        location.href = `${location.origin}/${appName}/`;
                    };

                    freezeForm(true);
                };
            });
        });
    };
}

adjustHrefTarget();