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

function hideNavbarAndFooter() {
    if (location.pathname.indexOf("accounts") != -1) {
        navbar.hidden = true;
        footer.hidden = true;
    };
}

hideNavbarAndFooter();

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
        const pulse = document.querySelectorAll(".animate-pulse");
        const pulseOff = document.querySelectorAll(".pulse-off");
        pulse.forEach((item) => {
            item.classList.add("hidden");
        });
        pulseOff.forEach((item) => {
            item.classList.remove("hidden");
        });
        document.querySelector("#address").innerText = response.result.address;
        document.querySelector("#temperature").innerText = response.result.temperature;
        document.querySelector("#precipitationType").innerText = response.result.precipitationType;
        document.querySelector("#windSpeed").innerText = response.result.windSpeed;
        document.querySelector("#windName").innerText = response.result.windName;
        document.querySelector("#skyState").innerText = response.result.skyState;
        document.querySelector("#precipitationProbability").innerText = response.result.precipitationProbability;
        document.querySelector("#temperatureMax").innerText = response.result.temperatureMax;
        document.querySelector("#temperatureMin").innerText = response.result.temperatureMin;
        document.querySelector("#sunrise").innerText = response.result.sunrise;
        document.querySelector("#sunset").innerText = response.result.sunset;
        document.querySelector("#baseDateTime").innerText = response.result.baseDateTime;

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
    }
}

function controlNoti(notiType) {
    // Write noti
    function writeNoti() {
        notiIconLocation.classList.add("hidden");
        notiIconClipboard.classList.add("hidden");
        notiTitle.innerText = null;
        notiContent.innerText = null;
        if (notiType == "requestLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "지금 계신 지역의 기상정보를 받아보세요.";
            notiContent.innerText = "사용 중인 브라우저에서 위치 액세스를 허용해주세요. 새로고침도 꼭 부탁드려요!";
        } else if (notiType == "recheckLocationAccess") {
            notiIconLocation.classList.remove("hidden");
            notiTitle.innerText = "혹시 기상정보가 부정확한가요?";
            notiContent.innerText = "위치 액세스가 허용되었는지 확인해주세요. 새로고침도 꼭 부탁드려요!";
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
        masterNoti();
    };
}