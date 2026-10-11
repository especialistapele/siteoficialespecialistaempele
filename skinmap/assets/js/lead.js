/**
 * SkinMap Regenerativo™
 * Lead Controller
 *
 * Responsável pelo cadastro do lead,
 * coleta de informações comerciais e
 * encaminhamento para consultoria regenerativa.
 */


const SkinMapLead = {


    isSubmitting: false,


    init() {

        this.bindForm();

    },


    bindForm() {


        const form =
            document.querySelector(
                "[data-lead-form]"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                this.submit(form);

            }
        );

    },


    collectData(form) {


        const formData =
            new FormData(form);


        return {


            name:
                formData.get("name"),


            email:
                formData.get("email"),


            phone:
                formData.get("phone"),


            referral_source:
                formData.get("referral_source"),


            referral_name:
                formData.get("referral_name"),


            referral_details:
                formData.get("referral_details"),


            preferred_contact_time:
                formData.get(
                    "preferred_contact_time"
                ),


            profile:
                SkinMapStorage.getProfile(),


            assessment:
                SkinMapStorage.getAssessment()

        };

    },


    async submit(form) {


        if (this.isSubmitting) {
            return;
        }


        this.isSubmitting = true;


        const button =
            form.querySelector(
                "button[type='submit']"
            );


        this.setLoading(button);


        const data =
            this.collectData(form);



        try {


            const response =
                await SkinMapAPI.sendLead(
                    data
                );



            if (!response.success) {

                throw new Error(
                    "Erro no cadastro."
                );

            }



            SkinMapStorage.saveLead(
                data
            );


            this.showSuccess(form);



        } catch(error) {


            console.error(
                "Erro ao cadastrar lead:",
                error
            );


            this.showError();


            this.resetButton(button);


            this.isSubmitting = false;

        }


    },


    setLoading(button) {


        if (!button) {
            return;
        }


        button.disabled = true;


        button.innerText =
            "Enviando cadastro...";


    },


    resetButton(button) {


        if (!button) {
            return;
        }


        button.disabled = false;


        button.innerText =
            "Solicitar consultoria";

    },


    showSuccess(form) {


        form.innerHTML = `

            <div class="lead-success">


                <h3>
                    Cadastro recebido com sucesso.
                </h3>


                <p>
                    Danny Queiroz analisará suas informações
                    iniciais e entrará em contato para
                    apresentar a proposta da Consultoria
                    Regenerativa Online.
                </p>


                <p>
                    Aguarde o contato no horário informado.
                </p>


            </div>

        `;


    },


    showError() {


        alert(
            "Não foi possível concluir seu cadastro. Tente novamente."
        );


    }


};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        SkinMapLead.init();

    }
);


window.SkinMapLead =
    SkinMapLead;