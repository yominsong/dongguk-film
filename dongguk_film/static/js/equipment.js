//
// Global variables
//

const id_modal = document.getElementById("id_modal");
const id_category = document.getElementById("id_category");
const id_purpose = document.getElementById("id_purpose");
const id_initialize_purpose = document.getElementById("id_initialize_purpose");
const id_period = document.getElementById("id_period");
const id_period_current_month = code(id_period, "_current_month");
const id_period_prev_month = code(id_period, "_prev_month");
const id_period_next_month = code(id_period, "_next_month");
const id_period_calendar = code(id_period, "_calendar");
const id_period_error = code(id_period, "_error");
const id_filter = document.getElementById("id_filter");

const id_detail = document.getElementById("id_detail");
const id_go_to_list = document.getElementById("id_go_to_list");

const data_purpose = id_purpose.dataset;
const data_period = id_period.dataset;

let class_firsts = document.querySelectorAll(".class-first");

let isModalOpen = false;
let isLastSelectedAnchorHash = false;

let currentHistoryLength = history.length;

//
// Sub functions
//

function hideNullBadge() {
    const class_badges = document.querySelectorAll(".class-badge");

    class_badges.forEach((badge) => {
        if (badge.innerText.indexOf("None") !== -1) {
            badge.classList.add("hidden");
        };
    });
}

hideNullBadge();

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

function preventGoBack() {
    if (currentHistoryLength === history.length) {
        history.pushState(null, null, location.href);
    };

    document.addEventListener("click", event => {
        const closestAnchor = event.target.closest("a");

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
    const id_filter_descr = code(id_filter, "_descr");

    return id_filter_descr.hidden;
}

function executePurposeAction(purpose = null) {
    id_period.value = null;
    displayError(false, id_period);

    if (purpose) {
        id_purpose.value = purpose.priority;
        id_initialize_purpose.hidden = false;
        id_period.classList.add("class-first");
        id_period.classList.add("alt-calendar");
        data_purpose.atLeast = purpose.at_least;
        data_purpose.upTo = purpose.up_to;
        data_purpose.max = purpose.max;
        data_period.startDateMin = formatDateInFewDays(now, data_purpose.atLeast);
        data_period.startDateMax = formatDateInFewDays(now, data_purpose.upTo);
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
    };

    class_firsts = document.querySelectorAll(".class-first");
    initValidation(class_firsts, id_filter);
    initCalendar();
}

// function executeWhenPurposeIsSelected(purpose) {
//     id_purpose.value = purpose.priority;
//     id_initialize_purpose.hidden = false;

//     id_period.value = null;
//     displayError(false, id_period);
//     id_period.classList.add("class-first");
//     id_period.classList.add("alt-calendar");

//     class_firsts = document.querySelectorAll(".class-first");
//     initValidation(class_firsts, id_filter);

//     data_purpose.atLeast = purpose.at_least;
//     data_purpose.upTo = purpose.up_to;
//     data_purpose.max = purpose.max;
//     data_period.startDateMin = formatDateInFewDays(now, data_purpose.atLeast);
//     data_period.startDateMax = formatDateInFewDays(now, data_purpose.upTo);
//     initCalendar();
// }

// function executeToInitializePurpose() {
//     id_purpose.value = null;
//     id_initialize_purpose.hidden = true;

//     id_period.value = null;
//     displayError(false, id_period);
//     id_period.classList.remove("class-first");
//     id_period.classList.remove("alt-calendar");

//     class_firsts = document.querySelectorAll(".class-first");
//     initValidation(class_firsts, id_filter);

//     data_purpose.atLeast = "";
//     data_purpose.upTo = "";
//     data_purpose.max = "";
//     data_period.startDateMin = "";
//     data_period.startDateMax = "";
//     initCalendar();
// }

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
        id_query.addEventListener("keyup", event => {
            if (event.key === "Enter") {
                id_submit_query.click();
            };
        });

        ["click", "keyup"].forEach(type => {
            id_submit_query.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    urlParams.delete("page");
                    urlParams.set("q", id_query.value);
                    location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
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
                        urlParams.delete("q");
                        location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
                        id_query.readOnly = true;
                        id_submit_query.disabled = true;
                    };
                });
            });
        };
    };
}

initSearchBar();

