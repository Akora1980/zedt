/*!
 * Parchment
 * Built: BUILDDATE
 *
 * Copyright (c) 2008-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */

// Don't append a timestamp to XHR requests
// Use the Last-Modified/If-Modified-Since headers, but not when loading from a file:
jQuery.ajaxSetup({
	cache: true,
	dataType: 'text',
	ifModified: location.protocol !== 'file:'
});

// The home for Parchment to live in
var parchment = {

	// The default parchment options
	options: {
		// A selector for the top HTML element which we will have complete control over
		container: '#parchment',
		
		// Should no ?story= be given, run this
		default_story: 'stories/troll.z5.js',
		
		// Where shall we find the lib .js files?
		lib_path: 'lib/',
		
		// Lock Parchment so it will only run the default story
		lock_story: 0,
		
		// Set to 0 if you don't want Parchment to overwrite your <title>		
		page_title: 1,
		
		// URL of proxy server to use for files we can't directly load
		proxy_url: 'http://zcode.appspot.com/proxy/'
	},

	// Classes etc
	lib: {}
};
/*!
 * Simple JavaScript Inheritance
 * http://ejohn.org/blog/simple-javascript-inheritance/
 *
 * By John Resig
 * Released into the public domain?
 *
 * Inspired by base2 and Prototype
 */
(function(){
  var initializing = false,
  // Determine if functions can be serialized
  fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
 
  // Create a new Class that inherits from this class
  Object.subClass = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var proto = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      proto[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = proto;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.subClass = arguments.callee;
   
    return Class;
  };
})();
/*
 * Interchange File Format library
 *
 * Copyright (c) 2008-2010 The Gnusto Contributors
 * Licenced under the GPL v2
 * http://github.com/curiousdannii/gnusto
 */
