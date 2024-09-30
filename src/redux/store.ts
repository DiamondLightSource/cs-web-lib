import { createStore, applyMiddleware, compose } from "redux";

import { csReducer } from "./csState";
import { connectionMiddleware } from "./connectionMiddleware";
import { throttleMiddleware, UpdateThrottle } from "./throttleMiddleware";
import { Connection } from "../connection/plugin";
import { SimulatorPlugin } from "../connection/sim";
import { PvwsPlugin } from "../connection/pvws";
import { ConnectionForwarder } from "../connection/forwarder";

const PVWS_SOCKET =
  process.env.VITE_CONIQL_SOCKET ?? import.meta.env.VITE_PVWS_SOCKET;
const PVWS_SSL =
  (process.env.VITE_CONIQL_SSL ?? import.meta.env._PVWS_SSL) === "true";
const THROTTLE_PERIOD = parseFloat(
  process.env.VITE_THROTTLE_PERIOD ??
    import.meta.env.VITE_THROTTLE_PERIOD ??
    "100"
);

const simulator = new SimulatorPlugin();
const plugins: [string, Connection][] = [["sim://", simulator]];
if (PVWS_SOCKET !== undefined) {
  const pvws = new PvwsPlugin(PVWS_SOCKET, PVWS_SSL);
  plugins.unshift(["pva://", pvws]);
  plugins.unshift(["ca://", pvws]);
  plugins.unshift(["loc://", pvws]);
  plugins.unshift(["sim://", pvws]);
  plugins.unshift(["ssim://", pvws]);
  plugins.unshift(["dev://", pvws]);
}
const connection = new ConnectionForwarder(plugins);

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  csReducer,
  /* preloadedState, */ composeEnhancers(
    applyMiddleware(
      connectionMiddleware(connection),
      throttleMiddleware(new UpdateThrottle(THROTTLE_PERIOD))
    )
  )
);
