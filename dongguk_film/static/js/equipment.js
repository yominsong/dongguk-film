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
const id_purpose_cart_reset_msg = code(id_purpose, "_cart_reset_msg");
const id_purpose_badge = code(id_purpose, "_badge");
const id_period = document.getElementById("id_period");
const id_period_calendar = code(id_period, "_calendar");
const id_period_help = code(id_period, "_help");
const id_period_cart_reset_msg = code(id_period, "_cart_reset_msg");
const id_start_date_in_cart = document.getElementById("id_start_date_in_cart");
const id_end_date_in_cart = document.getElementById("id_end_date_in_cart");
const id_project = document.getElementById("id_project");
const id_subject_code = document.getElementById("id_subject_code");
const id_subject_name = document.getElementById("id_subject_name");
const id_select_subject = document.getElementById("id_select_subject");
const id_subject_list = document.getElementById("id_subject_list");
const id_subject_error = document.getElementById("id_subject_error");
const id_instructor = document.getElementById("id_instructor");
const id_instructor_name = code(id_instructor, "_name");
const id_start_time = document.getElementById("id_start_time");
const id_end_time = document.getElementById("id_end_time");
const id_start_time_record_id = code(id_start_time, "_record_id");
const id_end_time_record_id = code(id_end_time, "_record_id");
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
const class_categories = document.querySelectorAll(".class-category");

// boolean
let isQuickFilterToggled = JSON.parse(sessionStorage.getItem("isQuickFilterToggled")) || false;
let isQuantityButtonUpdated = false;
let isSignatureCanvasReady = false;
let isSignaturePlaceholderCleared = false;
let isSignatureCanvasDisabled = false;
let isSignatureDrawn = false;
let isUnhidden = false;

// miscellaneous
const data_purpose = id_purpose.dataset;
const data_period = id_period.dataset;
const currentPurpose = urlParams.get("purposePriority");
const currentPeriod = urlParams.get("period");
let findNonWorkingDayTimer;

//
// Sub functions
//

function notifyRequestCreated() {
    if (window.location.search.includes("request=created")) { displayNoti(true, "REQUEST_CREATED") };
}

notifyRequestCreated();

function updateUrlParams() {
    const cart = getCart();

    if (cart === null || cart.length === 0) return;

    const purposeInCart = cart[0].purpose.priority;
    const periodInCart = cart[0].period;

    if (currentPurpose !== null && currentPeriod !== null) return;
    if (currentPurpose === purposeInCart && currentPeriod === periodInCart) return;

    urlParams.set("purposePriority", purposeInCart);
    urlParams.set("period", periodInCart);

    const url = new URL(location.href);

    url.search = urlParams.toString();
    window.history.replaceState(null, null, url);
    window.location.reload();
}

function handleFilterAndCartScroll() {
    const navbar = document.getElementById("navbar");
    const id_hero = document.getElementById("id_hero");
    const id_filter_and_cart = document.getElementById("id_filter_and_cart");
    let initialOffset;

    function toggleScrollClasses(shouldAdd) {
        id_filter_and_cart.classList.toggle("backdrop-blur-md", shouldAdd);
        id_filter_and_cart.classList.toggle("bg-white/50", shouldAdd);
        id_filter_and_cart.classList.toggle("text-gray-900", shouldAdd);
        id_filter_and_cart.classList.toggle("font-medium", shouldAdd);
        id_filter_and_cart.classList.toggle("text-shadow", shouldAdd);
    }

    function calculateInitialOffset() {
        const top3InPixels = 1.5 * 16;

        initialOffset = navbar.offsetHeight + id_hero.offsetHeight + top3InPixels;
    }

    function handleScroll() {
        toggleScrollClasses(window.scrollY > initialOffset);
    }

    function initializeState() {
        calculateInitialOffset();
        handleScroll();

        setTimeout(() => {
            id_filter_and_cart.style.transition = "background-color 0.3s ease, backdrop-filter 0.3s ease, color 0.3s ease, font-weight 0.3s ease, text-shadow 0.3s ease";
        }, 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeState);
    } else {
        initializeState();
    };

    window.addEventListener("scroll", handleScroll);

    window.addEventListener("resize", () => {
        calculateInitialOffset();
        handleScroll();
    });
}

handleFilterAndCartScroll();

function notifyRentalLimit() {
    if (!urlParams.has("rentalLimited")) return;

    const collectionName = urlParams.get("rentalLimited");
    const purposeKeyword = id_purpose_badge.innerText.trim().slice(7);
    const paramForNoti = { collectionName: collectionName, purposeKeyword: purposeKeyword };

    displayNoti(true, "RENTAL_RESTRICTED", paramForNoti);
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
        const id_detail_title_text = id_detail_title.querySelector("h2");
        const id_detail_title_text_line_height = parseFloat(window.getComputedStyle(id_detail_title_text).lineHeight);
        const id_detail_title_text_computed_lines = id_detail_title_text.offsetHeight / id_detail_title_text_line_height;
        const id_detail_content = code(id_detail, "_content");
        const id_detail_content_padding_top = code(id_detail_content, "_padding_top");

        // If the title text is too long, the height of the title will be adjusted to 158px and the padding-top of the content will be adjusted to 114px
        if (this.window.innerWidth >= 640 &&
            id_detail_title_text_computed_lines > 1) {
            id_detail_title.style.setProperty("height", "158px", "important");
            id_detail_content_padding_top.style.setProperty("padding-top", "114px", "important");
        };
    };
}