(function(){

// Get a 32 bit number from a byte array, and vice versa
function num_from(s, offset)
{
	return s[offset] << 24 | s[offset + 1] << 16 | s[offset + 2] << 8 | s[offset + 3];
}

function num_to_word(n)
{
	return [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

// Get a 4 byte string ID from a byte array, and vice versa
function text_from(s, offset)
{
	var fromCharCode = String.fromCharCode;
	return fromCharCode(s[offset]) + fromCharCode(s[offset + 1]) + fromCharCode(s[offset + 2]) + fromCharCode(s[offset + 3]);
}

function text_to_word(t)
{
	return [t.charCodeAt(0), t.charCodeAt(1), t.charCodeAt(2), t.charCodeAt(3)];
}

// IFF file class
// Parses an IFF file stored in a byte array
var IFF = Object.subClass({
	// Parse a byte array or construct an empty IFF file
	init: function parse_iff(data)
	{
		this.type = '';
		this.chunks = [];
		if (data)
		{
			// Check this is an IFF file
			if (text_from(data, 0) != 'FORM')
				throw new Error("Not an IFF file");

			// Parse the file
			this.type = text_from(data, 8);

			var i = 12, l = data.length;
			while (i < l)
			{
				var chunk_length = num_from(data, i + 4);
				if (chunk_length < 0 || (chunk_length + i) > l)
					// FIXME: do something sensible here
					throw new Error("IFF: Chunk out of range");

				this.chunks.push({
					type: text_from(data, i),
					offset: i,
					data: data.slice(i + 8, i + 8 + chunk_length)
				});

				i += 8 + chunk_length;
				if (chunk_length % 2) i++;
			}
		}
	},

	// Write out the IFF into a byte array
	write: function write_iff()
	{
		// Start with the IFF type
		var out = text_to_word(this.type);

		// Go through the chunks and write them out
		for (var i = 0, l = this.chunks.length; i < l; i++)
		{
			var chunk = this.chunks[i], data = chunk.data, len = data.length;
			out = out.concat(text_to_word(chunk.type), num_to_word(len), data);
			if (len % 2)
				out.push(0);
		}

		// Add the header and return
		return text_to_word('FORM').concat(num_to_word(out.length), out);
	}
});

// Expose the class and helper functions
IFF.num_from = num_from;
IFF.num_to_word = num_to_word;
IFF.text_from = text_from;
IFF.text_to_word = text_to_word;
window.IFF = IFF;

})();
/* Client-side access to querystring name=value pairs
	Version 1.2.4
	30 March 2008
	Adam Vandenberg
*/
function Querystring(qs) { // optionally pass a querystring to parse
	this.params = {};
	this.get=Querystring_get;

	if (qs == null);
		qs=location.search.substring(1,location.search.length);

	if (qs.length == 0)
		return;

// Turn <plus> back to <space>
// See: http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.4.1
	qs = qs.replace(/\+/g, ' ');
	var args = qs.split('&'); // parse out name/value pairs separated via &

// split out each name=value pair
	for (var i=0;i<args.length;i++) {
		var pair = args[i].split('=');
		var name = unescape(pair[0]);

		var value = (pair.length==2)
			? unescape(pair[1])
			: name;

		this.params[name] = value;
	}
}

function Querystring_get(key, default_) {
	var value=this.params[key];
	return (value!=null) ? value : default_;
}
/*!
 * Taken from "Remedial Javascript" by Douglas Crockford:
 * http://javascript.crockford.com/remedial.html
 */

function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}


function isEmpty(o) {
    var i, v;
    if (typeOf(o) === 'object') {
        for (i in o) {
            v = o[i];
            if (v !== undefined && typeOf(v) !== 'function') {
                return false;
            }
        }
    }
    return true;
}

String.prototype.entityify = function () {
    return this.replace(/&/g, "&amp;").replace(/</g,
        "&lt;").replace(/>/g, "&gt;");
};

String.prototype.quote = function () {
    var c, i, l = this.length, o = '"';
    for (i = 0; i < l; i += 1) {
        c = this.charAt(i);
        if (c >= ' ') {
            if (c === '\\' || c === '"') {
                o += '\\';
            }
            o += c;
        } else {
            switch (c) {
            case '\b':
                o += '\\b';
                break;
            case '\f':
                o += '\\f';
                break;
            case '\n':
                o += '\\n';
                break;
            case '\r':
                o += '\\r';
                break;
            case '\t':
                o += '\\t';
                break;
            default:
                c = c.charCodeAt();
                o += '\\u00' + Math.floor(c / 16).toString(16) +
                    (c % 16).toString(16);
            }
        }
    }
    return o + '"';
};

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};
(function($){

window.FatalError = function(message) {
  this.message = message;
  this.traceback = this._makeTraceback(arguments.callee);
  this.onError(this);
  
	// Hide load indicator
	if ( $('.load').length > 0 )
	{
		//self.hidden_load_indicator = 1;
		//self.library.load_indicator.detach();
		$('.load').detach();
	}
};

FatalError.prototype = {
  onError: function(e) {
  var message = e.message;
  if (typeof e.message == "string")
    message = message.entityify();
  $("#content").append('<div class="error">An error occurred:<br/>' +
                       '<pre>' + message + '\n\n' + e.traceback +
                       '</pre></div>');
},

  _makeTraceback: function(procs) {
    // This function was taken from gnusto-engine.js and modified.
    var procstring = '';

    var loop_count = 0;
    var loop_max = 100;

    while (procs != null && loop_count < loop_max) {
      var name = procs.toString();

      if (!name) {
	procstring = '\n  (anonymous function)'+procstring;
      } else {
	var r = name.match(/function (\w*)/);

	if (!r || !r[1]) {
	  procstring = '\n  (anonymous function)' + procstring;
	} else {
          procstring = '\n  ' + r[1] + procstring;
	}
      }

      try {
        procs = procs.caller;
      } catch (e) {
        // A permission denied error may have just been raised,
        // perhaps because the caller is a chrome function that we
        // can't have access to.
        procs = null;
      }
      loop_count++;
    }

    if (loop_count==loop_max) {
      procstring = '...' + procstring;
    }

    return "Traceback (most recent call last):\n" + procstring;
  }
};

})(jQuery);
// -*- tab-width: 4; -*-
/*
 * File functions and classes
 *
 * Copyright (c) 2003-2010 The Parchment Contributors
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

    var game_list = window.ff_localStorage.getItem("games") || {};

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
        add_to_library({"link":url}, b64_data, false);
        callback( story_data );
    } else {
        // the game is in local storage, so let's use that
        game_list[url]["accessed"] = Math.round(new Date().getTime() / 1000);
        window.ff_localStorage.setItem("games", game_list);
        callback( base64_decode(game_list[url]["data"]) );
    }
}


function add_to_library(metadata, b64_data, is_local, callback) {
    var is_local = is_local || false; // is the file a local upload?  default no
    var url = metadata.link;

    var game_list = window.ff_localStorage.getItem("games") || {};

    // if this url is not in the library, add it
    if(!game_list[url]) {
        game_list[url] = {};
        game_list[url]["local"] = is_local;

        // let the library tab know we have a new game
        //chrome.extension.sendRequest({"url":url}, function(response) { });
    }

    game_list[url]["title"] = metadata.title || url.split("/").pop();
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
            window.ff_localStorage.setItem("games", game_list);
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
                    window.ff_localStorage.setItem("games", game_list);
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
        "ftp://ftp.ifarchive.org/",
        "http://ifarchive.jmac.org/",
        "http://ifmirror.russotto.net/",
        "http://ifarchive.flavorplex.com/",
        "http://ifarchive.smallwhitehouse.org/",
        "http://ifarchive.wurb.com/",
        "http://ifarchive.plover.net/",
        "http://www.ifarchive.info/",
        "http://ifarchive.ifreviews.org/",
        "ftp://ifarchive.ifreviews.org/",
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
/*
 * Parchment UI
 *
 * Copyright (c) 2008-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function($){

var window = this,

// Wrap document
doc = $( document ),

// Cached regexs
rmobileua = /iPhone|iPod|iPad|Android/i,
rnotwhite = /\S/,

// window.scrollByPages() compatibility
scrollByPages = window.scrollByPages || function( pages )
{
	// From Mozilla's nsGfxScrollFrame.cpp
	// delta = viewportHeight - Min( 10%, lineHeight * 2 )
	var height = doc[0].documentElement.clientHeight,
	delta = height - Math.min( height / 10, parseInt( $( 'body' ).css( 'line-height' ) ) * 2 );
	scrollBy( 0, delta * pages );
},

// getSelection compatibility-ish. We only care about the text value of a selection
selection = window.getSelection ||
	( document.selection && function() { return document.selection.createRange().text; } ) ||
	function() { return ''; };

window.gIsIphone = rmobileua.test( navigator.userAgent );

// Make the statusline always move to the top of the screen in MSIE < 7
if ( $.browser.msie && parseInt($.browser.version) < 7 )
{
	$(function(){
		var topwin_element = $( '#top-window' ),
		move_element = function()
		{
			topwin_element.style.top = document.documentElement.scrollTop + 'px';
		};
		topwin_element
			.css( 'position', 'absolute' )
			.resize( move_element )
			.scroll( move_element );
	});
}

// The main UI class
parchment.lib.UI = Object.subClass({

	// Stylesheet management
	// Add some stylesheets, disabled at first
	stylesheet_add: function( /* title, url, ... */ )
	{
		var args = arguments, i;
		for ( i = 1; i < args.length; i++ )
		{
			$( '<link>', {
				rel: 'alternate stylesheet',
				href: args[i],
				title: args[0]
			})
				.appendTo( 'head' )
				[0].disabled = true;
		}
	},
	// Switch on/off a stylesheet
	stylesheet_switch: function( title, enable )
	{
		$( 'link[rel*=stylesheet][title=' + title + ']' )
			.each( function(){
				this.disabled = !enable;
			});
	}

});

