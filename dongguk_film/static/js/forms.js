//
// Global variables
//

const onlyHanguls = document.querySelectorAll(".only-hangul");
const onlyNumbers = document.querySelectorAll(".only-number");
const onlyPhones = document.querySelectorAll(".only-phone");
const onlyDates = document.querySelectorAll(".only-date");
const onlyEmails = document.querySelectorAll(".only-email");
const onlyUrls = document.querySelectorAll(".only-url");
const onlySlugs = document.querySelectorAll(".only-slug");
const labels = document.querySelectorAll("label");
const class_calendars = document.querySelectorAll(".class-calendar");

let originalClasses = {};
let originalStyles = {};
let originalParentClasses = {};
let originalParentStyles = {};
let spins = document.querySelectorAll(".animate-spin");
let buttons = document.querySelectorAll("button");
let inputs = [];
let filteredInputs = [];

const eventTypes = ["focusin", "focusout", "blur", "compositionstart", "compositionupdate", "compositionend", "keydown", "keypress", "keyup", "mouseenter", "mouseover", "mousemove", "mousedown", "mouseup", "click", "contextmenu", "mouseleave", "mouseout", "select"];
const allowedKeys = ["Enter", "Backspace", "Tab", "Shift", "Control", "Ctrl", "c", "v", "a", "Alt", "HangulMode", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

const regHangul = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regNotHangul = /[^ㄱ-ㅎㅏ-ㅣ가-힣]/g;
const regNotLowerCaseRomanAndNumberAndHyphen = /[^a-z0-9-]/g;
const regUpperCaseRoman = /[A-Z]/g;
const regEmail = /^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9}$/g;
const regNotNumber = /[^0-9]/g;
const regNotNumberWithDash = /[^0-9\-]/g;
const regUrl = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;

let lastFocusedElement;

//
// Sub functions
//

/**
 * @param {string} word Target word
 * @param {string} josaType Type of josa
 * - "을를"
 * - "이가"
 * - "은는"
 * - "와과"
 * - "로으로"
 * - "라는이라는"
 * @param {string} resultType Whether to include josa or not
 * - "WJS": Word and josa
 * - "OJS": Only josa
 * @returns {string}
 */
function matchJosa(word, josaType, resultType) {
    let lastLetter, hasBatchim, josa, result;
    isNaN(word) === false ? lastLetter = word.getLastNumInKor() : word.indexOf("URL") !== -1 ? lastLetter = "엘" : lastLetter = word.substr(-1);
    hasBatchim = (lastLetter.charCodeAt(0) - parseInt("ac00", 16)) % 28 > 0;

    if (josaType === "을를") {
        josa = hasBatchim ? "을" : "를";
    } else if (josaType === "이가") {
        josa = hasBatchim ? "이" : "가";
    } else if (josaType === "은는") {
        josa = hasBatchim ? "은" : "는";
    } else if (josaType === "와과") {
        josa = hasBatchim ? "과" : "와";
    } else if (josaType === "로으로") {
        josa = hasBatchim ? "으로" : "로";
    } else if (josaType === "라는이라는") {
        josa = hasBatchim ? "이라는" : "라는";
    };

    if (resultType === "WJS") {
        result = word + josa;
    } else if (resultType === "OJS") {
        result = josa;
    };

    return result;
}

/**
 * @param {string} verb - The verb to transform (e.g. "등록하기")
 * @return {string} The transformed verb (e.g. "등록할")
 */
function transformVerb(verb) {
    // If the verb ends with "하기"
    if (verb.endsWith("하기")) {
        return verb.slice(0, -2) + "할";
    }
    // For other cases (e.g. "만들기")
    else if (verb.endsWith("기")) {
        return verb.slice(0, -1);
    };
    
    return verb;
}

function findLabel(input) {
    let foundLabel;
    labels.forEach(label => {
        if (label.getAttribute("for") === String(input.id)) {
            foundLabel = label.innerText;
        };
    });
    return foundLabel;
}

