/**
 * SkinMap Regenerativo — Validation Service
 * Portado de backend/core/skinmap/services/validation_service.py (fase31)
 *
 * Centraliza as rotinas de validação usadas em toda a aplicação SkinMap.
 * Este serviço delega a validação para validators específicos.
 * Não executa lógica de interpretação, diagnóstico ou recomendações.
 */

import { validate_assessment as _validate_assessment } from '../validators/assessmentValidator.js';
import { validate_profile as _validate_profile } from '../validators/profileValidator.js';
import { validate_questionnaire as _validate_questionnaire } from '../validators/questionnaireValidator.js';
import { validate_recommendation as _validate_recommendation } from '../validators/recommendationValidator.js';

export class ValidationService {
  // =================================================
  // Profile Validation
  // =================================================

  validate_profile(profile) {
    return _validate_profile(profile);
  }

  // =================================================
  // Assessment Validation
  // =================================================

  validate_assessment(assessment) {
    return _validate_assessment(assessment);
  }

  // =================================================
  // Recommendation Validation
  // =================================================

  validate_recommendation(recommendation) {
    return _validate_recommendation(recommendation);
  }

  // =================================================
  // Questionnaire Validation
  // =================================================

  validate_questionnaire(questionnaire) {
    return _validate_questionnaire(questionnaire);
  }

  // =================================================
  // Generic Validation
  // =================================================

  /** Executa as validações disponíveis. Só valida os objetos fornecidos. */
  validate_all({ profile = null, assessment = null, recommendation = null, questionnaire = null } = {}) {
    const results = {};

    if (profile !== null && profile !== undefined) {
      results.profile = this.validate_profile(profile);
    }
    if (assessment !== null && assessment !== undefined) {
      results.assessment = this.validate_assessment(assessment);
    }
    if (recommendation !== null && recommendation !== undefined) {
      results.recommendation = this.validate_recommendation(recommendation);
    }
    if (questionnaire !== null && questionnaire !== undefined) {
      results.questionnaire = this.validate_questionnaire(questionnaire);
    }

    return results;
  }

  // =================================================
  // Convenience Checks
  // =================================================

  is_profile_valid(profile) {
    return this.validate_profile(profile).valid;
  }

  is_assessment_valid(assessment) {
    return this.validate_assessment(assessment).valid;
  }

  is_recommendation_valid(recommendation) {
    return this.validate_recommendation(recommendation).valid;
  }

  is_questionnaire_valid(questionnaire) {
    return this.validate_questionnaire(questionnaire).valid;
  }
}

// =====================================================
// Factory
// =====================================================

export function create_validation_service() {
  return new ValidationService();
}
