//
// Global constants and variables
//

const id_search_equipment = document.getElementById("id_search_equipment");
const id_search_equipment_init = document.getElementById("id_search_equipment_init");
const id_equipment_q = document.getElementById("id_equipment_q");
const id_equipment_detail = document.getElementById("id_equipment_detail");
const id_equipment_detail_title = document.getElementById("id_equipment_detail_title");
const id_equipment_detail_content_blank = document.getElementById("id_equipment_detail_content_blank")
const id_equipment_modal = document.getElementById("id_equipment_modal");
const id_equipment_modal_form = document.getElementById("id_equipment_modal_form");
const id_equipment_modal_share = document.getElementById("id_equipment_modal_share");
const id_equipment_data = document.getElementById("id_equipment_data");
const id_purpose = document.getElementById("id_purpose");
const id_period_label = document.getElementById("id_period_label");
const id_period_prev = document.getElementById("id_period_prev");
const id_period_next = document.getElementById("id_period_next");
const id_period_days_container = document.getElementById("id_period_days_container");
const id_period_help = document.getElementById("id_period_help");
const id_start_date = document.getElementById("id_start_date");
const id_end_date = document.getElementById("id_end_date");
const id_category = document.getElementById("id_category");
const id_filter_equipment = document.getElementById("id_filter_equipment");
const id_url_param = document.getElementById("id_url_param");
const radioInputs = document.querySelectorAll("input[name='id_category']");
const id_go_to_list = document.getElementById("id_go_to_list");

let currentHistoryLength = history.length;
let lastClickedWasHash = false;
let modalOpen = false;

//
// Sub functions
//

function search() {
    if (id_equipment_q !== null) {
        if (urlParams.has("q")) {
            id_equipment_q.value = urlParams.get("q");
            ["click", "keyup"].forEach(type => {
                id_search_equipment_init.addEventListener(type, (event) => {
                    if (type == "click" || event.key == "Enter" || event.key == " ") {
                        urlParams.delete("q");
                        location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
                        id_equipment_q.readOnly = true;
                        id_search_equipment.disabled = true;
                    };
                });
            });
        };

        id_equipment_q.addEventListener("keyup", (event) => {
            if (event.key == "Enter") {
                id_search_equipment.click();
            };
        });

        ["click", "keyup"].forEach(type => {
            id_search_equipment.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    urlParams.delete("page");
                    urlParams.delete("q");
                    urlParams.append("q", id_equipment_q.value);
                    location.href = `${originLocation}/equipment/?${urlParams.toString()}`;
                    id_equipment_q.readOnly = true;
                    id_search_equipment.disabled = true;
                };
            });
        });
    };
}

search();

