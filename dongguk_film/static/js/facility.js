//
// Global variables
//

// calendar
const id_calendar_grid = document.getElementById("id_calendar_grid");

// modal
const id_modal = document.getElementById("id_modal");
const id_status = document.getElementById("id_status");
const id_record_id = document.getElementById("id_record_id");
const id_category = document.getElementById("id_category");
const id_project_id = document.getElementById("id_project_id");
const id_name_from_request = document.getElementById("id_name_from_request");
const id_public_url_from_request = document.getElementById("id_public_url_from_request");
const id_status_descr = code(id_status, "_descr");
const id_status_from_request = document.getElementById("id_status_from_request");
const id_created_time_from_request = document.getElementById("id_created_time_from_request");
const id_approved_time_from_request = document.getElementById("id_approved_time_from_request");
const id_started_time_from_request = document.getElementById("id_started_time_from_request");
const id_completed_time_from_request = document.getElementById("id_completed_time_from_request");
const id_canceled_time_from_request = document.getElementById("id_canceled_time_from_request");
const id_rejected_time_from_request = document.getElementById("id_rejected_time_from_request");
const id_purpose_from_request = document.getElementById("id_purpose_from_request");
const id_duration_from_request = document.getElementById("id_duration_from_request");
const id_start_datetime_from_request = document.getElementById("id_start_datetime_from_request");
const id_end_datetime_from_request = document.getElementById("id_end_datetime_from_request");
const id_review_button_container = document.getElementById("id_review_button_container");
const id_approve = document.getElementById("id_approve");
const id_reject = document.getElementById("id_reject");
const id_in_progress = document.getElementById("id_in_progress");
const id_complete = document.getElementById("id_complete");
const class_double_checks = document.querySelectorAll(".class-double-check");

//
// Sub functions
//

// Find the next focusable schedule element
function findNextFocusableSchedule(elements, currentIndex) {
    for (let i = currentIndex + 1; i < elements.length; i++) {
        if (elements[i].tabIndex === 0 && elements[i].dataset.recordId !== elements[currentIndex].dataset.recordId) {
            return elements[i];
        };
    };

    return null; // Return null if no next focusable schedule is found
}

// Find the previous focusable schedule element
function findPreviousFocusableSchedule(elements, currentIndex) {
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (elements[i].tabIndex === 0 && elements[i].dataset.recordId !== elements[currentIndex].dataset.recordId) {
            return elements[i];
        };
    };

    return null; // Return null if no previous focusable schedule is found
}

function displayReviewButtonContainer(bool) {
    if (id_review_button_container === null) return;

    if (bool) {
        id_review_button_container.className = "flex flex-col-reverse mt-5 justify-between sm:items-center sm:flex-row";
        id_review_button_container.hidden = false;
    } else {
        id_review_button_container.className = "";
        id_review_button_container.hidden = true;
    };
}

function shouldShowNextMonth(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate the number of days from the previous month shown in the calendar
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Calculate the number of days from the current month shown in the calendar
    const daysFromCurrentMonth = Math.min(daysInMonth, 42 - daysFromPrevMonth);
    
    // If the current date is in the last week shown in the calendar, show next month
    return date.getDate() > daysFromCurrentMonth - 7;
}

//
// Main functions
//

function initForm() {
    displayReviewButtonContainer(false);

    if (id_review_button_container === null) return;

    const buttons = [
        id_approve,
        id_reject,
        id_in_progress,
        id_complete
    ];

    buttons.forEach(button => {
        button.classList.replace("inline-flex", "hidden");
        displayButtonMsg(false, button, "error");
    });
}