function preventDefaultHandler(event) {
    event.preventDefault();
}

/**
 * @param {boolean} bool Freeze or Unfreeze active inputs and buttons
 */
function freezeForm(bool) {
    const id_query = document.getElementById("id_query");

    if (id_query) id_query.readOnly = bool;

    inputs.forEach(input => {
        if (input.classList.contains("alt-calendar")) {
            const calendar = code(input.id + "_calendar");

            if (bool) {
                calendar.classList.add("cursor-not-allowed");
                calendar.classList.replace("bg-white", "bg-gray-100");
            } else {
                calendar.classList.remove("cursor-not-allowed");
                calendar.classList.replace("bg-gray-100", "bg-white");
            };
        } else if (input.classList.contains("alt-radio")) {
            const originalInputs = document.querySelectorAll(`input[name="${input.id}"]`);
            let class_radios = document.querySelectorAll(".class-radio");

            originalInputs.forEach(input => {
                // invisible radio button
                if (input.classList.contains("sr-only")) {
                    const label = input.closest("label");

                    if (bool) {
                        label.classList.replace("hover:bg-gray-50", "bg-gray-100");
                        label.classList.replace("cursor-pointer", "cursor-not-allowed");
                    } else {
                        label.classList.replace("bg-gray-100", "hover:bg-gray-50");
                        label.classList.replace("cursor-not-allowed", "cursor-pointer");
                    };
                };

                bool ? class_radios.forEach(radio => { radio.disabled = true }) : class_radios.forEach(radio => { radio.disabled = false });
            });
        } else if (input.type === "text") {
            bool ? input.readOnly = true : input.readOnly = false;
        } else if (input.type === "checkbox") {
            bool ? input.disabled = true : input.disabled = false;
        } else {
            bool ? input.readOnly = true : input.readOnly = false;
        };
    });

    class_calendars.forEach(calendar => {
        if (bool) {
            calendar.classList.add("cursor-not-allowed");
            calendar.classList.replace("bg-white", "bg-gray-100");
        } else {
            calendar.classList.remove("cursor-not-allowed");
            calendar.classList.replace("bg-gray-100", "bg-white");
        };
    });

    buttons = document.querySelectorAll("button");

    buttons.forEach(button => {
        bool ? button.disabled = true : button.disabled = false;
    });

    const links = document.querySelectorAll("a");

    links.forEach(link => {
        const linkListItem = link.closest(".class-link-list-item");
        const linkId = link.dataset.linkId || `link-${Math.random().toString(36).substr(2, 9)}`;

        link.dataset.linkId = linkId;

        if (bool) {
            if (!originalClasses[linkId]) { originalClasses[linkId] = Array.from(link.classList) };
            if (!originalStyles[linkId]) { originalStyles[linkId] = link.getAttribute("style") || "" };

            const focusHoverClasses = Array.from(link.classList).filter(cls => cls.startsWith("hover:") || cls.startsWith("focus:"));

            focusHoverClasses.forEach(cls => { link.classList.remove(cls) });
            link.addEventListener("click", preventDefaultHandler);
            link.classList.add("cursor-not-allowed", "pointer-events-none");
            link.setAttribute("tabindex", "-1");
            link.blur();

            if (!link.querySelector(`span[data-blocker-id="${linkId}"]`)) {
                const span = document.createElement("span");
                span.classList.add("absolute", "inset-0", "bg-transparent", "pointer-events-auto", "cursor-not-allowed");
                span.dataset.blockerId = linkId;
                if (!link.classList.contains("absolute")) { link.style.position = "relative" };
                link.appendChild(span);
            };

            if (linkListItem) {
                const parentId = linkListItem.dataset.parentId || `parent-${Math.random().toString(36).substr(2, 9)}`;

                linkListItem.dataset.parentId = parentId;

                if (!originalParentClasses[parentId]) {
                    originalParentClasses[parentId] = Array.from(linkListItem.classList);
                };

                if (!originalParentStyles[parentId]) {
                    originalParentStyles[parentId] = linkListItem.getAttribute("style") || "";
                };

                linkListItem.classList.add("cursor-not-allowed");

                const parentHoverClasses = Array.from(linkListItem.classList).filter(cls => cls.startsWith("hover:"));

                parentHoverClasses.forEach(cls => {
                    linkListItem.classList.remove(cls);
                });

                linkListItem.addEventListener("click", preventDefaultHandler);
            };
        } else {
            if (originalClasses[linkId]) {
                link.className = originalClasses[linkId].join(" ");
                delete originalClasses[linkId];
                link.removeEventListener("click", preventDefaultHandler);

                const span = link.querySelector(`span[data-blocker-id="${linkId}"]`);

                if (span) { span.remove() };
                link.classList.remove("pointer-events-none");
                link.removeAttribute("tabindex");
                link.setAttribute("style", originalStyles[linkId]);
                delete originalStyles[linkId];
            };

            if (linkListItem) {
                const parentId = linkListItem.dataset.parentId;

                if (originalParentClasses[parentId]) {
                    linkListItem.className = originalParentClasses[parentId].join(" ");
                    delete originalParentClasses[parentId];
                };

                if (originalParentStyles[parentId]) {
                    linkListItem.setAttribute("style", originalParentStyles[parentId]);
                    delete originalParentStyles[parentId];
                };

                linkListItem.removeEventListener("click", preventDefaultHandler);
            };
        };
    });
}

