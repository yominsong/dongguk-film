//
// Global variables
//

const id_agree = document.getElementById("id_agree");
const id_student_id = document.getElementById("id_student_id");
const id_name = document.getElementById("id_name");
const id_email = document.getElementById("id_email");
const id_phone = document.getElementById("id_phone");
const id_create = document.getElementById("id_create");

const id_email_vcode = document.getElementById("id_email_vcode");
const id_phone_vcode = document.getElementById("id_phone_vcode");
const id_confirm = document.getElementById("id_confirm");

const class_firsts = document.querySelectorAll(".class-first");
const class_seconds = document.querySelectorAll(".class-second");

//
// Sub functions
//

function displaySocialAccount() {
    const id_picture = document.getElementById("id_picture");
    const id_provider_name = document.getElementById("id_provider_name");
    const id_last_name = document.getElementById("id_last_name"); // Get a user's profile picture URL and provider name
    const id_first_name = document.getElementById("id_first_name"); // Get a user's full name

    const extraData = id_last_name.value.split("#");
    const pictureUrl = extraData[0];
    const providerName = extraData[1];

    id_picture.src = pictureUrl;
    id_picture.alt = `${providerName} 계정 프로필 사진`;
    id_provider_name.innerText = providerName;
    id_name.value = id_first_name.value;
}

displaySocialAccount();

//
// Main functions
//

function requestCreateVcodeForSNP() {
    request.url = `${location.origin}/users/utils/vcode/`;
    request.type = "POST";
    request.data = { id: "create_vcode_for_SNP", agree: `${id_agree.checked}`, student_id: `${id_student_id.value}`, name: `${id_name.value}`, email: `${id_email.value}`, phone: `${id_phone.value}` };
    request.async = true;
    request.headers = null;
    code(id_create, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function requestConfirmVcodeForSNP() {
    request.url = `${location.origin}/users/utils/vcode/`;
    request.type = "POST";
    request.data = { id: "confirm_vcode_for_SNP", agree: `${id_agree.checked}`, student_id: `${id_student_id.value}`, name: `${id_name.value}`, email: `${id_email.value}`, phone: `${id_phone.value}`, email_vcode: `${id_email_vcode.value}`, phone_vcode: `${id_phone_vcode.value}` };
    request.async = true;
    request.headers = null;
    code(id_confirm, "_spin").classList.remove("hidden");
    freezeForm(true);
    makeAjaxCall(request);
    request = {};
}

function initRequest() {
    window.addEventListener("pageshow", () => {
        initValidation(class_firsts, id_create);

        id_create.addEventListener("click", () => {
            if (isItOkayToSubmitForm()) {
                requestCreateVcodeForSNP();
                displayButtonMsg(false, id_create, "descr");
                displayButtonMsg(false, id_create, "error");
            } else {
                inputs.forEach((input) => {
                    controlError(input);
                });
            };

            ["keydown", "focusin"].forEach((type) => {
                inputs.forEach((input) => {
                    input.addEventListener(type, () => {
                        displayButtonMsg(false, id_create, "error");
                    });
                });
            });
        });

        id_confirm.addEventListener("click", () => {
            if (isItOkayToSubmitForm()) {
                requestConfirmVcodeForSNP();
                displayButtonMsg(false, id_confirm, "error");
            } else {
                inputs.forEach((input) => {
                    controlError(input);
                });
            };

            ["keydown", "focusin"].forEach((type) => {
                inputs.forEach((input) => {
                    input.addEventListener(type, () => {
                        displayButtonMsg(false, id_confirm, "error");
                    });
                });
            });
        });
    });
}

initRequest();