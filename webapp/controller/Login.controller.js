sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "myApp/service/apiService"
], function (Controller, apiService) {
  "use strict";

  return Controller.extend("myApp.controller.Login", {
      onLogin: function () {
          const oUsername = this.byId("usernameInput").getValue();
          const oPassword = this.byId("passwordInput").getValue();

          apiService
              .login({ username: oUsername, password: oPassword })
              .then((response) => {
                  sessionStorage.setItem("jwt", response.data.data.token); 
                  const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                  oRouter.navTo("Main");
              })
              .catch((error) => {
                  sap.m.MessageToast.show("Error en el inicio de sesión: " + (error.response?.data?.message || error.message));
              });
      }
  });
});
