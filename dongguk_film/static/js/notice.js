//
// Sub functions
//

function initNoticeForm() {
    // id_title.value = null;
    id_category.value = null;
    id_category_serv.checked = false;
    id_category_dept.checked = false;
    inputs.forEach((input) => {
        displayError(false, input);
    });
    displayButtonMsg(false, id_create_or_update_notice, "error");
    displayButtonMsg(false, id_delete_notice, "error");
}

function controlNoticeModal() {
    let class_opens = document.querySelectorAll(".class-open");
    let class_keywords = document.querySelectorAll(".class-keyword");
    let class_adjusts = document.querySelectorAll(".class-adjust");

    class_opens.forEach(open => {
        // All users
        ["click", "keyup"].forEach(type => {
            open.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter") {
                    id_notice_modal.hidden = false;
                    class_keywords.forEach(keyword => {
                        keyword.innerText = "작성하기";
                    });
                    initNoticeForm();
                    id_delete_notice.classList.replace("inline-flex", "hidden");
                    id_notice_modal.setAttribute("x-data", "{ open: true }");
                }
            });
        });

        // Authenticated users
        class_adjusts.forEach(adjust => {
            if (open == adjust) {
                ["click", "keyup"].forEach(type => {
                    adjust.addEventListener(type, (event) => {
                        if (type == "click" || event.key == "Enter") {
                            let notice_id = adjust.id.replace("id_adjust_notice_", "");
                            let notice = code("id_notice_", notice_id).value.split(",");
                            class_keywords.forEach(keyword => {
                                keyword.innerText = "수정하기";
                            });
                            // id_title.value = notice[3];
                            if (notice[4] == "서비스") {
                                id_category.value = "서비스";
                                id_category_serv.checked = true;
                            } else if (notice[4] == "학과") {
                                id_category.value = "학과";
                                id_category_dept.checked = true;
                            };
                            id_delete_notice.classList.replace("hidden", "inline-flex");
                        };
                    });
                });
            };
        });
    });
}

controlNoticeModal();

function adjustWidth() {
    function matchDivWidths() {
        let id_search_box = document.getElementById("id_search_box");
        let id_notice_modal_body = document.getElementById("id_notice_modal_body");
        let id_search_parent = document.getElementById("id_search_parent");
        let id_content_parent = document.getElementById("id_content_parent");
        id_notice_modal_body.style.setProperty("width", id_search_box.offsetWidth + "px", "important");
        id_content_parent.style.setProperty("width", id_search_parent.offsetWidth + "px", "important");
    }
    window.addEventListener("resize", matchDivWidths);
    matchDivWidths();
}

adjustWidth();

//
// Main functions
//

// None