var zedt = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("zedt-strings");
  },

  onMenuItemCommand: function(e) {
    gBrowser.selectedTab = gBrowser.addTab("chrome://zedt/content/html/parchment.html?story=" + encodeURI(gContextMenu.linkURL));
  },

  onToolbarButtonCommand: function(e) {
    zedt.openLibraryPage(e);
  },

  openLibraryPage: function() {
    gBrowser.selectedTab = gBrowser.addTab("chrome://zedt/content/html/home.html");
  }
};

window.addEventListener("load", function () { zedt.onLoad(); }, false);
