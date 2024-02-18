//
// Global variables
//

const id_modal = document.getElementById("id_modal");
const id_page_id = document.getElementById("id_page_id");
const id_title = document.getElementById("id_title");
const id_title_original = code(id_title, "_original");
const id_category = document.getElementById("id_category");
const id_category_original = code(id_category, "_original");
const id_category_dram = document.getElementById("id_category_dram");
const id_category_docu = document.getElementById("id_category_docu");
const id_position = document.getElementById("id_position");
const id_name = document.getElementById("id_name");
const id_user_list = document.getElementById("id_user_list");
const id_crew_list = document.getElementById("id_crew_list");
const id_crew = document.getElementById("id_crew");
const id_crew_original = code(id_crew, "_original");
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");

let isModalOpen = false;
let isComposing = false;
let isUserFound = false;
let isInteractingWithList = false;
let isLastSelectedAnchorHash = false;
let isItDoubleChecked = false;

let prevInputNameValue;
let currentHistoryLength = history.length;
let doubleCheckTimer;

//
// Sub functions
//

function controlUserListWithArrowKeys() {
    const items = id_user_list.querySelectorAll("li");

    items.forEach((item, index) => {
        item.setAttribute("tabindex", "0");

        if (index === 0) {
            item.addEventListener("keydown", event => {
                if (event.key === "ArrowUp") {
                    id_name.focus();
                };
            });
        };

        item.addEventListener("keydown", event => {
            if (event.key === "Tab") {
                items.forEach(item => { item.setAttribute("tabindex", "-1") });
            } else if (event.key === "ArrowDown" && index < items.length - 1) {
                items[index + 1].focus();
            } else if (event.key === "ArrowUp") {
                if (index > 0) {
                    items[index - 1].focus();
                } else {
                    items.forEach(item => { item.setAttribute("tabindex", "-1") });
                    id_name.focus();
                    requestAnimationFrame(() => {
                        id_name.setSelectionRange(id_name.value.length, id_name.value.length);
                    });
                };
            };
        });
    });
}

