//
// Global variables
//

// modal
const id_modal = document.getElementById("id_modal");
const id_link_id = document.getElementById("id_link_id");
const id_target_url = document.getElementById("id_target_url");
const id_original_target_url = code("id_original_", id_target_url);
const id_slug = document.getElementById("id_slug");
const id_original_slug = code("id_original_", id_slug);
const id_title = document.getElementById("id_title");
const id_original_title = code("id_original_", id_title);
const id_category = document.getElementById("id_category");
const id_original_category = code("id_original_", id_category);
const id_category_work = code(id_category, "_work");
const id_category_dept = code(id_category, "_dept");
const id_expiration_date = document.getElementById("id_expiration_date");
const id_original_expiration_date = code("id_original_", id_expiration_date);
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");

// boolean
let isItDoubleChecked = false;

// miscellaneous
let doubleCheckTimer;

//
// Sub functions
//

function notifyLinkNotFound() {
    if (window.location.search.indexOf("nonexistent-link") !== -1) { displayNoti(true, "DFLINK_DOES_NOT_EXIST") };
}

notifyLinkNotFound();

//
// Main functions
//

function initForm() {
    const id_target_url_placeholder_array = new Array("https://docs.google.com/document/d/...", "https://docs.google.com/spreadsheets/d/...", "https://docs.google.com/presentation/d/...", "https://docs.google.com/forms/d/...", "https://drive.google.com/drive/folders/...", "https://drive.google.com/file/d/...", "https://www.dropbox.com/s/...", "https://www.youtube.com/playlist?list=...", "https://www.youtube.com/watch?v=...", "https://vimeo.com/...", "https://www.dailymotion.com/video/...", "https://www.notion.so/...", "https://example.notion.site/...", "https://www.evernote.com/shard/...", "https://zoom.us/j/...", "https://www.filmmakers.co.kr/actorsAudition/...", "https://www.dongguk.edu/article/HAKSANOTICE/detail/...");
    const id_slug_placeholder_array = new Array("film-scenario", "film-script-breakdown", "film-storyboard", "film-crew-survey", "film-crew-drive", "film-crew-directory", "film-crew-folder", "kim-filmography", "film-reference", "film-cut-edited", "film-color-graded", "film-crew-workspace", "film-crew-website", "kim-film-note", "film-crew-meeting", "film-audition", "dgu-notice");
    const id_title_placeholder_array = new Array("<영화> 시나리오", "<영화> 일촬표", "<영화> 스토리보드", "<영화> 팀 저녁 메뉴 정하기", "<영화> 팀 드라이브", "<영화> 팀 연락처", "<영화> 팀 공유 폴더", "김동국 필모그래피", "<영화> 레퍼런스", "<영화> 컷편집본", "<영화> 색보정본", "<영화> 팀 워크스페이스", "<영화> 팀 웹사이트", "김동국 필름 노트", "<영화> 팀 화상회의", "<영화> 배우 오디션", "학과 공지사항");
    const [id_target_url_placeholder, id_slug_placeholder, id_title_placeholder] = randomItem(id_target_url_placeholder_array, id_slug_placeholder_array, id_title_placeholder_array);
    const id_expiration_date_help = code(id_expiration_date, "_help");
    const class_categories = document.querySelectorAll(".class-category");

    id_target_url.value = null;
    id_target_url.placeholder = id_target_url_placeholder;
    id_slug.value = null;
    id_slug.placeholder = id_slug_placeholder;
    id_title.value = null;
    id_title.placeholder = id_title_placeholder;
    id_category.value = null;
    id_category_work.checked = false;
    id_category_dept.checked = false;

    class_categories.forEach(category => {
        category.addEventListener("click", () => {
            id_category.value = category.value;
        });
    });

    id_expiration_date.value = null;
    id_expiration_date.placeholder = yyyymmddOfAfter90DaysWithDash;
    id_expiration_date.min = yyyymmddWithDash;
    id_expiration_date.max = yyyymmddOfAfter90DaysWithDash;
    id_expiration_date_help.innerText = `유효 범위는 ${yyyymmddWithDash}부터 ${yyyymmddOfAfter90DaysWithDash}까지예요.`;

    inputs.forEach((input) => {
        displayError(false, input);
    });

    [id_create_or_update, id_delete].forEach(button => {
        displayButtonMsg(false, button, "error");
    });
}

