//
// Global variables
//

// modal
const id_modal = document.getElementById("id_modal");
const id_modal_base = code(id_modal, "_base");
const id_modal_filter = code(id_modal, "_filter");
const id_modal_checkout = code(id_modal, "_checkout");
const id_scrollable_part_of_modal = code("id_scrollable_part_of_", id_modal);
const id_category = document.getElementById("id_category");
const id_purpose = document.getElementById("id_purpose");
const id_initialize_purpose = code("id_initialize_", id_purpose);
const id_period = document.getElementById("id_period");
const id_purpose_badge = code(id_purpose, "_badge");
const id_period_calendar = code(id_period, "_calendar");
const id_period_help = code(id_period, "_help");
const id_start_date_in_cart = document.getElementById("id_start_date_in_cart");
const id_end_date_in_cart = document.getElementById("id_end_date_in_cart");
const id_project = document.getElementById("id_project");
const id_start_time = document.getElementById("id_start_time");
const id_end_time = document.getElementById("id_end_time");
const id_signature_canvas = document.getElementById("id_signature_canvas");
const id_clear_signature_canvas = code("id_clear_", id_signature_canvas);
const id_signature_canvas_error = code(id_signature_canvas, "_error");
const id_filter_or_checkout = document.getElementById("id_filter_or_checkout");
const id_filter_or_checkout_text = code(id_filter_or_checkout, "_text");
const id_filter_or_checkout_descr = code(id_filter_or_checkout, "_descr");
const id_url = document.getElementById("id_url");
const id_copy_url = code("id_copy_", id_url);
const id_copy_url_ready = code(id_copy_url, "_ready");
const id_copy_url_done = code(id_copy_url, "_done");
const id_copy_url_descr = code(id_copy_url, "_descr");

// detail
const id_detail = document.getElementById("id_detail");
const id_detail_limit = code(id_detail, "_limit");
const id_requested_quantity = document.getElementById("id_requested_quantity");

// classes
let class_firsts = document.querySelectorAll(".class-first");

// boolean
let isQuantityButtonUpdated = false;
let isSignatureCanvasReady = false;
let isSignaturePlaceholderCleared = false;
let isSignatureCanvasDisabled = false;
let isSignatureDrawn = false;
let isUnhidden = false;

// miscellaneous
const data_purpose = id_purpose.dataset;
const data_period = id_period.dataset;

//
// Sub functions
//

function notifyRentalLimit() {
    const params = new URLSearchParams(window.location.search);

    if (!params.has("rentalLimited")) return;

    const collectionName = params.get("rentalLimited");
    const purposeKeyword = id_purpose_badge.innerText.split("\n")[1]
    const paramForNoti = { collectionName: collectionName, purposeKeyword: purposeKeyword };

    displayNoti(true, "RTL", paramForNoti);
}

notifyRentalLimit();

function adjustModalWidth() {
    const id_grid = document.getElementById("id_grid");
    let baseForWidth;

    if (id_grid !== null) { // equipment.html
        baseForWidth = id_grid;
    } else if (id_detail !== null) { // equipment_detail.html
        baseForWidth = id_detail;
    };

    if (id_modal_base !== null) {
        const id_modal_share = code(id_modal, "_share");

        if (id_modal_share.hidden === false) {
            id_modal_base.style = "";
        } else {
            // As a reminder, the width of each category button is adjusted by the Tailwind CSS
            if (this.window.innerWidth >= 640) {
                id_modal_base.style.setProperty("width", "512px", "important");
            } else if (this.window.innerWidth < 640) {
                id_modal_base.style.setProperty("width", baseForWidth.offsetWidth + "px", "important");
            };
        };
    };
}

function resizeWidthOfModalAndForm() {
    const id_modal_share = code(id_modal, "_share");

    adjustModalWidth();
    window.addEventListener("resize", adjustModalWidth);

    if (id_modal_share.hidden === false) {
        id_modal_base.style = "";
    };
}

function adjustDetailHeight() {
    if (id_detail !== null) {
        const id_detail_title = code(id_detail, "_title");
        const id_detail_content_padding_top = code(id_detail_title, "_padding_top");

        if (this.window.innerWidth >= 640 &&
            id_detail_title.querySelector("h2").offsetHeight > 32) {
            id_detail_title.style.setProperty("height", "158px", "important");
            id_detail_content_padding_top.style.setProperty("padding-top", "142px", "important");
        };
    };
}

adjustDetailHeight();

function closeNoti() {
    displayNoti(false, "MPP");
    displayNoti(false, "MDP");
    displayNoti(false, "EGL");
    displayNoti(false, "EQL");
    displayNoti(false, "PTA");
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getKoreanCharacterCount(str) {
    const length = str.length;

    switch (length) {
        case 1:
            return "한";
        case 2:
            return "두";
        case 3:
            return "세";
        case 4:
            return "네";
        case 5:
            return "다섯";
        case 6:
            return "여섯";
        case 7:
            return "일곱";
        case 8:
            return "여덟";
        case 9:
            return "아홉";
        case 10:
            return "열";
        case 11:
            return "열한";
        case 12:
            return "열두";
        case 13:
            return "열세";
        case 14:
            return "열네";
        case 15:
            return "열다섯";
        case 16:
            return "열여섯";
        case 17:
            return "열일곱";
        case 18:
            return "열여덟";
        case 19:
            return "열아홉";
        default:
            return `${length}`;
    };
}

function displayErrorInSignatureCanvas(bool, errorType = null) {
    if (bool) {
        if (errorType === "empty") {
            id_signature_canvas_error.innerText = "기자재 사용 신청을 위해 서약해주세요.";
        } else if (errorType === "invalid") {
            id_signature_canvas_error.innerText = `${userName}님의 성명을 정자체로 다시 써주세요.`;
        };

        id_signature_canvas_error.hidden = false;
        id_signature_canvas.classList.replace("df-ring-inset-gray", "ring-transparent");
        id_signature_canvas.classList.add("bg-flamingo-50");
        id_signature_canvas.classList.add("hover:df-ring-inset-gray");
    } else {
        id_signature_canvas_error.innerText = null;
        id_signature_canvas_error.hidden = true;
        id_signature_canvas.classList.replace("ring-transparent", "df-ring-inset-gray");
        id_signature_canvas.classList.remove("bg-flamingo-50");
        id_signature_canvas.classList.remove("hover:df-ring-inset-gray");
    };
}

function controlErrorInSignatureCanvas() {
    if (isSignatureDrawn === false) {
        displayErrorInSignatureCanvas(true, "empty");
    } else {
        return false;
    };
}

function validateSignatureCanvas() {
    ["click", "touchstart"].forEach(type => {
        id_signature_canvas.addEventListener(type, () => {
            displayErrorInSignatureCanvas(false);
            displayButtonMsg(false, id_filter_or_checkout, "error");
        });
    });

    id_signature_canvas.addEventListener("focusout", () => {
        controlErrorInSignatureCanvas();
    });

    id_signature_canvas.addEventListener("focusin", () => {
        displayErrorInSignatureCanvas(false);
        displayButtonMsg(false, id_filter_or_checkout, "error");
    });
}

function initSignatureCanvasValidation() {
    validateSignatureCanvas();
}

function convertSignatureToFile() {
    if (isSignatureCanvasDisabled) return null;

    return new Promise((resolve) => {
        id_signature_canvas.toBlob(function (blob) {
            resolve(blob);
        }, "image/png");
    });
}


function executeWhenUserGoesToSelectPurpose() {
    if (id_detail !== null) {
        const id_open_modal_and_focus_on_purpose = document.getElementById("id_open_modal_and_focus_on_purpose");

        ["click", "keyup"].forEach(type => {
            id_open_modal_and_focus_on_purpose.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    const filter = document.querySelector('.class-filter');
                    const id_purpose_label = code(id_purpose, "_label");
                    const id_select_purpose = document.getElementById("id_select_purpose");
                    const id_period_label = code(id_period, "_label");
                    const id_period_base = code(id_period, "_base");

                    filter.click();
                    setTimeout(() => { id_purpose_label.classList.add("blink") }, 500);
                    setTimeout(() => { id_select_purpose.classList.add("blink-ring") }, 500);
                    setTimeout(() => { id_purpose_label.classList.remove("blink") }, 3500);
                    setTimeout(() => { id_select_purpose.classList.remove("blink-ring") }, 3500);
                    setTimeout(() => { id_period_label.classList.add("blink") }, 500);
                    setTimeout(() => { id_period_base.classList.add("blink-ring") }, 500);
                    setTimeout(() => { id_period_calendar.classList.add("blink-ring") }, 500);
                    setTimeout(() => { id_period_label.classList.remove("blink") }, 3500);
                    setTimeout(() => { id_period_base.classList.remove("blink-ring") }, 3500);
                    setTimeout(() => { id_period_calendar.classList.remove("blink-ring") }, 3500);
                    setTimeout(() => { id_purpose_label.scrollIntoView({ behavior: "smooth" }) }, 100);
                };
            });
        });
    };
}

