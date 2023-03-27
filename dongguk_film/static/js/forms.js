const onlyHanguls = document.querySelectorAll(".only-hangul");
const onlyRomans = document.querySelectorAll(".only-roman");
const onlyNumbers = document.querySelectorAll(".only-number");
const onlyEmails = document.querySelectorAll(".only-email");
const onlyPhones = document.querySelectorAll(".only-phone");
const eventTypes = ["focusin", "focusout", "compositionstart", "compositionupdate", "compositionend", "keydown", "keypress", "keyup", "mouseenter", "mouseover", "mousemove", "mousedown", "mouseup", "click", "contextmenu", "mouseleave", "mouseout", "select"];
const allowedKeys = ["Enter", "Backspace", "Tab", "Shift", "Control", "Alt", "HangulMode", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
const regHangul = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regNotHangul = /[^ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regRoman = /[a-z]+/g;
const regNotRoman = /[^a-z]+/g;
const regEmail = /^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$/g;
const regNotNumber = /[^0-9]/g;
const regNotPhone = /[^0-9\-]/g;
const labels = document.querySelectorAll("label");
let inputs = [];
let buttons = document.querySelectorAll("button");
let spins = document.querySelectorAll(".animate-spin");

//
// Sub functions
//

function matchJosa(word, josaType, resultType) {
    /*
     * word: Target word
     * josaType: "을를", "이가", "은는", "와과", "로으로", "라는이라는"
     * resultType: "WJS", "OJS"
     * 
     * WJS: Word and josa
     * OJS: Only josa
     */

    let lastLetter, hasBatchim, josa, result;
    isNaN(word) == true ? lastLetter = word.substr(-1) : lastLetter = word.getLastNumInKor();
    hasBatchim = (lastLetter.charCodeAt(0) - parseInt("ac00", 16)) % 28 > 0;

    if (josaType == "을를") {
        josa = hasBatchim ? "을" : "를";
    } else if (josaType == "이가") {
        josa = hasBatchim ? "이" : "가";
    } else if (josaType == "은는") {
        josa = hasBatchim ? "은" : "는";
    } else if (josaType == "와과") {
        josa = hasBatchim ? "과" : "와";
    } else if (josaType == "로으로") {
        josa = hasBatchim ? "으로" : "로";
    } else if (josaType == "라는이라는") {
        josa = hasBatchim ? "이라는" : "라는";
    };

    if (resultType == "WJS") {
        result = word + josa;
    } else if (resultType == "OJS") {
        result = josa;
    };

    return result;
}

// function formatDate(date, boolForKor, boolForDay) {
//     let day, format, formattedDate;
//     boolForDay ? day = date.getKorDay() : null;
//     if (boolForKor) {
//         format = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
//     } else {
//         format = `${date.getFullYear()}-${(date.getMonth() + 1).toTwoDigits()}-${(date.getDate()).toTwoDigits()}`;
//     };
//     formattedDate = boolForDay ? `${format}(${day})` : format;
//     return formattedDate;
// }

function findLabel(input) {
    let foundLabel;
    labels.forEach((label) => {
        if (label.getAttribute("for") == String(input.id)) {
            foundLabel = label.innerText;
        };
    });
    return foundLabel;
}

// function checkPathname(word) {
//     let bool = (window.location.pathname).includes(word);
//     return bool;
// }

function freezeForm(bool) {
    /*
     * bool: Freeze or Unfreeze active inputs and buttons
     */

    inputs.forEach((input) => {
        if (input.type == "checkbox") {
            bool ? input.disabled = true : input.disabled = false;
        } else if (input.disabled == false) {
            bool ? input.readOnly = true : input.readOnly = false;
        };
    });
    buttons.forEach((button) => {
        button.disabled = true;
    });
}

function initValidation(array, button) {
    /*
     * array: Input array to activate
     * button: Button element to act as submit button
     */

    inputs.length = 0;
    inputs.push(...array);
    inputs.forEach((input) => {
        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                button.click();
            };
        });
    });
    validation();
}

function code(id, extra) {
    /*
     * id: Target element
     * extra: String to concatenate as element's ID
     */

    return eval(String(id.id) + extra);
}

function isValid(input) {
    return input.type == "checkbox" ? input.checked : controlError(input) == false && code(input, "_descr").hidden && code(input, "_error").hidden;
}

//
// Main functions
//

function validation() {
    eventTypes.forEach((type) => {
        onlyHanguls.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotHangul, "");
            });
        });
        onlyRomans.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotRoman, "");
            });
        });
        onlyNumbers.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "");
            });
        });
        onlyEmails.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regHangul, "");
                input.value = input.value.replace(" ", "");
            });
        });
        onlyPhones.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "").replace(/(^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
            });
        });
    });
    inputs.forEach((input) => {
        input.addEventListener("keydown", (event) => {
            displayError(false, input);
            controlDescr(input, event);
        });
        input.addEventListener("focusout", () => {
            displayDescr(false, input);
            controlError(input);
        });
        input.addEventListener("focusin", () => {
            displayError(false, input);
        });
    });
}

