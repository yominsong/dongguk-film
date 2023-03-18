const now = new Date();
const yesterday = new Date(Date.parse(now) - 1 * 1000 * 60 * 60 * 24);
const beforeYesterday = new Date(Date.parse(yesterday) - 1 * 1000 * 60 * 60 * 24);
const yyyymmdd = getYyyymmdd(now);
const yyyymmddOfYesterday = getYyyymmdd(yesterday);
const yyyymmddOfBeforeYesterday = getYyyymmdd(beforeYesterday);
const h = now.getHours();
const m = now.getMinutes();
const hhmm = h.toTwoDigits() + m.toTwoDigits();
const hhmmWithColon = `${h.toTwoDigits()}:${m.toTwoDigits()}`;

function getYyyymmdd(date) {
    let year = date.getFullYear();
    let month = ("0" + (1 + date.getMonth())).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    return year + month + day;
}