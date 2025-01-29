sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/mvc/XMLView",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "myApp/service/apiService"
], function (Controller, XMLView, JSONModel, MessageToast, apiService) {
  "use strict";

  return Controller.extend("myApp.controller.Main", {

    onInit: function () {
      this._views = {}; // Cache para las vistas dinámicas
      this._initializeModels(); // Inicializar modelos
      this._checkAuthentication(); // Verificar si el usuario está autenticado
      this._updateUserData(); // Cargar datos del usuario
      this._setupTapEvent();
    },

    _setupTapEvent: function () {
      const homeContainer = this.getView().byId("homeContainer");

      if (homeContainer) {
        homeContainer.attachBrowserEvent("click", this.onHomePress.bind(this));
      }
    },

    _initializeModels: function () {
      // Modelo del usuario
      const userModel = new JSONModel();
      this.getView().setModel(userModel, "userModel");

      // Modelo para controlar la visibilidad del menú
      const viewModel = new JSONModel({
        isCardMenuVisible: true, // Mostrar las tarjetas inicialmente
        isSideNavVisible: false, // Ocultar el menú lateral inicialmente
        metasVisible: false,
        reportsVisible: false,
        serviciosVisible: false,
        logoutVisible: true // Siempre visible
      });
      this.getView().setModel(viewModel, "viewModel");
    },

    onHomePress: function () {
      const viewModel = this.getView().getModel("viewModel");
      viewModel.setProperty("/isCardMenuVisible", true);
      viewModel.setProperty("/isSideNavVisible", false);
    },

    onSideNavItemSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey(); // Obtén la clave del ítem seleccionado
      const viewModel = this.getView().getModel("viewModel");
      console.log("SKEY", sKey)
      switch (sKey) {
        case "metas":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          this._loadView("myApp.view.Goals"); // Carga la vista de metas
          break;

        case "verMetas":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          this._loadView("myApp.view.Goals"); // Carga la vista de metas
          break;

        case "camposMaestros":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          this._loadView("myApp.view.MasterFields"); // Carga la vista de metas
          break;
        case "reports":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", false);
          viewModel.setProperty("/reportsVisible", true);
          viewModel.setProperty("/servicesVisible", false);
          this._loadView("myApp.view.Reports"); // Carga la vista de reportes
          break;

        case "servicios":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", false);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", true);
          this._loadView("myApp.view.Services"); // Carga la vista de servicios
          break;

        case "logout":
          this._logout(); // Cierra la sesión
          break;

        default:
          MessageToast.show("Opción no reconocida.");
      }
    },

    onCardSelect: function (oEvent) {
      const customData = oEvent.getSource().getCustomData().find(data => data.getKey() === "action");
      if (!customData) {
        MessageToast.show("Opción no reconocida.");
        return;
      }

      const key = customData.getValue();
      const viewModel = this.getView().getModel("viewModel");

      viewModel.setProperty("/isCardMenuVisible", false);
      viewModel.setProperty("/isSideNavVisible", true);
      viewModel.setProperty("/metasVisible", false);
      viewModel.setProperty("/reportsVisible", false);
      viewModel.setProperty("/servicesVisible", false);

      switch (key) {
        case "metas":
          viewModel.setProperty("/metasVisible", true);
          this._loadView("myApp.view.Goals");
          break;
        case "reports":
          viewModel.setProperty("/reportsVisible", true);
          this._loadView("myApp.view.Reports");
          break;
        case "servicios":
          viewModel.setProperty("/servicesVisible", true);
          this._loadView("myApp.view.Services");
          break;
        case "logout":
          this._logout();
          break;
        default:
          MessageToast.show("Opción no reconocida.");
      }
    },

    _loadView: function (viewName) {
      const oDynamicContent = this.getView().byId("dynamicContent");

      if (!oDynamicContent) {
        console.error("El contenedor dynamicContent no existe.");
        return;
      }

      oDynamicContent.removeAllItems();
      console.log("viewName", viewName)
      if (!this._views[viewName]) {
        sap.ui.core.mvc.XMLView.create({ viewName })
          .then(oView => {
            this._views[viewName] = oView;
            oDynamicContent.addItem(oView);
          })
          .catch(error => {
            console.error(`Error al cargar la vista ${viewName}:`, error);
          });
      } else {
        oDynamicContent.addItem(this._views[viewName]);
      }
    },

    _logout: function () {
      sessionStorage.removeItem("jwt");
      sap.ui.core.UIComponent.getRouterFor(this).navTo("login", {}, true);
      MessageToast.show("Has cerrado sesión correctamente.");
    },

    _checkAuthentication: function () {
      const token = sessionStorage.getItem("jwt");
      if (!token) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("login", {}, true);
        this._showMessage("No autorizado. Redirigiendo al login...", "error");
      }
    },

    _updateUserData: function () {
      const userModel = this.getView().getModel("userModel");

      if (!userModel) {
        console.error("El modelo de usuario no está inicializado.");
        return;
      }

      apiService.getUser()
        .then(response => {
          userModel.setData({ user: response.data.data });
          this._showMessage("Datos de usuario actualizados.", "success");
        })
        .catch(error => {
          this._showMessage("Error al cargar datos de usuario.", "error");
          console.error("Error en el servicio getUser:", error);
        });
    },

    _showMessage: function (sMessage, sType) {
      MessageToast.show(sMessage, {
        type: sType || "info",
        duration: 3000
      });
    }
  });
});
