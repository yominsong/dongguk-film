//
// Global constants and variables
//

const id_search_notice = document.getElementById("id_search_notice");
const id_search_notice_init = document.getElementById("id_search_notice_init");
const id_notice_q = document.getElementById("id_notice_q");
const id_notice_list = document.getElementById("id_notice_list");
const id_notice_detail = document.getElementById("id_notice_detail");
const id_notice_modal = document.getElementById("id_notice_modal");
const id_notice_modal_land = document.getElementById("id_notice_modal_land");
const id_notice_modal_form = document.getElementById("id_notice_modal_form");
const id_notice_modal_share = document.getElementById("id_notice_modal_share");
const id_notice_data = document.getElementById("id_notice_data");
const id_page_id = document.getElementById("id_page_id");
const id_block_id_list = document.getElementById("id_block_id_list");
const id_title = document.getElementById("id_title");
const id_category_serv = document.getElementById("id_category_serv");
const id_category_dept = document.getElementById("id_category_dept");
const id_category = document.getElementById("id_category");
const id_content = document.getElementById("id_content");
const id_drop_file = document.getElementById("id_drop_file");
const id_file = document.getElementById("id_file");
const id_attach_file = document.getElementById("id_attach_file")
const id_keyword = document.getElementById("id_keyword");
const id_url = document.getElementById("id_url");
const id_copy_url = document.getElementById("id_copy_url");
const id_copy_url_ready = document.getElementById("id_copy_url_ready");
const id_copy_url_done = document.getElementById("id_copy_url_done");
const id_copy_url_descr = document.getElementById("id_copy_url_descr");
const id_create_or_update_notice = document.getElementById("id_create_or_update_notice");
const id_delete_notice = document.getElementById("id_delete_notice");
const title_placeholder = [
    { s: "1225", e: "0125", t: `${now.getFullYear()}학년도 1학기 복학 신청 안내` },
    { s: "0101", e: "0131", t: `${now.getFullYear()}학년도 1학기 희망강의 신청 안내` },
    { s: "0101", e: "0225", t: `${now.getFullYear()}학년도 1학기 수강신청 안내` },
    { s: "0125", e: "0205", t: `${now.getFullYear()}학년도 1학기 등록금 납부 안내` },
    { s: "0120", e: "0210", t: `${now.getFullYear()}학년도 봄 학위수여식 안내` },
    { s: "0201", e: "0215", t: `${now.getFullYear()}학년도 촬영 협조공문 발급 안내` },
    { s: "0210", e: "0220", t: `${now.getFullYear()}학년도 봄 학위수여식 졸업가운 및 학사모 대여 안내` },
    { s: "0225", e: "0310", t: `${now.getFullYear()}학년도 1학기 수강신청 확인 및 정정 기간 안내` },
    { s: "0301", e: "0331", t: `${now.getFullYear()}학년도 1학기 학과 제작지원비 안내` },
    { s: "0301", e: "0331", t: `${now.getFullYear()}학년도 1학기 학교현장실습 시행 안내` },
    { s: "0301", e: "0531", t: `${now.getFullYear()}학년도 1학기 캡스톤디자인 운영계획` },
    { s: "0325", e: "0425", t: `제${now.getFullYear() - 2000 + 1}회 전주국제영화제 참가 관련 협조공문 발급 안내` },
    { s: "0401", e: "0430", t: `${now.getFullYear()}학년도 교직과정 이수예정자 선발 안내` },
    { s: "0501", e: "0520", t: `${now.getFullYear()}학년도 여름계절학기 시행 안내` },
    { s: "0501", e: "0520", t: `${now.getFullYear()}학년도 가을 졸업대상자 졸업논문 제출 안내` },
    { s: "0501", e: "0531", t: `${now.getFullYear()}학년도 1학기 성적처리 일정 및 유의사항 안내` },
    { s: "0601", e: "0630", t: `${now.getFullYear()}학년도 1학기 캡스톤디자인 최종보고서 제출 안내` },
    { s: "0625", e: "0725", t: `${now.getFullYear()}학년도 2학기 복학 신청 안내` },
    { s: "0701", e: "0731", t: `${now.getFullYear()}학년도 2학기 희망강의 신청 안내` },
    { s: "0701", e: "0825", t: `${now.getFullYear()}학년도 2학기 수강신청 안내` },
    { s: "0720", e: "0810", t: `${now.getFullYear()}학년도 가을 학위수여식 안내` },
    { s: "0725", e: "0805", t: `${now.getFullYear()}학년도 2학기 등록금 납부 안내` },
    { s: "0810", e: "0820", t: `${now.getFullYear()}학년도 가을 학위수여식 졸업가운 및 학사모 대여 안내` },
    { s: "0825", e: "0910", t: `${now.getFullYear()}학년도 2학기 수강신청 확인 및 정정 기간 안내` },
    { s: "0901", e: "0930", t: `${now.getFullYear()}학년도 2학기 학과 제작지원비 안내` },
    { s: "0901", e: "0930", t: `${now.getFullYear()}학년도 2학기 학교현장실습 시행 안내` },
    { s: "0901", e: "1130", t: `${now.getFullYear()}학년도 2학기 캡스톤디자인 운영계획` },
    { s: "0915", e: "1015", t: `제${now.getFullYear() - 1996 + 1}회 부산국제영화제 시네필 발급 안내` },
    { s: "0915", e: "1015", t: `제${now.getFullYear() - 1996 + 1}회 부산국제영화제 참가 관련 협조공문 발급 안내` },
    { s: "1101", e: "1120", t: `${now.getFullYear()}학년도 겨울계절학기 시행 안내` },
    { s: "1101", e: "1120", t: `${now.getFullYear() + 1}학년도 봄 졸업대상자 졸업논문 제출 안내` },
    { s: "1201", e: "1231", t: `${now.getFullYear()}학년도 2학기 성적처리 일정 및 유의사항` },
    { s: "1201", e: "1231", t: `${now.getFullYear()}학년도 2학기 캡스톤디자인 최종보고서 제출 안내` }
];
const filtered_title_placeholder = title_placeholder.filter(item => isCurrentDateInRange(String(now.getFullYear()) + item.s, String(now.getFullYear()) + item.e));
const id_go_to_list = document.getElementById("id_go_to_list");

