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
            this._currentStep = 1; // Paso inicial
            this._fileContent = null; // Contenido del archivo
            this._description = null; // Descripción ingresada
            this._headers = []; // Cabeceras del archivo
        },

        onFileChange: function (oEvent) {
            const oFileUploader = this.byId("fileUploader");
            const oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            const oLoadingDialog = this.byId("loadingDialog");
            const oProgressIndicator = this.byId("progressIndicator");

            if (!oFile) {
                MessageToast.show("Seleccione un archivo.");
                return;
            }

            oProgressIndicator.setPercentValue(0); // Reinicia el progreso
            oProgressIndicator.setDisplayValue("0%");
            oLoadingDialog.open();

            const sFileType = oFile.name.split(".").pop().toLowerCase();
            if (sFileType !== "csv" && sFileType !== "xlsx") {
                MessageToast.show("Solo se permiten archivos .xlsx o .csv.");
                oFileUploader.setValue("");
                oLoadingDialog.close();
                return;
            }

            const reader = new FileReader();
            let simulatedProgress = 0;
            const simulateProgressInterval = setInterval(() => {
                if (simulatedProgress < 90) {
                    simulatedProgress += 2; // Incrementa lentamente para hacer la simulación más larga
                    oProgressIndicator.setPercentValue(simulatedProgress);
                    oProgressIndicator.setDisplayValue(simulatedProgress + "%");

                }
            }, 900); // Intervalo más largo para simular progreso lento

            reader.onloadstart = () => {
                oProgressIndicator.setPercentValue(0);
                oProgressIndicator.setDisplayValue("0%");
            };

            reader.onprogress = e => {
                clearInterval(simulateProgressInterval); // Detenemos la simulación si hay progreso real
                const progress = Math.round((e.loaded / e.total) * 100);
                oProgressIndicator.setPercentValue(progress);
                oProgressIndicator.setDisplayValue(progress + "%");
            };

            reader.onload = e => {
                clearInterval(simulateProgressInterval); // Detenemos la simulación al finalizar
                oProgressIndicator.setPercentValue(100);
                oProgressIndicator.setDisplayValue("100%");

                const arrayBuffer = e.target.result;
                if (sFileType === "csv") {
                    this._processCSV(e.target.result);
                } else if (sFileType === "xlsx") {
                    this._processExcel(arrayBuffer);
                }

                setTimeout(() => {
                    oLoadingDialog.close(); // Retrasa el cierre para que el usuario vea el 100%
                }, 1500); // Tiempo adicional para que el progreso final sea visible
            };

            if (sFileType === "xlsx") {
                reader.readAsArrayBuffer(oFile);
            } else {
                reader.readAsText(oFile);
            }
        },

        _processCSV: function (sContent) {
            const aRows = sContent.split("\n").map(row => row.split(","));
            this._headers = aRows[0]; // Almacenar cabeceras
            this._createTableContent(aRows);
        },

        _processExcel: function (arrayBuffer) {
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const aJsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!aJsonData || aJsonData.length === 0) {
                MessageToast.show("El archivo no contiene datos válidos.");
                return;
            }

            this._headers = aJsonData[0]; // Almacenar cabeceras
            this._fileContent = aJsonData;
            this._createTableContent(aJsonData);
        },

        _createTableContent: function (aData) {
            const oScrollContainer = this.byId("scrollContainer");
            oScrollContainer.setHeight("400px")
            const oTable = this.byId("contentTable");
            oTable.removeAllColumns();
            oTable.removeAllItems();

            if (aData.length === 0) {
                oTable.setVisible(false);
                return;
            }

            const aHeaders = aData[0];
            aHeaders.forEach(header => {
                oTable.addColumn(new Column({
                    header: new Text({ text: header.trim() })
                }));
            });

            aData.slice(1, 10).forEach(row => {
                const aCells = row.map(cell => new Text({ text: cell }));
                oTable.addItem(new ColumnListItem({ cells: aCells }));
            });

            oTable.setVisible(true);
            const actionButton = this.byId("actionButton");
            actionButton.setVisible(true);
            actionButton.setText("Siguiente");
        },

        onActionButtonPress: function () {
            if (this._currentStep === 1) {
                this._showHeaderMapping();
                this._currentStep = 2;
            } else if (this._currentStep === 2) {
                this._showDescriptionInput();
                this._currentStep = 3;
            } else if (this._currentStep === 3) {
                this._saveData();
            }
        },

        _showHeaderMapping: function () {
            const oMappingContainer = this.byId("headerMapping");
            oMappingContainer.removeAllItems();
            apiService.getMasterFields()
                .then(fields => {
                    this._headers.forEach(header => {
                        const oLabel = new Label({ text: header });
                        const oSelect = new Select();
                        oSelect.addItem(new Item({ key: "", text: "---Seleccione Campo---" }));
                        fields.data.forEach(field => {
                            oSelect.addItem(new Item({ key: field.name, text: field.name }));
                        });

                        oMappingContainer.addItem(oLabel);
                        oMappingContainer.addItem(oSelect);
                    });

                    oMappingContainer.setVisible(true);
                })
                .catch(error => {
                    MessageToast.show("Error al cargar los campos maestros.");
                });
        },

        _showDescriptionInput: function () {
            this.byId("descriptionInput").setVisible(true);
        },

        _saveData: function () {
            const oMappingContainer = this.byId("headerMapping");
            const oDescriptionInput = this.byId("descriptionInput");
            const mappings = [];
            oMappingContainer.getItems().forEach((item, index) => {
                if (item.isA("sap.m.Label")) {
                    const labelText = item.getText();
            
                    const nextItem = oMappingContainer.getItems()[index + 1];
                    if (nextItem && nextItem.isA("sap.m.Select")) {
                        const selectedKey = nextItem.getSelectedKey();
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
                    if (mappings.some(mapping => mapping.label === header)) {
                        obj[header] = cell;
                    }
                });
                return obj;
            });
            apiService.saveHeader({ id: Date.now(), description })
                .then(header => {
                    return apiService.saveDetails({
                        id: Date.now(),
                        goalHeader: {id : header.data.id},
                        content: JSON.stringify(content)
                    });
                })
                .then(() => {
                    MessageToast.show("Datos guardados exitosamente.");
                    sap.ui.getCore().getEventBus().publish("GoalChannel", "DataUpdated");
                    this._reset();
                })
                .catch(error => {
                    MessageToast.show("Error al guardar los datos.");
                });
            this.onCloseImportDialog();
        },

        _reset: function () {
            this.byId("fileUploader").setValue("");
            this.byId("contentTable").setVisible(false);
            this.byId("headerMapping").setVisible(false);
            this.byId("descriptionInput").setVisible(false);
            this._currentStep = 1;
            const oScrollContainer = this.byId("scrollContainer");
            oScrollContainer.setHeight("0px")
        },

        onCloseImportDialog: function () {
            this.byId("importDataDialog").close();
        }
    });
});
