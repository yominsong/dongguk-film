function hideNavbarAndFooter() {
    if (location.pathname.indexOf("accounts") != -1) {
        navbar.hidden = true;
        footer.hidden = true;
    };
}

hideNavbarAndFooter();