function initCalendar() {
    let currentDate;
    let startDate = null;
    let endDate = null;

    if (id_start_date.value) {
        startDate = new Date(id_start_date.value + "T00:00:00");
        currentDate = new Date(id_start_date.value + "T00:00:00"); // Set currentDate to the start date
    } else {
        currentDate = new Date(); // If no start date, use the current date
    }

    if (id_end_date.value) {
        endDate = new Date(id_end_date.value + "T00:00:00");
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function isDateSelected(date) {
        const formattedDate = formatDate(date);
        return formattedDate === id_start_date.value || formattedDate === id_end_date.value;
    }

    function isDateInRange(date) {
        let minDate = new Date(id_start_date.min + "T00:00:00");
        let maxDate = id_start_date.value && !id_end_date.value
            ? new Date(getDateDaysLaterFormatted(id_start_date.value, Number(id_purpose.dataset.max)) + "T00:00:00")
            : new Date(id_start_date.max + "T00:00:00");

        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return compareDate >= minDate && compareDate <= maxDate;
    }

    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();

        id_period_label.textContent = `${year}년 ${month + 1}월`;

        while (id_period_days_container.firstChild) {
            id_period_days_container.removeChild(id_period_days_container.firstChild);
        };

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const numDays = new Date(year, month + 1, 0).getDate();
        const startCalendarDate = new Date(year, month, 1 - firstDayOfMonth);
        const totalDays = firstDayOfMonth + numDays + (7 - ((firstDayOfMonth + numDays) % 7)) % 7;

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startCalendarDate.getFullYear(), startCalendarDate.getMonth(), startCalendarDate.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = isDateSelected(date);
            const isCurrentMonth = date.getMonth() === month;
            const isInRange = isDateInRange(date);
            const isStartDate = formatDate(date) === id_start_date.value;
            const isEndDate = formatDate(date) === id_end_date.value;
            const isSameStartEnd = id_start_date.value === id_end_date.value && isStartDate;

            const dayElement = document.createElement("div");
            dayElement.className = "py-2";

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
                }
            }

            if (isStartDate || (isSelected && !endDate)) {
                buttonClasses += "rounded-l-full ";
            } else if (isEndDate || (isSelected && !startDate)) {
                buttonClasses += "rounded-r-full ";
            } else {
                buttonClasses += "rounded-full ";
            }

            if (isSelected) {
                buttonClasses += "bg-flamingo-600 text-white ";
            } else {
                if (isToday) {
                    buttonClasses += "text-flamingo-600 ";
                } else {
                    buttonClasses += isCurrentMonth ? "text-gray-900 " : "text-gray-400 ";
                }
            }

            if (isInRange) {
                buttonClasses += isSelected || isToday ? "font-semibold " : "hover:bg-gray-200 ";
            } else {
                buttonClasses += "opacity-50 cursor-not-allowed";
            }

            const buttonElement = document.createElement("button");
            buttonElement.type = "button";
            buttonElement.className = buttonClasses;
            buttonElement.innerHTML = `<time datetime="${formatDate(date)}">${date.getDate()}</time>`;
            buttonElement.disabled = !isInRange;

            if (isInRange) {
                buttonElement.addEventListener("click", function () {
                    handleDateSelection(date);
                });
            }

            dayElement.appendChild(buttonElement);
            id_period_days_container.appendChild(dayElement);
        };
    }

    function handleDateSelection(date) {
        if (!isDateInRange(date)) return;

        const formattedDate = formatDate(date);

        if (!startDate || endDate) {
            startDate = date;
            id_start_date.value = formattedDate;
            id_end_date.value = "";
            endDate = null;
            id_end_date.max = getDateDaysLaterFormatted(id_start_date.value, Number(id_purpose.dataset.max));
            id_period_help.innerText = `희망 반납일을 ${id_start_date.value}부터 ${id_end_date.max}까지의 범위 내에서 선택해주세요.`;
            id_period_error.hidden = true;
        } else {
            if (date < startDate) {
                startDate = date;
                id_start_date.value = formatDate(startDate);
                id_end_date.value = "";
                endDate = null;
                id_end_date.max = getDateDaysLaterFormatted(id_start_date.value, Number(id_purpose.dataset.max));
                id_period_help.innerText = `희망 반납일을 ${id_start_date.value}부터 ${id_end_date.max}까지의 범위 내에서 선택해주세요.`;
                id_period_error.hidden = true;
            } else {
                endDate = date;
                id_end_date.value = formatDate(endDate);
                id_period_help.innerText = `희망 대여일이 ${id_start_date.value}, 희망 반납일이 ${id_end_date.value}으로 선택되었어요.`;
                id_period_error.hidden = true;
            }
        }
        updateCalendar();
    }

    id_period_prev.addEventListener("click", function () {
        // Set currentDate to the first day of the current month, then subtract one month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    
    id_period_next.addEventListener("click", function () {
        // Set currentDate to the first day of the current month, then add one month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();

    if (id_start_date.value == "") {
        id_period_help.innerText = `희망 대여일을 ${id_start_date.min}부터 ${id_start_date.max}까지의 범위 내에서 선택해주세요.`;
    } else {
        id_period_help.innerText = `희망 대여일이 ${id_start_date.value}, 희망 반납일이 ${id_end_date.value}으로 선택되었어요.`;
    };
}

function initForm() {
    // id_purpose
    if (urlParams.get("purpose") != null) {
        code("id_purpose_", urlParams.get("purpose")).click();
    };

    // id_start_date, id_end_date
    initCalendar();

    // id_category
    radioInputs.forEach((input) => {
        const label = input.closest("label");
        const svg = label.querySelector("svg");

        input.addEventListener("click", () => {
            if (input.id.indexOf("category") != -1) {
                id_category.value = input.value;
            };
        });

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

        if (input.id.indexOf("category") != -1 && input.value == urlParams.get("category")) {
            input.click();
        };

        if (!input.checked) {
            label.classList.replace("df-ring-inset-flamingo", "df-ring-inset-gray");
            svg.classList.add("invisible");
        } else {
            label.classList.add("df-ring-inset-flamingo");
        };
    });
}

function initModal() {
    let keywords = document.querySelectorAll(".class-keyword");
    let filters = document.querySelectorAll(".class-filter");
    let shares = document.querySelectorAll(".class-share");

    function openModal(action) {
        // action: all
        id_equipment_modal.hidden = false;
        id_equipment_modal.setAttribute("x-data", "{ open: true }");
        disableFocusOutsideModal(id_equipment_modal);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && id_equipment_modal.getAttribute("x-data") == "{ open: true }") {
                enableFocus();
            };
        });
        sessionStorage.setItem("scrollPosition", window.scrollY);
        modalOpen = true;

        // action: filter
        if (action == "filter") {
            id_equipment_modal_form.hidden = false;
            id_equipment_modal_share.hidden = true;
            keywords.forEach(keyword => {
                keyword.innerText = "검색 필터";
            });
            initForm();
            id_filter_equipment.classList.replace("hidden", "inline-flex");
        }

        // action: share
        else if (action == "share") {
            if (id_equipment_modal_form !== null) { id_equipment_modal_form.hidden = true };
            id_equipment_modal_share.hidden = false;
            keywords.forEach(keyword => {
                keyword.innerText = "공유하기";
            });
            id_copy_url_ready.classList.remove("hidden");
            id_copy_url_done.classList.add("hidden");
            id_copy_url_descr.hidden = true;
            id_filter_equipment.classList.replace("inline-flex", "hidden");
        };
    };

    // Users who want to filter their search
    filters.forEach(filter => {
        ["click", "keyup"].forEach(type => {
            filter.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    openModal("filter");
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

function resizeDetail() {
    if (id_equipment_detail !== null) {
        if (this.window.innerWidth >= 640 &&
            id_equipment_detail_title.querySelector("h2").offsetHeight > 32) {
            id_equipment_detail_title.style.setProperty("height", "158px", "important")
            id_equipment_detail_content_blank.style.setProperty("padding-top", "142px", "important");
        };
    };
}

resizeDetail();

function ignoreFocusStyleChangeDueToClick() {
    if (id_equipment_detail !== null) {
        [id_equipment_detail_purpose_title, id_equipment_detail_limit_title, id_equipment_detail_precaution_title].forEach(accordion => {
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

ignoreFocusStyleChangeDueToClick();

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
            if (id_filter_equipment_descr.hidden) {
                id_equipment_modal.setAttribute("x-data", "{ open: false }");
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
    let data = id_equipment_data.dataset;
    let [
        equipmentCollectionId, equipmentThumbnail, equipmentName, equipmentCategory, equipmentSubcategory
    ] = [
            data.equipmentCollectionId, data.equipmentThumbnail, data.equipmentName, data.equipmentCategory, data.equipmentSubcategory
        ];
    let description;

    if (equipmentSubcategory !== "None") {
        description = `${equipmentCategory} · ${equipmentSubcategory} · ${equipmentCollectionId}`
    } else {
        description = `${equipmentCategory} · ${equipmentCollectionId}`
    };

    Kakao.init("36080e7fa227c8f75e1b351c53d2c77c");
    id_kakaotalk.addEventListener("click", () => {
        Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
                title: equipmentName,
                description: description,
                imageUrl: equipmentThumbnail,
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
        let xUrl = `https://twitter.com/intent/tweet?text=${equipmentName}&url=${originLocation}${location.pathname}`;

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

if (id_equipment_data) { share() };

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

//
// Main functions
//

function requestFilterEquipment() {
    code(id_filter_equipment, "_descr").hidden = false;
    code(id_filter_equipment, "_spin").classList.remove("hidden");
    freezeForm(true);
    radioInputs.forEach((input) => {
        if (input.classList.contains("sr-only")) {
            let label = input.closest("label");
            label.classList.replace("hover:bg-gray-50", "bg-gray-100");
            label.classList.replace("cursor-pointer", "cursor-not-allowed");
        };
        radios.forEach((radio) => { radio.disabled = true });
    });
    id_period_error.hidden = true;
    location.href = `${originLocation}/equipment/?purpose=${id_purpose.value}&startDate=${id_start_date.value}&endDate=${id_end_date.value}&category=${id_category.value}`;
}

function setPage() {
    window.addEventListener("pageshow", function (event) {
        // Detect the web browser's back/forward buttons
        if (event.persisted) {
            // Enable Search
            urlParams = new URLSearchParams(location.search);
            id_equipment_q.readOnly = false;
            id_equipment_q.value = urlParams.get("q");
            id_search_equipment.disabled = false;

            // Close modal
            id_equipment_modal.hidden = true;
            id_equipment_modal.setAttribute("x-data", "{ open: false }");
            modalOpen = false;
        };

        // Init
        if (id_url_param !== null && urlParams.size < 4) {
            this.window.location.href = `${originLocation}/equipment/?${id_url_param.value}`;
        };
        id_start_date.value = urlParams.get("startDate");
        id_end_date.value = urlParams.get("endDate");
        code(id_filter_equipment, "_descr").hidden = true;
        code(id_filter_equipment, "_spin").classList.add("hidden");
        freezeForm(false);
        radioInputs.forEach((input) => {
            if (input.classList.contains("sr-only")) {
                let label = input.closest("label");
                label.classList.replace("bg-gray-100", "hover:bg-gray-50");
                label.classList.replace("cursor-not-allowed", "cursor-pointer");
            };
            radios.forEach((radio) => { radio.disabled = false });
        });
        id_purpose.value = urlParams.get("purpose");
        id_category.value = urlParams.get("category");
        if (id_equipment_detail !== null) {
            if (this.window.innerWidth >= 640 &&
                id_equipment_detail_title.querySelector("h2").offsetHeight > 32) {
                id_equipment_detail_title.style.setProperty("height", "158px", "important")
                id_equipment_detail_content_blank.style.setProperty("padding-top", "142px", "important");
            };
        };
        initForm();

        // Step one (first and last)
        ["click", "keyup"].forEach(type => {
            id_filter_equipment.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    if (id_start_date.value == "") {
                        id_period_error.hidden = false;
                        id_period_error.innerText = "희망 대여일을 선택해주세요.";
                    } else if (id_end_date.value == "") {
                        id_period_error.hidden = false;
                        id_period_error.innerText = "희망 반납일을 선택해주세요.";
                    } else {
                        requestFilterEquipment();
                    };
                };
            });
        });
    });
}

setPage();