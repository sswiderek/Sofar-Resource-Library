import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Update the page title
document.title = "Sales Enablement Portal | Sofar Ocean";

createRoot(document.getElementById("root")!).render(<App />);