// A generic text input class
// Can take both line and character input, though separate <input> elements are used
parchment.lib.TextInput = Object.subClass({
	// Set up the text inputs with a container and stream
	// container is the greatest domain for which this instance should control input
	// stream is the element which the line <input> will actually be inserted into
	init: function( container, stream )
	{
		var self = this,
		container = $( container ),
		
		// The line input element
		lineInput = $( '<input>', {
			autocapitalize: 'off',
			keydown: function( event )
			{
				var keyCode = event.which,
				cancel;
				
				// Check for up/down to use the command history
				if ( keyCode == 38 ) // up -> prev
				{
					self.prev_next( 1 );
					cancel = 1;
				}
				if ( keyCode == 40 ) // down -> next
				{
					self.prev_next( -1 );
					cancel = 1;
				}
				
				// Trigger page up/down on the body
				// FIX: Won't scroll repeatably
				if ( keyCode == 33 ) // Up
				{
					scrollByPages(-1);
					cancel = 1;
				}
				if ( keyCode == 34 ) // Down
				{
					scrollByPages(1);
					cancel = 1;
				}
				
				// Don't do the default browser action
				// (For example in Mac OS pressing up will force the cursor to the beginning of a line)
				if ( cancel )
				{
					return false;
				}
			}
		}),
		
		// The character input element
		charInput = $( '<input>', {
			'class': 'CharInput',
			keydown: function( event )
			{
				self.keyCode = event.which;
			},
			keypress: function( event )
			{
				self.charCode = event.which;
				self.submitChar();
				return false;
			},
			keyup: function( event )
			{
				self.submitChar();
			}
		});
		
		// A form to contain it
		self.form = $( '<form>', {
			'class': 'LineInput',	
			submit: function()
			{
				self.submitLine();
				return false;
			}
		})
			.append( lineInput );
		
		// Focus clicks in the container (only)
		// To focus document clicks use UI.addTextInput()
		container.bind( 'click.TextInput', function() {
			// Don't do anything if the user is selecting some text
			if ( selection() == '' )
			{
				if ( $( '.LineInput' ).length )
				{
					lineInput.focus();
				}
				if ( $( '.CharInput' ).length )
				{
					charInput.focus();
				}
			}
		});
		
		// Command history
		self.history = [];
		// current and mutable_history are set in .get()
		
		self.container = container;
		self.stream = $( stream );
		self.lineInput = lineInput;
		self.charInput = charInput;
	},
	
	// Cleanup so we can deconstruct
	die: function()
	{
		this.container.unbind( '.TextInput' );
	},
	
	// Get some input
	getLine: function( callback, style )
	{
		var self = this,
		prompt = self.stream.children().last(),
		input = self.lineInput;
		
		self.callback = callback || $.noop;
		
		// Set up the mutable history
		self.current = 0;
		self.mutable_history = self.history.slice();
		self.mutable_history.unshift( '' );
		
		// Store the text style
		self.style = style || '';
		
		// Adjust the input's width and ensure it's empty
		input
			.width( self.stream.width() - prompt.width() - 1)
			.val( '' )
			.addClass( self.style );
		
		prompt.append( self.form );
		setTimeout( function(){
			input.focus();
		}, 1 );
	},
	
	// Submit the input data
	submitLine: function()
	{
		var self = this,
		command = self.lineInput.val();
			
		// Hide the <form>, reset the styles
		self.form.detach();
		self.lineInput.removeClass( self.style );
		
		// Copy back the command
		$( '<span class="finished-input">' + command.entityify() + '</span><br>' )
			.appendTo( self.stream.children().last() );
		
		// Add this command to the history, as long as it's not the same as the last, and not blank
		if ( command != self.history[0] && rnotwhite.test( command ) )
		{
			self.history.unshift( command );
		}
		
		// Trigger a custom event for anyone listening in for commands
		doc.trigger({
			type: 'LineInput',
			input: command
		});
		
		self.callback( command );
	},
	
	// Get the previous/next command from history
	// change = 1 for previous and -1 for next
	prev_next: function( change )
	{
		var self = this,
		input = self.lineInput,
		mutable_history = self.mutable_history,
		current = self.current,
		new_current = current + change;
		
		// Check it's within range
		if ( new_current < mutable_history.length && new_current >= 0 )
		{
			mutable_history[current] = input.val();
			input.val( mutable_history[new_current] );
			self.current = new_current;
		}
	},
	
	// Get some input
	getChar: function( callback )
	{
		var self = this,
		input = self.charInput;
		
		self.callback = callback || $.noop;
		
		self.keyCode = self.charCode = 0;
		
		// Add the <input> and focus
		self.container.append( input );
		setTimeout( function(){
			input.focus();
		}, 1 );
	},
	
	// Submit the input data
	submitChar: function()
	{
		var self = this,
		keyCode = self.keyCode, charCode = self.charCode,
		input = {
			keyCode: keyCode,
			charCode: charCode
		};
		
		// Do we have anything to submit?
		if ( !keyCode && !charCode )
		{
			return;
		}
		
		// Hide the <input>
		self.charInput.detach();
		
		// Trigger a custom event for anyone listening in for key strokes
		doc.trigger({
			type: 'CharInput',
			input: input
		});
		
		self.callback( input );
	}
});

})(jQuery);
/*
 * The Parchment Library
 *
 * Copyright (c) 2003-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window, $){

// A story file
var Story = IFF.subClass({
	// Parse a zblorb or naked zcode story file
	init: function parse_zblorb(data, story_name)
	{
		this.title = story_name;

		// Check for naked zcode
		// FIXME: This check is way too simple. We should look at
		// some of the other fields as well for sanity-checking.
		if (data[0] < 9)
		{
			this.filetype = 'ok story naked zcode';
			this._super();
			this.chunks.push({
				type: 'ZCOD',
				data: data
			});
			this.zcode = data;
		}
		// Check for potential zblorb
		else if (IFF.text_from(data, 0) == 'FORM')
		{
			this._super(data);
			if (this.type == 'IFRS')
			{
				// We have Blorb!
//				this.images = [];
//				this.resources = [];

				// Go through the chunks and extract the useful ones
				for (var i = 0, l = this.chunks.length; i < l; i++)
				{
					var type = this.chunks[i].type;
/*
					if (type == 'RIdx')
						// The Resource Index Chunk, used by parchment for numbering images correctly
						for (var j = 0, c = IFF.num_from(this.chunks[i].data, 0); j < c; j++)
							this.resources.push({
								usage: IFF.text_from(this.chunks[i].data, 4 + j * 12),
								number: IFF.num_from(this.chunks[i].data, 8 + j * 12),
								start: IFF.num_from(this.chunks[i].data, 12 + j * 12)
							});
*/
					if (type == 'ZCOD' && !this.zcode)
						// Parchment uses the first ZCOD chunk it finds, but the Blorb spec says the RIdx chunk should be used
						this.zcode = this.chunks[i].data;

					else if (type == 'IFmd')
					{
						// Treaty of Babel metadata
						// Will most likely break UTF-8
						this.metadata = file.array_to_text(this.chunks[i].data);
						var metadataDOM = $(this.metadata);
						if (metadataDOM)
						{
							//this.metadataDOM = metadataDOM;

							// Extract some useful info
							if ($('title', metadataDOM))
								this.title = $('title', metadataDOM).text();
							if ($('ifid', metadataDOM))
								this.ifid = $('ifid', metadataDOM).text();
							if ($('release', metadataDOM))
								this.release = $('release', metadataDOM).text();
						}
					}
