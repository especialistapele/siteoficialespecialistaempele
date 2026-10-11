/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Storage Manager
 *
 * Responsável pelo armazenamento local
 * do fluxo completo de diagnóstico.
 *
 * ============================================================
 */


"use strict";


const SkinMapStorage = {


    keys: {


        session:
            "skinmap_session_id",


        questionnaire:
            "skinmap_questionnaire",


        currentQuestion:
            "skinmap_current_question",


        profile:
            "skinmap_profile",


        assessment:
            "skinmap_assessment",


        recommendations:
            "skinmap_recommendations",


        lead:
            "skinmap_lead",


        status:
            "skinmap_status"


    },



    /**
     * ========================================================
     * Salvar dado genérico
     * ========================================================
     */


    save(key, data) {


        try {


            localStorage.setItem(

                key,

                JSON.stringify(data)

            );


            return true;



        } catch(error) {


            console.error(

                "Erro ao salvar dados:",

                error

            );


            return false;


        }


    },



    /**
     * ========================================================
     * Recuperar dado
     * ========================================================
     */


    get(key) {


        try {


            const data =
                localStorage.getItem(
                    key
                );



            if (!data) {

                return null;

            }



            return JSON.parse(
                data
            );



        } catch(error) {


            console.error(

                "Erro ao recuperar dados:",

                error

            );


            return null;


        }


    },



    /**
     * ========================================================
     * Remover dado
     * ========================================================
     */


    remove(key) {


        try {


            localStorage.removeItem(
                key
            );


            return true;



        } catch(error) {


            console.error(

                "Erro ao remover dado:",

                error

            );


            return false;


        }


    },



    /**
     * ========================================================
     * Limpar fluxo completo
     * ========================================================
     */


    clear() {


        Object.values(
            this.keys
        )
        .forEach(
            key => {

                localStorage.removeItem(
                    key
                );

            }
        );


    },



    /**
     * ========================================================
     * Session ID
     * ========================================================
     */


    saveSession(sessionId) {


        return this.save(

            this.keys.session,

            sessionId

        );


    },


    getSession() {


        return this.get(

            this.keys.session

        );


    },



    /**
     * ========================================================
     * Questionnaire
     * ========================================================
     */


    saveQuestionnaire(data) {


        return this.save(

            this.keys.questionnaire,

            data

        );


    },


    getQuestionnaire() {


        return this.get(

            this.keys.questionnaire

        );


    },



    /**
     * ========================================================
     * Pergunta atual
     * ========================================================
     */


    saveCurrentQuestion(data) {


        return this.save(

            this.keys.currentQuestion,

            data

        );


    },


    getCurrentQuestion() {


        return this.get(

            this.keys.currentQuestion

        );


    },



    /**
     * ========================================================
     * Profile
     * ========================================================
     */


    saveProfile(data) {


        return this.save(

            this.keys.profile,

            data

        );


    },


    getProfile() {


        return this.get(

            this.keys.profile

        );


    },



    /**
     * ========================================================
     * Assessment
     * ========================================================
     */


    saveAssessment(data) {


        return this.save(

            this.keys.assessment,

            data

        );


    },


    getAssessment() {


        return this.get(

            this.keys.assessment

        );


    },



    /**
     * ========================================================
     * Recommendations
     * ========================================================
     */


    saveRecommendations(data) {


        return this.save(

            this.keys.recommendations,

            data

        );


    },


    getRecommendations() {


        return this.get(

            this.keys.recommendations

        );


    },



    /**
     * ========================================================
     * Lead
     * ========================================================
     */


    saveLead(data) {


        return this.save(

            this.keys.lead,

            data

        );


    },


    getLead() {


        return this.get(

            this.keys.lead

        );


    },



    /**
     * ========================================================
     * Status do diagnóstico
     * ========================================================
     */


    saveStatus(data) {


        return this.save(

            this.keys.status,

            data

        );


    },


    getStatus() {


        return this.get(

            this.keys.status

        );


    }


};



// Disponibiliza globalmente

window.SkinMapStorage =
    SkinMapStorage;