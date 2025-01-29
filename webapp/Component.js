sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
  "use strict";

  return UIComponent.extend("myApp.Component", {
    metadata: {
      manifest: "json",
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
      this.getRouter().attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
    },

    _onBeforeRouteMatched: function (oEvent) {
      const sRouteName = oEvent.getParameter("name");
      const aPublicRoutes = ["login"];
      const token = sessionStorage.getItem("jwt");

      if (!aPublicRoutes.includes(sRouteName) && !token) {
        this.getRouter().navTo("login", {}, true);
        throw new Error("Ruta protegida: Redirigiendo al login...");
      }
    }
  });
});