let stepOnes = document.querySelectorAll(".step-one");
let filteredInputs = [];
let ckEditor, ckElements, toolbarViewRoot, textboxModel, textboxViewRoot;

let selectedFiles;
let attachedFiles = [];
let totalSize = 0;
let counts = document.querySelectorAll(".class-count");
let measures = document.querySelectorAll(".class-measure");
let isAdded = false;

let currentHistoryLength = history.length;
let lastClickedWasHash = false;
let modalOpen = false;
let askedTwice = false;
let askedTwiceTimer;

//
// Sub functions
//

function search() {
    if (id_notice_q !== null) {
        if (urlParams.has("q")) {
            id_notice_q.value = urlParams.get("q");
            ["click", "keyup"].forEach(type => {
                id_search_notice_init.addEventListener(type, (event) => {
                    if (type == "click" || event.key == "Enter" || event.key == " ") {
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
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    location.href = `${originLocation}/notice/?q=${id_notice_q.value}`;
                    id_notice_q.readOnly = true;
                    id_search_notice.disabled = true;
                };
            });
        });
    };
}

search();

function initForm() {
    // title, category
    let id_title_placeholder = randomItem(filtered_title_placeholder);
    let radioInputs = document.querySelectorAll("input[name='id_category']");

    id_title.value = null;
    id_title.placeholder = id_title_placeholder.t;
    id_category.value = null;
    id_category_serv.checked = false;
    id_category_dept.checked = false;

    inputs.forEach((input) => {
        displayError(false, input);
    });

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
                const otherLabel = i.closest("label");
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

    // content
    ckEditor.setData("");

    // file
    let lists = document.querySelectorAll(".class-list");
    let isFocused = false;
    let isHovered = false;
    let isDragging = false;

    id_file.value = null;
    attachedFiles.length = 0;
    totalSize = 0;
    lists.forEach(list => { list.remove() });
    updateStyle();

    function updateStyle() {
        let outline = "none";
        let attachBoxShadow = "none";
        let attachBackgroundColor = "transparent";
        let dropBoxShadow = "inset 0 0 0 1px rgb(209 213 219)";
        let dropBackGroundColor = "transparent";

        counts.forEach(count => {
            if (attachedFiles.length == 0) {
                if (count.classList.contains("class-desktop")) {
                    count.innerText = "파일을 이곳에 끌어다 놓으세요.";
                } else if (count.classList.contains("class-mobile")) {
                    count.innerText = "파일을 첨부하세요.";
                };
            } else {
                count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
            };
        });

        measures.forEach(measure => {
            measure.innerText = `${(totalSize / (1024 * 1024)).toFixed(2)}MB/5MB`;
        });

        if (isFocused && isHovered) {
            attachBoxShadow = "inset 0 0 0 2px #F15922";
            attachBackgroundColor = "rgb(249 250 251)";
        } else if (isFocused) {
            attachBoxShadow = "inset 0 0 0 2px #F15922";
        } else if (isHovered) {
            attachBoxShadow = "inset 0px -1px 0px 0px rgb(209 213 219), inset -1px 0px 0px 0px rgb(209 213 219), inset 1px 0px 0px 0px rgb(209 213 219)";
            attachBackgroundColor = "rgb(249 250 251)";
        } else if (isDragging) {
            dropBoxShadow = "inset 0 0 0 2px #F15922";
            dropBackGroundColor = "rgb(249 250 251)";
            counts.forEach(count => { count.innerText = "파일을 놓으세요." });
        };

        id_attach_file.style.outline = outline;
        id_attach_file.style.boxShadow = attachBoxShadow;
        id_attach_file.style.backgroundColor = attachBackgroundColor;
        id_drop_file.style.boxShadow = dropBoxShadow;
        id_drop_file.style.backgroundColor = dropBackGroundColor;
    }

    function addEventListeners() {
        isAdded = true;

        id_drop_file.addEventListener("dragover", (event) => { event.preventDefault(); id_file.focus(); isDragging = true; updateStyle() });
        id_drop_file.addEventListener("dragleave", () => { isDragging = false; updateStyle() });
        id_drop_file.addEventListener("drop", (event) => { event.preventDefault(); isDragging = false; updateStyle(); attachFile(event) });

        id_file.addEventListener("change", attachFile);

        id_attach_file.addEventListener("focus", () => { isFocused = true; updateStyle() });
        id_attach_file.addEventListener("blur", () => { isFocused = false; updateStyle() });
        id_attach_file.addEventListener("mouseenter", () => { isHovered = true; updateStyle() });
        id_attach_file.addEventListener("mouseleave", () => { isHovered = false; updateStyle() });

        ["click", "keyup"].forEach(type => {
            id_attach_file.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    id_attach_file.focus();
                    id_file.click();
                };
            });
        });
    }

    if (!isAdded) { addEventListeners() };

    // create, update, delete button
    displayButtonMsg(false, id_create_or_update_notice, "error");
    displayButtonMsg(false, id_delete_notice, "error");
}

