//
// Global variables
//

const class_urls = document.querySelectorAll(".class-url");

let timer;
let clickCount = 0;

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

function goToAccount() {
    if (!isAuthenticated()) return;

    const id_go_to_account = document.getElementById("id_go_to_account");

    if (id_go_to_account === null) return;

    id_go_to_account.addEventListener("click", () => {
        location.href = `${location.origin}/account/`;
    });
}

goToAccount();

function updateEquipmentAppLink() {
    const cart = getCart();

    if (cart === null || cart.length === 0) return;

    const class_equipment_app_links = document.querySelectorAll(".class-equipment-app-link");
    const purposeInCart = cart[0].purpose.priority;
    const periodInCart = cart[0].period;

    class_equipment_app_links.forEach((link) => {
        link.href = `/equipment/?categoryPriority=A&purposePriority=${purposeInCart}&period=${periodInCart}`;
    });
}

updateEquipmentAppLink();

function redirectAfterLoginLogout() {
    const loginsLogouts = document.querySelectorAll(".login-button, .logout-button");
    let params = {};

    loginsLogouts.forEach((loginLogout) => {
        const loginRequestMsg = loginLogout.dataset.loginRequestMsg;

        params.next = `${location.pathname}${location.search}`;

        if (loginRequestMsg !== "" && typeof loginRequestMsg !== "undefined") {
            params.loginRequestMsg = loginRequestMsg;
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

function copyDflinkUrl() {
    if (class_urls !== null) {
        class_urls.forEach(url => {
            const originalInnerHTML = url.innerHTML;
            let isInCopiedState = false;

            const showFullText = () => {
                if (!isInCopiedState) {
                    if (url.innerHTML.indexOf("not-sr-only") == -1) {
                        url.innerHTML = url.innerHTML.replace("sr-only", "not-sr-only");
                    };
                }
            };

            const revertToOriginalInnerHTML = () => {
                if (!isInCopiedState) {
                    url.innerHTML = originalInnerHTML;
                }
            };

            url.addEventListener("focus", showFullText);
            url.addEventListener("blur", revertToOriginalInnerHTML);
            url.addEventListener("mouseover", showFullText);
            url.addEventListener("mouseout", revertToOriginalInnerHTML);

            ["click", "keyup"].forEach(type => {
                url.addEventListener(type, async (event) => {
                    if (type === "click" || event.key === "Enter" || event.key === " ") {
                        const data = url.dataset;

                        isInCopiedState = true;

                        try {
                            await navigator.clipboard.writeText(data.dflinkUrl);
                        } catch (e) {
                            let textarea = document.createElement("textarea");
                            textarea.value = data.dflinkUrl;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand("copy"); // Deprecated, but used for KakaoTalk in-app browser
                            document.body.removeChild(textarea);
                        }

                        url.innerHTML = "URL이 클립보드에 복사되었어요.";
                        url.classList.add("blink");

                        setTimeout(() => {
                            url.classList.remove("blink");
                            url.innerHTML = originalInnerHTML;
                            isInCopiedState = false;
                        }, 3000);
                    }
                });
            });
        });
    };
}

copyDflinkUrl();