// if this is a new install or the local storage has been wiped
var ver = window.localStorage.getItem("storage_version");
if(ver != "1") {
    // pull a couple games from the hard drive
	var urldomain = /^(file:|([\w-]+:)?\/\/[^\/?#]+)/;
	var page_domain = urldomain.exec(location)[0];

    xmlhttp = new XMLHttpRequest();
    var url = "stories/curses.z5";
    xmlhttp.overrideMimeType('text/plain; charset=x-user-defined');
    xmlhttp.open("GET",url,false);
    xmlhttp.send();
    var story_data = file.text_to_array( xmlhttp.responseText );
    b64_data = file.base64_encode(story_data);
    file.add_to_library("http://ifarchive.org/if-archive/games/zcode/curses.z5", b64_data);

    url = "stories/photopia.z5";
    xmlhttp.open("GET",url,false);
    xmlhttp.send();
    var story_data = file.text_to_array( xmlhttp.responseText );
    b64_data = file.base64_encode(story_data);
    file.add_to_library("http://ifarchive.org/if-archive/games/zcode/photopia.z5", b64_data);

    window.localStorage.setItem("init", true);
}
