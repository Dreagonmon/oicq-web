/* eslint-disable no-alert, no-console, no-unused-vars, no-debugger */
import { h } from "preact";
import { RoutableProps } from "preact-router";

const Test: (props: RoutableProps | undefined) => h.JSX.Element = () => {
    return <div className="w-full h-full flex flex-col" />;
};

export default Test;
