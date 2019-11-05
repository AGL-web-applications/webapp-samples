var host = document.location.hostname;
var port = document.location.port;
var args = new URLSearchParams(document.location.search.substring(1));
var token = args.get("x-afb-token") || args.get("token") || "HELLO";

function log(message) {
    document.getElementById('info').innerHTML += '<li>' + message + '</li>';
}

function display(afb, appId) {
    var ws = new afb.ws(function() {
        var api_verb = "homescreen/showWindow";
        var split_id = appId.split('@');
        var request = {application_id: split_id[0], parameter: {area: "normal.full"}};
        ws.call(api_verb, request).then(
            function(obj) {
                log("success: " + obj.response);
            },
            function(obj) {
                //TODO Manage errors
                log("failure on display");
            }
        );
    },
    function() {
        //TODO Manage errors
        log("ws aborted");
    });
}

function run(afb, app_id) {
    var ws = new afb.ws(() => {
        log("runnning: " + app_id);
        var api_verb = "afm-main/start";
        var request = {id: app_id};
        ws.call(api_verb, request).then(
            (obj) => {
                log("success: " + obj.response);
            },
            (obj) => {
                log("failure");
            }
        );
        log("ws called");
    },
    () => {
        log("ws aborted");
    });
}

function init() {
    document.querySelector('#port').value = port;
    document.querySelector('#launch-button').
        addEventListener('click', function () {
            var port = document.querySelector('#port').value;
            var appId = document.querySelector('#app-id').value;
            var afb = new AFB({
                host: host + ":" + port,
                token: token
            });
            run(afb, appId);
        });
    document.querySelector('#display-button').
        addEventListener('click', function () {
            var port = document.querySelector('#port').value;
            var appId = document.querySelector('#app-id').value;
            var afb = new AFB({
                host: host + ":" + port,
                token: token
            });
            display(afb, appId);
        });
}

document.addEventListener('DOMContentLoaded', init);

