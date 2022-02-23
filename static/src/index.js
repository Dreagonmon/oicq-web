import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import RelayEnvironment from "./utils/RelayEnvironment.ts";

ReactDOM.render(
    <React.StrictMode>
        <RelayEnvironmentProvider environment={RelayEnvironment}>
            <App />
        </RelayEnvironmentProvider>
    </React.StrictMode>,
    document.getElementById("root")
);
