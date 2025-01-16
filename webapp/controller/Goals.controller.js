sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/ui/core/mvc/XMLView",
    "myApp/service/apiService"
], function (Controller, MessageToast, JSONModel, Column, Text, ColumnListItem, XMLView, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.Goals", {
        onInit: function () {
            this._views = {};
            var oGoalModel = new JSONModel();
            var oSelectedGoalModel = new JSONModel();
            var oViewModel = new JSONModel({
                isTableVisible: true,
                isDetailVisible: false
            });

            this.getView().setModel(oGoalModel, "goalModel");
            this.getView().setModel(oSelectedGoalModel, "selectedGoal");
            this.getView().setModel(oViewModel, "viewModel");

            this._loadGoalsData();

            sap.ui.getCore().getEventBus().subscribe("GoalChannel", "DataUpdated", this._onDataUpdated, this);
        },

        _onDataUpdated: function () {
            this._loadGoalsData(); // Volver a cargar los datos
            MessageToast.show("Datos actualizados en la tabla.");
        },

        _loadGoalsData: function () {
            var oModel = this.getView().getModel("goalModel");

            apiService
                .getGoals()
                .then(response => {
                    oModel.setData({ goals: response.data });
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los datos: " + error.message);
                });
        },

        onViewDetails: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("goalModel");

            if (!oContext) {
                MessageToast.show("Error: No se pudo obtener el contexto.");
                return;
            }

            var oData = oContext.getObject();
            var oViewModel = this.getView().getModel("viewModel");
            apiService
                .getGoalDetails(oData.id)
                .then(response => {
                    if (response.data.content) {
                        this._createContentTable(JSON.parse(response.data.content));
                    } else {
                        MessageToast.show("No hay contenido disponible.");
                    }

                    // Cambiar visibilidad
                    oViewModel.setProperty("/isTableVisible", false);
                    oViewModel.setProperty("/isDetailVisible", true);
                })
                .catch(error => {
                    MessageToast.show("Error al cargar el detalle: " + error.message);
                });
        },

        _createContentTable: function (aContent) {
            var oTable = this.getView().byId("contentTable");

            // Eliminar columnas y elementos existentes
            oTable.removeAllColumns();
            oTable.removeAllItems();

            if (aContent.length === 0) {
                return;
            }

            // Crear columnas dinámicas
            var aKeys = Object.keys(aContent[0]);
            console.log("aKeys", aKeys)
            aKeys.forEach(key => {
                oTable.addColumn(new Column({
                    header: new Text({ text: key })
                }));
            });

            // Crear filas dinámicas
            aContent.forEach(row => {
                var aCells = aKeys.map(key => new Text({ text: row[key] }));
                var oRow = new ColumnListItem({ cells: aCells });
                oTable.addItem(oRow);
            });
        },

        onNavBack: function () {
            var oViewModel = this.getView().getModel("viewModel");

            oViewModel.setProperty("/isTableVisible", true);
            oViewModel.setProperty("/isDetailVisible", false);
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
        },

        onExportData: function () {
            MessageToast.show("Exportar Data aún no implementado.");
        },

        onPrintDetails: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("goalModel");
            const oData = oContext.getObject();
        
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
        
            doc.setFontSize(12);
            doc.text("Detalles de la Cabecera", 10, 10);
        
            // Cambiar tamaño de letra para los datos de la cabecera
            doc.setFontSize(10);
            doc.text(`ID: ${oData.id}`, 10, 20);
            doc.text(`Descripción: ${oData.description}`, 10, 30);
            doc.text(`Creado por: ${oData.createdBy}`, 150, 20);
            doc.text(`Modificado por: ${oData.modifiedBy}`, 150, 30);
            doc.text(`Estado: ${oData.status}`, 10, 40);
        
            // Obtener detalles asociados a la cabecera
            apiService
                .getGoalDetails(oData.id)
                .then(response => {
                    if (response.data.content) {
                        const aDetails = JSON.parse(response.data.content);
                        doc.setFontSize(10);
                        // Preparar datos para la tabla
                        const columns = Object.keys(aDetails[0]).map(key => ({ header: key, dataKey: key }));
                        const rows = aDetails;
        
                        // Configurar opciones de la tabla
                        doc.autoTable({
                            startY: 50, // Comienza debajo del texto
                            head: [columns.map(col => col.header)], // Nombres de las columnas
                            body: rows.map(row => columns.map(col => row[col.dataKey])), // Datos de las filas
                            theme: 'grid', // Estilo de la tabla
                            headStyles: { fillColor: [148, 99, 174] }, // Color del encabezado
                            bodyStyles: { textColor: [0, 0, 0] }, // Color del texto
                            margin: { top: 10, bottom: 10 }, // Márgenes de la tabla
                            didDrawPage: function (data) {
                                // Agregar un pie de página
                                const pageHeight = doc.internal.pageSize.height;
                                doc.setFontSize(8);
                                doc.text(`Página ${doc.internal.getNumberOfPages()}`, 10, pageHeight - 10);
                            },
                        });
        
                        // Guardar el PDF
                        doc.save(`Detalle_Meta_${oData.id}.pdf`);
                    } else {
                        MessageToast.show("No hay contenido asociado para imprimir.");
                    }
                })
                .catch(error => {
                    MessageToast.show("Error al obtener los detalles: " + error.message);
                });
        }
    });
});
