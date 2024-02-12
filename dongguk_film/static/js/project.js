//
// Global variables
//

const id_modal = document.getElementById("id_modal");
const id_title = document.getElementById("id_title");
const id_category = document.getElementById("id_category");
const id_category_dram = document.getElementById("id_category_dram");
const id_category_docu = document.getElementById("id_category_docu");
const id_crew = document.getElementById("id_crew");
const id_file = document.getElementById("id_file");
const id_drop_file = document.getElementById("id_drop_file");
const id_attach_file = document.getElementById("id_attach_file");
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");

const class_counts = document.querySelectorAll(".class-count");
const class_measures = document.querySelectorAll(".class-measure");

let isFocused = false;
let isHovered = false;
let isDragging = false;
let isEventListenersAddedToFileForm = false;
let isModalOpen = false;
let isLastSelectedAnchorHash = false;
let isItDoubleChecked = false;

let selectedFiles;
let attachedFiles = [];
let totalSizeOfFiles = 0;

let currentHistoryLength = history.length;
let doubleCheckTimer;

//
// Sub functions
//

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
                    location.href = `${originLocation}/project/?${urlParams.toString()}`;
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
                        location.href = `${originLocation}/project/`;
                        id_query.readOnly = true;
                        id_submit_query.disabled = true;
                    };
                });
            });
        };
    };
}

initSearchBar();

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
    const id_title_placeholder_array = new Array("<피아골>", "<속 돌아온 외다리>", "<초대받은 사람들>", "<불나비>", "<만선>", "<서편제>", "<자유부인>", "<안개마을>", "<축제>", "<낙동강>", "<민며느리>", "<장희빈>", "<청춘의 십자로>", "<쇠사슬을 끊어라>", "<와룡선생 이야기>", "<사의 찬미>", "<월급쟁이>");
    const id_title_placeholder = randomItem(id_title_placeholder_array);
    const class_categories = document.querySelectorAll(".class-category");
    const class_files = document.querySelectorAll(".class-file");

    id_title.value = null;
    id_title.placeholder = id_title_placeholder;
    id_category.value = null;
    id_category_dram.checked = false;
    id_category_docu.checked = false;

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

    id_crew.value = null;
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
    const class_keywords = document.querySelectorAll(".class-keyword");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    toggleFocusOnModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // action: create
    if (action === "create") {
        class_keywords.forEach(keyword => {
            keyword.innerText = "만들기";
        });

        initForm();
        id_delete.classList.replace("inline-flex", "hidden");
    }

    // action: adjust
    else if (action === "adjust") {
        const data = datasetObj.dataset;

        updateForm("create");

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        id_title.value = data.title;
        id_title_original.value = data.titleOriginal;

        if (data.category === "극영화") {
            id_category.value = "극영화";
            id_category_dram.checked = true;
        } else if (data.category === "다큐멘터리") {
            id_category.value = "다큐멘터리";
            id_category_docu.checked = true;
        };
        
        id_category_original.value = data.categoryOriginal;
        id_delete.classList.replace("hidden", "inline-flex");
        id_delete_text.innerText = "삭제하기";
        isItDoubleChecked = false;
        clearTimeout(doubleCheckTimer);
    };
}

function initModal() {
    const class_creates = document.querySelectorAll(".class-create");
    const class_adjusts = document.querySelectorAll(".class-adjust"); // Update or delete

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