function initModal() {
    let keywords = document.querySelectorAll(".class-keyword");
    let creates = document.querySelectorAll(".class-create");
    let adjusts = document.querySelectorAll(".class-adjust");
    let shares = document.querySelectorAll(".class-share");

    function openModal(action, datasetObj = null) {
        // action: all
        id_notice_modal.hidden = false;
        id_notice_modal.setAttribute("x-data", "{ open: true }");
        disableFocusOutsideModal(id_notice_modal);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && id_notice_modal.getAttribute("x-data") == "{ open: true }") {
                enableFocus();
            };
        });
        sessionStorage.setItem("scrollPosition", window.scrollY);
        modalOpen = true;

        // action: create
        if (action == "create") {
            resizeModalAndFormWidth(true);
            id_notice_modal_form.hidden = false;
            id_notice_modal_share.hidden = true;
            keywords.forEach(keyword => {
                keyword.innerText = "작성하기";
            });
            initForm();
            ckEditor.destroy();
            initCkEditor();
            id_create_or_update_notice.classList.replace("hidden", "inline-flex");
            id_delete_notice.classList.replace("inline-flex", "hidden");
        }

        // action: adjust / datasetObj: adjust
        else if (action == "adjust") {
            let data = datasetObj.dataset;
            let [
                noticePageId, noticeTitle, noticeCategory, noticeKeyword
            ] = [
                    data.noticePageId, data.noticeTitle, data.noticeCategory, data.noticeKeyword
                ];
            let label, svg;

            openModal("create");
            keywords.forEach(keyword => {
                keyword.innerText = "수정하기";
            });
            id_page_id.value = noticePageId;
            id_title.value = noticeTitle;
            if (noticeCategory == "서비스") {
                id_category.value = "서비스";
                id_category_serv.checked = true;
                label = id_category_serv.closest("label");
            } else if (noticeCategory == "학과") {
                id_category.value = "학과";
                id_category_dept.checked = true;
                label = id_category_dept.closest("label");
            };
            id_keyword.value = noticeKeyword;
            label.classList.remove("df-ring-inset-gray");
            label.classList.add("df-ring-inset-flamingo");
            svg = label.querySelector("svg");
            svg.classList.remove("invisible");
            id_delete_notice.classList.replace("hidden", "inline-flex");
            id_delete_notice_inner_text.innerText = "삭제하기";
            askedTwice = false;
            clearTimeout(askedTwiceTimer);
            setTimeout(() => { freezeCkEditor() }, 0.00001);
            requestReadNotice();
        }

        // action: share
        else if (action == "share") {
            resizeModalAndFormWidth(false);
            if (id_notice_modal_form !== null) { id_notice_modal_form.hidden = true };
            id_notice_modal_share.hidden = false;
            keywords.forEach(keyword => {
                keyword.innerText = "공유하기";
            });
            id_copy_url_ready.classList.remove("hidden");
            id_copy_url_done.classList.add("hidden");
            id_copy_url_descr.hidden = true;
            id_create_or_update_notice.classList.replace("inline-flex", "hidden");
            id_delete_notice.classList.replace("inline-flex", "hidden");
        };
    }

    // Users who want to create
    creates.forEach(create => {
        ["click", "keyup"].forEach(type => {
            create.addEventListener(type, (event) => {
                let target = event.target;

                if ((type === "click" && target.tagName === "SPAN") ||
                    (type === "click" && target.tagName === "DIV") ||
                    (type === "click" && target.tagName === "BUTTON") ||
                    (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON") ||
                    (type === "keyup" && event.key === " " && target.tagName !== "BUTTON")) {
                    openModal("create");
                };
            });
        });
    });

    // Users who want to update or delete
    adjusts.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, (event) => {
                let target = event.target;

                if ((type === "click" && target.tagName === "SPAN") ||
                    (type === "click" && target.tagName === "DIV") ||
                    (type === "click" && target.tagName === "BUTTON") ||
                    (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON") ||
                    (type === "keyup" && event.key === " " && target.tagName !== "BUTTON")) {
                    openModal("adjust", adjust);
                };
            });
        });
    });

    // Users who want to share
    shares.forEach(share => {
        ["click", "keyup"].forEach(type => {
            share.addEventListener(type, (event) => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    openModal("share");
                };
            });
        });
    });
}

