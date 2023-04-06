function hideNavbarAndFooter() {
    let httpStatusCode = document.querySelector("#http_status_code");
    if (location.pathname.indexOf("accounts") != -1 ||
        httpStatusCode != null) {
        navbar.hidden = true;
        footer.hidden = true;
    };
}

hideNavbarAndFooter();