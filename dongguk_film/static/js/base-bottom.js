//
// Global constants and variables
//

let timer;
let clickCount = 0;
let urls = document.querySelectorAll(".class-url");

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
        params.next = `${location.pathname}${location.search}`;
        if (typeof loginLogout.dataset.loginRequestMsg !== "undefined") {
            params.loginRequestMsg = location.pathname;
        };
        loginLogout.href += "?" + new URLSearchParams(params).toString();
    });
}

redirectAfterLoginLogout();

function announceConstruction() {
    let ucs = document.querySelectorAll(".under-construction");

    ucs.forEach(uc => {
        ["click", "keyup"].forEach(type => {
            uc.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    if (timer) { clearTimeout(timer) };
                    clickCount++;
                    if (clickCount > 5) { clickCount = 1 };
                    let message = "";
                    switch (clickCount) {
                        case 1:
                            message = "분명 언젠가는...";
                            break;
                        case 2:
                            message = "장담할 순 없지만...";
                            break;
                        case 3:
                            message = "학우 여러분을 위해...";
                            break;
                        case 4:
                            message = "늦더라도 제대로 만들어서...";
                            break;
                        case 5:
                            message = "제 몸을 갈아서라도...";
                            break;
                    };
                    displayNoti(true, "NUC", message);
                    timer = setTimeout(() => { displayNoti(false, "NUC") }, 3000);
                };
            });
        });
    });
}

announceConstruction();

function copyUrl() {
    urls.forEach(url => {
        ["click", "keyup"].forEach(type => {
            url.addEventListener(type, async (event) => {
                if (type == "click" || event.key == "Enter") {
                    let srOnlySpan = document.createElement("span");
                    let originalUrlValue;

                    srOnlySpan.className = "sr-only";
                    srOnlySpan.textContent = "\u00A0URL\u00A0복사하기";

                    url.removeChild(url.querySelector(".sr-only"));
                    originalUrlValue = url.innerText;

                    try {
                        await navigator.clipboard.writeText(url.innerText);
                    } catch (e) {
                        let textarea = document.createElement("textarea");
                        textarea.value = url.innerText;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy"); // deprecated, but used for KakaoTalk in-app browser
                        document.body.removeChild(textarea);
                    };

                    url.innerText = "URL이 클립보드에 복사되었어요.";
                    url.classList.add("blink");

                    setTimeout(() => {
                        url.classList.remove("blink");
                        url.innerText = originalUrlValue;
                        url.appendChild(srOnlySpan);
                    }, 3000);
                };
            });
        });
    });
}

if (urls) { copyUrl() };