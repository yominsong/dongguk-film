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

//
// Main functions
//

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

    // const class_search_facility = document.querySelectorAll(".class-search-facility");
    const class_search_project = document.querySelectorAll(".class-search-project");
    const class_search_dflink = document.querySelectorAll(".class-search-dflink");
    const class_search_notice = document.querySelectorAll(".class-search-notice");

    // addEventListeners(class_search_facility);
    addEventListeners(class_search_project);
    addEventListeners(class_search_dflink);
    addEventListeners(class_search_notice);
}

function updateList(data) {
    const list = document.getElementById(`id_${data.target}_list`);

    if (data.total_items === 0) {
        let msg;

        if (data.target === "facility") {
            msg = "내가 사용한 시설이";
        } else if (data.target === "project") {
            msg = "내가 참여한 프로젝트가";
        } else if (data.target === "dflink") {
            msg = "내가 만든 동영링크가";
        } else if (data.target === "notice") {
            msg = "내가 작성한 공지사항이";
        };

        list.firstElementChild.innerText = `아직 ${msg} 없어요.`;
        
        return;
    };

    const listTitle = code(list, "_title");

    list.innerHTML = "";

    let targetInKorean;

    if (data.target === "facility") {
        targetInKorean = "시설사용";
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
            if (item.approval_status === "Pending") {
                badgeColor = "text-slate-700 bg-slate-50 ring-slate-600/20"
            } else if (item.approval_status === "Approved") {
                badgeColor = "text-green-700 bg-green-50 ring-green-600/20"
            } else if (item.approval_status === "Rejected") {
                badgeColor = "text-red-700 bg-red-50 ring-red-600/10"
            };

            let approvalStatus;

            if (item.approval_status === "Pending") {
                approvalStatus = "대기";
            } else if (item.approval_status === "Approved") {
                approvalStatus = "승인";
            } else if (item.approval_status === "Rejected") {
                approvalStatus = "반려";
            };

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.title -->
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                        <a href="https://docs.google.com/document/d/${item.public_application_id}"
                            target="_blank"
                            class="rounded-md focus:df-focus-ring-offset-gray">
                            <span class="absolute inset-x-0 -top-px bottom-0"></span>
                            ${item.title}
                        </a>
                    </p>
                    <!-- facility.approval_status -->
                    <p class="rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}">
                        ${approvalStatus}
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.category -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500">
                        <span class="class-url relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray">
                            ${item.category}
                        </span>
                    </p>
                    <!-- facility.start_datetime, facility.end_datetime(>sm) -->
                    <p class="hidden sm:flex sm:mt-1 sm:text-sm sm:leading-5 sm:text-gray-500">
                        <time datetime="${item.start_datetime}/${item.end_datetime}">${item.start_datetime} ~ ${item.end_datetime}</time>
                    </p>
                </div>
                <div class="flex justify-between items-center gap-x-2">
                    <!-- facility.start_datetime, facility.end_datetime(<=sm ) -->
                    <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:invisible">
                        <time datetime="${item.start_datetime}/${item.end_datetime}">${item.start_datetime} ~ ${item.end_datetime}</time>
                    </p>
                    <!-- <p class="mt-1 flex text-sm leading-5 text-gray-500 sm:mt-1">
                        <span data-pathname=""
                                data-query=""
                                class="class-search-dflink relative truncate cursor-pointer rounded-md hover:underline focus:df-focus-ring-offset-gray"
                                tabindex="0">시설사용 목록에서 찾기</span>
                    </p> -->
                </div>
            `;
        } else if (data.target === "project") {
            const directorName = item.director.length === 1 ? item.director[0].name : item.director.map(director => director.name).join(", ");
            const producerName = item.producer.length === 1 ? item.producer[0].name : item.producer.map(producer => producer.name).join(", ");

            element.innerHTML = `
                <div class="flex justify-between items-center gap-x-2">
                    <!-- project.title -->
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                        <span class="class-detail rounded-md focus:df-focus-ring-offset-gray">${item.title}</span>
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
                                data-query="${item.title}"
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

function requestVerifyAuthentication() {
    request.url = `${location.origin}/account/utils/verify-authentication/`;
    request.type = "GET";
    request.data = { id: "verify_authentication" };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
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

function initRequest() {
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            loadPageState();
        } else {
            requestVerifyAuthentication();
            loadPageState();
        };
    });
}

initRequest();