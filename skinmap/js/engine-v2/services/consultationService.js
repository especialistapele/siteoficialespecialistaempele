/**
 * SkinMap Regenerativo — Consultation Service
 * Portado de backend/core/skinmap/services/consultation_service.py (fase31)
 *
 * Coordena o fluxo completo de consulta do SkinMap:
 *
 *   Profile → Validation → Assessment → Recommendation → Summary →
 *   History → Report
 *
 * Este serviço apenas orquestra o fluxo da aplicação — não contém
 * regras de interpretação.
 */

import { SkinAssessment } from '../schema/assessment.js';
import { SkinRecommendation } from '../schema/recommendation.js';
import { AssessmentService } from './assessmentService.js';
import { HistoryService } from './historyService.js';
import { RecommendationService } from './recommendationService.js';
import { ReportService } from './reportService.js';
import { SummaryService } from './summaryService.js';
import { ValidationService } from './validationService.js';

export class ConsultationService {
  constructor({
    validation_service = null,
    assessment_service = null,
    recommendation_service = null,
    summary_service = null,
    report_service = null,
    history_service = null,
  } = {}) {
    this.validation_service = validation_service || new ValidationService();
    this.assessment_service = assessment_service || new AssessmentService();
    this.recommendation_service = recommendation_service || new RecommendationService();
    this.summary_service = summary_service || new SummaryService();
    this.report_service = report_service || new ReportService();
    this.history_service = history_service || new HistoryService();
  }

  // =================================================
  // Main Workflow
  // =================================================

  /**
   * Executa o pipeline completo de consulta.
   * Profile → Validation → Assessment → Recommendation → Summary → History
   * Retorna os dados estruturados de consulta.
   */
  execute(profile) {
    // Validação do perfil
    const validation = this.validation_service.validate_profile(profile);
    if (!validation.valid) {
      const err = new Error('Profile validation failed.');
      err.details = {
        profile_validation_errors: validation.errors,
        profile_validation_warnings: validation.warnings,
      };
      throw err;
    }

    // Geração do assessment
    const assessment = this.assessment_service.generate_assessment(profile);
    if (!(assessment instanceof SkinAssessment)) {
      throw new Error('AssessmentService must return SkinAssessment.');
    }

    // Geração da recomendação
    const recommendation = this.recommendation_service.generate(profile, assessment);
    if (!(recommendation instanceof SkinRecommendation)) {
      throw new Error('RecommendationService must return SkinRecommendation.');
    }

    // Geração do resumo
    this.summary_service.generate(assessment);

    // Armazenamento no histórico
    this.history_service.add(assessment);

    // Resposta do fluxo
    return { profile, assessment, recommendation };
  }

  // =================================================
  // Report Generation
  // =================================================

  /** Gera o relatório de consulta estruturado, delegando ao ReportService. */
  generate_report(profile, assessment) {
    if (!(assessment instanceof SkinAssessment)) {
      throw new Error('Report generation requires SkinAssessment.');
    }
    return this.report_service.generate(profile, assessment);
  }

  // =================================================
  // History
  // =================================================

  /** Retorna o histórico de assessments relacionados ao perfil. */
  history(profile) {
    if (!profile.id) return [];
    return this.history_service.get_by_profile(profile.id);
  }

  // =================================================
  // Latest Assessment
  // =================================================

  /** Retorna o assessment mais recente gerado para o perfil. */
  latest_assessment(profile) {
    if (!profile.id) return null;
    return this.history_service.get_latest(profile.id);
  }

  // =================================================
  // Factory Support
  // =================================================

  /** Retorna a composição atual de serviços (debugging/monitoramento). */
  services_status() {
    return {
      validation_service: this.validation_service.constructor.name,
      assessment_service: this.assessment_service.constructor.name,
      recommendation_service: this.recommendation_service.constructor.name,
      summary_service: this.summary_service.constructor.name,
      report_service: this.report_service.constructor.name,
      history_service: this.history_service.constructor.name,
    };
  }
}

// =====================================================
// Factory
// =====================================================

export function create_consultation_service() {
  return new ConsultationService();
}
