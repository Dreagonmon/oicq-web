import { h } from "preact";
import { RoutableProps } from "preact-router";

const Home: (props: RoutableProps | undefined) => h.JSX.Element = () => {
    return <div>
        <h1>Home</h1>
        <p>This is the Home component.</p>
    </div>;
};

export default Home;
