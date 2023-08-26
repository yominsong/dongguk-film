//
// Global constants and variables
//

const id_go_to_list = document.getElementById("id_go_to_list");

//
// Sub functions
//

function goToList() {
    ["click", "keyup"].forEach(type => {
        id_go_to_list.addEventListener(type, (event) => {
            if (type == "click" || event.key == "Enter") {
                location.href = `${originLocation}/notice`;
                id_go_to_list.disabled = true;
            };
        });
    });
}

goToList();