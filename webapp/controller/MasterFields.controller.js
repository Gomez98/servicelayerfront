sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "myApp/service/apiService" 
], function (Controller, JSONModel, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.MasterFields", {
        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "camposModel");
            apiService.getMasterFields()
                .then(response => {
                    oModel.setData({ fields: response.data.data });
                    console.log("MATERDATA",oModel)
                    console.log("response",oModel)

                })
                .catch(error => {
                    sap.m.MessageToast.show("Error al cargar los datos del backend: " + error.message);
                });
        },
        onOpenCreateDialog: function () {
            this.byId("idCreateMasterFieldDialog").open();
        },
        
        onCloseCreateDialog: function () {
            this.byId("idCreateMasterFieldDialog").close();
        },
        
        onSaveField: function () {
            const fieldName = this.byId("idFieldNameInput").getValue();
            if (fieldName) {
                const newField = { name: fieldName };
                apiService.saveMasterFields(newField)
                    .then(response => {
                        const oModel = this.getView().getModel("camposModel");
                        const fields = oModel.getData().fields || [];
                        fields.push(response.data);
                        oModel.setData({ fields });
                        console.log("MATERDATA",oModel)
                        sap.m.MessageToast.show("Campo maestro creado correctamente.");
                        this.onCloseCreateDialog();
                    })
                    .catch(error => {
                        sap.m.MessageToast.show("Error al crear el campo maestro: " + error.message);
                    });
            } else {
                sap.m.MessageToast.show("Por favor, ingresa un nombre válido.");
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
                    sap.m.MessageToast.show("Estado actualizado correctamente.");
                })
                .catch(error => {
                    sap.m.MessageToast.show("Error al actualizar el estado: " + error.message);
                });
        
            oModel.refresh();
        }
        
        
    });
});
