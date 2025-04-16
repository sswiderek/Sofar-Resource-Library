import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Update the page title
document.title = "Sofar Resource Library | Sofar Ocean";

createRoot(document.getElementById("root")!).render(<App />);
