function blockInAppBrowser() {
    let login_google = document.querySelector("#login_google");
    let agent = navigator.userAgent.toLowerCase();
    let boolean, app;

    login_google.addEventListener("mousedown", () => {
        if ((agent.indexOf("kakaotalk")) !== -1) {
            boolean, app = true, "카카오톡";
        } else if ((agent.indexOf("naver")) !== -1) {
            boolean, app = true, "네이버";
        } else if ((agent.indexOf("fban")) !== -1 || (agent.indexOf("fbav")) !== -1) {
            boolean, app = true, "페이스북";
        } else if ((agent.indexOf("instagram")) !== -1) {
            boolean, app = true, "인스타그램";
        };

        if (boolean == true) {
            controlNoti("blockInAppBrowser", app);
        };
    });
}

blockInAppBrowser();