/**
 * @param {array} array Input array to activate
 * @param {object} button Button element to act as submit button
 */
function initValidation(array, button) {
    inputs.length = 0;
    inputs.push(...array);

    inputs.forEach(input => {
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && input.type === "radio") {
                input.checked = true;
                if (lowercaseId(input).indexOf("category") !== -1) {
                    code("id_category").value = input.value;
                };
            } else if (event.key === "Enter") {
                button.click();
            };
        });
    });

    validate();
}

/**
 * @param {HTMLInputElement} input Input that needs to be validated
 * @returns {boolean}
 */
function isValid(input) {
    return input.type === "checkbox" ? input.checked : controlError(input) === false && code(input, "_descr").hidden && code(input, "_error").hidden;
}

function isItOkayToSubmitForm() {
    let class_radios = document.querySelectorAll(".class-radio");

    Array.from(class_radios).forEach(radio => {
        let idx = inputs.indexOf(radio);

        while (idx > -1) {
            inputs.splice(idx, 1);
            idx = inputs.indexOf(radio);
        };
    });

    filteredInputs = inputs.filter(isValid);

    return filteredInputs.length === inputs.length;
}

function trim(input) {
    /* 
     * input: Input whose value needs to be trimmed
     */

    return input.value = input.value.trim().replace(/\s{2,}/g, " ");
}

function lowercaseId(input) {
    return input.id.replace(/_/g, "").toLowerCase();
}

//
// Main functions
//

function validate() {
    eventTypes.forEach(type => {
        onlyHanguls.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotHangul, "");
            });
        });
        onlyNumbers.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "");
            });
        });
        onlyPhones.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "").replace(/(^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
            });
        });
        onlyDates.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotNumber, "").replace(/(^[0-9]{4})([0-9]+)?([0-9]{2})$/, "$1-$2-$3").replace("--", "-");
            });
        });
        onlyEmails.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regHangul, "");
                input.value = input.value.replace(" ", "");
            });
        });
        onlyUrls.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(" ", "");
            });
        });
        onlySlugs.forEach(input => {
            input.addEventListener(type, () => {
                input.value = input.value.replace(regNotLowerCaseRomanAndNumberAndHyphen, "");
                input.value = input.value.replace(" ", "");
            });
        });
    });

    inputs.forEach(input => {
        if (input.classList.contains("alt-calendar")) {
            const calendar = code(input.id + "_calendar");

            calendar.addEventListener("click", () => {
                displayError(false, input);
            });
            calendar.addEventListener("focusout", () => {
                controlError(input);
            });
            calendar.addEventListener("focusin", () => {
                displayError(false, input);
            });
        } else if (input.classList.contains("class-radio")) {
            const lastUnderscoreIndex = input.id.lastIndexOf("_");
            const altInput = code(input.id.substring(0, lastUnderscoreIndex));

            input.addEventListener("click", () => {
                displayError(false, altInput);
            });
            input.addEventListener("focusout", () => {
                controlError(altInput);
            });
            input.addEventListener("focusin", () => {
                displayError(false, altInput);
            });
        } else {
            input.addEventListener("click", () => {
                displayError(false, input);
            });
            input.addEventListener("keydown", event => {
                displayError(false, input);
                controlDescr(input, event);
            });
            input.addEventListener("focusout", () => {
                trim(input);
                displayDescr(false, input);
                controlError(input);
            });
            input.addEventListener("focusin", () => {
                trim(input);
                displayError(false, input);
            });
        };
    });
}

