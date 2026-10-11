/** SkinMap Regenerativo™ — envio de leads com consentimento e acesso administrativo via Supabase. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";
const skinMapSupabase = createClient(
  "https://clwaotfbqwvxpykruwed.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd2FvdGZicXd2eHB5a3J1d2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDc0OTMsImV4cCI6MjEwNDM4MzQ5M30.Cw9zJU8UIkxhzjI-adNHoRTyNuGingHpTHZ6pjJBgBc"
);
"use strict";






const SkinMapConsultation = {







    // ========================================================
    // Configuração
    // ========================================================


    










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



                



                return;



            }









            this.assessment =


                data.data || data;









            



        }







        catch(error){



            



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
        if (this.isSubmitting) return;
        const form = document.getElementById("consultationForm");
        const button = document.getElementById("submitButton");
        const message = document.getElementById("formMessage");
        const consent = document.getElementById("skinmapConsent");
        if (!form?.reportValidity()) return;
        if (!consent?.checked) {
            if (message) message.textContent = "Para enviar, marque a autorização de uso dos dados.";
            consent?.focus();
            return;
        }
        this.isSubmitting = true;
        if (button) { button.disabled = true; button.textContent = "Enviando com segurança..."; }
        if (message) message.textContent = "Registrando sua solicitação...";
        try {
            const assessment = this.assessment || {};
            const profile = window.SkinMapStorage?.getProfile() || {};
            const questionnaire = window.SkinMapStorage?.getQuestionnaire() || {};
            const consultationPreferences = {
                preferred_time: this.value("preferredTime"),
                interest: this.value("interest"),
                indication: this.getIndication(),
                other_indication: this.value("otherIndication")
            };
            const { error } = await skinMapSupabase.from("skinmap_leads").insert({
                full_name: this.value("name"),
                whatsapp: this.value("whatsapp"),
                email: this.value("email").toLowerCase(),
                city: this.value("city"),
                interest: this.value("interest"),
                indication: this.getIndication(),
                other_indication: this.value("otherIndication"),
                skin_type: this.translate(assessment.skin_type),
                assessment,
                skin_profile: profile,
                questionnaire: {
                    ...(Array.isArray(questionnaire) ? { answers: questionnaire } : questionnaire),
                    consultation_preferences: consultationPreferences
                },
                consent: true,
                consent_text_version: "skinmap-consent-v2",
                source_environment: window.location.hostname.endsWith(".vercel.app") ? "preview" : "production"
            });
            if (error) throw error;
            if (message) message.textContent = "Solicitação recebida com sucesso. Em breve entraremos em contato.";
            if (button) button.textContent = "Solicitação recebida ✓";
            form.reset();
            window.SkinMapStorage?.clear();
        } catch (_) {
            if (message) message.textContent = "Não foi possível enviar agora. Confira sua conexão e tente novamente.";
            if (button) { button.disabled = false; button.textContent = "Receber minha estratégia"; }
        } finally {
            this.isSubmitting = false;
        }
    },

    // ========================================================
    // Montagem dos dados
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