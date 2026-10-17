import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { createSiteI18n } from "./i18n";
import { getPageForPath } from "./routing";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("The PredixLab application root is missing.");
const i18n = createSiteI18n();
const app = (
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter><App /></BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);
// A shared static 404 can be served at any URL, so its route-specific links differ.
if (root.hasChildNodes() && getPageForPath(window.location.pathname)) hydrateRoot(root, app);
else createRoot(root).render(app);
