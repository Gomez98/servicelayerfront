sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("myApp.Component", {
    metadata: {
      manifest: "json",
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
      this.getRouter().attachRouteMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {

      const sRouteName = oEvent.getParameter("name");
      const token = sessionStorage.getItem("jwt");
      if (sRouteName !== "Login" && !token) {
        const oRouter = this.getRouter();
        oRouter.navTo("Login", {}, true);
        sap.m.MessageToast.show("Por favor, inicie sesión para continuar.");
      }
    },

  });
});
