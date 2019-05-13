var host = document.location.hostname;
var port = document.location.port;
var args = new URLSearchParams(document.location.search.substring(1));
var token = args.get("x-afb-token") || args.get("token") || "HELLO";
var afb;

function log(message) {
    document.getElementById('info').innerHTML += '<li>' + message + '</li>';
}

function run_application(app_id) {
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

function on_app_clicked(event) {
    run_application(event.target.id);
}

function display_application(app) {
    var list = document.getElementById('apps');
    var link = document.createElement('a');
    link.id = app.id;
    link.appendChild(document.createTextNode(app.name));
    link.addEventListener("click", on_app_clicked);

    var li = document.createElement('li');
    li.appendChild(link);
    li.appendChild(document.createTextNode(': ' + app.description));
    list.appendChild(li);
}

function load_application_list() {
    var ws = new afb.ws(() => {
        log("ws connected");
        var api_verb = "afm-main/runnables";
        var request = {};
        ws.call(api_verb, request).then(
            (obj) => {
                log("success");
                for (var i in obj.response) {
                    display_application(obj.response[i]);
                }
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
    afb = new AFB({
        host: host + ":" + port,
        token: token
    });
    load_application_list();
}

document.addEventListener('DOMContentLoaded', init);

