sap.ui.define([], function () {
    "use strict";

    const apiClient = axios.create({
        baseURL: "https://sv-hol0uzz7c3.cloud.elastika.pe:8443/api",
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
        getGoals: () => apiClient.get("/goals/header/all"),
        getGoalDetails: (id) => apiClient.get(`/goals/detail/${id}`),
        getMasterFields: () => apiClient.get("/master-fields/all"),
        saveMasterFields: (masterField) => apiClient.post("/master-fields/create", masterField),
        updateMasterField: (masterField) => apiClient.patch("/master-fields/update", masterField),
        saveHeader: (header) => apiClient.post("/goals/header/create", header),
        saveDetails: (details) => apiClient.post("/goals/detail/create", details),
        updateDetails: (details) => apiClient.patch("/goals/detail/update", details),
        viewReport: (report) => apiClient.post("/goals/report/general", report),
        getUser: () => apiClient.get("/user/")
    };
});
