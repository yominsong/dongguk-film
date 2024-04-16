//
// Sub functions
//

function editXDate(notiType, bool) {
    let xData = JSON.parse(id_noti_head.getAttribute("x-data").replace(/(\b\w+\b):/g, '"$1":'));

    xData[String(notiType)] = bool;
    xData = JSON.stringify(xData).replace(/"(\b\w+\b)":/g, '$1:');
    id_noti_head.setAttribute("x-data", xData);
}

//
// Main functions
//

/**
 * @param {boolean} bool Show/hide the notification
 * @param {string} notiType Notification type
 * - `RLP`: Request Location Permission
 * - `RRL`: Request to Reload Location
 * - `CWF`: Complete Weather Fetch
 * - `RNP`: Request Notification Permission
 * - `WNU`: Welcome New User
 * - `RTL`: Redirect to the List
 * - `MPP`: Mismatched PurPose
 * - `MPD`: Missmatched PerioD
 * - `EQL`: Exceed rental Quantity Limit
 * - `OOS`: Out Of Stock
 * - `PTA`: PaTially Added
 * - `RBG`: Recommend Web Browser for Google Login
 * - `INL`: Inform Nonexistent Link
 * - `RYS`: Request YouTube Share Link
 * - `RAT`: Request Alternative Text
 * - `RDI`: Request Description of Image
 * - `SDI`: Suggest Description of Image
 * - `EIS`: Extracting text from an Image Succeeded
 * - `EIF`: Extracting text from an Image Failed
 * - `LDF`: Limit Duplicate Files
 * - `LFS`: Limit File Size
 * - `NUC`: Notify Under Construction
 * @param {null} param Additional information to add to the notification
 */
