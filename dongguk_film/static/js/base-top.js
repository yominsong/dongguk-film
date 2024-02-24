//
// Global variables
//

const originLocation = location.origin;

let urlParams = new URLSearchParams(location.search);
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
            lastNum === 0 ? lastNumInKor = "공" : lastNum === 1 ? lastNumInKor = "일" : lastNum === 2 ? lastNumInKor = "이" : lastNum === 3 ? lastNumInKor = "삼" : lastNum === 4 ? lastNumInKor = "사" : lastNum === 5 ? lastNumInKor = "오" : lastNum === 6 ? lastNumInKor = "육" : lastNum === 7 ? lastNumInKor = "칠" : lastNum === 8 ? lastNumInKor = "팔" : lastNum === 9 ? lastNumInKor = "구" : null;
            return lastNumInKor;
        };
    });

    Number.prototype.toTwoDigits = function toTwoDigits() {
        return String(this).padStart(2, "0");
    };

    Date.prototype.getKorDay = function getKorDay() {
        let dayNum = this.getDay();
        let korDay;
        dayNum === 0 ? korDay = "일" : dayNum === 1 ? korDay = "월" : dayNum === 2 ? korDay = "화" : dayNum === 3 ? korDay = "수" : dayNum === 4 ? korDay = "목" : dayNum === 5 ? korDay = "금" : null;
        return korDay;
    };
}

inheritObject();

/**
 * @param {object|string} one Something to concatenate with two
 * @param {object|string} two Something to concatenate with one
 * @returns {object} 
 */
function code(one, two) {
    let result;

    if (one === null || one === undefined) {
        result = null;
    } else {
        if (two === null || two === undefined) {
            two = "";
        };

        if (typeof (one) === "object" && typeof (two) === "string") {
            result = one.id + two;
        } else if (typeof (one) === "string" && typeof (two) === "object") {
            result = one + two.id;
        } else if (typeof (one) === "object" && typeof (two) === "object") {
            result = one.id + two.id;
        } else if (typeof (one) === "string" && typeof (two) === "string") {
            result = one + two;
        };
    };

    result = document.querySelector(`#${result}`);

    return eval(result);
}

/**
 * @param {Array} array1 An array of strings
 * @param {Array} array2 An array consisting of strings paired with array1
 * @param {Array} array3 An array consisting of strings paired with array1
 * @returns {String|Array} A randomly selected string or an array of two pairs of strings
 * - If array2 is null: A string in randomly selected array1
 * - If array2 is not null: An array consisting of strings in randomly selected array1 and array2
 */
function randomItem(array1, array2 = null, array3 = null) {
    let randomIndex = Math.floor(Math.random() * array1.length);
    let result;

    if (array2 && array3) {
        result = [array1[randomIndex], array2[randomIndex], array3[randomIndex]];
    } else if (array2) {
        result = [array1[randomIndex], array2[randomIndex]];
    } else {
        result = array1[randomIndex];
    };

    return result;
}

function generateUUID() {
    let array = new Uint8Array(16);
    let uuid;

    crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    uuid = [...array].map(b => b.toString(16).padStart(2, "0")).join("").match(/.{1,4}/g).join("-");

    return uuid;
}

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

function skipNavbar() {
    document.addEventListener("keydown", function (event) {
        if (event.key === "Tab") {
            id_top_banner.classList.replace("hidden", "flex");
        } else if ((event.key === "Enter" && document.activeElement.id === "id_skip_navbar") ||
            (event.key === " " && document.activeElement.id === "id_skip_navbar")) {
            id_skip_navbar.click();
            id_top_banner.classList.replace("flex", "hidden");
        };
    });

    document.addEventListener("click", function (event) {
        if (event.target.id !== "id_skip_navbar") {
            id_top_banner.classList.replace("flex", "hidden");
        } else if (!id_top_banner.contains(event.target)) {
            id_top_banner.classList.replace("flex", "hidden");
        };
    });

    document.addEventListener("focusin", function () {
        if (document.activeElement.id !== "id_skip_navbar") {
            id_top_banner.classList.replace("flex", "hidden");
        };
    });
}

skipNavbar();

//
// Main functions
//

function makeAjaxCall(request) {
    const csrftoken = getCookie("csrftoken");
    const ajaxSettings = {
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
    }

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

    if (request.data instanceof FormData) {
        ajaxSettings.processData = false;
        ajaxSettings.contentType = false;
    };

    $.ajax(ajaxSettings).done((response) => {
        console.log(response);
        handleAjaxCallback(response);
    }).fail((errorThrown, status) => {
        console.log(`${errorThrown.status} ${errorThrown.statusText}\n${status}`);
    });
}