adjustDetailHeight();

function displayErrorInSubject(bool, errorType = null) {
    if (bool) {
        if (errorType === "empty") {
            id_subject_error.innerText = "교과목을 선택해주세요.";
        };

        id_subject_error.hidden = false;
        id_select_subject.classList.add("bg-flamingo-50", "ring-transparent", "hover:df-ring-inset-gray");
    } else {
        id_subject_error.innerText = null;
        id_subject_error.hidden = true;
        id_select_subject.classList.remove("bg-flamingo-50", "ring-transparent", "hover:df-ring-inset-gray");
    };
}

function controlErrorInSubject() {
    if (id_subject_code.value === "") {
        displayErrorInSubject(true, "empty");
    } else {
        return false;
    };
}

function validateSubject() {
    let isSubjectListOpen = false;

    ["click", "keydown"].forEach(type => {
        id_select_subject.addEventListener(type, event => {
            if (type === "click" || event.key === "Enter" || event.key === " " || event.key === "ArrowUp" || event.key === "ArrowDown") {
                displayErrorInSubject(false);
            };
        });
    });

    id_select_subject.addEventListener("focusout", () => {
        isSubjectListOpen = id_subject_list.style.display === "";
        if (!isSubjectListOpen) { controlErrorInSubject() };
    });

    id_subject_list.addEventListener("focusout", () => {
        isSubjectListOpen = id_subject_list.style.display === "";
        controlErrorInSubject();
    });

    id_select_subject.addEventListener("focusin", () => {
        displayErrorInSubject(false);
    });
}

function initSubjectValidation() {
    validateSubject();
}

