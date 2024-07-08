//
// Main functions
//

function searchItem() {
    function handleUserRequest(event) {
        const userRequestIsMade = 
            event.type === "click" || 
            (event.type === "keyup" && (event.key === "Enter" || event.key === " "));
        
        if (userRequestIsMade) {
            const locationOrigin = location.origin;
            const pathname = this.getAttribute("data-pathname");
            const query = this.getAttribute("data-query");

            document.location.href = `${locationOrigin}${pathname}?q=${query}`;
        };
    }

    function addEventListeners(elements) {
        elements.forEach(element => {
            element.addEventListener("click", handleUserRequest);
            element.addEventListener("keyup", handleUserRequest);
        });
    }

    const class_search_dflink = document.querySelectorAll(".class-search-dflink");
    const class_search_notice = document.querySelectorAll(".class-search-notice");

    addEventListeners(class_search_dflink);
    addEventListeners(class_search_notice);
}

searchItem();