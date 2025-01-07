sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "myApp/service/apiService" // Importar el servicio
], function (Controller, apiService) {
  "use strict";

  return Controller.extend("myApp.controller.Login", {
      onLogin: function () {
          const oUsername = this.byId("usernameInput").getValue();
          const oPassword = this.byId("passwordInput").getValue();

          // Llamar al método de login del servicio
          apiService
              .login({ username: oUsername, password: oPassword })
              .then((response) => {
                console.log("RESPONSE", response)
                  sessionStorage.setItem("jwt", response.data.token); // Almacena el JWT
                  const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                  oRouter.navTo("Main"); // Redirige al Main
              })
              .catch((error) => {
                  sap.m.MessageToast.show("Error en el inicio de sesión: " + (error.response?.data?.message || error.message));
              });
      }
  });
});