function sortCrewListItems() {
    let crews = Array.from(id_crew_list.querySelectorAll("li"));

    crews.sort((a, b) => {
        let priorityA = a.dataset.positionPriority;
        let priorityB = b.dataset.positionPriority;

        return priorityA.localeCompare(priorityB, undefined, { numeric: true, sensitivity: "base" });
    });

    while (id_crew_list.firstChild) {
        id_crew_list.removeChild(id_crew_list.firstChild);
    };

    crews.forEach(crew => id_crew_list.appendChild(crew));
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

function hasTwoHangulChars(input) {
    const validHangulOrNonHangulRegex = /^([\uAC00-\uD7A3]|[^ㄱ-ㅎㅏ-ㅣ])+$/;
    const hangulSyllableRegex = /[\uAC00-\uD7A3]/g;

    if (!validHangulOrNonHangulRegex.test(input)) {
        return false;
    };

    const matches = input.match(hangulSyllableRegex);

    return matches;
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

function initCrewBox() {
    const charEventTypes = ["compositionstart", "compositionupdate", "compositionend"];
    const controlEventTypes = ["paste", "blur", "click", "keyup", "focus"];
    const mouseEventTypes = ["mouseenter", "mouseleave"];

    charEventTypes.forEach(type => {
        id_name.addEventListener(type, () => {
            if (type === "compositionstart") {
                isComposing = true;
            } else if (type === "compositionupdate") {
                isComposing = false;
            } else if (type === "compositionend") {
                isComposing = false;
            };
        });
    });

    controlEventTypes.forEach(type => {
        id_name.addEventListener(type, event => {
            if (type === "paste") {
                prevInputNameValue = null;
            } else if (type === "blur") {
                if (!isInteractingWithList) { id_user_list.classList.add("hidden") };
            } else {
                if (isUserFound) {
                    id_user_list.classList.remove("hidden");

                    if (type === "keyup" && event.key === "ArrowDown") {
                        isInteractingWithList = true;
                        id_user_list.firstElementChild.setAttribute("tabindex", "0");
                        id_user_list.firstElementChild.focus();
                        controlUserListWithArrowKeys();
                        setTimeout(() => { isInteractingWithList = false }, 100);
                    };

                    const class_users = id_user_list.querySelectorAll(".class-user");

                    class_users.forEach(user => {
                        ["click", "keyup"].forEach(type => {
                            user.addEventListener(type, event => {
                                if (type === "click" || event.key === "Enter" || event.key === " ") {
                                    const class_crews = id_crew_list.querySelectorAll(".class-crew");
                                    let isCrewAlreadyAdded = false;

                                    class_crews.forEach(crew => {
                                        if (crew.dataset.user === user.dataset.user && crew.dataset.positionPriority === id_position.value) {
                                            isCrewAlreadyAdded = true;
                                        };
                                    });

                                    if (isCrewAlreadyAdded) {
                                        return;
                                    };

                                    const crewElement = document.createElement("li");

                                    crewElement.classList.add("class-crew", "relative", "flex", "justify-between", "gap-x-4", "py-3");
                                    crewElement.dataset.user = user.dataset.user;
                                    crewElement.dataset.name = user.dataset.name;
                                    crewElement.dataset.studentId = user.dataset.studentId;
                                    crewElement.dataset.avatarUrl = user.dataset.avatarUrl;
                                    crewElement.dataset.positionPriority = id_position.value;
                                    crewElement.dataset.positionKeyword = id_position.selectedOptions[0].dataset.keyword;

                                    crewElement.innerHTML = `<div class="flex items-center min-w-0 gap-x-3">
                                            <img class="h-10 w-10 flex-none rounded-full bg-gray-50"
                                                src="${crewElement.dataset.avatarUrl}"
                                                alt="${crewElement.dataset.name}님의 프로필 사진"
                                                height=""
                                                width="">
                                            <div class="min-w-0 flex-auto">
                                                <p class="text-sm text-gray-500">${crewElement.dataset.positionKeyword}</p>
                                                <p class="text-sm font-semibold leading-6 text-gray-900">
                                                    ${crewElement.dataset.name} <span class="font-normal">(${crewElement.dataset.studentId})</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="flex shrink-0 items-center">
                                            <button class="class-remove rounded-md text-gray-400 hover:text-gray-500 focus:df-focus-ring-offset-white disabled:cursor-not-allowed">
                                                <svg class="w-5 h-5 flex-none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke-width="1.5"
                                                    stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    `;

                                    id_crew_list.appendChild(crewElement);
                                    id_name.classList.remove("rounded-b-md", "focus:rounded-b-md", "read-only:rounded-b-md");
                                    id_name.parentElement.classList.remove("rounded-b-md");
                                    id_name.focus();
                                    id_user_list.classList.add("hidden");
                                    sortCrewListItems();
                                };
                            });
                        });
                    });

                    const class_removes = id_crew_list.querySelectorAll(".class-remove");

                    class_removes.forEach(remove => {
                        ["click", "keyup"].forEach(type => {
                            remove.addEventListener(type, event => {
                                if (type === "click" || event.key === "Enter" || event.key === " ") {
                                    remove.parentElement.parentElement.remove();

                                    if (id_crew_list.childElementCount === 0) {
                                        id_name.classList.add("rounded-b-md", "focus:rounded-b-md", "read-only:rounded-b-md");
                                        id_name.parentElement.classList.add("rounded-b-md");
                                    };

                                    id_name.focus();
                                };
                            });
                        });
                    });
                } else {
                    id_user_list.classList.add("hidden");
                };
            };
        });
    });

    mouseEventTypes.forEach(type => {
        id_user_list.addEventListener(type, () => {
            if (type === "mouseenter") {
                isInteractingWithList = true;
            } else if (type === "mouseleave") {
                isInteractingWithList = false;
            };
        });
    });
}

initCrewBox();

function initForm() {
    const id_title_placeholder_array = new Array("<피아골>", "<속 돌아온 외다리>", "<초대받은 사람들>", "<불나비>", "<만선>", "<서편제>", "<자유부인>", "<안개마을>", "<축제>", "<낙동강>", "<민며느리>", "<장희빈>", "<청춘의 십자로>", "<쇠사슬을 끊어라>", "<와룡선생 이야기>", "<사의 찬미>", "<월급쟁이>");
    const id_title_placeholder = randomItem(id_title_placeholder_array);
    const class_categories = document.querySelectorAll(".class-category");

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

    id_position.addEventListener("change", () => {
        if (id_position.selectedOptions[0].disabled) {
            id_position.selectedIndex = 0;
        };

        if (id_position.selectedIndex !== 0) {
            id_name.readOnly = false;
            id_name.focus();
        } else {
            id_name.readOnly = true;
        };
    });

    id_name.value = null;
    id_user_list.innerHTML = null;
    id_crew_list.innerHTML = null;
    id_crew.value = null;

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
        let label, svg;

        updateForm("create");

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        id_page_id.value = data.pageId;
        id_title.value = data.title;
        id_title_original.value = data.titleOriginal;

        if (data.category === "극영화") {
            id_category.value = "극영화";
            id_category_dram.checked = true;
            label = id_category_dram.closest("label");
        } else if (data.category === "다큐멘터리") {
            id_category.value = "다큐멘터리";
            id_category_docu.checked = true;
            label = id_category_docu.closest("label");
        };

        id_category_original.value = data.categoryOriginal;
        label.classList.remove("df-ring-inset-gray");
        label.classList.add("df-ring-inset-flamingo");
        svg = label.querySelector("svg");
        svg.classList.remove("invisible");
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

function requestFindUser() {
    request.url = `${originLocation}/project/utils/project/`;
    request.type = "POST";
    request.data = { id: "find_user", name: `${id_name.value}` };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestCreateProject() {
    request.url = `${originLocation}/project/utils/project/`;
    request.type = "GET";
    request.data = { id: "create_project", title: `${id_title.value}`, category: `${id_category.value}`, crew: `${id_crew.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateProject() {
    request.url = `${originLocation}/project/utils/project/`;
    request.type = "GET";
    request.data = { id: "update_project", title: `${id_title.value}`, category: `${id_category.value}`, crew: `${id_crew.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteProject() {
    request.url = `${originLocation}/project/utils/project/`;
    request.type = "GET";
    request.data = { id: "delete_project", title: `${id_title_original.value}`, category: `${id_category_original.value}`, crew: `${id_crew_original.value}` };
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

            id_name.addEventListener("input", () => {
                if (!isComposing) {
                    if (prevInputNameValue !== id_name.value && hasTwoHangulChars(id_name.value)) {
                        prevInputNameValue = id_name.value;
                        requestFindUser();
                    } else if (!hasTwoHangulChars(id_name.value)) {
                        isUserFound = false;
                    };
                };
            });

            ["click", "keyup"].forEach(type => {
                id_create_or_update.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (isItOkayToSubmitForm()) {
                            const id_create_or_update_spin = code(id_create_or_update, "_spin");

                            if (id_create_or_update.innerText === "만들기") {
                                requestCreateProject();
                            } else if (id_create_or_update.innerText === "수정하기") {
                                requestUpdateProject();
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
                            requestDeleteProject();
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