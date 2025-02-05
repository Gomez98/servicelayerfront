sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "myApp/service/apiService"
], function (Controller, MessageToast, JSONModel, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.GoalsDetail", {
        onInit: function () {
            console.log("DETALLE")
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("GoalsDetail").attachPatternMatched(this._onObjectMatched, this);

            
            const oViewModel = new JSONModel({
                isLoading: true,
                goalDetails: {}
            });

            this.getView().setModel(oViewModel, "viewModel");
        },

        _onObjectMatched: function (oEvent) {
            console.log("oEvent.getParameter(arguments)", oEvent.getParameter("arguments"))
            const goalId = oEvent.getParameter("arguments").goalId;
            this._loadGoalDetails(goalId);
        },

        _loadGoalDetails: function (goalId) {
            const oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/isLoading", true);

            apiService.getGoalDetails(goalId)
                .then(response => {
                    if (response.data.data) {
                        oViewModel.setProperty("/goalDetails", response.data.data);
                        MessageToast.show("Detalles cargados correctamente.");
                    } else {
                        MessageToast.show("No hay contenido disponible.");
                    }
                    oViewModel.setProperty("/isLoading", false);
                })
                .catch(error => {
                    MessageToast.show("Error al obtener detalles: " + error.message);
                    oViewModel.setProperty("/isLoading", false);
                });
        },

        onNavBack: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Goals");
        },
        onSave: function () {
            const content = oModel.getProperty(`/details`);

            if (!content) {
                MessageToast.show("No hay datos para guardar.");
                return;
            }

            const requestDetails = {
                id: this.selectedGoal,
                content: JSON.stringify(content)
            };

            apiService.updateDetails(requestDetails)
                .then(response => {
                    MessageToast.show("Datos guardados correctamente.");
                })
                .catch(error => {
                    MessageToast.show("Error al guardar los datos: " + error.message);
                });
        },

        onAddRow: function () {
            /* const oModel = this.getView().getModel("goalModel");
             const content = oModel.getProperty("/details");
 
             if (!content) {
                 MessageToast.show("No hay detalles cargados. Verifique los datos.");
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
 */
            MessageToast.show("Nuevo registro agregado.");
        },

        onDeleteRow: function (rowIndex) {
            /*
            const oModel = this.getView().getModel("goalModel");
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
                        MessageToast.show("Registro eliminado correctamente.");
                    })
                    .catch(error => {
                        MessageToast.show("Error al eliminar el registro: " + error.message);
                    });
            } else {
                MessageToast.show("No se encontró la fila para eliminar.");
            }*/
        },
        _createContentTable: function (aContent) {
            /*
            const oTable = this.getView().byId("contentTable");
            oTable.removeAllColumns();
            oTable.removeAllItems();

            if (!aContent || aContent.length === 0) {
                MessageToast.show("No hay datos para mostrar.");
                return;
            }

            const aKeys = Object.keys(aContent[0]);

            // Agregar columnas dinámicamente
            aKeys.forEach(key => {
                oTable.addColumn(new Column({
                    header: new Text({ text: key }),
                    hAlign: "Center"
                }));
            });

            // Agregar columna de acciones
            oTable.addColumn(new Column({
                header: new Text({ text: "Acciones" }),
                hAlign: "Center"
            }));

            // Renderizar filas
            aContent.forEach((row, index) => {
                const aCells = aKeys.map(key =>
                    new sap.m.Input({
                        value: `{goalModel>/details/${index}/${key}}`,
                        editable: true
                    })
                );

                const oDeleteButton = new Button({
                    text: "Eliminar",
                    icon: "sap-icon://delete",
                    press: () => this.onDeleteRow(index)
                });

                const oActionCell = new sap.m.HBox({
                    items: [oDeleteButton],
                    justifyContent: "Center"
                });

                aCells.push(oActionCell);

                oTable.addItem(new ColumnListItem({
                    cells: aCells
                }));
            });*/

        }


    });
});
