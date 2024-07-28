//
// Global variables
//

// modal
const id_modal = document.getElementById("id_modal");
const id_record_id = document.getElementById("id_record_id");
const id_title = document.getElementById("id_title");
const id_original_title = code("id_original_", id_title);
const id_purpose = document.getElementById("id_purpose");
const id_purpose_record_id = code(id_purpose, "_record_id");
const id_select_purpose = code("id_select_", id_purpose);
const id_purpose_list = code(id_purpose, "_list");
const id_purpose_error = code(id_purpose, "_error");
const id_instructor = document.getElementById("id_instructor");
const id_subject_code = document.getElementById("id_subject_code");
const id_subject_name = document.getElementById("id_subject_name");
const id_original_instructor = code("id_original_", id_instructor);
const id_target_academic_year_and_semester = document.getElementById("id_target_academic_year_and_semester");
const id_position = document.getElementById("id_position");
const id_original_purpose = code("id_original_", id_purpose);
const id_production_end_date = document.getElementById("id_production_end_date");
const id_original_production_end_date = code("id_original_", id_production_end_date);
const id_select_position = code("id_select_", id_position);
const id_found_position_list = document.getElementById("id_found_position_list");
const id_name = document.getElementById("id_name");
const id_found_user_list = document.getElementById("id_found_user_list");
const id_staff_list = document.getElementById("id_staff_list");
const id_staff_list_error = code(id_staff_list, "_error");
const id_original_staff_list = code("id_original_", id_staff_list);
const id_keyword = document.getElementById("id_keyword");
const id_create_or_update = document.getElementById("id_create_or_update");
const id_delete = document.getElementById("id_delete");
const id_delete_text = code(id_delete, "_text");

// boolean
let isUserFound = false;
let isInteractingWithList = false;
let isPurposeSelected = false;
let isUserProducer = false;
let isItDoubleChecked = false;

// miscellaneous
const staffBoxElements = [id_select_position, id_found_position_list, id_name];
let baseDate;
let positionData; // This is an object like {"priority": "A01", "keyword": "연출", "required": "True"}
let requiredPositions = [];
let addedRequiredPositions = []; // This is an array like [{"priority": "A01", "keyword": "연출", "required": "True"}, {"priority": "B01", "keyword": "제작", "required": "True"}]
let addedStaffs = [];
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

function displayErrorInPurpose(bool, errorType = null) {
    if (bool) {
        if (errorType === "empty") {
            id_purpose_error.innerText = "유형을 선택해주세요.";
        };

        id_purpose_error.hidden = false;
        id_select_purpose.classList.add("bg-flamingo-50", "ring-transparent", "hover:df-ring-inset-gray");
    } else {
        id_purpose_error.innerText = null;
        id_purpose_error.hidden = true;
        id_select_purpose.classList.remove("bg-flamingo-50", "ring-transparent", "hover:df-ring-inset-gray");
    }
}

function controlErrorInPurpose() {
    if (id_purpose.value === "") {
        displayErrorInPurpose(true, "empty");
    } else {
        return false;
    };
}

function validatePurpose() {
    let isPurposeListOpen = false;

    ["click", "keydown"].forEach(type => {
        id_select_purpose.addEventListener(type, event => {
            if (type === "click" || event.key === "Enter" || event.key === " " || event.key === "ArrowUp" || event.key === "ArrowDown") {
                displayErrorInPurpose(false);
            };
        });
    });

    id_select_purpose.addEventListener("focusout", () => {
        isPurposeListOpen = id_purpose_list.style.display === "";
        if (!isPurposeListOpen) { controlErrorInPurpose() };
    });

    id_purpose_list.addEventListener("focusout", () => {
        isPurposeListOpen = id_purpose_list.style.display === "";
        controlErrorInPurpose();
    });

    id_select_purpose.addEventListener("focusin", () => {
        displayErrorInPurpose(false);
    });
}

