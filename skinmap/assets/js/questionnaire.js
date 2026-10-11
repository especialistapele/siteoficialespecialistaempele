/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Questionnaire Controller
 *
 * Responsável por:
 *
 * - carregar perguntas
 * - renderizar perguntas
 * - controlar respostas
 * - montar SkinProfile
 * - gerar Assessment
 *
 * ============================================================
 */


"use strict";



const SkinMapQuestionnaire = {



    currentStep: 0,


    questions: [],


    answers: [],


    isSubmitting: false,





    /**
     * ========================================================
     * Inicialização
     * ========================================================
     */


    async init(){


        this.bindEvents();


        await this.loadQuestionnaire();


    },






    /**
     * ========================================================
     * Eventos
     * ========================================================
     */


    bindEvents(){



        const nextButton =

            document.querySelector(

                "[data-action='next-question']"

            );




        const previousButton =

            document.querySelector(

                "[data-action='previous-question']"

            );




        const finishButton =

            document.querySelector(

                "[data-action='finish-questionnaire']"

            );






        if(nextButton){


            nextButton.onclick =

                () => this.next();


        }






        if(previousButton){


            previousButton.onclick =

                () => this.previous();


        }






        if(finishButton){


            finishButton.onclick =

                () => this.finish();


        }



    },









    /**
     * ========================================================
     * Carregar Questionário
     * ========================================================
     */


    async loadQuestionnaire(){



        try{



            const response =

                await SkinMapAPI.getQuestionnaire();





            console.log(

                "Questionário carregado:",

                response

            );







            if(

                response &&

                response.data &&

                Array.isArray(

                    response.data.questions

                )

            ){



                this.questions =

                    response.data.questions;



            }

            else{


                throw new Error(

                    "Formato de questionário inválido."

                );


            }







            this.renderQuestion();





        }


        catch(error){



            console.error(

                "Erro carregando questionário:",

                error

            );





            alert(

                "Não foi possível carregar as perguntas."

            );



        }



    },









    /**
     * ========================================================
     * Renderizar pergunta atual
     * ========================================================
     */


    renderQuestion(){



        const question =

            this.questions[

                this.currentStep

            ];





        if(!question){


            return;


        }







        const title =

            document.querySelector(

                "[data-question-title]"

            );





        const container =

            document.querySelector(

                "[data-question-options]"

            );








        if(title){


            title.innerText =

                question.text;


        }






        if(container){


            container.innerHTML = "";


        }







        /*
        ======================================================
        PERGUNTA TEXTO
        ======================================================
        */



        if(

            question.question_type ===

            "text"

        ){



            container.innerHTML = `


                <textarea

                    class="question-text"

                    data-text-answer="${question.key}"

                    placeholder="Digite sua observação..."

                ></textarea>


            `;



        }







        /*
        ======================================================
        SINGLE CHOICE
        ======================================================
        */


        else if(

            question.question_type ===

            "single_choice"

        ){



            question.options.forEach(


                option => {



                    container.innerHTML += `


                    <label class="question-option">


                        <input

                            type="radio"

                            name="${question.key}"

                            value="${option.value}"

                        >


                        <span>

                            ${option.label}

                        </span>


                    </label>


                    `;



                }


            );



        }


        /*
        ======================================================
        MULTIPLE CHOICE
        ======================================================
        */


        else if(

            question.question_type ===

            "multiple_choice"

        ){



            question.options.forEach(


                option => {



                    container.innerHTML += `



                    <label class="question-option">



                        <input

                            type="checkbox"

                            name="${question.key}"

                            value="${option.value}"

                        >



                        <span>

                            ${option.label}

                        </span>



                    </label>



                    `;



                }


            );





            this.applyMultipleRules(

                question.key

            );



        }







        this.restoreAnswer(

            question

        );





        this.updateProgress();



    },









    /**
     * ========================================================
     * Restaurar resposta ao voltar pergunta
     * ========================================================
     */


    restoreAnswer(question){



        const previousAnswer =

            this.answers[

                this.currentStep

            ];





        if(!previousAnswer){


            return;


        }







        if(

            question.question_type ===

            "text"

        ){



            const field =

                document.querySelector(

                    `[data-text-answer="${question.key}"]`

                );





            if(field){


                field.value =

                    previousAnswer.text_response || "";


            }



        }







        if(

            question.question_type ===

            "single_choice"

        ){



            const value =

                previousAnswer.selected_values?.[0];





            const input =

                document.querySelector(

                    `input[name="${question.key}"][value="${value}"]`

                );





            if(input){


                input.checked = true;


            }



        }







        if(

            question.question_type ===

            "multiple_choice"

        ){



            const values =

                previousAnswer.selected_values || [];





            values.forEach(


                value => {



                    const input =

                        document.querySelector(

                            `input[name="${question.key}"][value="${value}"]`

                        );





                    if(input){


                        input.checked = true;


                    }



                }


            );



        }



    },









    /**
     * ========================================================
     * Regras para múltipla escolha
     * ========================================================
     */


    applyMultipleRules(key){



        const inputs =

            document.querySelectorAll(

                `input[name="${key}"]`

            );







        inputs.forEach(


            input => {



                input.addEventListener(

                    "change",

                    ()=>{





                        if(

                            input.value === "none"

                            &&

                            input.checked

                        ){



                            inputs.forEach(

                                item => {



                                    if(

                                        item !== input

                                    ){


                                        item.checked = false;


                                    }


                                }


                            );


                        }







                        if(

                            input.value !== "none"

                            &&

                            input.checked

                        ){



                            const noneOption =

                                document.querySelector(

                                    `input[name="${key}"][value="none"]`

                                );





                            if(noneOption){


                                noneOption.checked = false;


                            }



                        }





                    }


                );



            }


        );



    },









    /**
     * ========================================================
     * Coletar resposta atual
     * ========================================================
     */


    collectAnswer(){



        const question =

            this.questions[

                this.currentStep

            ];





        if(!question){


            return null;


        }







        /*
        ======================================================
        TEXTO LIVRE
        ======================================================
        */



        if(

            question.question_type ===

            "text"

        ){



            const field =

                document.querySelector(

                    `[data-text-answer="${question.key}"]`

                );





            return {


                question_id:

                    question.question_id,



                selected_values:

                    [],



                text_response:

                    field

                    ?

                    field.value.trim()

                    :

                    ""



            };



        }









        /*
        ======================================================
        SINGLE CHOICE
        ======================================================
        */



        if(

            question.question_type ===

            "single_choice"

        ){



            const selected =

                document.querySelector(

                    `input[name="${question.key}"]:checked`

                );







            if(!selected){



                alert(

                    "Selecione uma opção para continuar."

                );



                return null;



            }






            return {


                question_id:

                    question.question_id,



                selected_values:


                    [

                        selected.value

                    ]



            };



        }









        /*
        ======================================================
        MULTIPLE CHOICE
        ======================================================
        */



        if(

            question.question_type ===

            "multiple_choice"

        ){



            const selected =

                document.querySelectorAll(

                    `input[name="${question.key}"]:checked`

                );







            if(selected.length === 0){



                alert(

                    "Selecione pelo menos uma opção."

                );



                return null;



            }







            return {


                question_id:

                    question.question_id,



                selected_values:



                    Array.from(selected)

                    .map(

                        item =>

                            item.value

                    )



            };



        }






        return null;



    },









    /**
     * ========================================================
     * Próxima pergunta
     * ========================================================
     */


    next(){



        const answer =

            this.collectAnswer();







        if(!answer){


            return;


        }







        this.answers[

            this.currentStep

        ] = answer;







        this.currentStep++;







        if(

            this.currentStep >=

            this.questions.length

        ){



            this.showFinish();


            return;



        }







        this.renderQuestion();



    },









    /**
     * ========================================================
     * Pergunta anterior
     * ========================================================
     */


    previous(){



        if(

            this.currentStep <= 0

        ){


            return;


        }







        this.currentStep--;







        this.renderQuestion();



    },









    /**
     * ========================================================
     * Mostrar botão finalizar
     * ========================================================
     */


    showFinish(){



        const nextButton =

            document.querySelector(

                "[data-action='next-question']"

            );





        const finishButton =

            document.querySelector(

                "[data-action='finish-questionnaire']"

            );







        if(nextButton){


            nextButton.style.display =

                "none";


        }







        if(finishButton){


            finishButton.style.display =

                "block";


        }



    },


    /**
     * ========================================================
     * Atualizar progresso
     * ========================================================
     */


    updateProgress(){



        const progress =

            document.querySelector(

                "[data-progress]"

            );





        if(!progress){


            return;


        }








        const percentage =



            (


                (this.currentStep + 1)

                /

                this.questions.length


            )

            *

            100;







        progress.style.width =

            `${percentage}%`;



    },












    /**
     * ==========================================================
     * Criar SkinProfile
     *
     * Converte respostas do questionário
     * para estrutura aceita pelo backend.
     *
     * Endpoint:
     *
     * POST /api/v1/assessment
     *
     * ==========================================================
     */


    buildProfilePayload(){



        const profile = {



            characteristics: [],


            goals: [],


            routine_patterns: [],


            regenerative_context: [],


            current_products: [],


            lifestyle_factors: [],


            photoaging_context: [],


            skin_observations: []



        };







        this.answers

            .filter(Boolean)

            .forEach(


                answer => {



                    const key =

                        this.getQuestionKey(

                            answer.question_id

                        );







                    if(!key){


                        return;


                    }









                    /*
                    ==================================================
                    Campo texto livre
                    ==================================================
                    */


                    if(

                        key === "observations"

                    ){



                        if(

                            answer.text_response &&

                            answer.text_response.trim()

                        ){



                            profile.skin_observations.push(

                                answer.text_response.trim()

                            );



                        }



                        return;



                    }









                    const values =

                        answer.selected_values || [];










                    /*
                    ==================================================
                    Campos que são listas
                    ==================================================
                    */


                    const arrayFields = [


                        "characteristics",


                        "goals",


                        "routine_patterns",


                        "regenerative_context",


                        "current_products",


                        "lifestyle_factors",


                        "photoaging_context"



                    ];









                    if(

                        arrayFields.includes(key)

                    ){



                        profile[key] = values;



                        return;



                    }









                    /*
                    ==================================================
                    Campos simples
                    ==================================================
                    */


                    profile[key] =


                        values.length > 0

                        ?

                        values[0]

                        :

                        null;



                }


            );













        /*
        ======================================================
        GARANTIA DE CAMPOS DO SKINPROFILE
        ======================================================

        O backend espera o modelo:

        SkinProfile

        Mesmo quando o usuário não respondeu
        alguma dimensão, enviamos null.

        ======================================================
        */



        const optionalFields = [


            "age_range",


            "skin_type",


            "hydration_level",


            "sensitivity_level",


            "barrier_level",


            "texture_level",


            "appearance_level",


            "consultation_intention",


            "product_usage_notes",


            "additional_notes"



        ];








        optionalFields.forEach(


            field => {



                if(

                    !(field in profile)

                ){



                    profile[field] = null;



                }



            }


        );












        /*
        ======================================================
        REMOVER CAMPOS NÃO PERTENCENTES AO PROFILE
        ======================================================
        */



        delete profile.observations;


        delete profile.source;


        delete profile.status;


        delete profile.completion_percentage;


        delete profile.profile_id;


        delete profile.id;


        delete profile.created_at;


        delete profile.updated_at;









        console.log(

            "SkinProfile normalizado:",

            profile

        );






        return profile;



    },












    /**
     * ==========================================================
     * Recuperar chave da pergunta
     * pelo question_id
     * ==========================================================
     */


    getQuestionKey(questionId){



        const question =

            this.questions.find(


                item =>


                    item.question_id === questionId



            );







        return question

            ?

            question.key

            :

            null;



    },


    /**
     * ==========================================================
     * Finalizar Questionário
     *
     * Fluxo:
     *
     * 1 - Validar respostas
     * 2 - Criar SkinProfile
     * 3 - Gerar Assessment
     * 4 - Salvar dados locais
     * 5 - Abrir resultado
     *
     * ==========================================================
     */


    async finish(){



        if(this.isSubmitting){


            return;


        }







        this.isSubmitting = true;







        try{





            console.log(

                "Finalizando questionário..."

            );









            /*
            ======================================================
            1 - Validar questionário
            ======================================================
            */


            const questionnairePayload = {



                answers:

                    this.answers.filter(Boolean)



            };









            const validation =


                await SkinMapAPI.validateQuestionnaire(


                    questionnairePayload


                );









            console.log(


                "Questionário validado:",


                validation


            );









            /*
            ======================================================
            2 - Criar SkinProfile
            ======================================================
            */


            const profilePayload =


                this.buildProfilePayload();








            console.log(


                "Profile enviado:",


                profilePayload


            );







            console.log(


                "PROFILE JSON:",


                JSON.stringify(


                    profilePayload,


                    null,


                    2


                )


            );









            /*
            ======================================================
            3 - Gerar Assessment
            ======================================================
            */


            const assessment =


                await SkinMapAPI.generateAssessment(


                    profilePayload


                );








            console.log(


                "Assessment gerado:",


                assessment


            );









            /*
            ======================================================
            4 - Salvar dados locais
            ======================================================
            */


            if(window.SkinMapStorage){



                SkinMapStorage.saveQuestionnaire(


                    questionnairePayload


                );






                SkinMapStorage.saveProfile(


                    profilePayload


                );






                SkinMapStorage.saveAssessment(


                    assessment


                );



            }









            /*
            ======================================================
            5 - Ir para página de resultado
            ======================================================
            */


            window.location.href =


                "./result.html";







        }





        catch(error){





            console.error(


                "Erro ao finalizar análise:",


                error


            );









            /*
            ======================================================
            Mostrar erro detalhado da API
            ======================================================
            */


            if(error.response){



                console.error(


                    "Detalhes API:",


                    error.response


                );


            }







            if(error.message){



                console.error(


                    "Mensagem:",


                    error.message


                );


            }









            alert(


                "Não foi possível gerar sua análise. Verifique os dados enviados."


            );








            this.isSubmitting = false;



        }



    }



};













/**
 * ============================================================
 * Inicialização
 * ============================================================
 */


document.addEventListener(


    "DOMContentLoaded",


    ()=>{


        SkinMapQuestionnaire.init();



    }


);









window.SkinMapQuestionnaire =


    SkinMapQuestionnaire;