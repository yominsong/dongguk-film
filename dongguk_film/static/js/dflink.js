//
// Global variables
//

const id_modal = document.getElementById("id_modal");
const id_link_id = document.getElementById("id_link_id");
const id_target_url = document.getElementById("id_target_url");
const id_target_url_original = code(id_target_url, "_original");
const id_slug = document.getElementById("id_slug");
const id_slug_original = code(id_slug, "_original");
const id_title = document.getElementById("id_title");
const id_title_original = code(id_title, "_original");
const id_category = document.getElementById("id_category");
const id_category_original = code(id_category, "_original");
const id_category_work = document.getElementById("id_category_work");
const id_category_dept = document.getElementById("id_category_dept");
const id_expiration_date = document.getElementById("id_expiration_date");
const id_expiration_date_original = code(id_expiration_date, "_original");
const id_create_or_update_dflink = document.getElementById("id_create_or_update_dflink");
const id_delete_dflink = document.getElementById("id_delete_dflink");
const id_delete_dflink_text_content = code(id_delete_dflink, "_text_content");

let currentHistoryLength = history.length;
let lastClickedWasHash = false;
let modalOpen = false;
let askedTwice = false;
let askedTwiceTimer;

//
// Sub functions
//

function search() {
    const id_query = document.getElementById("id_query");
    const id_send_query = document.getElementById("id_send_query");
    const id_initialize_query = document.getElementById("id_initialize_query");

    window.addEventListener("pageshow", event => {
        if (event.persisted) {  // Detect the web browser's back/forward buttons
            id_query.readOnly = false;
            id_query.value = urlParams.get("q");
            id_send_query.disabled = false;
        };
    });

    id_query.addEventListener("keyup", event => {
        if (event.key == "Enter") {
            id_send_query.click();
        };
    });

    ["click", "keyup"].forEach(type => {
        id_send_query.addEventListener(type, event => {
            if (type == "click" || event.key == "Enter" || event.key == " ") {
                location.href = `${originLocation}/dflink/?q=${id_query.value}`;
                id_query.readOnly = true;
                id_send_query.disabled = true;
            };
        });
    });

    if (urlParams.has("q")) {
        id_query.value = urlParams.get("q");
        ["click", "keyup"].forEach(type => {
            id_initialize_query.addEventListener(type, event => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    location.href = `${originLocation}/dflink`;
                    id_query.readOnly = true;
                    id_send_query.disabled = true;
                };
            });
        });
    };
}

search();

function initForm() {
    const target_url_placeholder = new Array("https://docs.google.com/document/d/...", "https://docs.google.com/spreadsheets/d/...", "https://docs.google.com/presentation/d/...", "https://docs.google.com/forms/d/...", "https://drive.google.com/drive/folders/...", "https://drive.google.com/file/d/...", "https://www.dropbox.com/s/...", "https://www.youtube.com/playlist?list=...", "https://www.youtube.com/watch?v=...", "https://vimeo.com/...", "https://www.dailymotion.com/video/...", "https://www.notion.so/...", "https://example.notion.site/...", "https://www.evernote.com/shard/...", "https://zoom.us/j/...", "https://www.filmmakers.co.kr/actorsAudition/...", "https://www.dongguk.edu/article/HAKSANOTICE/detail/...");
    const slug_placeholder = new Array("scenario", "scriptbreakdown", "storyboard", "survey", "crewdrive", "crewdirectory", "crewfolder", "kdgfilmography", "reference", "cutedited", "colorgraded", "crewworkspace", "crewwebsite", "filmnote", "crewmeeting", "audition", "notice");
    const title_placeholder = new Array("<영화> 시나리오", "<영화> 일촬표", "<영화> 스토리보드", "설문조사", "<영화> 팀 드라이브", "<영화> 팀 연락처", "<영화> 팀 공유 폴더", "김동국 필모그래피", "<영화> 촬영 레퍼런스", "<영화> 컷편집본", "<영화> 색보정본", "<영화> 팀 워크스페이스", "<영화> 팀 웹사이트", "필름 노트", "<영화> 팀 화상회의", "<영화> 배우 오디션", "학사 공지사항");
    const [id_target_url_placeholder, id_slug_placeholder, id_title_placeholder] = randomItem(target_url_placeholder, slug_placeholder, title_placeholder);

    id_target_url.value = null;
    id_slug.value = null;
    id_title.value = null;
    id_category.value = null;
    id_category_work.checked = false;
    id_category_dept.checked = false;
    id_expiration_date.value = null;
    id_expiration_date.placeholder = yyyymmddWithDash;
    id_target_url.placeholder = id_target_url_placeholder;
    id_slug.placeholder = id_slug_placeholder;
    id_title.placeholder = id_title_placeholder;

    inputs.forEach((input) => {
        displayError(false, input);
    });

    [id_create_or_update_dflink, id_delete_dflink].forEach(button => {
        displayButtonMsg(false, button, "error");
    });
}