executeWhenUserGoesToSelectPurpose();

function executeWhenPurposeIsSelected(selectedPurpose = null) {
    displayError(false, id_period);

    if (selectedPurpose) {
        id_purpose.value = selectedPurpose.priority;
        id_initialize_purpose.hidden = false;
        id_period.classList.add("class-first");
        id_period.classList.add("alt-calendar");
        data_purpose.atLeast = selectedPurpose.at_least;
        data_purpose.upTo = selectedPurpose.up_to;
        data_purpose.max = selectedPurpose.max;
        data_period.startDateMin = formatDateInFewDays(now, data_purpose.atLeast);
        data_period.startDateMax = formatDateInFewDays(now, data_purpose.upTo);
        id_period_calendar.classList.replace("bg-gray-100", "bg-white");
        id_scrollable_part_of_modal.scrollTo({ top: id_scrollable_part_of_modal.scrollHeight, behavior: "smooth" });
    } else {
        id_purpose.value = null;
        id_initialize_purpose.hidden = true;
        id_period.classList.remove("class-first");
        id_period.classList.remove("alt-calendar");
        data_purpose.atLeast = "";
        data_purpose.upTo = "";
        data_purpose.max = "";
        data_period.startDateMin = "";
        data_period.startDateMax = "";
        id_period_calendar.classList.replace("bg-white", "bg-gray-100");
    };

    id_period.value = "";
    initCalendar();
    class_firsts = document.querySelectorAll(".class-first");
    initValidation(class_firsts, id_filter_or_checkout);
}

function executeWhenCartIsUpdated() {
    const class_total_quantities = document.querySelectorAll(".class-total-quantity");
    const cart = JSON.parse(sessionStorage.getItem("cart"));

    if (cart === null) return;

    class_total_quantities.forEach(total_quantity => {
        total_quantity.innerText = cart.length;
    });
}

executeWhenCartIsUpdated();

function executeWhenGroupLimitIsExceeded() {
    const id_close_modal = code("id_close_", id_modal);

    setTimeout(() => { id_close_modal.click() }, 10);
    id_detail_limit.scrollIntoView({ behavior: "smooth" })

    if (id_detail_limit.getAttribute("aria-expanded") === "false") {
        id_detail_limit.click();
    };

    const limits = id_detail_limit_content.querySelectorAll("li");

    limits.forEach(limit => {
        if (limit.innerText.indexOf("도합") !== -1) {
            setTimeout(() => { limit.classList.add("blink") }, 500);
            setTimeout(() => { limit.classList.remove("blink") }, 3500);
        };
    });
}

//
// Main functions
//

