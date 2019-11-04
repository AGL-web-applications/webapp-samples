document.querySelector('#save-button').addEventListener('click', saveButton);
document.querySelector('#increment-button').
    addEventListener('click', incrementButton);
document.querySelector('#clear-button').addEventListener('click', clearButton);

function saveButton() {
  const name = document.querySelector("#cookie-name").value;
  const value = document.querySelector("#cookie-value").value;
  docCookies.setItem(name, value, 31536e3 /*one year validity*/);
  listCookies();
}

function incrementButton() {
  var count = Number(docCookies.getItem("counter"));
  docCookies.setItem("counter", count+1, 31536e3 /*one year validity*/);
  listCookies();
}

function clearButton() {
  docCookies.clear();
  listCookies();
}

function listCookies() {
  var list = document.querySelector("#list");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  const cookies = docCookies.keys();
  cookies.forEach(function (name) {
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(name + ': ' +
        docCookies.getItem(name)));
    list.appendChild(li);
  });
}

listCookies();

