//
// Sub functions
//

function hideNavbarAndFooter() {
    let httpStatusCode = document.querySelector("#http_status_code");

    if (location.pathname.indexOf("accounts") != -1 ||
        httpStatusCode != null) {
        navbar.hidden = true;
        footer.hidden = true;
    };
}

hideNavbarAndFooter();

function redirectAfterLoginLogout() {
    let loginsLogouts = document.querySelectorAll(".login-button, .logout-button");
    let params = {};

    loginsLogouts.forEach((loginLogout) => {
        if (loginLogout.dataset.loginRequestMsg != undefined) {
            params.loginRequestMsg = loginLogout.dataset.loginRequestMsg;
        };
        params.next = location.pathname;
        loginLogout.href += "?" + new URLSearchParams(params).toString();
    });
}

redirectAfterLoginLogout();