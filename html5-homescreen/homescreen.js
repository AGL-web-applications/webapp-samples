var host = document.location.hostname;
var port = document.location.port;
var args = new URLSearchParams(document.location.search.substring(1));
var token = args.get("x-afb-token") || args.get("token") || "HELLO";
var afb;

function log(message) {
    document.getElementById('info').innerHTML += '<li>' + message + '</li>';
}

function display(appId) {
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

function run_application(app_id) {
    var ws = new afb.ws(() => {
        log("runnning: " + app_id);
        var api_verb = "afm-main/start";
        var request = {id: app_id};
        ws.call(api_verb, request).then(
            (obj) => {
                log("success: " + obj.response);
                display(app_id);
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

    var img = document.createElement('img');
    img.src = 'icons/' + app.id;
    img.id = app.id;
    img.setAttribute('style', 'width: 50px;height: 50px');
    link.appendChild(img);

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

