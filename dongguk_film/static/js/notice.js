//
// Global variables
//

const id_modal = document.getElementById("id_modal");
const id_modal_base = code(id_modal, "_base");
const id_page_id = document.getElementById("id_page_id");
const id_block_id_list = document.getElementById("id_block_id_list");
const id_title = document.getElementById("id_title");
const id_category = document.getElementById("id_category");
const id_category_serv = document.getElementById("id_category_serv");
const id_category_dept = document.getElementById("id_category_dept");
const id_content = document.getElementById("id_content");
const id_file = document.getElementById("id_file");
const id_drop_file = document.getElementById("id_drop_file");
const id_attach_file = document.getElementById("id_attach_file");
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");
const id_url = document.getElementById("id_url");
const id_copy_url = document.getElementById("id_copy_url");
const id_copy_url_ready = code(id_copy_url, "_ready");
const id_copy_url_done = code(id_copy_url, "_done");
const id_copy_url_descr = code(id_copy_url, "_descr");

const id_detail = document.getElementById("id_detail");

const class_counts = document.querySelectorAll(".class-count");
const class_measures = document.querySelectorAll(".class-measure");

let isFocused = false;
let isHovered = false;
let isDragging = false;
let isEventListenersAddedToFileForm = false;
let isModalOpen = false;
let isLastSelectedAnchorHash = false;
let isItDoubleChecked = false;

let ckEditor, ckElements, toolbarViewRoot, textboxModel, textboxViewRoot;
let selectedFiles;
let attachedFiles = [];
let totalSizeOfFiles = 0;

let currentHistoryLength = history.length;
let doubleCheckTimer;

//
// Sub functions
//

function adjustModalWidth() {
    const id_list = document.getElementById("id_list");
    const id_content_parent = code(id_content, "_parent");
    let widthBase;

    if (id_list !== null) {  // notice.html
        widthBase = id_list;
    } else if (id_detail !== null) {  // notice_detail.html
        widthBase = id_detail;
    };

    if (id_modal_base !== null) {
        id_modal_base.style.setProperty("width", widthBase.offsetWidth + "px", "important");
        id_content_parent.style.setProperty("width", widthBase.querySelector("div").offsetWidth + "px", "important");
        id_drop_file.style.setProperty("width", widthBase.querySelector("div").offsetWidth + "px", "important");
    };
}

function resizeWidthOfModalAndForm(bool) {
    if (bool) {
        adjustModalWidth();
        window.addEventListener("resize", adjustModalWidth);
    } else if (!bool) {
        id_modal_base.style = "display: none";
        window.removeEventListener("resize", adjustModalWidth);
    };
}

function adjustTextboxStyle(bool, type) {  // Adding and removing event listeners for this is covered in forms.js
    if (bool) {
        if (type === "mouseenter") {
            textboxViewRoot.style.backgroundColor = "rgb(249 250 251)";
            textboxViewRoot.style.boxShadow = "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)";
        };

        if (type === "mouseleave") {
            textboxViewRoot.style.backgroundColor = "#FCDBCF";
            textboxViewRoot.style.boxShadow = "none";
        };
    } else {
        if (type === "mouseenter") {
            textboxViewRoot.style.backgroundColor = "rgb(249 250 251)";
            textboxViewRoot.style.boxShadow = "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)";
        };

        if (type === "mouseleave") {
            textboxViewRoot.style.backgroundColor = "#FFFFFF";
            textboxViewRoot.style.boxShadow = "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)";
        };
    };
}

function preventGoBack() {
    if (currentHistoryLength === history.length) {
        history.pushState(null, null, location.href);
    };

    document.addEventListener("click", event => {
        let closestAnchor = event.target.closest("a");

        if (closestAnchor) {
            isLastSelectedAnchorHash = closestAnchor.getAttribute("href").startsWith("#");
        };
    });

    window.onpopstate = () => {
        if (isModalOpen) {
            history.pushState(null, null, location.href);

            if (isItOkayToCloseModal()) {
                const id_modal_close = code(id_modal, "_close");

                id_modal_close.click();
            };
        } else if (!isModalOpen) {
            if (!isLastSelectedAnchorHash) {
                history.go(-1);
            };
        };
    };
}