function initModal() {
    const class_keywords = document.querySelectorAll(".class-keyword");
    const class_creates = document.querySelectorAll(".class-create");
    const class_adjusts = document.querySelectorAll(".class-adjust");

    function openModal(action, datasetObj = null) {
        // action: all
        id_modal.hidden = false;
        id_modal.setAttribute("x-data", "{ open: true }");
        toggleFocusOnModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
        sessionStorage.setItem("scrollPosition", window.scrollY);
        modalOpen = true;

        // action: create
        if (action == "create") {
            class_keywords.forEach(keyword => {
                keyword.innerText = "만들기";
            });
            initForm();
            id_delete_dflink.classList.replace("inline-flex", "hidden");
        }

        // action: adjust
        else if (action == "adjust") {
            const data = datasetObj.dataset;

            openModal("create");
            class_keywords.forEach(keyword => {
                keyword.innerText = "수정하기";
            });
            id_link_id.value = data.linkId;
            id_target_url.value = data.targetUrl;
            id_target_url_original.value = data.targetUrlOriginal;
            id_slug.value = data.slug;
            id_slug_original.value = data.slugOriginal;
            id_title.value = data.title;
            id_title_original.value = data.titleOriginal;
            if (data.category == "작품") {
                id_category.value = "작품";
                id_category_work.checked = true;
            } else if (data.category == "학과") {
                id_category.value = "학과";
                id_category_dept.checked = true;
            };
            id_category_original.value = data.categoryOriginal;
            id_expiration_date.value = data.expirationDate;
            id_expiration_date_original.value = data.expirationDateOriginal;
            id_delete_dflink.classList.replace("hidden", "inline-flex");
            id_delete_dflink_text_content.innerText = "삭제하기";
            askedTwice = false;
            clearTimeout(askedTwiceTimer);
        };
    };

    // Users who want to create
    class_creates.forEach(create => {
        ["click", "keyup"].forEach(type => {
            create.addEventListener(type, event => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    openModal("create");
                };
            });
        });
    });

    // Users who want to update or delete
    class_adjusts.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, event => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    openModal("adjust", adjust);
                };
            });
        });
    });
}

initModal();

function detectHashLinkClick() {
    document.addEventListener("click", event => {
        const closestAnchor = event.target.closest("a");

        if (closestAnchor) {
            lastClickedWasHash = closestAnchor.getAttribute("href").startsWith("#");
        };
    });
}

detectHashLinkClick();

function preventGoBack() {
    const id_create_or_update_dflink_descr = code(id_create_or_update_dflink, "_descr");
    const id_delete_dflink_descr = code(id_delete_dflink, "_descr");
    const id_delete_dflink_error = code(id_delete_dflink, "_error");

    if (currentHistoryLength == history.length) {
        history.pushState(null, null, location.href);
    };

    window.onpopstate = function () {
        if (modalOpen) {
            history.pushState(null, null, location.href);
            if (id_create_or_update_dflink_descr.hidden && id_delete_dflink_descr.hidden && id_delete_dflink_error.hidden) {
                id_modal.setAttribute("x-data", "{ open: false }");
                toggleFocusOnModal(false);
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

function alertNonexistentLink() {
    if (window.location.search.indexOf("nonexistent-link") != -1) { displayNoti(true, "INL") };
}

alertNonexistentLink();

//
// Main functions
//

function requestCreateDflink() {
    request.url = `${originLocation}/dflink/utils/dflink`;
    request.type = "GET";
    request.data = { id: "create_dflink", target_url: `${id_target_url.value}`, slug: `${id_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
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
    request.data = { id: "update_dflink", link_id: `${id_link_id.value}`, target_url: `${id_target_url.value}`, slug: `${id_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
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
    request.data = { id: "delete_dflink", link_id: `${id_link_id.value}`, target_url: `${id_target_url_original.value}`, slug: `${id_slug_original.value}`, title: `${id_title_original.value}`, category: `${id_category_original.value}`, expiration_date: `${id_expiration_date_original.value}` };
    request.async = true;
    request.headers = null;
    code(id_delete_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    const stepOnes = document.querySelectorAll(".step-one");
    let filteredInputs = [];

    window.addEventListener("pageshow", function (event) {
        if (id_modal != null) {
            // Init
            const id_expiration_date_help = code(id_expiration_date, "_help");
            const categoryInputs = document.querySelectorAll("input[name='id_category']");

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
                id_create_or_update_dflink.addEventListener(type, event => {
                    let target = event.target;

                    if ((type === "click" && target.tagName === "SPAN") ||
                        (type === "click" && target.tagName === "BUTTON") ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && target.tagName !== "BUTTON")) {
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
                id_delete_dflink.addEventListener(type, (event) => {
                    let target = event.target;

                    if ((type === "click" && target.tagName === "SPAN") ||
                        (type === "click" && target.tagName === "BUTTON") ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && target.tagName !== "BUTTON")) {
                        if (!askedTwice) {
                            id_delete_dflink_text_content.innerText = "정말 삭제하기";
                            askedTwice = true;
                            askedTwiceTimer = setTimeout(() => {
                                id_delete_dflink_text_content.innerText = "삭제하기";
                                askedTwice = false;
                            }, 5000);
                        } else if (askedTwice) {
                            clearTimeout(askedTwiceTimer);
                            requestDeleteDflink();
                            displayButtonMsg(true, id_delete_dflink, "descr", "잠시만 기다려주세요.");
                            askedTwice = false;
                        };
                    };
                });
            });
        };
    });
}

setPage();