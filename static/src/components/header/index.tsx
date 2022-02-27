import { h } from "preact";
import { Link } from "preact-router/match";

const Header = () => (
    <header className="bg-sky-600 fixed left-0 top-0 w-full h-16 shadow-md shadow-gray-600 flex flex-row items-center z-50">
        <h1 className="grow-0 px-4 text-2xl text-white">Preact App</h1>
        <nav className="grow h-full flex flex-row items-center justify-end">
            <Link className="px-4 py-4 text-white rounded hover:bg-white/20 active:bg-white/30" href="/">Home</Link>
        </nav>
    </header>
);

export default Header;
