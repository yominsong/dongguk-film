//
// Global variables
//

// modal
const id_modal = document.getElementById("id_modal");
const id_email = document.getElementById("id_email");
const id_phone = document.getElementById("id_phone");
const id_send_vcode = document.getElementById("id_send_vcode");
const id_confirm_vcode = document.getElementById("id_confirm_vcode");
const id_record_id = document.getElementById("id_record_id");
const id_cancel_or_delete = document.getElementById("id_cancel_or_delete");
const class_firsts = document.querySelectorAll(".class-first");
let class_seconds = document.querySelectorAll(".class-second");
const class_double_checks = document.querySelectorAll(".class-double-check");

// boolean
let isDoubleChecked = false;

// miscellaneous
let doubleCheckTimer;

//
// Sub functions
//

function savePageState() {
    const state = {
        facility_page: sessionStorage.getItem("facility_page") || "1",
        project_page: sessionStorage.getItem("project_page") || "1",
        dflink_page: sessionStorage.getItem("dflink_page") || "1",
        notice_page: sessionStorage.getItem("notice_page") || "1"
    };

    history.replaceState(state, "");
}

function loadPageState() {
    const state = history.state;

    if (state) {
        requestGetPaginatedData("facility", state.facility_page);
        requestGetPaginatedData("project", state.project_page);
        requestGetPaginatedData("dflink", state.dflink_page);
        requestGetPaginatedData("notice", state.notice_page);
    } else {
        requestGetPaginatedData("facility", 1);
        requestGetPaginatedData("project", 1);
        requestGetPaginatedData("dflink", 1);
        requestGetPaginatedData("notice", 1);
    };
}

function executePrivacyMasking() {
    const elements = [
        { id: "id_user_student_id", type: "student_id", label: "학번" },
        { id: "id_user_name", type: "name", label: "성명" },
        { id: "id_user_email", type: "email_address", label: "이메일 주소" },
        { id: "id_user_phone", type: "phone_number", label: "휴대전화 번호" }
    ];

    elements.forEach(({ id, type, label }) => {
        const element = document.getElementById(id);

        if (!element) return;

        const container = element.closest("div");

        if (!container) return;

        function toggleVisibility(show) {
            const originalText = element.dataset.original;
            const maskedText = maskPersonalInformation(type, originalText);
            element.textContent = show ? originalText : maskedText;
            element.setAttribute("aria-label", `${label}: ${show ? "원본 정보 표시 중" : "마스킹된 정보 표시 중"}`);
        }

        container.addEventListener("mouseenter", () => toggleVisibility(true));
        container.addEventListener("mouseleave", () => toggleVisibility(false));
        container.addEventListener("focus", () => toggleVisibility(true));
        container.addEventListener("blur", () => toggleVisibility(false));
        toggleVisibility(false);
    });
}

function hasInfoChanged(inputs) {
    let hasChanged = false;

    inputs.forEach(input => {
        if (input.value !== input.dataset.original) {
            hasChanged = true;
        };
    });

    return hasChanged;
}

//
// Main functions
//

function initForm() {
    [id_email, id_phone].forEach(input => {
        const data = input.dataset;

        input.value = data.original;
    });

    inputs.forEach((input) => {
        displayError(false, input);
    });

    [id_send_vcode, id_cancel_or_delete].forEach(button => {
        displayButtonMsg(false, button, "error");
    });
}

