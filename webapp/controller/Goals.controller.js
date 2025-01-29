

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/Toolbar",
    "sap/m/Button",
    "sap/m/ToolbarSpacer",
    "myApp/service/apiService",
    "sap/ui/core/mvc/XMLView",
], function (Controller, MessageToast, JSONModel, Column, Text, ColumnListItem, Toolbar, Button, ToolbarSpacer, apiService, XMLView) {
    "use strict";

    return Controller.extend("myApp.controller.Goals", {
        onInit: function () {
            this._views = {};
            const oGoalModel = new JSONModel();
            const oSelectedGoalModel = new JSONModel();
            const oViewModel = new JSONModel({
                isTableVisible: true,
                isDetailVisible: false,
                currentPage: 1,
                totalPages: 0
            });

            this.getView().setModel(oGoalModel, "goalModel");
            this.getView().setModel(oSelectedGoalModel, "selectedGoal");
            this.getView().setModel(oViewModel, "viewModel");

            this._loadGoalsData();

            sap.ui.getCore().getEventBus().subscribe("GoalChannel", "DataUpdated", this._onDataUpdated, this);
        },

        _onDataUpdated: function () {
            this._loadGoalsData();
            MessageToast.show("Datos actualizados en la tabla.");
        },

        _loadGoalsData: function () {
            const oModel = this.getView().getModel("goalModel");

            apiService.getGoals()
                .then(response => {
                    oModel.setData({ goals: response.data.data });
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los datos: " + error.message);
                });
        },

        onViewDetails: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext("goalModel");

            if (!oContext) {
                MessageToast.show("Error: No se pudo obtener el contexto.");
                return;
            }

            const oData = oContext.getObject();
            const oViewModel = this.getView().getModel("viewModel");

            apiService.getGoalDetails(oData.id)
                .then(response => {
                    if (response.data.data.content) {
                        const content = JSON.parse(response.data.data.content);
                        this.getView().getModel("goalModel").setProperty("/details", content);
                        this._createContentTable(content);
                    } else {
                        MessageToast.show("No hay contenido disponible.");
                    }

                    oViewModel.setProperty("/isTableVisible", false);
                    oViewModel.setProperty("/isDetailVisible", true);
                    this.selectedGoal =  oData.id;
                })
                .catch(error => {
                    MessageToast.show("Error al cargar el detalle: " + error.message);
                });
        },

        _createContentTable: function (aContent) {
            const oTable = this.getView().byId("contentTable");
            const oViewModel = this.getView().getModel("viewModel");

            oTable.removeAllColumns();
            oTable.removeAllItems();

            if (!aContent || aContent.length === 0) {
                MessageToast.show("No hay datos para mostrar.");
                oTable.setVisible(true);
                return;
            }

            oTable.setVisible(true);
            const aKeys = Object.keys(aContent[0]);
            aKeys.forEach(key => {
                oTable.addColumn(new Column({
                    header: new Text({ text: key }),
                    hAlign: "Center"
                }));
            });

            oTable.addColumn(new Column({
                header: new Text({ text: "Acciones" }),
                hAlign: "Center"
            }));

            const iPageSize = 10;
            const iTotalPages = Math.ceil(aContent.length / iPageSize);
            oViewModel.setProperty("/totalPages", iTotalPages);

            const renderTablePage = (page) => {
                oTable.removeAllItems();

                const iStart = (page - 1) * iPageSize;
                const iEnd = iStart + iPageSize;
                const aPageContent = aContent.slice(iStart, iEnd);
                console.log("apageContent", aPageContent)
                aPageContent.forEach((row, rowIndex) => {
                    const aCells = aKeys.map(key => 
                        new sap.m.Input({
                            value: `{goalModel>/details/${iStart + rowIndex}/${key}}`,
                            editable: true
                        })
                    );

                    const oDeleteButton = new Button({
                        text: "Eliminar",
                        icon: "sap-icon://delete",
                        press: () => this.onDeleteRow(iStart + rowIndex)
                    });

                    const oActionCell = new sap.m.HBox({
                        items: [oDeleteButton],
                        justifyContent: "Center"
                    });

                    aCells.push(oActionCell);

                    oTable.addItem(new ColumnListItem({
                        cells: aCells
                    }));
                });
            };

            renderTablePage(oViewModel.getProperty("/currentPage"));

            const oToolbar = this._createPaginationToolbar(renderTablePage, oViewModel);
            oTable.setHeaderToolbar(oToolbar);
        },

        _createPaginationToolbar: function (renderTablePage, oViewModel) {
            return new Toolbar({
                content: [
                    new Button({
                        text: "Anterior",
                        enabled: "{= ${viewModel>/currentPage} > 1 }",
                        press: () => {
                            const currentPage = oViewModel.getProperty("/currentPage");
                            if (currentPage > 1) {
                                oViewModel.setProperty("/currentPage", currentPage - 1);
                                renderTablePage(currentPage - 1);
                            }
                        }
                    }),
                    new Text({
                        text: "Página {viewModel>/currentPage} de {viewModel>/totalPages}"
                    }),
                    new Button({
                        text: "Siguiente",
                        enabled: "{= ${viewModel>/currentPage} < ${viewModel>/totalPages} }",
                        press: () => {
                            const currentPage = oViewModel.getProperty("/currentPage");
                            const totalPages = oViewModel.getProperty("/totalPages");
                            if (currentPage < totalPages) {
                                oViewModel.setProperty("/currentPage", currentPage + 1);
                                renderTablePage(currentPage + 1);
                            }
                        }
                    }),
                    new ToolbarSpacer(),
                    new Button({
                        text: "Guardar Masivo",
                        icon: "sap-icon://save",
                        press: () => this.onSave()
                    }),
                    new Button({
                        text: "Agregar Registro",
                        icon: "sap-icon://add",
                        press: () => this.onAddRow()
                    })
                ]
            });
        },

        _updatePaginationButtons: function (oFooterToolbar, iCurrentPage, iTotalPages) {
            const aButtons = oFooterToolbar.getContent();
            const oPreviousButton = aButtons[0];
            const oNextButton = aButtons[2];
            const oPageText = aButtons[1];

            oPreviousButton.setEnabled(iCurrentPage > 1);
            oNextButton.setEnabled(iCurrentPage < iTotalPages);
            oPageText.setText(`Página ${iCurrentPage} de ${iTotalPages}`);
        },

        onPrintDetails: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("goalModel");
            const oData = oContext.getObject();

            const doc = new jsPDF();

            doc.setFontSize(12);
            doc.text("Detalles de la Cabecera", 10, 10);

            // Datos de la cabecera
            doc.setFontSize(10);
            doc.text(`ID: ${oData.id}`, 10, 20);
            doc.text(`Descripción: ${oData.description}`, 10, 30);
            doc.text(`Creado por: ${oData.createdBy}`, 150, 20);
            doc.text(`Modificado por: ${oData.modifiedBy}`, 150, 30);
            doc.text(`Estado: ${oData.status}`, 10, 40);

            apiService.getGoalDetails(oData.id)
                .then(response => {
                    if (response.data.data.content) {
                        const aDetails = JSON.parse(response.data.data.content);
                        const columns = Object.keys(aDetails[0]);
                        const rows = aDetails.map(detail => columns.map(col => detail[col]));

                        doc.autoTable({
                            startY: 50,
                            head: [columns],
                            body: rows,
                            theme: 'grid',
                            headStyles: { fillColor: [148, 99, 174] }
                        });

                        doc.save(`Detalle_Meta_${oData.id}.pdf`);
                    } else {
                        MessageToast.show("No hay contenido asociado para imprimir.");
                    }
                })
                .catch(error => {
                    MessageToast.show("Error al obtener los detalles: " + error.message);
                });
        },

        onSave: function (rowIndex) {
            const oModel = this.getView().getModel("goalModel");
            const content = oModel.getProperty(`/details`);
            console.log("goalModelDetails",content)
            const requestDetails = { id: this.selectedGoal, content: JSON.stringify(content) };
            apiService.updateDetails(requestDetails)
                .then(response => {
                    MessageToast.show("Registro actualizado correctamente.");
                })
                .catch(error => {
                    MessageToast.show("Error al actualizar el registro: " + error.message);
                });
        },

        onAddRow: function () {
            const oModel = this.getView().getModel("goalModel");
            const content = oModel.getProperty("/details");
        
            // Asegurarnos de que los datos de la tabla existan
            if (!content) {
                MessageToast.show("No hay detalles cargados. Por favor, verifique los datos.");
                return;
            }
        
            // Crear un nuevo registro inicializado basado en las claves
            const newRecord = {};
            const keys = Object.keys(content[0]); // Obtener las claves del primer registro existente
        
            // Inicializar las propiedades del nuevo registro con valores vacíos o predeterminados
            keys.forEach(key => {
                newRecord[key] = ""; // Puedes asignar un valor predeterminado si es necesario
            });
        
            // Agregar el nuevo registro al array de detalles
            content.unshift(newRecord);
        
            // Actualizar el modelo con el array modificado
            oModel.setProperty("/details", content);
        
            MessageToast.show("Nuevo registro agregado. Complete los datos y guarde los cambios.");
        },

        onDeleteRow: function (rowIndex) {
            const oModel = this.getView().getModel("goalModel");
            const content = oModel.getProperty("/details");
        
            if (content && content[rowIndex]) {
                content.splice(rowIndex, 1);
        
                oModel.setProperty("/details", content);
        
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
            }
        },
        
        onNavBack: function () {
            const oViewModel = this.getView().getModel("viewModel");
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
        }
    })
});