function initPurposeValidation() {
    validatePurpose();
}

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
        if (!areObjectsEqual(a[i], b[i])) return false; // Use areObjectsEqual() to compare objects
    };

    return true;
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

    isPurposeSelected = id_purpose.value !== "";
    isUserProducer = addedStaffs.some(staff => staff.pk === userPk && staff.position.some(position => position.keyword === "제작"));

    return areStaffsAdded && areAllRequiredPositionsAdded && isPurposeSelected && isUserProducer && isItOkayToSubmitForm();
}

function executeWhenPurposeIsSelected(selectedPurpose = null) {
    displayErrorInPurpose(false);
    displayError(false, id_instructor);

    if (selectedPurpose) {
        initFoundInstructorList({ status: null });

        const id_found_instructor_list_help = document.getElementById("id_found_instructor_list_help");

        id_instructor.value = null;
        id_subject_code.value = null;
        id_subject_name.value = null;
        id_found_instructor_list_help.innerText = "선택 가능한 교원을 찾고 있어요.";
        id_purpose_record_id.value = selectedPurpose.record_id;
        id_purpose.value = selectedPurpose.priority;
        requestFindInstructor();
    };

    id_instructor.classList.add("class-first");

    const class_firsts = document.querySelectorAll(".class-first");

    initValidation(class_firsts, id_create_or_update);
}

function executeWhenPositionIsSelected(selectedPosition = null) {
    const isValidPosition = selectedPosition && selectedPosition.priority !== "";

    id_position.value = isValidPosition ? selectedPosition.priority : null;
    id_name.readOnly = !isValidPosition;

    if (isValidPosition) {
        positionData = {
            priority: selectedPosition.priority,
            keyword: selectedPosition.keyword,
            required: selectedPosition.required,
        };

        id_name.focus();
    };
}

//
// Main functions
//

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
                position: JSON.parse(staff.dataset.position), // This is an array like [{"priority": "A01", "keyword": "연출", "required": "True"}, {"priority": "A02", "keyword": "각본", "required": "False"}]
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