preventGoBack();

function isItOkayToCloseModal() {
    const id_create_or_update_descr = code(id_create_or_update, "_descr");
    const id_delete_descr = code(id_delete, "_descr");
    const id_delete_error = code(id_delete, "_error");

    return id_create_or_update_descr.hidden && id_delete_descr.hidden && id_delete_error.hidden;
}

function executeWhenModalIsClosed() {
    isModalOpen = false;
    toggleFocusOnModal(false);
}

//
// Main functions
//

function initSearchBar() {
    const id_query = document.getElementById("id_query");
    const id_submit_query = document.getElementById("id_submit_query");

    if (id_query !== null) {
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
                    location.href = `${originLocation}/notice/?${urlParams.toString()}`;
                    id_query.readOnly = true;
                    id_submit_query.disabled = true;
                };
            });
        });

        if (urlParams.has("q")) {
            const id_initialize_query = document.getElementById("id_initialize_query");

            id_query.value = urlParams.get("q");

            ["click", "keyup"].forEach(type => {
                id_initialize_query.addEventListener(type, event => {
                    if (type === "click" || event.key === "Enter" || event.key === " ") {
                        location.href = `${originLocation}/notice/`;
                        id_query.readOnly = true;
                        id_submit_query.disabled = true;
                    };
                });
            });
        };
    };
}

initSearchBar();