/*
					else if (type == 'PNG ' || type == 'JPEG')
						for (var j = 0, c = this.resources.length; j < c; j++)
						{
							if (this.resources[j].usage == 'Pict' && this.resources[j].start == this.chunks[i].offset)
								// A numbered image!
								this.images[this.resources[j].number] = new image(this.chunks[i]);
						}

					else if (type == 'Fspc')
						this.frontispiece = IFF.num_from(this.chunks[i].data, 0);
*/
				}

				if (this.zcode)
					this.filetype = 'ok story blorbed zcode';
				else
					this.filetype = 'error: no zcode in blorb';
			}
			// Not a blorb
			else if (this.type == 'IFZS')
				this.filetype = 'error: trying to load a Quetzal savefile';
			else
				this.filetype = 'error unknown iff';
		}
		else
			// Not a story file
			this.filetype = 'error unknown general';
	},

	// Load zcode into engine
	load: function loadIntoEngine(engine)
	{
		if (this.zcode)
			engine.loadStory(this.zcode);
		//window.document.title = this.title + ' - Parchment';
	}
}),

// Story file cache
StoryCache = Object.subClass({
	// Add a story to the cache
	add: function(story)
	{
		this[story.ifid] = story;
		if (story.url)
			this.url[story.url] = story;
	},
	url: {}
}),

