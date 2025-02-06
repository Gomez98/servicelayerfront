sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "myApp/service/apiService"
], function (Controller, MessageToast, BusyDialog, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.Convert", {

        onFileChange: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oFileUploader.oFileUpload.files[0];
            
            if (!oFile) {
                MessageToast.show("Por favor selecciona un archivo");
                return;
            }
            var busyDialog = new BusyDialog();
            busyDialog.open();
            var formData = new FormData();
            formData.append("file", oFile);

            apiService.makeConvert(formData)
            .then(response => {
                var blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                var a = document.createElement("a");
                var url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = "EstadoCuenta.xlsx";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                MessageToast.show("Archivo descargado correctamente");
            })
            .catch(error => {
                console.error("Error:", error);
                MessageToast.show("Error al convertir el archivo");
            })
            .finally(() => {
                busyDialog.close();
                oFileUploader.setValue("");
            });
        }
    });
});
