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
                        OSjs.Terminal.COMMANDS[cmd.split(" ")[0]](cmd.split(" ").length,cmd.split(" "),term,app,win);
                    }
                },{
                    greetings: "OS.js Terminal",
                    name: "terminal",
                    height: win._dimension.h,
                    prompt: OSjs.Terminal.ENV.PWD+"> "
                });
            });

            app._addWindow(win);
        });
    }
    
    function onUpdate(event) {
        var r = false;
        switch(event) {
            case OSjs.Extensions["updater"].Events.CHECK:
                window.$.getJSON("https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/terminal/metadata.json",null,function(json) {
                    r = json.version > OSjs.Applications.terminal.VERSION;
                });
                break;
            case OSjs.Extensions["updater"].Events.UPDATE:
                var pm = OSjs.Core.getPackageManager();
                window.$.get("https://raw.githubusercontent.com/SpaceboyRoss01/OS.js-universe/master/bin/terminal.zip",null,function(d) {
                    OSjs.VFS.write("home:///.terminal.zip",d,function(error,response) {
                        if(error) throw new Error(error);
                        pm.install(new VFS.File("home:///.terminal.zip"),"home:///.packages",function(e) {
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

    OSjs.Applications.terminal = {
        run: runApplication,
        onUpdate: onUpdate,
        VERSION: 0
    };
    
    OSjs.Terminal = {
        COMMANDS: {
            "cat": function(argc,argv,term) {
                var file = new OSjs.VFS.File(argv[1]);
                OSjs.VFS.read(file,function(err,res) {
                    if(err) {
                        term.error(err);
                        return;
                    }
                    console.log(res);
                });
            },
            "cd": function(argc,argv,term) {
                new OSjs.VFS.File(argv[1]);
                term.exec("export PWD="+argv[1]);
                term.set_prompt(OSjs.Terminal.ENV.PWD+"> ");
            },
            "cp": function(argc,argv,term) {
                var parent = new OSjs.VFS.File(argv[1]);
                var child = new OSjs.VFS.File(argv[2]);
                OSjs.VFS.copy(parent,child,function(err) {
                    if(err) {
                        term.error(err);
                        return;
                    }
                });
            },
            "echo": function(argc,argv,term) {
                term.echo(argv.join(" ").replace("echo ",""));
            },
            "export": function(argc,argv,term,app) {
                if(argc == 1) {
                    for(var i = 0;i < Object.keys(OSjs.Terminal.ENV).length;i++) {
                        term.echo(Object.keys(OSjs.Terminal.ENV)[i]+"="+OSjs.Terminal.ENV[Object.keys(OSjs.Terminal.ENV)[i]]);
                    }
                } else {
                    if(argv[1].split("=").length < 1) {
                        if(OSjs.Terminal.ENV[argv[1]] == null) {
                            term.error("Environmental Variable "+argv[1]+" is not set!");
                            return;
                        }
                        term.echo(argv[1]+"="+OSjs.Terminal.ENV[argv[1]]);
                        return;
                    }
                    OSjs.Terminal.ENV[argv[1].split("=")[0]] = argv[1].split("=")[1];
                    app._setSetting("env."+argv[1].split("=")[0],argv[1].split("=")[1]);
                }
            },
            "help": function(argc,argv,term) {
                term.echo("List of Commands:");
                for(var i = 0;i < Object.keys(OSjs.Terminal.COMMANDS).length;i++) {
                    term.echo("\t"+Object.keys(OSjs.Terminal.COMMANDS)[i]);
                }
            },
            "kill": function(argc,argv,term) {
                if(argc < 1) {
                    term.error("Missing PID!");
                    return;
                }
                if(isNaN(parseInt(argv[1]))) {
                    term.error("PID is not Number!");
                    return;
                }
                OSjs.API.kill(parseInt(argv[1]));
            },
            "ls": function(argc,argv,term) {
                var file = new OSjs.VFS.File(OSjs.Terminal.ENV.PWD);
                if(argc > 1) file = new OSjs.VFS.File(argv[1]);
                OSjs.VFS.find(file,null,function(err,res) {
                    if(err) {
                        term.error(err);
                        return;
                    }
                    term.echo("Permissions\tType\tSize\tName");
                    for(var i = 0;i < res.length;i++) {
                        term.echo(res[i].permissions+"\t"+res[i].type+"\t"+res[i].size+"\t"+res[i].filename);
                    }
                });
            },
            "mkdir": function(argc,argv,term) {
                var dir = new OSjs.VFS.File(argv[1]);
                OSjs.VFS.mkdir(dir,function(err) {
                    if(err) {
                        term.error(err);
                        return;
                    }
                });
            },
            "mv": function(argc,argv,term) {
                var parent = new OSjs.VFS.File(argv[1]);
                var child = new OSjs.VFS.File(argv[2]);
                
                OSjs.VFS.move(parent,child,function(err) {
                    if(err) {
                        term.error(err);
                        return;
                    }
                });
            },
            "pwd": function(argc,argv,term) {
                term.echo(OSjs.Terminal.ENV.PWD);
            },
            "rm": function(argc,argv,term) {
                var f = new OSjs.VFS.File(argv[1]);
                f.delete();
            },
            "shutdown": function(argc,argv,term) {
                OSjs.API.shutdown();
            }
        },
        ENV: {
            "PWD": "home:///",
            "PATH": ""
        }
    };

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI,window.$);