function initCalendar() {
    const id_period_prev_month = code(id_period, "_prev_month");
    const id_period_next_month = code(id_period, "_next_month");
    const purposeQuery = urlParams.get("purposePriority");
    const periodQuery = urlParams.get("period");
    const daysFromNow = periodQuery ? Number(periodQuery.split(",")[0]) : null;
    const duration = periodQuery ? Number(periodQuery.split(",")[1]) : null;
    let currentDate;
    let startDate = null;
    let endDate = null;
    let durationToDisplay;

    data_period.startDate = "";
    data_period.endDate = "";

    if (id_purpose.value === purposeQuery && periodQuery !== null) {
        if (Number(data_purpose.atLeast) <= daysFromNow &&
            daysFromNow <= Number(data_purpose.upTo) &&
            0 <= duration &&
            duration <= Number(data_purpose.max)) {
            id_period.value = `${daysFromNow},${duration}`;
            displayError(false, id_period);
            data_period.startDate = formatDateInFewDays(now, daysFromNow);
            data_period.endDate = formatDateInFewDays(data_period.startDate, duration);
        };
    };

    if (data_period.startDate) {
        startDate = new Date(data_period.startDate + "T00:00:00");
        currentDate = new Date(data_period.startDate + "T00:00:00");
    } else {
        currentDate = new Date();
    };

    if (data_period.endDate) {
        endDate = new Date(data_period.endDate + "T00:00:00");
    };

    function isDateSelected(date) {
        const formattedDate = formatDate(date);

        return formattedDate === data_period.startDate || formattedDate === data_period.endDate;
    }

    function isDateInRange(date) {
        const minDate = new Date(data_period.startDateMin + "T00:00:00");
        const maxDate = data_period.startDate && !data_period.endDate
            ? new Date(formatDateInFewDays(data_period.startDate, data_purpose.max) + "T00:00:00")
            : new Date(data_period.startDateMax + "T00:00:00");
        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        return compareDate >= minDate && compareDate <= maxDate;
    }

    function updateCalendar() {
        const id_period_current_month = code(id_period, "_current_month");
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const firstDateOfMonth = new Date(year, month, 1 - firstDayOfMonth);
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const totalDaysInCalendar = firstDayOfMonth + totalDaysInMonth + (7 - ((firstDayOfMonth + totalDaysInMonth) % 7)) % 7;

        id_period_current_month.textContent = `${year}년 ${month + 1}월`;

        while (id_period_calendar.firstChild) {
            id_period_calendar.removeChild(id_period_calendar.firstChild);
        };

        for (let i = 0; i < totalDaysInCalendar; i++) {
            const date = new Date(firstDateOfMonth.getFullYear(), firstDateOfMonth.getMonth(), firstDateOfMonth.getDate() + i);
            const isToday = date.toDateString() === now.toDateString();
            const isSelected = isDateSelected(date);
            const isCurrentMonth = date.getMonth() === month;
            const isInRange = isDateInRange(date);
            const isStartDate = formatDate(date) === data_period.startDate;
            const isEndDate = formatDate(date) === data_period.endDate;
            const isSameStartEnd = data_period.startDate === data_period.endDate && isStartDate;
            const dayElement = document.createElement("div");
            const buttonElement = document.createElement("button");
            let buttonClasses = "mx-auto flex h-8 w-8 items-center justify-center ";

            if (isSameStartEnd) {
                buttonClasses += "rounded-full ";
            } else {
                if (isStartDate || (isSelected && !endDate)) {
                    buttonClasses += "rounded-l-full ";
                } else if (isEndDate || (isSelected && !startDate)) {
                    buttonClasses += "rounded-r-full ";
                } else {
                    buttonClasses += "rounded-full ";
                };
            };

            if (isStartDate || (isSelected && !endDate)) {
                buttonClasses += "rounded-l-full ";
            } else if (isEndDate || (isSelected && !startDate)) {
                buttonClasses += "rounded-r-full ";
            } else {
                buttonClasses += "rounded-full ";
            };

            if (isStartDate) {
                id_scrollable_part_of_modal.scrollTo({ top: id_scrollable_part_of_modal.scrollHeight, behavior: "auto" })
            };

            if (isSelected) {
                buttonClasses += "bg-flamingo-600 text-white ";
            } else {
                if (isToday) {
                    buttonClasses += "rounded-full df-ring-inset-flamingo text-flamingo-600 ";
                } else if (isInRange) {
                    buttonClasses += "text-gray-900 ";
                } else {
                    buttonClasses += isCurrentMonth ? "text-gray-900 " : "text-gray-400 ";
                };
            };

            if (isInRange) {
                buttonClasses += isSelected || isToday ? "font-semibold " : "hover:bg-gray-100 ";
            } else {
                buttonClasses += "opacity-50 cursor-not-allowed ";
            };

            buttonClasses += "focus:df-focus-ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";

            dayElement.className = "py-2";
            buttonElement.type = "button";
            buttonElement.className = buttonClasses;
            buttonElement.innerHTML = `<time datetime="${formatDate(date)}">${date.getDate()}</time>`;
            buttonElement.disabled = !isInRange;

            if (isInRange) {
                buttonElement.addEventListener("click", () => {
                    handleDateSelection(date);
                });
            };

            dayElement.appendChild(buttonElement);
            id_period_calendar.appendChild(dayElement);
        };

        buttons = document.querySelectorAll("button");
    }

    function handleDateSelection(date) {
        if (!isDateInRange(date)) return;

        const id_period_error = code(id_period, "_error");
        const formattedDate = formatDate(date);

        if (!startDate || endDate) {
            startDate = date;
            data_period.startDate = formattedDate;
            data_period.endDate = "";
            endDate = null;
            data_period.endDateMax = formatDateInFewDays(data_period.startDate, data_purpose.max);
            id_period_help.hidden = false;
            id_period_help.innerText = `희망 반납일을 ${data_period.startDate} ~ ${data_period.endDateMax} 범위 내에서 선택해주세요.`;
            id_period_error.hidden = true;
            id_period.value = calculateDateDifference(formatDate(now), data_period.startDate);
        } else {
            if (date < startDate) {
                startDate = date;
                data_period.startDate = formatDate(startDate);
                data_period.endDate = "";
                endDate = null;
                data_period.endDateMax = formatDateInFewDays(data_period.startDate, data_purpose.max);
                id_period_help.hidden = false;
                id_period_help.innerText = `희망 반납일을 ${data_period.startDate} ~ ${data_period.endDateMax} 범위 내에서 선택해주세요.`;
                id_period_error.hidden = true;
                id_period.value = calculateDateDifference(formatDate(now), data_period.startDate);
            } else {
                endDate = date;
                data_period.endDate = formatDate(endDate);
                durationToDisplay = calculateDateDifference(data_period.startDate, data_period.endDate);
                id_period.value += `,${durationToDisplay}`;
                durationToDisplay === 0 ? durationToDisplay = "당" : null;
                id_period_help.hidden = false;
                id_period_help.innerText = `대여 기간이 ${durationToDisplay}일(${data_period.startDate} ~ ${data_period.endDate})로 선택되었어요.`;
                id_period_error.hidden = true;
            };
        };

        updateCalendar();
    }

    id_period_prev_month.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    id_period_next_month.addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();

    if (data_period.startDateMin === "") {
        id_period_help.hidden = true;
    } else if (data_period.startDate === "") {
        id_period_help.hidden = false;
        id_period_help.innerText = `희망 대여일을 ${data_period.startDateMin} ~ ${data_period.startDateMax} 범위 내에서 선택해주세요.`;
    } else {
        durationToDisplay = duration
        durationToDisplay === 0 ? durationToDisplay = "당" : null;
        id_period_help.hidden = false;
        id_period_help.innerText = `대여 기간이 ${durationToDisplay}일(${data_period.startDate} ~ ${data_period.endDate})로 선택되었어요.`;
    };
}

