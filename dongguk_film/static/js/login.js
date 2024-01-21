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
            displayNoti(true, "RBG", app);
        });
    };
}

blockInAppBrowser();

function displayLoginRequestMsg() {
    let urlParams = new URLSearchParams(window.location.search);
    let loginRequestMsg = urlParams.get("loginRequestMsg");
    if (loginRequestMsg) {
        if (loginRequestMsg.includes("dflink")) {
            id_login_request_msg.innerText = "동영링크를 새로 만들려면";
        } else if (loginRequestMsg.includes("notice")) {
            id_login_request_msg.innerText = "공지사항을 새로 작성하려면";
        };
    };
}

displayLoginRequestMsg();