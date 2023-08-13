//
// Global constants and variables
//

const id_notice_modal = document.getElementById("id_notice_modal");
const id_category_serv = document.getElementById("id_category_serv");
const id_category_dept = document.getElementById("id_category_dept");
const id_category = document.getElementById("id_category");
const id_create_or_update_notice = document.getElementById("id_create_or_update_notice");
const id_delete_notice = document.getElementById("id_delete_notice");

let ckeditor;

//
// Sub functions
//

function searchNotice() {
    let urlParams = new URLSearchParams(location.search);
    if (urlParams.has("q")) {
        id_notice_q.value = urlParams.get("q");
        ["click", "keyup"].forEach(type => {
            id_search_notice_init.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    location.href = `${originLocation}/notice`;
                    id_notice_q.readOnly = true;
                    id_search_notice.disabled = true;
                };
            });
        });
    };

    id_notice_q.addEventListener("keyup", (event) => {
        if (event.key == "Enter") {
            id_search_notice.click();
        };
    });

    ["click", "keyup"].forEach(type => {
        id_search_notice.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter") {
                location.href = `${originLocation}/notice?q=${id_notice_q.value}`;
                id_notice_q.readOnly = true;
                id_search_notice.disabled = true;
            };
        });
    });
}

searchNotice();

function initNoticeForm() {
    id_category.value = null;
    id_category_serv.checked = false;
    id_category_dept.checked = false;
    inputs.forEach((input) => {
        displayError(false, input);
    });
    displayButtonMsg(false, id_create_or_update_notice, "error");
    displayButtonMsg(false, id_delete_notice, "error");

    const radioInputs = document.querySelectorAll("input[name='id_category']");

    radioInputs.forEach((input) => {
        const label = input.closest("label");
        const svg = label.querySelector("svg");
        const span = label.querySelector("span[aria-hidden='true']");

        input.addEventListener("focus", () => {
            svg.classList.remove("invisible");
            span.classList.add("df-focus-ring-inset");
        });

        input.addEventListener("blur", () => {
            if (!input.checked) {
                svg.classList.add("invisible");
                span.classList.remove("df-ring-inset-flamingo");
                span.classList.add("df-ring-inset-gray");
            }
            span.classList.remove("df-focus-ring-inset");
        });

        input.addEventListener("change", () => {
            if (input.checked) {
                svg.classList.remove("invisible");
                span.classList.remove("df-ring-inset-gray");
                span.classList.add("df-ring-inset-flamingo");
            } else {
                svg.classList.add("invisible");
            };

            const otherInputs = [...radioInputs].filter(i => i !== input);
            otherInputs.forEach(i => {
                const otherSvg = i.closest("label").querySelector("svg");
                const otherSpan = i.closest("label").querySelector("span[aria-hidden='true']");
                if (!i.checked) {
                    otherSvg.classList.add("invisible");
                    otherSpan.classList.remove("df-ring-inset-flamingo");
                    otherSpan.classList.add("df-ring-inset-gray");
                };
            });
        });

        if (!input.checked) {
            svg.classList.add("invisible");
            span.classList.remove("df-ring-inset-flamingo");
            span.classList.add("df-ring-inset-gray");
        } else {
            span.classList.add("df-ring-inset-flamingo");
        };
    });

    ckeditor.setData("");
}

function controlNoticeModal() {
    let class_opens = document.querySelectorAll(".class-open");
    let class_keywords = document.querySelectorAll(".class-keyword");
    let class_adjusts = document.querySelectorAll(".class-adjust");

    class_opens.forEach(open => {
        // All users
        ["click", "keyup"].forEach(type => {
            open.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    id_notice_modal.hidden = false;
                    class_keywords.forEach(keyword => {
                        keyword.innerText = "작성하기";
                    });
                    initNoticeForm();
                    id_delete_notice.classList.replace("inline-flex", "hidden");
                    id_notice_modal.setAttribute("x-data", "{ open: true }");
                    disableFocusOutsideModal(id_notice_modal);
                    document.addEventListener("keydown", function (event) {
                        if (event.key === "Escape" && id_notice_modal.getAttribute("x-data") == "{ open: true }") {
                            enableFocus();
                        };
                    });

                    // Control tabindex of toolbar
                    const textbox = document.querySelector("div[role='textbox']");
                    const toolbar = document.querySelector("div[role='toolbar']");
                    const targetElement = document.querySelector(".ck-toolbar__items").children[0].children[0];
                    
                    textbox.addEventListener("focus", () => {
                        toolbar.tabIndex = 0;
                    });

                    textbox.addEventListener("blur", () => {
                        toolbar.tabIndex = -1;
                    });

                    textbox.addEventListener("keydown", (event) => {
                        if (event.key === "Tab" && event.shiftKey) {
                            targetElement.focus();
                            event.preventDefault();
                        };
                    });

                    toolbar.addEventListener("keydown", (event) => {
                        if (event.key === "Tab" && !event.shiftKey) {
                            textbox.focus();
                            event.preventDefault();
                        };
                    });

                    toolbar.tabIndex = -1;
                };
            });
        });

        // Authenticated users
        class_adjusts.forEach(adjust => {
            if (open == adjust) {
                ["click", "keyup"].forEach(type => {
                    adjust.addEventListener(type, (event) => {
                        if (type == "click" || event.key == "Enter") {
                            let notice_id = adjust.id.replace("id_adjust_notice_", "");
                            let notice = code("id_notice_", notice_id).value.split(",");
                            class_keywords.forEach(keyword => {
                                keyword.innerText = "수정하기";
                            });
                            // id_title.value = notice[3];
                            if (notice[4] == "서비스") {
                                id_category.value = "서비스";
                                id_category_serv.checked = true;
                            } else if (notice[4] == "학과") {
                                id_category.value = "학과";
                                id_category_dept.checked = true;
                            };
                            id_delete_notice.classList.replace("hidden", "inline-flex");
                        };
                    });
                });
            };
        });
    });
}

controlNoticeModal();

function initCkeditor() {
    let userIsAuthenticated = document.querySelector("#id_mobile_logout_btn") !== null ? true : false

    if (userIsAuthenticated) {
        ClassicEditor
            .create(document.querySelector("#id_content"), {
                language: "ko"
            })
            .then(editor => {
                ckeditor = editor;
                console.log(editor);
            })
            .catch(err => {
                console.error(err.stack);
            });
    };
}

initCkeditor();

function adjustWidth() {
    function matchDivWidths() {
        let id_search_box = document.getElementById("id_search_box");
        let id_notice_modal_body = document.getElementById("id_notice_modal_body");
        let id_search_parent = document.getElementById("id_search_parent");
        let id_content_parent = document.getElementById("id_content_parent");
        if (id_notice_modal_body != null) {
            id_notice_modal_body.style.setProperty("width", id_search_box.offsetWidth + "px", "important");
            id_content_parent.style.setProperty("width", id_search_parent.offsetWidth + "px", "important");
        };
    }
    window.addEventListener("resize", matchDivWidths);
    matchDivWidths();
}

adjustWidth();

//
// Main functions
//

// None