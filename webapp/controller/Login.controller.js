sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "myApp/service/apiService"
], function (Controller, MessageToast, apiService) {
  "use strict";

  return Controller.extend("myApp.controller.Login", {

    onLogin: function () {

      const oUsername = this.byId("usernameInput").getValue().trim();
      const oPassword = this.byId("passwordInput").getValue().trim();

      if (!oUsername || !oPassword) {
        MessageToast.show("Por favor, ingrese usuario y contraseña.");
        return;
      }
      apiService
        .login({ username: oUsername, password: oPassword })
        .then((response) => {
          sessionStorage.setItem("jwt", response.data.data);
          sap.ui.core.UIComponent.getRouterFor(this).navTo("main");
      
          this.getView().byId("usernameInput").setValue("");
          this.getView().byId("passwordInput").setValue("");
          MessageToast.show("Login exitoso. Redirigiendo: ");
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message || "Error desconocido.";
          MessageToast.show("Error en el inicio de sesión: " + errorMessage);
        });
    },
  });
});
