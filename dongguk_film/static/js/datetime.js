//
// Global variables
//

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

/**
 * @param {Date} date Date to format
 * @returns {string} "YYYY-MM-DD" formatted date
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * @param {string | Date} date Date to format 
 * @param {string | number} daysToAdd Days to add
 * @returns {string} "YYYY-MM-DD" formatted date
 */
function formatDateInFewDays(date, daysToAdd) {
    date = new Date(date);
    date.setDate(date.getDate() + Number(daysToAdd));

    return formatDate(date);
}

function parseDate(date) {
    if (date.includes("(")) {
        date = date.split("(")[0] + date.split(")")[1];
    };

    return new Date(date);
}

function calculateDateDifference(date1, date2) {
    date1 = new Date(date1 + "T00:00:00");
    date2 = new Date(date2 + "T00:00:00");
    const differenceInMilliseconds = Math.abs(date2 - date1);
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

    return differenceInDays;
}

function getYyyymmdd(date, dash = false) {
    let year = date.getFullYear();
    let month = ("0" + (1 + date.getMonth())).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    let result;
    dash ? result = `${year}-${month}-${day}` : result = year + month + day;
    return result;
}

function getDayOfWeek(date) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    
    return days[new Date(date).getDay()];
}

function validateDate(input) {
    function isValidDate(dateString) {
        let regex = /^\d{4}-\d{2}-\d{2}$/;

        if (!regex.test(dateString)) {
            return false;
        };

        let dateParts = dateString.split("-");
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