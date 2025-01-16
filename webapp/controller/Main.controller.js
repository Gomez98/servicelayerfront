sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/mvc/XMLView",
    "sap/m/MessageToast"
  ], function (Controller, XMLView, MessageToast) {
    "use strict";
  
    return Controller.extend("myApp.controller.Main", {
      onInit: function () {
        const token = sessionStorage.getItem("jwt");
        if (!token) {
          const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.navTo("Login"); // Redirige al login si no hay token
          MessageToast.show("Por favor, inicie sesión.");
        }
        this._views = {};
      },
  
      onSideNavItemSelect: function (oEvent) {
        const token = sessionStorage.getItem("jwt");
        if (!token) {
          sap.m.MessageToast.show("Acceso denegado. Por favor, inicie sesión.");
          return;
        }
  
        var sKey = oEvent.getParameter("item").getKey();
        var oDynamicContent = this.byId("dynamicContent");
  
        oDynamicContent.removeAllItems();
  
        let sViewName;
  
        switch (sKey) {
          case "verMetas":
            sViewName = "myApp.view.Goals";
            break;
          case "camposMaestros":
            sViewName = "myApp.view.MasterFields";
            break;
          case "reports":
            sViewName = "myApp.view.Reports";
            break;
          case "servicios":
            sViewName = "myApp.view.Services";
            break;
        }
  
        if (sViewName) {
          if (!this._views[sViewName]) {
            XMLView.create({
              viewName: sViewName,
            }).then(
              function (oView) {
                this._views[sViewName] = oView;
                oDynamicContent.addItem(oView);
              }.bind(this)
            );
          } else {
            oDynamicContent.addItem(this._views[sViewName]);
          }
        }
      },
    });
  });
  