function displayNoti(bool, notiType, param = null) {
    if (bool === true) {
        editXDate(notiType, false);

        let notiIcon, notiTitle, notiContent, notiFormat;
        let notiAction = "";

        // title icon
        let infoIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        `;
        let locationIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        `;
        let bellIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        `;
        let smileIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
        `;
        let textIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
        `
        let imageIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        `
        let exclamationIcon = `
        <svg class="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        `
        let clipboardIcon = `
        <svg class="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
        `;

        // inline icon
        let refreshIconInline = `
        <svg class="w-4 h-4 inline align-base"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        `;
        let visualImpairmentIcon = `
        <svg class="w-4 h-4 inline align-base"
            fill="currentColor"
            viewBox="0 0 20 20">
            <path d="M5.085 6.22 2.943 4.078a.75.75 0 1 1 1.06-1.06l2.592 2.59A11.094 11.094 0 0 1 10 5.068c4.738 0 8.578 3.101 8.578 5.083 0 1.197-1.401 2.803-3.555 3.887l1.714 1.713a.75.75 0 0 1-.09 1.138.488.488 0 0 1-.15.084.75.75 0 0 1-.821-.16L6.17 7.304c-.258.11-.51.233-.757.365l6.239 6.24-.006.005.78.78c-.388.094-.78.166-1.174.215l-1.11-1.11h.011L4.55 8.197a7.2 7.2 0 0 0-.665.514l-.112.098 4.897 4.897-.005.006 1.276 1.276a10.164 10.164 0 0 1-1.477-.117l-.479-.479-.009.009-4.863-4.863-.022.031a2.563 2.563 0 0 0-.124.2c-.043.077-.08.158-.108.241a.534.534 0 0 0-.028.133.29.29 0 0 0 .008.072.927.927 0 0 0 .082.226c.067.133.145.26.234.379l3.242 3.365.025.01.59.623c-3.265-.918-5.59-3.155-5.59-4.668 0-1.194 1.448-2.838 3.663-3.93zm7.07.531a4.632 4.632 0 0 1 1.108 5.992l.345.344.046-.018a9.313 9.313 0 0 0 2-1.112c.256-.187.5-.392.727-.613.137-.134.27-.277.392-.431.072-.091.141-.185.203-.286.057-.093.107-.19.148-.292a.72.72 0 0 0 .036-.12.29.29 0 0 0 .008-.072.492.492 0 0 0-.028-.133.999.999 0 0 0-.036-.096 2.165 2.165 0 0 0-.071-.145 2.917 2.917 0 0 0-.125-.2 3.592 3.592 0 0 0-.263-.335 5.444 5.444 0 0 0-.53-.523 7.955 7.955 0 0 0-1.054-.768 9.766 9.766 0 0 0-1.879-.891c-.337-.118-.68-.219-1.027-.301zm-2.85.21-.069.002a.508.508 0 0 0-.254.097.496.496 0 0 0-.104.679.498.498 0 0 0 .326.199l.045.005c.091.003.181.003.272.012a2.45 2.45 0 0 1 2.017 1.513c.024.061.043.125.069.185a.494.494 0 0 0 .45.287h.008a.496.496 0 0 0 .35-.158.482.482 0 0 0 .13-.335.638.638 0 0 0-.048-.219 3.379 3.379 0 0 0-.36-.723 3.438 3.438 0 0 0-2.791-1.543l-.028-.001h-.013z">
            </path>
        </svg>
        `;

        // home
        if (notiType === "RLP") {
            notiIcon = locationIcon;
            notiTitle = "지금 계신 지역의 날씨를 확인해보세요.";
            notiContent = "사용 중인 브라우저에서 위치 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType === "RRL") {
            notiIcon = locationIcon;
            notiTitle = "혹시 위치 정보가 부정확한가요?";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 위치 정보를 다시 불러올 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'RRL'); id_get_weather.click()" onkeydown="if (event.key === 'Enter') { this.click() }">다시 불러오기<span aria-hidden="true"> →</span></span></div>`;
        } else if (notiType === "CWF") {
            notiIcon = locationIcon;
            notiTitle = "기상 정보를 마저 불러올 수 있어요.";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 기상 정보를 계속 불러올 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'CWF'); id_get_weather.click()" onkeydown="if (event.key === 'Enter') { this.click() }">계속 불러오기<span aria-hidden="true"> →</span></span></div>`;
        } else if (notiType === "RNP") {
            notiIcon = bellIcon;
            notiTitle = "디닷에프 푸시 알림을 받아보세요.";
            notiContent = "사용 중인 브라우저에서 알림 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType === "WNU") {
            notiIcon = smileIcon;
            notiTitle = `반가워요, ${param}님! 🖐️`;
            notiContent = `디닷에프가 ${param}님의 학과 생활에 도움이 되어드릴게요!`;
        }

        // equipment
        else if (notiType === "RTL") {
            notiIcon = exclamationIcon;
            notiTitle = "해당 목적으로 대여할 수 없는 기자재예요.";
            notiContent = `${param.collectionName} 기자재는 ${param.purposeKeyword} 목적으로 대여할 수 없어요. 다른 기자재를 선택해주세요.`;
        }

        else if (notiType === "MPP") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 목적이 변경된 것 같아요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'MPP'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "MPD") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 기간이 변경된 것 같아요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'MPD'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "EQL") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 수량 한도를 초과했어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'EQL'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "OOS") {
            notiIcon = exclamationIcon;
            notiTitle = "재고 수량이 모두 담겼어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'OOS'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "PTA") {
            notiIcon = exclamationIcon;
            notiTitle = "재고 수량을 초과했어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'PTA'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        // login
        else if (notiType === "RBG") {
            notiIcon = exclamationIcon;
            notiTitle = "Google로 로그인할 수 없어요.";
            notiContent = `${param} 인앱 브라우저에서는 Google로 로그인할 수 없어요. Chrome, Edge, Safari를 이용해주세요.`;
        }

        // dflink
        else if (notiType === "INL") {
            notiIcon = exclamationIcon;
            notiTitle = "존재하지 않는 동영링크예요.";
            notiContent = "주소가 잘못되었거나 삭제된 동영링크예요.";
        }

        // notice
        else if (notiType === "RYS") {
            notiIcon = infoIcon;
            notiTitle = "YouTube 공유 링크를 붙여넣어 보세요.";
            notiContent = "'youtu.be'로 시작하는 공유 링크를 붙여넣으면 자동으로 동영상이 삽입돼요.";
        } else if (notiType === "RAT") {
            notiIcon = imageIcon;
            notiTitle = "이미지 대체 텍스트를 입력해주세요.";
            notiContent = `이미지 선택 후 대체 텍스트 변경 버튼(${visualImpairmentIcon})을 눌러 입력할 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="window.open('https://terms.naver.com/entry.naver?cid=42346&docId=3436471&categoryId=42346', '_blank')">대체 텍스트 알아보기<span aria-hidden="true"> →</span></span></div>`;
        } else if (notiType === "RDI") {
            notiIcon = imageIcon;
            notiTitle = "내용에 텍스트를 포함해주세요.";
            notiContent = "만약 이미지에 텍스트가 포함되어 있다면 해당 내용을 입력해주세요.";
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayError(false, id_content); displayNoti(false, 'RDI'); requestOcrNotice()">텍스트 추출하기<span aria-hidden="true"> →</span></span></div>`;
        } else if (notiType === "SDI") {
            notiIcon = imageIcon;
            notiTitle = "이미지는 텍스트와 함께 사용해주세요.";
            notiContent = "만약 이미지에 텍스트가 포함되어 있다면 해당 내용을 입력해주세요.";
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayError(false, id_content); displayNoti(false, 'RDI'); requestOcrNotice()">텍스트 추출하기<span aria-hidden="true"> →</span></span></div>`;
        } else if (notiType === "EIS") {
            notiIcon = textIcon;
            notiTitle = "텍스트 추출이 완료되었어요.";
            notiContent = "부정확한 결과가 포함되어 있을 수 있으니 유의해주세요.";
        } else if (notiType === "EIF") {
            notiIcon = exclamationIcon;
            notiTitle = "텍스트 추출에 실패했어요.";
            notiContent = "이미지를 직접 내려받아 삽입한 후 다시 시도해주세요.";
        } else if (notiType === "LDF") {
            notiIcon = infoIcon;
            notiTitle = "이미 첨부된 파일이 있어요.";
            notiContent = `'${param}' 파일이 이미 첨부되어 있어요. 첨부 파일 목록을 확인해주세요.`;
        } else if (notiType === "LFS") {
            notiIcon = exclamationIcon;
            notiTitle = "파일은 총합 5MB까지 첨부할 수 있어요.";
            notiContent = `${param}개의 파일이 용량 제한으로 첨부되지 않았어요.`;
        }

        // everywhere
        else if (notiType === "NUC") {
            notiIcon = infoIcon;
            notiTitle = "아직 준비 중인 기능이에요.";
            notiContent = `언젠가 출시될 거예요! ${param}`;
        };

        notiFormat = `
        <div x-show="${notiType}"
            x-transition:enter="transform ease-out duration-300 transition"
            x-transition:enter-start="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            x-transition:enter-end="translate-y-0 opacity-100 sm:translate-x-0"
            x-transition:leave="transition ease-in duration-100"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="mt-4 backdrop-blur-sm bg-flamingo-900/60 pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 sm:mt-0 sm:mb-4"
            id="id_${notiType}">
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${notiIcon}
                    </div>
                    <div class="ml-3 w-0 flex-1 pt-0.5">
                        <p class="text-sm font-medium text-white">${notiTitle}</p>
                        <p class="mt-1 text-sm text-flamingo-50">${notiContent}</p>
                        ${notiAction}
                    </div>
                    <div class="ml-4 flex flex-shrink-0">
                        <button type="button"
                                @click="${notiType} = false; setTimeout(() => { let body = document.querySelector('#id_${notiType}'); if (body != null) {body.remove()} }, 150)"
                                class="inline-flex rounded-md text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white">
                            <span class="sr-only">알림 닫기</span>
                            <svg class="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        if (!id_noti_body.innerHTML.includes(notiType)) {
            id_noti_body.innerHTML = `${id_noti_body.innerHTML}\n${notiFormat}\n`;
        };

        setTimeout(() => { editXDate(notiType, true) }, 100);
    }

    else if (bool === false) {
        let body = document.querySelector(`#id_${notiType}`);

        if (body != null) {
            editXDate(notiType, false);
            setTimeout(() => { body.remove() }, 150);
        };
    };

}