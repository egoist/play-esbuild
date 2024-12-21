import "./css/tailwind.css";
import "./css/codemirror.css";
import { createApp } from "vue";
import App from "./components/App.vue";

createApp(App).mount("#app");

if (import.meta.env.PROD) {
  const script = document.createElement("script");
  script.src = "https://umami2.egoist.dev/script.js";
  script.defer = true;
  script.setAttribute(
    "data-website-id",
    "fcfe4289-ab86-4d66-91b1-23eb307c25b1"
  );
  script.setAttribute("data-auto-track", "false");

  script.onload = () => {
    if (typeof umami === "undefined") return;

    umami.track((props) => ({
      ...props,
      url: location.pathname + location.search,
    }));
  };

  document.head.appendChild(script);
}
