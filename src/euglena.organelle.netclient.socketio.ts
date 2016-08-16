
/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/node/node.d.ts" />

"use strict";
import * as http from "http";
import {euglena_template} from "euglena.template";
import {euglena} from "euglena";
import Particle = euglena.being.Particle;
import * as io from "socket.io";
import Exception = euglena.sys.type.Exception;


const OrganelleName = "ReceptionOrganelleImplHttp";

let this_: Organelle = null;
export class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private sockets: any;
    private servers: any;
    private httpConnector: HttpRequestManager;
    private sapContent: euglena_template.being.alive.particle.NetClientOrganelleSapContent;
    constructor() {
        super(OrganelleName);
        this_ = this;
        this.sockets = {};
        this.servers = {};
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
    private connectToEuglena(euglenaInfo: euglena_template.being.alive.particle.EuglenaInfo) {
        if (this.servers[euglenaInfo.data.name]) {
            return;
        }
        var post_options: http.RequestOptions;
        post_options.host = euglenaInfo.data.url;
        post_options.port = Number(euglenaInfo.data.port);
        post_options.path = "/";
        post_options.method = 'POST';
        post_options.headers = {
            'Content-Type': 'application/json'
        };
        let server = io("http://" + post_options.host + ":" + post_options.port);
        this.servers[euglenaInfo.data.name] = server;
        server.on("connect", (socket: SocketIO.Socket) => {
            server.emit("bind", new euglena_template.being.alive.particle.EuglenaInfo({ name: this_.sapContent.euglenaName, url: "", port: "" }, this_.sapContent.euglenaName), (done: boolean) => {
                if (done) {
                    this_.send(new euglena_template.being.alive.particle.ConnectedToEuglena(euglenaInfo, this_.name));
                }
            });
            server.on("impact", (impactAssumption: any, callback: (impact: euglena.being.interaction.Impact) => void) => {
                if (euglena.js.Class.instanceOf<euglena.being.interaction.Impact>(euglena_template.reference.being.interaction.Impact, impactAssumption)) {
                    this.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption, OrganelleName));
                } else {
                    //TODO
                }
            });
        });
        server.on("disconnect", () => {
            this_.send(new euglena_template.being.alive.particle.DisconnectedFromEuglena(euglenaInfo, this_.name));
        });
    }
    private throwImpact(to: euglena_template.being.alive.particle.EuglenaInfo, impact: euglena.being.interaction.Impact): void {
        var client = this.sockets[to.data.name];
        if (client) {
            client.emit("impact", impact, (resp: euglena.being.interaction.Impact) => {
                //TODO
            });
        } else {
            //TODO
            //response(new euglena_template.being.alive.particles.ExceptionOccurred(
            //  new euglena.sys.type.Exception("There is no gateway connected with that id: " + userId)));
            let server = this.servers[to.data.name];
            if (server) {
                server.emit("impact", impact);
            } else {
                //TODO
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
                                this_.send(new euglena_template.being.alive.particle.ImpactReceived(impactAssumption as euglena.being.interaction.Impact, OrganelleName));
                            } else {
                                //TODO log
                            }
                        } catch (e) {
                            //TODO
                        }
                    } else {
                        //TODO write a eligable exception message
                        this_.send(new euglena_template.being.alive.particle.Exception(new Exception(""), OrganelleName));
                    }

                });
            }
        }
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