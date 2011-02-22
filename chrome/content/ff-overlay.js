zedt.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ zedt.showFirefoxContextMenu(e); }, false);
};

zedt.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-zedt").hidden = !(/\.z[358]$/.test(gContextMenu.linkURL) || /\.zblorb$/.test(gContextMenu.linkURL));
};

window.addEventListener("load", function () { zedt.onFirefoxLoad(); }, false);