function updateForm(action, datasetObj = null) {
    const class_keywords = document.querySelectorAll(".class-keyword");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    handleFocusForModal(true, id_modal);  // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // action: "create"
    if (action === "create") {
        class_keywords.forEach(keyword => {
            keyword.innerText = "만들기";
        });

        initForm();
        id_delete.classList.replace("inline-flex", "hidden");
    }

    // action: "adjust"
    else if (action === "adjust") {
        const data = datasetObj.dataset;

        updateForm("create");

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        id_link_id.value = data.linkId;
        id_target_url.value = data.targetUrl;
        id_original_target_url.value = data.originalTargetUrl;
        id_slug.value = data.slug;
        id_original_slug.value = data.originalSlug;
        id_title.value = data.title;
        id_original_title.value = data.originalTitle;

        if (data.category === "작품") {
            id_category.value = "작품";
            id_category_work.checked = true;
        } else if (data.category === "학과") {
            id_category.value = "학과";
            id_category_dept.checked = true;
        };

        id_original_category.value = data.originalCategory;
        id_expiration_date.value = data.expirationDate;
        id_original_expiration_date.value = data.originalExpirationDate;
        id_delete.classList.replace("hidden", "inline-flex");
        id_delete_text.innerText = "삭제하기";
        isItDoubleChecked = false;
        clearTimeout(doubleCheckTimer);
    };

    initTabIndex(id_modal);
}

function initModal() {
    const class_creates = document.querySelectorAll(".class-create");
    const class_adjusts = document.querySelectorAll(".class-adjust");  // Update or delete

    class_creates.forEach(create => {
        ["click", "keyup"].forEach(type => {
            create.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("create");
                };
            });
        });
    });

    class_adjusts.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("adjust", adjust);
                };
            });
        });
    });
}

initModal();

function requestCreateDflink() {
    request.url = `${location.origin}/dflink/utils/dflink/`;
    request.type = "GET";
    request.data = { id: "create_dflink", target_url: `${id_target_url.value}`, slug: `${id_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateDflink() {
    request.url = `${location.origin}/dflink/utils/dflink/`;
    request.type = "GET";
    request.data = { id: "update_dflink", link_id: `${id_link_id.value}`, target_url: `${id_target_url.value}`, slug: `${id_slug.value}`, title: `${id_title.value}`, category: `${id_category.value}`, expiration_date: `${id_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteDflink() {
    request.url = `${location.origin}/dflink/utils/dflink/`;
    request.type = "GET";
    request.data = { id: "delete_dflink", link_id: `${id_link_id.value}`, target_url: `${id_original_target_url.value}`, slug: `${id_original_slug.value}`, title: `${id_original_title.value}`, category: `${id_original_category.value}`, expiration_date: `${id_original_expiration_date.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        if (id_modal !== null) {
            const class_firsts = document.querySelectorAll(".class-first");

            initValidation(class_firsts, id_create_or_update);

            ["click", "keyup"].forEach(type => {
                id_create_or_update.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (isItOkayToSubmitForm()) {
                            const id_create_or_update_spin = code(id_create_or_update, "_spin");

                            if (id_create_or_update.innerText.trim() === "만들기") {
                                requestCreateDflink();
                            } else if (id_create_or_update.innerText.trim() === "수정하기") {
                                requestUpdateDflink();
                            };

                            displayButtonMsg(true, id_create_or_update, "descr", "잠시만 기다려주세요.");
                            displayButtonMsg(false, id_create_or_update, "error");
                            id_create_or_update_spin.classList.remove("hidden");
                        } else {
                            inputs.forEach(input => {
                                controlError(input);
                            });
                        };
                    };

                    ["keydown", "focusin"].forEach(type => {
                        inputs.forEach(input => {
                            input.addEventListener(type, () => {
                                displayButtonMsg(false, id_create_or_update, "error");
                            });
                        });
                    });
                });

                id_delete.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (!isItDoubleChecked) {
                            id_delete_text.innerText = "정말 삭제하기";
                            isItDoubleChecked = true;

                            doubleCheckTimer = setTimeout(() => {
                                id_delete_text.innerText = "삭제하기";
                                isItDoubleChecked = false;
                            }, 5000);
                        } else if (isItDoubleChecked) {
                            const id_delete_spin = code(id_delete, "_spin");

                            clearTimeout(doubleCheckTimer);
                            requestDeleteDflink();
                            displayButtonMsg(true, id_delete, "descr", "잠시만 기다려주세요.");
                            displayButtonMsg(false, id_create_or_update, "error");
                            id_delete_spin.classList.remove("hidden");
                            isItDoubleChecked = false;
                        };
                    };
                });
            });
        };
    });
}

initRequest();