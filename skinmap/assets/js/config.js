/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Configuration
 *
 * ============================================================
 */


"use strict";


const CONFIG = {


    environment:

        "development",



    /**
     * apiBaseURL can be overridden per environment without editing
     * this file: define `window.__SKINMAP_API_BASE_URL__` in a
     * small inline <script> tag (or a separate env-specific file)
     * loaded before this one, e.g. in production's skinmapinicio.html:
     *   <script>window.__SKINMAP_API_BASE_URL__ = "https://api.example.com";</script>
     * When not defined, falls back to the current local default,
     * so existing behavior is unchanged.
     */
    apiBaseURL:

        window.__SKINMAP_API_BASE_URL__ || "http://127.0.0.1:8000",



    endpoints: {


        health:

            "/api/v1/health",





        /**
         * ====================================================
         * Questionário
         *
         * Carregar perguntas
         * ====================================================
         */


        questionnaire:

            "/api/v1/questionnaire/",





        /**
         * ====================================================
         * Validar respostas do questionário
         * ====================================================
         */


        questionnaireValidate:

            "/api/v1/questionnaire/validate",





        assessment:

            "/api/v1/assessment",





        consultation:

            "/api/v1/consultation",





        consultationReport:

            "/api/v1/consultation/report",





        report:

            "/api/v1/report"


    }


};





function apiUrl(endpoint) {


    return (

        CONFIG.apiBaseURL

        +

        endpoint

    );


}





window.CONFIG = CONFIG;

window.apiUrl = apiUrl;