function initCkEditor() {
    const isUserAuthenticated = document.querySelector("#id_mobile_logout_btn") !== null ? true : false

    if (isUserAuthenticated) {
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
                    ck.addEventListener("blur", event => {
                        if (!ckElements.includes(event.relatedTarget)) {
                            if ((!ckEditor.getData() || ckEditor.getData().trim() === "")) {
                                displayError(true, id_content, "empty");
                            } else {
                                displayError(false, id_content);
                            };
                        };
                    });
                    ck.addEventListener("keydown", event => {
                        if (ck === textboxViewRoot && event.shiftKey && event.key === "Tab") {
                            const id_category_error = code(id_category, "_error");

                            if (id_category_error.innerText.length === 0) {
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
                    eventTypes.forEach(type => {
                        ck.addEventListener(type, () => { textboxViewRoot.setAttribute("spellcheck", "false") });
                    });
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

function attachFile(event = null, sudo = false) {
    let id, name, key, size, readableSize, fileElement;
    let isDuplicate = false;
    let duplicateFiles = [];
    let failureCount = 0;

    if (sudo === true) {
        selectedFiles = selectedFiles;
    } else if (event instanceof DragEvent) {
        selectedFiles = Array.from(event.dataTransfer.files);
    } else {
        selectedFiles = Array.from(id_file.files);
    };

    selectedFiles.forEach(file => {
        name = file.name;
        size = Number(file.size);

        if (sudo === true) {
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
        } else if (totalSizeOfFiles + size <= 5 * 1024 * 1024) {
            totalSizeOfFiles += size;
            if (sudo === true) {
                id = file.id;
                key = file.key;
                fileObj = { file: null, id: id, name: name, key: key, size: size, readableSize: readableSize };
            } else {
                id = generateUUID();
                key = `${id}_${name}`;
                fileObj = { file: file, id: id, name: name, key: key, size: size, readableSize: readableSize };
            };
            fileElement = document.createElement("li");
            fileElement.id = id;
            fileElement.classList.add("class-file", "relative", "flex", "items-center", "justify-between", "p-4", "text-sm", "leading-6");
            fileElement.innerHTML = `
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
            `;
            attachedFiles.push(fileObj);
            id_attach_file.parentNode.insertBefore(fileElement, id_attach_file);

            class_counts.forEach(count => {
                count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
            });

            class_measures.forEach(measure => {
                measure.innerText = `${(totalSizeOfFiles / (1024 * 1024)).toFixed(2)}MB/5MB`;
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
    let fileElement;

    attachedFiles.forEach(function (file, i) {
        if (file.id === fileUUID) {
            totalSizeOfFiles -= file.size;
            attachedFiles.splice(i, 1);
            fileElement = document.getElementById(file.id);
            fileElement.remove();
        };

        class_counts.forEach(count => {
            if (attachedFiles.length === 0) {
                if (count.classList.contains("class-desktop")) {
                    count.innerText = "파일을 이곳에 끌어다 놓으세요.";
                } else if (count.classList.contains("class-mobile")) {
                    count.innerText = "파일을 첨부하세요.";
                };
            } else {
                count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
            };
        });

        class_measures.forEach(measure => {
            measure.innerText = `${(totalSizeOfFiles / (1024 * 1024)).toFixed(2)}MB/5MB`;
        });
    });
}

function styleFileForm() {
    let dropBoxShadow = "inset 0 0 0 1px rgb(209 213 219)";
    let dropBackgroundColor = "transparent";
    let attachBoxShadow = "none";
    let attachBackgroundColor = "transparent";

    class_counts.forEach(count => {
        if (attachedFiles.length === 0) {
            if (count.classList.contains("class-desktop")) {
                count.innerText = "파일을 이곳에 끌어다 놓으세요.";
            } else if (count.classList.contains("class-mobile")) {
                count.innerText = "파일을 첨부하세요.";
            };
        } else {
            count.innerText = `총 ${attachedFiles.length}개 첨부됨`;
        };
    });

    class_measures.forEach(measure => {
        measure.innerText = `${(totalSizeOfFiles / (1024 * 1024)).toFixed(2)}MB/5MB`;
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
        dropBackgroundColor = "rgb(249 250 251)";
        class_counts.forEach(count => { count.innerText = "파일을 놓으세요." });
    };

    id_drop_file.style.boxShadow = dropBoxShadow;
    id_drop_file.style.backgroundColor = dropBackgroundColor;
    id_attach_file.style.outline = "none";
    id_attach_file.style.boxShadow = attachBoxShadow;
    id_attach_file.style.backgroundColor = attachBackgroundColor;
}

function freezeFileForm(boolean) {
    const class_detaches = document.querySelectorAll(".class-detach");

    if (boolean) {
        id_drop_file.style.backgroundColor = "rgb(243 244 246)";
        id_drop_file.nextElementSibling.classList.remove("hidden");
        id_attach_file.tabIndex = -1;
        class_detaches.forEach(detach => { detach.tabIndex = -1 });
        id_file.disabled = true;

        class_counts.forEach(count => {
            count.innerText = "잠시만 기다려주세요.";
        });
    } else if (!boolean) {
        id_drop_file.style.backgroundColor = "transparent";
        id_drop_file.nextElementSibling.classList.add("hidden");
        id_attach_file.tabIndex = 0;
        class_detaches.forEach(detach => { detach.tabIndex = 0 });
        id_file.disabled = false;

        class_counts.forEach(count => {
            if (count.classList.contains("class-desktop")) {
                count.innerText = "파일을 이곳에 끌어다 놓으세요.";
            } else if (count.classList.contains("class-mobile")) {
                count.innerText = "파일을 첨부하세요.";
            };
        });
    };
}

function addEventListenersToFileForm() {
    isEventListenersAddedToFileForm = true;

    id_file.addEventListener("change", attachFile);
    id_drop_file.addEventListener("dragover", event => { event.preventDefault(); id_file.focus(); isDragging = true; styleFileForm() });
    id_drop_file.addEventListener("dragleave", () => { isDragging = false; styleFileForm() });
    id_drop_file.addEventListener("drop", event => { event.preventDefault(); isDragging = false; styleFileForm(); attachFile(event) });
    id_attach_file.addEventListener("focus", () => { isFocused = true; styleFileForm() });
    id_attach_file.addEventListener("blur", () => { isFocused = false; styleFileForm() });
    id_attach_file.addEventListener("mouseenter", () => { isHovered = true; styleFileForm() });
    id_attach_file.addEventListener("mouseleave", () => { isHovered = false; styleFileForm() });

    ["click", "keyup"].forEach(type => {
        id_attach_file.addEventListener(type, event => {
            if (type === "click" || event.key === "Enter" || event.key === " ") {
                id_attach_file.focus();
                id_file.click();
            };
        });
    });
}

function initForm() {
    const id_title_placeholder_array = [
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
    const id_title_placeholder = randomItem(id_title_placeholder_array.filter(placeholder => isCurrentDateInRange(String(now.getFullYear()) + placeholder.s, String(now.getFullYear()) + placeholder.e))).t;
    const class_categories = document.querySelectorAll(".class-category");
    const class_files = document.querySelectorAll(".class-file");

    function isCurrentDateInRange(start, end, currentDate = yyyymmdd) {
        return currentDate >= start && currentDate <= end;
    }

    id_title.value = null;
    id_title.placeholder = id_title_placeholder;
    id_category.value = null;
    id_category_serv.checked = false;
    id_category_dept.checked = false;

    class_categories.forEach((category) => {
        const label = category.closest("label");
        const svg = label.querySelector("svg");

        category.addEventListener("click", () => {
            id_category.value = category.value;
        });

        category.addEventListener("focus", () => {
            label.classList.add("df-focus-ring-inset");
            svg.classList.remove("invisible");
        });

        category.addEventListener("blur", () => {
            if (!category.checked) {
                svg.classList.add("invisible");
            } else if (category.checked) {
                label.classList.add("df-ring-inset-flamingo");
            };

            label.classList.remove("df-focus-ring-inset");
        });

        category.addEventListener("change", () => {
            const otherInputs = [...class_categories].filter(i => i !== category);

            if (category.checked) {
                label.classList.replace("df-ring-inset-gray", "df-ring-inset-flamingo");
                svg.classList.remove("invisible");
            } else {
                svg.classList.add("invisible");
            };

            otherInputs.forEach(i => {
                const otherLabel = i.closest("label");
                const otherSvg = otherLabel.querySelector("svg");

                if (!i.checked) {
                    otherLabel.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                    otherSvg.classList.add("invisible");
                };
            });
        });

        if (!category.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    ckEditor.setData("");

    id_file.value = null;
    class_files.forEach(file => { file.remove() });
    attachedFiles.length = 0;
    totalSizeOfFiles = 0;
    styleFileForm();
    if (!isEventListenersAddedToFileForm) { addEventListenersToFileForm() };

    inputs.forEach((input) => {
        displayError(false, input);
    });

    [id_create_or_update, id_delete].forEach(button => {
        displayButtonMsg(false, button, "error");
    });
}

function updateForm(action, datasetObj = null) {
    const id_modal_notice = document.getElementById("id_modal_notice");
    const id_modal_share = document.getElementById("id_modal_share");
    const class_keywords = document.querySelectorAll(".class-keyword");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    toggleFocusOnModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // action: create
    if (action === "create") {
        resizeWidthOfModalAndForm(true);
        id_modal_notice.hidden = false;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "작성하기";
        });

        initForm();
        id_create_or_update.classList.replace("hidden", "inline-flex");
        id_delete.classList.replace("inline-flex", "hidden");
    }

    // action: adjust
    else if (action === "adjust") {
        const data = datasetObj.dataset;
        let label, svg;

        updateForm("create");

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        id_page_id.value = data.pageId;
        id_title.value = data.title;

        if (data.category === "서비스") {
            id_category.value = "서비스";
            id_category_serv.checked = true;
            label = id_category_serv.closest("label");
        } else if (data.category === "학과") {
            id_category.value = "학과";
            id_category_dept.checked = true;
            label = id_category_dept.closest("label");
        };

        label.classList.remove("df-ring-inset-gray");
        label.classList.add("df-ring-inset-flamingo");
        svg = label.querySelector("svg");
        svg.classList.remove("invisible");
        id_keyword.value = data.keyword;
        id_delete.classList.replace("hidden", "inline-flex");
        id_delete_text.innerText = "삭제하기";
        isItDoubleChecked = false;
        clearTimeout(doubleCheckTimer);
        setTimeout(() => { freezeCkEditor() }, 0.00001);
        requestReadNotice();
    }

    // action: share
    else if (action === "share") {
        resizeWidthOfModalAndForm(false);
        if (id_modal_notice !== null) { id_modal_notice.hidden = true };
        id_modal_share.hidden = false;

        class_keywords.forEach(keyword => {
            keyword.innerText = "공유하기";
        });

        id_copy_url_ready.classList.remove("hidden");
        id_copy_url_done.classList.add("hidden");
        id_copy_url_descr.hidden = true;
        id_create_or_update.classList.replace("inline-flex", "hidden");
        id_delete.classList.replace("inline-flex", "hidden");
    };
}

function initModal() {
    const class_creates = document.querySelectorAll(".class-create");
    const class_adjusts = document.querySelectorAll(".class-adjust"); // Update or delete
    const class_shares = document.querySelectorAll(".class-share");

    class_creates.forEach(create => {
        ["click", "keyup"].forEach(type => {
            create.addEventListener(type, event => {
                const targetTagName = event.target.tagName;

                if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "DIV" || targetTagName === "BUTTON")) ||
                    (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                    updateForm("create");
                };
            });
        });
    });

    class_adjusts.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, event => {
                const targetTagName = event.target.tagName;

                if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "DIV" || targetTagName === "BUTTON")) ||
                    (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                    updateForm("adjust", adjust);
                };
            });
        });
    });

    class_shares.forEach(share => {
        ["click", "keyup"].forEach(type => {
            share.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("share");
                };
            });
        });
    });
}

initModal();

function styleFileList() {
    const class_downloads = document.querySelectorAll(".class-download");

    if (class_downloads) {
        class_downloads.forEach((download, index) => {
            const aTag = download.querySelector("a");

            if (class_downloads.length === 1) {
                download.classList.add("rounded-md");
                aTag.classList.add("rounded-md");
            } else if (index === 0) {
                download.classList.add("rounded-t-md");
                aTag.classList.add("rounded-t-md");
            } else if (index === class_downloads.length - 1) {
                download.classList.add("rounded-b-md");
                aTag.classList.add("rounded-b-md");
            };
        });
    };
}

styleFileList();

function embedMediaInCkEditor() {
    const mediaElements = document.querySelectorAll("figure.media");

    if (mediaElements) {
        mediaElements.forEach(media => {
            const oembed = media.querySelector("oembed");
            let div = media.querySelector("div");

            if (oembed) {
                const url = oembed.getAttribute("url");
                const newStructure = generateNewStructure(url);

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

embedMediaInCkEditor();

function copyUrl() {
    if (id_copy_url !== null) {
        id_url.addEventListener("click", () => {
            id_url.select();
        });

        id_copy_url.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(id_url.value);
            } catch (e) {
                id_url.select();
                document.execCommand("copy"); // Deprecated, but used for KakaoTalk in-app browser
            };

            id_copy_url_ready.classList.add("hidden");
            id_copy_url_done.classList.remove("hidden");
            id_copy_url_descr.hidden = false;
            id_copy_url_done.classList.add("blink");

            setTimeout(() => { id_copy_url_done.classList.remove("blink") }, 3000);
        });
    };
}

copyUrl();

function share() {
    if (id_detail !== null) {
        const data = id_detail.dataset;
        const id_kakaotalk = document.getElementById("id_kakaotalk");
        const id_x = document.getElementById("id_x");
        const id_facebook = document.getElementById("id_facebook");
        const id_line = document.getElementById("id_line");

        Kakao.init("36080e7fa227c8f75e1b351c53d2c77c");

        id_kakaotalk.addEventListener("click", () => {
            Kakao.Share.sendDefault({
                objectType: "feed",
                itemContent: {
                    profileText: data.userName,
                    profileImageUrl: data.userProfileImg,
                },
                content: {
                    title: data.title,
                    description: `${data.listedDate} · ${data.category}\n${data.keyword}`,
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
            const hashtags = noticeKeyword.replace(/\s+/g, "").replace(/#/g, ",").substring(1);
            const xUrl = `https://twitter.com/intent/tweet?text=${noticeTitle}&url=${originLocation}${location.pathname}&hashtags=${hashtags}`;

            window.open(xUrl);
        });

        id_facebook.addEventListener("click", () => {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${originLocation}${location.pathname}`;

            window.open(facebookUrl);
        });

        id_line.addEventListener("click", () => {
            const lineUrl = `https://social-plugins.line.me/lineit/share?url=${originLocation}${location.pathname}`;

            window.open(lineUrl);
        });
    };
}

share();

function goToList() {
    const id_go_to_list = document.getElementById("id_go_to_list");
    const class_details = document.querySelectorAll(".class-detail");

    if (class_details !== null) {
        class_details.forEach((detail) => {
            if (location.search !== "") {
                detail.href += `${location.search}`;
            };
        });
    };

    if (id_go_to_list !== null) {
        if (id_go_to_list.previousElementSibling === null) {
            id_go_to_list.classList.remove("mt-3");
        };

        ["click", "keyup"].forEach(type => {
            id_go_to_list.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    if (location.search !== "") {
                        location.href = `${originLocation}/notice${location.search}`;
                    } else {
                        location.href = `${originLocation}/notice/`;
                    };

                    freezeForm(true);
                };
            });
        });
    };
}

goToList();

function requestOcrNotice() {
    request.url = `${originLocation}/notice/utils/notice/`;
    request.type = "POST";
    request.data = { id: "ocr_notice", content: `${id_content.value}` };
    request.async = true;
    request.headers = null;
    displayButtonMsg(true, id_create_or_update, "descr", "잠시만 기다려주세요.");
    displayButtonMsg(false, id_create_or_update, "error");
    displayNoti(false, "RDI");
    freezeForm(true);
    freezeFileForm(true);
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

    request.url = `${originLocation}/notice/utils/notice/`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestReadNotice() {
    request.url = `${originLocation}/notice/utils/notice/`;
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

    request.url = `${originLocation}/notice/utils/notice/`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    freezeFileForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteNotice() {
    request.url = `${originLocation}/notice/utils/notice/`;
    request.type = "POST";
    request.data = { id: "delete_notice", page_id: `${id_page_id.value}`, title: `${id_title.value}`, category: `${id_category.value}`, content: `${id_content.value}`, keyword: `${id_keyword.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    freezeFileForm(true);
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

                            if (id_create_or_update.innerText === "작성하기") {
                                requestCreateNotice();
                            } else if (id_create_or_update.innerText === "수정하기") {
                                requestUpdateNotice();
                            };

                            displayButtonMsg(true, id_create_or_update, "descr", "잠시만 기다려주세요.");
                            displayButtonMsg(false, id_create_or_update, "error");
                            id_create_or_update_spin.classList.remove("hidden");
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
                            requestDeleteNotice();
                            displayButtonMsg(true, id_delete, "descr", "잠시만 기다려주세요.");
                            id_delete_spin.classList.remove("hidden");
                            displayNoti(false, "RYS");
                            displayNoti(false, "RAT");
                            displayNoti(false, "RDI");
                            displayNoti(false, "EIS");
                            displayNoti(false, "EIF");
                            displayNoti(false, "LDF");
                            displayNoti(false, "LFS");
                            isItDoubleChecked = false;
                        };
                    };
                });
            });
        };
    });
}

initRequest();