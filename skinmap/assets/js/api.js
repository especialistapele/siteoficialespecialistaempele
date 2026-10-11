/**
 * ============================================================
 * SkinMap Regenerativo™
 *
 * API Service — versão sem servidor (fase 7 da migração)
 *
 * Antes: comunicação HTTP com o backend FastAPI (fetch).
 * Agora: chama diretamente o motor JS portado em js/engine-v2/,
 * que roda inteiramente no navegador — sem servidor, sem Render.
 *
 * O contrato público de SkinMapAPI (nomes de método, formato de
 * entrada/saída) foi mantido idêntico ao original, para que
 * questionnaire.js, result.js, consultation.js e lead.js
 * continuem funcionando sem nenhuma alteração.
 * ============================================================
 */

"use strict";

import { QUESTION_DEFINITIONS } from "../../js/engine-v2/variables/questionDefinitions.js";
import { SkinProfile } from "../../js/engine-v2/schema/skinProfile.js";
import { QuestionnaireValidationRequest, UserAnswer } from "../../js/engine-v2/schema/questionnaire.js";
import { create_validation_service } from "../../js/engine-v2/services/validationService.js";
import { create_assessment_service } from "../../js/engine-v2/services/assessmentService.js";
import { create_consultation_service } from "../../js/engine-v2/services/consultationService.js";

// Instâncias únicas dos serviços, equivalente ao Depends(get_..._service)
// do FastAPI (backend/api/dependencies.py) — mas em memória do navegador.
const validationService = create_validation_service();
const assessmentService = create_assessment_service();
const consultationService = create_consultation_service();

