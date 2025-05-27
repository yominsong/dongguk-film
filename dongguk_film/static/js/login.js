//
// Global variables
//

const id_login_request_msg = document.getElementById("id_login_request_msg");


//
// Main functions
//

function blockInAppBrowser() {
    let login_google = document.querySelector("#login_google");
    let agent = navigator.userAgent.toLowerCase();
    let boolean, app;

    if ((agent.indexOf("kakaotalk")) !== -1) {
        [boolean, app] = [true, "카카오톡"];
    } else if ((agent.indexOf("naver")) !== -1) {
        [boolean, app] = [true, "네이버"];
    } else if ((agent.indexOf("fban")) !== -1 || (agent.indexOf("fbav")) !== -1) {
        [boolean, app] = [true, "페이스북"];
    } else if ((agent.indexOf("instagram")) !== -1) {
        [boolean, app] = [true, "인스타그램"];
    };

    if (boolean == true) {
        login_google.href = "#";
        login_google.addEventListener("mousedown", () => {
            displayNoti(true, "UNABLE_TO_LOGIN_WITH_GOOGLE", app);
        });
    };
}

blockInAppBrowser();

function displayLoginRequestMsg() {
    const loginRequestMsg = urlParams.get("loginRequestMsg");
    const next = urlParams.get("next");

    if (loginRequestMsg) {
        if (loginRequestMsg === "checkout") {
            id_login_request_msg.innerText = "기자재를 대여하려면";
        } else if (loginRequestMsg === "createProject") {
            id_login_request_msg.innerText = "프로젝트를 새로 등록하려면";
        } else if (loginRequestMsg === "createDflink") {
            id_login_request_msg.innerText = "동영링크를 새로 만들려면";
        } else if (loginRequestMsg === "createNotice") {
            id_login_request_msg.innerText = "공지사항을 새로 작성하려면";
        };
    } else if (!isAuthenticated() && next && next.includes("account")) {
        id_login_request_msg.innerText = "내 계정 서비스를 이용하려면";
    };
}

displayLoginRequestMsg();

function resetSignInForm() {
    document.addEventListener("DOMContentLoaded", function() {
        const form = document.querySelector("form");
        const errorMessages = document.querySelectorAll(".text-flamingo-600");
        
        form.addEventListener("submit", function() {
            errorMessages.forEach(error => {
                error.style.display = "none";
            });
            
            const inputs = form.querySelectorAll("input, textarea, select");
            inputs.forEach(input => {
                input.readOnly = true;
            });
            
            const buttons = form.querySelectorAll("button");
            buttons.forEach(button => {
                button.disabled = true;
            });
        });
    });
}

resetSignInForm();