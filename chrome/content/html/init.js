// if this is a new install or the local storage has been wiped
var ver = window.ff_localStorage.getItem("storage_version");
if(ver == null) {
    // pull a couple games from the hard drive
	var urldomain = /^(file:|([\w-]+:)?\/\/[^\/?#]+)/;
	var page_domain = urldomain.exec(location)[0];

    var xmlhttp = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);

    var url;
    var story_data;
    xmlhttp.overrideMimeType('text/plain; charset=x-user-defined');

    var preloaded_games = {
        "stories/dreamhold.z8":{"link":"http://ifarchive.org/if-archive/games/zcode/dreamhold.z8", "title":"The Dreamhold [Tutorial game]", "author":"Andrew Plotkin"},
        "stories/curses.z5":{"link":"http://ifarchive.org/if-archive/games/zcode/curses.z5", "title":"Curses!", "author":"Graham Nelson"},
        "stories/metamorp.z5":{"link":"http://ifarchive.org/if-archive/games/zcode/metamorp.z5", "title":"Metamorphoses", "author":"Emily Short"},
        "stories/photopia.z5":{"link":"http://ifarchive.org/if-archive/games/zcode/photopia.z5", "title":"Photopia", "author":"Adam Cadre"},
        "stories/suvehnux.z5":{"link":"http://ifarchive.org/if-archive/games/zcode/suvehnux.z5", "title":"Suveh Nux", "author":"David Fisher"}
    };

    for(url in preloaded_games) {
        var curr_game = preloaded_games[url];
        xmlhttp.open("GET",url,false);
        xmlhttp.send();
        story_data = file.text_to_array( xmlhttp.responseText );
        b64_data = file.base64_encode(story_data);
        file.add_to_library(curr_game, b64_data, false);
    }

    window.ff_localStorage.setItem("storage_version", 1);
}
