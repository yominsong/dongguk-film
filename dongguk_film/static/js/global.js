//
// Global variables
//

// detail
const appName = location.pathname.split("/")[1];

// class
const class_details = document.querySelectorAll(".class-detail");

// boolean
let isModalOpen = false;
let isLastSelectedAnchorHash = false;

// miscellaneous
let modalCloseAttempts = 0;
let currentHistoryLength = history.length;

//
// Sub functions
//

function canCloseModal() {
    const shouldConfirmModalClose = ["등록하기", "만들기", "작성하기", "수정하기"].some(text => id_modal_title.textContent.includes(text)) && isModalOpen;

    if (shouldConfirmModalClose && modalCloseAttempts === 0) {
        modalCloseAttempts++;

        let title = id_modal_title.textContent.trim();
        let keyword = title.split(" ").pop().trim();
        let target = title.replace(keyword, "").trim();

        if (keyword.endsWith("하기")) {
            keyword = keyword.slice(0, -2);
        };

        let param = {
            "target": target,
            "keyword": keyword,
            "josa": matchJosa(keyword, "을를", "OJS")
        };

        displayNoti(true, "MODAL_CLOSE_ATTEMPTED", param);

        return false;
    };

    let isModalClosable = false;

    if (appName == "facility") {
        isModalClosable = true;
    } else if (appName == "equipment") {
        const id_filter_or_checkout_descr = code(id_filter_or_checkout, "_descr");

        isModalClosable = id_filter_or_checkout_descr.hidden;
    } else if (appName == "account") {
        const id_cancel_or_delete_descr = code(id_cancel_or_delete, "_descr");

        isModalClosable = id_cancel_or_delete_descr.hidden;
    } else {
        const id_create_or_update_descr = code(id_create_or_update, "_descr");
        const id_delete_descr = code(id_delete, "_descr");
        const id_delete_error = code(id_delete, "_error");

        isModalClosable = id_create_or_update_descr.hidden && id_delete_descr.hidden && id_delete_error.hidden;
    };

    if (shouldConfirmModalClose) {
        isModalClosable = modalCloseAttempts > 0 && isModalClosable;
    };

    return isModalClosable;
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

            if (canCloseModal()) {
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
    displayNoti(false, "MODAL_CLOSE_ATTEMPTED");
    modalCloseAttempts = 0;
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
                    urlParams.delete("q");

                    if (urlParams.size > 0) {
                        location.href = `${location.origin}${location.pathname}?${urlParams.toString()}`;
                    } else {
                        location.href = `${location.origin}${location.pathname}`;
                    };

                    id_query.readOnly = true;
                    id_submit_query.disabled = true;
                };
            });
        });
    };
}

initSearchBar();

function adjustHrefTarget() {
    if (appName !== "equipment" && appName !== "notice") return;

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