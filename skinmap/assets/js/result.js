/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * Result Controller
 *
 * Responsável por:
 *
 * - carregar o SkinAssessment salvo
 * - apresentar o resultado inicial
 * - preparar a continuidade da jornada
 *
 * Todo o conteúdo exibido nesta tela é
 * proveniente do backend. O frontend apenas
 * organiza a apresentação.
 * ============================================================
 */

"use strict";

const SkinMapResult = {

    // =========================================================
    // Inicialização
    // =========================================================

    init() {

        const assessment = this.loadAssessment();

        if (!assessment) {
            this.showEmptyResult();
            return;
        }

        console.log(
            "Assessment carregado:",
            assessment
        );

        this.renderProfile(assessment);
        this.renderCharacteristics(assessment);
        this.renderAttentionPoints(assessment);
        this.renderSummary(assessment);

        this.bindCTA();
    },



    // =========================================================
    // Recupera Assessment salvo
    // =========================================================

    loadAssessment() {

        try {

            const data =
                SkinMapStorage.getAssessment();

            if (!data) {
                return null;
            }

            /*
            Compatibilidade:

            Storage pode salvar:

            assessment

            ou

            {
                success:true,
                data:{...}
            }
            */

            return data.data || data;

        }
        catch (error) {

            console.error(
                "Erro ao recuperar assessment:",
                error
            );

            return null;
        }

    },



    // =========================================================
    // Perfil identificado
    // =========================================================

    renderProfile(
        assessment
    ) {

        const element =
            document.getElementById(
                "skinProfile"
            );

        if (!element) {
            return;
        }

        const skinType =
            assessment.skin_type;

        const hydration =
            assessment.hydration_level;

        const sensitivity =
            assessment.sensitivity_level;

        element.innerHTML = `

            <p>

                <strong>
                    Tipo de pele:
                </strong>

                ${this.translateValue(
                    skinType
                )}

            </p>


            <p>

                <strong>
                    Hidratação:
                </strong>

                ${this.translateValue(
                    hydration
                )}

            </p>


            <p>

                <strong>
                    Sensibilidade:
                </strong>

                ${this.translateValue(
                    sensitivity
                )}

            </p>

        `;

    },
    // =========================================================
    // Características observadas
    // =========================================================

    renderCharacteristics(
        assessment
    ) {

        const list =
            document.getElementById(
                "characteristicsList"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        const items =
            assessment.reported_characteristics ?? [];

        if (items.length === 0) {

            list.innerHTML = `

                <li>

                    Nenhuma característica específica foi informada.

                </li>

            `;

            return;
        }

        items.forEach(item => {

            const li =
                document.createElement("li");

            li.textContent =
                this.translateValue(item);

            list.appendChild(li);

        });

    },



    // =========================================================
    // Pontos de atenção
    // =========================================================

    renderAttentionPoints(
        assessment
    ) {

        const list =
            document.getElementById(
                "attentionList"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        const points =
            assessment.attention_points ?? [];

        if (points.length === 0) {

            list.innerHTML = `

                <li>

                    Sua análise inicial não identificou
                    pontos específicos que necessitem
                    atenção neste momento.

                </li>

            `;

            return;
        }

        points.forEach(point => {

            const li =
                document.createElement("li");

            /*
            =====================================================
            IMPORTANTE

            Não utilizar formatText() aqui.

            O backend já envia frases completas,
            com acentuação correta.

            Isso elimina o problema:

            HidrataçãO
            DimensãO
            Estratégia

            =====================================================
            */

            li.textContent = point;

            list.appendChild(li);

        });

    },



    // =========================================================
    // Resumo
    // =========================================================

    renderSummary(
        assessment
    ) {

        const element =
            document.getElementById(
                "summaryText"
            );

        if (!element) {
            return;
        }

        let summary =
            assessment.summary;

        if (
            !summary ||
            summary.trim() === ""
        ) {

            summary =

                "Seu SkinMap inicial foi identificado. " +

                "O próximo passo é construir uma estratégia personalizada para sua pele.";

        }

        element.textContent =
            summary;

    },



    // =========================================================
    // CTA
    // =========================================================

    bindCTA() {

        const button =
            document.getElementById(
                "continueButton"
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    "consultation.html";

            }
        );

    },



    // =========================================================
    // Resultado vazio
    // =========================================================

    showEmptyResult() {

        const profile =
            document.getElementById(
                "skinProfile"
            );

        if (profile) {

            profile.innerHTML = `

                <p>

                    Não foi possível localizar
                    uma avaliação salva.

                </p>

            `;

        }

        const characteristics =
            document.getElementById(
                "characteristicsList"
            );

        if (characteristics) {
            characteristics.innerHTML = "";
        }

        const attention =
            document.getElementById(
                "attentionList"
            );

        if (attention) {
            attention.innerHTML = "";
        }

        const summary =
            document.getElementById(
                "summaryText"
            );

        if (summary) {

            summary.textContent =

                "Realize novamente o SkinMap Regenerativo para visualizar seu resultado.";

        }

    },
    // =========================================================
    // Tradução de valores internos
    // =========================================================

    translateValue(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "Não informado";

        }

        const translations = {

            // -----------------------------------------
            // Tipos de pele
            // -----------------------------------------

            normal: "Normal",
            dry: "Seca",
            oily: "Oleosa",
            combination: "Mista",

            // -----------------------------------------
            // Hidratação
            // -----------------------------------------

            adequate: "Adequada",
            low: "Baixa",
            very_low: "Muito baixa",

            // -----------------------------------------
            // Sensibilidade
            // -----------------------------------------

            low_sensitivity: "Baixa",
            moderate: "Moderada",
            high: "Alta",

            // -----------------------------------------
            // Barreira
            // -----------------------------------------

            balanced: "Equilibrada",
            attention: "Necessita atenção",
            support_needed: "Necessita suporte",

            // -----------------------------------------
// Características observadas
// -----------------------------------------

oiliness: "Oleosidade",

dryness: "Ressecamento",

sensitivity: "Sensibilidade",

texture: "Textura da pele",

texture_variation: "Variação de textura",

dullness: "Luminosidade reduzida",

redness: "Vermelhidão percebida",

enlarged_pores: "Poros aparentes",

pigmentation: "Alterações de tonalidade",

acne: "Tendência à acne",

            // -----------------------------------------
            // Objetivos
            // -----------------------------------------

            appearance_interest:
                "Melhora da aparência da pele",

            regenerative_interest:
                "Interesse em estratégia regenerativa",

            acne_interest:
                "Atenção relacionada à acne",

            // -----------------------------------------
            // Rotina
            // -----------------------------------------

            regular:
                "Rotina regular",

            complex:
                "Rotina completa",

            none:
                "Sem rotina fixa"

        };

        if (
            Object.prototype.hasOwnProperty.call(
                translations,
                value
            )
        ) {

            return translations[value];

        }

        return this.formatText(value);

    },



    // =========================================================
    // Formatação Genérica
    // =========================================================

    formatText(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        /*
        =========================================================

        IMPORTANTE

        O backend já envia textos completos.

        NÃO capitalizamos frases.

        Apenas removemos "_".

        Isso elimina completamente problemas como:

        HidrataçãO
        DimensãO
        Estratégia
        AnáLise

        =========================================================
        */

        return String(value)
            .replaceAll("_", " ")
            .trim();

    }

};



// =============================================================
// Inicialização
// =============================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        SkinMapResult.init();

    }

);



// =============================================================
// Disponibiliza globalmente
// =============================================================

window.SkinMapResult = SkinMapResult;