function initFoundProjectList(resResult = null) {
    const id_found_project_list = document.getElementById("id_found_project_list");
    const cart = JSON.parse(sessionStorage.getItem("cart"));

    id_found_project_list.innerHTML = "";

    // FAIL
    if (resResult === null) {
        const placeholderElement = document.createElement("div");

        placeholderElement.className = "relative flex items-center h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray bg-gray-50";

        placeholderElement.innerHTML = `
            <div class="flex flex-1 justify-center">
                <span id="id_found_project_list_help"
                      class="text-sm text-center text-gray-500">선택 가능한 ${cart !== null ? cart[0].purpose.keyword : null} 프로젝트가 없어요.</span>
            </div>
        `;

        id_found_project_list.appendChild(placeholderElement);

        return;
    };

    // DONE
    const cartPurposePriority = cart[0].purpose.priority;

    resResult.found_project_list.forEach(newlyFoundProject => {
        const productionEndDate = new Date(newlyFoundProject.production_end_date);
        const today = new Date();

        productionEndDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const is_production_over = productionEndDate < today;
        const projectPurposePriority = newlyFoundProject.purpose.priority;
        const is_purpose_incorrect = projectPurposePriority !== cartPurposePriority;

        if (is_production_over || is_purpose_incorrect) {
            initFoundProjectList();
            return;
        };

        const newlyFoundProjectElement = document.createElement("label");
        const data_project = newlyFoundProjectElement.dataset;

        data_project.pageId = newlyFoundProject.page_id;
        data_project.title = newlyFoundProject.title;
        data_project.directorName = newlyFoundProject.director_name;
        data_project.producerName = newlyFoundProject.producer_name;
        newlyFoundProjectElement.className = "relative flex items-center cursor-pointer h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";

        newlyFoundProjectElement.innerHTML = `
            <input id="id_project_${data_project.pageId}"
                    name="id_project"
                    type="radio"
                    value="${data_project.pageId}"
                    class="sr-only class-second class-radio class-project"
                    aria-labelledby="id_project_${data_project.pageId}_label"
                    aria-describedby="id_project_${data_project.pageId}_descr">
            <div class="flex flex-1">
                <span class="flex flex-col">
                    <span id="id_project_${data_project.pageId}_label" class="block whitespace-pre-line text-sm font-medium text-gray-900">${escapeHtml(data_project.title)}</span>
                    <span id="id_project_${data_project.pageId}_descr" class="mt-1 flex items-center text-sm text-gray-500">
                        연출&nbsp;
                        <span class="font-semibold">${data_project.directorName}</span>
                        &nbsp;·&nbsp;제작&nbsp;
                        <span class="font-semibold">${data_project.producerName}</span>
                    </span>
                    <p id="id_project_${data_project.pageId}_error" class="mt-2 text-flamingo-600" hidden=""></p>
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

        id_found_project_list.appendChild(newlyFoundProjectElement);
    });

    const class_projects = document.querySelectorAll(".class-project");

    class_projects.forEach((project) => {
        if (id_project.value === project.value) {
            project.click();
        };

        const label = project.closest("label");
        const svg = label.querySelector("svg");

        project.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                project.click();
            };
        });

        project.addEventListener("click", () => {
            if (project.id.indexOf("project") !== -1) {
                id_project.value = project.value;
            };
        });

        project.addEventListener("focus", () => {
            label.classList.add("df-focus-ring-inset");
            svg.classList.remove("invisible");
        });

        project.addEventListener("blur", () => {
            if (!project.checked) {
                svg.classList.add("invisible");
            } else if (project.checked) {
                label.classList.add("df-ring-inset-flamingo");
            };

            label.classList.remove("df-focus-ring-inset");
        });

        project.addEventListener("change", () => {
            const otherInputs = [...class_projects].filter(i => i !== project);

            if (project.checked) {
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

        if (!project.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    const class_seconds = document.querySelectorAll(".class-second");

    initValidation(class_seconds, id_filter_or_checkout);
}

// TODO: Refactor this function
function initFoundHourList(resResult) {
    const start_hour_list = resResult.start_hour_list;
    const end_hour_list = resResult.end_hour_list;
    const id_start_time_list = document.getElementById("id_start_time_list");
    const id_end_time_list = document.getElementById("id_end_time_list");

    id_start_time_list.innerHTML = "";
    id_end_time_list.innerHTML = "";

    if (start_hour_list.length === 0 || end_hour_list.length === 0) {
        if (start_hour_list.length === 0) {
            const placeholderElement = document.createElement("label");

            placeholderElement.className = "relative flex max-[370px]:col-span-2 max-[480px]:col-span-3 min-[480px]:col-span-4 items-center h-[36px] p-4 shadow-sm rounded-md df-ring-inset-gray bg-gray-50";

            placeholderElement.innerHTML = `
                <div class="flex flex-1 justify-center">
                    <span id="${id_start_time_list.id}_help"
                        class="text-sm text-center text-gray-500">${id_start_date_in_cart.innerText.split("(")[1][0]}요일에는 기자재를 대여할 수 없어요.</span>
                </div>
            `;

            id_start_time_list.appendChild(placeholderElement);
        };

        if (end_hour_list.length === 0) {
            const placeholderElement = document.createElement("label");

            placeholderElement.className = "relative flex max-[370px]:col-span-2 max-[480px]:col-span-3 min-[480px]:col-span-4 items-center h-[36px] p-4 shadow-sm rounded-md df-ring-inset-gray bg-gray-50";

            placeholderElement.innerHTML = `
                <div class="flex flex-1 justify-center">
                    <span id="${id_end_time_list.id}_help"
                        class="text-sm text-center text-gray-500">${id_end_date_in_cart.innerText.split("(")[1][0]}요일에는 기자재를 반납할 수 없어요.</span>
                </div>
            `;

            id_end_time_list.appendChild(placeholderElement);
        };
    };

    [start_hour_list, end_hour_list].forEach((hourList, index) => {
        const targetList = index === 0 ? id_start_time_list : id_end_time_list;
        const targetId = index === 0 ? id_start_time : id_end_time;
        const targetClass = index === 0 ? "class-start-time" : "class-end-time";

        hourList.forEach(newlyFoundHour => {
            const newlyFoundHourElement = document.createElement("label");
            const available = newlyFoundHour.available;
            const time = newlyFoundHour.time;
            const timeWihtoutColon = time.replace(":", "");

            if (available === true) {
                newlyFoundHourElement.className = "relative flex items-center cursor-pointer h-[36px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";

                newlyFoundHourElement.innerHTML = `
                    <input id="${targetId.id}_${timeWihtoutColon}"
                            name="${targetId.id}"
                            type="radio"
                            value="${timeWihtoutColon}"
                            class="sr-only class-second class-radio ${targetClass}"
                            aria-labelledby="${targetId.id}_${timeWihtoutColon}_label">
                    <span class="flex flex-1">
                        <span id="${targetId.id}_${timeWihtoutColon}_label"
                                class="block whitespace-pre-line text-sm font-medium text-gray-900">${time}</span>
                    </span>
                    <span id="${targetId.id}_${timeWihtoutColon}_descr" hidden></span>
                    <span id="${targetId.id}_${timeWihtoutColon}_error" hidden></span>
                    <svg class="h-5 w-5 ml-1 text-flamingo"
                            viewBox="0 0 16 20"
                            fill="currentColor"
                            aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                    </svg>
                    <span class="pointer-events-none absolute -inset-px rounded-md"
                            aria-hidden="true"></span>
                `;
            } else {
                newlyFoundHourElement.className = "relative flex items-center cursor-not-allowed h-[36px] p-4 shadow-sm rounded-md df-ring-inset-gray bg-gray-100";

                newlyFoundHourElement.innerHTML = `
                    <span class="flex flex-1">
                        <span class="block whitespace-pre-line text-sm font-medium text-gray-600">${time} 마감</span>
                    </span>
                `;
            };

            targetList.appendChild(newlyFoundHourElement);
        });

        const class_start_times = document.querySelectorAll(".class-start-time");
        const class_end_times = document.querySelectorAll(".class-end-time");

        [class_start_times, class_end_times].forEach((class_times, index) => {
            const targetId = index === 0 ? id_start_time : id_end_time;

            class_times.forEach((time) => {
                if (targetId.value === time.value) {
                    time.click();
                };

                const label = time.closest("label");
                const svg = label.querySelector("svg");

                time.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        time.click();
                    };
                });

                time.addEventListener("click", () => {
                    if (time.id.indexOf("time") !== -1) {
                        targetId.value = time.value;
                    };
                });

                time.addEventListener("focus", () => {
                    label.classList.add("df-focus-ring-inset");
                    svg.classList.remove("invisible");
                });

                time.addEventListener("blur", () => {
                    if (!time.checked) {
                        svg.classList.add("invisible");
                    } else if (time.checked) {
                        label.classList.add("df-ring-inset-flamingo");
                    };

                    label.classList.remove("df-focus-ring-inset");
                });

                time.addEventListener("change", () => {
                    const otherInputs = [...class_times].filter(i => i !== time);

                    if (time.checked) {
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

                if (!time.checked) {
                    label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                    svg.classList.add("invisible");
                } else {
                    label.classList.add("df-ring-inset-flamingo");
                };
            });
        });
    });

    const class_seconds = document.querySelectorAll(".class-second");

    initValidation(class_seconds, id_filter_or_checkout);
}

function initSignatureCanvas() {
    if (isSignatureCanvasReady === true) return;

    const ctx = id_signature_canvas.getContext("2d");
    let isDrawing = false;
    let lastPoint = null;
    let points = [];

    function setCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = id_signature_canvas.getBoundingClientRect();

        id_signature_canvas.width = rect.width * dpr;
        id_signature_canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    function adjustLineWidth() {
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }

    function drawPlaceholder() {
        setCanvasSize();
        adjustLineWidth();

        const rect = id_signature_canvas.getBoundingClientRect();
        const fontSize = rect.width / 20;

        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.font = `${fontSize}px "Noto Sans KR"`;
        ctx.fillStyle = "rgb(156 163 175)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const lineHeight = fontSize * 1.25;
        const middleY = rect.height / 2;

        if (isSignatureCanvasDisabled) {
            ctx.fillText("새로고침 후 다시 시도해주세요.", rect.width / 2, middleY);
        } else {
            if (userName.length > 5) {
                const line1Y = middleY - lineHeight * 1.5;
                const line2Y = middleY - lineHeight * 0.5;
                const line3Y = middleY + lineHeight * 0.5;
                const line4Y = middleY + lineHeight * 1.5;

                ctx.fillText(`${userName}님의`, rect.width / 2, line1Y);
                ctx.fillText(`성명 첫 다섯 글자 '${userName.slice(0, 5)}'${matchJosa(userName[4], "을를", "OJS")}`, rect.width / 2, line2Y);
                ctx.fillText("제3자가 알아볼 수 있도록", rect.width / 2, line3Y);
                ctx.fillText("정자체로 써주세요.", rect.width / 2, line4Y);
            } else {
                const line1Y = middleY - lineHeight;
                const line2Y = middleY;
                const line3Y = middleY + lineHeight;

                ctx.fillText(`${userName}님의 성명 ${getKoreanCharacterCount(userName)} 글자를`, rect.width / 2, line1Y);
                ctx.fillText("제3자가 알아볼 수 있도록", rect.width / 2, line2Y);
                ctx.fillText("정자체로 써주세요.", rect.width / 2, line3Y);
            };
        };
    }

    function startDrawing(e) {
        if (isSignatureCanvasDisabled) return;

        if (!isSignaturePlaceholderCleared) {
            ctx.clearRect(0, 0, id_signature_canvas.width, id_signature_canvas.height);
            isSignaturePlaceholderCleared = true;
        };

        isDrawing = true;
        isSignatureDrawn = true;
        adjustLineWidth();
        points = [];

        const { offsetX, offsetY } = getEventPosition(e);

        lastPoint = { x: offsetX, y: offsetY };
        points.push(lastPoint);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        id_clear_signature_canvas.hidden = false;
    }


    function draw(e) {
        if (!isDrawing || isSignatureCanvasDisabled) return;

        const { offsetX, offsetY } = getEventPosition(e);
        const point = { x: offsetX, y: offsetY };

        points.push(point);

        if (points.length > 2) {
            const prevPoint = points[points.length - 2];
            const cp = {
                x: (prevPoint.x + point.x) / 2,
                y: (prevPoint.y + point.y) / 2
            };

            ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cp.x, cp.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cp.x, cp.y);
        };

        lastPoint = point;
        id_clear_signature_canvas.hidden = false;
    }

    function stopDrawing() {
        if (!isDrawing || isSignatureCanvasDisabled) return;
        isDrawing = false;
        ctx.closePath();
        points = [];
        id_clear_signature_canvas.hidden = false;
    }

    function getEventPosition(e) {
        if (e.touches) {
            const rect = id_signature_canvas.getBoundingClientRect();

            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                offsetX: e.offsetX,
                offsetY: e.offsetY
            };
        };
    }

    id_signature_canvas.onmousedown = startDrawing;
    id_signature_canvas.onmousemove = draw;
    id_signature_canvas.onmouseup = stopDrawing;
    id_signature_canvas.onmouseleave = stopDrawing;

    id_signature_canvas.ontouchstart = function (e) {
        e.preventDefault();
        startDrawing(e);
    };

    id_signature_canvas.ontouchmove = function (e) {
        e.preventDefault();
        draw(e);
    };

    id_signature_canvas.ontouchend = function (e) {
        e.preventDefault();
        stopDrawing();
    };

    ["click", "keyup"].forEach(type => {
        id_clear_signature_canvas.addEventListener(type, event => {
            if (type === "click" || event.key === "Enter" || event.key === " ") {
                ctx.clearRect(0, 0, id_signature_canvas.width, id_signature_canvas.height);
                id_clear_signature_canvas.hidden = true;
                isSignaturePlaceholderCleared = false;
                isSignatureDrawn = false;
                drawPlaceholder();
            };
        });
    });

    drawPlaceholder();

    window.addEventListener("resize", () => {
        isSignatureCanvasDisabled = true;
        drawPlaceholder();
        id_clear_signature_canvas.click();
        id_clear_signature_canvas.hidden = true;
        id_signature_canvas.classList.add("cursor-not-allowed");
        id_signature_canvas.classList.remove("hover:bg-gray-50");
        id_signature_canvas.classList.add("bg-gray-100");
    });

    isSignatureCanvasReady = true;
}

function freezeSignatureCanvas(bool) {
    if (bool) {
        isSignatureCanvasDisabled = true;
        id_clear_signature_canvas.hidden = true;
        id_signature_canvas.classList.add("cursor-not-allowed");
        id_signature_canvas.classList.remove("hover:bg-gray-50");
        id_signature_canvas.classList.add("bg-gray-100");
    } else {
        isSignatureCanvasDisabled = false;
        id_clear_signature_canvas.hidden = false;
        id_signature_canvas.classList.remove("cursor-not-allowed");
        id_signature_canvas.classList.add("hover:bg-gray-50");
        id_signature_canvas.classList.remove("bg-gray-100");
    };
}

function initForm() {
    const id_purpose_placeholder = code(id_purpose, "_placeholder");
    const class_categories = document.querySelectorAll(".class-category");
    const firstPurpose = id_purpose_placeholder.nextElementSibling;

    id_category.value = null;

    class_categories.forEach((category) => {
        const label = category.closest("label");
        const svg = label.querySelector("svg");

        if (category.id.indexOf("category") !== -1 && category.value === urlParams.get("categoryPriority")) {
            category.click();
        };

        category.addEventListener("click", () => {
            if (category.id.indexOf("category") !== -1) {
                id_category.value = category.value;
            };
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

    if (urlParams.get("categoryPriority") !== null) {
        const currentCategory = code("id_category_", urlParams.get("categoryPriority"));

        currentCategory.click();
    };

    id_purpose.value = null;
    id_initialize_purpose.click();
    firstPurpose.style.setProperty("border-top", "none", "important");

    if (urlParams.get("purposePriority") !== null &&
        urlParams.get("purposePriority") !== "") {
        const currentPurpose = code("id_purpose_", urlParams.get("purposePriority"));

        currentPurpose.click();
    };

    id_period.value = "";
    initCalendar();

    inputs.forEach((input) => {
        displayError(false, input);
    });

    displayButtonMsg(false, id_filter_or_checkout, "error");
}

function updateForm(action, datasetObj = null) {
    const id_modal_cart = code(id_modal, "_cart");
    const id_modal_share = code(id_modal, "_share");
    const id_total_quantity = document.getElementById("id_total_quantity");
    const class_keywords = document.querySelectorAll(".class-keyword");
    const cart = JSON.parse(sessionStorage.getItem("cart"));

    // First action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    handleFocusForModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // Middle action: filter
    if (action === "filter") {
        id_modal_filter.hidden = false;
        id_modal_cart.hidden = true;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "검색 필터";
        });

        initForm();

        id_filter_or_checkout_text.innerText = "적용하기";
        id_filter_or_checkout.classList.replace("hidden", "inline-flex");
    }

    // Middle action: view_cart
    else if (action === "view_cart") {
        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_total_quantity.hidden = false;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "장바구니";
        });

        // initForm();
        executeWhenCartIsUpdated();

        const cartList = id_modal_cart.querySelector("ul");

        cartList.innerHTML = "";

        if (cart === null || cart.length === 0) {
            sessionStorage.removeItem("cart");
            sessionStorage.removeItem("cartUpdatedAt");

            const emptyCartElement = document.createElement("li");

            emptyCartElement.className = "flex justify-center items-center text-gray-500 text-sm font-medium";

            emptyCartElement.innerHTML = `
                <div class="flex min-w-0 gap-x-4 items-center h-[89px]">
                    장바구니가 비어 있어요.
                </div>
            `;

            cartList.appendChild(emptyCartElement);
            id_modal_cart.classList.add("-mb-5");
            id_filter_or_checkout.classList.replace("inline-flex", "hidden");
        } else {
            const groupedItems = cart.reduce((acc, item) => {
                (acc[item.collection_id] = acc[item.collection_id] || []).push(item);

                return acc;
            }, {});

            Object.values(groupedItems).forEach(group => {
                const firstItem = group[0];
                const itemCount = group.length;
                const addedItemElement = document.createElement("li");

                addedItemElement.id = `id_${firstItem.collection_id}`;
                addedItemElement.className = "class-link-list-item flex relative justify-between gap-x-4 py-5 hover:bg-gray-50 px-4 sm:px-6 -mx-4 sm:-mx-6";

                let blinkClass = "";

                if (location.pathname.indexOf(firstItem.collection_id) !== -1) {
                    blinkClass = "class-blink";
                };

                addedItemElement.innerHTML = `
                    <a href="${location.origin}/equipment/${firstItem.collection_id}/?categoryPriority=${firstItem.category.priority}&purposePriority=${urlParams.get("purposePriority")}&period=${urlParams.get("period")}"
                       class="absolute inset-x-0 -top-px bottom-0 cursor-pointer focus:df-focus-ring-inset"></a>
                    <div class="flex min-w-0 gap-x-4 items-center">
                        <img class="h-12 w-12 flex-none rounded-md"
                                src="${firstItem.thumbnail}"
                                alt="${firstItem.name} 사진">
                        <div class="min-w-0 flex-auto">
                            <p class="font-semibold leading-6 text-gray-900 ${blinkClass}">${firstItem.name}</p>
                            <p class="class-collection-id-and-quantity mt-1 truncate leading-5 text-gray-500 ${blinkClass}">${firstItem.collection_id} · ${itemCount}개</p>
                        </div>
                    </div>
                    <div class="flex shrink-0 items-center z-10">
                        <button class="class-remove-from-cart rounded-md text-gray-500 hover:underline focus:df-focus-ring-offset-white disabled:cursor-not-allowed disabled:hover:no-underline"
                                type="button"
                                data-collection-id="${firstItem.collection_id}">
                            삭제하기
                        </button>
                    </div>
                `;

                cartList.appendChild(addedItemElement);
            });

            const class_blinks = cartList.querySelectorAll(".class-blink");

            class_blinks.forEach(blink => {
                setTimeout(() => { blink.classList.add("blink"); }, 500);
                setTimeout(() => { blink.classList.remove("blink") }, 3500);
            });

            id_modal_cart.classList.remove("-mb-5");
            id_filter_or_checkout_text.innerText = "예약하기";
            id_filter_or_checkout.classList.replace("hidden", "inline-flex");
            id_filter_or_checkout.classList.add("class-checkout");
        };

        initModal(); // Run to read the newly created class-remove-from-cart
    }

    // Middle action: remove_from_cart
    else if (action === "remove_from_cart") {
        const data = datasetObj.dataset;
        let updatedCart;

        if (cart !== null) {
            updatedCart = cart.filter(item => item.collection_id !== data.collectionId);
        } else {
            updatedCart = [];
        };

        initCart({ status: "DONE", cart: updatedCart });
        initModal(); // Run to read the newly created class-remove-from-cart
    }

    // Middle action: checkout
    else if (action === "checkout") {
        if (!isAuthenticated()) return;
        if (id_filter_or_checkout_text.innerText !== "예약하기") return;

        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_total_quantity.hidden = true;
        id_modal_checkout.hidden = false;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "예약하기";
        });

        const id_purpose_in_cart = code(id_purpose, "_in_cart");
        const id_period_in_cart = code(id_period, "_in_cart");
        const daysFromNow = cart[0].period.split(",")[0];
        const duration = cart[0].period.split(",")[1];
        const startDate = formatDateInFewDays(now, daysFromNow);
        const endDate = formatDateInFewDays(startDate, duration);

        id_purpose_in_cart.innerText = cart[0].purpose.keyword;
        id_period_in_cart.innerText = duration > 0 ? `${duration}일` : "당일";
        id_start_date_in_cart.innerText = `${startDate}(${getDayOfWeek(startDate)})`;
        id_end_date_in_cart.innerText = `${endDate}(${getDayOfWeek(endDate)})`;

        [id_purpose_in_cart, id_period_in_cart, id_start_date_in_cart, id_end_date_in_cart].forEach(element => {
            element.className = "flex font-semibold text-right";
        });

        if (isSignatureCanvasReady === false) {
            initSignatureCanvas();
        };

        const id_signature_canvas_help = document.getElementById("id_signature_canvas_help");

        if (userName.length >= 5) {
            id_signature_canvas_help.innerText = `${userName}님의 성명 첫 다섯 글자 '${userName.slice(0, 5)}'${matchJosa(userName[4], "로으로", "OJS")} 서명해주세요.\n` + id_signature_canvas_help.innerText;
        } else {
            id_signature_canvas_help.innerText = "서명은 정자체만 허용되며 흘림체로 판별될 경우 예약이 불가할 수 있어요.";
        };

        // id_filter_or_checkout.classList.remove("class-checkout");
    }

    // Middle action: share
    else if (action === "share") {
        id_modal_filter.hidden = true;
        id_modal_cart.hidden = true;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = false;

        class_keywords.forEach(keyword => {
            keyword.innerText = "공유하기";
        });

        id_copy_url_ready.classList.remove("hidden");
        id_copy_url_done.classList.add("hidden");
        id_copy_url_descr.hidden = true;
        id_filter_or_checkout.classList.replace("inline-flex", "hidden");
    };

    // Last action: all
    resizeWidthOfModalAndForm();
}

function initModal() {
    const class_filters = document.querySelectorAll(".class-filter");
    const class_view_carts = document.querySelectorAll(".class-view-cart");
    const class_remove_from_carts = document.querySelectorAll(".class-remove-from-cart");
    const class_checkouts = document.querySelectorAll(".class-checkout");
    const class_shares = document.querySelectorAll(".class-share");

    class_filters.forEach(filter => {
        ["click", "keyup"].forEach(type => {
            filter.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("filter");
                };
            });
        });
    });

    class_view_carts.forEach(view_cart => {
        ["click", "keyup"].forEach(type => {
            view_cart.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("view_cart");
                };
            });
        });
    });

    class_remove_from_carts.forEach(remove_from_cart => {
        ["click", "keyup"].forEach(type => {
            remove_from_cart.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("remove_from_cart", remove_from_cart);
                };
            });
        });
    });

    class_checkouts.forEach(checkout => {
        ["click", "keyup"].forEach(type => {
            checkout.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("checkout");
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

function initDetail() {
    if (id_detail === null) return;

    const id_detail_purpose = code(id_detail, "_purpose");
    const id_detail_precaution = code(id_detail, "_precaution");

    [id_detail_purpose, id_detail_limit, id_detail_precaution].forEach(accordion => {
        accordion.addEventListener("keydown", () => {
            accordion.classList.add("focus:df-focus-ring-offset-white");
        });
        accordion.addEventListener("keypress", () => {
            accordion.classList.add("focus:df-focus-ring-offset-white");
        });
        accordion.addEventListener("keyup", () => {
            accordion.classList.add("focus:df-focus-ring-offset-white");
        });
        accordion.addEventListener("mouseout", () => {
            accordion.classList.remove("focus:df-focus-ring-offset-white");
        });
        accordion.addEventListener("mousedown", () => {
            accordion.classList.remove("focus:df-focus-ring-offset-white");
        });
        accordion.addEventListener("mouseover", () => {
            accordion.classList.remove("focus:df-focus-ring-offset-white");
        });
    });

    const id_cart_alert = document.getElementById("id_cart_alert");
    const id_cart_alert_for_filter = code(id_cart_alert, "_for_filter");
    const id_cart_alert_for_stock = code(id_cart_alert, "_for_stock");

    if (!urlParams.has("purposePriority") && !urlParams.has("period")) {
        id_cart_alert.hidden = false;
        id_cart_alert_for_filter.hidden = false;
    } else if (id_requested_quantity.value === "0" && id_requested_quantity.readOnly) {
        const class_purposes = document.querySelectorAll(".class-purpose");

        id_cart_alert.hidden = false;
        id_cart_alert_for_stock.hidden = false;

        class_purposes.forEach(purpose => {
            purpose.innerText = id_purpose_badge.innerText.split("\n")[1];
        });
    };

    if (id_requested_quantity.readOnly) return;

    const data = id_detail.dataset;
    const limitList = JSON.parse(data.limitList);
    const stockListLength = data.stockListLength;
    let max = Infinity;

    limitList.forEach(limit => {
        if (Number(limit.limit) < Number(max)) {
            max = limit.limit;
        };
    });

    if (Number(stockListLength) < Number(max)) {
        max = stockListLength;
    };

    const id_decrease_quantity = document.getElementById("id_decrease_quantity");
    const id_increase_quantity = document.getElementById("id_increase_quantity");

    function updateButtons() {
        const quantity = Number(id_requested_quantity.value);
        id_decrease_quantity.disabled = quantity <= 1;
        id_increase_quantity.disabled = quantity >= Number(max);
    }

    updateButtons();

    if (isQuantityButtonUpdated) return;

    id_requested_quantity.addEventListener("input", () => {
        if (document.activeElement !== id_requested_quantity) return;

        if (id_requested_quantity.value === "0") {
            id_requested_quantity.value = "1";
        };

        if (id_requested_quantity.value.length > 2) {
            id_requested_quantity.value = id_requested_quantity.value.slice(0, 2);
        };

        updateButtons();
    });

    id_requested_quantity.addEventListener("blur", () => {
        if (id_requested_quantity.value === "" || Number(id_requested_quantity.value) === 0) {
            id_requested_quantity.value = "1";
        } else if (Number(id_requested_quantity.value) > Number(max)) {
            id_requested_quantity.value = max;
        };

        updateButtons();
    });

    id_decrease_quantity.addEventListener("click", () => {
        if (Number(id_requested_quantity.value) > 1) {
            id_requested_quantity.value = Number(id_requested_quantity.value) - 1;
        };

        updateButtons();
    });

    id_increase_quantity.addEventListener("click", () => {
        if (Number(id_requested_quantity.value) < Number(max)) {
            id_requested_quantity.value = Number(id_requested_quantity.value) + 1;
        };

        updateButtons();
    });

    isQuantityButtonUpdated = true;
}

initDetail();

function initCart(resResult) {
    // Run to initialize id_requested_quantity, id_decrease_quantity, id_increase_quantity
    if (id_detail !== null) {
        id_requested_quantity.readOnly = false;
        initDetail();
    };

    if (resResult.reason !== undefined && resResult.reason !== null) {
        if (resResult.reason.indexOf("MISMATCHED_PURPOSE") !== -1) {
            displayNoti(true, "MPP", resResult.msg);
        } else if (resResult.reason.indexOf("MISMATCHED_PERIOD") !== -1) {
            displayNoti(true, "MPD", resResult.msg);
        } else if (resResult.reason.indexOf("EXCEED_GROUP_LIMIT") !== -1) {
            displayNoti(true, "EGL", resResult.msg);
        } else if (resResult.reason.indexOf("LIMIT") !== -1) {
            displayNoti(true, "EQL", resResult.msg);
        } else if (resResult.reason.indexOf("OUT_OF_STOCK") !== -1) {
            displayNoti(true, "OOS", resResult.msg);
        } else if (resResult.reason.indexOf("PARTIALLY_ADDED") !== -1) {
            displayNoti(true, "PTA", resResult.msg);
        };
    };

    // FAIL
    if (resResult.status === "FAIL") return;

    // DONE
    const cart = resResult.cart;
    const cartUpdatedAt = new Date();

    sessionStorage.setItem("cart", JSON.stringify(cart));
    sessionStorage.setItem("cartUpdatedAt", cartUpdatedAt);

    updateForm("view_cart");
}

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
    if (id_detail == null) return;

    const data = id_detail.dataset;
    const id_kakaotalk = document.getElementById("id_kakaotalk");
    const id_x = document.getElementById("id_x");
    const id_facebook = document.getElementById("id_facebook");
    const id_line = document.getElementById("id_line");
    let description;

    if (data.subcategory !== "None") {
        description = `${data.category} · ${data.collectionId} · ${data.subcategory}`;
    } else {
        description = `${data.category} · ${data.collectionId}`;
    };

    Kakao.init("36080e7fa227c8f75e1b351c53d2c77c");

    id_kakaotalk.addEventListener("click", () => {
        Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
                title: data.name,
                description: description,
                imageUrl: data.thumbnail,
                link: {
                    mobileWebUrl: `${location.origin}${location.pathname}`,
                    webUrl: `${location.origin}${location.pathname}`,
                },
            },
            buttons: [
                {
                    title: "디닷에프에서 보기",
                    link: {
                        mobileWebUrl: `${location.origin}${location.pathname}`,
                        webUrl: `${location.origin}${location.pathname}`,
                    },
                },
            ],
        });
    });

    id_x.addEventListener("click", () => {
        const xUrl = `https://twitter.com/intent/tweet?text=${data.name}&url=${location.origin}${location.pathname}`;

        window.open(xUrl);
    });

    id_facebook.addEventListener("click", () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${location.origin}${location.pathname}`;

        window.open(facebookUrl);
    });

    id_line.addEventListener("click", () => {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${location.origin}${location.pathname}`;

        window.open(lineUrl);
    });
}