function updateForm(action, datasetObj = null) {
    const class_headings = document.querySelectorAll(".class-heading");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    handleFocusForModal(true, id_modal);  // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);
    class_double_checks.forEach(double_check => { double_check.hidden = true });
    isItDoubleChecked = false;

    const data = datasetObj.dataset;
    let badgeColor, status, statusDescr;
    let duration = data.duration;

    if (data.status === "Pending") {
        badgeColor = "text-blue-700 bg-blue-50 ring-blue-700/10";
        status = "대기 중";
        statusDescr = "운영진이 예약 신청 정보를 확인하고 있어요.";
    } else if (data.status === "Approved") {
        badgeColor = "text-green-700 bg-green-50 ring-green-600/20";
        status = "확정됨";
        statusDescr = "예약이 확정되었어요.";
    } else if (data.status === "In Progress" && data.isAfterEndDatetime === "false") {
        badgeColor = "text-yellow-700 bg-yellow-50 ring-yellow-600/20";
        status = "사용 중";
        statusDescr = "현재 이 시설을 사용하고 있어요.";
    } else if (data.status === "In Progress" && data.isAfterEndDatetime === "true") {
        badgeColor = "text-red-700 bg-red-50 ring-red-600/10";
        status = "종료 지연됨";
        statusDescr = "시설 사용 종료가 늦어지고 있어요.";
    } else if (data.status === "Completed") {
        badgeColor = "text-slate-700 bg-slate-50 ring-slate-600/20";
        status = "종료됨";
        statusDescr = "시설 사용이 종료되었어요.";
    } else if (data.status === "Canceled") {
        badgeColor = "text-pink-700 bg-pink-50 ring-pink-700/10";
        status = "취소됨";
        statusDescr = "예약이 취소되었어요.";
    } else if (data.status === "Rejected") {
        badgeColor = "text-red-700 bg-red-50 ring-red-600/10";
        status = "반려됨";
        statusDescr = "예약이 반려되었어요.";
    };

    if (Number(duration) > 0) {
        duration = `${duration}일`;
    } else if (Number(duration) === 0) {
        duration = "당일";
    };

    id_status.value = data.status;
    id_record_id.value = data.recordId;
    id_category.value = data.category;
    id_project_id.value = data.projectId;
    id_name_from_request.innerText = data.name;
    id_public_url_from_request.href = data.publicUrl;
    id_status_descr.innerText = statusDescr;
    id_status_from_request.className = `rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}`;
    id_status_from_request.innerText = status;
    id_created_time_from_request.innerText = data.createdTime;
    id_purpose_from_request.innerText = data.purposeKeyword;
    id_duration_from_request.innerText = duration;
    id_start_datetime_from_request.innerText = data.startDatetime;
    id_end_datetime_from_request.innerText = data.endDatetime;

    [id_approved_time_from_request, id_started_time_from_request, id_completed_time_from_request, id_canceled_time_from_request, id_rejected_time_from_request].forEach(element => {
        element.innerText = "";
        element.parentElement.classList.replace("flex", "hidden");
    });

    let innerTextArray = [id_created_time_from_request, id_purpose_from_request, id_duration_from_request, id_start_datetime_from_request, id_end_datetime_from_request];

    if (data.approvedTime !== "null") {
        id_approved_time_from_request.innerText = data.approvedTime;
        id_approved_time_from_request.parentElement.classList.replace("hidden", "flex");
        innerTextArray.push(id_approved_time_from_request);
    };

    if (data.startedTime !== "null") {
        id_started_time_from_request.innerText = data.startedTime;
        id_started_time_from_request.parentElement.classList.replace("hidden", "flex");
        innerTextArray.push(id_started_time_from_request);
    };

    if (data.completedTime !== "null") {
        id_completed_time_from_request.innerText = data.completedTime;
        id_completed_time_from_request.parentElement.classList.replace("hidden", "flex");
        innerTextArray.push(id_completed_time_from_request);
    };

    if (data.canceledTime !== "null") {
        id_canceled_time_from_request.innerText = data.canceledTime;
        id_canceled_time_from_request.parentElement.classList.replace("hidden", "flex");
        innerTextArray.push(id_canceled_time_from_request);
    };

    if (data.rejectedTime !== "null") {
        id_rejected_time_from_request.innerText = data.rejectedTime;
        id_rejected_time_from_request.parentElement.classList.replace("hidden", "flex");
        innerTextArray.push(id_rejected_time_from_request);
    };

    innerTextArray.forEach(element => {
        element.className = "flex font-semibold text-right";
    });

    initForm();

    const defaultHeadingText = "예약내역 상세 보기";

    // action: "read"
    if (action === "read") {
        displayReviewButtonContainer(false);

        class_headings.forEach(heading => {
            heading.innerText = defaultHeadingText;
        });
    }

    // action: "review"
    else if (action === "review") {
        let headingText = "시설예약 처리하기";

        if (data.status === "Completed" || data.status === "Canceled" || data.status === "Rejected") {
            displayReviewButtonContainer(false);
            headingText = defaultHeadingText;
        } else {
            if (data.status === "Pending") {
                displayReviewButtonContainer(true);
                id_approve.classList.replace("hidden", "inline-flex");
                id_reject.classList.replace("hidden", "inline-flex");
            } else if (data.status === "Approved") {
                if (data.isAfterStartDatetime === "true") {
                    displayReviewButtonContainer(true);
                    id_in_progress.classList.replace("hidden", "inline-flex");
                } else {
                    headingText = defaultHeadingText;
                };
            } else if (data.status === "In Progress") {
                displayReviewButtonContainer(true);
                id_complete.classList.replace("hidden", "inline-flex");
            };
        };

        class_headings.forEach(heading => {
            heading.innerText = headingText;
        });
    };
}

