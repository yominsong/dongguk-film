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
    if (response.id == "weather") {
        // requestWeather()
        let pulseOn = document.querySelectorAll(".pulse-on");
        let pulseOff = document.querySelectorAll(".pulse-off");
        pulseOn.forEach((item) => {
            item.classList.add("hidden");
        });
        pulseOff.forEach((item) => {
            item.classList.remove("hidden");
        });
        id_address.innerText = response.result.address;
        id_temperature.innerText = response.result.temperature;
        id_temperatureMax.innerText = response.result.temperatureMax;
        id_temperatureMin.innerText = response.result.temperatureMin;
        id_precipitationProbability.innerText = response.result.precipitationProbability;
        id_precipitationType.innerText = response.result.precipitationType;
        id_windSpeed.innerText = response.result.windSpeed;
        id_windName.innerText = response.result.windName;
        id_skyState.innerText = response.result.skyState;
        id_sunrise.innerText = response.result.sunrise;
        id_sunset.innerText = response.result.sunset;
        id_accuracy.innerText = response.result.accuracy;
        id_baseDateTime.innerText = response.result.baseDateTime;

    } else if (response.id == "create_vcode_for_SNP") {
        // requestCreateVcodeForSNP()
        if (response.result.status == "DONE") {
            displayButtonMsg(true, id_create_vcode, "descr", response.result.msg);
            displayButtonMsg(false, id_create_vcode, "error");
            stepOnes.forEach((input) => {
                input.type == "checkbox" ? input.disabled = true : input.readOnly = true;
            });
            stepTwos.forEach((input) => {
                input.disabled = false;
            });
            id_confirm_vcode.disabled = false;
            initValidation(stepTwos, id_confirm_vcode);
        } else if (response.result.status == "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_create_vcode, "error", response.result.msg);
            displayButtonMsg(false, id_create_vcode, "descr");
            id_create_vcode.disabled = false;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (response.id == "confirm_vcode_for_SNP") {
        // requestConfirmVcodeForSNP()
        if (response.result.status == "DONE") {
            displayButtonMsg(true, id_confirm_vcode, "descr", response.result.msg);
            displayButtonMsg(false, id_confirm_vcode, "error");
            inputs = document.querySelectorAll("input");
            inputs.forEach((input) => {
                input.disabled = false;
                input.readOnly = true;
            });
            id_confirm_vcode.disabled = true;
            document.querySelector("form").submit();
        } else if (response.result.status == "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_confirm_vcode, "error", response.result.msg);
            id_confirm_vcode.disabled = false;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (response.id == "create_dflink") {
        // requestCreateDflink()
        if (response.result.status == "DONE") {
            displayButtonMsg(true, id_create_or_update_dflink, "descr", response.result.msg);
            displayButtonMsg(false, id_create_or_update_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (response.result.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            response.result.element != null ? displayError(true, code(response.result.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update_dflink, "descr");
            displayButtonMsg(true, id_create_or_update_dflink, "error", response.result.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (response.id == "update_dflink") {
        // requestUpdateDflink()
        if (response.result.status == "DONE") {
            displayButtonMsg(true, id_create_or_update_dflink, "descr", response.result.msg);
            displayButtonMsg(false, id_create_or_update_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (response.result.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            response.result.element != null ? displayError(true, code(response.result.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update_dflink, "descr");
            displayButtonMsg(true, id_create_or_update_dflink, "error", response.result.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });

    } else if (response.id == "delete_dflink") {
        // requestDeleteDflink()
        if (response.result.status == "DONE") {
            displayButtonMsg(true, id_delete_dflink, "descr", response.result.msg);
            displayButtonMsg(false, id_delete_dflink, "error");
            location.href = originLocation + "/dflink";
        } else if (response.result.status == "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            displayButtonMsg(false, id_delete_dflink, "descr");
            displayButtonMsg(true, id_delete_dflink, "error", response.result.msg);
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
            notiTitle.innerText = "'Google로 로그인'이 잠겼어요.";
            notiContent.innerText = `${params} 인앱 브라우저에서는 'Google로 로그인'이 불가해요. Chrome이나 Safari에서는 가능해요!`;
        } else if (notiType == "welcomeNewUser") {
            notiIconSmile.classList.remove("hidden");
            notiTitle.innerText = "디닷에프 가입을 환영해요! 🎉";
            notiContent.innerText = `시설이용, 프로덕션, 동영링크 등 ${params}님을 위한 다양한 서비스를 이용해보세요!`;
        } else if (notiType == "requestLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "지금 계신 지역의 기상정보를 받아보세요.";
            notiContent.innerText = "사용 중인 브라우저에서 위치 액세스를 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "recheckLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "혹시 기상정보가 부정확한가요?";
            notiContent.innerText = "잠깐 문제가 생긴 것 같아요. 새로고침으로 기상정보를 다시 불러올 수 있어요.";
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

    if (notiType == "requestLocationAccess" || notiType == "recheckLocationAccess") {
        setTimeout(() => { masterNoti() }, 2000);
    } else {
        setTimeout(() => { masterNoti() }, 1000);
    };
}