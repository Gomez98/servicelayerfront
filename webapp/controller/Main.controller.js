sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/mvc/XMLView",
    "sap/m/MessageToast"
  ], function (Controller, XMLView, JSONModel) {
    "use strict";
  
    return Controller.extend("myApp.controller.Main", {
      onInit: function () {
        var userModel = new JSONModel();
        this.getView().setModel(userModel, "userModel");
        apiService.getUSer()
          .then(response => {
            userModel.setData({ user: response.data.data });
            console.log("response",response)
          })
          .catch(error => {
              sap.m.MessageToast.show("Error al cargar datos de usuario");
          });

        this._views = {};
      },
  
      onSideNavItemSelect: function (oEvent) {
  
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
  