function initModal() {
    const class_reads = document.querySelectorAll(".class-read");
    const class_reviews = document.querySelectorAll(".class-review");

    class_reads.forEach(read => {
        ["click", "keyup"].forEach(type => {
            read.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("read", read);
                };
            });
        });
    });

    class_reviews.forEach(review => {
        ["click", "keyup"].forEach(type => {
            review.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("review", review);
                };
            });
        });
    });
}

function initCalendar() {
    const id_calendar_grid = document.getElementById("id_calendar_grid");
    const id_current_month_year = document.getElementById("id_current_month_year");
    const id_prev_month = document.getElementById("id_prev_month");
    const id_next_month = document.getElementById("id_next_month");
    const id_current_month = document.getElementById("id_current_month");
    let currentDate = new Date();

    // Check if we should show next month
    if (shouldShowNextMonth(currentDate)) {
        currentDate.setMonth(currentDate.getMonth() + 1);
    };

    function updateCalendar(year, month) {
        let earliestDate, latestDate;

        id_calendar_grid.innerHTML = "";

        const koreanMonths = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

        id_current_month_year.textContent = `${year}년 ${koreanMonths[month]}월`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        // Add dates from the previous month
        const prevMonth = month === 0 ? 11 : month - 1;  // Calculate previous month
        const prevYear = month === 0 ? year - 1 : year;  // Calculate year of previous month
        const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate(); // Last day of previous month

        for (let i = startingDay - 1; i >= 0; i--) {
            const prevMonthDay = new Date(prevYear, prevMonth, prevMonthLastDay - i);

            addDayToCalendar(prevMonthDay, true);

            if (i === startingDay - 1) {
                earliestDate = prevMonthDay;
            };
        };

        // Add dates for the current month
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDay = new Date(year, month, i);

            addDayToCalendar(currentDay, false);

            if (earliestDate === undefined) {
                earliestDate = currentDay;
            };
        };

        // Add dates from the next month to fill up to 42 cells
        const totalDaysDisplayed = startingDay + daysInMonth;
        const remainingDays = 42 - totalDaysDisplayed; // Calculate remaining days to fill 42 days
        const nextMonth = month === 11 ? 0 : month + 1;  // Calculate next month
        const nextYear = month === 11 ? year + 1 : year;  // Calculate year of next month

        for (let i = 1; i <= remainingDays; i++) {
            const nextMonthDay = new Date(nextYear, nextMonth, i);

            addDayToCalendar(nextMonthDay, true);

            if (i === remainingDays) {
                latestDate = nextMonthDay;
            };
        };

        displayNoti(true, "WORK_IN_PROGRESS", "예약내역을 불러오고 있어요.");

        const data = {
            earliestDate: formatDate(earliestDate),
            latestDate: formatDate(latestDate)
        };

        requestFindFacilityRequest(data);
        requestFindHoliday();
    }

    function addDayToCalendar(date, isOtherMonth) {
        const dayElement = document.createElement("div");

        dayElement.className = `relative min-h-[150px] ${isOtherMonth ? "bg-gray-50 text-gray-500" : "bg-white"} flex flex-col`;

        const timeElement = document.createElement("time");

        // Set YYYY-MM-DD format based on local time zone, not UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");  // Month starts from 0, so add 1
        const day = String(date.getDate()).padStart(2, "0");

        timeElement.dateTime = `${year}-${month}-${day}`;
        timeElement.textContent = date.getDate();

        const isToday = date.toDateString() === new Date().toDateString();

        if (isToday) {
            timeElement.className = "relative ml-1 my-1 flex h-6 w-6 items-center justify-center rounded-full df-ring-inset-flamingo text-flamingo-600";
        } else {
            timeElement.className = "relative ml-1 my-1 flex h-6 w-6 items-center justify-center rounded-full text-gray-900";
        };

        const wrapperElement = document.createElement("div");

        wrapperElement.className = "flex justify-start space-x-2";
        wrapperElement.appendChild(timeElement);
        dayElement.appendChild(wrapperElement);
        id_calendar_grid.appendChild(dayElement);
    }

    function updateMonth(increment) {
        currentDate.setMonth(currentDate.getMonth() + increment);
        updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    id_prev_month.addEventListener("click", () => updateMonth(-1));
    id_next_month.addEventListener("click", () => updateMonth(1));

    id_current_month.addEventListener("click", () => {
        currentDate = new Date();
        updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    updateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

function addHolidayInCalendar(holidayArray) {
    const isHolidayAlreadyApplied = id_calendar_grid.querySelector(".text-red-700");

    if (isHolidayAlreadyApplied) return;

    holidayArray.forEach(holiday => {
        const holidayElement = id_calendar_grid.querySelector(`time[datetime="${holiday.date}"]`);

        if (holidayElement) {
            holidayElement.classList.replace("text-gray-900", "text-red-700");

            const wrapperElement = holidayElement.parentElement;

            wrapperElement.classList.add("flex", "justify-start", "space-x-2");

            const spanElement = document.createElement("span");

            spanElement.textContent = holiday.name;
            spanElement.className = "hidden sm:flex justify-center items-center text-red-700 h-6 my-1 truncate opacity-0 transition-opacity duration-300 ease-in-out";
            wrapperElement.appendChild(spanElement);

            setTimeout(() => {
                spanElement.classList.remove("opacity-0");
                spanElement.classList.add("opacity-100");
            }, 30);
        };
    });
}

function adjustCalendarHeight() {
    const weekRows = [];
    const daysInCalendar = id_calendar_grid.children.length;

    // Group days into weeks
    for (let i = 0; i < daysInCalendar; i += 7) {
        weekRows.push(Array.from(id_calendar_grid.children).slice(i, i + 7));
    };

    weekRows.forEach(week => {
        let maxSchedulesInWeek = 0;

        week.forEach(day => {
            const scheduleElements = day.querySelectorAll(".class-request");
            const scheduleCount = new Set(Array.from(scheduleElements).map(el => el.dataset.recordId)).size;

            maxSchedulesInWeek = Math.max(maxSchedulesInWeek, scheduleCount);
        });

        if (maxSchedulesInWeek > 5) {
            const extraHeight = (maxSchedulesInWeek - 5) * 24; // 24px for each extra schedule
            const newMinHeight = 150 + extraHeight; // 150px is the original minHeight

            week.forEach(day => {
                day.style.minHeight = `${newMinHeight}px`;
                day.classList.add("transition-all", "duration-300", "ease-in-out");
            });
        };
    });
}

function addScheduleToCalendar() {
    if (!window.foundFacilityRequestList) return;

    const monthStart = new Date(id_calendar_grid.querySelector("time").dateTime);
    const monthEnd = new Date(id_calendar_grid.querySelectorAll("time")[id_calendar_grid.querySelectorAll("time").length - 1].dateTime);

    // Remove existing schedule elements
    id_calendar_grid.querySelectorAll(".class-request").forEach(el => el.remove());

    let dateRowMap = {};

    window.foundFacilityRequestList.sort((a, b) => {
        const timeA = parseDate(a.start_datetime).getTime();
        const timeB = parseDate(b.start_datetime).getTime();

        return timeA - timeB;
    });

    window.foundFacilityRequestList.forEach(schedule => {
        const startDate = new Date(schedule.start_datetime.split(" ")[0].split("(")[0]);
        const endDate = new Date(schedule.end_datetime.split(" ")[0].split("(")[0]);

        // Adjust dates to fit the current month view
        const visibleStartDate = new Date(Math.max(startDate, monthStart));
        const visibleEndDate = new Date(Math.min(endDate, monthEnd));
        const startElement = id_calendar_grid.querySelector(`time[datetime="${formatDate(visibleStartDate)}"]`);
        const endElement = id_calendar_grid.querySelector(`time[datetime="${formatDate(visibleEndDate)}"]`);

        if (startElement && endElement) {
            const startIndex = Array.from(id_calendar_grid.children).indexOf(startElement.parentElement.parentElement);
            const endIndex = Array.from(id_calendar_grid.children).indexOf(endElement.parentElement.parentElement);
            const isOneDay = startIndex === endIndex;

            let eventDates = [];
            let currentDate = new Date(visibleStartDate);

            while (currentDate <= visibleEndDate) {
                eventDates.push(formatDate(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            };

            let assignedRow = 0;
            let foundRow = false;

            while (!foundRow) {
                // Check if the row is empty for all dates
                let rowIsFree = eventDates.every(date => {
                    if (!dateRowMap[date]) {
                        dateRowMap[date] = [];
                    };

                    return !dateRowMap[date][assignedRow];
                });

                if (rowIsFree) {
                    // Assign the row number to the schedule and mark the row as used for these dates
                    foundRow = true;

                    eventDates.forEach(date => {
                        dateRowMap[date][assignedRow] = true;
                    });

                    schedule.assignedRow = assignedRow;
                } else {
                    // Try the next row number
                    assignedRow++;
                };
            };

            const firstRowHeight = 32;
            const rowHeight = 24; // Height of each row (adjust as needed)

            for (let i = startIndex; i <= endIndex; i++) {
                const dayElement = id_calendar_grid.children[i];
                const scheduleElement = document.createElement("div");

                scheduleElement.style.position = "absolute";
                scheduleElement.style.top = `${schedule.assignedRow * rowHeight + firstRowHeight}px`;
                scheduleElement.style.left = "0";
                scheduleElement.style.right = "0";
                scheduleElement.style.height = `${rowHeight - 2}px`; // Slightly reduced for spacing
                scheduleElement.dataset.recordId = schedule.record_id;
                scheduleElement.dataset.name = schedule.name;
                scheduleElement.dataset.category = schedule.category;
                scheduleElement.dataset.projectId = schedule.project_id;
                scheduleElement.dataset.purposeKeyword = schedule.purpose.keyword;
                scheduleElement.dataset.duration = schedule.duration;
                scheduleElement.dataset.startDatetime = schedule.start_datetime;
                scheduleElement.dataset.endDatetime = schedule.end_datetime;
                scheduleElement.dataset.isAfterStartDatetime = schedule.is_after_start_datetime;
                scheduleElement.dataset.isAfterEndDatetime = schedule.is_after_end_datetime;
                scheduleElement.dataset.publicUrl = schedule.public_url;
                scheduleElement.dataset.forInstructor = schedule.is_for_instructor;
                scheduleElement.dataset.status = schedule.status;
                scheduleElement.dataset.createdTime = schedule.created_time;
                scheduleElement.dataset.approvedTime = schedule.approved_time;
                scheduleElement.dataset.startedTime = schedule.started_time;
                scheduleElement.dataset.completedTime = schedule.completed_time;
                scheduleElement.dataset.canceledTime = schedule.canceled_time;
                scheduleElement.dataset.rejectedTime = schedule.rejected_time;
                scheduleElement.tabIndex = 0;

                let permissionClass = "class-read";

                if (id_review_button_container !== null) {
                    const data = id_review_button_container.dataset;
                    const permissionTypeList = data.permissionTypeList;

                    if (permissionTypeList.length > 0) {
                        permissionClass = "class-review";
                    };
                };

                scheduleElement.className = `class-request ${permissionClass} cursor-pointer text-xs flex items-center -ml-px -mr-px border-y opacity-0 transition-opacity duration-300 ease-in-out focus:outline-none`;

                const colorByStatus = {
                    "Pending": "text-blue-700 bg-blue-50",
                    "Approved": "text-green-700 bg-green-50",
                    "In Progress": "text-yellow-700 bg-yellow-50",
                    "In Progress After End Datetime": "text-red-700 bg-red-50",
                    "Completed": "text-slate-700 bg-slate-50",
                    "Canceled": "text-pink-700 bg-pink-50",
                    "Rejected": "text-red-700 bg-red-50"
                };

                const borderColorByStatus = {
                    "Pending": "border-blue-700/10",
                    "Approved": "border-green-600/20",
                    "In Progress": "border-yellow-600/20",
                    "In Progress After End Datetime": "border-red-600/10",
                    "Completed": "border-slate-600/20",
                    "Canceled": "border-pink-700/10",
                    "Rejected": "border-red-600/10"
                };

                const hoverColorByStatus = {
                    "Pending": "text-blue-800 bg-blue-200",
                    "Approved": "text-green-800 bg-green-200",
                    "In Progress": "text-yellow-800 bg-yellow-200",
                    "In Progress After End Datetime": "text-red-800 bg-red-200",
                    "Completed": "text-slate-800 bg-slate-200",
                    "Canceled": "text-pink-800 bg-pink-200",
                    "Rejected": "text-red-800 bg-red-200"
                };

                let statusKey = schedule.status;

                if (schedule.status === "In Progress" && schedule.is_after_end_datetime === true) {
                    statusKey = "In Progress After End Datetime";
                };

                const colorClasses = colorByStatus[statusKey];
                const hoverColorClasses = hoverColorByStatus[statusKey];

                if (colorClasses) {
                    const colorClassList = colorClasses.split(" ");

                    scheduleElement.classList.add(...colorClassList);
                    scheduleElement.dataset.originalColorClasses = colorClasses;
                };

                if (hoverColorClasses) {
                    scheduleElement.dataset.hoverColorClasses = hoverColorClasses;
                };

                const borderColorClass = borderColorByStatus[statusKey];

                if (borderColorClass) {
                    scheduleElement.classList.add(borderColorClass);
                };

                // Round corners based on start and end
                if (i === startIndex || isOneDay) {
                    scheduleElement.classList.add("rounded-l-md", "border-l");
                    scheduleElement.classList.remove("-ml-px");
                };

                if (i === endIndex || isOneDay) {
                    scheduleElement.classList.add("rounded-r-md", "border-r");
                    scheduleElement.classList.remove("-mr-px");
                };

                // Add text only to the first element
                if (i === startIndex) {
                    const textElement = document.createElement("span");

                    textElement.textContent = schedule.name;

                    const srOnlyTextElement = document.createElement("span");

                    const statusInKorean = {
                        "Pending": "대기 중",
                        "Approved": "확정됨",
                        "In Progress": "사용 중",
                        "In Progress After End Datetime": "종료 지연됨",
                        "Completed": "종료됨",
                        "Canceled": "취소됨",
                        "Rejected": "반려됨"
                    };

                    srOnlyTextElement.textContent = `${schedule.start_datetime}, ${statusInKorean[statusKey]}, `;
                    srOnlyTextElement.className = "sr-only";
                    textElement.prepend(srOnlyTextElement);

                    if (isOneDay) {
                        textElement.className = "px-1 sm:px-2 whitespace-nowrap overflow-hidden";
                    } else {
                        textElement.className = "px-1 sm:px-2 whitespace-nowrap";
                    };

                    scheduleElement.appendChild(textElement);
                    scheduleElement.classList.add("z-10");
                };

                // Set tabIndex only for the first element
                if (i === startIndex) {
                    scheduleElement.tabIndex = 0;
                } else {
                    scheduleElement.tabIndex = -1;
                };

                // Adjust margins for elements at the left or right edge of the calendar
                if (i % 7 === 0) {
                    scheduleElement.classList.remove("-ml-px");
                    scheduleElement.classList.add("ml-0");

                    if (!scheduleElement.hasChildNodes()) {
                        const textElement = document.createElement("span");

                        textElement.textContent = schedule.name;

                        if (isOneDay) {
                            textElement.className = "px-1 sm:px-2 whitespace-nowrap overflow-hidden";
                        } else {
                            textElement.className = "px-1 sm:px-2 whitespace-nowrap";
                        };

                        scheduleElement.appendChild(textElement);
                    };

                    scheduleElement.classList.add("z-10");
                };

                if (i % 7 === 6) {
                    scheduleElement.classList.remove("-mr-px");
                    scheduleElement.classList.add("mr-0");
                };

                // Add mouseover event listener
                scheduleElement.addEventListener("mouseover", function () {
                    const recordId = schedule.record_id;
                    const relatedElements = document.querySelectorAll(`[data-record-id="${recordId}"]`);

                    relatedElements.forEach(el => {
                        const originalColorClasses = el.dataset.originalColorClasses.split(" ");
                        const hoverColorClasses = el.dataset.hoverColorClasses.split(" ");

                        // Remove original text color and background color classes
                        el.classList.remove(...originalColorClasses);

                        // Add hover text color and background color classes
                        el.classList.add(...hoverColorClasses);
                    });
                });

                // Add mouseout event listener
                scheduleElement.addEventListener("mouseout", function () {
                    const recordId = schedule.record_id;
                    const relatedElements = document.querySelectorAll(`[data-record-id="${recordId}"]`);

                    relatedElements.forEach(el => {
                        const originalColorClasses = el.dataset.originalColorClasses.split(" ");
                        const hoverColorClasses = el.dataset.hoverColorClasses.split(" ");

                        // Remove hover text color and background color classes
                        el.classList.remove(...hoverColorClasses);

                        // Add original text color and background color classes
                        el.classList.add(...originalColorClasses);
                    });
                });


                // Add focus event listener
                scheduleElement.addEventListener("focus", function () {
                    const recordId = schedule.record_id;
                    const allScheduleElements = document.querySelectorAll(".class-request");
                    const relatedElements = document.querySelectorAll(`[data-record-id="${recordId}"]`);

                    allScheduleElements.forEach(el => {
                        const elStatus = el.dataset.status;
                        let statusKey = elStatus;

                        if (elStatus === "In Progress" && el.dataset.isAfterEndDatetime === "true") {
                            statusKey = "In Progress After End Datetime";
                        };

                        const borderClass = borderColorByStatus[statusKey];
                        const spanElement = el.querySelector("span");

                        if (Array.from(relatedElements).includes(el)) {
                            el.classList.remove(...Object.values(borderColorByStatus).flat());
                            el.classList.add("border-flamingo");

                            if (el.classList.contains("border-l")) {
                                el.classList.replace("border-l", "border-l-2");

                                if (spanElement) {
                                    spanElement.style.marginLeft = "-1px";
                                };
                            };

                            if (el.classList.contains("border-r")) {
                                el.classList.replace("border-r", "border-r-2");
                            };

                            if (el.classList.contains("border-y")) {
                                el.classList.replace("border-y", "border-y-2");
                            };
                        } else {
                            el.classList.remove("border-flamingo", ...Object.values(borderColorByStatus).flat());
                            el.classList.add(borderClass);

                            if (el.classList.contains("border-l-2")) {
                                el.classList.replace("border-l-2", "border-l");

                                if (spanElement) {
                                    spanElement.style.marginLeft = "0";
                                };
                            };

                            if (el.classList.contains("border-r-2")) {
                                el.classList.replace("border-r-2", "border-r");
                            };

                            if (el.classList.contains("border-y-2")) {
                                el.classList.replace("border-y-2", "border-y");
                            };
                        };
                    });
                });

                // Add blur event listener
                scheduleElement.addEventListener("blur", function () {
                    const allScheduleElements = document.querySelectorAll(".class-request");

                    allScheduleElements.forEach(el => {
                        const elStatus = el.dataset.status;
                        let statusKey = elStatus;

                        if (elStatus === "In Progress" && el.dataset.isAfterEndDatetime === "true") {
                            statusKey = "In Progress After End Datetime";
                        };

                        const borderClass = borderColorByStatus[statusKey];
                        const spanElement = el.querySelector("span");

                        el.classList.remove("border-flamingo", ...Object.values(borderColorByStatus).flat());
                        el.classList.add(borderClass);

                        if (el.classList.contains("border-l-2")) {
                            el.classList.replace("border-l-2", "border-l");

                            if (spanElement) {
                                spanElement.style.marginLeft = "0";
                            };
                        };

                        if (el.classList.contains("border-r-2")) {
                            el.classList.replace("border-r-2", "border-r");
                        };

                        if (el.classList.contains("border-y-2")) {
                            el.classList.replace("border-y-2", "border-y");
                        };
                    });
                });

                // Modify keyboard event listener
                scheduleElement.addEventListener("keydown", function (event) {
                    if (event.key === "Tab") {
                        const scheduleElements = id_calendar_grid.querySelectorAll(".class-request");
                        const currentIndex = Array.from(scheduleElements).indexOf(this);
                        let nextElement;

                        if (event.shiftKey) {
                            // Shift + Tab: Move to previous element
                            nextElement = findPreviousFocusableSchedule(scheduleElements, currentIndex);
                        } else {
                            // Tab: Move to next element
                            nextElement = findNextFocusableSchedule(scheduleElements, currentIndex);
                        };

                        if (nextElement) {
                            event.preventDefault();
                            nextElement.focus();
                        };
                        // If nextElement is null, perform default tab behavior (move out of the grid)
                    };
                });

                dayElement.appendChild(scheduleElement);

                setTimeout(() => {
                    scheduleElement.classList.remove("opacity-0");
                    scheduleElement.classList.add("opacity-100");
                }, 30);
            };
        };
    });

    adjustCalendarHeight();
    initModal();
}

function requestFindFacilityRequest(data) {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "find_facility_request", ...data };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestFindHoliday() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "find_holiday" };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestUpdateStatusToApproved() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "update_status_to_approved", recordId: id_record_id.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateStatusToInProgress() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "update_status_to_in_progress", recordId: id_record_id.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateStatusToCompleted() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "update_status_to_completed", recordId: id_record_id.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateStatusToRejected() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "update_status_to_rejected", recordId: id_record_id.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        requestVerifyAuthentication();
        initCalendar();

        if (id_review_button_container !== null) {
            ["click", "keyup"].forEach(type => {
                id_approve.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        requestApproveRequest();
                        displayButtonMsg(true, id_approve, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_approve, "error");

                        const id_approve_spin = code(id_approve, "_spin");

                        id_approve_spin.classList.remove("hidden");
                    };
                });

                id_reject.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        requestRejectRequest();
                        displayButtonMsg(true, id_reject, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_reject, "error");

                        const id_reject_spin = code(id_reject, "_spin");

                        id_reject_spin.classList.remove("hidden");
                    };
                });

                id_in_progress.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        requestUpdateStatusToInProgress();
                        displayButtonMsg(true, id_in_progress, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_in_progress, "error");

                        const id_in_progress_spin = code(id_in_progress, "_spin");

                        id_in_progress_spin.classList.remove("hidden");
                    };
                });

                id_complete.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        requestUpdateStatusToCompleted();
                        displayButtonMsg(true, id_complete, "descr", "잠시만 기다려주세요.");
                        displayButtonMsg(false, id_complete, "error");

                        const id_complete_spin = code(id_complete, "_spin");

                        id_complete_spin.classList.remove("hidden");
                    };
                });
            });
        };
    });
}

initRequest();