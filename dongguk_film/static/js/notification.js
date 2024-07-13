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
 * - `WIP`: Work In Progress
 * - `RLP`: Request Location Permission
 * - `RRL`: Request to Reload Location
 * - `CWF`: Complete Weather Fetch
 * - `RNP`: Request Notification Permission
 * - `WNU`: Welcome New User
 * - RENTAL_RESTRICTED
 * - RENTAL_PURPOSE_CHANGED
 * - RENTAL_PERIOD_CHANGED
 * - RENTAL_QUANTITY_LIMIT_EXCEEDED
 * - RENTAL_GROUP_LIMIT_EXCEEDED
 * - OUT_OF_STOCK
 * - EQUIPMENT_PARTIALLY_ADDED
 * - `RBG`: Recommend Web Browser for Google Login
 * - DFLINK_DOES_NOT_EXIST
 * - `NPN`: No Permission to create Notice
 * - `RYS`: Request YouTube Share Link
 * - REQUIRE_IMAGE_ALT_TEXT
 * - REQUIRE_IMAGE_DESCRIPTION_TEXT
 * - `SDI`: Suggest Description of Image
 * - EXTRACTING_TEXT_FROM_IMAGE_SUCCEEDED
 * - EXTRACTING_TEXT_FROM_IMAGE_FAILED
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

        let checkIcon = `
            <svg class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
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
        `;

        let imageIcon = `
            <svg class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        `;

        let exclamationIcon = `
            <svg class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        `;

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
                <path d="M3.035 1C2.446 1 2 1.54 2 2.098V10.5h1.5v-8h13v8H18V2.098C18 1.539 17.48 1 16.9 1H3.035Zm10.453 2.61a1.885 1.885 0 0 0-1.442.736 1.89 1.89 0 0 0 1.011 2.976 1.903 1.903 0 0 0 2.253-1.114 1.887 1.887 0 0 0-1.822-2.598ZM7.463 8.163a.611.611 0 0 0-.432.154L5.071 10.5h5.119L7.88 8.348a.628.628 0 0 0-.417-.185Zm6.236 1.059a.62.62 0 0 0-.42.164L12.07 10.5h2.969l-.92-1.113a.618.618 0 0 0-.42-.165ZM.91 11.5a.91.91 0 0 0-.91.912v6.877c0 .505.405.91.91.91h18.178a.91.91 0 0 0 .912-.91v-6.877a.908.908 0 0 0-.912-.912H.91ZM3.668 13h1.947l2.135 5.7H5.898l-.28-.946H3.601l-.278.945H1.516L3.668 13Zm4.947 0h1.801v4.3h2.7v1.4h-4.5V13h-.001Zm4.5 0h5.4v1.4h-1.798v4.3h-1.701v-4.3h-1.9V13h-.001Zm-8.517 1.457-.614 2.059h1.262l-.648-2.059Z">
                </path>
            </svg>
        `;

        // all
        if (notiType === "WIP") {
            notiIcon = infoIcon;
            notiTitle = "잠시만 기다려주세요.";
            notiContent = `${param} 작업이 완료될 때까지 잠시 기다려주세요.`;
        }

        // home
        else if (notiType === "RLP") {
            notiIcon = locationIcon;
            notiTitle = "지금 계신 지역의 날씨를 확인해보세요.";
            notiContent = "사용 중인 브라우저에서 위치 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        }
        
        else if (notiType === "RRL") {
            notiIcon = locationIcon;
            notiTitle = "혹시 위치 정보가 부정확한가요?";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 위치 정보를 다시 불러올 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'RRL'); id_get_weather.click()" onkeydown="if (event.key === 'Enter') { this.click() }">다시 불러오기<span aria-hidden="true"> →</span></span></div>`;
        }
        
        else if (notiType === "CWF") {
            notiIcon = locationIcon;
            notiTitle = "기상 정보를 마저 불러올 수 있어요.";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 기상 정보를 계속 불러올 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'CWF'); id_get_weather.click()" onkeydown="if (event.key === 'Enter') { this.click() }">계속 불러오기<span aria-hidden="true"> →</span></span></div>`;
        }
        
        else if (notiType === "RNP") {
            notiIcon = bellIcon;
            notiTitle = "디닷에프 푸시 알림을 받아보세요.";
            notiContent = "사용 중인 브라우저에서 알림 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        }
        
        else if (notiType === "WNU") {
            notiIcon = smileIcon;
            notiTitle = `반가워요, ${param}님! 🖐️`;
            notiContent = `디닷에프가 ${param}님의 학과 생활에 도움이 되어드릴게요!`;
        }

        // equipment
        else if (notiType === "RENTAL_RESTRICTED") {
            notiIcon = exclamationIcon;
            notiTitle = "해당 목적으로 대여할 수 없는 기자재예요.";
            notiContent = `${param.collectionName} 기자재는 ${param.purposeKeyword} 목적으로 대여할 수 없어요. 다른 기자재를 선택해주세요.`;
        }

        else if (notiType === "RENTAL_PURPOSE_CHANGED") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 목적이 변경된 것 같아요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'MPP'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "RENTAL_PERIOD_CHANGED") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 기간이 변경된 것 같아요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'MPD'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "RENTAL_GROUP_LIMIT_EXCEEDED") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 수량 한도를 초과했어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'EGL'); executeWhenGroupLimitIsExceeded()" onkeydown="if (event.key === 'Enter') { this.click() }">한도 확인하기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "RENTAL_QUANTITY_LIMIT_EXCEEDED") {
            notiIcon = exclamationIcon;
            notiTitle = "대여 수량 한도를 초과했어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'EQL'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "OUT_OF_STOCK") {
            notiIcon = exclamationIcon;
            notiTitle = "재고 수량을 모두 담았어요.";
            notiContent = param;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayNoti(false, 'OOS'); updateForm('view_cart')" onkeydown="if (event.key === 'Enter') { this.click() }">장바구니 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        else if (notiType === "EQUIPMENT_PARTIALLY_ADDED") {
            notiIcon = exclamationIcon;
            notiTitle = "재고 수량을 초과했어요.";
            notiContent = param;
        }

        else if (notiType === "APPLICATION_SUBMITTED") {
            notiIcon = checkIcon;
            notiTitle = "기자재 사용 신청이 완료되었어요.";
            notiContent = "운영진 검토 후 문자 메시지, 이메일로 예약 확정 여부를 알려드릴게요.";
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="window.open('${location.origin}/account/', '_self')">신청 내역 보기<span aria-hidden="true"> →</span></span></div>`;
        }

        // login
        else if (notiType === "RBG") {
            notiIcon = exclamationIcon;
            notiTitle = "Google로 로그인할 수 없어요.";
            notiContent = `${param} 인앱 브라우저에서는 Google로 로그인할 수 없어요. Chrome, Edge, Safari를 이용해주세요.`;
        }

        // dflink
        else if (notiType === "DFLINK_DOES_NOT_EXIST") {
            notiIcon = exclamationIcon;
            notiTitle = "존재하지 않는 동영링크예요.";
            notiContent = "주소가 잘못되었거나 삭제된 동영링크예요.";
        }

        // notice
        else if (notiType == "NPN") {
            notiIcon = exclamationIcon;
            notiTitle = "공지사항 작성 권한이 없어요.";
            notiContent = "공지사항은 운영진만 작성할 수 있어요.";
        }

        else if (notiType === "RYS") {
            notiIcon = infoIcon;
            notiTitle = "YouTube 공유 링크를 붙여넣어 보세요.";
            notiContent = "'youtu.be'로 시작하는 공유 링크를 붙여넣으면 자동으로 동영상이 삽입돼요.";
        }
        
        else if (notiType === "REQUIRE_IMAGE_ALT_TEXT") {
            notiIcon = imageIcon;
            notiTitle = "이미지 대체 텍스트를 입력해주세요.";
            notiContent = `이미지 선택 후 대체 텍스트 변경 버튼(${visualImpairmentIcon})을 눌러 입력할 수 있어요.`;
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="window.open('https://terms.naver.com/entry.naver?cid=42346&docId=3436471&categoryId=42346', '_blank')">대체 텍스트 알아보기<span aria-hidden="true"> →</span></span></div>`;
        }
        
        else if (notiType === "REQUIRE_IMAGE_DESCRIPTION_TEXT") {
            notiIcon = imageIcon;
            notiTitle = "내용에 텍스트를 포함해주세요.";
            notiContent = "만약 이미지에 텍스트가 포함되어 있다면 해당 내용을 입력해주세요.";
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayError(false, id_content); displayNoti(false, 'RDI'); requestOcrNotice()">텍스트 추출하기<span aria-hidden="true"> →</span></span></div>`;
        }
        
        else if (notiType === "SDI") {
            notiIcon = imageIcon;
            notiTitle = "이미지는 텍스트와 함께 사용해주세요.";
            notiContent = "만약 이미지에 텍스트가 포함되어 있다면 해당 내용을 입력해주세요.";
            notiAction = `<div class="mt-1"><span role="button" class="rounded-md text-sm font-bold text-flamingo-50 cursor-pointer hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#826F67] focus:ring-white" tabindex="0" onclick="displayError(false, id_content); displayNoti(false, 'SDI'); requestOcrNotice()">텍스트 추출하기<span aria-hidden="true"> →</span></span></div>`;
        }
        
        else if (notiType === "EXTRACTING_TEXT_FROM_IMAGE_SUCCEEDED") {
            notiIcon = textIcon;
            notiTitle = "텍스트 추출이 완료되었어요.";
            notiContent = "부정확한 결과가 포함되어 있을 수 있으니 유의해주세요.";
        }
        
        else if (notiType === "EXTRACTING_TEXT_FROM_IMAGE_FAILED") {
            notiIcon = exclamationIcon;
            notiTitle = "텍스트 추출에 실패했어요.";
            notiContent = "이미지를 직접 내려받아 삽입한 후 다시 시도해주세요.";
        }
        
        else if (notiType === "LDF") {
            notiIcon = infoIcon;
            notiTitle = "이미 첨부된 파일이 있어요.";
            notiContent = `'${param}' 파일이 이미 첨부되어 있어요. 첨부 파일 목록을 확인해주세요.`;
        }
        
        else if (notiType === "LFS") {
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