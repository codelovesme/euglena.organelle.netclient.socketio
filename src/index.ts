
/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/node/node.d.ts" />

"use strict";
import * as http from "http";
import {euglena_template} from "euglena.template";
import {euglena} from "euglena";
import Particle = euglena.being.Particle;
import * as io from "socket.io";
import Exception = euglena.sys.type.Exception;

let OrganelleName = euglena_template.being.alive.constants.organelles.NetClientOrganelle;
let this_: Organelle = null;
export class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private servers: any;
    private httpConnector: HttpRequestManager;
    private triedToConnect: euglena.sys.type.Map<string, boolean>;
    private sapContent: euglena_template.being.alive.particle.NetClientOrganelleSapContent;
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.servers = {};
        this.triedToConnect = new euglena.sys.type.Map<string, boolean>();
    }
    protected bindActions(addAction: (particleName: string, action: (particle: Particle) => void) => void): void {
        addAction(euglena_template.being.alive.constants.particles.ConnectToEuglena, (particle) => {
            this_.connectToEuglena(particle.data);
        });
        addAction(euglena_template.being.alive.constants.particles.ThrowImpact, (particle) => {
            this_.throwImpact(particle.data.to, particle.data.impact);
        });
        addAction(euglena_template.being.alive.constants.particles.NetClientOrganelleSap, (particle) => {
            this_.sapContent = particle.data;
        });
    }
    private throwImpact(to: euglena_template.being.alive.particle.EuglenaInfo, impact: euglena.being.interaction.Impact): void {
        let server = this.servers[to.data.name];
        if (server) {
            server.emit("impact", impact);
        } else {
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
            httpConnector.sendMessage(JSON.stringify(impact), (message: any) => {
                if (euglena.sys.type.StaticTools.Exception.isNotException<string>(message)) {
                    try {
                        let impactAssumption = JSON.parse(message);
                        if (euglena.js.Class.instanceOf(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                            this_.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption as euglena.being.interaction.Impact, OrganelleName),this.name);
                        } else {
                            //TODO log
                        }
                    } catch (e) {
                        //TODO
                    }
                } else {
                    //TODO write a eligable exception message
                    this_.send(new euglena_template.being.alive.particle.Exception(new Exception(""), OrganelleName),this.name);
                }

            });
            if (!this.servers[to.data.name] && !this.triedToConnect.get(to.data.name)) {
                this.connectToEuglena(to);
            }
        }
    }
    private connectToEuglena(euglenaInfo: euglena_template.being.alive.particle.EuglenaInfo) {
        var post_options: http.RequestOptions;
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
        server.on("connect", (socket: SocketIO.Socket) => {
            server.emit("bind", new euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), (done: boolean) => {
                if (done) {
                    this_.send(new euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.name),this.name);
                }
            });
            server.on("impact", (impactAssumption: any, callback: (impact: euglena.being.interaction.Impact) => void) => {
                if (euglena.js.Class.instanceOf<euglena.being.interaction.Impact>(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName),this.name);
                } else {
                    //TODO
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.name),this.name);
        });
    }
}

export class HttpRequestManager {
    constructor(public post_options: http.RequestOptions) { }
    public sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void {
        var req = http.request(this.post_options, (res) => {
            res.setEncoding('utf8');
            var str = '';
            res.on('data', (data: string) => {
                str += data;
            });
            res.on('end', (data: string) => {
                callback(str);
            });
        });
        req.setTimeout(10000, () => {
            req.abort();
            callback(new Exception("Request timed out."));
        });
        req.on('error', (e: any) => {
            callback(new Exception("problem with request: " + e.message));
        });
        if (message) req.write(message);
        req.end();
    }
}