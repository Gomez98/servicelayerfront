sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "myApp/service/apiService"
], function (Controller, MessageToast, JSONModel, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.GoalsDetail", {
        onInit: function () {
            const oViewModel = new JSONModel({
                isLoading: true,
                goalDetails: []
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Obtener goalId desde `viewData` si se pasa como parámetro
            const oViewData = this.getView().getViewData();
            const goalId = oViewData ? oViewData.goalId : null;

            if (goalId) {
                this.loadGoalDetails(goalId);
            } else {
                console.warn("⚠️ No se recibió `goalId` en GoalsDetail.");
            }
        },

        loadGoalDetails: function (goalId) {
            console.log("🔍 Cargando detalles para goalId:", goalId);

            const oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/isLoading", true);

            apiService.getGoalDetails(goalId)
                .then(response => {
                    if (response.data.data.content) {
                        const content = JSON.parse(response.data.data.content);
                        console.log("response.data.data", response.data.data)
                        console.log("content", content)

                        const goalHeader = response.data.data.goalHeader;
                        console.log("goalHeader", goalHeader)
                        let oGoalModel = this.getView().getModel("goalModel");
                        if (!oGoalModel) {
                            oGoalModel = new JSONModel();
                            this.getView().setModel(oGoalModel, "goalModel");
                        }

                        oGoalModel.setProperty("/titleName", goalHeader.description);
                        oGoalModel.setProperty("/details", content);
                        this._createContentTable(content);
                    } else {
                        MessageToast.show("⚠️ No hay contenido disponible.");
                    }

                    this.selectedGoal = goalId;
                    oViewModel.setProperty("/isLoading", false);
                })
                .catch(error => {
                    MessageToast.show("❌ Error al obtener detalles: " + error.message);
                    oViewModel.setProperty("/isLoading", false);
                });
        },

        onNavBack: function () {
            let oDynamicContent = this.getView().getParent();
            if (!oDynamicContent) {
                console.error("❌ No se encontró el contenedor `dynamicContent`.");
                return;
            }

            oDynamicContent.removeAllItems();

            sap.ui.core.mvc.XMLView.create({
                viewName: "myApp.view.Goals"
            }).then(oGoalsView => {
                oDynamicContent.addItem(oGoalsView);
            }).catch(error => {
                console.error("❌ Error al cargar `Goals.view.xml`:", error);
            });
        },

        _createContentTable: function (aContent) {
            const oTable = this.getView().byId("contentTable");

            if (!oTable) {
                console.error("❌ No se encontró la tabla `contentTable`.");
                return;
            }

            oTable.removeAllColumns();
            oTable.removeAllItems();

            if (!aContent || aContent.length === 0) {
                MessageToast.show("⚠️ No hay datos para mostrar.");
                return;
            }

            const aKeys = Object.keys(aContent[0]);

            aKeys.forEach(key => {
                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Text({ text: key }),
                    hAlign: "Center"
                }));
            });

            oTable.addColumn(new sap.m.Column({
                header: new sap.m.Text({ text: "Acciones" }),
                hAlign: "Center"
            }));

            aContent.forEach((row, rowIndex) => {
                const aCells = aKeys.map(key =>
                    new sap.m.Input({
                        value: `{goalModel>/details/${rowIndex}/${key}}`,
                        editable: true
                    })
                );

                const oDeleteButton = new sap.m.Button({
                    text: "Eliminar",
                    icon: "sap-icon://delete",
                    press: this.onDeleteRow.bind(this, rowIndex)
                });

                const oActionCell = new sap.m.HBox({
                    items: [oDeleteButton],
                    justifyContent: "Center"
                });

                aCells.push(oActionCell);

                oTable.addItem(new sap.m.ColumnListItem({
                    cells: aCells
                }));
            });
        },

        onSave: function () {
            const oModel = this.getView().getModel("goalModel");
            if (!oModel) {
                MessageToast.show("⚠️ No se encontró el modelo `goalModel`.");
                return;
            }

            const content = oModel.getProperty("/details");
            if (!content) {
                MessageToast.show("⚠️ No hay datos para guardar.");
                return;
            }

            const requestDetails = {
                id: this.selectedGoal,
                content: JSON.stringify(content)
            };
            console.log("requestDetails", requestDetails)
            apiService.updateDetails(requestDetails)
                .then(response => {
                    MessageToast.show("✅ Datos guardados correctamente.");
                })
                .catch(error => {
                    MessageToast.show("❌ Error al guardar los datos: " + error.message);
                });
        },

        onAddRow: function () {
            const oModel = this.getView().getModel("goalModel");
            if (!oModel) {
                MessageToast.show("⚠️ No se encontró el modelo `goalModel`.");
                return;
            }

            const content = oModel.getProperty("/details");
            if (!content) {
                MessageToast.show("⚠️ No hay detalles cargados.");
                return;
            }

            const newRecord = {};
            const keys = Object.keys(content[0]);

            keys.forEach(key => {
                newRecord[key] = "";
            });

            content.unshift(newRecord);
            oModel.setProperty("/details", content);
            this._createContentTable(content);

            MessageToast.show("➕ Nuevo registro agregado.");
        },

        onDeleteRow: function (rowIndex) {
            const oModel = this.getView().getModel("goalModel");
            if (!oModel) {
                MessageToast.show("⚠️ No se encontró el modelo `goalModel`.");
                return;
            }

            const content = oModel.getProperty("/details");
            if (content && content[rowIndex]) {
                content.splice(rowIndex, 1);
                oModel.setProperty("/details", content);
                this._createContentTable(content);

                const requestDetails = {
                    id: this.selectedGoal,
                    content: JSON.stringify(content)
                };

                apiService.updateDetails(requestDetails)
                    .then(response => {
                        MessageToast.show("✅ Registro eliminado correctamente.");
                    })
                    .catch(error => {
                        MessageToast.show("❌ Error al eliminar el registro: " + error.message);
                    });
            } else {
                MessageToast.show("⚠️ No se encontró la fila para eliminar.");
            }
        }
    });
});
