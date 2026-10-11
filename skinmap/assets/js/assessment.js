/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Assessment Controller
 *
 * Responsável por:
 *
 * - carregar SkinAssessment salvo
 * - preparar informações do diagnóstico
 * - atualizar componentes da interface
 *
 * ============================================================
 */


"use strict";


const SkinMapAssessment = {



    assessment: null,



    /**
     * ========================================================
     * Inicialização
     * ========================================================
     */


    init() {


        this.loadAssessment();


        this.bindEvents();


    },





    /**
     * ========================================================
     * Carregar Assessment
     * ========================================================
     */


    loadAssessment() {


        this.assessment =

            SkinMapStorage.getAssessment();



        if(!this.assessment){


            console.warn(

                "Nenhum assessment encontrado."

            );


            return;


        }



        this.render();


    },





    /**
     * ========================================================
     * Eventos
     * ========================================================
     */


    bindEvents(){


        const restartButton =

            document.querySelector(

                "[data-action='restart']"

            );



        if(restartButton){


            restartButton.addEventListener(

                "click",

                () => {


                    SkinMapStorage.clear();



                    window.location.href =

                        "skinmapinicio.html";


                }

            );


        }


    },





    /**
     * ========================================================
     * Renderização
     * ========================================================
     */


    render(){


        if(!this.assessment){

            return;

        }



        this.renderField(

            "skin-type",

            this.assessment.skin_type

        );



        this.renderField(

            "sensitivity",

            this.assessment.sensitivity_level

        );



        this.renderField(

            "hydration",

            this.assessment.hydration_level

        );



        this.renderField(

            "barrier",

            this.assessment.barrier_level

        );



        this.renderField(

            "texture",

            this.assessment.texture_level

        );



        this.renderList(

            "characteristics",

            this.assessment.characteristics

        );



        this.renderList(

            "goals",

            this.assessment.goals

        );



        this.renderList(

            "regenerative-context",

            this.assessment.regenerative_context

        );


    },





    /**
     * ========================================================
     * Renderizar campo simples
     * ========================================================
     */


    renderField(

        selector,

        value

    ){



        const element =

            document.querySelector(

                `[data-assessment="${selector}"]`

            );



        if(!element){

            return;

        }



        element.textContent =

            this.formatValue(value);


    },





    /**
     * ========================================================
     * Renderizar listas
     * ========================================================
     */


    renderList(

        selector,

        values

    ){



        const element =

            document.querySelector(

                `[data-assessment="${selector}"]`

            );



        if(

            !element ||

            !Array.isArray(values)

        ){

            return;

        }



        element.innerHTML = "";



        values.forEach(

            item => {


                const li =

                    document.createElement(

                        "li"

                    );



                li.textContent =

                    item;



                element.appendChild(li);



            }

        );


    },





    /**
     * ========================================================
     * Formatação
     * ========================================================
     */


    formatValue(value){


        if(!value){

            return "-";

        }



        return value

            .toString()

            .replaceAll(

                "_",

                " "

            )

            .replace(

                /\b\w/g,

                letter =>

                    letter.toUpperCase()

            );


    },





    /**
     * ========================================================
     * Obter Assessment
     * ========================================================
     */


    get(){


        return this.assessment;


    }



};





document.addEventListener(

    "DOMContentLoaded",

    () => {


        SkinMapAssessment.init();


    }

);





window.SkinMapAssessment =

    SkinMapAssessment;