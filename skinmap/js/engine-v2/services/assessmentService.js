/**
 * SkinMap Regenerativo — Assessment Service
 * Portado de backend/core/skinmap/services/assessment_service.py (fase31)
 *
 * Serviço de aplicação responsável por coordenar o fluxo de geração
 * de assessment:
 *
 *   SkinProfile → Validação de Profile → DiagnosticEngine →
 *   SkinAssessment → Validação de Assessment → Assessment Gerado
 *
 * Este serviço apenas orquestra a geração. A lógica de interpretação
 * pertence às camadas de rules e engines.
 */

import { DiagnosticEngine } from '../engines/diagnosticEngine.js';
import { SkinAssessment, ASSESSMENT_STATUS } from '../schema/assessment.js';
import { validate_assessment } from '../validators/assessmentValidator.js';
import { validate_profile } from '../validators/profileValidator.js';

export class AssessmentService {
  constructor(diagnostic_engine = null) {
    this._engine = diagnostic_engine || new DiagnosticEngine();
  }

  // =================================================
  // Generate Assessment
  // =================================================

  /** Gera um SkinAssessment a partir de um SkinProfile. */
  generate_assessment(profile) {
    // Validar Profile
    const profile_validation = validate_profile(profile);
    if (!profile_validation.valid) {
      const err = new Error('SkinProfile validation failed.');
      err.details = {
        type: 'profile_validation_error',
        message: 'SkinProfile validation failed.',
        errors: profile_validation.errors,
        warnings: profile_validation.warnings,
      };
      throw err;
    }

    // Executar Diagnostic Engine
    const assessment = this._engine.analyze(profile);

    if (!(assessment instanceof SkinAssessment)) {
      const err = new Error('DiagnosticEngine must return SkinAssessment instance.');
      err.details = {
        type: 'invalid_assessment_output',
        message: 'DiagnosticEngine must return SkinAssessment instance.',
      };
      throw err;
    }

    // Normalizar estado do assessment
    assessment.profile_id = profile.id;
    assessment.status = ASSESSMENT_STATUS.GENERATED;

    // Validar assessment gerado
    const assessment_validation = validate_assessment(assessment);
    if (!assessment_validation.valid) {
      const err = new Error('Generated assessment is invalid.');
      err.details = {
        type: 'assessment_validation_error',
        message: 'Generated assessment is invalid.',
        errors: assessment_validation.errors,
        warnings: assessment_validation.warnings,
      };
      throw err;
    }

    return assessment;
  }

  // =====================================================
  // Assessment Validation
  // =====================================================

  /** Valida o SkinAssessment gerado, garantindo o contrato do DiagnosticEngine. */
  _validate_generated_assessment(assessment) {
    if (!(assessment instanceof SkinAssessment)) {
      const err = new Error('DiagnosticEngine returned an invalid object.');
      err.details = {
        message: 'DiagnosticEngine returned an invalid object.',
        expected: 'SkinAssessment',
        received: assessment && assessment.constructor ? assessment.constructor.name : typeof assessment,
      };
      throw err;
    }

    const validation = validate_assessment(assessment);
    if (!validation.valid) {
      const err = new Error('Generated SkinAssessment is invalid.');
      err.details = {
        message: 'Generated SkinAssessment is invalid.',
        errors: validation.errors,
        warnings: validation.warnings,
      };
      throw err;
    }
  }

  // =====================================================
  // Engine Information
  // =====================================================

  engine_info() {
    return {
      engine: this._engine.constructor.name,
      service: this.constructor.name,
    };
  }

  // =====================================================
  // Public Metadata
  // =====================================================

  metadata() {
    return {
      service: this.constructor.name,
      responsibility: 'Coordinate SkinAssessment generation workflow.',
      contains_interpretation_logic: false,
      engine: this._engine.constructor.name,
    };
  }
}

// =====================================================
// Factory
// =====================================================

export function create_assessment_service() {
  return new AssessmentService();
}