initModal();

function initCkEditor() {
    let userIsAuthenticated = document.querySelector("#id_mobile_logout_btn") !== null ? true : false

    if (userIsAuthenticated) {
        ClassicEditor
            .create(document.querySelector("#id_content"), {
                removePlugins: ["Title", "Markdown"],
                language: "ko",
                outputFormat: "html",
                placeholder: "여기에 내용을 입력하세요.",
                mediaEmbed: {
                    previewsInData: true
                }
            })
            .then(editor => {
                ckEditor = editor;
                ckElements = Array.from(document.querySelectorAll(".ck")).filter(element => !(element instanceof SVGElement));
                toolbarViewRoot = ckEditor.ui.view.toolbar.element;
                textboxModel = ckEditor.model.document;
                textboxViewRoot = ckEditor.editing.view.getDomRoot();
                let rysFlag = false;

                textboxModel.on("change:data", () => {
                    let data = ckEditor.getData();
                    let rysRegex = /https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)&amp;ab_channel=([^&\s]+)/;
                    let rysMatch = data.match(rysRegex);

                    if (!rysFlag && rysMatch) {
                        rysFlag = true;
                        displayNoti(true, "RYS");
                    };

                    id_content.value = ckEditor.getData();
                });

                ckElements.forEach((ck) => {
                    ck.addEventListener("focus", () => { displayError(false, id_content) });
                    ck.addEventListener("blur", (event) => {
                        if (!ckElements.includes(event.relatedTarget)) {
                            if ((!ckEditor.getData() || ckEditor.getData().trim() === "")) {
                                displayError(true, id_content, "empty");
                            } else {
                                displayError(false, id_content);
                            };
                        };
                    });
                    ck.addEventListener("keydown", (event) => {
                        if (ck == textboxViewRoot && event.shiftKey && event.key === "Tab") {
                            if (id_category_error.innerText.length == 0) {
                                setTimeout(() => {
                                    toolbarViewRoot.querySelector(".ck-font-size-dropdown").querySelector("button").focus();
                                    displayError(false, id_category);
                                });
                            } else {
                                setTimeout(() => {
                                    toolbarViewRoot.querySelector(".ck-font-size-dropdown").querySelector("button").focus();
                                });
                            };
                        };
                    });
                    ck.addEventListener("click", () => { displayError(false, id_content) });
                });
            })
            .catch(err => {
                console.error(err.stack);
            });
    };
}

initCkEditor();

function freezeCkEditor() {
    ckEditor.setData('<p style="text-align:center;">&nbsp;</p><p style="text-align:center;">&nbsp;</p><p style="text-align:center;">내용을 불러오고 있어요. 🕗</p>');
    ckEditor.enableReadOnlyMode("id_content");
}

