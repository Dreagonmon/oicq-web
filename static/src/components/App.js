import React from "react";

import graphql from "babel-plugin-relay/macro";
import RelayEnvironment from "../utils/RelayEnvironment.ts";
import { fetchQuery } from "relay-runtime";

// Define a query
const AppHelloQuery = graphql`
  query AppHelloQuery {
    hello
  }
`;

fetchQuery(RelayEnvironment, AppHelloQuery, { a: 1 }).subscribe({
    next: (data) => { console.log("0", data); },
});
fetchQuery(RelayEnvironment, AppHelloQuery, { a: 2 }).subscribe({
    next: (data) => { console.log("1", data); },
});
fetchQuery(RelayEnvironment, AppHelloQuery, { a: 3 }).subscribe({
    next: (data) => { console.log("2", data); },
});

function App () {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Hello Dragon</h1>
                <p>
          Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
          Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
