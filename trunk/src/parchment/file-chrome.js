// -*- tab-width: 4; -*-
/*
 * File functions and classes
 *
 * Copyright (c) 2003-2010 The Parchment Contributors
 * Copyright (c) 2010-2011 Andrew P. Sillers
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window, $){

// Text to byte array and vice versa
function text_to_array(text, array)
{
	var array = array || [], i = 0, l;
	for (l = text.length % 8; i < l; ++i)
		array.push(text.charCodeAt(i) & 0xff);
	for (l = text.length; i < l;)
		// Unfortunately unless text is cast to a String object there is no shortcut for charCodeAt,
		// and if text is cast to a String object, it's considerably slower.
		array.push(text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff,
			text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff);
	return array;
}

function array_to_text(array, text)
{
	var text = text || '', i = 0, l, fromCharCode = String.fromCharCode;;
	for (l = array.length % 8; i < l; ++i)
		text += fromCharCode(array[i]);
	for (l = array.length; i < l;)
		text += (fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]));
	return text;
}

// Base64 encoding and decoding
// Use the native base64 functions if available
if (window.atob)
{
	var base64_decode = function(data, out)
	{
		return text_to_array(atob(data), out);
	},

	base64_encode = function(data, out)
	{
		return btoa(array_to_text(data, out));
	};
}

// Unfortunately we will have to use pure Javascript functions
// TODO: Consider combining the eNs together first, then shifting to get the cNs (for the decoder)
else
{
	var encoder = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// Run this little function to build the decoder array
	decoder = (function()
	{
		var out = [], i = 0;
		for (; i < encoder.length; i++)
			out[encoder.charAt(i)] = i;
		return out;
	})(),

	base64_decode = function(data, out)
	{
	    var out = out || [],
	    c1, c2, c3, e1, e2, e3, e4,
	    i = 0, l = data.length;
	    while (i < l)
	    {
	        e1 = decoder[data.charAt(i++)];
	        e2 = decoder[data.charAt(i++)];
	        e3 = decoder[data.charAt(i++)];
	        e4 = decoder[data.charAt(i++)];
	        c1 = (e1 << 2) + (e2 >> 4);
	        c2 = ((e2 & 15) << 4) + (e3 >> 2);
	        c3 = ((e3 & 3) << 6) + e4;
	        out.push(c1, c2, c3);
	    }
	    if (e4 == 64)
	        out.pop();
	    if (e3 == 64)
	        out.pop();
	    return out;
	},

	base64_encode = function(data, out)
	{
	    var out = out || '',
	    c1, c2, c3, e1, e2, e3, e4,
	    i = 0, l = data.length;
		while (i < l)
		{
			c1 = data[i++];
			c2 = data[i++];
			c3 = data[i++];
			e1 = c1 >> 2;
			e2 = ((c1 & 3) << 4) + (c2 >> 4);
			e3 = ((c2 & 15) << 2) + (c3 >> 6);
			e4 = c3 & 63;

			// Consider other string concatenation methods?
			out += (encoder.charAt(e1) + encoder.charAt(e2) + encoder.charAt(e3) + encoder.charAt(e4));
		}
		if (isNaN(c2))
			out = out.slice(0, -2) + '==';
		else if (isNaN(c3))
			out = out.slice(0, -1) + '=';
		return out;
	};
}

// XMLHttpRequest feature support
var xhr = jQuery.ajaxSettings.xhr(),
support = {
	// Unfortunately in Opera < 10.5 overrideMimeType() doesn't work
	binary: xhr.overrideMimeType !== undefined && !( $.browser.opera && parseFloat( $.browser.version ) < 10.5 ),
	cross_origin: xhr.withCredentials !== undefined
};

// Clean-up
xhr = null;

// Download a file to a byte array
function download_to_array( url, callback )
{
	// URL regexp
	var urldomain = /^(file:|([\w-]+:)?\/\/[^\/?#]+)/,
	
	// If url is an array we are being given a binary and a backup 'JSONP' file
	backup_url;
	if ( $.isArray( url ) )
	{
		backup_url = url[1];
		url = url[0];
	}

	// Test the page and data URLs
	var page_domain = urldomain.exec(location)[0];
	var data_exec = urldomain.exec(url);
	var data_domain = data_exec ? data_exec[0] : page_domain;

	// Chrome > 4 doesn't allow file: to file: XHR
	// It should however work for the rest of the world, so we have to test here, rather than when first checking for binary support
	var options;

    var game_list = window.localStorage.getItem("games") || {};

    // if there is not a copy of the game in the local cache, fetch the game
    if(game_list[url] == undefined || game_list[url]["data"] == undefined || game_list[url]["data"] == "") {
        xmlhttp = new XMLHttpRequest();
        xmlhttp.overrideMimeType('text/plain; charset=x-user-defined');

        // if the url is for mirror.ifarchive.org, don't go there; resolve it to a non-mirror url first
        var non_mirror_url = resolve_mirror(url);
        xmlhttp.open("GET", non_mirror_url, false);
        xmlhttp.send();
        var story_data = text_to_array( xmlhttp.responseText );
        b64_data = base64_encode(story_data);
        add_to_library({"link":decodeURI(url)}, b64_data, false);
        callback( story_data );
    } else {
        // the game is in local storage, so let's use that
        game_list[url]["accessed"] = Math.round(new Date().getTime() / 1000);
        window.localStorage.setItem("games", game_list);
        callback( base64_decode(game_list[url]["data"]) );
    }
}


function add_to_library(metadata, b64_data, is_local, callback) {
    var is_local = is_local || false; // is the file a local upload?  default no
    var url = metadata.link;

    var game_list = window.localStorage.getItem("games") || {};

    // if this url is not in the library, add it
    if(!game_list[url]) {
        game_list[url] = {};
        game_list[url]["local"] = is_local;

        // let the library tab know we have a new game
        chrome.extension.sendRequest({"url":url}, function(response) { });
    }

    var temp_title = url.split("/").pop();
    var final_dot_pos = temp_title.lastIndexOf(".");
    if(final_dot_pos == -1) final_dot_pos = temp_title.length;
    temp_title = temp_title.substring(0, final_dot_pos);

    game_list[url]["title"] = metadata.title || temp_title;
    game_list[url]["author"] = metadata.author || "";
    game_list[url]["genre"] = metadata.genre || "";
    game_list[url]["rating"] = metadata.rating || -1;

    // add game data to cache
    game_list[url]["data"] = b64_data;

    game_list[url]["accessed"] = Math.round(new Date().getTime() / 1000);
    // store the game in the cache

    var store_complete = false;
    while(!store_complete) {
        try {
            window.localStorage.setItem("games", game_list);
            store_complete = true;
        } catch(e) {
            // if we are out of space, remove the cached data of the oldest game
            var oldest_access = Infinity;
            var deleteion_target = null;
            for(key in game_list) {
                // check only games that have a cached copy and can be re-downloaded later (i.e. are not uploads)
                if(game_list[key]["data"] != undefined && !game_list[key]["local"]) {
                    // if this game's access is the oldest found so far, remember it for deletion
                    if(oldest_access > game_list[key]["accessed"]) {
                        oldest_access = game_list[key]["accessed"];
                        deletion_target = key;
                    }
                }
            }
            // perform the deletion
            if(deletion_target != null) {
                game_list[deletion_target] = undefined;
            } else {
                // we couldn't find any more cache files to delete, and we still don't have space, so dump the cache data for this game
                game_list[url]["data"] = undefined;
                try {
                    window.localStorage.setItem("games", game_list);
                } catch(e) {
                    // we don't even have enough space for the game's metadata!
                    // the user has to dump some saves or another game's metadata
                    // TODO: this case is sort of an edge case (5MB of save files?), but we should definitely handle it
                }
                store_complete = true;
            }
        }
    }
}       

// TODO: the storage of game files should be handled here, not in add_to_library
function store_story(url, b64_data, callback) {
    
}


// When passed a URL from an IF archive mirror, return the equivalent mirror.ifarchive.org URL.
// When passed any other URL, return it unchanged.
// This helps distribute the load across IF Archive servers and avoid repeat library entries for the user
// (e.g. if the user adds photopia.z5 twice, from two archive mirrors, we treat them as the same game from mirror.ifarchive.org and add it only the first time)
function mirror_ifarchive_url(url) {
    var urldomain_regex = /^(file:|([\w-]+:)?\/\/[^\/?#]+)/;
    var story_domain = urldomain_regex.exec(url) ? (urldomain_regex.exec(url)[0] + "/") : urldomain_regex.exec(location)[0];

    var if_mirror_hosts = [
        "http://www.ifarchive.org/",
        "http://ifarchive.org/",
        "http://ifarchive.jmac.org/",
        "http://ifmirror.russotto.net/",
        "http://ifarchive.flavorplex.com/",
        "http://ifarchive.smallwhitehouse.org/",
        "http://ifarchive.wurb.com/",
        "http://ifarchive.plover.net/",
        "http://www.ifarchive.info/",
        "http://ifarchive.ifreviews.org/",
        "http://ifarchive.heanet.ie/",
        "http://ifarchive.giga.or.at/",
        "http://if-archive.guetech.org/"
    ];

    // if the URL starts with any mirror host
    if($.inArray(story_domain, if_mirror_hosts) > -1) {
        url = url.replace(story_domain, "http://mirror.ifarchive.org/");
    }
    // there are other mirrors, but they have been commented out because they do not conform to the URL patterns of the rest nor map onto mirror.ifarchive.org
    /*else {
        var if_mirror_paths = [
            "http://www.ibiblio.org/pub/docs/interactive-fiction/",
            "ftp://ftp.ibiblio.org/pub/docs/interactive-fiction/",
            "ftp://ftp.funet.fi/pub/mirrors/ftp.ifarchive.org/if-archive/"
        ];
        for(i in if_mirror_paths) {
            if(url.indexOf(if_mirror_paths[i]) == 0) {
                url = url.replace(if_mirror_paths[i], "http://mirror.ifarchive.org/");
                break;
            }
        }
    }*/

    return url;
}         