function updateForm(action, datasetObj = null) {
    const class_headings = document.querySelectorAll(".class-heading");
    const class_keywords = document.querySelectorAll(".class-keyword");
    const id_modal_info = code(id_modal, "_info");
    const id_modal_facility = code(id_modal, "_facility");
    const class_request_details = document.querySelectorAll(".class-request-detail");

    // action: all
    isModalOpen = true;
    id_modal.hidden = false;
    id_modal.setAttribute("x-data", "{ open: true }");
    handleFocusForModal(true, id_modal);  // The action when the modal is closed is being controlled by Alpine.js
    sessionStorage.setItem("scrollPosition", window.scrollY);
    class_double_checks.forEach(double_check => { double_check.hidden = true });
    isDoubleChecked = false;

    // action: "adjust_info"
    if (action === "adjust_info") {
        id_modal_info.hidden = false;
        id_modal_facility.hidden = true;
        initForm();

        class_headings.forEach(heading => {
            heading.innerText = "회원정보 수정하기";
        });

        class_keywords.forEach(keyword => {
            keyword.innerText = "수정하기";
        });

        class_request_details.forEach(detail => {
            detail.hidden = true;
        });
    }

    // action: "read_request"
    else if (action === "read_request") {
        id_modal_info.hidden = true;
        id_modal_facility.hidden = false;

        class_headings.forEach(heading => {
            heading.innerText = "예약내역 상세 보기";
        });

        class_keywords.forEach(keyword => {
            keyword.innerText = "취소하기";
        });

        const data = datasetObj.dataset;
        const id_status = document.getElementById("id_status");
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

        if (data.status === "Pending" || data.status === "Approved") {
            class_request_details.forEach(detail => {
                detail.hidden = false;
            });
        } else {
            class_request_details.forEach(detail => {
                detail.hidden = true;
            });
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

        displayButtonMsg(false, id_cancel_or_delete, "error");
    };
}

function initModal() {
    const class_read_requests = document.querySelectorAll(".class-read-request");
    const class_adjust_infos = document.querySelectorAll(".class-adjust-info");

    class_read_requests.forEach(read => {
        ["click", "keyup"].forEach(type => {
            read.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("read_request", read);
                };
            });
        });
    });

    class_adjust_infos.forEach(adjust => {
        ["click", "keyup"].forEach(type => {
            adjust.addEventListener(type, event => {
                if (type === "click" || event.key === "Enter" || event.key === " ") {
                    updateForm("adjust_info");
                };
            });
        });
    });
}

function handleShortcut() {
    function handleUserRequest(event) {
        const userRequestIsMade =
            event.type === "click" ||
            (event.type === "keyup" && (event.key === "Enter" || event.key === " "));

        if (userRequestIsMade) {
            const locationOrigin = location.origin;
            const pathname = this.getAttribute("data-pathname");
            const query = this.getAttribute("data-query");

            savePageState();
            document.location.href = `${locationOrigin}${pathname}?q=${query}`;
        };
    }

    function addEventListeners(elements) {
        elements.forEach(element => {
            element.addEventListener("click", handleUserRequest);
            element.addEventListener("keyup", handleUserRequest);
        });
    }

    const class_search_project = document.querySelectorAll(".class-search-project");
    const class_search_dflink = document.querySelectorAll(".class-search-dflink");
    const class_search_notice = document.querySelectorAll(".class-search-notice");

    addEventListeners(class_search_project);
    addEventListeners(class_search_dflink);
    addEventListeners(class_search_notice);
}