function controlDescr(input, event) {
    let inputKeyChar = event.key;

    // only-hangul
    if (input.classList.contains("only-hangul")) {
        if (regNotHangul.test(input.value) ||
            (!event.isComposing && allowedKeys.indexOf(inputKeyChar) === -1)) {
            displayDescr(true, input, "only hangul");
        } else {
            displayDescr(false, input);
        };
    };

    // only-number
    if (input.classList.contains("only-number")) {
        if (regNotNumber.test(input.value) ||
            (regNotNumber.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) === -1)) {
            displayDescr(true, input, "only number");
        } else {
            displayDescr(false, input);
        };
    };

    // only-phone, only-date
    if (input.classList.contains("only-phone") || input.classList.contains("only-date")) {
        if (regNotNumberWithDash.test(input.value) ||
            (regNotNumberWithDash.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) === -1)) {
            displayDescr(true, input, "only number");
        } else {
            displayDescr(false, input);
        };
    };

    // only-slug
    if (input.classList.contains("only-slug")) {
        if (regNotLowerCaseRomanAndNumberAndHyphen.test(input.value) ||
            (regNotLowerCaseRomanAndNumberAndHyphen.test(inputKeyChar) && allowedKeys.indexOf(inputKeyChar) === -1) ||
            (event.isComposing && allowedKeys.indexOf(inputKeyChar) === -1)) {
            displayDescr(true, input, "only lower roman and number and hyphen");
        } else {
            displayDescr(false, input);
        };
    };

    // only-email
    if (input.classList.contains("only-email")) {
        if (event.isComposing && allowedKeys.indexOf(inputKeyChar) === -1) {
            displayDescr(true, input, "no hangul");
        } else {
            displayDescr(false, input);
        };
    };

    // only-url
    if (input.classList.contains("only-url")) {
        if (input.value.length >= 8 &&
            (input.value.indexOf("http://") === -1 && input.value.indexOf("https://") === -1)) {
            input.value = `http://${input.value}`;
        };
    };

    // space-allowed
    if (!input.classList.contains("space-allowed")) {
        if (inputKeyChar === " ") {
            displayDescr(true, input, "no space");
        };
    };
}

function displayDescr(bool, input, descrType) {
    /* 
     * bool: Show/hide description
     * input: Target input
     * descrType: "only hangul", "only number", "only lower roman and number and hyphen", "no hangul", "no space"
     */

    let descrMsg = code(input, "_descr");

    if (bool === true) {
        // Show description
        let sentence;
        if (descrType === "only hangul") {
            sentence = "한글만 입력해주세요.";
        } else if (descrType === "only number") {
            sentence = "숫자만 입력해주세요.";
        } else if (descrType === "only lower roman and number and hyphen") {
            sentence = "로마자 소문자, 숫자, 하이픈만 입력해주세요.";
        } else if (descrType === "no hangul") {
            sentence = "로마자, 숫자, 특수문자만 입력해주세요.";
        } else if (descrType === "no space") {
            sentence = "공백은 입력될 수 없어요.";
        };
        descrMsg.innerText = `${sentence}`;
        descrMsg.hidden = false;

    } else if (bool === false) {
        // Hide description
        descrMsg.innerText = null;
        descrMsg.hidden = true;
    };
}

