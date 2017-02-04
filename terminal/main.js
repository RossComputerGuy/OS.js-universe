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
/* global $ */
/* global OSjs */
/*eslint valid-jsdoc: "off"*/
(function(Application, Window, Utils, API, VFS, GUI,$) {
    'use strict';

    /////////////////////////////////////////////////////////////////////////////
    // APPLICATION
    /////////////////////////////////////////////////////////////////////////////

    function runApplication(app) {
        app._on("init", function(settings, metadata, scheme) {
            var win = new Window("terminalWindow", {
                icon: metadata.icon,
                title: metadata.name,
                width: 500,
                height: 300
            }, app, scheme);

            win._on("init", function(root, scheme) {
                scheme.render(this, this._name, root);
            });

            win._on("inited", function(scheme) {
                window.$(".terminal-ui").terminal(function(cmd,term) {
                    if(OSjs.Terminal.COMMANDS[cmd.split(" ")[0]] == null) {
                        term.error("Command "+cmd.split(" ")[0]+" does not exist!");
                    } else {
                        OSjs.Terminal.COMMANDS[cmd.split(" ")[0]](cmd.split(" ").length,cmd.split(" "),term);
                    }
                },{
                    greetings: "OS.js Terminal",
                    name: "terminal",
                    height: win._dimension.h,
                    prompt: "OS.js> "
                });
            });

            app._addWindow(win);
        });
    }

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Applications.terminal = {
        run: runApplication
    };
    
    OSjs.Terminal = {
        COMMANDS: {
            "echo": function(argc,argv,term) {
                term.echo(argv.join(" ").replace("echo ",""));
            },
            "help": function(argc,argv,term) {
                term.echo("List of Commands:");
                for(var i = 0;i < Object.keys(OSjs.Terminal.COMMANDS).length;i++) {
                    term.echo("\t"+Object.keys(OSjs.Terminal.COMMANDS)[i]);
                }
            }
        }
    };

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI,window.$);