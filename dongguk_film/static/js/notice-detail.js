//
// Global constants and variables
//

const id_go_to_list = document.getElementById("id_go_to_list");

//
// Sub functions
//

function generateNewStructure(url) {
    let mediaName, newStructure;

    if (url.includes("instagram.com")) {
        mediaName = "인스타그램";
    } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
        mediaName = "페이스북";
    } else if (url.includes("twitter.com")) {
        mediaName = "트위터";
    } else if (url.includes("goo.gl")) {
        mediaName = "구글 지도";
    };

    newStructure = `
    <figure class="media ck-widget" contenteditable="false">
        <div class="ck-media__wrapper"
            data-oembed-url="${url}">
            <div class="ck ck-reset_all ck-media__placeholder">
                <div class="ck-media__placeholder__icon">
                    <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color"
                        viewBox="0 0 64 42">
                        <path d="M47.426 17V3.713L63.102 0v19.389h-.001l.001.272c0 1.595-2.032 3.43-4.538 4.098-2.506.668-4.538-.083-4.538-1.678 0-1.594 2.032-3.43 4.538-4.098.914-.244 2.032-.565 2.888-.603V4.516L49.076 7.447v9.556A1.014 1.014 0 0 0 49 17h-1.574zM29.5 17h-8.343a7.073 7.073 0 1 0-4.657 4.06v3.781H3.3a2.803 2.803 0 0 1-2.8-2.804V8.63a2.803 2.803 0 0 1 2.8-2.805h4.082L8.58 2.768A1.994 1.994 0 0 1 10.435 1.5h8.985c.773 0 1.477.448 1.805 1.149l1.488 3.177H26.7c1.546 0 2.8 1.256 2.8 2.805V17zm-11.637 0H17.5a1 1 0 0 0-1 1v.05A4.244 4.244 0 1 1 17.863 17zm29.684 2c.97 0 .953-.048.953.889v20.743c0 .953.016.905-.953.905H19.453c-.97 0-.953.048-.953-.905V19.89c0-.937-.016-.889.97-.889h28.077zm-4.701 19.338V22.183H24.154v16.155h18.692zM20.6 21.375v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616v-1.616H20.6zm0 3.231v1.616h1.616V37.53H20.6zm24.233-16.155v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615v-1.616h-1.615zm0 3.231v1.616h1.615V37.53h-1.615zM29.485 25.283a.4.4 0 0 1 .593-.35l9.05 4.977a.4.4 0 0 1 0 .701l-9.05 4.978a.4.4 0 0 1-.593-.35v-9.956z">
                        </path>
                    </svg>
                </div>
                <a class="ck-media__placeholder__url"
                target="_blank"
                rel="noopener noreferrer"
                href="${url}"
                data-cke-tooltip-text="새 탭에서 ${mediaName} 열기"><span class="ck-media__placeholder__url__text">${url}</span></a>
            </div>
        </div>
    </figure>
    `;

    return newStructure;
}

function embedMedia() {
    let mediaElements = document.querySelectorAll("figure.media");

    if (mediaElements) {
        mediaElements.forEach(media => {
            let oembed = media.querySelector("oembed");
            let div = media.querySelector("div");

            if (oembed) {
                let url = oembed.getAttribute("url");
                let newStructure = generateNewStructure(url);

                media.outerHTML = newStructure;
            };

            if (div) {
                let url = div.dataset.oembedUrl

                if (url.includes("dailymotion.com")) {
                    let targetDiv = div.querySelector("div");

                    targetDiv.style = "position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;";
                } else if (url.includes("spotify.com")) {
                    media.style = "height: 352px !important";
                };
            };
        });
    };
}

embedMedia();

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