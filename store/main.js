/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
/* global OSjs */
/*eslint valid-jsdoc: "off"*/
(function(Application, Window, Utils, API, VFS, GUI) {
    "use strict";

    /////////////////////////////////////////////////////////////////////////////
    // APPLICATION
    /////////////////////////////////////////////////////////////////////////////

    function runApplication(app) {
        app._on("init", function(settings, metadata, scheme) {
        var win = new Window("StoreWindow", {
            icon: metadata.icon,
            title: metadata.name,
            width: 400,
            height: 200
        }, app, scheme);

        win._on("init", function(root, scheme) {
            scheme.render(this, this._name, root);
        });

        win._on("inited", function(scheme) {
        });

        app._addWindow(win);
        });
    }
    
    function onUpdate(event) {
        var r = false;
        switch(event) {
            case OSjs.Extensions["updater"].Events.CHECK:
                API.curl({
                    url: "https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/store/metadata.json",
                    method: "GET"
                },function(err,res) {
                    if(err) throw new Error(err);
                    var metadata = JSON.parse(res.body);
                    console.log(metadata.version + " > "+OSjs.Applications["store"].VERSION);
                    r = metadata.version > OSjs.Applications["store"].VERSION;
                });
                break;
            case OSjs.Extensions["updater"].Events.UPDATE:
                var pm = OSjs.Core.getPackageManager();
                API.curl({
                    url: "https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/bin/store.zip",
                    method: "GET"
                },function(err,res) {
                    if(err) throw new Error(err);
                    VFS.write("home:///.store.zip",res.body,function(error,response) {
                        if(error) throw new Error(error);
                        pm.install(new VFS.File("home:///.store.zip"),"home:///.packages",function(e) {
                            if(e) throw new Error(e);
                            r = true;
                        });
                    });
                });
                break;
            default:
                throw new Error("Invalid Action!");
        }
        return r;
    }

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Applications.store = {
        run: runApplication,
        onUpdate: onUpdate,
        VERSION: 1
    };

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);