//
// Global constants and variables
//

const id_notice_modal = document.getElementById("id_notice_modal");
const id_string_id = document.getElementById("id_string_id");
const id_title = document.getElementById("id_title");
const id_category_serv = document.getElementById("id_category_serv");
const id_category_dept = document.getElementById("id_category_dept");
const id_category = document.getElementById("id_category");
const id_content = document.getElementById("id_content");
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update_notice = document.getElementById("id_create_or_update_notice");
const id_delete_notice = document.getElementById("id_delete_notice");

let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];
let ckEditor, toolbarView, textboxModel, textboxView, textboxViewRoot;

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
    id_title.value = null;
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
                const otherLabel = i.closest("label")
                const otherSvg = otherLabel.querySelector("svg");
                if (!i.checked) {
                    otherLabel.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                    otherSvg.classList.add("invisible");
                };
            });
        });

        if (!input.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    ckEditor.setData("");
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
                    ckEditor.destroy();
                    initCkeditor();
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
                            let label, svg;
                            class_keywords.forEach(keyword => {
                                keyword.innerText = "수정하기";
                            });
                            id_string_id.value = notice[0];
                            id_title.value = notice[1];
                            if (notice[2] == "서비스") {
                                id_category.value = "서비스";
                                id_category_serv.checked = true;
                                label = id_category_serv.closest("label");
                            } else if (notice[2] == "학과") {
                                id_category.value = "학과";
                                id_category_dept.checked = true;
                                label = id_category_dept.closest("label");
                            };
                            id_keyword.value = notice[3];
                            label.classList.remove("df-ring-inset-gray");
                            label.classList.add("df-ring-inset-flamingo");
                            svg = label.querySelector("svg");
                            svg.classList.remove("invisible");
                            id_delete_notice.classList.replace("hidden", "inline-flex");
                            ckEditor.enableReadOnlyMode("id_content");
                            requestReadNotice();
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
                removePlugins: ["Title", "Markdown"],
                language: "ko",
                outputFormat: "html",
                placeholder: "여기에 내용을 입력하세요. URL을 입력하면 링크나 동영상이 자동으로 삽입됩니다."
            })
            .then(editor => {
                ckEditor = editor;
                toolbarView = ckEditor.ui.view.toolbar.element;
                textboxModel = ckEditor.model.document;
                textboxView = ckEditor.editing.view.document;
                textboxViewRoot = ckEditor.editing.view.getDomRoot();
                let notiFlag = false;

                textboxModel.on("change:data", () => {
                    let data = ckEditor.getData();
                    let regex = /https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&amp;ab_channel=([^&\s]+)/;
                    let match = data.match(regex);

                    if (match && !notiFlag) {
                        displayNoti(true, "RSL");
                        notiFlag = true;
                    };

                    id_content.value = ckEditor.getData();
                });

                textboxView.on("focus", () => {
                    toolbarView.tabIndex = "0";
                    displayError(false, id_content);
                });
                textboxView.on("blur", () => {
                    toolbarView.tabIndex = "-1";
                    if (!ckEditor.getData() || ckEditor.getData().trim() === "") {
                        displayError(true, id_content, "empty");
                    } else {
                        displayError(false, id_content);
                    };
                });
                textboxView.on("keydown", (event, data) => {
                    if (data.shiftKey && data.keyCode == 9) {
                        setTimeout(() => { toolbarView.querySelector(".ck-font-size-dropdown").querySelector("button").focus() }, 1);
                        event.stop();
                    };
                });
                toolbarView.addEventListener("focus", () => {
                    displayError(false, id_content);
                });
                toolbarView.addEventListener("keydown", () => {
                    displayError(false, id_content);
                });
                toolbarView.addEventListener("keydown", (event) => {
                    if (event.shiftKey && event.key === "Tab") {
                        if (!ckEditor.getData() || ckEditor.getData().trim() === "") {
                            displayError(true, id_content, "empty");
                        } else {
                            displayError(false, id_content);
                        };
                    };
                });
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

function requestCreateNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "create_notice", title: `${id_title.value}`, category: `${id_category.value}`, content: `${id_content.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_or_update_notice, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestReadNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "read_notice", string_id: `${id_string_id.value}` };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestDeleteNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "delete_notice", string_id: `${id_string_id.value}`, title: `${id_title.value}`, category: `${id_category.value}`, content: `${id_content.value}`, keyword: `${id_keyword.value}` };
    request.async = true;
    request.headers = null;
    code(id_delete_notice, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    // Init
    let categoryInputs = document.querySelectorAll("input[name='id_category']");
    categoryInputs.forEach((input) => {
        input.addEventListener("click", () => {
            if (input == id_category_serv) {
                id_category.value = input.value;
            } else if (input == id_category_dept) {
                id_category.value = input.value;
            };
        });
    });

    // Step one (first and last)
    initValidation(stepOnes, id_create_or_update_notice);
    ["click", "keyup"].forEach(type => {
        id_create_or_update_notice.addEventListener(type, (event) => {
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
                    if (id_create_or_update_notice.innerText == "작성하기") {
                        requestCreateNotice();
                    } else if (id_create_or_update_notice.innerText == "수정하기") {
                        requestUpdateNotice();
                    };
                    displayButtonMsg(true, id_create_or_update_notice, "descr", "잠시만 기다려주세요.");
                    displayButtonMsg(false, id_create_or_update_notice, "error");
                } else {
                    inputs.forEach((input) => {
                        controlError(input);
                    });
                };
            };
            ["keydown", "focusin"].forEach((type) => {
                inputs.forEach((input) => {
                    input.addEventListener(type, () => {
                        displayButtonMsg(false, id_create_or_update_notice, "error");
                    });
                });
            });
        });
        id_delete_notice.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter") {
                requestDeleteNotice();
                displayButtonMsg(true, id_delete_notice, "descr", "잠시만 기다려주세요.");
            };
        });
    });
}

if (id_notice_modal != null) { setPage() };