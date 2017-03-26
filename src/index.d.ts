/// <reference types="node" />
import * as http from "http";
import { euglena_template } from "euglena.template";
import { euglena } from "euglena";
import Particle = euglena.being.Particle;
export declare class Organelle extends euglena_template.being.alive.organelle.NetClientOrganelle {
    private servers;
    private httpConnector;
    private triedToConnect;
    private sapContent;
    constructor();
    protected bindActions(addAction: (particleName: string, action: (particle: Particle) => void) => void): void;
    private throwImpact(to, impact);
    private connectToEuglena(euglenaInfo);
}
export declare class HttpRequestManager {
    post_options: http.RequestOptions;
    constructor(post_options: http.RequestOptions);
    sendMessage(message: string, callback: euglena.sys.type.Callback<string>): void;
}
