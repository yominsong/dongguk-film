function hideNavbarAndFooter() {
    if (location.pathname.indexOf("accounts") != -1 ||
        document.querySelector("#http_status_code").innerText == "400 Bad Request" ||
        document.querySelector("#http_status_code").innerText == "404 Not Found" ||
        document.querySelector("#http_status_code").innerText == "408 Request Timeout" ||
        document.querySelector("#http_status_code").innerText == "500 Internal Server Error" ||
        document.querySelector("#http_status_code").innerText == "502 Bad Gateway") {
        navbar.hidden = true;
        footer.hidden = true;
    };
}

hideNavbarAndFooter();