function controlError(input) {
    // checkbox
    if (input.type === "checkbox") {
        if (input.classList.contains("agree-checkbox") && input.checked === false) {
            displayError(true, input, "disagree");
        } else if (input.classList.contains("default-checkbox") && input.checked === false) {
            displayError(true, input, "unchecked");
        } else {
            return false;
        };
    };

    // alt-select
    if (input.classList.contains("alt-select")) {
        if (input.value === "") {
            displayError(true, input, "unselected");
        } else {
            return false;
        };
    }

    // alt-calendar
    if (input.classList.contains("alt-calendar")) {
        if (input.value.length === 0) {
            displayError(true, input, "unselected");
        } else if (input.value.indexOf(",") === -1) {
            displayError(true, input, "unselected");
        } else {
            return false;
        };
    };

    // alt-radio
    if (input.classList.contains("alt-radio")) {
        if (input.value === "") {
            displayError(true, input, "unselected");
        } else {
            return false;
        };
    };

    // tel
    if (input.type === "tel") {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 13) {
            displayError(true, input, "insufficient");
        } else if (input.value.indexOf("-") !== 3 && input.value.lastIndexOf("-") !== 8) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // text (student ID)
    if (lowercaseId(input).indexOf("studentid") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 10) {
            displayError(true, input, "insufficient");
        } else if (Number(input.value.substr(0, 4)) > now.getFullYear()) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // text (name)
    if (lowercaseId(input).indexOf("name") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length === 1) {
            displayError(true, input, "insufficient");
        } else if (!input.value.match(regHangul)) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // text (email)
    if (lowercaseId(input).indexOf("email") !== -1 && lowercaseId(input).indexOf("vcode") === -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.indexOf("@") === -1 ||
            input.value.split("@")[0].length <= 1 ||
            input.value.split("@")[1].indexOf(".") === -1 ||
            input.value.split("@")[1].split(".")[0].length <= 1 ||
            input.value.split("@")[1].split(".")[1].length <= 1 ||
            (input.value.split("@")[1].split(".").length - 1 === 2 && input.value.split("@")[1].split(".")[2].length <= 1 && input.value.substr(-1) !== ".")) {
            displayError(true, input, "insufficient");
        } else if (!input.value.match(regEmail)) {
            displayError(true, input, "invalid");
        } else {
            return false;
        };
    };

    // text (vcode)
    if (lowercaseId(input).indexOf("vcode") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 6) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // text (url)
    if (lowercaseId(input).indexOf("url") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.indexOf("https://") === -1 && input.value.indexOf("http://") === -1) {
            input.value = `http://${input.value}`;
        } else if (!input.value.match(regUrl)) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // text (slug)
    if (lowercaseId(input).indexOf("slug") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length < 2) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // text (film title)
    if (lowercaseId(input).indexOf("title") !== -1 && input.classList.contains("class-film")) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (!(input.value.startsWith("<") && input.value.endsWith(">"))) {
            displayError(true, input, "no parentheses");
        } else if (input.value.length < 4) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // text (title)
    if (lowercaseId(input).indexOf("title") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.replace(/\s/g, "").length === 0) {
            displayError(true, input, "empty")
        } else if (input.value.length < 2) {
            displayError(true, input, "insufficient");
        } else {
            return false;
        };
    };

    // text (date)
    if (lowercaseId(input).indexOf("date") !== -1) {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else if (input.value.length !== 10) {
            displayError(true, input, "insufficient");
        } else if (!validateDate(input)) {
            displayError(true, input, "invalid");
        } else if (input.getAttribute("min") !== null && input.getAttribute("max") !== null &&
            (Number(input.value.replace(/-/g, "")) < Number(input.getAttribute("min").replace(/-/g, "")) ||
                Number(input.value.replace(/-/g, "")) > Number(input.getAttribute("max").replace(/-/g, "")))) {
            displayError(true, input, "out of range");
        } else {
            return false;
        };
    };

    // textarea
    if (input.type === "textarea") {
        if (input.value.length === 0) {
            displayError(true, input, "empty");
        } else {
            return false;
        };
    };

    return true;
}

