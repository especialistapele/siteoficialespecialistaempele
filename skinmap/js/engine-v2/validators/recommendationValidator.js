/**
 * SkinMap Regenerativo — Recommendation Validator
 * Portado de backend/core/skinmap/validators/recommendation_validator.py (fase31)
 *
 * Valida estruturas SkinRecommendation após a geração da recomendação.
 * Não gera recomendações, decisões clínicas, tratamentos ou prescrições.
 */

import { RECOMMENDATION_STATUS } from '../schema/recommendation.js';

export class RecommendationValidationResult {
  constructor(valid, errors = null, warnings = null) {
    this.valid = valid;
    this.errors = errors || [];
    this.warnings = warnings || [];
  }
}

/** Compara versões com segurança. */
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

export function validate_recommendation(recommendation) {
  const errors = [];
  const warnings = [];

  if (recommendation === null || recommendation === undefined) {
    return new RecommendationValidationResult(false, ['Recommendation cannot be empty.']);
  }

  // Identidade
  if (!recommendation.recommendation_id) {
    errors.push('Recommendation identifier is missing.');
  }

  // Versão
  if (!recommendation.recommendation_version) {
    errors.push('Recommendation version is missing.');
  } else if (_compare_versions(recommendation.recommendation_version, '2.1')) {
    warnings.push('Recommendation version is older than current schema version.');
  }

  // Relacionamentos
  if (!recommendation.assessment_id) {
    warnings.push('Recommendation has no related assessment identifier.');
  }
  if (!recommendation.profile_id) {
    warnings.push('Recommendation has no related profile identifier.');
  }

  // Status
  if (recommendation.status === RECOMMENDATION_STATUS.CREATED) {
    warnings.push('Recommendation has not been generated yet.');
  }

  // Validação de coleções
  const listFields = [
    'recommendations', 'priority_areas', 'strategic_focus',
    'consultation_directions', 'insights', 'regenerative_focus', 'reported_context',
  ];
  for (const fieldName of listFields) {
    if (!Array.isArray(recommendation[fieldName])) {
      errors.push(`${fieldName} must be a list.`);
    }
  }

  // Validação dos itens de recomendação
  for (const item of recommendation.recommendations || []) {
    if (!item.title) errors.push('Recommendation item title cannot be empty.');
    if (!item.description) errors.push('Recommendation item description cannot be empty.');
    if (!item.category) errors.push('Recommendation item category is missing.');
    if (!(item.related_dimensions && item.related_dimensions.length)) {
      warnings.push('Recommendation item has no related dimensions.');
    }
  }

  // Validação de recomendação gerada
  const generatedOrReviewed = [RECOMMENDATION_STATUS.GENERATED, RECOMMENDATION_STATUS.REVIEWED];
  if (generatedOrReviewed.includes(recommendation.status)) {
    if (!(recommendation.recommendations && recommendation.recommendations.length)) {
      warnings.push('Generated recommendation contains no recommendation items.');
    }
    if (!(recommendation.strategic_focus && recommendation.strategic_focus.length)) {
      warnings.push('Generated recommendation has no strategic focus.');
    }
  }

  // Validação de resumo
  if (recommendation.status === RECOMMENDATION_STATUS.REVIEWED && !recommendation.summary) {
    warnings.push('Reviewed recommendation has no summary.');
  }

  // Validação de metadata
  if (
    typeof recommendation.metadata !== 'object' ||
    recommendation.metadata === null ||
    Array.isArray(recommendation.metadata)
  ) {
    errors.push('Recommendation metadata must be a dictionary.');
  }

  return new RecommendationValidationResult(errors.length === 0, errors, warnings);
}

/** Checagem rápida de validade. */
export function is_recommendation_valid(recommendation) {
  return validate_recommendation(recommendation).valid;
}