function resolve_mirror(url) {
    var urldomain_regex = /^(file:|([\w-]+:)?\/\/[^\/?#]+)/;
    var story_domain = urldomain_regex.exec(url) ? (urldomain_regex.exec(url)[0] + "/") : urldomain_regex.exec(location)[0];

    if(story_domain != "http://mirror.ifarchive.org/")
        return url;

    var if_mirror_hosts = [
        "http://www.ifarchive.org/",
        "http://ifarchive.org/",
        "http://ifarchive.jmac.org/",
        "http://ifmirror.russotto.net/",
        "http://ifarchive.flavorplex.com/",
        "http://ifarchive.smallwhitehouse.org/",
        "http://ifarchive.wurb.com/",
        "http://ifarchive.plover.net/",
        "http://www.ifarchive.info/",
        "http://ifarchive.ifreviews.org/",
        "http://ifarchive.heanet.ie/",
        "http://ifarchive.giga.or.at/",
        "http://if-archive.guetech.org/"
    ];

    var random_domain = if_mirror_hosts[Math.round(Math.random()*(if_mirror_hosts.length-1))];
    url = url.replace(story_domain, random_domain);
    return url;
}


window.file = {
	text_to_array: text_to_array,
	array_to_text: array_to_text,
	base64_decode: base64_decode,
	base64_encode: base64_encode,
	download_to_array: download_to_array,
	support: support,
    add_to_library: add_to_library,
    mirror_ifarchive_url: mirror_ifarchive_url
};

})(window, jQuery);
