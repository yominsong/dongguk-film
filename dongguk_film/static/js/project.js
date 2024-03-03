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
const id_select_position = document.getElementById("id_select_position");
const id_found_position_list = document.getElementById("id_found_position_list");
const id_position = document.getElementById("id_position");
const id_name = document.getElementById("id_name");
const id_found_user_list = document.getElementById("id_found_user_list");
const id_staff_list = document.getElementById("id_staff_list");
const id_staff_list_descr = code(id_staff_list, "_descr");
const id_staff_list_error = code(id_staff_list, "_error");
const id_staff_list_original = code(id_staff_list, "_original");
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");

const staffBoxElements = [id_select_position, id_found_position_list, id_name];

let isAuthenticated = false;
let isModalOpen = false;
let isUserFound = false;
let isInteractingWithList = false;
let isLastSelectedAnchorHash = false;
let isProducer = false;
let isItDoubleChecked = false;

let userPk, userName, userStudentId;  // User authentication verification results
let positionData;  // This is an object like {"priority": "A01", "keyword": "연출", "required": "True"}
let requiredPositions = [];
let addedRequiredPositions = [];  // This is an array like [{"priority": "A01", "keyword": "연출", "required": "True"}, {"priority": "B01", "keyword": "제작", "required": "True"}]
let addedStaffs = [];
let currentHistoryLength = history.length;
let doubleCheckTimer;

//
// Sub functions
//

function allowArrowKeysForNavigatingFoundUserList() {
    const users = id_found_user_list.querySelectorAll("li");

    users.forEach((user, index) => {
        user.setAttribute("tabindex", "0");

        user.addEventListener("keydown", event => {
            if (event.key === "Tab") {
                users.forEach(user => { user.setAttribute("tabindex", "-1") });
            } else if (event.key === "ArrowDown" && index < users.length - 1) {
                users[index + 1].focus();
            } else if (event.key === "ArrowUp") {
                if (index > 0) {
                    users[index - 1].focus();
                } else {
                    users.forEach(user => { user.setAttribute("tabindex", "-1") });
                    id_name.focus();

                    requestAnimationFrame(() => {
                        id_name.setSelectionRange(id_name.value.length, id_name.value.length);
                    });
                };
            };
        });
    });
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

function displayErrorInStaffBox(bool, errorType = null) {
    const keywordsOfRequiredPositions = requiredPositions.map(position => position.keyword).join(", ");

    if (bool) {
        if (errorType === "empty") {
            id_staff_list_error.innerText = "스태프를 추가해주세요.";
        } else if (errorType === "insufficient") {
            id_staff_list_error.innerText = `${keywordsOfRequiredPositions} 담당을 모두 지정해주세요.`;
        };

        id_staff_list_error.hidden = false;
        staffBoxElements.forEach(element => { element.classList.remove("bg-transparent") });
        staffBoxElements.forEach(element => { element.classList.add("bg-flamingo-50", "ring-transparent") });
        id_select_position.classList.add("hover:z-10");
        id_name.classList.add("hover:bg-gray-50", "hover:df-ring-inset-gray");
        id_found_user_list.classList.add("hidden");
    } else {
        id_staff_list_error.innerText = null;
        id_staff_list_error.hidden = true;
        staffBoxElements.forEach(element => { element.classList.add("bg-transparent") });
        staffBoxElements.forEach(element => { element.classList.remove("bg-flamingo-50", "ring-transparent") });
        id_select_position.classList.remove("hover:z-10");
        id_name.classList.remove("hover:bg-gray-50", "hover:df-ring-inset-gray");
    };
}

function controlErrorInStaffBox() {
    if (addedStaffs.length === 0) {
        displayErrorInStaffBox(true, "empty");
    } else if (!areArraysIdentical(requiredPositions, addedRequiredPositions)) {
        displayErrorInStaffBox(true, "insufficient");
    } else {
        return false;
    };
}

function validateStaffBox() {
    staffBoxElements.forEach(element => {
        element.addEventListener("click", () => {
            displayErrorInStaffBox(false);
        });

        if (element === id_name) {
            element.addEventListener("keydown", event => {
                displayErrorInStaffBox(false);
                controlDescr(element, event);
            });
        };

        element.addEventListener("focusout", () => {
            if (!isInteractingWithList) { controlErrorInStaffBox() };
        });

        element.addEventListener("focusin", () => {
            displayErrorInStaffBox(false);
        });
    });
}

function initStaffBoxValidation() {
    const class_positions = document.querySelectorAll(".class-position");

    class_positions.forEach(position => {
        if (position.dataset.required === "True" &&
            !requiredPositions.some(requiredPosition => requiredPosition.priority === position.dataset.priority)) {
            requiredPositions.push({
                priority: position.dataset.priority,
                keyword: position.dataset.keyword,
                required: position.dataset.required,
            });

            requiredPositions.sort((a, b) => {
                return a.priority.localeCompare(b.priority, undefined, { numeric: true, sensitivity: "base" });
            });
        };
    });

    validateStaffBox();
}

function areObjectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    };

    return true;
}

