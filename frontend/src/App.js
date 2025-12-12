import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import './App.css';
function App() {
    const [count, setCount] = useState(0);
    return (_jsx(_Fragment, { children: _jsxs("div", { className: "App", children: [_jsx("h1", { children: "AccuBooks" }), _jsxs("div", { className: "card", children: [_jsxs("button", { onClick: () => setCount((count) => count + 1), children: ["count is ", count] }), _jsxs("p", { children: ["Edit ", _jsx("code", { children: "src/App.tsx" }), " and save to test HMR"] })] })] }) }));
}
export default App;
