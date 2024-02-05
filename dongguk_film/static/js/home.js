//
// Global variables
//

const id_address = document.getElementById("id_address");
const id_temperature = document.getElementById("id_temperature");
const id_temperatureMax = document.getElementById("id_temperatureMax");
const id_temperatureMin = document.getElementById("id_temperatureMin");
const id_precipitationProbability = document.getElementById("id_precipitationProbability");
const id_precipitationType = document.getElementById("id_precipitationType");
const id_windSpeed = document.getElementById("id_windSpeed");
const id_windName = document.getElementById("id_windName");
const id_skyState = document.getElementById("id_skyState");
const id_sunrise = document.getElementById("id_sunrise");
const id_sunset = document.getElementById("id_sunset");
const id_accuracy = document.getElementById("id_accuracy");
const id_baseDateTime = document.getElementById("id_baseDateTime");
const id_get_weather = document.getElementById("id_get_weather");
const pulseOn = document.querySelectorAll(".pulse-on");
const pulseOff = document.querySelectorAll(".pulse-off");

//
// Sub functions
//

/**
 * SOURCE: https://gist.github.com/fronteer-kr/14d7f779d52a21ac2f16
 * 
 * @param {string} code Code for converting longitude & latitude to coordinates and vice versa
 * - `toXY`: LL → XY (longitude & latitude → coordinates)
 * - `toLL`: XY → LL (coordinates → longitude & latitude)
 * @param {number} v1 longitude OR Y coordinate
 * @param {number} v2 latitude OR X coordinate
 * @returns {object} Pairs of longitude & latitude OR coordinates
 */
function dfs_xy_conv(code, v1, v2) {
    let RE = 6371.00877;
    let GRID = 5.0;
    let SLAT1 = 30.0;
    let SLAT2 = 60.0;
    let OLON = 126.0;
    let OLAT = 38.0;
    let XO = 43;
    let YO = 136;

    let DEGRAD = Math.PI / 180.0;
    let RADDEG = 180.0 / Math.PI;

    let re = RE / GRID;
    let slat1 = SLAT1 * DEGRAD;
    let slat2 = SLAT2 * DEGRAD;
    let olon = OLON * DEGRAD;
    let olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    let rs = {};
    if (code == "toXY") {
        rs["lng"] = v1;
        rs["lat"] = v2;
        let ra = Math.tan(Math.PI * 0.25 + (v2) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = v1 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        rs["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    } else {
        rs["y"] = v1;
        rs["x"] = v2;
        let xn = v2 - XO;
        let yn = ro - v1 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        let alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;
        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        } else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            } else theta = Math.atan2(xn, yn);
        };
        let alon = theta / sn + olon;
        rs["lng"] = alon * RADDEG;
        rs["lat"] = alat * RADDEG;
    };
    return rs;
}

function refreshWeather() {
    ["click", "keyup"].forEach(type => {
        id_get_weather.addEventListener(type, (event) => {
            if ((type == "click" || event.key == "Enter") &&
                id_get_weather.classList.contains("cursor-pointer")) {
                displayNoti(false, "RRL");
                displayNoti(false, "CWF");
                getWeather(sudo = true);
            };
        });
    });
}

refreshWeather();

function alertWelcomeNewUser(name) {
    displayNoti(true, "WNU", name);
};

function alertRefreshWeather() {
    displayNoti(true, "CWF");
};

//
// Main functions
//

function requestWeather({ coords }) {
    longitude = coords.longitude;
    latitude = coords.latitude;
    accuracy = coords.accuracy;
    dfsXyConv = dfs_xy_conv("toXY", longitude, latitude);
    x = dfsXyConv.x;
    y = dfsXyConv.y;
    request.url = `${originLocation}/home/utils/weather/`;
    request.type = "GET";
    request.data = { id: "weather", lng: longitude, lat: latitude, x: x, y: y, acc: accuracy };
    request.async = true;
    request.headers = null;
    makeAjaxCall(request);
    request = {};
}

function handleGeolocationError(error) {
    /* 
     * defaultCoords: Dongguk University Munhwagwan
     */

    const defaultCoords = { coords: { longitude: 127.00306709659004, latitude: 37.557852166850196, accuracy: null } };
    if (error.code == 1) {
        displayNoti(true, "RLP");
    } else {
        displayNoti(true, "RRL");
    };
    requestWeather(defaultCoords);
}

function getWeather(sudo = false) {
    let weatherCachedAt = new Date(sessionStorage.getItem("weatherCachedAt"));
    let cachedWeather = JSON.parse(sessionStorage.getItem("cachedWeather"));
    let notified = false;

    if (((now - weatherCachedAt) / (1000 * 60) > 5) || sudo == true) {
        navigator.geolocation.getCurrentPosition(requestWeather, handleGeolocationError, { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 });
        id_get_weather.classList.remove("cursor-pointer");
        id_get_weather.classList.remove("hover:cursor-pointer");
        id_get_weather.classList.add("animate-spin");
        id_get_weather.classList.add("cursor-not-allowed");
        id_get_weather.classList.add("hover:cursor-not-allowed");
    } else {
        pulseOn.forEach((item) => {
            item.classList.add("hidden");
        });
        pulseOff.forEach((item) => {
            item.classList.remove("hidden");
        });

        for (let key in cachedWeather) {
            let obj = document.getElementById(`id_${key}`);
            obj.innerText = writeWeather(obj.innerText, cachedWeather[key]);
            if ((!/\d+/.test(obj.innerText) && obj.innerText.includes("-")) && !notified) {
                alertRefreshWeather();
                notified = true;
            };
        };

        id_get_weather.classList.remove("animate-spin");
        id_get_weather.classList.remove("cursor-not-allowed");
        id_get_weather.classList.remove("hover:cursor-not-allowed");
        id_get_weather.classList.add("cursor-pointer");
        id_get_weather.classList.add("hover:cursor-pointer");
    };
}

getWeather();