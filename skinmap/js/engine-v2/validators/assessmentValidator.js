/**
 * SkinMap Regenerativo — Assessment Validator
 * Portado de backend/core/skinmap/validators/assessment_validator.py (fase31)
 *
 * Valida estruturas SkinAssessment após a geração do assessment.
 * Não gera interpretações, recomendações, decisões clínicas
 * ou orientação de consultoria.
 */

import { ASSESSMENT_STATUS } from '../schema/assessment.js';

export class AssessmentValidationResult {
  constructor(valid, errors = null, warnings = null) {
    this.valid = valid;
    this.errors = errors || [];
    this.warnings = warnings || [];
  }
}

/** Compara versões semânticas com segurança. */
function _compare_versions(current, minimum) {
  try {
    const currentParts = current.split('.').map((x) => {
      const n = Number(x);
      if (!Number.isInteger(n)) throw new Error('not int');
      return n;
    });
    const minimumParts = minimum.split('.').map((x) => {
      const n = Number(x);
      if (!Number.isInteger(n)) throw new Error('not int');
      return n;
    });
    // comparação lexicográfica de arrays, equivalente a comparação de listas em Python
    const len = Math.max(currentParts.length, minimumParts.length);
    for (let i = 0; i < len; i++) {
      const c = currentParts[i] ?? 0;
      const m = minimumParts[i] ?? 0;
      if (c < m) return true;
      if (c > m) return false;
    }
    return false;
  } catch {
    return false;
  }
}

export function validate_assessment(assessment) {
  const errors = [];
  const warnings = [];

  if (assessment === null || assessment === undefined) {
    return new AssessmentValidationResult(false, ['Assessment cannot be empty.']);
  }

  // Identidade
  if (!assessment.assessment_id) {
    errors.push('Assessment identifier is missing.');
  }

  // Versão
  if (!assessment.assessment_version) {
    errors.push('Assessment version is missing.');
  } else if (_compare_versions(assessment.assessment_version, '3.0')) {
    warnings.push('Assessment version is older than current schema version.');
  }

  // Relação com o perfil
  if (!assessment.profile_id) {
    warnings.push('Assessment has no related profile identifier.');
  }

  // Status
  if (assessment.status === ASSESSMENT_STATUS.CREATED) {
    warnings.push('Assessment has not been generated yet.');
  }

  const generatedOrReviewed = [ASSESSMENT_STATUS.GENERATED, ASSESSMENT_STATUS.REVIEWED];

  // Campos primários de interpretação
  if (generatedOrReviewed.includes(assessment.status)) {
    if (!assessment.skin_type) warnings.push('Generated assessment has no skin type information.');
    if (!assessment.hydration_level) warnings.push('Generated assessment has no hydration information.');
    if (!assessment.sensitivity_level) warnings.push('Generated assessment has no sensitivity information.');
    if (!assessment.barrier_status) warnings.push('Generated assessment has no barrier information.');
  }

  // Validação de coleções
  const listFields = [
    'analysis_dimensions', 'reported_characteristics', 'reported_observations',
    'identified_patterns', 'interpretation_notes', 'attention_points',
    'client_goals', 'profile_context', 'routine_observations', 'lifestyle_observations',
    'consultation_dimensions', 'consultation_focus', 'priority_dimensions',
    'consultation_orientation', 'regenerative_context', 'regenerative_insights',
  ];
  for (const fieldName of listFields) {
    if (!Array.isArray(assessment[fieldName])) {
      errors.push(`${fieldName} must be a list.`);
    }
  }

  // Validação de padrões
  for (const factor of assessment.identified_patterns || []) {
    if (!factor.pattern) errors.push('Assessment pattern is missing.');
    if (!factor.description) errors.push('Assessment pattern description cannot be empty.');
    if (!factor.source_dimension) warnings.push('Assessment pattern has no source dimension.');
  }

  // Validação de assessment gerado
  if (generatedOrReviewed.includes(assessment.status)) {
    if (!(assessment.analysis_dimensions && assessment.analysis_dimensions.length)) {
      warnings.push('Generated assessment has no analysis dimensions.');
    }
    if (!(assessment.identified_patterns && assessment.identified_patterns.length)) {
      warnings.push('Generated assessment contains no identified patterns.');
    }
  }

  // Validação de consultoria
  if (assessment.status === ASSESSMENT_STATUS.REVIEWED) {
    if (!(assessment.consultation_dimensions && assessment.consultation_dimensions.length)) {
      warnings.push('Reviewed assessment has no consultation dimensions.');
    }
    if (!assessment.consultation_summary) {
      warnings.push('Reviewed assessment has no consultation summary.');
    }
  }

  // Validação de guidance
  if (typeof assessment.consultation_guidance !== 'object' || assessment.consultation_guidance === null || Array.isArray(assessment.consultation_guidance)) {
    errors.push('consultation_guidance must be a dictionary.');
  }

  // Contexto regenerativo
  if (
    generatedOrReviewed.includes(assessment.status) &&
    !(assessment.regenerative_context && assessment.regenerative_context.length)
  ) {
    warnings.push('Assessment contains no regenerative context.');
  }

  return new AssessmentValidationResult(errors.length === 0, errors, warnings);
}

/** Checagem rápida de validade. */
export function is_assessment_valid(assessment) {
  return validate_assessment(assessment).valid;
}