// Z-Machine launcher
launch_zmachine = function( url, library )
{
	// Store the story in this closure so we can still launch when things load out of order
	var story,
	
	files = 1, timer, lib_path = parchment.options.lib_path,

	// Callback to check if everything has loaded, and to launch the Z-Machine if so
	callback = function( data )
	{
		// Are we being called with a byte array story?
		if ( $.isArray(data) )
			story = data;
		
		if ( --files == 0 )
		{
			// Theoretically everything has been loaded now... though that may not be the case in reality
			// Call stage2() with a timer in case we have to wait a little longer.
			timer = setInterval( stage2, 1 );
		}
	},
	
	// Truly launch it now
	stage2 = function()
	{
		// Check that everything has loaded
		if ( library.loaded_zmachine || 
		     window.GnustoEngine && window.Quetzal && window.EngineRunner && window.Console && parchment.lib.ZUI && story )
		{
			// Everything is here, finally
			library.loaded_zmachine = true;
			clearInterval( timer );
			
			// Start the VM
			$('#progress-text').html('Starting interpreter...');
			
			var logfunc = typeof console !== undefined ?
				function() {} :
				function(msg) { window.console.log(msg); },

			engine = new GnustoEngine( logfunc ),
			zui = new parchment.lib.ZUI( library, engine, logfunc ),
			runner = new EngineRunner( engine, zui, logfunc ),

			mystory = new Story( story, storyName ),
			savefile = location.hash;
			
			logfunc( "Story type: " + mystory.filetype )
			mystory.load( engine );

			if ( savefile && savefile != '#' ) // IE will set location.hash for an empty fragment, FF won't
			{
				engine.loadSavedGame( file.base64_decode( savefile.slice(1)));
				logfunc( 'Loading savefile' );
			}

			runner.run();
		}
	};

	// Download the Z-Machine libs now so they can be parallelised
	if ( !library.loaded_zmachine )
	{
		// Get the correct files for parchment.full.html/parchment.html
		;;; files = 6;
		;;; ;;; var libs = ['src/gnusto/gnusto-engine.js', 'src/plugins/quetzal.js', 'src/zmachine/runner.js', 'src/zmachine/console.js', 'src/zmachine/zui.js'], i = 0, l = 5;
		;;; while ( i < l ) {
		;;; 	$.getScript( libs[i], callback );
		;;; 	i++;
		;;; }
		;;; /*
		files = 3;
		$.getScript( lib_path + 'gnusto.min.js', callback );
		$.getScript( lib_path + 'zmachine.min.js', callback );
		;;; */
	}

	// Download the story
	file.download_to_array( url, callback );
},

