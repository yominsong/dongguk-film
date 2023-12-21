//
// Global constants and variables
//

const id_search_dflink = document.getElementById("id_search_dflink");
const id_search_dflink_init = document.getElementById("id_search_dflink_init");
const id_dflink_q = document.getElementById("id_dflink_q");
const id_dflink_modal = document.getElementById("id_dflink_modal");
const id_string_id = document.getElementById("id_string_id");
const id_original_url = document.getElementById("id_original_url");
const id_dflink_slug = document.getElementById("id_dflink_slug");
const id_dflink_slug_original = document.getElementById("id_dflink_slug_original");
const id_title = document.getElementById("id_title");
const id_category_work = document.getElementById("id_category_work");
const id_category_dept = document.getElementById("id_category_dept");
const id_category = document.getElementById("id_category");
const id_expiration_date = document.getElementById("id_expiration_date");
const id_create_or_update_dflink = document.getElementById("id_create_or_update_dflink");
const id_delete_dflink = document.getElementById("id_delete_dflink");
const url_placeholder = new Array("https://docs.google.com/document/d/...", "https://docs.google.com/spreadsheets/d/...", "https://docs.google.com/presentation/d/...", "https://docs.google.com/forms/d/...", "https://drive.google.com/drive/folders/...", "https://drive.google.com/file/d/...", "https://www.dropbox.com/s/...", "https://www.youtube.com/playlist?list=...", "https://www.youtube.com/watch?v=...", "https://vimeo.com/...", "https://www.dailymotion.com/video/...", "https://www.notion.so/...", "https://example.notion.site/...", "https://www.evernote.com/shard/...", "https://zoom.us/j/...", "https://www.filmmakers.co.kr/actorsAudition/...", "https://www.dongguk.edu/article/HAKSANOTICE/detail/...");
const slug_placeholder = new Array("scenario", "scriptbreakdown", "storyboard", "survey", "crewdrive", "crewdirectory", "crewfolder", "kdgfilmography", "reference", "cutedited", "colorgraded", "crewworkspace", "crewwebsite", "filmnote", "crewmeeting", "audition", "notice");
const title_placeholder = new Array("<영화> 시나리오", "<영화> 일촬표", "<영화> 스토리보드", "설문조사", "<영화> 팀 드라이브", "<영화> 팀 연락처", "<영화> 팀 공유 폴더", "김동국 필모그래피", "<영화> 촬영 레퍼런스", "<영화> 컷편집본", "<영화> 색보정본", "<영화> 팀 워크스페이스", "<영화> 팀 웹사이트", "필름 노트", "<영화> 팀 화상회의", "<영화> 배우 오디션", "학사 공지사항");

let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];
let currentHistoryLength = history.length;
let lastClickedWasHash = false;
let modalOpen = false;
let askedTwice = false;
let askedTwiceTimer;

//
// Sub functions
//

function search() {
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
            if (type == "click" || event.key == "Enter" || event.key == " ") {
                location.href = `${originLocation}/dflink/?q=${id_dflink_q.value}`;
                id_dflink_q.readOnly = true;
                id_search_dflink.disabled = true;
            };
        });
    });
}

search();

function initForm() {
    let [id_original_url_placeholder, id_dflink_slug_placeholder, id_title_placeholder] = randomItem(url_placeholder, slug_placeholder, title_placeholder);

    id_original_url.value = null;
    id_dflink_slug.value = null;
    id_title.value = null;
    id_category.value = null;
    id_category_work.checked = false;
    id_category_dept.checked = false;
    id_expiration_date.value = null;
    id_original_url.placeholder = id_original_url_placeholder;
    id_dflink_slug.placeholder = id_dflink_slug_placeholder;
    id_title.placeholder = id_title_placeholder;
    inputs.forEach((input) => {
        displayError(false, input);
    });
    displayButtonMsg(false, id_create_or_update_dflink, "error");
    displayButtonMsg(false, id_delete_dflink, "error");
}

