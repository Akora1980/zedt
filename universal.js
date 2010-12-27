Storage.prototype.setItem = function(key, value) {
    this[key] = JSON.stringify(value);
}

Storage.prototype.getItem = function(key) {
    try {
        return JSON.parse(this[key]);
    } catch(e) {
        return undefined;
    }
}

// turns any string into a valid XHTML id that uses no colons, slashes, periods, hyphens, or dashes
// it uses lots of underscores
function encodeURIForId(uri) {
    return encodeURIComponent(uri).replace(/_/g, "%5F").replace(/-/g, "%2D").replace(/\./g, "%2E").replace(/%/g,"_");
}

function decodeURIFromId(id) {
    return decodeURIComponent(id.replace(/_/g, "%"));
}
