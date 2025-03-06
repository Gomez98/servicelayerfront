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
      this._onToggleSideContent();

    },
    onBeforeRendering: function () {
      this._views = {};
      this._initializeModels();
      this._checkAuthentication();
      this._updateUserData();
      this._setupTapEvent();
    },

    _onToggleSideContent: function () {
      const homeContainer = this.getView().byId("menuIconContainer");
      if (homeContainer) {
        homeContainer.attachBrowserEvent("click", this._onIconContainerPress.bind(this));
      }
    },

    _onIconContainerPress: function () {
      const oSideNavigation = this.byId("sideNavId");
      const bExpanded = oSideNavigation.getExpanded();
      oSideNavigation.setExpanded(!bExpanded);
    },

    _setupTapEvent: function () {
      const homeContainer = this.getView().byId("homeContainer");

      if (homeContainer) {
        homeContainer.attachBrowserEvent("click", this.onHomePress.bind(this));
      }
    },

    _initializeModels: function () {
      const userModel = new JSONModel();
      this.getView().setModel(userModel, "userModel");

      const viewModel = new JSONModel({
        isCardMenuVisible: true,
        isSideNavVisible: false,
        metasVisible: false,
        reportsVisible: false,
        serviciosVisible: false,
        logoutVisible: true,
        isSideNavExpanded: false,
        isMenuIconContainer: false
      });
      this.getView().setModel(viewModel, "viewModel");
    },

    onHomePress: function () {
      const viewModel = this.getView().getModel("viewModel");
      viewModel.setProperty("/isCardMenuVisible", true);
      viewModel.setProperty("/isMenuIconContainer", false);
      viewModel.setProperty("/isSideNavVisible", false);
    },

    onSideNavItemSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      const viewModel = this.getView().getModel("viewModel");
      console.log("sKey",sKey)
      switch (sKey) {
        case "metas":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          viewModel.setProperty("/convertVisible", false);
          this._loadView("myApp.view.Goals");
          break;

        case "verMetas":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          viewModel.setProperty("/convertVisible", false);
          this._loadView("myApp.view.Goals");
          break;

        case "camposMaestros":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", true);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          viewModel.setProperty("/convertVisible", false);
          this._loadView("myApp.view.MasterFields");
          break;
        case "reports":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", false);
          viewModel.setProperty("/reportsVisible", true);
          viewModel.setProperty("/servicesVisible", false);
          viewModel.setProperty("/convertVisible", false);
          this._loadView("myApp.view.Reports");
          break;

        case "servicios":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", false);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", true);
          viewModel.setProperty("/convertVisible", false);

          this._loadView("myApp.view.Services");
          break;

        case "convert":
          viewModel.setProperty("/isCardMenuVisible", false);
          viewModel.setProperty("/metasVisible", false);
          viewModel.setProperty("/reportsVisible", false);
          viewModel.setProperty("/servicesVisible", false);
          viewModel.setProperty("/convertVisible", true);
          this._loadView("myApp.view.Convert");
          break;

        case "logout":
          this._logout();
          break;

        default:
          MessageToast.show("Opción no reconocida.");
      }
    },

    onCardSelect: function (oEvent) {
      const customData = oEvent.getSource().getCustomData().find(data => data.getKey() === "action");

      const key = customData.getValue();
      const viewModel = this.getView().getModel("viewModel");

      viewModel.setProperty("/isCardMenuVisible", false);
      viewModel.setProperty("/isSideNavVisible", true);
      viewModel.setProperty("/isMenuIconContainer", true);
      viewModel.setProperty("/metasVisible", false);
      viewModel.setProperty("/reportsVisible", false);
      viewModel.setProperty("/servicesVisible", false);
      viewModel.setProperty("/convertVisible", false);

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
        case "convert":
          viewModel.setProperty("/convertVisible", true);
          this._loadView("myApp.view.Convert");
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
      if (!this._views[viewName]) {
        sap.ui.core.mvc.XMLView.create({ viewName })
          .then(oView => {
            this._views[viewName] = oView;
            oDynamicContent.addItem(oView);
          })

      } else {
        oDynamicContent.addItem(this._views[viewName]);
      }
    },

    _logout: function () {
      sessionStorage.removeItem("jwt");

      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.navTo("login", {}, true);

      MessageToast.show("Has cerrado sesión correctamente.");
    },

    _checkAuthentication: function () {
      const token = sessionStorage.getItem("jwt");
      if (!token) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("login");
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