function initModal() {
    let class_keywords = document.querySelectorAll(".class-keyword");
    let class_creates = document.querySelectorAll(".class-create");
    let class_adjusts = document.querySelectorAll(".class-adjust");

    function openModal(action, datasetObj = null) {
        // action: all
        id_dflink_modal.hidden = false;
        id_dflink_modal.setAttribute("x-data", "{ open: true }");
        disableFocusOutsideModal(id_dflink_modal);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && id_dflink_modal.getAttribute("x-data") == "{ open: true }") {
                enableFocus();
            };
        });
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
            let data = datasetObj.dataset;
            let [
                dflinkId, dflinkOriginalUrl, dflinkSlug, dflinkSlugOriginal, dflinkTitle, dflinkCategory, dflinkExpirationDate
            ] = [
                    data.dflinkId, data.dflinkOriginalUrl, data.dflinkSlug, data.dflinkSlugOriginal, data.dflinkTitle, data.dflinkCategory, data.dflinkExpirationDate
                ]

            openModal("create");
            class_keywords.forEach(keyword => {
                keyword.innerText = "수정하기";
            });
            id_string_id.value = dflinkId;
            id_original_url.value = dflinkOriginalUrl;
            id_dflink_slug.value = dflinkSlug;
            id_dflink_slug_original.value = dflinkSlug;
            id_title.value = dflinkTitle;
            if (dflinkCategory == "작품") {
                id_category.value = "작품";
                id_category_work.checked = true;
            } else if (dflinkCategory == "학과") {
                id_category.value = "학과";
                id_category_dept.checked = true;
            };
            id_expiration_date.value = dflinkExpirationDate;
            id_delete_dflink.classList.replace("hidden", "inline-flex");
            id_delete_dflink_inner_text.innerText = "삭제하기";
            askedTwice = false;
            clearTimeout(askedTwiceTimer);
        };
    };

    // Users who want to create
    class_creates.forEach(create => {
        ["click", "keyup"].forEach(type => {
            create.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    openModal("create");
                };
            });
        });
    });

    // Users who want to update or delete
    class_adjusts.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    openModal("adjust", adjust);
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
            if (id_create_or_update_dflink_descr.hidden && id_delete_dflink_descr.hidden && id_delete_dflink_error.hidden) {
                id_dflink_modal.setAttribute("x-data", "{ open: false }");
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
    request.data = { id: "delete_dflink", string_id: `${id_string_id.value}`, original_url: `${id_original_url.value}`, dflink_slug: `${id_dflink_slug_original.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    code(id_delete_dflink, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    window.addEventListener("pageshow", function (event) {
        // Detect the web browser's back/forward buttons
        if (event.persisted) {
            // Enable Search
            id_dflink_q.readOnly = false;
            id_dflink_q.value = urlParams.get("q");
            id_search_dflink.disabled = false;
        };

        if (id_dflink_modal != null) {
            // Init
            let categoryInputs = document.querySelectorAll("input[name='id_category']");
            id_expiration_date.setAttribute("min", yyyymmddWithDash);
            id_expiration_date.setAttribute("max", yyyymmddOfAfter90DaysWithDash);
            id_expiration_date_help.innerText = `유효범위는 ${yyyymmddWithDash}부터 ${yyyymmddOfAfter90DaysWithDash}까지예요.`;
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
                    let target = event.target;
    
                    if ((type === "click" && target.tagName === "SPAN") ||
                        (type === "click" && target.tagName === "BUTTON") ||
                        (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON")) {
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
                        (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON")) {
                        if (!askedTwice) {
                            id_delete_dflink_inner_text.innerText = "정말 삭제하기";
                            askedTwice = true;
                            askedTwiceTimer = setTimeout(() => {
                                id_delete_dflink_inner_text.innerText = "삭제하기";
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