function areArraysIdentical(a, b) {
    if (a === b) return true; // Check if same reference
    if (a == null || b == null) return false; // Check for null
    if (a.length !== b.length) return false; // Different lengths, not identical

    for (let i = 0; i < a.length; i++) {
        if (!areObjectsEqual(a[i], b[i])) return false; // Use areObjectsEqual to compare objects
    };

    return true;
}

function isItOkayToCloseModal() {
    const id_create_or_update_descr = code(id_create_or_update, "_descr");
    const id_delete_descr = code(id_delete, "_descr");
    const id_delete_error = code(id_delete, "_error");

    return id_create_or_update_descr.hidden && id_delete_descr.hidden && id_delete_error.hidden;
}

function isItOkayToFindUser() {
    const validHangulOrNonHangulRegex = /^([\uAC00-\uD7A3]|[^ㄱ-ㅎㅏ-ㅣ])+$/;
    const hangulSyllableRegex = /[\uAC00-\uD7A3]/g;

    if (!validHangulOrNonHangulRegex.test(id_name.value)) {
        return false;
    };

    return id_name.value.match(hangulSyllableRegex);
}

function isItOkayToSubmitProjectForm() {
    const areStaffsAdded = addedStaffs.length !== 0;
    const areAllRequiredPositionsAdded = areArraysIdentical(requiredPositions, addedRequiredPositions);

    isProducer = addedStaffs.some(staff => staff.pk === userPk && staff.position.some(position => position.keyword === "제작"));

    return isProducer && areStaffsAdded && areAllRequiredPositionsAdded && isItOkayToSubmitForm();
}

