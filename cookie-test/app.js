const button = document.querySelector('#button');

button.addEventListener('click', createButton);

function createButton() {
  const name = document.querySelector("#cookie-name").value;
  const value = document.querySelector("#cookie-value").value;
  docCookies.setItem(name, value, 31536e3 /*one year validity*/);
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

