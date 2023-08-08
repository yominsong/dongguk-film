//
// Global constants and variables
//

const originLocation = window.location.origin;
let request = {}; // for `makeAjaxCall()` function

//
// Sub functions
//

/**
 * - `String/Number.getLastNumInKor()`: Return the last letter in Hangul
 * - `Number.toTwoDigits()`: Pad with zero to make a two digit number **(type: string)**
 * - `Date.getKorDay()`: Return the day of the week of a date
 */
function inheritObject() {
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