function matchDivWidth() {
    let id_notice_modal_land = document.getElementById("id_notice_modal_land");
    let id_content_parent = document.getElementById("id_content_parent");
    let widthBase;

    if (id_notice_list !== null) {
        widthBase = id_notice_list;
    } else if (id_notice_detail !== null) {
        widthBase = id_notice_detail;
    };

    if (id_notice_modal_land !== null) {
        id_notice_modal_land.style.setProperty("width", widthBase.offsetWidth + "px", "important");
        id_content_parent.style.setProperty("width", widthBase.querySelector("div").offsetWidth + "px", "important");
        id_drop_file.style.setProperty("width", widthBase.querySelector("div").offsetWidth + "px", "important");
    };
}

function resizeModalAndFormWidth(bool) {
    if (bool) {
        matchDivWidth();
        window.addEventListener("resize", matchDivWidth);
    } else if (!bool) {
        id_notice_modal_land.style = "display: none";
        window.removeEventListener("resize", matchDivWidth);
    };
}

function isCurrentDateInRange(start, end, currentDate = yyyymmdd) {
    return currentDate >= start && currentDate <= end;
}

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
            if (id_create_or_update_notice_descr.hidden && id_delete_notice_descr.hidden && id_delete_notice_error.hidden) {
                id_notice_modal.setAttribute("x-data", "{ open: false }");
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

function embedMedia() {
    let mediaElements = document.querySelectorAll("figure.media");

    if (mediaElements) {
        mediaElements.forEach(media => {
            let oembed = media.querySelector("oembed");
            let div = media.querySelector("div");

            if (oembed) {
                let url = oembed.getAttribute("url");
                let newStructure = generateNewStructure(url);

                function generateNewStructure(url) {
                    let mediaName, newStructure;

                    if (url.includes("instagram.com")) {
                        mediaName = "인스타그램";
                    } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
                        mediaName = "페이스북";
                    } else if (url.includes("twitter.com")) {
                        mediaName = "트위터";
                    } else if (url.includes("goo.gl")) {
                        mediaName = "구글 지도";
                    };

                    newStructure = `
                    <figure class="media ck-widget" contenteditable="false">
                        <div class="ck-media__wrapper"
                            data-oembed-url="${url}">
                            <div class="ck ck-reset_all ck-media__placeholder">
                                <div class="ck-media__placeholder__icon">
                                    <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color"
                                        viewBox="0 0 64 42">
                                        <path d="M47.426 17V3.713L63.102 0v19.389h-.001l.001.272c0 1.595-2.032 3.43-4.538 4.098-2.506.668-4.538-.083-4.538-1.678 0-1.594 2.032-3.43 4.538-4.098.914-.244 2.032-.565 2.888-.603V4.516L49.076 7.447v9.556A1.014 1.014 0 0 0 49 17h-1.574zM29.5 17h-8.343a7.073 7.073 0 1 0-4.657 4.06v3.781H3.3a2.803 2.803 0 0 1-2.8-2.804V8.63a2.803 2.803 0 0 1 2.8-2.805h4.082L8.58 2.768A1.994 1.994 0 0 1 10.435 1.5h8.985c.773 0 1.477.448 1.805 1.149l1.488 3.177H26.7c1.546 0 2.8 1.256 2.8 2.805V17zm-11.637 0H17.5a1 1 0 0 0-1 1v.05A4.244 4.244 0 1 1 17.863 17zm29.684 2c.97 0 .953-.048.953.889v20.743c0 .953.016.905-.953.905H19.453c-.97 0-.953.048-.953-.905V19.89c0-.937-.016-.889.97-.889h28.077zm-4.701 19.338V22.183H24.154v16.155h18.692zM20.6 21.375v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616V37.53H20.6zm24.233-16.155v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615V37.53h-1.615zM29.485 25.283a.4.4 0 0 1 .593-.35l9.05 4.977a.4.4 0 0 1 0 .701l-9.05 4.978a.4.4 0 0 1-.593-.35v-9.956z">
                                        </path>
                                    </svg>
                                </div>
                                <a class="ck-media__placeholder__url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="${url}"
                                    title="새 탭에서 ${mediaName} 열기">
                                    <span class="ck-media__placeholder__url__text">${url}</span>
                                    <span class="!sr-only">새 탭에서 ${mediaName} 열기</span>
                                </a>
                            </div>
                        </div>
                    </figure>
                    `;

                    return newStructure;
                }

                media.outerHTML = newStructure;
            } else if (div) {
                div.classList.add("ck-media__wrapper");
            };
        });
    };
}

embedMedia();

