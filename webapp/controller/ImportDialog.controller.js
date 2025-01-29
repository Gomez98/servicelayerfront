sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item",
    "myApp/service/apiService"
], function (Controller, MessageToast, JSONModel, Column, Text, ColumnListItem, Label, Select, Item, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.ImportDialog", {
        onInit: function () {
            this._fileContent = null;
            this._headers = [];
            this._fileUploaded = false;

            const oNavContainer = this.byId("navContainer");
            oNavContainer.to(this.byId("fileUploaderPage"));
        },

        onFileChange: function (oEvent) {
            const oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];

            if (!oFile) {
                MessageToast.show("Seleccione un archivo.");
                return;
            }
            const sFileType = oFile.name.split(".").pop().toLowerCase();
            const reader = new FileReader();


            reader.onload = e => {
                const arrayBuffer = e.target.result;
                if (sFileType === "csv") {
                    this._processCSV(arrayBuffer);
                } else if (sFileType === "xlsx") {
                    this._processExcel(arrayBuffer);
                }
                this._fileUploaded = true;
                MessageToast.show("Archivo cargado exitosamente.");
            };


            if (sFileType === "xlsx") {
                reader.readAsArrayBuffer(oFile);
            } else {
                reader.readAsText(oFile);
            }
        },

        _processCSV: function (sContent) {
            const aRows = sContent.split("\n").map(row => row.split(","));
            this._headers = aRows[0];
            this._createTableContent(aRows);
        },

        _processExcel: function (arrayBuffer) {
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const aJsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            this._headers = aJsonData[0];
            this._fileContent = aJsonData;
            this._createTableContent(aJsonData);
        },

        _createTableContent: function (aData) {
            const oTable = this.byId("contentTable");

            oTable.removeAllColumns();
            oTable.removeAllItems();

            this._headers.forEach(header => {
                oTable.addColumn(new Column({
                    header: new Text({ text: header.trim() })
                }));
            });

            aData.slice(1, 10).forEach(row => {
                const aCells = row.map(cell => new Text({ text: cell }));
                oTable.addItem(new ColumnListItem({ cells: aCells }));
            });

            oTable.setVisible(true);
            const oDialog = this.byId("importDataDialog");
            oDialog.setContentHeight("600px");
            oDialog.setContentWidth("800px");

            this._navigateTo("tablePage");
        },

        onNavBack: function () {
            const oNavContainer = this.byId("navContainer");
            if (oNavContainer.getPreviousPage()) {
                oNavContainer.back();
            } else {
                MessageToast.show("Ya estás en la primera página.");
            }
        },

        onAccept: function () {
            const oNavContainer = this.byId("navContainer");
            const oCurrentPage = oNavContainer.getCurrentPage();
            const sCurrentPageId = oCurrentPage.getId().split("--").pop();
            console.log("sCurrentPageId", sCurrentPageId)
            if (sCurrentPageId === "fileUploaderPage") {
                // Validar que se haya subido un archivo antes de avanzar
                if (!this._fileUploaded) {
                    MessageToast.show("Por favor, cargue un archivo antes de continuar.");
                    return;
                }
                this._navigateTo("tablePage");
            } else if (sCurrentPageId === "tablePage") {
                // Si estamos en tablePage, ejecutar _populateHeaderMapping antes de avanzar
                this._populateHeaderMapping();
                this._navigateTo("headerMappingPage");
            } else if (sCurrentPageId === "headerMappingPage") {
                // Si estamos en headerMappingPage, ejecutar descriptionPage antes de avanzar

                this._navigateTo("descriptionPage");
            }
        },

        _populateHeaderMapping: function () {
            const oMappingContainer = this.byId("headerMapping");
            oMappingContainer.removeAllItems();

            apiService.getMasterFields()
                .then(fields => {
                    this._headers.forEach(header => {
                        const oLabel = new Label({ text: header });
                        const oSelect = new Select();
                        oSelect.addItem(new Item({ key: "", text: "---Seleccione Campo---" }));
                        fields.data.data.forEach(field => {
                            if (field.active) {
                                oSelect.addItem(new Item({ key: field.name, text: field.name }));
                            }
                        });

                        const oHBox = new sap.m.HBox({
                            width: "100%",
                            items: [oLabel, oSelect], // Coloca el Label y el Select en el HBox
                            justifyContent: "Start", // Espacio entre elementos
                            alignItems: "Center" // Centrado verticalmente
                        });
                        oLabel.setWidth("150px"); // Fijar un ancho consistente para los Labels
                        oLabel.addStyleClass("sapUiTinyMarginEnd"); // Añadir un pequeño margen al final del Label
                        oSelect.setWidth("auto");
                        oMappingContainer.addItem(oHBox);
                    });

                    oMappingContainer.setVisible(true);
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los campos maestros.");
                });
        },


        onFinish: function () {
            const oMappingContainer = this.byId("headerMapping");
            const oDescriptionInput = this.byId("descriptionInput");
            const mappings = [];

            oMappingContainer.getItems().forEach((oHBox) => {
                if (oHBox.isA("sap.m.HBox")) {
                    const aItems = oHBox.getItems();
                    const oLabel = aItems[0];
                    const oSelect = aItems[1];

                    if (oLabel && oLabel.isA("sap.m.Label") && oSelect && oSelect.isA("sap.m.Select")) {
                        const labelText = oLabel.getText();
                        const selectedKey = oSelect.getSelectedKey();

                        if (selectedKey) {
                            mappings.push({
                                label: labelText,
                                selected: selectedKey
                            });
                        }
                    }
                }
            });

            const description = oDescriptionInput.getValue();

            const content = this._fileContent.slice(1).map(row => {
                const obj = {};
                row.forEach((cell, index) => {
                    const header = this._headers[index];
                    const mapping = mappings.find(m => m.label === header);
                    if (mapping) {
                        obj[mapping.selected] = cell;
                    }
                });
                return obj;
            });

            apiService.saveHeader({ description })
                .then(header => {
                    console.log("header", header);
                    return apiService.saveDetails({
                        goalHeader: { id: header.data.data.id },
                        content: JSON.stringify(content)
                    });
                })
                .then(() => {
                    MessageToast.show("Datos guardados exitosamente.");
                    sap.ui.getCore().getEventBus().publish("GoalChannel", "DataUpdated");
                })
                .catch(error => {
                    MessageToast.show("Error al guardar los datos.");
                });

            this.onCloseImportDialog();
        },

        _navigateTo: function (sPageId) {
            const oNavContainer = this.byId("navContainer");
            oNavContainer.to(this.byId(sPageId), "slide");
        },

        onCloseImportDialog: function () {
            this._fileContent = null;
            this._headers = [];
            this._fileUploaded = false;
        
            // Navegar a la página inicial
            const oNavContainer = this.byId("navContainer");
            oNavContainer.to(this.byId("fileUploaderPage"));
        
            // Limpiar el FileUploader
            const oFileUploader = this.byId("fileUploader");
            if (oFileUploader) {
                oFileUploader.setValue(""); // Restablecer el valor del FileUploader
            }
        
            // Limpiar la tabla
            const oTable = this.byId("contentTable");
            if (oTable) {
                oTable.removeAllColumns();
                oTable.removeAllItems();
                oTable.setVisible(false);
            }
        
            // Limpiar el contenedor de mapeo
            const oMappingContainer = this.byId("headerMapping");
            if (oMappingContainer) {
                oMappingContainer.removeAllItems();
            }
        
            // Limpiar el campo de descripción
            const oDescriptionInput = this.byId("descriptionInput");
            if (oDescriptionInput) {
                oDescriptionInput.setValue("");
            }
        
            this.byId("importDataDialog").close();
        }
    });
});
