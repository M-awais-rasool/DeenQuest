import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0C181B",
              color: "#EDF5F4",
              border: "1px solid #1E3238",
              borderRadius: "12px",
              fontFamily: "Nunito, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "13.5px",
            },
            success: { iconTheme: { primary: "#2CC9B5", secondary: "#06302B" } },
            error: { iconTheme: { primary: "#F0838C", secondary: "#2A1218" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