function attachFile(event = null, sudo = false) {
    let id, name, key, size, readableSize, fileListItem, fileListItemHTML;
    let isDuplicate = false;
    let duplicateFiles = [];
    let failureCount = 0;

    if (sudo == true) {
        selectedFiles = selectedFiles;
    } else if (event instanceof DragEvent) {
        selectedFiles = Array.from(event.dataTransfer.files);
    } else {
        selectedFiles = Array.from(id_file.files);
    };

    selectedFiles.forEach(file => {
        name = file.name;
        size = Number(file.size);

        if (sudo == true) {
            readableSize = file.readableSize;
        } else if (size < 1024 * 1024) {
            readableSize = (size / 1024).toFixed(2) + "KB";
        } else {
            readableSize = (size / (1024 * 1024)).toFixed(2) + "MB";
        };

        if (attachedFiles.some(file => file.name === name && file.size === size)) {
            isDuplicate = true;
            duplicateFiles.push(name);
            console.warn(`The file ${name} is already attached.`);
        } else if (totalSize + size <= 5 * 1024 * 1024) {
            totalSize += size;
            if (sudo == true) {
                id = file.id;
                key = file.key;
                fileObj = { file: null, id: id, name: name, key: key, size: size, readableSize: readableSize };
            } else {
                id = generateUUID();
                key = `${id}_${name}`;
                fileObj = { file: file, id: id, name: name, key: key, size: size, readableSize: readableSize };
            };
            fileListItem = document.createElement("li");
            fileListItem.id = id;
            fileListItem.classList.add("class-list", "relative", "flex", "items-center", "justify-between", "p-4", "text-sm", "leading-6");
            fileListItemHTML = `
                <div class="flex w-0 flex-1 items-center">
                    <svg class="h-5 w-5 flex-shrink-0 text-gray-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true">
                        <path fill-rule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clip-rule="evenodd">
                        </path>
                    </svg>
                    <div class="ml-4 flex flex-col min-w-0 flex-1 sm:flex-row sm:gap-2">
                        <span class="truncate font-medium">${name}</span>
                        <span class="flex-shrink-0 text-gray-400">${readableSize}</span>
                    </div>
                </div>
                <div class="class-detach flex-shrink-0 p-1 -mr-1 -my-1 ml-4 rounded-md cursor-pointer group focus:df-focus-ring-offset-white"
                    tabindex="0">
                    <svg class="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke-width="1.5"
                        stroke="currentColor"
                        onclick="detachFile('${id}')"
                        onkeydown="if (event.key === 'Enter') { detachFile('${id}') }">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            `
            fileListItem.innerHTML = fileListItemHTML;
            attachedFiles.push(fileObj);
            id_attach_file.parentNode.insertBefore(fileListItem, id_attach_file);

            counts.forEach(count => {
                count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
            });

            measures.forEach(measure => {
                measure.innerText = `${(totalSize / (1024 * 1024)).toFixed(2)}MB/5MB`;
            });
        } else {
            failureCount += 1;
            console.warn(`${name} will exceed the 5MB total limit.`);
        };
    });

    if (isDuplicate) { displayNoti(true, "LDF", duplicateFiles.join(", ")) };
    if (failureCount !== 0) { displayNoti(true, "LFS", failureCount) };

    id_file.value = "";
    id_file.tabIndex = "-1";
    failureCount = 0;
}

function detachFile(fileUUID = null) {
    let fileListItem;

    attachedFiles.forEach(function (file, i) {
        if (file.id == fileUUID) {
            totalSize -= file.size;
            attachedFiles.splice(i, 1);
            fileListItem = document.getElementById(file.id);
            fileListItem.remove();
        };

        counts.forEach(count => {
            if (attachedFiles.length == 0) {
                if (count.classList.contains("class-desktop")) {
                    count.innerText = "파일을 이곳에 끌어다 놓으세요.";
                } else if (count.classList.contains("class-mobile")) {
                    count.innerText = "파일을 첨부하세요.";
                };
            } else {
                count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
            };
        });

        measures.forEach(measure => {
            measure.innerText = `${(totalSize / (1024 * 1024)).toFixed(2)}MB/5MB`;
        });
    });
}

function listFile() {
    let downloads = document.querySelectorAll(".class-download");

    if (downloads) {
        downloads.forEach((download, index) => {
            let aTag = download.querySelector("a");

            if (downloads.length == 1) {
                download.classList.add("rounded-md");
                aTag.classList.add("rounded-md");
            } else if (index == 0) {
                download.classList.add("rounded-t-md");
                aTag.classList.add("rounded-t-md");
            } else if (index == downloads.length - 1) {
                download.classList.add("rounded-b-md");
                aTag.classList.add("rounded-b-md");
            };
        });
    };
}

listFile();