share();

function requestFilterEquipment() {
    let data;

    if (id_purpose.value !== "" && id_period.value !== "") {
        data = { categoryPriority: id_category.value, purposePriority: id_purpose.value, period: id_period.value };
    } else if (id_purpose.value !== "") {
        data = { categoryPriority: id_category.value, purposePriority: id_purpose.value };
    } else {
        data = { categoryPriority: id_category.value };
    };

    data["id"] = "filter_equipment";

    if (id_detail !== null) {
        data["recordId"] = id_detail.dataset.recordId;
        id_requested_quantity.readOnly = true;
    };

    request.url = `${location.origin}/equipment/utils/equipment/`;
    request.type = "POST";
    request.data = data;
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestAddToCart() {
    if (id_detail !== null) id_requested_quantity.readOnly = true;

    request.url = `${location.origin}/equipment/utils/equipment/`;
    request.type = "POST";
    request.data = {
        id: "add_to_cart",
        recordId: id_detail.dataset.recordId,
        categoryPriority: urlParams.get("categoryPriority"),
        purposePriority: urlParams.get("purposePriority"),
        period: urlParams.get("period"),
        requestedQuantity: id_requested_quantity.value,
        cart: sessionStorage.getItem("cart"),
    };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestFindProject() {
    request.url = `${location.origin}/equipment/utils/equipment/`;
    request.type = "POST";
    request.data = { id: "find_project", cart: sessionStorage.getItem("cart") };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestFindHour() {
    const cart = JSON.parse(sessionStorage.getItem("cart"));
    const daysFromNow = cart[0].period.split(",")[0];
    const duration = cart[0].period.split(",")[1];
    const startDate = formatDateInFewDays(now, daysFromNow);
    const endDate = formatDateInFewDays(startDate, duration);

    request.url = `${location.origin}/equipment/utils/equipment/`;
    request.type = "POST";
    request.data = {
        id: "find_hour",
        startDate: startDate,
        endDate: endDate,
        startDay: (new Date(startDate)).getDay(),
        endDay: (new Date(endDate)).getDay()
    };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

async function requestCreateApplication() {
    let formData = new FormData();

    formData.append("id", "create_application");
    formData.append("cart", sessionStorage.getItem("cart"));
    formData.append("project", id_project.value);
    formData.append("startTime", id_start_time.value);
    formData.append("endTime", id_end_time.value);

    const signatureBlob = await convertSignatureToFile();

    formData.append("signature", signatureBlob, `${id_project.value}_${id_start_time.value}_${id_end_time.value}_signature.png`);

    let request = {
        url: `${location.origin}/equipment/utils/equipment/`,
        type: "POST",
        data: formData,
        async: true,
        headers: null
    };

    freezeForm(true);
    freezeSignatureCanvas(true);
    makeAjaxCall(request);
    request = {};
}

function initFeedback() {
    if (class_details === null) return;

    class_details.forEach(detail => {
        // const bg = detail.querySelector(".class-bg");

        // if (bg.classList.contains("bg-gray-200")) bg.classList.replace("bg-gray-200", "bg-gray-50");

        const spin = detail.querySelector("svg");

        spin.classList.add("hidden");
    });

    id_filter_or_checkout_descr.hidden = true;
    isUnhidden = false;
    freezeForm(false);

    class_details.forEach((detail) => {
        ["click", "keyup"].forEach(type => {
            detail.addEventListener(type, event => {
                if ((type === "click" || event.key === "Enter" || event.key === " ") && !isUnhidden) {
                    // const bg = detail.querySelector(".class-bg");

                    // if (bg !== null) bg.classList.replace("bg-gray-50", "bg-gray-200");

                    const spin = detail.querySelector("svg");

                    if (spin !== null) spin.classList.remove("hidden");
                    isUnhidden = true;
                    freezeForm(true);
                };
            });
        });
    });
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        requestVerifyAuthentication();
        initFeedback();

        const class_details = document.querySelectorAll(".class-detail");

        class_details.forEach(detail => {
            const spin = detail.querySelector("svg");

            spin.classList.add("hidden");
        });

        id_filter_or_checkout_descr.hidden = true;
        isUnhidden = false; // Variable declared in global.js.

        freezeForm(false);

        if (id_modal === null) return;

        class_firsts = document.querySelectorAll(".class-first");
        initValidation(class_firsts, id_filter_or_checkout);

        ["click", "keyup"].forEach(type => {
            id_filter_or_checkout.addEventListener(type, event => {
                const targetTagName = event.target.tagName;
                const id_filter_or_checkout_spin = code(id_filter_or_checkout, "_spin");

                if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                    (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                    if (id_filter_or_checkout_text.innerText.trim() === "적용하기" && isItOkayToSubmitForm()) {
                        requestFilterEquipment();
                        displayButtonMsg(true, id_filter_or_checkout, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_filter_or_checkout, "error");
                        id_filter_or_checkout_spin.classList.remove("hidden");
                    } else if (id_filter_or_checkout_text.innerText.trim() === "예약하기") {
                        if (!isAuthenticated()) {
                            let params = {};

                            params.next = `${location.pathname}${location.search}`;
                            params.loginRequestMsg = "checkout";
                            location.href = `${location.origin}/accounts/login/?${new URLSearchParams(params).toString()}`;
                        } else if (id_modal_checkout.hidden) {
                            // Remove the previous error message of 'class_seconds' if it exists
                            inputs.forEach((input) => {
                                displayError(false, input);
                            });

                            displayErrorInSignatureCanvas(false);
                            requestFindProject();
                            requestFindHour();
                            // Vaildation for class_seconds is handled by initFoundProjectList() and initFoundHourList()
                            initSignatureCanvasValidation();
                        } else if (id_modal_checkout.hidden === false) {
                            if (isItOkayToSubmitForm() && isSignatureDrawn) {
                                requestCreateApplication();
                                displayButtonMsg(true, id_filter_or_checkout, "descr", "잠시만 기다려주세요.");
                                displayButtonMsg(false, id_filter_or_checkout, "error");
                                id_filter_or_checkout_spin.classList.remove("hidden");
                            } else if (!isSignatureDrawn) {
                                controlErrorInSignatureCanvas();
                            };
                        };
                    } else {
                        inputs.forEach((input) => {
                            controlError(input);
                        });
                    };
                };

                ["keydown", "focusin"].forEach((type) => {
                    inputs.forEach((input) => {
                        input.addEventListener(type, () => {
                            displayButtonMsg(false, id_filter_or_checkout, "error");
                        });
                    });
                });
            });

            if (id_detail == null) return;

            const id_add_to_cart = document.getElementById("id_add_to_cart");

            id_add_to_cart.addEventListener(type, event => {
                const targetTagName = event.target.tagName;

                if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                    (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                    const id_add_to_cart_spin = code(id_add_to_cart, "_spin");

                    if (sessionStorage.cart === undefined) {
                        sessionStorage.setItem("cart", JSON.stringify([]));
                    };

                    requestAddToCart();
                    id_add_to_cart_spin.classList.remove("hidden");
                };
            });
        });
    });
}

initRequest();