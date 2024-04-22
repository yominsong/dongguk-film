//
// Global variables
//

// modal
const id_modal = document.getElementById("id_modal");
const id_modal_base = code(id_modal, "_base");
const id_modal_filter = code(id_modal, "_filter");
const id_scrollable_part_of_modal = code("id_scrollable_part_of_", id_modal);
const id_category = document.getElementById("id_category");
const id_purpose = document.getElementById("id_purpose");
const id_initialize_purpose = code("id_initialize_", id_purpose);
const id_period = document.getElementById("id_period");
const id_purpose_badge = code(id_purpose, "_badge");
const id_period_calendar = code(id_period, "_calendar");
const id_period_help = code(id_period, "_help");
const id_filter_or_checkout = document.getElementById("id_filter_or_checkout");
const id_url = document.getElementById("id_url");
const id_copy_url = code("id_copy_", id_url);
const id_copy_url_ready = code(id_copy_url, "_ready");
const id_copy_url_done = code(id_copy_url, "_done");
const id_copy_url_descr = code(id_copy_url, "_descr");

// detail
const id_detail = document.getElementById("id_detail");
const id_requested_quantity = document.getElementById("id_requested_quantity");

// classes
let class_firsts = document.querySelectorAll(".class-first");

// Boolean
let is_quantity_button_updated = false;

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
    displayNoti(false, "EGL");
    displayNoti(false, "EQL");
    displayNoti(false, "PTA");
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
    const id_modal_checkout = code(id_modal, "_checkout");
    const id_modal_share = code(id_modal, "_share");
    const class_keywords = document.querySelectorAll(".class-keyword");

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

        const id_filter_or_checkout_text = code(id_filter_or_checkout, "_text");

        id_filter_or_checkout_text.innerText = "적용하기";
        id_filter_or_checkout.classList.replace("hidden", "inline-flex");
    }

    // Middle action: view_cart
    else if (action === "view_cart") {
        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_modal_checkout.hidden = true;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "장바구니";
        });

        executeWhenCartIsUpdated();

        const cart = JSON.parse(sessionStorage.getItem("cart"));
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

                addedItemElement.className = "flex relative justify-between gap-x-4 py-5 hover:bg-gray-50 px-4 sm:px-6 -mx-4 sm:-mx-6";

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
                            <p class="mt-1 truncate leading-5 text-gray-500 ${blinkClass}">${firstItem.collection_id} · ${itemCount}개</p>
                        </div>
                    </div>
                    <div class="flex shrink-0 items-center z-10">
                        <button class="class-remove-from-cart rounded-md text-gray-500 hover:underline focus:df-focus-ring-offset-white disabled:cursor-not-allowed"
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

            const id_filter_or_checkout_text = code(id_filter_or_checkout, "_text");
            
            id_filter_or_checkout_text.innerText = "예약하기";
            id_filter_or_checkout.classList.replace("hidden", "inline-flex");
            id_filter_or_checkout.classList.add("class-checkout");
        };

        initModal(); // Run to read the newly created class-remove-from-cart
    }

    // Middle action: remove_from_cart
    else if (action === "remove_from_cart") {
        const data = datasetObj.dataset;
        const cart = JSON.parse(sessionStorage.getItem("cart"));
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
        id_modal_filter.hidden = true;
        id_modal_cart.hidden = false;
        id_modal_checkout.hidden = false;
        id_modal_share.hidden = true;

        class_keywords.forEach(keyword => {
            keyword.innerText = "예약하기";
        });

        id_filter_or_checkout.classList.remove("class-checkout");
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

    class_checkouts.forEach(checkout => {
        ["click", "keyup"].forEach(type => {
            checkout.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("checkout");
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

    if (is_quantity_button_updated) return;

    id_requested_quantity.addEventListener("input", () => {
        if (document.activeElement !== id_requested_quantity) return;

        if (id_requested_quantity.value === "0") {
            id_requested_quantity.value = "1";
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

    is_quantity_button_updated = true;
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
};

function initRequest() {
    window.addEventListener("pageshow", () => {
        requestVerifyAuthentication();

        if (id_modal === null) return;

        class_firsts = document.querySelectorAll(".class-first");
        initValidation(class_firsts, id_filter_or_checkout);

        ["click", "keyup"].forEach(type => {
            id_filter_or_checkout.addEventListener(type, event => {
                const targetTagName = event.target.tagName;

                if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                    (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                    if (id_filter_or_checkout.innerText === "적용하기" && isItOkayToSubmitForm()) {
                        requestFilterEquipment();
                        displayButtonMsg(true, id_filter_or_checkout, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_filter_or_checkout, "error");

                        const id_filter_or_checkout_spin = code(id_filter_or_checkout, "_spin");

                        id_filter_or_checkout_spin.classList.remove("hidden");
                    } else if (id_filter_or_checkout.innerText === "예약하기") {
                        if (userPk === null || userName === null || userStudentId === null) {
                            let params = {};

                            params.next = `${location.pathname}${location.search}`;
                            params.loginRequestMsg = "checkout";
                            location.href = `${location.origin}/accounts/login/?${new URLSearchParams(params).toString()}`;
                        } else {
                            
                            return; // Under construction
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