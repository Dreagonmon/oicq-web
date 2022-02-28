import { h } from "preact";

const Header = () => (
    <header className="bg-sky-600 fixed left-0 top-0 w-full h-16 shadow-md shadow-gray-600 flex flex-row items-center z-50">
        <h1 className="grow-0 px-4 text-2xl text-white">Preact App</h1>
    </header>
);

export default Header;