function initCalendar() {
    const id_period_help = code(id_period, "_help");
    const purposeQuery = urlParams.get("purpose");
    const periodQuery = urlParams.get("period");
    const daysFromNow = periodQuery ? periodQuery.split(",")[0] : null;
    const duration = periodQuery ? periodQuery.split(",")[1] : null;
    let currentDate;
    let startDate = null;
    let endDate = null;
    let durationToDisplay;

    data_period.startDate = "";
    data_period.endDate = "";

    if (id_purpose.value === purposeQuery && periodQuery !== null) {
        if (Number(data_purpose.atLeast) <= Number(daysFromNow) &&
            Number(daysFromNow) <= Number(data_purpose.upTo) &&
            0 <= Number(duration) &&
            Number(duration) <= Number(data_purpose.max)) {
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

function initForm() {
    const class_categories = document.querySelectorAll(".class-category");

    id_category.value = null;

    class_categories.forEach((category) => {
        const label = category.closest("label");
        const svg = label.querySelector("svg");

        if (category.id.indexOf("category") != -1 && category.value === urlParams.get("category")) {
            category.click();
        };

        category.addEventListener("click", () => {
            if (category.id.indexOf("category") != -1) {
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

    if (urlParams.get("category") !== null) {
        const currentCategory = code("id_category_", urlParams.get("category"));

        currentCategory.click();
    };

    id_purpose.value = null;

    if (urlParams.get("purpose") !== null &&
        urlParams.get("purpose") !== "") {
        const currentPurpose = code("id_purpose_", urlParams.get("purpose"));

        currentPurpose.click();
    };

    id_period.value = null;

    initCalendar();

    inputs.forEach((input) => {
        displayError(false, input);
    });

    displayButtonMsg(false, id_filter, "error");
}

function updateForm(action) {
    const id_modal_filter = code(id_modal, "_filter");
    const id_modal_cart = code(id_modal, "_cart");
    const id_modal_share = code(id_modal, "_share");
    const class_keywords = document.querySelectorAll(".class-keyword");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    toggleFocusOnModal(true, id_modal); // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);

    // action: filter
    if (action === "filter") {
        id_modal_filter.hidden = false;
        id_modal_cart.hidden = true;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "검색 필터";
        });

        initForm();
        id_filter.classList.replace("hidden", "inline-flex");
    }

    // action: cart
    else if (action === "cart") {
        if (id_modal_filter !== null) { id_modal_filter.hidden = true };
        if (id_modal_share !== null) { id_modal_share.hidden = true };
        id_modal_cart.hidden = false;

        class_keywords.forEach(keyword => {
            keyword.innerText = "장바구니";
        });

        id_filter.classList.replace("inline-flex", "hidden");
    }

    // action: share
    else if (action === "share") {
        if (id_modal_filter !== null) { id_modal_filter.hidden = true };
        if (id_modal_cart !== null) { id_modal_cart.hidden = true };
        id_modal_share.hidden = false;

        class_keywords.forEach(keyword => {
            keyword.innerText = "공유하기";
        });

        id_copy_url_ready.classList.remove("hidden");
        id_copy_url_done.classList.add("hidden");
        id_copy_url_descr.hidden = true;
        id_filter.classList.replace("inline-flex", "hidden");
    };
}

function initModal() {
    const class_filters = document.querySelectorAll(".class-filter");
    const class_carts = document.querySelectorAll(".class-cart");
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

    class_carts.forEach(cart => {
        ["click", "keyup"].forEach(type => {
            cart.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("cart");
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

function styleAccordion() {
    if (id_detail !== null) {
        const id_detail_purpose = code(id_detail, "_purpose");
        const id_detail_limit = code(id_detail, "_limit");
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
    };
}

styleAccordion();

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
        let description;

        if (data.subcategory !== "None") {
            description = `${data.category} · ${data.subcategory} · ${data.collectionId}`
        } else {
            description = `${data.category} · ${data.collectionId}`
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
            const xUrl = `https://twitter.com/intent/tweet?text=${data.name}&url=${originLocation}${location.pathname}`;

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
    const class_details = document.querySelectorAll(".class-detail");
    let params = {};

    if (class_details !== null) {
        class_details.forEach((detail) => {
            if (location.search !== "") {
                params.previousSearch = location.search;
                detail.href += "?" + new URLSearchParams(params).toString();
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
                    const previousSearch = new URLSearchParams(location.search).get("previousSearch");

                    if (previousSearch !== null) {
                        location.href = `${originLocation}/equipment${previousSearch}`;
                    } else {
                        location.href = `${originLocation}/equipment`;
                    };

                    id_go_to_list.disabled = true;
                };
            });
        });
    };
}

goToList();

function requestFilterEquipment() {
    freezeForm(true);

    if (id_purpose.value !== "" && id_period.value !== "") {
        urlParams.set("category", id_category.value);
        urlParams.set("purpose", id_purpose.value);
        urlParams.set("period", id_period.value);
    } else if (id_purpose.value !== "") {
        urlParams.set("category", id_category.value);
        urlParams.set("purpose", id_purpose.value);
        urlParams.delete("period");
    } else {
        urlParams.set("category", id_category.value);
        urlParams.delete("purpose");
        urlParams.delete("period");
    };

    location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        if (id_modal != null) {
            class_firsts = document.querySelectorAll(".class-first");

            initValidation(class_firsts, id_filter);

            ["click", "keyup"].forEach(type => {
                id_filter.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (isItOkayToSubmitForm()) {
                            const id_filter_spin = code(id_filter, "_spin");

                            requestFilterEquipment();

                            displayButtonMsg(true, id_filter, "descr", "잠시만 기다려주세요.");
                            displayButtonMsg(false, id_filter, "error");
                            id_filter_spin.classList.remove("hidden");
                        } else {
                            inputs.forEach((input) => {
                                controlError(input);
                            });
                        };
                    };

                    ["keydown", "focusin"].forEach((type) => {
                        inputs.forEach((input) => {
                            input.addEventListener(type, () => {
                                displayButtonMsg(false, id_filter, "error");
                            });
                        });
                    });
                });
            });
        };
    });
}

initRequest();