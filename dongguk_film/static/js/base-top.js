//
// Global variables
//

let urlParams = new URLSearchParams(location.search);
let request = {}; // for `makeAjaxCall()` function
let userPk, userName, userStudentId; // User authentication verification results
let userPinpointed = false; // User pinpointing results

//
// Sub functions
//

function isAuthenticated() {
    return userPk !== null && userPk !== undefined && userName !== null && userName !== undefined && userStudentId !== null && userStudentId !== undefined;
}

function getCart() {
    return JSON.parse(sessionStorage.getItem("cart"));
}

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
        return;
    } else {
        if (two === null || two === undefined) {
            two = "";
        };

        if (typeof (one) === "object" && typeof (two) === "string") {
            result = one.id + two;
        } else if (typeof (one) === "string" && typeof (two) === "object") {
            if (two.id.indexOf("id_") === 0) {
                result = one + two.id.replace("id_", "");
            } else {
                result = one + two.id;
            };
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
    // Used the ensure_csrf_cookie decorator in views.py to issue CSRF cookies to first-time visitors to D-dot-f
    function getCookie(name) {
        let cookieValue = null;

        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");

            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();

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
            userPk = String(resResult.pk);
            userName = resResult.name;
            userStudentId = resResult.student_id;
        } else if (resResult.status === "FAIL") {
            userPk = null;
            userName = null;
            userStudentId = null;
        };
    }

    // requestPinpointUser()
    else if (resID === "pinpoint_user") {
        if (resResult.status === "DONE") {
            userPinpointed = true;
        } else if (resResult.status === "FAIL") {
            userPinpointed = false;
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

    // requestFilterEquipment()
    else if (resID === "filter_equipment") {
        if (resResult.status === "DONE") {
            location.href = `${location.origin}${resResult.next_url}`;
        };
    }

    // requestAddToCart()
    else if (resID === "add_to_cart") {
        freezeForm(false);
        // id_quantity.readOnly = false;
        initCart(resResult);

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestFindProject()
    else if (resID === "find_project") {
        if (resResult.status === "DONE") {
            initFoundProjectList(resResult);
        } else if (resResult.status === "FAIL") {
            initFoundProjectList();
        };
    }

    // requestFindHour()
    else if (resID === "find_hour") {
        initFoundHourList(resResult);
    }

    // requestCreateApplication()
    else if (resID === "create_application") {
        if (resResult.status === "DONE") {
        } else if (resResult.status === "FAIL") {
            freezeSignatureCanvas(false);
            freezeForm(false);

            const id_cart_alert = document.getElementById("id_cart_alert");
            const occupiedItems = resResult.occupied_item_list;
            const id_modal_cart = document.getElementById("id_modal_cart");

            if (id_cart_alert !== null && !id_cart_alert.hidden) {
                const id_decrease_quantity = document.getElementById("id_decrease_quantity");
                const id_requested_quantity = document.getElementById("id_requested_quantity");
                const id_increase_quantity = document.getElementById("id_increase_quantity");
                const id_add_to_cart = document.getElementById("id_add_to_cart");

                id_decrease_quantity.disabled = true;
                id_requested_quantity.readOnly = true;
                id_increase_quantity.disabled = true;
                id_add_to_cart.disabled = true;
            };

            if (resResult.reason === "OCCUPIED_ITEM") {
                occupiedItems.forEach((item) => {
                    const targetItem = id_modal_cart.querySelector(`#id_${item.collection_id}`);
                    const targetItemInfo = targetItem.querySelector(".class-collection-id-and-quantity");

                    // targetItem.classList.add("bg-flamingo-50");

                    if (!targetItemInfo.innerHTML.includes("대여 불가")) {
                        targetItemInfo.innerHTML += ` · <span class="font-semibold text-red-600">대여 불가</span>`;
                    };
                });
            } else if (resResult.reason === "INVALID_SIGNATURE") {
                displayErrorInSignatureCanvas(true, "invalid");
            };

            displayButtonMsg(false, id_filter_or_checkout, "descr");
            displayButtonMsg(true, id_filter_or_checkout, "error", resResult.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestFindApplication()
    else if (resID === "find_application") {
        if (resResult.status === "DONE") {
            initFoundApplicationList(resResult);
        } else if (resResult.status === "FAIL") {
            initFoundApplicationList();
        };
    }

    // requestFindInstructor()
    else if (response.id === "find_instructor") {
        initFoundInstructorList(response);
        // if (resResult.status === "DONE") {
        //     initFoundInstructorList(resResult);
        // } else if (resResult.status === "FAIL") {
        //     initFoundInstructorList();
        // };
    }

    // requestFindUser()
    else if (response.id === "find_user") {
        if (response.status === "DONE") {
            initFoundUserList(response);
        } else if (response.status === "FAIL") {
            initFoundUserList();
        };
    }

    // requestCreateProject()
    else if (response.id === "create_project") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${location.origin}${location.pathname}`;
        } else if (response.status === "FAIL") {
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestUpdateProject()
    else if (response.id === "update_project") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = location.href.replace("#id_main_content", "").replace("#", "");
        } else if (response.status === "FAIL") {
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestDeleteProject()
    else if (response.id === "delete_project") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_delete, "descr", response.msg);
            displayButtonMsg(false, id_delete, "error");
            location.href = location.href.replace("#id_main_content", "").replace("#", "");
        } else if (response.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            displayButtonMsg(false, id_delete, "descr");
            displayButtonMsg(true, id_delete, "error", response.msg);
        };
        
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestCreateDflink()
    else if (response.id === "create_dflink") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${location.origin}${location.pathname}`;
        } else if (response.status === "FAIL") {
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            response.element != null ? displayError(true, code(response.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);
        };
        
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestUpdateDflink()
    else if (response.id === "update_dflink") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = location.href.replace("#id_main_content", "");
        } else if (response.status === "FAIL") {
            freezeForm(false);
            
            buttons.forEach((button) => {
                button.disabled = false;
            });

            response.element != null ? displayError(true, code(response.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestDeleteDflink()
    else if (response.id === "delete_dflink") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_delete, "descr", response.msg);
            displayButtonMsg(false, id_delete, "error");
            location.href = location.href.replace("#id_main_content", "");
        } else if (response.status === "FAIL") {
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            displayButtonMsg(false, id_delete, "descr");
            displayButtonMsg(true, id_delete, "error", response.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestOcrNotice()
    else if (response.id === "ocr_notice") {
        freezeFileForm(false);
        freezeForm(false);
        displayButtonMsg(false, id_create_or_update, "descr");

        if (response.status === "DONE") {
            watchdog.editor.setData(response.content);
            watchdog.editor.disableReadOnlyMode("id_content");
            displayNoti(true, "EIS");
        } else if (response.status === "FAIL") {
            displayNoti(true, "EIF");
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestCreateNotice()
    else if (response.id === "create_notice") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = `${location.origin}${location.pathname}`;
        } else if (response.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            response.element != null ? displayError(true, code(response.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);

            if (response.reason.includes("대체 텍스트")) {
                displayNoti(true, "RAT");
            } else if (response.reason.includes("텍스트 미포함")) {
                displayNoti(true, "RDI");
            };
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestReadNotice()
    else if (response.id === "read_notice") {
        if (response.status === "DONE") {
            watchdog.editor.setData(response.content);
            watchdog.editor.disableReadOnlyMode("id_content");
            id_block_id_list.value = response.block_id_list;
            freezeFileForm(false);
            selectedFiles = response.file;
            attachFile(event = null, sudo = true);
        };
    }

    // requestUpdateNotice()
    else if (response.id === "update_notice") {
        if (response.status === "DONE") {
            displayButtonMsg(true, id_create_or_update, "descr", response.msg);
            displayButtonMsg(false, id_create_or_update, "error");
            location.href = location.href;
        } else if (response.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);
            buttons.forEach((button) => {
                button.disabled = false;
            });
            response.element != null ? displayError(true, code(response.element), "inappropriate") : null;
            displayButtonMsg(false, id_create_or_update, "descr");
            displayButtonMsg(true, id_create_or_update, "error", response.msg);
            if (response.reason.includes("대체 텍스트")) {
                displayNoti(true, "RAT");
            } else if (response.reason.includes("설명 텍스트")) {
                displayNoti(true, "RDI");
            };
        };
        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestDeleteNotice()
    else if (response.id === "delete_notice") {
        if (response.status === "DONE") {
            let search = location.search;

            displayButtonMsg(true, id_delete, "descr", response.msg);
            displayButtonMsg(false, id_delete, "error");

            if (search.includes("previousSearch")) {
                let previousSearch = new URLSearchParams(search).get("previousSearch");
                location.href = `${location.origin}/notice${previousSearch}`;
            } else if (location.pathname !== "/notice/") {
                location.href = `${location.origin}/${location.pathname.split("/")[1]}/`;
            } else {
                location.href = `${location.origin}${location.pathname}`;
            };
        } else if (response.status === "FAIL") {
            freezeFileForm(false);
            freezeForm(false);

            buttons.forEach((button) => {
                button.disabled = false;
            });

            displayButtonMsg(false, id_delete, "descr");
            displayButtonMsg(true, id_delete, "error", response.msg);
        };

        spins.forEach((spin) => {
            spin.classList.add("hidden");
        });
    }

    // requestGetPaginatedData()
    else if (resID === "get_paginated_data") {
        updatePaginationControl(resResult);
        updateList(resResult);
    };
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

function requestPinpointUser() {
    request.url = `${location.origin}/account/utils/pinpoint-user/`;
    request.type = "POST";
    request.data = { id: "pinpoint_user", pk: userPk, name: userName, student_id: userStudentId };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}