function handleAjaxCallback(response) {
    let resID = response.id
    let resResult = response.result;

    // requestVerifyAuthentication()
    if (resID === "verify_authentication") {
        if (resResult.status === "DONE") {
            isAuthenticated = true;
            userPk = String(resResult.pk);
            userName = resResult.name;
            userStudentId = resResult.student_id;
        } else if (resResult.status === "FAIL") {
            isAuthenticated = false;
            userPk = null;
            userName = null;
            userStudentId = null;
        };
    }

    // requestWeather()
    else if (resID === "weather") {
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
    }

    // requestCreateVcodeForSNP()
    else if (resID === "create_vcode_for_SNP") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create, "descr", resResult.msg);
            displayButtonMsg(false, id_create, "error");
            class_firsts.forEach((input) => {
                input.type === "checkbox" ? input.disabled = true : input.readOnly = true;
            });
            class_seconds.forEach((input) => {
                input.disabled = false;
            });
            id_confirm.disabled = false;
            initValidation(class_seconds, id_confirm);
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_create, "error", resResult.msg);
            displayButtonMsg(false, id_create, "descr");
            id_create.disabled = false;
            id_confirm.disabled = true;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestConfirmVcodeForSNP()
    else if (resID === "confirm_vcode_for_SNP") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_confirm, "descr", resResult.msg);
            displayButtonMsg(false, id_confirm, "error");
            inputs = document.querySelectorAll("input");
            inputs.forEach((input) => {
                input.disabled = false;
                input.readOnly = true;
            });
            id_confirm.disabled = true;
            document.querySelector("form").submit();
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            displayButtonMsg(true, id_confirm, "error", resResult.msg);
            id_confirm.disabled = false;
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestFindUser()
    else if (resID === "find_user") {
        if (resResult.status === "DONE") {
            isUserFound = true;

            resResult.found_user_list.forEach(newlyFoundUser => {
                const alreadyFoundUsers = id_found_user_list.querySelectorAll("li");

                alreadyFoundUsers.forEach(alreadyFoundUser => {
                    if (alreadyFoundUser.dataset.name !== newlyFoundUser.name) {
                        id_found_user_list.removeChild(alreadyFoundUser);
                    };
                });

                if (!document.getElementById(`id_found_user_${newlyFoundUser.pk}`)) {
                    const newlyFoundUserElement = document.createElement("li");
                    const data_user = newlyFoundUserElement.dataset;
                    
                    data_user.pk = newlyFoundUser.pk;
                    data_user.name = newlyFoundUser.name;
                    data_user.studentId = newlyFoundUser.student_id;
                    data_user.avatarUrl = newlyFoundUser.avatar_url;

                    newlyFoundUserElement.id = `id_found_user_${data_user.pk}`;
                    newlyFoundUserElement.classList.add("class-user", "relative", "outline-none", "cursor-default", "select-none", "py-2", "pl-3", "text-gray-900", "focus:bg-flamingo-600", "focus:text-white", "hover:bg-flamingo-600", "hover:text-white");
                    newlyFoundUserElement.setAttribute("role", "option");

                    newlyFoundUserElement.innerHTML = `
                        <div class="flex items-center">
                            <img src="${data_user.avatarUrl}" alt="${data_user.name}님의 프로필 사진" class="h-6 w-6 flex-shrink-0 rounded-full">
                            <span class="font-semibold ml-3 truncate">${data_user.name}</span>
                            <span>&nbsp(${data_user.studentId})</span>
                        </div>
                    `;

                    id_found_user_list.appendChild(newlyFoundUserElement);
                };
            });
        } else if (resResult.status === "FAIL") {
            isUserFound = false;
        };
    }

    // requestCreateProject()
    else if (resID === "create_project") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${originLocation}${location.pathname}`;
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestCreateDflink()
    else if (resID === "create_dflink") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${originLocation}${location.pathname}`;
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestUpdateDflink()
    else if (resID === "update_dflink") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = location.href.replace("#id_main_content", "");
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestDeleteDflink()
    else if (resID === "delete_dflink") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_delete, "descr", resResult.msg);
            displayButtonMsg(false, id_delete, "error");
            location.href = location.href.replace("#id_main_content", "");
        } else if (resResult.status === "FAIL") {
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            displayButtonMsg(false, id_delete, "descr");
            displayButtonMsg(true, id_delete, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestOcrNotice()
    else if (resID === "ocr_notice") {
        freezeFileForm(false);
        freezeForm(false);
        displayButtonMsg(false, id_create_or_update, "descr");

        if (resResult.status === "DONE") {
            ckEditor.setData(resResult.content);
            ckEditor.disableReadOnlyMode("id_content");
            displayNoti(true, "EIS");
        } else if (resResult.status === "FAIL") {
            displayNoti(true, "EIF");
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestCreateNotice()
    else if (resID === "create_notice") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${originLocation}${location.pathname}`;
        } else if (resResult.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", resResult.msg);
            if (resResult.reason.includes("대체 텍스트")) {
                displayNoti(true, "RAT");
            } else if (resResult.reason.includes("설명 텍스트")) {
                displayNoti(true, "RDI");
            };
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestReadNotice()
    else if (resID === "read_notice") {
        if (resResult.status === "DONE") {
            ckEditor.setData(resResult.content);
            ckEditor.disableReadOnlyMode("id_content");
            id_block_id_list.value = resResult.block_id_list;
            freezeFileForm(false);
            selectedFiles = resResult.file;
            attachFile(event = null, sudo = true);
        };
    }

    // requestUpdateNotice()
    else if (resID === "update_notice") {
        if (resResult.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", resResult.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = location.href;
        } else if (resResult.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            resResult.element != null ? displayError(true, code(resResult.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", resResult.msg);
            if (resResult.reason.includes("대체 텍스트")) {
                displayNoti(true, "RAT");
            } else if (resResult.reason.includes("설명 텍스트")) {
                displayNoti(true, "RDI");
            };
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestDeleteNotice()
    else if (resID === "delete_notice") {
        if (resResult.status === "DONE") {
            let search = location.search;

            displayButtonMsg(true, id_delete, "descr", resResult.msg);
            displayButtonMsg(false, id_delete, "error");
            if (search.includes("previousSearch")) {
                let previousSearch = new URLSearchParams(search).get("previousSearch");
                location.href = `${originLocation}/notice${previousSearch}`;
            } else if (location.pathname !== "/notice/") {
                location.href = `${originLocation}/${location.pathname.split("/")[1]}/`;
            } else {
                location.href = `${originLocation}${location.pathname}`;
            };
        } else if (resResult.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            displayButtonMsg(false, id_delete, "descr");
            displayButtonMsg(true, id_delete, "error", resResult.msg);
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    };
}
