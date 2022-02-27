import { h } from "preact";
import { Router } from "preact-router";

// Code-splitting is automated for `routes` directory
import Header from "./header";
import Home from "../routes/home";
import Test from "../routes/test";

const App = () => (
    <div id="app" className="w-full h-full">
        <Header />
        <div className="pt-16 w-full h-full overflow-auto flex flex-col">
            <Router>
                <Home path="/" />
                <Test path="/test" />
            </Router>
        </div>
    </div>
);

export default App;
