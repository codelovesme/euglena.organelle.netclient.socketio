/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
"use strict";
const http = require("http");
const euglena_template_1 = require("euglena.template");
const euglena_1 = require("euglena");
const io = require("socket.io");
var Exception = euglena_1.euglena.sys.type.Exception;
let OrganelleName = euglena_template_1.euglena_template.being.alive.constants.organelles.NetClientOrganelle;
let this_ = null;
class Organelle extends euglena_template_1.euglena_template.being.alive.organelle.NetClientOrganelle {
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new euglena_1.euglena.sys.type.Map();
    }
    bindActions(addAction) {
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.ThrowImpact, (particle) => {
            this_.throwImpact(particle.data.to, particle.data.impact);
        });
        addAction(euglena_template_1.euglena_template.being.alive.constants.particles.NetClientOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
        });
    }
    throwImpact(to, impact) {
        let server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact);
        }
        else {
            var post_options = {
                host: to.data.url,
                port: Number(to.data.port),
                path: "/",
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            let httpConnector = new HttpRequestManager(post_options);
            httpConnector.sendMessage(JSON.stringify(impact), (message) => {
                if (euglena_1.euglena.sys.type.StaticTools.Exception.isNotException(message)) {
                    try {
                        let impactAssumption = JSON.parse(message);
                        if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                            this_.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName), this.name);
                        }
                        else {
                        }
                    }
                    catch (e) {
                    }
                }
                else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.Exception(new Exception(""), OrganelleName), this.name);
                }
            });
            if (!this.servers[to.data.name] && !this.triedToConnect.get(to.data.name)) {
            }
        }
    }
    connectToEuglena(euglenaInfo) {
        var post_options = {};
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        this.triedToConnect.set(euglenaInfo.data.name, true);
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.data.name] = server;
        server.on("connect", (socket) => {
            server.emit("bind", new euglena_template_1.euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), (done) => {
                if (done) {
                    this_.send(new euglena_template_1.euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.name), this.name);
                }
            });
            server.on("impact", (impactAssumption, callback) => {
                if (euglena_1.euglena.js.Class.instanceOf(euglena_template_1.euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template_1.euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName), this.name);
                }
                else {
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template_1.euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.name), this.name);
        });
    }
}
exports.Organelle = Organelle;
class HttpRequestManager {
    constructor(post_options) {
        this.post_options = post_options;
    }
    sendMessage(message, callback) {
        var req = http.request(this.post_options, (res) => {
            res.setEncoding('utf8');
            var str = '';
            res.on('data', (data) => {
                str += data;
            });
            res.on('end', (data) => {
                callback(str);
            });
        });
        req.setTimeout(10000, () => {
            req.abort();
            callback(new Exception("Request timed out."));
        });
        req.on('error', (e) => {
            callback(new Exception("problem with request: " + e.message));
        });
        if (message)
            req.write(message);
        req.end();
    }
}
exports.HttpRequestManager = HttpRequestManager;
//# sourceMappingURL=index.js.map