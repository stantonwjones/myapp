function getData() {
    var oReq = new XMLHttpRequest();
    oReq.open("get", "http://snapguide.com/api/v1/guide/b995492d5e7943e3b2757a88fe3ef7c6", true);
    //oReq.open("get", "https://graph.facebook.com/shaverm/picture?redirect=false", true);
    //oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.setRequestHeader('Accept', 'text/html');
    oReq.setRequestHeader('Origin', 'snapguide.com');
    //console.log(oReq.getAllRequestHeaders());
    oReq.onreadystatechange = function (oEvent) {
        console.log(oReq.getAllResponseHeaders());
        if (oReq.readyState === 4) {
            if (oReq.status === 200) {
                console.log(oReq.responseText);
            } else {
                console.log("Error", oReq.statusText);
            }
        }
    };
    oReq.send(null);
}
(function() {
})
