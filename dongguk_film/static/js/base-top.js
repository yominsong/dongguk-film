//
// Global constants and variables
//

const originLocation = window.location.origin;
let request = {}; // for `makeAjaxCall()` function

//
// Sub functions
//

function inheritObject() {
    /* 
    * String/Number.getLastNumInKor(): Return the last letter in Hangul
    * Number.toTwoDigits(): Pad with zero to make a two digit number | type: string
    * Date.getKorDay(): Return the day of the week of a date
    */

    [String, Number].forEach((object) => {
        object.prototype.getLastNumInKor = function getLastNumInKor() {
            let lastNum = Number(String(this).slice(-1));
            let lastNumInKor;
            lastNum == 0 ? lastNumInKor = "공" : lastNum == 1 ? lastNumInKor = "일" : lastNum == 2 ? lastNumInKor = "이" : lastNum == 3 ? lastNumInKor = "삼" : lastNum == 4 ? lastNumInKor = "사" : lastNum == 5 ? lastNumInKor = "오" : lastNum == 6 ? lastNumInKor = "육" : lastNum == 7 ? lastNumInKor = "칠" : lastNum == 8 ? lastNumInKor = "팔" : lastNum == 9 ? lastNumInKor = "구" : null;
            return lastNumInKor;
        };
    });

    Number.prototype.toTwoDigits = function toTwoDigits() {
        return String(this).padStart(2, "0");
    };

    Date.prototype.getKorDay = function getKorDay() {
        let dayNum = this.getDay();
        let korDay;
        dayNum == 0 ? korDay = "일" : dayNum == 1 ? korDay = "월" : dayNum == 2 ? korDay = "화" : dayNum == 3 ? korDay = "수" : dayNum == 4 ? korDay = "목" : dayNum == 5 ? korDay = "금" : null;
        return korDay;
    };
}

inheritObject();

function writeWeather(oldValue, newValue) {
    let result;

    if (((!/\d+/.test(oldValue) && oldValue.includes("-")) ||
        (!/\d+/.test(newValue) && !newValue.includes("-")) ||
        (/\d+/.test(newValue))) &&
        oldValue !== newValue) {
        result = newValue;
    } else {
        result = oldValue;
    }

    return result;
}

//
// Main functions
//

function makeAjaxCall(request) {
    const csrftoken = getCookie("csrftoken");

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            let cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                };
            };
        };
        return cookieValue;
    }

    function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajax({
        url: request.url,
        type: request.type,
        data: request.data,
        async: request.async,
        headers: request.headers,
        beforeSend: (xhr, settings) => {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            };
        }
    }).done((response) => {
        console.log(response.result);
        handleAjaxCallback(response);
    }).fail((errorThrown, status) => {
        console.log(`${errorThrown.status} ${errorThrown.statusText}\n${status}`);
    });
}

