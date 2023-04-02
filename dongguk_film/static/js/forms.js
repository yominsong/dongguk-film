const onlyHanguls = document.querySelectorAll(".only-hangul");
const onlyRomans = document.querySelectorAll(".only-roman");
const onlyNumbers = document.querySelectorAll(".only-number");
const onlyEmails = document.querySelectorAll(".only-email");
const onlyPhones = document.querySelectorAll(".only-phone");
const onlyDates = document.querySelectorAll(".only-date");
const onlyUrls = document.querySelectorAll(".only-url");
const onlySlugs = document.querySelectorAll(".only-slug");
const labels = document.querySelectorAll("label");
const radios = document.querySelectorAll(".radio");
let spins = document.querySelectorAll(".animate-spin");
let buttons = document.querySelectorAll("button");
let inputs = [];

const eventTypes = ["focusin", "focusout", "compositionstart", "compositionupdate", "compositionend", "keydown", "keypress", "keyup", "mouseenter", "mouseover", "mousemove", "mousedown", "mouseup", "click", "contextmenu", "mouseleave", "mouseout", "select"];
const allowedKeys = ["Enter", "Backspace", "Tab", "Shift", "Control", "Alt", "HangulMode", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

const regHangul = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regNotHangul = /[^ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regRoman = /[a-z]+/g;
const regNotRoman = /[^a-z]+/g;
const regNotLowerRomanAndNumber = /[^a-z0-9]/g;
const regEmail = /^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$/g;
const regNotNumber = /[^0-9]/g;
const regNotNumberWithDash = /[^0-9\-]/g;
const regUrl = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;


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
    isNaN(word) == false ? lastLetter = word.getLastNumInKor() : word.indexOf("URL") != -1 ? lastLetter = "엘" : lastLetter = word.substr(-1);
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

function findLabel(input) {
    let foundLabel;
    labels.forEach((label) => {
        if (label.getAttribute("for") == String(input.id)) {
            foundLabel = label.innerText;
        };
    });
    return foundLabel;
}

function freezeForm(bool) {
    /*
     * bool: Freeze or Unfreeze active inputs and buttons
     */

    inputs.forEach((input) => {
        if (input.type == "checkbox") {
            bool ? input.disabled = true : input.disabled = false;
        } else if (input.getAttribute("origin") == "radio") {
            bool ? radios.forEach((radio) => { radio.disabled = true }) : radios.forEach((radio) => { radio.disabled = false })
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
    /* 
     * input: Input that needs to be validated
     */

    return input.type == "checkbox" ? input.checked : controlError(input) == false && code(input, "_descr").hidden && code(input, "_error").hidden;
}

function trim(input) {
    /* 
     * input: Input that needs to be trimed
     */

    return input.value.trim().replace(/\s{2,}/g, " ");
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
        onlyDates.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "").replace(/(^[0-9]{4})([0-9]+)?([0-9]{2})$/, "$1-$2-$3").replace("--", "-");
            });
        });
        onlyUrls.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(" ", "");
            });
        });
        onlySlugs.forEach((input) => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotLowerRomanAndNumber, "");
                input.value = input.value.replace(" ", "");
            });
        });
    });
    inputs.forEach((input) => {
        if (input.type == "radio") {
            let OriginalInput = eval(input.id.replace(input.id, `${input.id.split("_")[0]}_${input.id.split("_")[1]}`));
            input.addEventListener("click", () => {
                displayError(false, OriginalInput);
            });
            input.addEventListener("focusout", () => {
                controlError(OriginalInput);
            });
            input.addEventListener("focusin", () => {
                displayError(false, OriginalInput);
            });
        } else {
            input.addEventListener("click", () => {
                displayInfo(true, input);
                displayError(false, input);
            });
            input.addEventListener("keydown", (event) => {
                displayInfo(true, input);
                displayError(false, input);
                controlDescr(input, event);
            });
            input.addEventListener("focusout", () => {
                trim(input);
                displayInfo(false, input);
                displayDescr(false, input);
                controlError(input);
            });
            input.addEventListener("focusin", () => {
                trim(input);
                displayInfo(false, input);
                displayError(false, input);
            });
        };
    });
}