const SkinMapAPI = {

    /**
     * ========================================================
     * Health Check
     *
     * Não existe mais servidor para checar — retorna um status
     * fixo "saudável", equivalente ao HealthResponse do backend.
     * ========================================================
     */

    async health() {
        return {
            service: "SkinMap Regenerativo",
            status: "healthy",
            version: "1.0.0",
            mode: "local-engine",
        };
    },

    /**
     * ========================================================
     * Carregar Questionário
     *
     * Antes: GET /api/v1/questionnaire/
     * Agora: monta a mesma estrutura a partir de
     * js/engine-v2/variables/questionDefinitions.js
     * ========================================================
     */

    async getQuestionnaire() {
        const questions = [];

        for (const [key, definition] of Object.entries(QUESTION_DEFINITIONS)) {
            questions.push({
                question_id: key,
                key: key,
                text: definition.question,
                question_type: definition.question_type,
                options: (definition.options || []).map((option) => ({
                    value: option.value,
                    label: option.label,
                })),
                required: definition.required || false,
            });
        }

        const response = {
            success: true,
            data: {
                title: "SkinMap Regenerativo™",
                version: "1.0",
                questions,
            },
        };

        if (response) {
            SkinMapStorage.saveQuestionnaire(response);
        }

        return response;
    },

    /**
     * ========================================================
     * Validar Questionário
     *
     * Antes: POST /api/v1/questionnaire/validate
     * Agora: ValidationService.validate_questionnaire() local
     * ========================================================
     */

    async validateQuestionnaire(questionnaireData) {
        const answers = (questionnaireData.answers || []).map(
            (a) => new UserAnswer(a),
        );
        const request = new QuestionnaireValidationRequest({ answers });

        const validation = validationService.validate_questionnaire(request);

        let response;
        if (!validation.valid) {
            response = {
                success: false,
                message: "Questionnaire validation failed.",
                errors: validation.errors,
            };
        } else {
            response = {
                success: true,
                message: "Questionnaire validated successfully.",
                data: {
                    valid: validation.valid,
                    warnings: validation.warnings,
                },
            };
        }

        if (response) {
            SkinMapStorage.saveQuestionnaire(response);
        }

        return response;
    },

    /**
     * ========================================================
     * Gerar Assessment
     *
     * Antes: POST /api/v1/assessment
     * Agora: AssessmentService.generate_assessment() local
     * ========================================================
     */

    async generateAssessment(profileData) {
        let response;

        try {
            if (!profileData) {
                throw new Error("SkinProfile cannot be empty.");
            }

            const profile = new SkinProfile(profileData);
            const assessment = assessmentService.generate_assessment(profile);

            response = {
                success: true,
                message: "Assessment generated successfully.",
                data: assessment,
            };
        } catch (error) {
            const message =
                (error.details && error.details.message) || error.message ||
                "Erro na comunicação com o servidor.";
            console.error("API Error:", error);
            throw new Error(message);
        }

        if (response) {
            SkinMapStorage.saveAssessment(response);
        }

        return response;
    },

    /**
     * ========================================================
     * Executar Consultoria
     *
     * Antes: POST /api/v1/consultation
     * Agora: ConsultationService.execute() local
     * ========================================================
     */

    async sendConsultation(consultationData) {
        let response;

        try {
            if (!consultationData) {
                throw new Error("SkinProfile cannot be empty.");
            }

            const profile = new SkinProfile(consultationData);
            const result = consultationService.execute(profile);

            response = {
                success: true,
                message: "Consultation completed successfully.",
                data: {
                    profile: result.profile,
                    assessment: result.assessment,
                    recommendation: result.recommendation,
                },
            };
        } catch (error) {
            const message =
                (error.details && error.details.message) || error.message ||
                "Erro na comunicação com o servidor.";
            console.error("API Error:", error);
            throw new Error(message);
        }

        if (response) {
            SkinMapStorage.saveLead(consultationData);
        }

        return response;
    },

    /**
     * ========================================================
     * Gerar relatório da consulta
     *
     * Antes: POST /api/v1/consultation/report
     * Agora: ConsultationService.execute() + generate_report() local
     * ========================================================
     */

    async generateConsultationReport(data) {
        try {
            if (!data) {
                throw new Error("SkinProfile cannot be empty.");
            }

            const profile = new SkinProfile(data);
            const result = consultationService.execute(profile);
            const report = consultationService.generate_report(profile, result.assessment);

            return {
                success: true,
                message: "Consultation report generated successfully.",
                data: report,
            };
        } catch (error) {
            const message =
                (error.details && error.details.message) || error.message ||
                "Erro na comunicação com o servidor.";
            console.error("API Error:", error);
            throw new Error(message);
        }
    },

    /**
     * ========================================================
     * Gerar SkinMap Report
     *
     * Antes: POST /api/v1/report
     * Agora: mesmo fluxo de generateConsultationReport
     * ========================================================
     */

    async generateReport(data) {
        try {
            if (!data) {
                throw new Error("SkinProfile cannot be empty.");
            }

            const profile = new SkinProfile(data);
            const result = consultationService.execute(profile);
            const report = consultationService.generate_report(profile, result.assessment);

            return {
                success: true,
                message: "Report generated successfully.",
                data: report,
            };
        } catch (error) {
            const message =
                (error.details && error.details.message) || error.message ||
                "Erro na comunicação com o servidor.";
            console.error("API Error:", error);
            throw new Error(message);
        }
    },

    /**
     * ========================================================
     * Cadastro de Lead
     *
     * NOTA: lead.js chama SkinMapAPI.sendLead(), mas esse método
     * nunca existiu em api.js, nem em nenhum endpoint do backend
     * Python (só existe "/api/v1/consultation", não "/lead"). Além
     * disso, lead.js não é carregado por nenhum HTML do projeto —
     * é um arquivo órfão, sem efeito na aplicação hoje. Implementei
     * sendLead aqui como alias de sendConsultation, para o caso de
     * você reativar esse arquivo no futuro, mas vale confirmar se
     * era esse o comportamento pretendido.
     * ========================================================
     */

    async sendLead(data) {
        return this.sendConsultation(data);
    },

};

// Exposição global
window.SkinMapAPI = SkinMapAPI;