function updateList(data) {
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    const list = document.getElementById(`id_${data.target}_list`);

    if (data.total_items === 0) {
        let msg;

        if (data.target === "facility") {
            msg = "내가 신청한 예약이";
        } else if (data.target === "project") {
            msg = "내가 참여한 프로젝트가";
        } else if (data.target === "dflink") {
            msg = "내가 만든 동영링크가";
        } else if (data.target === "notice") {
            msg = "내가 작성한 공지사항이";
        };

        list.firstElementChild.innerText = `${msg} 없어요.`;

        return;
    };

    const listTitle = code(list, "_title");

    list.innerHTML = "";

    let targetInKorean;

    if (data.target === "facility") {
        targetInKorean = "예약내역";
    } else if (data.target === "project") {
        targetInKorean = "프로젝트";
    } else if (data.target === "dflink") {
        targetInKorean = "동영링크";
    } else if (data.target === "notice") {
        targetInKorean = "공지사항";
    };

    listTitle.innerText = `내 ${targetInKorean} ${data.total_items}개`;

    data.item_list.forEach(item => {
        const element = document.createElement("li");

        element.className = "relative flex flex-col justify-between px-4 py-5 hover:bg-gray-50 sm:px-6";

        let badgeColor;

        if (data.target === "facility") {
            let status;

            if (item.status === "Pending") {
                badgeColor = "text-blue-700 bg-blue-50 ring-blue-700/10";
                status = "대기 중";
            } else if (item.status === "Approved") {
                badgeColor = "text-green-700 bg-green-50 ring-green-600/20";
                status = "확정됨";
            } else if (item.status === "In Progress" && !item.is_after_end_datetime) {
                badgeColor = "text-yellow-700 bg-yellow-50 ring-yellow-600/20";
                status = "사용 중";
            } else if (item.status === "In Progress" && item.is_after_end_datetime) {
                badgeColor = "text-red-700 bg-red-50 ring-red-600/10";
                status = "종료 지연됨";
            } else if (item.status === "Completed") {
                badgeColor = "text-slate-700 bg-slate-50 ring-slate-600/20";
                status = "종료됨";
            } else if (item.status === "Canceled") {
                badgeColor = "text-pink-700 bg-pink-50 ring-pink-700/10";
                status = "취소됨";
            } else if (item.status === "Rejected") {
                badgeColor = "text-red-700 bg-red-50 ring-red-600/10";
                status = "반려됨";
            };

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.name -->
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                        <a href="${item.public_url}"
                            target="_blank"
                            class="rounded-md focus:df-focus-ring-offset-gray">
                            <span class="absolute inset-x-0 -top-px bottom-0"></span>
                            ${escapeHTML(item.name)}
                        </a>
                    </p>
                    <!-- facility.status -->
                    <p class="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}">
                        ${status}
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.start_datetime -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500">
                        <time datetime="${item.start_datetime}">${item.start_datetime} 시작</time>
                    </p>
                    <!-- facility.end_datetime(>sm) -->
                    <p class="hidden sm:flex sm:mt-1 sm:text-sm sm:leading-5 sm:text-gray-500">
                        <time datetime="${item.end_datetime}">${item.end_datetime} 종료</time>
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.end_datetime(<=sm) -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:invisible">
                        <time datetime="${item.end_datetime}">${item.end_datetime} 종료</time>
                    </p>
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:mt-1">
                        <span data-record-id="${item.record_id}"
                                data-name="${item.name}"
                                data-category="${item.category}"
                                data-project-id="${item.project_id}"
                                data-purpose-keyword="${item.purpose.keyword}"
                                data-duration="${item.duration}"
                                data-start-datetime="${item.start_datetime}"
                                data-end-datetime="${item.end_datetime}"
                                data-is-after-end-datetime="${item.is_after_end_datetime}"
                                data-public-url="${item.public_url}"
                                data-for-instructor="${item.is_for_instructor}"
                                data-status="${item.status}"
                                data-created-time="${item.created_time}"
                                data-approved-time="${item.approved_time}"
                                data-started-time="${item.started_time}"
                                data-completed-time="${item.completed_time}"
                                data-canceled-time="${item.canceled_time}"
                                data-rejected-time="${item.rejected_time}"
                                class="class-read-request relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                tabindex="0">상세 보기</span>
                    </p>
                </div>
            `;
        } else if (data.target === "project") {
            const directorName = item.director.length === 1 ? item.director[0].name : item.director.map(director => director.name).join(", ");
            const producerName = item.producer.length === 1 ? item.producer[0].name : item.producer.map(producer => producer.name).join(", ");

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <!-- project.name -->
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                        <span class="class-detail rounded-md focus:df-focus-ring-offset-gray">${escapeHTML(item.name)}</span>
                    </p>
                    <!-- project.purpose -->
                    <p class="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset text-slate-700 bg-slate-50 ring-slate-600/20">
                        ${item.purpose.keyword}
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- project.director & project.producer -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500">
                        연출&nbsp
                        <span class="font-semibold">
                            ${directorName}
                        </span>
                        &nbsp·&nbsp제작&nbsp
                        <span class="font-semibold">
                            ${producerName}
                        </span>
                    </p>
                    <!-- project.created_date(>sm) -->
                    <p class="hidden sm:flex sm:mt-1 sm:text-sm sm:leading-5 sm:text-gray-500">
                        <time datetime="${item.created_date}">${item.created_date}</time>
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- project.created_date(<=sm ) -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:invisible">
                        <time datetime="${item.created_date}">${item.created_date}</time>
                    </p>
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:mt-1">
                        <span data-pathname="/project/"
                                data-query="${item.project_id}"
                                class="class-search-project relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                tabindex="0">프로젝트 목록에서 찾기</span>
                    </p>
                </div>
            `;
        } else if (data.target === "dflink") {
            if (item.category === "작품") {
                badgeColor = "text-flamingo-800 bg-flamingo-50 ring-flamingo-600/20"
            } else if (item.category === "학과") {
                badgeColor = "text-yellow-700 bg-yellow-50 ring-yellow-600/20"
            };

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <!-- dflink.title -->
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                        <a href="https://dgufilm.link/${item.slug}"
                            target="_blank"
                            class="rounded-md focus:df-focus-ring-offset-gray">
                            <span class="absolute inset-x-0 -top-px bottom-0"></span>
                            ${item.title}
                        </a>
                    </p>
                    <!-- dflink.category -->
                    <p class="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}">
                        ${item.category}
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- dflink.slug -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500">
                        <span class="class-url relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                data-dflink-url="${item.dflink_url}"
                                tabindex="0">https://dgufilm.link/${item.slug}<span class="sr-only">&nbsp;URL&nbsp;복사하기</span></span>
                    </p>
                    <!-- dflink.expiration_date(>sm) -->
                    <p class="hidden sm:flex sm:mt-1 sm:text-sm sm:leading-5 sm:text-gray-500">
                        <time datetime="${item.expiration_date}">${item.expiration_date}</time>&nbsp만료
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- dflink.expiration_date(<=sm ) -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:invisible">
                        <time datetime="${item.expiration_date}">${item.expiration_date}</time>&nbsp만료
                    </p>
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:mt-1">
                        <span data-pathname="/dflink/"
                                data-query="${item.slug}"
                                class="class-search-dflink relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                tabindex="0">동영링크 목록에서 찾기</span>
                    </p>
                </div>
            `;
        } else if (data.target === "notice") {
            const isFileAttached = item.file.length > 0;
            let fileIcon = "";

            if (isFileAttached) {
                fileIcon = `
                    <svg xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4 text-gray-500"
                            aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    <span class="sr-only">첨부파일 있음</span>
                `;
            };

            if (item.category === "서비스") {
                badgeColor = "text-slate-700 bg-slate-50 ring-slate-600/20"
            } else if (item.category === "학과") {
                badgeColor = "text-yellow-700 bg-yellow-50 ring-yellow-600/20"
            };

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <div class="flex justify-start items-center gap-x-2">
                        <!-- notice.title -->
                        <p class="text-sm font-semibold leading-6 text-gray-900">
                            <a href="${location.origin}/notice/${item.notice_id}/"
                                class="rounded-md focus:df-focus-ring-offset-gray">
                                <span class="absolute inset-x-0 -top-px bottom-0"></span>
                                ${item.title}
                            </a>
                        </p>
                        <!-- notice.file -->
                        ${fileIcon}
                    </div>
                    <!-- notice.category -->
                    <p class="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}">
                        ${item.category}
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- notice.keyword -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500">${item.keyword}</p>
                    <!-- notice.listed_date(>sm) -->
                    <p class="hidden sm:flex sm:mt-1 sm:text-sm sm:leading-5 sm:text-gray-500">
                        <time datetime="${item.listed_date}">${item.listed_date}</time>
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- notice.listed_date(<=sm ) -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:invisible">
                        <time datetime="${item.listed_date}">${item.listed_date}</time>
                    </p>
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:mt-1">
                        <span data-pathname="/notice/"
                                data-query="${item.notice_id}"
                                class="class-search-notice relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                tabindex="0">공지사항 목록에서 찾기</span>
                    </p>
                </div>
            `;
        };

        list.appendChild(element);
    });

    if (data.target === "dflink") {
        class_urls = document.querySelectorAll(".class-url");
        copyDflinkUrl();
    };

    initModal();
    handleShortcut();
}

