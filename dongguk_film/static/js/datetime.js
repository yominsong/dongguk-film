const now = new Date();
const yesterday = new Date(Date.parse(now) - 1 * 1000 * 60 * 60 * 24);
const beforeYesterday = new Date(Date.parse(yesterday) - 1 * 1000 * 60 * 60 * 24);
const after90Days = new Date(Date.parse(now) + 90 * 1000 * 60 * 60 * 24);
const yyyymmdd = getYyyymmdd(now);
const yyyymmddWithDash = getYyyymmdd(now, dash = true);
const yyyymmddOfYesterday = getYyyymmdd(yesterday);
const yyyymmddOfBeforeYesterday = getYyyymmdd(beforeYesterday);
const yyyymmddOfAfter90Days = getYyyymmdd(after90Days);
const yyyymmddOfAfter90DaysWithDash = getYyyymmdd(after90Days, dash = true);
const h = now.getHours();
const m = now.getMinutes();
const hhmm = h.toTwoDigits() + m.toTwoDigits();
const hhmmWithColon = `${h.toTwoDigits()}:${m.toTwoDigits()}`;

//
// Main functions
//

function getYyyymmdd(date, dash = false) {
    let year = date.getFullYear();
    let month = ("0" + (1 + date.getMonth())).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    let result;
    dash ? result = `${year}-${month}-${day}` : result = year + month + day;
    return result;
}

function validateDate(input) {
    function isValidDate(dateString) {
        let regex = /^\d{4}-\d{2}-\d{2}$/;

        if (!regex.test(dateString)) {
            return false;
        };

        let dateParts = dateString.split('-');
        let year = parseInt(dateParts[0], 10);
        let month = parseInt(dateParts[1], 10);
        let day = parseInt(dateParts[2], 10);

        if (year < 1000 || year > 9999 || month === 0 || month > 12) {
            return false;
        };

        let daysInMonth = new Date(year, month, 0).getDate();

        return day > 0 && day <= daysInMonth;
    }

    return isValidDate(input.value);
}