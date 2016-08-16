/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
import * as http from "http";
import { euglena_template } from "euglena.template";
import { euglena } from "euglena";
import Particle = euglena.being.Particle;
export declare class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private sockets;
    private servers;
    private httpConnector;
    private sapContent;
    constructor();
    protected bindActions(addAction: (particleName: string, action: (particle: Particle) => void) => void): void;
    private connectToEuglena(euglenaInfo);
    private throwImpact(to, impact);
}
export declare class HttpRequestManager {
    post_options: http.RequestOptions;
    constructor(post_options: http.RequestOptions);
    sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void;
}
