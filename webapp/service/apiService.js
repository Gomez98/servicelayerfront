sap.ui.define([], function () {
    "use strict";

    const apiClient = axios.create({
        baseURL: "https://sv-hol0uzz7c3.cloud.elastika.pe/api",
        headers: {
            "Content-Type": "application/json"
        }
    });

    apiClient.interceptors.request.use(
        (config) => {
            const token = sessionStorage.getItem("jwt");
            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    apiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                sessionStorage.removeItem("jwt");
                sap.m.MessageToast.show("Sesión expirada. Por favor, inicie sesión nuevamente.");
                const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Login");
            }
            return Promise.reject(error);
        }
    );

    return {
        login: (credentials) => apiClient.post("/auth/login", credentials),
        getGoals: () => apiClient.get("/api/goals/header/"),
        getGoalDetails: (id) => apiClient.get(`/api/goals/detail/${id}`),
        getMasterFields: () => apiClient.get("/api/master-fields/"),
        saveMasterFields: (masterField) => apiClient.post("/api/master-fields/", masterField),
        updateMasterField: (masterField) => apiClient.put(`/api/master-fields/${masterField.id}`, masterField),
        saveHeader: (header) => apiClient.post("/api/goals/header/", header),
        saveDetails: (details) => apiClient.post("/api/goals/detail/", details),
        viewReport: (report) => apiClient.post("/api/goals/report/general", report)

    };
});