function displayInfo(bool, input) {
    /* 
     * bool: Show/hide description
     * input: Target input
     */

    let infoMsg = code(input, "_info");

    if (bool == true) {
        // Show info
        infoMsg.hidden = false;
    }

    else if (bool == false) {
        // Hide info
        infoMsg.hidden = true;
    };
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

    // Only lower romans and numbers allowed
    if ([id_dflink_slug].indexOf(input) != -1) {
        if (regNotLowerRomanAndNumber.test(input.value) ||
            (regNotLowerRomanAndNumber.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) == -1) ||
            (event.isComposing && allowedKeys.indexOf(inputKeyChar) == -1)) {
            displayDescr(true, input, "only lower romans and numbers");
        } else {
            displayDescr(false, input);
        };
    };

    // Only phone numbers OR dates allowed
    if ([id_phone, id_dflink_expiration_date].indexOf(input) != -1) {
        if (regNotNumberWithDash.test(input.value) ||
            (regNotNumberWithDash.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) == -1)) {
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

function displayDescr(bool, input, descrType) {
    /* 
     * bool: Show/hide description
     * input: Target input
     * descrType: "no spaces", "no hanguls", "only hanguls", "only romans", "only numbers", "only lower romans and numbers"
     */

    let descrMsg = code(input, "_descr");

    if (bool == true) {
        // Show description
        let sentence;
        if (descrType == "no spaces") {
            sentence = "공백은 입력될 수 없어요.";
        } else if (descrType == "no hanguls") {
            sentence = "로마자, 숫자, 특수문자만 입력해주세요.";
        } else if (descrType == "only hanguls") {
            sentence = "한글만 입력해주세요.";
        } else if (descrType == "only romans") {
            sentence = "로마자 소문자만 입력해주세요.";
        } else if (descrType == "only numbers") {
            sentence = "숫자만 입력해주세요.";
        } else if (descrType = "only lower romans and numbers") {
            sentence = "로마자 소문자, 숫자만 입력해주세요.";
        };
        descrMsg.innerText = `${sentence}`;
        descrMsg.hidden = false;

    } else if (bool == false) {
        // Hide description
        descrMsg.innerText = null;
        descrMsg.hidden = true;
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

    // Radio button
    if ([id_category].indexOf(input) != -1) {
        if (input.value == "") {
            displayError(true, input, "unselected");
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

    // Name
    if ([id_name].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length == 1) {
            displayError(true, input, "insufficient");
        } else if (!input.value.match(regHangul)) {
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

    // Url
    if ([id_original_url].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.indexOf("https://") == -1 && input.value.indexOf("http://") == -1) {
            displayError(true, input, "no protocol");
        } else if (!input.value.match(regUrl)) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // DF link slug
    if ([id_dflink_slug].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length < 2) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // DF link title
    if ([id_dflink_title].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.replace(/\s/g, "").length == 0) {
            displayError(true, input, "empty")
        } else if (input.value.length < 2) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // DF link expiration date
    if ([id_dflink_expiration_date].indexOf(input) != -1) {
        if (input.value.length == 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 10) {
            displayError(true, input, "insufficient");
        } else if (!validateDate(input)) {
            displayError(true, input, "invalid");
        } else if (Number(input.value.replace(/-/g, "")) < Number(input.getAttribute("min").replace(/-/g, "")) ||
            Number(input.value.replace(/-/g, "")) > Number(input.getAttribute("max").replace(/-/g, ""))) {
            displayError(true, input, "out of range");
        } else {
            return false;
        };
    };

    return true;
}

function displayError(bool, input, errorType) {
    /* 
     * bool: Show/hide error
     * input: Target input
     * descrType: "unchecked", "unselected", "empty", "insufficient", "invalid", "no protocol", "out of range"
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
        } else if (errorType == "unselected") {
            subject = matchJosa(`${findLabel(input)}`, "을를", "WJS");
            narrativeClause = "선택해주세요.";
        } else if (errorType == "empty") {
            subject = matchJosa(findLabel(input), "을를", "WJS");
            narrativeClause = "입력해주세요.";
        } else if (errorType == "insufficient") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "덜 입력된 것 같아요.";
        } else if (errorType == "invalid") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "잘못 입력된 것 같아요.";
        } else if (errorType == "no protocol") {
            subject = `${findLabel(input)}에`
            narrativeClause = "'https://' 또는 'http://'를 포함해주세요.";
        } else if (errorType == "out of range") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = `유효 범위를 벗어났어요.`;
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