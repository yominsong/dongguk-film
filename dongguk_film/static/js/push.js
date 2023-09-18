//
// Sub functions
//

// function requestConsentForPushNoti() {
//     displayNoti(true, "RNP");
// }

// function getOS() {
//     let userAgent = navigator.userAgent || window.opera;
//     let result = "Unknown OS";

//     // Mobile
//     if (/windows phone/i.test(userAgent)) { result = "Windows Mobile" };
//     if (/android/i.test(userAgent)) { result = "Android" };
//     if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) { result = "iOS" };

//     // Desktop
//     if (/Win/.test(userAgent)) { result = "Windows" };
//     if (/Mac/i.test(userAgent)) { result = "MacOS" };
//     if (/Linux/.test(userAgent)) { result = "Linux" };

//     return result;
// }

//
// Main functions
//

// function controlPush() {
//     if ("Notification" in window) {
//         let permission = Notification.permission;
//         let student_id = document.getElementById("pushJS").dataset.studentId;

//         FlareLane.initialize({ projectId: "f7935dfb-3492-4cee-9ddc-9eb74d30602e" });
//         if (permission == "granted") {
//             FlareLane.setIsSubscribed(true);
//             FlareLane.getDeviceId((deviceId) => {
//                 FlareLane.setUserId(`${student_id} (${getOS()} / ${deviceId.split("-")[1]})`);
//             });
//         } else if (permission == "denied") {
//             requestConsentForPushNoti();
//         };
//     };
// }

// controlPush();