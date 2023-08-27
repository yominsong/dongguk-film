//
// Global constants and variables
//

const id_go_to_list = document.getElementById("id_go_to_list");

//
// Sub functions
//

function showYouTube() {
    let mediaElements = document.querySelectorAll("figure.media");

    if (mediaElements) {
        mediaElements.forEach(mediaElement => {
            let oembedElement = mediaElement.querySelector("oembed");
            let url = oembedElement.getAttribute("url");
            let videoId = url.split("v=")[1];
            let newStructure = `
            <figure class="media ck-widget" contenteditable="false">
                <div class="ck-media__wrapper" data-oembed-url="${url}">
                    <div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">
                        <iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe>
                    </div>
                </div>
            </figure>`;
    
            mediaElement.outerHTML = newStructure;
        });
    };
}

showYouTube();

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