/**
 * ============================================================
 *
 * SkinMap Regenerativo™
 *
 * Consultation Controller
 *
 * Responsável por:
 *
 * - carregar SkinAssessment existente
 * - apresentar resumo do SkinMap
 * - apresentar características observadas
 * - capturar dados da consultoria
 * - preparar dados para Google Sheets
 * - controlar envio seguro
 *
 * Abas:
 *
 * 1 - Avaliações_SkinMap
 * 2 - Leads
 * 3 - Reuniões
 *
 * ============================================================
 */


"use strict";






const SkinMapConsultation = {







    // ========================================================
    // Configuração
    // ========================================================


    GOOGLE_SCRIPT_URL:


        "https://script.google.com/macros/s/AKfycbxIhElvXjbBhHLTSq78pXFRKTuVE2Yo7KG3rQhiVd1w-Kdes_IAn_GdNVaBgCYNR9VBaA/exec",










    // ========================================================
    // Estado interno
    //
    // Proteção contra:
    //
    // - duplo clique
    // - múltiplos envios simultâneos
    // - duplicação de leads
    //
    // ========================================================


    isSubmitting:false,









    // ========================================================
    // Assessment carregado
    // ========================================================


    assessment:null,









    // ========================================================
    // Inicialização
    // ========================================================


    init(){



        this.loadAssessment();



        this.renderAssessment();



        this.bindIndication();



        this.bindForm();




    },









    // ========================================================
    // Recupera Assessment
    // ========================================================


    loadAssessment(){



        try{



            const data =


                SkinMapStorage.getAssessment();







            if(!data){



                console.warn(


                    "Nenhum assessment encontrado."


                );



                return;



            }









            this.assessment =


                data.data || data;









            console.log(


                "Assessment carregado:",


                this.assessment



            );



        }







        catch(error){



            console.error(


                "Erro ao carregar assessment:",


                error



            );



        }



    },









    // ========================================================
    // Renderização inicial
    //
    // Atualização:
    //
    // - características observadas agora
    //   são apresentadas ao usuário
    //
    // ========================================================


    renderAssessment(){



        if(!this.assessment){



            return;



        }







        const assessment =


            this.assessment;









        this.setText(


            "skinType",


            this.translate(


                assessment.skin_type


            )



        );









        this.setText(


            "hydration",


            this.translate(


                assessment.hydration_level


            )



        );









        this.setText(


            "sensitivity",


            this.translate(


                assessment.sensitivity_level


            )



        );









        this.renderAttentionPoints(


            assessment.attention_points



        );









        this.renderCharacteristics(


            assessment.reported_characteristics



        );









        this.setText(


            "summary",


            assessment.summary


            ||


            "Seu SkinMap inicial foi identificado."



        );



    },









    // ========================================================
    // Atualiza texto simples
    // ========================================================


    setText(


        id,


        value



    ){



        const element =


            document.getElementById(id);







        if(element){



            element.textContent =


                value || "-";



        }




    },
    // ========================================================
    // Pontos de atenção
    //
    // Apresentação premium das dimensões SkinMap
    //
    // Transforma textos técnicos do backend em:
    //
    // - categoria
    // - ícone
    // - explicação amigável
    //
    // Não altera dados recebidos.
    // Apenas melhora apresentação.
    //
    // ========================================================


    renderAttentionPoints(points){



        const element =


            document.getElementById(

                "attention"

            );







        if(!element){


            return;


        }









        if(


            !points ||


            points.length === 0


        ){



            element.innerHTML = `


                <div class="attention-item">


                    <div class="attention-content">


                        <h4>

                            Análise inicial concluída

                        </h4>



                        <p>

                            Nenhuma dimensão específica
                            necessita destaque neste momento.

                        </p>


                    </div>


                </div>


            `;



            return;



        }









        element.innerHTML =



            points.map(point => {



                const data =


                    this.identifyAttentionDimension(

                        point

                    );







                return `



                    <article class="attention-item">



                        <div class="attention-icon">


                            ${data.icon}


                        </div>







                        <div class="attention-content">



                            <h4>


                                ${data.title}


                            </h4>







                            <p>


                                ${data.description}


                            </p>



                        </div>



                    </article>



                `;



            })



            .join("");



    },













    // ========================================================
    // Identificação da dimensão
    //
    // Baseada no texto recebido
    // pelo backend.
    //
    // ========================================================


    identifyAttentionDimension(text){



        const value =


            String(text)


                .toLowerCase();









        if(


            value.includes(

                "hidratação"

            )


        ){



            return {


                icon:


                    "💧",



                title:


                    "Hidratação",



                description:


                    "Sua pele apresentou uma necessidade relacionada ao equilíbrio hídrico e este aspecto será considerado na construção da estratégia personalizada."

            };



        }









        if(


            value.includes(

                "sensibilidade"

            )


        ){



            return {


                icon:


                    "◇",



                title:


                    "Sensibilidade",



                description:


                    "A tolerância da pele será considerada para orientar uma estratégia personalizada e adequada ao seu perfil."

            };



        }









        if(


            value.includes(

                "barreira"

            )


        ){



            return {


                icon:


                    "🛡️",



                title:


                    "Barreira cutânea",



                description:


                    "A proteção natural da pele será considerada como uma dimensão importante da sua estratégia regenerativa."

            };



        }









        if(


            value.includes(

                "textura"

            )


        ){



            return {


                icon:


                    "✦",



                title:


                    "Textura da pele",



                description:


                    "As características relacionadas à textura serão avaliadas para definição da estratégia personalizada."

            };



        }









        if(


            value.includes(

                "oleosidade"

            )


        ){



            return {


                icon:


                    "⚖️",



                title:


                    "Equilíbrio da oleosidade",



                description:


                    "A produção de oleosidade será considerada dentro do contexto geral da sua pele."

            };



        }









        return {


            icon:


                "◈",



            title:


                "Dimensão SkinMap",



            description:


                text



        };



    },
    // ========================================================
    // Tradução de valores internos
    //
    // Backend trabalha com códigos.
    //
    // Frontend apresenta linguagem amigável.
    //
    // ========================================================


    translate(value){





        const map = {





            // -------------------------------
            // Tipos de pele
            // -------------------------------


            normal:

                "Normal",



            dry:

                "Seca",



            oily:

                "Oleosa",



            combination:

                "Mista",







            // -------------------------------
            // Hidratação
            // -------------------------------


            adequate:

                "Adequada",



            low:

                "Baixa",



            very_low:

                "Muito baixa",







            // -------------------------------
            // Sensibilidade
            // -------------------------------


            low_sensitivity:

                "Baixa",



            moderate:

                "Moderada",



            high:

                "Alta",







            // -------------------------------
            // Barreira
            // -------------------------------


            balanced:

                "Equilibrada",



            attention:

                "Necessita atenção",



            support_needed:

                "Necessita suporte"





        };









        return (



            map[value]

            ||

            value

            ||

            "Não informado"



        );



    },













    // ========================================================
    // Tradução de características observadas
    //
    // Backend trabalha com códigos internos.
    //
    // Frontend apresenta linguagem premium.
    //
    // Exemplo:
    //
    // texture
    //
    // transforma em:
    //
    // Textura da pele
    //
    // ========================================================


    translateCharacteristic(value){





        const map = {





            oiliness:


                "Oleosidade",





            sensitivity:


                "Sensibilidade",





            texture:


                "Textura da pele",





            dullness:


                "Luminosidade reduzida",





            dryness:


                "Ressecamento",





            acne:


                "Tendência à acne",





            redness:


                "Sensibilidade visual",





            enlarged_pores:


                "Poros aparentes",





            pigmentation:


                "Alterações de tonalidade"





        };









        return (



            map[value]

            ||

            value

            ||

            "Não informado"



        );



    },













    // ========================================================
    // Renderização das características observadas
    //
    // Recebe códigos internos do backend:
    //
    // [
    //   "oiliness",
    //   "sensitivity",
    //   "texture",
    //   "dullness"
    // ]
    //
    // Exibe linguagem amigável:
    //
    // [
    //   "Oleosidade",
    //   "Sensibilidade",
    //   "Textura da pele",
    //   "Luminosidade reduzida"
    // ]
    //
    // ========================================================


    renderCharacteristics(characteristics){





        const element =


            document.getElementById(

                "characteristics"

            );









        if(!element){


            return;


        }









        if(


            !characteristics ||


            characteristics.length === 0


        ){



            element.innerHTML = "";



            return;



        }









        element.innerHTML =



            characteristics.map(item => {



                return `



                    <span class="characteristic-tag">


                        ${

                            this.translateCharacteristic(item)

                        }


                    </span>



                `;



            })



            .join("");



    },
    // ========================================================
    // Indicação
    //
    // Controla a exibição do campo "Outro"
    //
    // - exibe o campo de texto quando
    //   "Outro" é selecionado
    //
    // - oculta e limpa o campo quando
    //   qualquer outra opção é selecionada
    //
    // ========================================================


    bindIndication(){




        const select =


            document.getElementById(
                "indication"
            );




        const container =


            document.getElementById(
                "otherIndicationContainer"
            );




        const otherInput =


            document.getElementById(
                "otherIndication"
            );








        if(!select || !container){


            return;


        }








        select.addEventListener(


            "change",


            ()=>{




                if(select.value === "Outro"){




                    container.style.display =


                        "block";




                }


                else{




                    container.style.display =


                        "none";




                    if(otherInput){


                        otherInput.value =


                            "";


                    }




                }




            }


        );


    },
    // ========================================================
    // Formulário
    // ========================================================


    bindForm(){





        const form =


            document.getElementById(

                "consultationForm"

            );









        if(!form){


            return;


        }









        form.addEventListener(


            "submit",


            async(event)=>{





                event.preventDefault();







                await this.submitForm();





            }



        );



    },













    // ========================================================
    // Envio seguro
    //
    // Proteções:
    //
    // 1 - impede segundo clique
    // 2 - trava botão
    // 3 - altera mensagem
    // 4 - aguarda retorno
    //
    // ========================================================


    async submitForm(){





        if(this.isSubmitting){



            console.warn(


                "Envio já está em andamento."


            );



            return;



        }







        this.isSubmitting = true;









        const button =


            document.getElementById(

                "submitButton"

            );









        const message =


            document.getElementById(

                "formMessage"

            );









        if(button){



            button.disabled = true;



            button.textContent =


                "Enviando seus dados...";



        }









        if(message){



            message.textContent =


                "Estamos preparando sua solicitação personalizada...";



        }









        const payload =


            this.buildPayload();









        console.log(


            "Dados enviados:",


            payload



        );









        try{



            const response =


                await fetch(


                    this.GOOGLE_SCRIPT_URL,


                    {



                        method:"POST",



                        headers:{


                            "Content-Type":


                                "text/plain"


                        },



                        body:


                            JSON.stringify(

                                payload

                            )



                    }



                );









            if(!response.ok){


                throw new Error(


                    "Falha no envio para Google Sheets"


                );


            }









            if(message){



                message.textContent =


                    "Solicitação enviada com sucesso! Sua estratégia personalizada será preparada.";



            }









            if(button){



                button.textContent =


                    "Solicitação recebida ✓";



            }









            document


                .getElementById(

                    "consultationForm"

                )


                .reset();





        }







        catch(error){





            console.error(error);









            if(message){



                message.textContent =


                    "Não foi possível enviar neste momento. Tente novamente.";



            }









            if(button){



                button.disabled = false;



                button.textContent =


                    "Receber minha estratégia";



            }









            this.isSubmitting = false;



        }



    },













    // ========================================================
    // Montagem dos dados
    //
    // Estrutura enviada para Google Sheets:
    //
    // {
    //
    //   avaliacaoSkinMap:{},
    //
    //   lead:{},
    //
    //   reuniao:{}
    //
    // }
    //
    // ========================================================


    buildPayload(){





        const assessment =


            this.assessment || {};









        const now =


            new Date();









        const date =


            now.toLocaleDateString(

                "pt-BR"

            );









        const dateTime =


            now.toLocaleString(

                "pt-BR"

            );









        const indication =


            this.getIndication();









        return {









            avaliacaoSkinMap:{



                nome:


                    this.value(

                        "name"

                    ),







                tipoPele:


                    this.translate(

                        assessment.skin_type

                    ),







                condicao:


                    assessment.attention_points


                        ?.join(" | ")


                    ||


                    "",







                caracteristicas:


                    assessment.reported_characteristics


                        ?.map(item =>


                            this.translateCharacteristic(item)


                        )


                        .join(" | ")


                    ||


                    "",







                recomendacao:


                    assessment.summary


                    ||


                    ""



            },









            lead:{



                data:


                    date,







                nome:


                    this.value(

                        "name"

                    ),







                whatsapp:


                    this.value(

                        "whatsapp"

                    ),







                email:


                    this.value(

                        "email"

                    ),







                cidade:


                    this.value(

                        "city"

                    ),







                tipoPele:


                    this.translate(

                        assessment.skin_type

                    ),







                condicao:


                    assessment.attention_points


                        ?.join(" | ")


                    ||


                    "",







                barreira:


                    this.translate(

                        assessment.barrier_status

                    ),







                interesse:


                    this.value(

                        "interest"

                    ),







                origem:


                    indication



            },









            reuniao:{



                dataCadastro:


                    dateTime,







                nome:


                    this.value(

                        "name"

                    ),







                whatsapp:


                    this.value(

                        "whatsapp"

                    ),







                email:


                    this.value(

                        "email"

                    ),







                horarioPreferido:


                    this.value(

                        "preferredTime"

                    ),







                interesse:


                    this.value(

                        "interest"

                    ),







                indicacao:


                    indication



            }



        };



    },













    // ========================================================
    // Recupera valor dos campos
    // ========================================================


    value(id){





        const element =


            document.getElementById(id);









        return element


            ?


            element.value.trim()


            :


            "";



    },













    // ========================================================
    // Tratamento da indicação
    // ========================================================


    getIndication(){





        const selected =


            this.value(

                "indication"

            );









        if(selected === "Outro"){



            return (


                "Outro: " +


                this.value(

                    "otherIndication"

                )


            );



        }









        return selected;



    }







};











// =============================================================
// Inicialização
// =============================================================


document.addEventListener(


    "DOMContentLoaded",


    ()=>{



        SkinMapConsultation.init();



    }


);











// =============================================================
// Disponibiliza globalmente
// =============================================================


window.SkinMapConsultation =


    SkinMapConsultation;