function handleAjaxCallback(response) {
    let resID = response.id
    let resResult = response.result;

    if (resID == "weather") {
        // requestWeather()
        let notified = false;

        pulseOn.forEach((item) => {
            item.classList.add("hidden");
        });
        pulseOff.forEach((item) => {
            item.classList.remove("hidden");
        });

        sessionStorage.setItem("weatherCachedAt", new Date().toString());
        if (sessionStorage.getItem("cachedWeather") !== null) {
            let cachedWeather = JSON.parse(sessionStorage.getItem("cachedWeather"));
            for (let key in cachedWeather) {
                if (((!/\d+/.test(cachedWeather[key]) && cachedWeather[key].includes("-")) ||
                    (!/\d+/.test(resResult[key]) && !resResult[key].includes("-")) ||
                    (/\d+/.test(resResult[key]))) &&
                    cachedWeather[key] !== resResult[key]) {
                    cachedWeather[key] = resResult[key];
                    let obj = document.getElementById(`id_${key}`);
                    obj.classList.add("blink");
                    setTimeout(() => { obj.classList.remove("blink") }, 3000);
                };
            };
            sessionStorage.setItem("cachedWeather", JSON.stringify(cachedWeather));
        } else {
            sessionStorage.setItem("cachedWeather", JSON.stringify(resResult));
        };

        for (let key in resResult) {
            let obj = document.getElementById(`id_${key}`);
            obj.innerText = writeWeather(obj.innerText, resResult[key]);
            if ((!/\d+/.test(obj.innerText) && obj.innerText.includes("-")) && !notified) {
                alertRefreshWeather();
                notified = true;
            };
        };

        id_get_weather.classList.remove("animate-spin");
        id_get_weather.classList.remove("cursor-not-allowed");
        id_get_weather.classList.remove("hover:cursor-not-allowed");
        id_get_weather.classList.add("cursor-pointer");
        id_get_weather.classList.add("hover:cursor-pointer");

    } else if (resID == "create_vcode_for_SNP") {
        // requestCreateVcodeForSNP()
        if (resResult.status == "DONE") {
            displayButtonMsg(true, id_create_vcode, "descr", resResult.msg);
            displayButtonMsg(false, id_create_vcode, "error");
            stepOnes.forEach((input) => {
                input.type == "checkbox" ? input.disabled = true : input.readOnly = true;
            });
            stepTwos.forEach((input) => {
                input.disabled = false;
            });
            id_confirm_vcode.disabled = false;
            initValidation(stepTwos, id_confirm_vcode);
        } else if (resResult.status == "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_create_vcode, "error", resResult.msg);
            displayButtonMsg(false, id_create_vcode, "descr");
            id_create_vcode.disabled = false;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (resID == "confirm_vcode_for_SNP") {
        // requestConfirmVcodeForSNP()
        if (resResult.status == "DONE") {
            displayButtonMsg(true, id_confirm_vcode, "descr", resResult.msg);
            displayButtonMsg(false, id_confirm_vcode, "error");
            inputs = document.querySelectorAll("input");
            inputs.forEach((input) => {
                input.disabled = false;
                input.readOnly = true;
            });
            id_confirm_vcode.disabled = true;
            document.querySelector("form").submit();
        } else if (resResult.status == "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_confirm_vcode, "error", resResult.msg);
            id_confirm_vcode.disabled = false;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (resID == "create_dflink") {
        // requestCreateDflink()
        if (resResult.status == "DONE") {
            displayButtonMsg(true, id_create_or_update_dflink, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (resResult.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update_dflink, "descr");
            displayButtonMsg(true, id_create_or_update_dflink, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (resID == "update_dflink") {
        // requestUpdateDflink()
        if (resResult.status == "DONE") {
            displayButtonMsg(true, id_create_or_update_dflink, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (resResult.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update_dflink, "descr");
            displayButtonMsg(true, id_create_or_update_dflink, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (resID == "delete_dflink") {
        // requestDeleteDflink()
        if (resResult.status == "DONE") {
            displayButtonMsg(true, id_delete_dflink, "descr", resResult.msg);
            displayButtonMsg(false, id_delete_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (resResult.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            displayButtonMsg(false, id_delete_dflink, "descr");
            displayButtonMsg(true, id_delete_dflink, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    };
}

function controlNoti(notiType, param = null) {

    function editXDate(bool) {
        let xData = JSON.parse(id_noti_head.getAttribute("x-data").replace(/(\b\w+\b):/g, '"$1":'));

        xData[String(notiType)] = bool;
        xData = JSON.stringify(xData).replace(/"(\b\w+\b)":/g, '$1:');
        id_noti_head.setAttribute("x-data", xData);
    }

    editXDate(false);

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

    if (notiType == "blockInAppBrowser") {
        notiIcon = infoIcon;
        notiTitle = "Google로 로그인이 잠겼어요. 😢";
        notiContent = `${param} 인앱 브라우저에서는 Google로 로그인이 불가해요. Chrome이나 Safari를 이용해주세요.`;
    } else if (notiType == "requestPushPermission") {
        notiIcon = bellIcon;
        notiTitle = "디닷에프 푸시 알림을 받아보세요.";
        notiContent = "사용 중인 브라우저에서 알림 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
    } else if (notiType == "welcomeNewUser") {
        notiIcon = smileIcon;
        notiTitle = "디닷에프 가입을 환영해요! 🎉";
        notiContent = `시설이용, 프로덕션, 동영링크 등 ${param}님을 위한 다양한 서비스를 이용해보세요!`;
    } else if (notiType == "requestLocationAccess") {
        notiIcon = locationIcon;
        notiTitle = "지금 계신 지역의 기상정보를 받아보세요.";
        notiContent = "사용 중인 브라우저에서 위치 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
    } else if (notiType == "recheckLocationAccess") {
        notiIcon = locationIcon;
        notiTitle = "혹시 위치정보가 부정확한가요?";
        notiContent = "잠시 문제가 생긴 것 같아요. 새로고침으로 위치정보를 다시 불러올 수 있어요.";
    } else if (notiType == "refreshWeather") {
        notiIcon = locationIcon;
        notiTitle = "기상정보를 마저 불러올 수 있어요.";
        notiContent = "불러오기 버튼을 눌러 기상정보를 계속 불러올 수 있어요.";
    } else if (notiType == "nonExistentDflink") {
        notiIcon = infoIcon;
        notiTitle = "존재하지 않는 동영링크예요.";
        notiContent = "주소가 잘못되었거나 삭제된 동영링크 같아요.";
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
                            class="inline-flex rounded-md text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-flamingo-500 focus:ring-offset-2">
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

    setTimeout(() => { editXDate(true) }, 100);
}