function closeNoti() {
    displayNoti(false, "RENTAL_PURPOSE_CHANGED");
    displayNoti(false, "RENTAL_PERIOD_CHANGED");
    displayNoti(false, "RENTAL_GROUP_LIMIT_EXCEEDED");
    displayNoti(false, "RENTAL_QUANTITY_LIMIT_EXCEEDED");
    displayNoti(false, "EQUIPMENT_PARTIALLY_ADDED");
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
            id_signature_canvas_error.innerText = "기자재 예약 신청을 위해 서약해주세요.";
        } else if (errorType === "invalid") {
            id_signature_canvas_error.innerText = `${userName}님의 성명 ${getKoreanCharacterCount(userName)} 글자를 정자체로 써주세요.`;
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

/**
 * This function temporarily resolves a bug in the iOS web browser where in-modal input fields and buttons would not click in place
 */
function performMicroScroll() {
    const scrollContainer = id_scrollable_part_of_modal;
    const currentScroll = scrollContainer.scrollTop;
    const microScrollAmount = 1;

    if (currentScroll % 2 === 0) {
        scrollContainer.scrollTop = currentScroll + microScrollAmount;
    } else {
        scrollContainer.scrollTop = currentScroll - microScrollAmount;
    };

    setTimeout(() => {
        scrollContainer.scrollTop = currentScroll;
    }, 10);
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
    initTabIndex(id_modal_base);
}

function executeWhenPurposeHasChanged() {
    const isPurposeAlreadySelected = currentPurpose !== null;
    const isPurposeChanged = currentPurpose !== id_purpose.value;
    const isThereSomethingInCart = getCart() !== null;

    if (isPurposeAlreadySelected && isPurposeChanged && isThereSomethingInCart) {
        id_purpose_cart_reset_msg.hidden = false;
        id_purpose_cart_reset_msg.innerText = "대여 목적이 변경되면 장바구니가 초기화되니 유의해주세요.";
        id_period_cart_reset_msg.hidden = true;
        id_period_cart_reset_msg.innerText = "";
        id_filter_or_checkout_text.innerText = "장바구니 초기화 후 적용하기";
    } else {
        id_purpose_cart_reset_msg.hidden = true;
        id_purpose_cart_reset_msg.innerText = "";
        id_filter_or_checkout_text.innerText = "적용하기";
    };
}

function executeWhenSubjectIsSelected(selectedSubject = null) {
    displayErrorInSubject(false);
    displayError(false, id_instructor);

    if (selectedSubject) {
        id_instructor.value = null;
        id_instructor_name.value = null;
        id_subject_code.value = selectedSubject.code;
        id_subject_name.value = selectedSubject.kor_name;

        const foundInstructors = selectedSubject.instructor.split(", ");

        initFoundInstructorList(foundInstructors);
    };

    id_instructor.classList.add("class-second");

    const class_seconds = document.querySelectorAll(".class-second");

    initValidation(class_seconds, id_filter_or_checkout);
}

function executeWhenCartIsUpdated() {
    const class_total_quantities = document.querySelectorAll(".class-total-quantity");
    const cart = getCart();

    if (cart === null) return;

    class_total_quantities.forEach(total_quantity => {
        total_quantity.innerText = cart.length;
    });
}

executeWhenCartIsUpdated();

function executeWhenGroupLimitIsExceeded() {
    const id_close_modal = code("id_close_", id_modal);

    if (isModalOpen) {
        setTimeout(() => { id_close_modal.click() }, 10);
    };

    id_detail_limit.scrollIntoView({ behavior: "smooth" });

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

function handleQuickFilter() {
    setTimeout(() => { id_filter_or_checkout.click() }, 50);
}

function updateQuickFilterHandler() {
    class_categories.forEach(category => {
        category.removeEventListener("click", handleQuickFilter);
        category.onclick = null;
    });

    if (isQuickFilterToggled) {
        class_categories.forEach(category => {
            category.addEventListener("click", handleQuickFilter);
            // category.onclick = () => { id_category.value = category.value; id_filter_or_checkout.click() };
        });
    };
}

updateQuickFilterHandler();

function toggleQuickFilter() {
    isQuickFilterToggled = !isQuickFilterToggled;
    sessionStorage.setItem("isQuickFilterToggled", JSON.stringify(isQuickFilterToggled));
    updateQuickFilterHandler();
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

    function isFoundationDay(date) {
        return date.getMonth() === 4 && date.getDate() === 8; // May 8th
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
            const isFoundationDayDate = isFoundationDay(date);
            const dayElement = document.createElement("div");
            const buttonElement = document.createElement("button");
            const dayOfTheWeek = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][date.getDay()];
            const fullDateString = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${dayOfTheWeek}`;
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
                id_scrollable_part_of_modal.scrollTo({ top: id_scrollable_part_of_modal.scrollHeight, behavior: "auto" });
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

            if (isInRange && !isFoundationDayDate) {
                buttonClasses += isSelected || isToday ? "font-semibold " : "hover:bg-gray-100 ";
            } else {
                buttonClasses += "opacity-50 cursor-not-allowed ";
            };

            buttonClasses += "focus:df-focus-ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";
            dayElement.className = "py-2";

            const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

            buttonElement.type = "button";
            buttonElement.className = buttonClasses;
            buttonElement.innerHTML = `<time datetime="${formatDate(date)}" data-day-of-the-week="${dayOfWeek}">${date.getDate()}</time>`;
            buttonElement.ariaLabel = fullDateString;
            buttonElement.disabled = !isInRange || isFoundationDayDate;

            if (isInRange && !isFoundationDayDate) {
                buttonElement.addEventListener("click", () => {
                    handleDateSelection(date);
                });
            };

            dayElement.appendChild(buttonElement);
            id_period_calendar.appendChild(dayElement);
        };

        buttons = document.querySelectorAll("button");
        requestFindNonWorkingDay();
    }

    function handleDateSelection(date) {
        if (!isDateInRange(date) || isFoundationDay(date)) return;

        const formattedDate = formatDate(date);
        const id_period_error = code(id_period, "_error");

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

                const isPurposeChanged = currentPurpose !== id_purpose.value;

                if (!isPurposeChanged) {
                    const isPeriodAlreadySelected = currentPeriod !== null;
                    const isPeriodChanged = currentPeriod !== id_period.value;
                    const isThereSomethingInCart = getCart() !== null;

                    if (isPeriodAlreadySelected && isPeriodChanged && isThereSomethingInCart) {
                        id_period_cart_reset_msg.hidden = false;
                        id_period_cart_reset_msg.innerText = "대여 기간이 변경되면 장바구니가 초기화되니 유의해주세요.";
                        id_filter_or_checkout_text.innerText = "장바구니 초기화 후 적용하기";
                    } else {
                        id_period_cart_reset_msg.hidden = true;
                        id_period_cart_reset_msg.innerText = "";
                        id_filter_or_checkout_text.innerText = "적용하기";
                    };
                };
            };
        };

        setTimeout(() => {
            const timeElement = document.querySelector(`time[datetime="${formatDate(date)}"]`);

            if (timeElement === null || timeElement === undefined) return;

            const dateButton = timeElement.parentElement;

            if (dateButton !== null && dateButton !== undefined) {
                if (dateButton.disabled === false) {
                    dateButton.focus();
                } else {
                    const allDateButtons = document.querySelectorAll('#id_period_calendar button');
                    const buttonArray = Array.from(allDateButtons);
                    const currentIndex = buttonArray.indexOf(dateButton);
                    let nearestEnabledButton = null;
                    let leftIndex = currentIndex - 1;
                    let rightIndex = currentIndex + 1;

                    while (leftIndex >= 0 || rightIndex < buttonArray.length) {
                        if (leftIndex >= 0 && !buttonArray[leftIndex].disabled) {
                            nearestEnabledButton = buttonArray[leftIndex];
                            break;
                        };

                        if (rightIndex < buttonArray.length && !buttonArray[rightIndex].disabled) {
                            nearestEnabledButton = buttonArray[rightIndex];
                            break;
                        };

                        leftIndex--;
                        rightIndex++;
                    };

                    if (nearestEnabledButton !== null && nearestEnabledButton !== undefined) {
                        nearestEnabledButton.focus();

                        const a11yMsg = document.createElement("span");

                        a11yMsg.setAttribute("aria-live", "polite");
                        a11yMsg.className = "sr-only";
                        a11yMsg.textContent = "선택 가능한 가장 가까운 날짜로 포커스가 이동했습니다.";
                        nearestEnabledButton.appendChild(a11yMsg);
                        setTimeout(() => nearestEnabledButton.removeChild(a11yMsg), 3000);
                    };
                };
            };
        }, 0);

        setTimeout(() => {
            id_filter_or_checkout.scrollIntoView({ behavior: "smooth" });
        }, 20);

        updateCalendar();
        performMicroScroll();
        initTabIndex(id_period_calendar);
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

function disableHolidayInCalendar(foundHolidayArray) {
    foundHolidayArray.forEach(holiday => {
        const holidayDate = holiday.date;
        const timeElement = document.querySelector(`time[datetime="${holidayDate}"]`);

        if (timeElement) {
            const holidayButton = timeElement.closest("button");

            holidayButton.disabled = true;
            holidayButton.classList.remove("hover:bg-gray-100");
            holidayButton.classList.replace("text-gray-900", "text-red-700");
        };
    });
}

function disableNonWorkingDayInCalendar(foundNonWorkingDayOfTheWeekList) {
    foundNonWorkingDayOfTheWeekList.forEach(nonWorkingDayOfTheWeek => {
        const nonWorkingDayOfTheWeekElements = document.querySelectorAll(`time[data-day-of-the-week="${nonWorkingDayOfTheWeek}"]`);

        if (nonWorkingDayOfTheWeekElements) {
            nonWorkingDayOfTheWeekElements.forEach(nonWorkingDayOfTheWeekElement => {
                const nonWorkingDayOfTheWeekButton = nonWorkingDayOfTheWeekElement.closest("button");

                nonWorkingDayOfTheWeekButton.disabled = true;
                nonWorkingDayOfTheWeekButton.classList.remove("hover:bg-gray-100");
            });
        };
    });
}

function initFoundProjectList(response = null) {
    const id_found_project_list = document.getElementById("id_found_project_list");
    const cart = getCart();

    id_found_project_list.innerHTML = "";

    // FAIL
    if (response === null) {
        const placeholderElement = document.createElement("div");

        placeholderElement.className = "relative flex items-center h-[72px] p-4 shadow-sm rounded-md bg-flamingo-50";

        placeholderElement.innerHTML = `
            <div class="flex flex-1 justify-center">
                <span id="id_found_project_list_help"
                      class="text-sm text-center text-gray-700">선택 가능한 ${cart !== null ? cart[0].purpose.keyword : null} 프로젝트가 없어요.</span>
            </div>
        `;

        id_found_project_list.appendChild(placeholderElement);

        return;
    };

    // DONE
    const cartPurposePriority = cart[0].purpose.priority;

    response.found_project_list.forEach(newlyFoundProject => {
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

        data_project.recordId = newlyFoundProject.record_id;
        data_project.name = newlyFoundProject.name;
        data_project.directorName = newlyFoundProject.director_name;
        data_project.producerName = newlyFoundProject.producer_name;
        newlyFoundProjectElement.className = "relative flex items-center cursor-pointer h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";

        newlyFoundProjectElement.innerHTML = `
            <input id="id_project_${data_project.recordId}"
                    name="id_project"
                    type="radio"
                    value="${data_project.recordId}"
                    class="sr-only class-second class-radio class-project"
                    aria-labelledby="id_project_${data_project.recordId}_label"
                    aria-describedby="id_project_${data_project.recordId}_descr"
                    tabindex="0">
            <div class="flex flex-1">
                <span class="flex flex-col">
                    <span id="id_project_${data_project.recordId}_label" class="block whitespace-pre-line text-sm font-medium text-gray-900">${escapeHtml(data_project.name)}</span>
                    <span id="id_project_${data_project.recordId}_descr" class="mt-1 flex items-center text-sm text-gray-500">
                        연출&nbsp;
                        <span class="font-semibold">${data_project.directorName}</span>
                        &nbsp;·&nbsp;제작&nbsp;
                        <span class="font-semibold">${data_project.producerName}</span>
                    </span>
                    <p id="id_project_${data_project.recordId}_error" class="mt-2 text-flamingo-600" hidden=""></p>
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

function initFoundInstructorList(foundInstructors) {
    const id_found_instructor_list = document.getElementById("id_found_instructor_list");

    id_found_instructor_list.innerHTML = "";

    foundInstructors.forEach(instructor => {
        const instructor_split = instructor.split("#");
        const newlyFoundInstructorElement = document.createElement("label");
        const data_instructor = newlyFoundInstructorElement.dataset;

        data_instructor.id = instructor_split[0];
        data_instructor.name = instructor_split[1];
        newlyFoundInstructorElement.className = "relative flex items-center cursor-pointer h-[72px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";

        newlyFoundInstructorElement.innerHTML = `
            <input id="id_instructor_${data_instructor.id.replace(/\*/g, "-")}"
                    name="id_instructor"
                    type="radio"
                    class="sr-only class-second class-radio class-instructor"
                    aria-labelledby="id_instructor_${data_instructor.id.replace(/\*/g, "-")}_label"
                    aria-describedby="id_instructor_${data_instructor.id.replace(/\*/g, "-")}_descr"
                    tabindex="0">
            <div class="flex flex-1">
                <span class="flex flex-col">
                    <span id="id_instructor_${data_instructor.id.replace(/\*/g, "-")}_label" class="block whitespace-pre-line text-sm font-medium text-gray-900">${escapeHtml(data_instructor.name)}</span>
                    <p id="id_instructor_${data_instructor.id.replace(/\*/g, "-")}_descr" class="mt-1 flex items-center text-sm text-gray-500">${data_instructor.id}</p>
                    <p id="id_instructor_${data_instructor.id.replace(/\*/g, "-")}_error" class="flex items-center text-sm text-flamingo-600" hidden></p>
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

    const class_instructors = document.querySelectorAll(".class-instructor");

    class_instructors.forEach((instructor) => {
        if (id_instructor.value === instructor.dataset.id) {
            instructor.click();
        };

        const label = instructor.closest("label");
        const svg = label.querySelector("svg");

        instructor.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                instructor.click();
            };
        });

        instructor.addEventListener("click", () => {
            if (instructor.id.indexOf("instructor") !== -1) {
                id_instructor.value = instructor.parentElement.dataset.id;
                id_instructor_name.value = instructor.parentElement.dataset.name;
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

        if (!instructor.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    const class_seconds = document.querySelectorAll(".class-second");

    initValidation(class_seconds, id_filter_or_checkout);
}

function initFoundHourList(response) {
    const start_hour_list = response.start_hour_list;
    const end_hour_list = response.end_hour_list;
    const id_start_time_list = document.getElementById("id_start_time_list");
    const id_end_time_list = document.getElementById("id_end_time_list");
    const id_start_time = document.getElementById("id_start_time");
    const id_end_time = document.getElementById("id_end_time");
    const currentStartTime = id_start_time.value;
    const currentEndTime = id_end_time.value;

    id_start_time_list.innerHTML = "";
    id_end_time_list.innerHTML = "";

    [start_hour_list, end_hour_list].forEach((hourList) => {
        if (hourList.length === 0) {
            const placeholderElement = document.createElement("label");
            const timeList = hourList === start_hour_list ? id_start_time_list : id_end_time_list;
            const dateInCart = hourList === start_hour_list ? id_start_date_in_cart : id_end_date_in_cart;
            const keyword = hourList === start_hour_list ? "대여" : "반납";

            placeholderElement.className = "relative flex max-[370px]:col-span-2 max-[480px]:col-span-3 min-[480px]:col-span-4 items-center h-[36px] p-4 shadow-sm rounded-md bg-flamingo-50";

            placeholderElement.innerHTML = `
                <div class="flex flex-1 justify-center">
                    <span id="${timeList.id}_help"
                        class="text-sm text-center text-gray-700">${dateInCart.innerText.split("(")[1][0]}요일에는 기자재를 ${keyword}할 수 없어요.</span>
                </div>
            `;

            timeList.appendChild(placeholderElement);
        };
    });

    [start_hour_list, end_hour_list].forEach((hourList, index) => {
        const targetList = index === 0 ? id_start_time_list : id_end_time_list;
        const targetId = index === 0 ? id_start_time : id_end_time;
        const targetClass = index === 0 ? "class-start-time" : "class-end-time";
        const currentTime = index === 0 ? currentStartTime : currentEndTime;

        hourList.forEach(newlyFoundHour => {
            const newlyFoundHourElement = document.createElement("label");
            const available = newlyFoundHour.available;
            const time = newlyFoundHour.time;
            const timeWithoutColon = time.replace(":", "");
            const record_id = newlyFoundHour.record_id;

            if (available === true) {
                newlyFoundHourElement.className = "relative flex items-center cursor-pointer h-[36px] p-4 shadow-sm rounded-md df-ring-inset-gray hover:bg-gray-50";
                newlyFoundHourElement.innerHTML = `
                    <input id="${targetId.id}_${timeWithoutColon}"
                            name="${targetId.id}"
                            type="radio"
                            value="${timeWithoutColon}"
                            data-record-id="${record_id}"
                            class="sr-only class-second class-radio ${targetClass}"
                            aria-labelledby="${targetId.id}_${timeWithoutColon}_label"
                            ${currentTime === timeWithoutColon ? 'checked' : ''}
                            tabindex="0">
                    <span class="flex flex-1">
                        <span id="${targetId.id}_${timeWithoutColon}_label"
                                class="block whitespace-pre-line text-sm font-medium text-gray-900">${time}</span>
                    </span>
                    <span id="${targetId.id}_${timeWithoutColon}_descr" hidden></span>
                    <span id="${targetId.id}_${timeWithoutColon}_error" hidden></span>
                    <svg class="h-5 w-5 ml-1 text-flamingo ${currentTime === timeWithoutColon ? '' : 'invisible'}"
                            viewBox="0 0 16 20"
                            fill="currentColor"
                            aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                    </svg>
                    <span class="pointer-events-none absolute -inset-px rounded-md"
                            aria-hidden="true"></span>
                `;

                if (currentTime === timeWithoutColon) {
                    newlyFoundHourElement.classList.replace("df-ring-inset-gray", "df-ring-inset-flamingo");
                };
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
    });

    const class_start_times = document.querySelectorAll(".class-start-time");
    const class_end_times = document.querySelectorAll(".class-end-time");
    const isSameDay = id_start_date_in_cart.innerText === id_end_date_in_cart.innerText;

    function updateEndTimes() {
        if (!isSameDay) return;

        const selectedStartTime = document.querySelector(".class-start-time:checked");

        if (selectedStartTime) {
            const startTimeValue = parseInt(selectedStartTime.value);
            let endTimeUpdated = false;

            class_end_times.forEach(endTime => {
                const endTimeValue = parseInt(endTime.value);
                const label = endTime.closest("label");

                if (endTimeValue <= startTimeValue) {
                    label.classList.add("cursor-not-allowed", "bg-gray-100");
                    label.classList.remove("cursor-pointer", "hover:bg-gray-50");
                    endTime.disabled = true;

                    if (endTime.checked) {
                        endTime.checked = false;
                        label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                        label.querySelector("svg").classList.add("invisible");
                        id_end_time.value = "";
                        endTimeUpdated = true;
                    }
                } else {
                    label.classList.remove("cursor-not-allowed", "bg-gray-100");
                    label.classList.add("cursor-pointer", "hover:bg-gray-50");
                    endTime.disabled = false;
                };
            });

            if (endTimeUpdated) {
                const firstValidEndTime = document.querySelector(".class-end-time:not(:disabled)");

                if (firstValidEndTime) firstValidEndTime.click();
            };
        };
    }

    [class_start_times, class_end_times].forEach((class_times, index) => {
        const targetId = index === 0 ? id_start_time : id_end_time;
        const targetRecordId = index === 0 ? id_start_time_record_id : id_end_time_record_id;

        class_times.forEach((time) => {
            if (targetId.value === time.value) time.click();

            const label = time.closest("label");
            const svg = label.querySelector("svg");

            label.classList.add("cursor-pointer", "hover:bg-gray-50");

            time.addEventListener("click", () => {
                if (time.id.indexOf("time") !== -1) {
                    targetId.value = time.value;
                    targetRecordId.value = time.dataset.recordId;
                };

                if (index === 0 && isSameDay) updateEndTimes();
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
                    targetId.value = time.value;
                    targetRecordId.value = time.dataset.recordId;
                    if (index === 0 && isSameDay) updateEndTimes();
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

    if (isSameDay) updateEndTimes();

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
    const firstPurpose = id_purpose_placeholder.nextElementSibling;
    let currentCategory = code("id_category_", urlParams.get("categoryPriority"));

    id_category.value = null;

    class_categories.forEach((category) => {
        const label = category.closest("label");
        const svg = label.querySelector("svg");

        if (category.id.indexOf("category") !== -1 && category.value === urlParams.get("categoryPriority")) {
            setTimeout(() => {
                id_category.value = category.value;
                label.classList.add("df-ring-inset-flamingo");
                label.classList.remove("df-ring-inset-gray");
                svg.classList.remove("invisible");
            }, 50);
        };

        category.addEventListener("click", () => {
            if (category.id.indexOf("category") !== -1) {
                id_category.value = category.value;
            };

            currentCategory = category;
        });

        category.addEventListener("keyup", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                category.click();
            };
        });

        category.addEventListener("focus", () => {
            label.classList.add("df-focus-ring-inset");
            svg.classList.remove("invisible");

            const otherInputs = [...class_categories].filter(i => i !== category);

            otherInputs.forEach(i => {
                const otherLabel = i.closest("label");
                const otherSvg = otherLabel.querySelector("svg");

                otherLabel.classList.remove("df-ring-inset-flamingo");
                otherLabel.classList.add("df-ring-inset-gray");
                otherSvg.classList.add("invisible");
            });
        });

        category.addEventListener("blur", () => {
            if (!category.checked) {
                svg.classList.add("invisible");
            } else if (category.checked) {
                label.classList.add("df-ring-inset-flamingo");
            };

            label.classList.remove("df-focus-ring-inset");

            class_categories.forEach(category => {
                const label = category.closest("label");
                const svg = label.querySelector("svg");

                if (category.checked || category === currentCategory) {
                    label.classList.add("df-ring-inset-flamingo");
                    label.classList.remove("df-ring-inset-gray");
                    svg.classList.remove("invisible");
                } else {
                    label.classList.remove("df-ring-inset-flamingo");
                    label.classList.add("df-ring-inset-gray");
                    svg.classList.add("invisible");
                };
            });
        });

        category.addEventListener("change", () => {
            if (category.checked) {
                label.classList.replace("df-ring-inset-gray", "df-ring-inset-flamingo");
                svg.classList.remove("invisible");
            } else {
                svg.classList.add("invisible");
            };

            const otherInputs = [...class_categories].filter(i => i !== category);

            otherInputs.forEach(i => {
                const otherLabel = i.closest("label");
                const otherSvg = otherLabel.querySelector("svg");

                if (!i.checked) {
                    otherLabel.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                    otherSvg.classList.add("invisible");
                };
            });

            currentCategory = category;
        });

        if (!category.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });

    id_purpose.value = null;
    firstPurpose.style.setProperty("border-top", "none", "important");

    if (currentPurpose !== null && currentPurpose !== "") {
        code("id_purpose_", currentPurpose).click();
    } else {
        id_initialize_purpose.click();
    };

    const class_purposes = document.querySelectorAll(".class-purpose");

    class_purposes.forEach((purpose) => {
        purpose.addEventListener("click", () => {
            executeWhenPurposeHasChanged();
        });
    });

    id_purpose.addEventListener("change", () => {
        const otherInputs = [...class_purposes].filter(i => i !== id_purpose);

        otherInputs.forEach(i => {
            const otherLabel = i.closest("label");
            const otherSvg = otherLabel.querySelector("svg");

            if (!i.checked) {
                otherLabel.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
                otherSvg.classList.add("invisible");
            }
        });
    });

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
    const class_headings = document.querySelectorAll(".class-heading");
    const class_keywords = document.querySelectorAll(".class-keyword");
    const cart = getCart();

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

        class_headings.forEach(heading => {
            heading.innerText = "검색 필터";
        });

        class_keywords.forEach(keyword => {
            keyword.innerText = "적용하기";
        });

        initForm();
        id_filter_or_checkout.classList.replace("hidden", "inline-flex");

        const modalInputs = id_modal_base.querySelectorAll("input");
        const modalButtons = id_modal_base.querySelectorAll("button");

        modalInputs.forEach(input => {
            input.tabIndex = 0;
        });

        modalButtons.forEach(button => {
            button.tabIndex = 0;
        });
    }

    // Middle action: view_cart
    else if (action === "view_cart") {
        const id_subject_placeholder = document.getElementById("id_subject_placeholder");
        const firstSubject = id_subject_placeholder.nextElementSibling;

        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_total_quantity.hidden = false;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = true;
        firstSubject.style.setProperty("border-top", "none", "important");

        class_headings.forEach(heading => {
            heading.innerText = "장바구니";
        });

        class_keywords.forEach(keyword => {
            keyword.innerText = "신청하기";
        });

        inputs.forEach((input) => {
            displayError(false, input);
        });

        displayButtonMsg(false, id_filter_or_checkout, "error");
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
        if (id_filter_or_checkout_text.innerText !== "신청하기") return;

        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_total_quantity.hidden = true;
        id_modal_checkout.hidden = false;
        id_modal_share.hidden = true;

        class_headings.forEach(heading => {
            heading.innerText = "예약 신청하기";
        });

        class_keywords.forEach(keyword => {
            keyword.innerText = "신청하기";
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
            id_signature_canvas_help.innerText = "서명은 정자체만 허용되며 흘림체로 인식될 경우 예약 신청이 어려울 수 있어요.";
        };
    }

    // Middle action: share
    else if (action === "share") {
        id_modal_filter.hidden = true;
        id_modal_cart.hidden = true;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = false;

        class_headings.forEach(heading => {
            heading.innerText = "공유하기";
        });

        id_copy_url_ready.classList.remove("hidden");
        id_copy_url_done.classList.add("hidden");
        id_copy_url_descr.hidden = true;
        id_filter_or_checkout.classList.replace("inline-flex", "hidden");
    };

    // Last action: all
    resizeWidthOfModalAndForm();
    initTabIndex(id_modal_base);
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
        const id_selected_purpose = document.getElementById("id_selected_purpose");

        id_cart_alert.hidden = false;
        id_cart_alert_for_stock.hidden = false;
        if (id_selected_purpose !== null) { id_selected_purpose.innerText = id_purpose_badge.innerText.trim().slice(7) };
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

        if (quantity <= 1) {
            id_decrease_quantity.disabled = true;
            id_decrease_quantity.classList.add("cursor-not-allowed");
        } else {
            id_decrease_quantity.disabled = false;
            id_decrease_quantity.classList.remove("cursor-not-allowed");
        };

        if (quantity >= Number(max)) {
            id_increase_quantity.disabled = true;
            id_increase_quantity.classList.add("cursor-not-allowed");
        } else {
            id_increase_quantity.disabled = false;
            id_increase_quantity.classList.remove("cursor-not-allowed");
        };
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

function initCart(response) {
    // Run to initialize id_requested_quantity, id_decrease_quantity, id_increase_quantity
    if (id_detail !== null) {
        id_requested_quantity.readOnly = false;
        initDetail();
    };

    if (response.reason !== undefined && response.reason !== null) {
        if (response.reason.indexOf("MISMATCHED_PURPOSE") !== -1) {
            displayNoti(true, "RENTAL_PURPOSE_CHANGED", response.msg);
        } else if (response.reason.indexOf("MISMATCHED_PERIOD") !== -1) {
            displayNoti(true, "RENTAL_PERIOD_CHANGED", response.msg);
        } else if (response.reason.indexOf("EXCEED_GROUP_LIMIT") !== -1) {
            displayNoti(true, "RENTAL_GROUP_LIMIT_EXCEEDED", response.msg);
        } else if (response.reason.indexOf("LIMIT") !== -1) {
            displayNoti(true, "RENTAL_QUANTITY_LIMIT_EXCEEDED", response.msg);
        } else if (response.reason.indexOf("OUT_OF_STOCK") !== -1) {
            displayNoti(true, "OUT_OF_STOCK", response.msg);
        } else if (response.reason.indexOf("PARTIALLY_ADDED") !== -1) {
            displayNoti(true, "EQUIPMENT_PARTIALLY_ADDED", response.msg);
        };
    };

    // FAIL
    if (response.status === "FAIL") return;

    // DONE
    const cart = response.cart;
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

function requestFindNonWorkingDay() {
    clearTimeout(findNonWorkingDayTimer);

    findNonWorkingDayTimer = setTimeout(() => {
        request.url = `${location.origin}/equipment/utils/equipment/`;
        request.type = "POST";
        request.data = { id: "find_non_working_day" };
        request.async = true;
        request.headers = null;
        makeAjaxCall(request);
        request = {};
    }, 1);
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

function requestFindSubject() {
    request.url = `${location.origin}/equipment/utils/equipment/`;
    request.type = "POST";
    request.data = { id: "find_subject" };
    request.async = true;
    request.headers = null;
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
    const cart = getCart();
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

async function requestCreateRequest() {
    let formData = new FormData();

    formData.append("id", "create_request");
    formData.append("cart", sessionStorage.getItem("cart"));
    formData.append("project", id_project.value);
    formData.append("startTime", id_start_time.value);
    formData.append("endTime", id_end_time.value);
    formData.append("startTimeRecordId", id_start_time_record_id.value);
    formData.append("endTimeRecordId", id_end_time_record_id.value);

    const isForInstructor = getCart()[0].purpose.is_for_instructor;

    if (isForInstructor) {
        const id_target_academic_year_and_semester = document.getElementById("id_target_academic_year_and_semester");
        const academicYearAndSemester = id_target_academic_year_and_semester.innerText.trim().split(" ");
        const academicYear = academicYearAndSemester[0];
        const academicSemester = academicYearAndSemester[1];

        formData.append("academicYear", academicYear);
        formData.append("academicSemester", academicSemester);
        formData.append("subjectCode", id_subject_code.value);
        formData.append("subjectName", id_subject_name.value);
        formData.append("instructor", id_instructor.value);
        formData.append("instructorName", id_instructor_name.value);
    };

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
    if (class_details.length === 0) return;

    class_details.forEach(detail => {
        const spin = detail.querySelector("svg");

        setTimeout(() => { detail.classList.remove("df-focus-ring-offset-white-2") }, 0);
        spin.classList.add("hidden");
    });

    id_filter_or_checkout_descr.hidden = true;
    isUnhidden = false;
    freezeForm(false);

    class_details.forEach((detail) => {
        ["click", "keyup"].forEach(type => {
            detail.addEventListener(type, event => {
                if ((type === "click" || event.key === "Enter" || event.key === " ") && !isUnhidden) {
                    const spin = detail.querySelector("svg");

                    detail.classList.add("df-focus-ring-offset-white-2");
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
        updateUrlParams();
        initFeedback();
        initSubjectValidation();

        if (id_modal === null) return;

        if (id_detail !== null) {
            const id_main_content = document.getElementById("id_main_content");

            smoothScrollToElement(id_main_content, 13);
        };

        class_firsts = document.querySelectorAll(".class-first");
        initValidation(class_firsts, id_filter_or_checkout);

        ["click", "keyup"].forEach(type => {
            function userRequestIsMade(type, event) {
                const targetTagName = event.target.tagName;
                const isClicked = type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON");
                const isPressed = type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON";

                return isClicked || isPressed;
            }

            // Filter of checkout
            id_filter_or_checkout.addEventListener(type, event => {
                const id_filter_or_checkout_spin = code(id_filter_or_checkout, "_spin");

                if (userRequestIsMade(type, event)) {
                    const requestButtonText = id_filter_or_checkout_text.innerText.trim();
                    const readyToFilter = requestButtonText.indexOf("적용하기") !== -1 && isItOkayToSubmitForm();
                    const readyToCheckout = requestButtonText === "신청하기";

                    if (readyToFilter) {
                        const readyToResetCart = requestButtonText.indexOf("초기화") !== -1;

                        if (readyToResetCart) sessionStorage.removeItem("cart");
                        requestFilterEquipment();
                        displayButtonMsg(true, id_filter_or_checkout, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_filter_or_checkout, "error");
                        id_filter_or_checkout_spin.classList.remove("hidden");
                    } else if (readyToCheckout) {
                        const readyToStartCheckingOut = id_modal_checkout.hidden;
                        const readyToEndCheckingOut = id_modal_checkout.hidden === false;
                        const isForInstructor = getCart()[0].purpose.is_for_instructor;

                        if (!isAuthenticated()) {
                            let params = {};

                            params.next = `${location.pathname}${location.search}`;
                            params.loginRequestMsg = "checkout";
                            location.href = `${location.origin}/accounts/login/?${new URLSearchParams(params).toString()}`;
                        } else if (readyToStartCheckingOut) {
                            // Remove the previous error message of 'class_seconds' if it exists
                            inputs.forEach((input) => { displayError(false, input) });
                            displayErrorInSubject(false);
                            displayErrorInSignatureCanvas(false);

                            // If the purpose is for instructor
                            if (isForInstructor) {
                                id_project.classList.remove("class-second");
                                id_project.parentElement.hidden = true;
                            } else {
                                id_subject_code.parentElement.hidden = true;
                                id_instructor.parentElement.hidden = true;
                                requestFindProject();
                            };

                            const class_responsible_parties = document.querySelectorAll(".class-responsible-party");

                            class_responsible_parties.forEach((party) => {
                                if (isForInstructor) {
                                    party.innerText = "신청자";
                                } else {
                                    party.innerText = "촬영, 동시녹음 담당";
                                };

                                if (party.classList.contains("class-need-josa")) {
                                    party.innerText = `${matchJosa(party.innerText, "이가", "WJS")}`;
                                };
                            });

                            requestFindHour();
                            // Vaildation for class_seconds is handled by initFoundProjectList() and initFoundHourList()
                            initSignatureCanvasValidation();
                        } else if (readyToEndCheckingOut) {
                            const readyToSubmitForm = () => {
                                if (isForInstructor) {
                                    return isItOkayToSubmitForm() && id_subject_code.value !== "" && isSignatureDrawn;
                                } else {
                                    return isItOkayToSubmitForm() && isSignatureDrawn;
                                };
                            };

                            if (readyToSubmitForm()) {
                                requestCreateRequest();
                                displayButtonMsg(true, id_filter_or_checkout, "descr", "잠시만 기다려주세요.");
                                displayButtonMsg(false, id_filter_or_checkout, "error");
                                id_filter_or_checkout_spin.classList.remove("hidden");
                            } else {
                                controlErrorInSubject();
                                controlErrorInSignatureCanvas();
                            };
                        };
                    } else {
                        inputs.forEach((input) => { controlError(input) });
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

            // Add to cart
            if (id_detail == null) return;

            const id_add_to_cart = document.getElementById("id_add_to_cart");

            id_add_to_cart.addEventListener(type, event => {
                if (userRequestIsMade(type, event)) {
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