/**
 * @param {boolean} bool Show/hide error
 * @param {object} input Target input
 * @param {string} errorType Type of error
 * - "disagree"
 * - "unchecked"
 * - "unselected"
 * - "empty"
 * - "insufficient"
 * - "invalid"
 * - "inappropriate"
 * - "out of range"
 */
function displayError(bool, input, errorType = null) {
    let errorMsg = code(input, "_error");

    // Change input's style and show error
    if (bool === true) {
        let subject;
        let narrativeClause;

        // checkbox
        if (input.type === "checkbox") {
            input.classList.remove("border-gray-300");
            input.classList.add("bg-flamingo-50");
            input.classList.add("border-4");
            input.classList.add("border-flamingo-300");
        }

        // id_content in Notice app
        else if (input.id === "id_content" && appName === "notice") {
            const content = document.querySelector("div[role='textbox']");

            content.style.setProperty("background-color", "#FCDBCF", "important");
            content.style.setProperty("--tw-ring-opacity", "0", "important");
        }

        // alt-calendar
        else if (input.classList.contains("alt-calendar")) {
            const calendar = code(input.id + "_calendar");

            calendar.classList.remove("bg-white");
            calendar.classList.remove("df-ring-inset-gray");
            calendar.classList.add("bg-flamingo-50");
            calendar.classList.add("ring-transparent");
        }

        // alt-radio
        else if (input.classList.contains("alt-radio")) {
            const originalInputs = document.querySelectorAll(`input[name="${input.id}"]`);

            originalInputs.forEach(input => {
                // invisible radio button
                if (input.classList.contains("sr-only")) {
                    let label = input.closest("label");

                    label.classList.replace("df-ring-inset-gray", "bg-flamingo-50");
                    label.classList.add("hover:df-ring-inset-gray");
                }
                // visible radio button
                else {
                    input.classList.remove("border-gray-300");
                    input.classList.add("bg-flamingo-50");
                    input.classList.add("border-4");
                    input.classList.add("border-flamingo-300");
                };
            });
        }

        // alt-select
        else if (input.classList.contains("alt-select")) {
            const select = document.getElementById(`id_select_${input.id.replace("id_", "")}`);
            // Not sure why this conditional exists
        }

        // else
        else {
            input.classList.remove("ring-gray-300");
            input.classList.add("bg-flamingo-50");
            input.classList.add("ring-transparent");
        };

        if (errorType === "disagree") {
            subject = findLabel(input).replace(" 동의합니다.", "")
            narrativeClause = "동의해주세요.";
        } else if (errorType === "unchecked") {
            subject = matchJosa(`${findLabel(input)}`, "을를", "WJS");
            narrativeClause = "체크해주세요.";
        } else if (errorType === "unselected") {
            subject = matchJosa(`${findLabel(input)}`, "을를", "WJS");
            narrativeClause = "선택해주세요.";
        } else if (errorType === "empty") {
            subject = matchJosa(findLabel(input), "을를", "WJS");
            narrativeClause = "입력해주세요.";
        } else if (errorType === "insufficient") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "덜 입력된 것 같아요.";
        } else if (errorType === "invalid") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = "잘못 입력된 것 같아요.";
        } else if (errorType === "inappropriate") {
            subject = matchJosa(findLabel(input), "을를", "WJS");
            narrativeClause = "수정해주세요.";
        } else if (errorType === "no parentheses") {
            subject = matchJosa(findLabel(input), "을를", "WJS");
            narrativeClause = `화살괄호 <, >로 감싸주세요.`;
        } else if (errorType === "out of range") {
            subject = matchJosa(findLabel(input), "이가", "WJS");
            narrativeClause = `유효 범위를 벗어났어요.`;
        };

        errorMsg.innerText = `${subject} ${narrativeClause}`;
        errorMsg.hidden = false;
    }

    // Init input's style and hide error
    else if (bool === false) {
        // checkbox
        if (input.type === "checkbox") {
            input.classList.add("border-gray-300");
            input.classList.remove("bg-flamingo-50");
            input.classList.remove("border-4");
            input.classList.remove("border-flamingo-300");
        }

        // alt-calendar
        else if (input.classList.contains("alt-calendar")) {
            const calendar = code(input.id + "_calendar");

            calendar.classList.add("bg-white");
            calendar.classList.add("df-ring-inset-gray");
            calendar.classList.remove("bg-flamingo-50");
            calendar.classList.remove("ring-transparent");
        }

        // alt-radio
        else if (input.classList.contains("alt-radio")) {
            const originalInputs = document.querySelectorAll(`input[name="${input.id}"]`);

            originalInputs.forEach(input => {
                // invisible radio button
                if (input.classList.contains("sr-only")) {
                    let label = input.closest("label");

                    label.classList.replace("bg-flamingo-50", "df-ring-inset-gray");
                    label.classList.remove("hover:df-ring-inset-gray");
                }
                // visible radio button
                else {
                    input.classList.add("border-gray-300");
                    input.classList.remove("bg-flamingo-50");
                    input.classList.remove("border-4");
                    input.classList.remove("border-flamingo-300");
                };
            });
        }

        // alt-select
        else if (input.classList.contains("alt-select")) {
            const select = document.getElementById(`id_select_${input.id.replace("id_", "")}`);
            // Not sure why this conditional exists
        }

        // else
        else {
            input.classList.add("ring-gray-300");
            input.classList.remove("bg-flamingo-50");
            input.classList.remove("ring-transparent");
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
    if (type === "descr") {
        msg = code(button, "_descr");
    } else if (type === "error") {
        msg = code(button, "_error");
    };

    // Write and show/hide description/error
    if (bool === true) {
        msg.innerText = text;
        msg.hidden = false;
    } else if (bool === false) {
        msg.innerText = null;
        msg.hidden = true;
    };
}

function handleFocusForModal(isModalOpen, modal) {
    let focusableElements;
    let tabIndexStorage = JSON.parse(sessionStorage.getItem("focusableItems")) || [];

    if (isModalOpen) {
        lastFocusedElement = document.activeElement;

        focusableElements = document.querySelectorAll("a, button, input, textarea, select, details, [tabindex]:not([tabindex='-1'])");
        focusableElements.forEach((element, index) => {
            if (!modal.contains(element)) {
                if (element.getAttribute("tabindex") === "0") {
                    element.dataset.focusIndex = index;
                    tabIndexStorage.push(index);
                };
                element.setAttribute("tabindex", "-1");
            };
        });

        sessionStorage.setItem("focusableItems", JSON.stringify(tabIndexStorage));
    } else {
        focusableElements = document.querySelectorAll("a, button, input, textarea, select, details");
        focusableElements.forEach(element => {
            element.removeAttribute("tabindex");
        });

        tabIndexStorage.forEach(index => {
            const element = document.querySelector(`[data-focus-index='${index}']`);
            if (element) {
                element.setAttribute("tabindex", "0");
                element.removeAttribute("data-focus-index");
            };
        });

        sessionStorage.removeItem("focusableItems");

        let id_notice_detail_option_menu = document.getElementById("id_notice_detail_option_menu");
        let id_notice_detail_option_button = document.getElementById("id_notice_detail_option_button");

        if (lastFocusedElement) {
            if (lastFocusedElement === id_notice_detail_option_menu) {
                lastFocusedElement = id_notice_detail_option_button;
            };

            setTimeout(() => { lastFocusedElement.focus() }, 300);
            setTimeout(() => { window.scrollTo(0, parseInt(sessionStorage.getItem("scrollPosition")), { behavior: "instant" }) }, 0.00001);
        };
    };
}
