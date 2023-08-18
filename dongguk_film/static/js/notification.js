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
 * - `RBG`: Recommend Web Browser for Google Login
 * - `INL`: Inform Nonexistent Link
 * - `RSL`: Request YouTube Share Link
 * - `NUC`: Notify Under Construction
 * @param {string|null} param Additional information to add to the notification
 */
function displayNoti(bool, notiType, param = null) {
    if (bool == true) {
        editXDate(notiType, false);

        let notiIcon, notiTitle, notiContent, notiFormat;
        let infoIcon = `
        <svg class="h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
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
            xmlns="http://www.w3.org/2000/svg"
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
            xmlns="http://www.w3.org/2000/svg"
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
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
        `;
        let clipboardIcon = `
        <svg class="w-6 h-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
        `;

        let refreshIconInline = `
        <svg xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 inline align-base"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        `;

        // home
        if (notiType == "RLP") {
            notiIcon = locationIcon;
            notiTitle = "지금 계신 지역의 날씨를 확인해보세요.";
            notiContent = "사용 중인 브라우저에서 위치 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "RRL") {
            notiIcon = locationIcon;
            notiTitle = "혹시 위치 정보가 부정확한가요?";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 위치 정보를 다시 불러올 수 있어요.`;
        } else if (notiType == "CWF") {
            notiIcon = locationIcon;
            notiTitle = "날씨를 마저 불러올 수 있어요.";
            notiContent = `날씨 새로고침 버튼(${refreshIconInline})을 눌러 기상 정보를 계속 불러올 수 있어요.`;
        } else if (notiType == "RNP") {
            notiIcon = bellIcon;
            notiTitle = "디닷에프 푸시 알림을 받아보세요.";
            notiContent = "사용 중인 브라우저에서 알림 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "WNU") {
            notiIcon = smileIcon;
            notiTitle = `반가워요, ${param}님! 🖐️`;
            notiContent = `디닷에프가 ${param}님의 학과 생활에 도움이 되어드릴게요!`;
        }

        // login
        else if (notiType == "RBG") {
            notiIcon = infoIcon;
            notiTitle = "Google로 로그인할 수 없어요.";
            notiContent = `${param} 인앱 브라우저에서는 Google로 로그인할 수 없어요. Chrome, Edge, Safari를 이용해주세요.`;
        }

        // dflink
        else if (notiType == "INL") {
            notiIcon = infoIcon;
            notiTitle = "존재하지 않는 동영링크예요.";
            notiContent = "주소가 잘못되었거나 삭제된 동영링크예요.";
        }

        // notice
        else if (notiType == "RSL") {
            notiIcon = infoIcon;
            notiTitle = "YouTube 공유 링크를 붙여넣어 보세요.";
            notiContent = "YouTube에서 '공유' 버튼을 클릭해 링크를 복사하세요. 그리고 이곳에 붙여넣으면 자동으로 동영상이 삽입돼요.";
        }

        // everywhere
        else if (notiType == "NUC") {
            notiIcon = infoIcon;
            notiTitle = "아직 준비 중인 기능이에요."
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

    else if (bool == false) {
        let body = document.querySelector(`#id_${notiType}`);

        if (body != null) {
            editXDate(notiType, false);
            setTimeout(() => { body.remove() }, 150);
        };
    };

}