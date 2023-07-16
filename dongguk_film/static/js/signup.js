let fullName = id_first_name.value;
let extraData = id_last_name.value.split("#");
let pictureUrl = extraData[0];
let providerName = extraData[1];
let providerNames = document.querySelectorAll(".provider-name");
let stepOnes = document.querySelectorAll(".step-one");
let stepTwos = document.querySelectorAll(".step-two");
let filteredInputs = [];

//
// Sub functions
//

function displaySocialAccount() {
    id_picture.setAttribute("src", pictureUrl);
    id_picture.setAttribute("alt", `${providerName} 계정 프로필 사진`);
    providerNames.forEach((blank) => {
        blank.innerText = providerName;
    });
    id_name.value = fullName;
}

displaySocialAccount();

//
// Main functions
//

function requestCreateVcodeForSNP() {
    request.url = `${originLocation}/users/utils/vcode`;
    request.type = "POST";
    request.data = { id: "create_vcode_for_SNP", agree: `${id_agree.checked}`, student_id: `${id_student_id.value}`, name: `${id_name.value}`, email: `${id_email.value}`, phone: `${id_phone.value}` };
    request.async = true;
    request.headers = null;
    code(id_create_vcode, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestConfirmVcodeForSNP() {
    request.url = `${originLocation}/users/utils/vcode`;
    request.type = "POST";
    request.data = { id: "confirm_vcode_for_SNP", agree: `${id_agree.checked}`, student_id: `${id_student_id.value}`, name: `${id_name.value}`, email: `${id_email.value}`, phone: `${id_phone.value}`, email_vcode: `${id_email_vcode.value}`, phone_vcode: `${id_phone_vcode.value}` };
    request.async = true;
    request.headers = null;
    code(id_confirm_vcode, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function setPage() {
    // Step one (first)
    initValidation(stepOnes, id_create_vcode);
    id_create_vcode.addEventListener("click", () => {
        filteredInputs = inputs.filter(isValid);
        if (filteredInputs.length == inputs.length) {
            requestCreateVcodeForSNP();
            displayButtonMsg(false, id_create_vcode, "descr");
            displayButtonMsg(false, id_create_vcode, "error");
        } else {
            inputs.forEach((input) => {
                controlError(input);
            });
        };
        ["keydown", "focusin"].forEach((type) => {
            inputs.forEach((input) => {
                input.addEventListener(type, () => {
                    displayButtonMsg(false, id_create_vcode, "error");
                });
            });
        });
    });

    // Step two (last)
    id_confirm_vcode.addEventListener("click", () => {
        filteredInputs = inputs.filter(isValid);
        if (filteredInputs.length == inputs.length) {
            requestConfirmVcodeForSNP();
            displayButtonMsg(false, id_confirm_vcode, "error");
        } else {
            inputs.forEach((input) => {
                controlError(input);
            });
        };
        ["keydown", "focusin"].forEach((type) => {
            inputs.forEach((input) => {
                input.addEventListener(type, () => {
                    displayButtonMsg(false, id_confirm_vcode, "error");
                });
            });
        });
    });
}

setPage();