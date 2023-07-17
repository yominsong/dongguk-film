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
    newValue = String(newValue);
    if (oldValue !== newValue && !newValue.includes("-")) {
        return newValue;
    };
    return oldValue;
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
    let notified = false;

    if (resID == "weather") {
        // requestWeather()
        pulseOn.forEach((item) => {
            item.classList.add("hidden");
        });
        pulseOff.forEach((item) => {
            item.classList.remove("hidden");
        });
        localStorage.setItem("weatherCachedAt", new Date().toString());
        if (localStorage.getItem("cachedWeather") !== null) {
            let cachedWeather = JSON.parse(localStorage.getItem("cachedWeather"));
            for (let key in cachedWeather) {
                if ((!/\d+/.test(cachedWeather[key]) && cachedWeather[key].includes("-")) ||
                    (((!/\d+/.test(resResult[key]) && !resResult[key].includes("-")) && cachedWeather[key] !== resResult[key])) ||
                    (/\d+/.test(resResult[key]) && cachedWeather[key] !== resResult[key])) {
                    cachedWeather[key] = resResult[key];
                    let obj = document.getElementById(`id_${key}`);
                    obj.innerText = writeWeather(obj.innerText, resResult[key]);
                    obj.classList.add("blink");
                    setTimeout(() => { obj.classList.remove("blink") }, 3000);
                } else {
                    if (!notified) {
                        alertRefreshWeather();
                        notified = true;
                    };
                };
            };
            localStorage.setItem("cachedWeather", JSON.stringify(cachedWeather));
        } else {
            for (let key in resResult) {
                let obj = document.getElementById(`id_${key}`);
                obj.innerText = writeWeather(obj.innerText, resResult[key]);
            };
            localStorage.setItem("cachedWeather", JSON.stringify(resResult));
        };
        // id_address.innerText = writeWeather(id_address.innerText, resResult.address);
        // id_temperature.innerText = writeWeather(id_temperature.innerText, resResult.temperature);
        // id_temperatureMax.innerText = writeWeather(id_temperatureMax.innerText, resResult.temperatureMax);
        // id_temperatureMin.innerText = writeWeather(id_temperatureMin.innerText, resResult.temperatureMin);
        // id_precipitationProbability.innerText = writeWeather(id_precipitationProbability.innerText, resResult.precipitationProbability);
        // id_precipitationType.innerText = writeWeather(id_precipitationType.innerText, resResult.precipitationType);
        // id_windSpeed.innerText = writeWeather(id_windSpeed.innerText, resResult.windSpeed);
        // id_windName.innerText = writeWeather(id_windName.innerText, resResult.windName);
        // id_skyState.innerText = writeWeather(id_skyState.innerText, resResult.skyState);
        // id_sunrise.innerText = writeWeather(id_sunrise.innerText, resResult.sunrise);
        // id_sunset.innerText = writeWeather(id_sunset.innerText, resResult.sunset);
        // id_accuracy.innerText = writeWeather(id_accuracy.innerText, resResult.accuracy);
        // id_baseDateTime.innerText = writeWeather(id_baseDateTime.innerText, resResult.baseDateTime);
        id_get_weather.classList.remove("animate-spin");
        id_get_weather.classList.remove("cursor-not-allowed");
        id_get_weather.classList.add("cursor-pointer");

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

function controlNoti(notiType, params = null) {
    // Write noti
    function writeNoti() {
        notiIconDefault.classList.add("hidden");
        notiIconSmile.classList.add("hidden");
        notiIconLocation.classList.add("hidden");
        notiIconClipboard.classList.add("hidden");
        notiTitle.innerText = null;
        notiContent.innerText = null;
        if (notiType == "blockInAppBrowser") {
            notiIconDefault.classList.remove("hidden");
            notiTitle.innerText = "Google로 로그인이 잠겼어요. 😢";
            notiContent.innerText = `${params} 인앱 브라우저에서는 Google로 로그인이 불가해요. Chrome이나 Safari를 이용해주세요.`;
        } else if (notiType == "requestPushPermission") {
            notiIconBell.classList.remove("hidden");
            notiTitle.innerText = "푸시 알림을 받아보세요.";
            notiContent.innerText = "사용 중인 브라우저에서 알림 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "welcomeNewUser") {
            notiIconSmile.classList.remove("hidden");
            notiTitle.innerText = "디닷에프 가입을 환영해요! 🎉";
            notiContent.innerText = `시설이용, 프로덕션, 동영링크 등 ${params}님을 위한 다양한 서비스를 이용해보세요!`;
        } else if (notiType == "requestLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "지금 계신 지역의 기상정보를 받아보세요.";
            notiContent.innerText = "사용 중인 브라우저에서 위치 권한을 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "recheckLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "혹시 기상정보가 부정확한가요?";
            notiContent.innerText = "잠시 문제가 생긴 것 같아요. 새로고침으로 기상정보를 다시 불러올 수 있어요.";
        } else if (notiType == "refreshWeather") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "기상정보를 마저 불러올 수 있어요.";
            notiContent.innerText = "새로고침 버튼을 눌러 기상정보를 계속 불러올 수 있어요.";
        } else if (notiType == "nonExistentDflink") {
            notiIconDefault.classList.remove("hidden");
            notiTitle.innerText = "존재하지 않는 동영링크예요.";
            notiContent.innerText = "주소가 잘못되었거나 삭제된 동영링크 같아요.";
        };
    }

    // Show noti
    function showNoti() {
        noti.setAttribute("x-data", "{ show: true }");
    };

    // Hide noti
    function hideNoti() {
        noti.setAttribute("x-data", "{ show: false }");
    };

    // Master noti
    function masterNoti() {
        const notiAttr = noti.getAttribute("x-data");
        if (notiAttr == "{ show: true }") {
            hideNoti();
            setTimeout(() => { writeNoti() }, 100);
            setTimeout(() => { showNoti() }, 200);
        } else {
            writeNoti();
            showNoti();
        };
    };

    let time2000 = ["requestLocationAccess", "recheckLocationAccess"];
    let time1000 = ["welcomeNewUser", "nonExistentDflink"];

    if (time2000.indexOf(notiType) !== -1) {
        setTimeout(() => { masterNoti() }, 2000);
    } else if (time1000.indexOf(notiType) !== -1) {
        setTimeout(() => { masterNoti() }, 1000);
    } else { masterNoti() };
}