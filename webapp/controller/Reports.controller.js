sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "myApp/service/apiService" 
], function (Controller, MessageToast, JSONModel, apiService) {
    "use strict";

    return Controller.extend("myApp.controller.Reports", {
        onInit: function () {
            const oModel = new JSONModel({
                data: [],
                pageSize: 5,
                currentPage: 1,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false
            });
            this.getView().setModel(oModel, "reportModel");
        },

        onFilter: function () {
            const sUsername = this.byId("filterUsername").getValue();
            const sStatus = this.byId("filterStatus").getSelectedKey();

            apiService
                .viewReport({
                    username: sUsername,
                    status: sStatus || null
                })
                .then((response) => {
                    const oModel = this.getView().getModel("reportModel");
                    const aData = response.data;
                    oModel.setProperty("/data", aData);
                    oModel.setProperty("/totalPages", Math.ceil(aData.length / oModel.getProperty("/pageSize")));
                    this._updatePagination();
                })
                .catch((error) => {
                    MessageToast.show("Error al cargar el reporte: " + (error.message || "Desconocido"));
                });
        },

        _updatePagination: function () {
            const oModel = this.getView().getModel("reportModel");
            const iPageSize = oModel.getProperty("/pageSize");
            const iCurrentPage = oModel.getProperty("/currentPage");
            const aData = oModel.getProperty("/data");

            const iStartIndex = (iCurrentPage - 1) * iPageSize;
            const iEndIndex = iStartIndex + iPageSize;
            const aVisibleData = aData.slice(iStartIndex, iEndIndex);

            oModel.setProperty("/visibleData", aVisibleData);
            oModel.setProperty("/hasPreviousPage", iCurrentPage > 1);
            oModel.setProperty("/hasNextPage", iCurrentPage < oModel.getProperty("/totalPages"));
        },

        onPreviousPage: function () {
            const oModel = this.getView().getModel("reportModel");
            const iCurrentPage = oModel.getProperty("/currentPage");
            oModel.setProperty("/currentPage", iCurrentPage - 1);
            this._updatePagination();
        },

        onNextPage: function () {
            const oModel = this.getView().getModel("reportModel");
            const iCurrentPage = oModel.getProperty("/currentPage");
            oModel.setProperty("/currentPage", iCurrentPage + 1);
            this._updatePagination();
        }
    });
});
