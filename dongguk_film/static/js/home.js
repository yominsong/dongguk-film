//
// Sub functions
//

function dfs_xy_conv(code, v1, v2) {
    /* 
     * SOURCE: https://gist.github.com/fronteer-kr/14d7f779d52a21ac2f16
     * 
     * LL -> XY
     * code: "toXY"
     * v1: longitude
     * v2: latitude
     * 
     * XY -> LL
     * code: "toLL"
     * v1: y-coordinate
     * v2: x-coordinate
     */

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

function alertWelcomeNewUser(name) {
    controlNoti("welcomeNewUser", name);
};

function alertLowAccuracy() {
    controlNoti("lowAccuracy");
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
    request.url = `${originLocation}/home/utils/weather`;
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
        controlNoti("requestLocationAccess");
    } else {
        controlNoti("recheckLocationAccess");
    };
    requestWeather(defaultCoords);
}

navigator.geolocation.getCurrentPosition(requestWeather, handleGeolocationError, { enableHighAccuracy: true, timeout: 3000 });