// The Parchment Library class
Library = Object.subClass({
	// Set up the library
	init: function()
	{
		var self = this;
		
		// Keep a reference to our container
		self.container = $( parchment.options.container );
		
		// Load indicator
		self.load_indicator = $( '<div class="dialog load"><p>Parchment is loading.<p>&gt; <blink>_</blink></div>' );
	},
	
	// Load a story or savefile
	load: function(id)
	{

		var self = this,
		
		options = parchment.options;
		
		// Show the load indicator
		$( 'body' ).append( self.load_indicator );
		
		if ( options.lock_story )
		{
			// Locked to the default story
			var storyfile = options.default_story;
		}
		else
		{
			// Load from URL, or the default story
			var querystring = new Querystring(),
			storyfile = querystring.get('story', options.default_story);
		}
		var url = $.isArray( storyfile ) ? storyfile[0] : storyfile;
		self.url = url;

		storyName = url.slice( url.lastIndexOf("/") + 1 );
		storyName = storyName ? storyName + " - Parchment" : "Parchment";
		
		// Change the page title
		if ( options.page_title )
		{
			window.document.title = storyName;
		}
		
		// Check the story cache first
		if ( self.stories.url[url] ) {
			var story = self.stories.url[url];
        }
		// We will have to download it
		else
		{
			$('#progress-text').html('Retrieving story file...');
			// When Glulx support is added we will need to sniff the filename to decide which to launch
			try
			{
				launch_zmachine( storyfile, self );
			}
			catch (e)
			{
				throw new FatalError( e );
			}
		}
	},

	// Loaded stories and savefiles
	stories: new StoryCache(),
	savefiles: {}
});

parchment.lib.Library = Library;

})(window, jQuery);
/*
 * Parchment load scripts
 *
 * Copyright (c) 2008-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window, $){

var parchment = window.parchment;

// Load Parchment, start it all up!
function load_parchment()
{
	// Check for any customised options
	if (window.parchment_options)
		$.extend(parchment.options, parchment_options);
	
	// Hide the #about, until we can do something more smart with it
	$('#about').remove();
	
	// Load the library
	var library = new parchment.lib.Library();
	parchment.library = library;
	library.load();

	// Add the Analytics tracker, but only if we're at parchment.googlecode.com
	if (location.href.slice(0, 31) == 'http://parchment.googlecode.com')
	{
		$.getScript('http://www.google-analytics.com/ga.js', function(){_gat._getTracker("UA-7949545-1")._trackPageview();});
	}
}

$(load_parchment);

})(window, jQuery);
