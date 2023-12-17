//
// Global constants and variables
//

const id_search_equipment = document.getElementById("id_search_equipment");
const id_search_equipment_init = document.getElementById("id_search_equipment_init");
const id_equipment_q = document.getElementById("id_equipment_q");

//
// Sub functions
//

function search() {
    let urlParams = new URLSearchParams(location.search);

    if (id_equipment_q !== null) {
        if (urlParams.has("q")) {
            id_equipment_q.value = urlParams.get("q");
            ["click", "keyup"].forEach(type => {
                id_search_equipment_init.addEventListener(type, (event) => {
                    if (type == "click" || event.key == "Enter" || event.key == " ") {
                        location.href = `${originLocation}/equipment`;
                        id_equipment_q.readOnly = true;
                        id_search_equipment.disabled = true;
                    };
                });
            });
        };

        id_equipment_q.addEventListener("keyup", (event) => {
            if (event.key == "Enter") {
                id_search_equipment.click();
            };
        });

        ["click", "keyup"].forEach(type => {
            id_search_equipment.addEventListener(type, (event) => {
                if (type == "click" || event.key == "Enter" || event.key == " ") {
                    location.href = `${originLocation}/equipment?q=${id_equipment_q.value}`;
                    id_equipment_q.readOnly = true;
                    id_search_equipment.disabled = true;
                };
            });
        });
    };
}

search();