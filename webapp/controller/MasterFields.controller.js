sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "myApp/service/apiService"
], function (Controller, JSONModel, MessageToast, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.MasterFields", {
        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "camposModel");
        },

        onAfterRendering: function () {
            const oModel = this.getView().getModel("camposModel");
            apiService.getMasterFields()
                .then(response => {
                    oModel.setData({ fields: response.data.data });
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los datos del backend: " + (error.response?.data?.message || error.message));
                });
        },

        onOpenCreateDialog: function () {
            this.byId("idCreateMasterFieldDialog").open();
        },

        onCloseCreateDialog: function () {
            this.byId("idCreateMasterFieldDialog").close();
        },

        onSaveField: function () {
            const fieldName = this.byId("idFieldNameInput").getValue().trim();

            if (fieldName) {
                const newField = { name: fieldName };

                apiService.saveMasterFields(newField)
                    .then(response => {
                        const oModel = this.getView().getModel("camposModel");
                        const fields = oModel.getProperty("/fields") || [];
                        fields.push(response.data.data);
                        oModel.setProperty("/fields", fields);

                        MessageToast.show("Campo maestro creado correctamente.");
                        this.byId("idFieldNameInput").setValue("");
                        this.onCloseCreateDialog();
                    })
                    .catch(error => {
                        MessageToast.show("Error al crear el campo maestro: " + (error.response?.data?.message || error.message));
                    });
            } else {
                MessageToast.show("Por favor, ingresa un nombre válido.");
            }
        },

        onChangeActiveState: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("camposModel");
            const oModel = oContext.getModel();
            const fieldData = oContext.getObject();

            const newActiveState = oEvent.getParameter("state");
            fieldData.active = newActiveState;

            apiService.updateMasterField(fieldData)
                .then(() => {
                    MessageToast.show("Estado actualizado correctamente.");
                    oModel.refresh();
                })
                .catch(error => {
                    MessageToast.show("Error al actualizar el estado: " + (error.response?.data?.message || error.message));
                });
        }
    });
});