function updatePaginationControl(data) {
    if (data.total_pages === 1) return;

    const controlElement = document.getElementById(`id_${data.target}_pagination`);

    controlElement.classList.replace("hidden", "flex");

    const prev = controlElement.querySelector(".class-prev");
    const next = controlElement.querySelector(".class-next");

    if (data.has_previous) {
        prev.disabled = false;
        prev.onclick = () => requestGetPaginatedData(data.target, data.page_number - 1);
    } else {
        prev.disabled = true;
        prev.onclick = null;
    };

    if (data.has_next) {
        next.disabled = false;
        next.onclick = () => requestGetPaginatedData(data.target, data.page_number + 1);
    } else {
        next.disabled = true;
        next.onclick = null;
    };

    sessionStorage.setItem(`${data.target}_page`, data.page_number);
}

function requestGetPaginatedData(target, page) {
    request.url = `${location.origin}/account/utils/account/`;
    request.type = "GET";
    request.data = { id: "get_paginated_data", target: target, page: page };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function requestCreateVcodeForAccount() {
    request.url = `${location.origin}/account/utils/vcode/`;
    request.type = "POST";
    request.data = { id: "create_vcode_for_account", student_id: userStudentId, email: `${id_email.value}`, phone: `${id_phone.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestConfirmVcodeForAccount() {
    request.url = `${location.origin}/account/utils/vcode/`;
    request.type = "POST";
    request.data = { id: "confirm_vcode_for_account", student_id: userStudentId, email: `${id_email.value}`, phone: `${id_phone.value}`, email_vcode: `${id_email_vcode.value}`, phone_vcode: `${id_phone_vcode.value}` };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestDeleteUser() {
    request.url = `${location.origin}/account/utils/account/`;
    request.type = "GET";
    request.data = { id: "delete_user" };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestUpdateStatusToCanceled() {
    request.url = `${location.origin}/facility/utils/facility/`;
    request.type = "POST";
    request.data = { id: "update_status_to_canceled", recordId: id_record_id.value };
    request.async = true;
    request.headers = null;
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            loadPageState();
        } else {
            requestVerifyAuthentication();
            loadPageState();
        };

        executePrivacyMasking();
        initModal();

        if (id_modal !== null) {
            initValidation(class_firsts, id_send_vcode);

            id_send_vcode.addEventListener("click", () => {
                if (hasInfoChanged(inputs) && isItOkayToSubmitForm()) {
                    requestCreateVcodeForAccount();
                    displayButtonMsg(false, id_send_vcode, "descr");
                    displayButtonMsg(false, id_send_vcode, "error");
                    code(id_send_vcode, "_spin").classList.remove("hidden");
                } else if (!hasInfoChanged(inputs)) {
                    displayButtonMsg(true, id_send_vcode, "error", "변경된 회원정보가 없어요.");
                } else {
                    inputs.forEach((input) => {
                        controlError(input);
                    });
                };

                ["keydown", "focusin"].forEach((type) => {
                    inputs.forEach((input) => {
                        input.addEventListener(type, () => {
                            displayButtonMsg(false, id_send_vcode, "error");
                        });
                    });
                });
            });

            id_confirm_vcode.addEventListener("click", () => {
                if (isItOkayToSubmitForm()) {
                    requestConfirmVcodeForAccount();
                    displayButtonMsg(false, id_confirm_vcode, "error");
                    code(id_confirm_vcode, "_spin").classList.remove("hidden");
                } else {
                    inputs.forEach((input) => {
                        controlError(input);
                    });
                };

                ["keydown", "focusin"].forEach((type) => {
                    inputs.forEach((input) => {
                        input.addEventListener(type, () => {
                            displayButtonMsg(false, id_confirm_vcode, "error");
                        });
                    });
                });
            });

            const id_delete_user = document.getElementById("id_delete_user");

            id_delete_user.addEventListener("click", () => {
                if (!isDoubleChecked) {
                    class_double_checks.forEach(double_check => { double_check.hidden = false });
                    isDoubleChecked = true;

                    doubleCheckTimer = setTimeout(() => {
                        class_double_checks.forEach(double_check => { double_check.hidden = true });
                        isDoubleChecked = false;
                    }, 5000);
                } else if (isDoubleChecked) {
                    const id_delete_user_spin = code(id_delete_user, "_spin");

                    clearTimeout(doubleCheckTimer);
                    requestDeleteUser();
                    displayButtonMsg(true, id_delete_user, "descr", "잠시만 기다려주세요.");
                    id_delete_user_spin.classList.remove("hidden");
                    isDoubleChecked = false;
                };
            });

            ["click", "keyup"].forEach(type => {
                id_cancel_or_delete.addEventListener(type, event => {
                    const targetTagName = event.target.tagName;

                    if ((type === "click" && (targetTagName === "SPAN" || targetTagName === "BUTTON")) ||
                        (type === "keyup" && (event.key === "Enter" || event.key === " ") && targetTagName !== "BUTTON")) {
                        if (!isDoubleChecked) {
                            class_double_checks.forEach(double_check => { double_check.hidden = false });
                            isDoubleChecked = true;

                            doubleCheckTimer = setTimeout(() => {
                                class_double_checks.forEach(double_check => { double_check.hidden = true });
                                isDoubleChecked = false;
                            }, 5000);
                        } else if (isDoubleChecked) {
                            const id_cancel_or_delete_spin = code(id_cancel_or_delete, "_spin");

                            clearTimeout(doubleCheckTimer);
                            requestUpdateStatusToCanceled();
                            displayButtonMsg(true, id_cancel_or_delete, "descr", "잠시만 기다려주세요.");
                            id_cancel_or_delete_spin.classList.remove("hidden");
                            isDoubleChecked = false;
                        };
                    };
                });
            });
        };
    });
}

initRequest();