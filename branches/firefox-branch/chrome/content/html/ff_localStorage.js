/*
File: ff_localStorage.js
Author: Andrew Sillers

This class is intended to simulate the functionality of localStorage for Firefox extensions.  At present, Firefox does not provide access to localStorage, so I have implemented the length property as well as the setItem, getItem, removeItem, key, and clear functions using Firefox's SQLite functionality.

It does not currently fire storage events.

To use this in your Firefox extension, simply include this file anywhere you need the ff_localStorage object and use it like window.localStorage:

ff_localStorage.setItem('foo', 'bar');
baz = ff_localStorage.getItem('foo');

IMPORTANT NOTES:

1. Square brackets do not work.  You must explicitly call the getItem and setItem functions, since there is currently no way to reproduce the standard square bracket behavior of localStorage in Javascript.

        ff_localStorage['foo'] = 'bar';  // WRONG -- this won't store your data
        ff_localStorage.setItem('foo', 'bar'); // RIGHT -- this works correctly

2. Currently, some (or all?) implementations of localStorage flatten all values using toString, which means that objects cannot be stored without flattening them first, e.g., with JSON.  This implementation preserves all objects and arrays in storage.  For example:

        // vanilla localStorage losses info about stored objects
        localStorage.setItem('myobj1', {'key1':'value1', 'key2array':[1,2,3]});
        localStorage.getItem('myobj1');
        // yeilds the string "[object Object]" instead of the stored object

        // ff_localStorage, on the other hand, preserves this information
        ff_localStorage.setItem('myobj2', {'key1':'value1', 'key2array':[1,2,3]});
        ff_localStorage.getItem('myobj2');
        // yeilds the object {'key1':'value1', 'key2array':[1,2,3]} as stored

I think overwhelmingly few programs rely on the standard lossy object-to-string behavior of localStorage, and at least some programs alter the prototype of the Storage class to exhibit the preserving behavior.  Thus, I predict most people will prefer non-lossy storage.

3. 
*/
window.ff_Storage = function() {

    // find the the SQLite database (or makee it if it doesn't exists)
    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
    this.dbFile = directoryService.get("ProfD", Components.interfaces.nsIFile);
    this.dbFile.append(location.hostname + "_localStorage.sqlite");
    this.storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
    dbConn = this.storageService.openDatabase(this.dbFile); // Will also create the file if it does not exist
    var statement = dbConn.createStatement("CREATE TABLE IF NOT EXISTS storage ( key VARCHAR PRIMARY KEY, value VARCHAR );");
    try {
        statement.executeStep()
    } finally {
        statement.finalize();
        dbConn.close();
    }

    
    this.setItem = function(key, value) {
        value = JSON.stringify(value);
        var dbConn = this.storageService.openDatabase(this.dbFile); // Will also create the file if it does not exist
        var statement = dbConn.createStatement("INSERT OR REPLACE INTO storage (key, value) VALUES (:key, :value);");
        statement.params.key = key;
        statement.params.value = value;
        try {
            statement.executeStep();
        } finally {
            statement.finalize();
            dbConn.close();
        }
    };


    this.getItem = function(key) {
        var data = undefined;
        var dbConn = this.storageService.openDatabase(this.dbFile);
        var statement = dbConn.createStatement("SELECT value FROM storage WHERE key = :key;");
        statement.params.key = key;
        var result = null;
        try {
            statement.executeStep();
            data = statement.row.value;
            result = JSON.parse(data);
        } finally {
            statement.finalize();
            dbConn.close();
            return result;
        }  
    };

    this.removeItem = function(key) {
        var dbConn = this.storageService.openDatabase(this.dbFile);
        var statement = dbConn.createStatement("DELETE FROM storage WHERE key = :key;");
        statement.params.key = key;
        var result = null;
        try {
            statement.executeStep();
        } finally {
            statement.finalize();
            dbConn.close();
        }  
    };

    this.key = function(index) {
        var data = undefined;
        var dbConn = this.storageService.openDatabase(this.dbFile);
        var statement = dbConn.createStatement("SELECT key FROM storage ORDER BY key ASC LIMIT 1 OFFSET :index;");
        statement.params.index = index;
        var result = null;
        try {
            statement.executeStep();
            data = statement.row.key;
            result = data;
        } finally {
            statement.finalize();
            dbConn.close();
            return result;
        }  
    };

    this.clear = function() {
        var dbConn = this.storageService.openDatabase(this.dbFile);
        var statement = dbConn.createStatement("DELETE FROM storage;");
        try {
            statement.executeStep();
        } finally {
            statement.finalize();
            dbConn.close();
        }
    };

    this.__defineGetter__("length", function() {
        var result = null;
        var dbConn = this.storageService.openDatabase(this.dbFile);
        var statement = dbConn.createStatement("SELECT COUNT(*) FROM storage");
        try {
            statement.executeStep();
            result = statement.row["COUNT(*)"];
        } finally {
            statement.finalize();
            dbConn.close();
            return result;
        }
    });
};
window.ff_localStorage = new ff_Storage();

