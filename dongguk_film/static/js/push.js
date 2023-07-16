//
// Sub functions
//

function requestConsentForPushNoti() {
    controlNoti("requestPushPermission");
}


//
// Main functions
//

function controlPush() {
    if ("Notification" in window) {
        let permission = Notification.permission;

        if (permission == "granted") {
            FlareLane.initialize({ projectId: "f7935dfb-3492-4cee-9ddc-9eb74d30602e" });
            FlareLane.setIsSubscribed(true);
            FlareLane.setUserId("{{ request.user.metadata.student_id }}");
        } else if (permission == "denied") {
            requestConsentForPushNoti();
        };
    };
}

controlPush();