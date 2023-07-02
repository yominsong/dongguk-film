function blockInAppBrowser() {
    let agent = navigator.userAgent.toLowerCase();
    let boolean, app;
    if ((agent.indexOf("kakaotalk")) !== -1) {
        boolean = true;
        app = "카카오톡";
    } else if ((agent.indexOf("naver")) !== -1) {
        boolean = true;
        app = "네이버";
    } else if ((agent.indexOf("fban")) !== -1 || (agent.indexOf("fbav")) !== -1) {
        boolean = true;
        app = "페이스북";
    } else if ((agent.indexOf("instagram")) !== -1) {
        boolean = true;
        app = "인스타그램";
    };
    if (boolean == true) {
        controlNoti("blockInAppBrowser", app);
    };
}

blockInAppBrowser();