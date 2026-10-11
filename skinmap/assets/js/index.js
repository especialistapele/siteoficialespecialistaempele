/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Index Controller
 *
 * Responsável por:
 *
 * - controlar página inicial
 * - iniciar jornada do diagnóstico
 * - redirecionar para questionário
 *
 * ============================================================
 */


"use strict";



const SkinMapIndex = {



    /**
     * ========================================================
     * Inicialização
     * ========================================================
     */


    init() {


        this.bindStartButton();


    },





    /**
     * ========================================================
     * Evento botão iniciar
     * ========================================================
     */


    bindStartButton() {


        const button =
            document.getElementById(
                "startButton"
            );



        const buttonText =
            document.getElementById(
                "buttonText"
            );



        const loader =
            document.getElementById(
                "loader"
            );



        if(!button){

            return;

        }





        button.addEventListener(
            "click",
            () => {


                button.disabled = true;



                if(buttonText){

                    buttonText.innerText =
                        "Carregando diagnóstico...";

                }



                if(loader){

                    loader.style.display =
                        "inline-block";

                }





                setTimeout(
                    () => {


                        window.location.href =
                            "assessment.html";


                    },
                    500
                );


            }
        );


    }


};





document.addEventListener(
    "DOMContentLoaded",
    () => {


        SkinMapIndex.init();


    }
);





window.SkinMapIndex =
    SkinMapIndex;