function executePositionAction(selectedPurpose = null) {
    if (selectedPurpose) {
        id_position.value = selectedPurpose.priority;

        positionData = {
            priority: selectedPurpose.priority,
            keyword: selectedPurpose.keyword,
            required: selectedPurpose.required,
        };

        id_name.readOnly = false;
        id_name.focus();
    } else {
        id_position.value = null;
        id_name.readOnly = true;
    };
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

function sortStaffList() {
    const temporaryArrayForStaffList = Array.from(id_staff_list.querySelectorAll("li"));

    temporaryArrayForStaffList.sort((a, b) => {
        const priorityA = JSON.parse(a.dataset.position)[0].priority;
        const priorityB = JSON.parse(b.dataset.position)[0].priority;

        return priorityA.localeCompare(priorityB, undefined, { numeric: true, sensitivity: "base" });
    });

    while (id_staff_list.firstChild) {
        id_staff_list.removeChild(id_staff_list.firstChild);
    };

    temporaryArrayForStaffList.forEach(staffElement => id_staff_list.appendChild(staffElement));
};

function addStaff(userData, blink = false) {
    let isUserAlreadyAddedToStaffList = false;
    let isPositionAlreadyAssignedToStaff = false;

    const class_staffs = id_staff_list.querySelectorAll(".class-staff");

    if (class_staffs.length > 0) {
        class_staffs.forEach(staff => {
            const staffData = {
                pk: staff.dataset.pk,
                position: JSON.parse(staff.dataset.position),  // This is an array like [{"priority": "A01", "keyword": "연출", "required": "True"}, {"priority": "A02", "keyword": "각본", "required": "False"}]
            };

            if (staffData.pk === userData.pk) {
                isUserAlreadyAddedToStaffList = true;

                if (blink) {
                    const class_blinks = staff.querySelectorAll(".class-blink");

                    class_blinks.forEach(blink => {
                        blink.classList.add("blink");
                        setTimeout(() => { blink.classList.remove("blink") }, 3000);
                    });
                };
            };

            if (staffData.pk === userData.pk && staffData.position.some(position => position.priority === positionData.priority)) {
                isPositionAlreadyAssignedToStaff = true;
            };

            if (isUserAlreadyAddedToStaffList && !isPositionAlreadyAssignedToStaff) {
                addedStaffs.some(staff => {
                    if (staff.pk === userData.pk &&
                        !staff.position.some(position => position.priority === positionData.priority)) {
                        staff.position.push(positionData);
                    };
                });

                if (staffData.pk === userData.pk) {
                    staffData.position.push(positionData);

                    staffData.position.sort((a, b) => {
                        return a.priority.localeCompare(b.priority, undefined, { numeric: true, sensitivity: "base" });
                    });

                    staff.dataset.position = JSON.stringify(staffData.position);
                    staff.querySelector(".class-position").innerText = staffData.position.map(position => position.keyword).join(", ");
                    sortStaffList();
                };
            };
        });
    };

    if (positionData.required === "True" && !addedRequiredPositions.some(position => position.priority === positionData.priority)) {
        addedRequiredPositions.push(positionData);

        addedRequiredPositions.sort((a, b) => {
            return a.priority.localeCompare(b.priority, undefined, { numeric: true, sensitivity: "base" });
        });
    };

    id_name.focus();
    id_found_user_list.classList.add("hidden");

    if (isUserAlreadyAddedToStaffList) {
        return;
    };

    const staffElement = document.createElement("li");

    staffElement.classList.add("class-staff", "relative", "flex", "justify-between", "gap-x-4", "py-3");
    staffElement.dataset.pk = userData.pk;
    staffElement.dataset.position = JSON.stringify([positionData]);

    addedStaffs.push({
        pk: userData.pk,
        position: [positionData],
    });

    staffElement.innerHTML = `
        <div class="flex items-center min-w-0 gap-x-3">
            <img class="h-10 w-10 flex-none rounded-full bg-gray-50"
                src="${userData.avatarUrl}"
                alt="${userData.name}님의 프로필 사진"
                height=""
                width="">
            <div class="min-w-0 flex-auto">
                <p class="class-blink class-position text-sm text-gray-500">${positionData.keyword}</p>
                <p class="class-blink text-sm font-semibold leading-6 text-gray-900">
                    ${userData.name} <span class="font-normal">(${userData.studentId})</span>
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

    id_staff_list.appendChild(staffElement);

    if (blink) {
        const class_blinks = staffElement.querySelectorAll(".class-blink");

        class_blinks.forEach(blink => {
            blink.classList.add("blink");
            setTimeout(() => { blink.classList.remove("blink") }, 3000);
        });
    };

    sortStaffList();

    const class_removes = id_staff_list.querySelectorAll(".class-remove");

    ["click", "keyup"].forEach(type => {
        class_removes.forEach(remove => {
            remove.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    const staffElement = remove.parentElement.parentElement;

                    addedRequiredPositions = [];

                    addedStaffs = addedStaffs.filter(staff => {
                        return staff.pk !== staffElement.dataset.pk;
                    });

                    staffElement.remove();

                    const class_staffs = id_staff_list.querySelectorAll(".class-staff");

                    class_staffs.forEach(staff => {
                        JSON.parse(staff.dataset.position).forEach(position => {
                            if (position.required === "True") {
                                addedRequiredPositions.push(position);
                            };
                        });
                    });

                    controlErrorInStaffBox();

                    if (id_staff_list.childElementCount === 0) {
                        id_name.classList.add("rounded-b-md", "focus:rounded-b-md", "read-only:rounded-b-md");
                        id_name.parentElement.classList.add("rounded-b-md");
                    };
                };
            });
        });
    });

    id_name.classList.remove("rounded-b-md", "focus:rounded-b-md", "read-only:rounded-b-md");
    id_name.parentElement.classList.remove("rounded-b-md");
}

function initStaffBox() {
    if (id_modal !== null) {
        const id_position_placeholder = code(id_position, "_placeholder");
        
        addedRequiredPositions = [];
        addedStaffs = [];
        id_position.value = null;
        id_position_placeholder.click();
        id_name.value = null;
        id_name.readOnly = true;
        id_name.classList.add("rounded-b-md", "focus:rounded-b-md", "read-only:rounded-b-md");
        id_name.parentElement.classList.add("rounded-b-md");

        id_name.addEventListener("blur", () => {
            if (!isInteractingWithList) { id_found_user_list.classList.add("hidden") };
        });

        id_found_user_list.innerHTML = null;

        ["mouseenter", "mouseleave"].forEach(type => {
            id_found_user_list.addEventListener(type, () => {
                if (type === "mouseenter") {
                    isInteractingWithList = true;
                } else if (type === "mouseleave") {
                    isInteractingWithList = false;
                };
            });
        });

        id_staff_list.innerHTML = null;
        id_staff_list_error.innerText = null;
        id_staff_list_error.hidden = true;

        ["click", "keydown", "focus"].forEach(type => {
            id_name.addEventListener(type, event => {
                console.log("project: " + isUserFound);

                if (isUserFound) {
                    id_found_user_list.classList.remove("hidden");

                    if (event.key === "Enter") {
                        id_found_user_list.firstElementChild.click();
                    } else if (event.key === "ArrowDown") {
                        isInteractingWithList = true;
                        id_found_user_list.firstElementChild.setAttribute("tabindex", "0");
                        id_found_user_list.firstElementChild.focus();
                        allowArrowKeysForNavigatingFoundUserList();
                        setTimeout(() => { isInteractingWithList = false }, 100);
                    };

                    const class_users = id_found_user_list.querySelectorAll(".class-user");

                    ["click", "keyup"].forEach(type => {
                        class_users.forEach(user => {
                            user.addEventListener(type, event => {
                                if (type === "click" || event.key === "Enter" || event.key === " ") {
                                    const userData = {
                                        pk: user.dataset.pk,
                                        name: user.dataset.name,
                                        studentId: user.dataset.studentId,
                                        avatarUrl: user.dataset.avatarUrl,
                                    };

                                    addStaff(userData, blink = true);
                                };
                            });
                        });
                    });
                } else {
                    id_found_user_list.classList.add("hidden");
                };
            });
        });

        staffBoxElements.forEach(element => { element.classList.add("bg-transparent") });
        staffBoxElements.forEach(element => { element.classList.remove("bg-flamingo-50", "ring-transparent") });
    };
}

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

    initStaffBox();

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

        const staffArray = JSON.parse(data.staff.replace(/'/g, '"'));

        staffArray.forEach(user => {
            user.position_priority.forEach(priority => {
                const position = document.querySelector(`[data-priority="${priority}"]`);

                positionData = {
                    priority: position.dataset.priority,
                    keyword: position.dataset.keyword,
                    required: position.dataset.required,
                };

                const userData = {
                    pk: user.pk,
                    name: user.name,
                    studentId: user.student_id,
                    avatarUrl: user.avatar_url,
                };

                addStaff(userData);
            });
        });

        id_staff_list_original.value = data.staffOriginal;
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

function requestVerifyAuthentication() {
    request.url = `${originLocation}/users/utils/verify-authentication/`;
    request.type = "POST";
    request.data = { id: "verify_authentication" };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

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
    let formData = new FormData();

    formData.append("id", "create_project");
    formData.append("title", id_title.value);
    formData.append("category", id_category.value);

    addedStaffs.forEach((staff, index) => {
        formData.append(`staffPk_${index}`, staff.pk);

        let staffPositionPriority = staff.position.map(position => position.priority);

        staffPositionPriority.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });

        formData.append(`staffPositionPriority_${index}`, JSON.stringify(staffPositionPriority));
    });

    request.url = `${originLocation}/project/utils/project/`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateProject() {
    let formData = new FormData();

    formData.append("id", "update_project");
    formData.append("page_id", id_page_id.value);
    formData.append("title", id_title.value);
    formData.append("category", id_category.value);

    addedStaffs.forEach((staff, index) => {
        formData.append(`staffPk_${index}`, staff.pk);

        let staffPositionPriority = staff.position.map(position => position.priority);

        staffPositionPriority.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });

        formData.append(`staffPositionPriority_${index}`, JSON.stringify(staffPositionPriority));
    });

    request.url = `${originLocation}/project/utils/project/`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteProject() {
    const staffList = JSON.parse(id_staff_list_original.value.replace(/'/g, '"'));
    request.url = `${originLocation}/project/utils/project/`;
    request.type = "POST";
    request.data = { id: "delete_project", page_id: `${id_page_id.value}`, title: `${id_title_original.value}`, category: `${id_category_original.value}`, staff: `${JSON.stringify(staffList)}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        if (id_modal !== null) {
            requestVerifyAuthentication();

            const class_firsts = document.querySelectorAll(".class-first");

            initValidation(class_firsts, id_create_or_update);
            initStaffBoxValidation();

            id_name.addEventListener("input", () => {
                if (isItOkayToFindUser()) {
                    requestFindUser();
                } else {
                    isUserFound = false;
                };
            });

            ["click", "keyup"].forEach(type => {
                id_create_or_update.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (isItOkayToSubmitProjectForm()) {
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
                                controlErrorInStaffBox();
                                if (addedStaffs.length > 0 && !isProducer) { displayButtonMsg(true, id_create_or_update, "error", "제작자(Producer)만 프로젝트를 생성할 수 있어요.") };
                            });
                        };
                    };

                    ["keydown", "focusin"].forEach(type => {
                        inputs.forEach(input => {
                            input.addEventListener(type, () => {
                                displayButtonMsg(false, id_create_or_update, "error");
                            });
                        });

                        staffBoxElements.forEach(element => {
                            element.addEventListener(type, () => {
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