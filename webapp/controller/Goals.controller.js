sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "myApp/service/apiService",
    "sap/ui/core/mvc/XMLView"
], function (Controller, MessageToast, JSONModel, apiService, XMLView) {
    "use strict";

    return Controller.extend("myApp.controller.Goals", {
        onInit: function () {
            this._views = {};
            const oGoalModel = new JSONModel({
                goals: {
                    totalGoals: 0,
                    goalHeaders: []
                }
            });
            const oSelectedGoalModel = new JSONModel();

            this.getView().setModel(oGoalModel, "goalModel");
            this.getView().setModel(oSelectedGoalModel, "selectedGoal");
            this._loadGoalsData();
        },

        _loadGoalsData: function () {
            const oModel = this.getView().getModel("goalModel");
            apiService.getGoals()
                .then(response => {
                    let data = response.data.data || { goalHeaders: [], totalGoals: 0 };
                    oModel.setProperty("/goals/goalHeaders", data.goalHeaders);
                    oModel.setProperty("/goals/totalGoals", data.totalGoals);
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los datos: " + error.message);
                });
        },

        onViewDetails: function (oEvent) {
            const oItem = oEvent.getSource();
            const oContext = oItem.getBindingContext("goalModel");
            const goalId = oContext.getObject().id;
            console.log("goalId",goalId)
            sap.ui.core.UIComponent.getRouterFor(this).navTo("GoalsDetail", { goalId: goalId });
            
        },

        onOpenImportDialog: function () {
            var sViewName = "myApp.view.ImportDialog";

            if (!this._views[sViewName]) {
                XMLView.create({
                    viewName: sViewName
                }).then(function (oView) {
                    this._views[sViewName] = oView;
                    this.getView().addDependent(oView);
                    var oDialog = oView.byId("importDataDialog");
                    if (oDialog) {
                        oDialog.open();
                    } else {
                        MessageToast.show("Error: No se pudo encontrar el diálogo en la vista.");
                    }
                }.bind(this));
            } else {
                var oDialog = this._views[sViewName].byId("importDataDialog");
                if (oDialog) {
                    oDialog.open();
                } else {
                    MessageToast.show("Error: No se pudo encontrar el diálogo en la vista.");
                }
            }
        }
    });
});