function initFoundInstructorList(response) {
    const status = response.status;
    const targetAcademicYearAndSemester = response.target_academic_year_and_semester;
    const id_found_instructor_list = document.getElementById("id_found_instructor_list");

    id_found_instructor_list.innerHTML = "";

    // FAIL
    if (status === "FAIL" || status === null) {
        let placeholder;

        if (status === null) {
            placeholder = "유형을 선택하면 선택 가능한 교원이 표시돼요.";
        } else {
            const reason = response.reason;

            if (reason === "NOT_CURRICULAR_PROJECT") {
                placeholder = "개인 프로젝트는 교원을 선택하지 않아도 돼요.";
                id_target_academic_year_and_semester.innerText = null;
            } else if (reason === "NO_SUBJECTS_FOUND") {
                placeholder = "개설 교과목이 없어 교원을 선택할 수 없어요.";
                id_target_academic_year_and_semester.innerText = targetAcademicYearAndSemester;
            };
        };

        const placeholderElement = document.createElement("div");

        placeholderElement.className = "relative flex items-center h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray bg-gray-50"

        placeholderElement.innerHTML = `
            <div class="flex flex-1 justify-center">
                <span id="id_found_instructor_list_help"
                    class="text-sm text-center text-gray-500">${placeholder}</span>
            </div>
        `;

        id_found_instructor_list.appendChild(placeholderElement);

        Array.from(inputs).forEach(input => {
            if (input.id.indexOf("instructor") !== -1) {
                let idx = inputs.indexOf(input);

                while (idx > -1) {
                    inputs.splice(idx, 1);
                    idx = inputs.indexOf(input);
                };
            };
        });

        return;
    };

    id_target_academic_year_and_semester.innerText = targetAcademicYearAndSemester;

    response.found_instructor_list.forEach(newlyFoundInstructor => {
        const newlyFoundInstructorElement = document.createElement("label");
        const data_instructor = newlyFoundInstructorElement.dataset;

        data_instructor.id = newlyFoundInstructor.id;
        data_instructor.name = newlyFoundInstructor.name;
        data_instructor.code = newlyFoundInstructor.code;
        data_instructor.subject = newlyFoundInstructor.subject;
        newlyFoundInstructorElement.className = "relative flex items-center cursor-pointer h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";

        newlyFoundInstructorElement.innerHTML = `
            <input id="id_instructor_${data_instructor.id}"
                    name="id_instructor"
                    type="radio"
                    value="${data_instructor.id}"
                    class="sr-only class-first class-radio class-instuctor"
                    aria-labelledby="id_instructor_${data_instructor.id}_label"
                    aria-describedby="id_instructor_${data_instructor.id}_descr">
            <div class="flex flex-1">
                <span class="flex flex-col">
                    <span id="id_instructor_${data_instructor.id}_label" class="block whitespace-pre-line text-sm font-medium text-gray-900">${data_instructor.name}</span>
                    <span id="id_instructor_${data_instructor.id}_descr" class="mt-1 flex items-center text-sm text-gray-500">
                        ${data_instructor.code} ${data_instructor.subject}
                    </span>
                    <p id="id_instructor_${data_instructor.id}_error" class="mt-2 text-flamingo-600" hidden=""></p>
                </span>
            </div>
            <svg class="h-5 w-5 ml-1 text-flamingo"
                viewBox="0 0 16 20"
                fill="currentColor"
                aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <span class="pointer-events-none absolute -inset-px rounded-md"
                aria-hidden="true"></span>
        `;

        id_found_instructor_list.appendChild(newlyFoundInstructorElement);
    });

    const class_instructors = document.querySelectorAll(".class-instuctor");

    class_instructors.forEach((instructor) => {
        const label = instructor.closest("label");
        const svg = label.querySelector("svg");

        instructor.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                instructor.click();
            };
        });

        instructor.addEventListener("click", () => {
            if (instructor.id.indexOf("instructor") !== -1) {
                id_instructor.value = instructor.value;
                id_subject_code.value = instructor.parentElement.dataset.code;
                id_subject_name.value = instructor.parentElement.dataset.subject;
            };
        });

        instructor.addEventListener("focus", () => {
            label.classList.add("df-focus-ring-inset");
            svg.classList.remove("invisible");
        });

        instructor.addEventListener("blur", () => {
            if (!instructor.checked) {
                svg.classList.add("invisible");
            } else if (instructor.checked) {
                label.classList.add("df-ring-inset-flamingo");
            };

            label.classList.remove("df-focus-ring-inset");
        });

        instructor.addEventListener("change", () => {
            const otherInputs = [...class_instructors].filter(i => i !== instructor);

            if (instructor.checked) {
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

        if (id_instructor.value === instructor.value) {
            instructor.click();
        };

        if (!instructor.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    const class_firsts = document.querySelectorAll(".class-first");

    initValidation(class_firsts, id_create_or_update);
}

function initFoundUserList(response = null) {
    // FAIL
    if (response === null) {
        isUserFound = false;

        return;
    };

    // DONE
    isUserFound = true;

    response.found_user_list.forEach(newlyFoundUser => {
        const alreadyFoundUsers = id_found_user_list.querySelectorAll("li");

        alreadyFoundUsers.forEach(alreadyFoundUser => {
            if (alreadyFoundUser.dataset.name !== newlyFoundUser.name) {
                id_found_user_list.removeChild(alreadyFoundUser);
            };
        });

        if (!document.getElementById(`id_found_user_${newlyFoundUser.pk}`)) {
            const newlyFoundUserElement = document.createElement("li");
            const data_user = newlyFoundUserElement.dataset;

            data_user.pk = newlyFoundUser.pk;
            data_user.name = newlyFoundUser.name;
            data_user.studentId = newlyFoundUser.student_id;
            data_user.avatarUrl = newlyFoundUser.avatar_url;

            newlyFoundUserElement.id = `id_found_user_${data_user.pk}`;
            newlyFoundUserElement.classList.add("class-user", "relative", "outline-none", "cursor-default", "select-none", "py-2", "pl-3", "text-gray-900", "focus:bg-flamingo-600", "focus:text-white", "hover:bg-flamingo-600", "hover:text-white");
            newlyFoundUserElement.setAttribute("role", "option");

            newlyFoundUserElement.innerHTML = `
                <div class="flex items-center">
                    <img src="${data_user.avatarUrl}" alt="${data_user.name}님의 프로필 사진" class="h-6 w-6 flex-shrink-0 rounded-full">
                    <span class="font-semibold ml-3 truncate">${data_user.name}</span>
                    <span>&nbsp(${data_user.studentId})</span>
                </div>
            `;

            id_found_user_list.appendChild(newlyFoundUserElement);
        };
    });

    id_name.click(); // To pass the isUserFound boolean value to initStaffBox()
}

function initStaffBox() {
    if (id_modal !== null) {
        const id_position_placeholder = code(id_position, "_placeholder");
        const firstPosition = id_position_placeholder.nextElementSibling;

        addedRequiredPositions = [];
        addedStaffs = [];
        id_position.value = null;
        id_position_placeholder.click();
        firstPosition.style.setProperty("border-top", "none", "important");
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
    const id_title_placeholder_array = new Array("<피아골>", "<속 돌아온 외다리>", "<초대받은 사람들>", "<불나비>", "<만선>", "<서편제>", "<자유부인>", "<안개 마을>", "<축제>", "<낙동강>", "<민며느리>", "<장희빈>", "<청춘의 십자로>", "<쇠사슬을 끊어라>", "<와룡선생 상경기>", "<사의 찬미>", "<월급쟁이>");
    const id_title_placeholder = randomItem(id_title_placeholder_array);
    const id_purpose_placeholder = code(id_purpose, "_placeholder");
    const firstPurpose = id_purpose_placeholder.nextElementSibling;

    id_title.value = null;
    id_title.placeholder = id_title_placeholder;
    id_purpose_record_id.value = null;
    id_purpose.value = null;
    id_purpose_placeholder.click();
    firstPurpose.style.setProperty("border-top", "none", "important");
    id_instructor.value = null;
    id_subject_code.value = null;
    id_subject_name.value = null;
    id_instructor.classList.remove("class-first");
    id_subject_code.value = null;
    id_subject_name.value = null;
    id_target_academic_year_and_semester.innerText = null;
    id_production_end_date.value = null;
    id_production_end_date.placeholder = yyyymmddOfAfter90DaysWithDash;

    initStaffBox();

    inputs.forEach((input) => {
        displayError(false, input);
    });

    displayErrorInPurpose(false);

    [id_create_or_update, id_delete].forEach(button => {
        displayButtonMsg(false, button, "error");
    });

    const class_firsts = document.querySelectorAll(".class-first");

    initValidation(class_firsts, id_create_or_update);
}

function updateForm(action, datasetObj = null) {
    const class_keywords = document.querySelectorAll(".class-keyword");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    handleFocusForModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // action: "create"
    if (action === "create") {
        baseDate = new Date().toISOString().slice(0, 10);

        class_keywords.forEach(keyword => {
            keyword.innerText = "등록하기";
        });

        initForm();
        initFoundInstructorList({ status: null });

        const id_found_instructor_list_help = document.getElementById("id_found_instructor_list_help");

        id_found_instructor_list_help.innerText = "유형을 선택하면 선택 가능한 교원이 표시돼요.";
        id_delete.classList.replace("inline-flex", "hidden");
    }

    // action: "adjust"
    else if (action === "adjust") {
        const data = datasetObj.dataset;

        updateForm("create");

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        const id_found_instructor_list_help = document.getElementById("id_found_instructor_list_help");

        baseDate = data.createdDate;
        id_found_instructor_list_help.innerText = "선택 가능한 교원을 찾고 있어요.";
        id_record_id.value = data.recordId;
        id_title.value = data.title;
        id_original_title.value = data.title;
        id_purpose_record_id.value = data.purposeRecordId;
        id_purpose.value = data.purpose;
        code(id_purpose, `_${data.purpose}`).click();
        id_original_purpose.value = data.purpose;
        id_instructor.value = data.instructor;
        id_subject_code.value = data.subjectCode;
        id_subject_name.value = data.subjectName;
        id_original_instructor.value = data.instructor;
        id_production_end_date.value = data.productionEndDate;
        id_original_production_end_date.value = data.productionEndDate;

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

        id_original_staff_list.value = data.staff;
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

function requestFindInstructor() {
    request.url = `${location.origin}/project/utils/project/`;
    request.type = "POST";
    request.data = { id: "find_instructor", purpose: `${id_purpose.value}`, base_date: baseDate };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestFindUser() {
    request.url = `${location.origin}/project/utils/project/`;
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
    formData.append("purpose_record_id", id_purpose_record_id.value);
    formData.append("purpose", id_purpose.value);
    formData.append("instructor", id_instructor.value);
    formData.append("subject_code", id_subject_code.value);
    formData.append("subject_name", id_subject_name.value);
    formData.append("production_end_date", id_production_end_date.value);

    addedStaffs.forEach((staff, index) => {
        formData.append(`staffPk_${index}`, staff.pk);

        let staffPositionPriority = staff.position.map(position => position.priority);

        staffPositionPriority.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });

        formData.append(`staffPositionPriority_${index}`, JSON.stringify(staffPositionPriority));
    });

    request.url = `${location.origin}/project/utils/project/`;
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
    formData.append("record_id", id_record_id.value);
    formData.append("title", id_title.value);
    formData.append("purpose_record_id", id_purpose_record_id.value);
    formData.append("purpose", id_purpose.value);
    formData.append("instructor", id_instructor.value);
    formData.append("subject_code", id_subject_code.value);
    formData.append("subject_name", id_subject_name.value);
    formData.append("production_end_date", id_production_end_date.value);

    addedStaffs.forEach((staff, index) => {
        formData.append(`staffPk_${index}`, staff.pk);

        let staffPositionPriority = staff.position.map(position => position.priority);

        staffPositionPriority.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });

        formData.append(`staffPositionPriority_${index}`, JSON.stringify(staffPositionPriority));
    });

    request.url = `${location.origin}/project/utils/project/`;
    request.type = "POST";
    request.data = formData;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteProject() {
    request.url = `${location.origin}/project/utils/project/`;
    request.type = "POST";
    request.data = { id: "delete_project", record_id: id_record_id.value, title: id_original_title.value, purpose: id_original_purpose.value, instructor: id_original_instructor.value, subject_name: id_subject_name.value, production_end_date: id_production_end_date.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        requestVerifyAuthentication();

        if (id_modal === null) return;

        const class_firsts = document.querySelectorAll(".class-first");

        initValidation(class_firsts, id_create_or_update);
        initPurposeValidation();
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

                        if (id_create_or_update.innerText.trim() === "등록하기") {
                            requestCreateProject();
                        } else if (id_create_or_update.innerText.trim() === "수정하기") {
                            requestUpdateProject();
                        };

                        displayButtonMsg(true, id_create_or_update, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_create_or_update, "error");
                        id_create_or_update_spin.classList.remove("hidden");
                    } else {
                        inputs.forEach(input => {
                            controlError(input);
                            controlErrorInPurpose();
                            controlErrorInStaffBox();
                            if (addedStaffs.length > 0 && !isUserProducer) { displayButtonMsg(true, id_create_or_update, "error", "제작 담당(Producer)만 프로젝트를 등록할 수 있어요.") };
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
    });
}

initRequest();