function freezeFileForm(boolean) {
    let detaches = document.querySelectorAll(".class-detach");

    if (boolean) {
        id_drop_file.style.backgroundColor = "rgb(243 244 246)";
        id_drop_file.nextElementSibling.classList.remove("hidden");
        id_attach_file.tabIndex = -1;
        detaches.forEach(detach => { detach.tabIndex = -1 });
        id_file.disabled = true;

        counts.forEach(count => {
            count.innerText = `잠시만 기다려주세요.`;
        });
    } else if (!boolean) {
        id_drop_file.style.backgroundColor = "transparent";
        id_drop_file.nextElementSibling.classList.add("hidden");
        id_attach_file.tabIndex = 0;
        detaches.forEach(detach => { detach.tabIndex = 0 });
        id_file.disabled = false;

        counts.forEach(count => {
            if (count.classList.contains("class-desktop")) {
                count.innerText = "파일을 이곳에 끌어다 놓으세요.";
            } else if (count.classList.contains("class-mobile")) {
                count.innerText = "파일을 첨부하세요.";
            };
        });
    };
}

function copyNoticeUrl() {
    id_url.addEventListener("click", () => {
        id_url.select();
    });

    id_copy_url.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(id_url.value);
        } catch (e) {
            id_url.select();
            document.execCommand("copy"); // deprecated, but used for KakaoTalk in-app browser
        };

        id_copy_url_ready.classList.add("hidden");
        id_copy_url_done.classList.remove("hidden");
        id_copy_url_descr.hidden = false;
        id_copy_url_done.classList.add("blink");

        setTimeout(() => { id_copy_url_done.classList.remove("blink") }, 3000);
    });
}

if (id_copy_url !== null) { copyNoticeUrl() };


function share() {
    let data = id_notice_data.dataset;
    let [
        noticeTitle, noticeCategory, noticeKeyword, noticeUserName, noticeUserProfileImg, noticeListedDate
    ] = [
            data.noticeTitle, data.noticeCategory, data.noticeKeyword, data.noticeUserName, data.noticeUserProfileImg, data.noticeListedDate
        ];

    Kakao.init("36080e7fa227c8f75e1b351c53d2c77c");
    id_kakaotalk.addEventListener("click", () => {
        Kakao.Share.sendDefault({
            objectType: "feed",
            itemContent: {
                profileText: noticeUserName,
                profileImageUrl: noticeUserProfileImg,
            },
            content: {
                title: noticeTitle,
                description: `${noticeListedDate} · ${noticeCategory}\n${noticeKeyword}`,
                imageUrl:
                    "https://dongguk.film/static/images/d_dot_f_logo.jpg",
                link: {
                    mobileWebUrl: `${originLocation}${location.pathname}`,
                    webUrl: `${originLocation}${location.pathname}`,
                },
            },
            buttons: [
                {
                    title: "디닷에프에서 보기",
                    link: {
                        mobileWebUrl: `${originLocation}${location.pathname}`,
                        webUrl: `${originLocation}${location.pathname}`,
                    },
                },
            ],
        });
    });

    id_x.addEventListener("click", () => {
        let hashtags = noticeKeyword.replace(/\s+/g, "").replace(/#/g, ",").substring(1);
        let xUrl = `https://twitter.com/intent/tweet?text=${noticeTitle}&url=${originLocation}${location.pathname}&hashtags=${hashtags}`;

        window.open(xUrl);
    });

    id_facebook.addEventListener("click", () => {
        let facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${originLocation}${location.pathname}`;

        window.open(facebookUrl);
    });

    id_line.addEventListener("click", () => {
        let lineUrl = `https://social-plugins.line.me/lineit/share?url=${originLocation}${location.pathname}`;

        window.open(lineUrl);
    });
}

if (id_notice_data) { share() };

function goToList() {
    let details = document.querySelectorAll(".class-detail");
    let params = {};

    if (details !== null) {
        details.forEach((detail) => {
            if (location.search !== "") {
                params.previousSearch = location.search;
                detail.href += "?" + new URLSearchParams(params).toString();
            };
        });
    };

    if (id_go_to_list !== null) {
        if (id_go_to_list.previousElementSibling == null) {
            id_go_to_list.classList.remove("mt-3");
        };

        ["click", "keyup"].forEach(type => {
            id_go_to_list.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    let previousSearch = new URLSearchParams(location.search).get("previousSearch");

                    if (previousSearch !== null) {
                        location.href = `${originLocation}/notice${previousSearch}`;
                    } else {
                        location.href = `${originLocation}/notice`;
                    };
                    id_go_to_list.disabled = true;
                };
            });
        });
    };
}

goToList();

//
// Main functions
//

function requestOcrNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "ocr_notice", content: `${id_content.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    freezeFileForm(true);
    displayButtonMsg(true, id_create_or_update_notice, "descr", "잠시만 기다려주세요.");
    displayButtonMsg(false, id_create_or_update_notice, "error");
    displayNoti(false, "RDI");
    makeAjaxCall(request);
    request = {};
}

function requestCreateNotice() {
    let formData = new FormData();

    formData.append("id", "create_notice");
    formData.append("title", id_title.value);
    formData.append("category", id_category.value);
    formData.append("content", id_content.value);

    attachedFiles.forEach((fileObj, index) => {
        formData.append(`file_${index}`, fileObj.file);
        formData.append(`fileId_${index}`, fileObj.id);
        formData.append(`fileName_${index}`, fileObj.name);
        formData.append(`fileKey_${index}`, fileObj.key);
        formData.append(`fileSize_${index}`, fileObj.size);
        formData.append(`fileReadableSize_${index}`, fileObj.readableSize);
    });

    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    code(id_create_or_update_notice, "_spin").classList.remove("hidden");
    freezeForm(true);
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestReadNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "read_notice", page_id: `${id_page_id.value}` };
    request.async = true;
    request.headers = null;
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateNotice() {
    let formData = new FormData();

    formData.append("id", "update_notice");
    formData.append("page_id", id_page_id.value);
    formData.append("title", id_title.value);
    formData.append("category", id_category.value);
    formData.append("block_id_list", id_block_id_list.value);
    formData.append("content", id_content.value);

    attachedFiles.forEach((fileObj, index) => {
        formData.append(`file_${index}`, fileObj.file);
        formData.append(`fileId_${index}`, fileObj.id);
        formData.append(`fileName_${index}`, fileObj.name);
        formData.append(`fileKey_${index}`, fileObj.key);
        formData.append(`fileSize_${index}`, fileObj.size);
        formData.append(`fileReadableSize_${index}`, fileObj.readableSize);
    });

    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    code(id_create_or_update_notice, "_spin").classList.remove("hidden");
    freezeForm(true);
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteNotice() {
    request.url = `${originLocation}/notice/utils/notice`;
    request.type = "POST";
    request.data = { id: "delete_notice", page_id: `${id_page_id.value}`, title: `${id_title.value}`, category: `${id_category.value}`, content: `${id_content.value}`, keyword: `${id_keyword.value}`, file: `${attachedFiles}` };
    request.async = true;
    request.headers = null;
    code(id_delete_notice, "_spin").classList.remove("hidden");
    freezeForm(true);
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    window.addEventListener("pageshow", function (event) {
        // Detect the web browser's back/forward buttons
        if (event.persisted) {
            // Enable Search
            id_notice_q.readOnly = false;
            id_notice_q.value = urlParams.get("q");
            id_search_notice.disabled = false;
        };

        if (id_notice_modal != null) {
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
                    let target = event.target;

                    if ((type === "click" && target.tagName === "SPAN") ||
                        (type === "click" && target.tagName === "BUTTON") ||
                        (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON") ||
                        (type === "keyup" && event.key === " " && target.tagName !== "BUTTON")) {
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
                            displayNoti(false, "RYS");
                            displayNoti(false, "RAT");
                            displayNoti(false, "RDI");
                            displayNoti(false, "EIS");
                            displayNoti(false, "EIF");
                            displayNoti(false, "LDF");
                            displayNoti(false, "LFS");
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
                    let target = event.target;

                    if ((type === "click" && target.tagName === "SPAN") ||
                        (type === "click" && target.tagName === "BUTTON") ||
                        (type === "keyup" && event.key === "Enter" && target.tagName !== "BUTTON") ||
                        (type === "keyup" && event.key === " " && target.tagName !== "BUTTON")) {
                        if (!askedTwice) {
                            id_delete_notice_inner_text.innerText = "정말 삭제하기";
                            askedTwice = true;
                            askedTwiceTimer = setTimeout(() => {
                                id_delete_notice_inner_text.innerText = "삭제하기";
                                askedTwice = false;
                            }, 5000);
                        } else if (askedTwice) {
                            clearTimeout(askedTwiceTimer);
                            requestDeleteNotice();
                            displayButtonMsg(true, id_delete_notice, "descr", "잠시만 기다려주세요.");
                            displayNoti(false, "RYS");
                            displayNoti(false, "RAT");
                            displayNoti(false, "RDI");
                            displayNoti(false, "EIS");
                            displayNoti(false, "EIF");
                            displayNoti(false, "LDF");
                            displayNoti(false, "LFS");
                            askedTwice = false;
                        };
                    };
                });
            });
        };
    });
}

setPage();