function controlDescr(input, event) {
    let inputKeyChar = event.key;

    // Only numbers allowed
    if ([id_student_id, id_email_vcode, id_phone_vcode].indexOf(input) != -1) {
        if (regNotNumber.test(input.value) ||
            (regNotNumber.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) == -1)) {
            displayDescr(true, input, "only numbers");
        } else {
            displayDescr(false, input);
        };
    };

    // Only hanguls allowed
    if ([id_name].indexOf(input) != -1) {
        if (regNotHangul.test(input.value) ||
            (!event.isComposing && allowedKeys.indexOf(inputKeyChar) == -1)) {
            displayDescr(true, input, "only hanguls");
        } else {
            displayDescr(false, input);
        };
    };

    // Only romans allowed
    if ([id_dflink_slug].indexOf(input) != -1) {
        if (regNotRoman.test(input.value) ||
            (regNotRoman.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) == -1)) {
            displayDescr(true, input, "only romans");
        } else {
            displayDescr(false, input);
        };
    };

    // Only phone numbers allowed
    if ([id_phone].indexOf(input) != -1) {
        if (regNotPhone.test(input.value) ||
            (regNotPhone.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) == -1)) {
            displayDescr(true, input, "only numbers");
        } else {
            displayDescr(false, input);
        };
    };

    // No hanguls allowed
    if ([id_email].indexOf(input) != -1) {
        if (event.isComposing && allowedKeys.indexOf(inputKeyChar) == -1) {
            displayDescr(true, input, "no hanguls");
        } else {
            displayDescr(false, input);
        };
    };

    // Spaces allowed
    if ([id_dflink_title].indexOf(input) == -1) {
        if (inputKeyChar == " ") {
            displayDescr(true, input, "no spaces");
        };
    };
}

function controlError(input) {
    // Checkbox
    if ([id_agree].indexOf(input) != -1) {
        if (input.checked == false) {
            displayError(true, input, "unchecked");
        } else {
            return false;
        };
    };

    // Student ID
    if ([id_student_id].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 10) {
            displayError(true, input, "insufficient");
        } else if (Number(input.value.substr(0, 4)) > now.getFullYear()) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // Hangul
    if ([id_name].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length == 1) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // Roman
    if ([id_dflink_slug].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (!input.value.match(regRoman)) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // Email address
    if ([id_email].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.indexOf("@") == -1 ||
            input.value.split("@")[0].length <= 1 ||
            input.value.split("@")[1].indexOf(".") == -1 ||
            input.value.split("@")[1].split(".")[0].length <= 1 ||
            input.value.split("@")[1].split(".")[1].length <= 1 ||
            (input.value.split("@")[1].split(".").length - 1 == 2 && input.value.split("@")[1].split(".")[2].length <= 1 && input.value.substr(-1) != ".")) {
            displayError(true, input, "insufficient");
        } else if (!input.value.match(regEmail)) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // Phone number
    if ([id_phone].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 13) {
            displayError(true, input, "insufficient");
        } else if (input.value.indexOf("-") !== 3 && input.value.lastIndexOf("-") !== 8) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // 6 digit verification code
    if ([id_email_vcode, id_phone_vcode].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 6) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // DF link title
    if ([id_dflink_title].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length == 1) {
            displayError(true, input, "insufficient");
        };
    };

    return true;
}

function displayDescr(bool, input, descrType) {
    /* 
     * bool: Show/hide description
     * input: Target input
     * descrType: "no spaces", "no hanguls", "only numbers", "only hanguls", "only romans"
     */

    let descrMsg = code(input, "_descr");

    if (bool == true) {
        // Show description
        let sentence;
        if (descrType == "no spaces") {
            sentence = "공백은 입력될 수 없어요.";
        } else if (descrType == "no hanguls") {
            sentence = "로마자, 숫자, 특수문자만 입력해주세요.";
        } else if (descrType == "only numbers") {
            sentence = "숫자만 입력해주세요.";
        } else if (descrType == "only hanguls") {
            sentence = "한글만 입력해주세요.";
        } else if (descrType == "only romans") {
            sentence = "로마자 소문자만 입력해주세요.";
        };
        descrMsg.innerText = `${sentence}`;
        descrMsg.hidden = false;

    } else if (bool == false) {
        // Hide description
        descrMsg.innerText = null;
        descrMsg.hidden = true;
    };
}

function displayError(bool, input, errorType) {
    /* 
     * bool: Show/hide error
     * input: Target input
     * descrType: "unchecked", "empty", "insufficient", "invalid"
     */

    let errorMsg = code(input, "_error");

    if (bool == true) {
        // Change input's style and show error
        let subject;
        let narrativeClause;
        if (input.type != "checkbox") {
            input.classList.remove("border-gray-300");
            input.classList.add("bg-flamingo-50");
            input.classList.add("border-transparent");
        };
        if (errorType == "unchecked") {
            subject = matchJosa(`'${findLabel(input)}'`, "을를", "WJS");
            narrativeClause = "체크해주세요.";
        } else if (errorType == "empty") {
            subject = matchJosa(findLabel(input), "을를", "WJS");
            narrativeClause = "입력해주세요.";
        } else if (errorType == "insufficient") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "덜 입력된 것 같아요.";
        } else if (errorType == "invalid") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "잘못 입력된 것 같아요.";
        };
        errorMsg.innerText = `${subject} ${narrativeClause}`;
        errorMsg.hidden = false;

    } else if (bool == false) {
        // Init input's style and hide error
        if (input.type != "checkbox") {
            input.classList.add("border-gray-300");
            input.classList.remove("bg-flamingo-50");
            input.classList.remove("border-transparent");
        };
        errorMsg.innerText = null;
        errorMsg.hidden = true;
    };
}

function displayButtonMsg(bool, button, type, text) {
    /*
     * bool: Show/hide button's description/error
     * button: Target button
     * type: "descr", "error"
     * text: Description/error to write
     */

    let msg;

    // Get element's ID of description/error
    if (type == "descr") {
        msg = code(button, "_descr");
    } else if (type == "error") {
        msg = code(button, "_error");
    };

    // Write and show/hide description/error
    if (bool == true) {
        msg.innerText = text;
        msg.hidden = false;
    } else if (bool == false) {
        msg.innerText = null;
        msg.hidden = true;
    };
}