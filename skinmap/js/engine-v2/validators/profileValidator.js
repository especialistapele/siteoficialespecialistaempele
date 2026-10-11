/**
 * SkinMap Regenerativo — Profile Validator
 * Portado de backend/core/skinmap/validators/profile_validator.py (fase31)
 *
 * Valida estruturas SkinProfile antes da geração de assessment.
 * Não interpreta comportamento de pele, não gera insights,
 * não diagnostica condições e não cria recomendações.
 */

import { PROFILE_STATUS } from '../schema/skinProfile.js';

export class ProfileValidationResult {
  constructor(valid, errors = null, warnings = null) {
    this.valid = valid;
    this.errors = errors || [];
    this.warnings = warnings || [];
  }
}

export function validate_profile(profile) {
  const errors = [];
  const warnings = [];

  // Validação básica
  if (profile === null || profile === undefined) {
    return new ProfileValidationResult(false, ['Profile cannot be empty.']);
  }

  // Validação de identidade
  if (!profile.id) {
    errors.push('Profile identifier is missing.');
  }
  if (!profile.profile_version) {
    errors.push('Profile version is missing.');
  }

  // Validação de status
  if (profile.status === PROFILE_STATUS.STARTED) {
    warnings.push('Profile questionnaire has not started.');
  } else if (profile.status === PROFILE_STATUS.PARTIAL) {
    warnings.push('Profile contains incomplete information.');
  }

  // Informação primária de pele
  const skinDimensions = [
    profile.skin_type,
    profile.hydration_level,
    profile.sensitivity_level,
    profile.barrier_level,
    profile.texture_level,
    profile.appearance_level,
  ];
  if (!skinDimensions.some(Boolean)) {
    warnings.push('No skin dimension information reported.');
  }
  if (profile.skin_type === null || profile.skin_type === undefined) {
    warnings.push('Skin type has not been reported.');
  }

  // Validação de coleções
  const listFields = [
    'characteristics',
    'goals',
    'regenerative_context',
    'routine_patterns',
    'current_products',
    'lifestyle_factors',
    'photoaging_context',
  ];
  for (const fieldName of listFields) {
    const value = profile[fieldName];
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be a list.`);
    }
  }

  // Compatibilidade de observações
  let observations = null;
  if ('observations' in profile) {
    observations = profile.observations;
  } else if ('skin_observations' in profile) {
    observations = profile.skin_observations;
  }
  if (observations !== null && observations !== undefined && !Array.isArray(observations)) {
    errors.push('observations must be a list.');
  }

  // Prontidão para assessment
  const hasInformation = [
    Boolean(profile.skin_type),
    Boolean(profile.hydration_level),
    Boolean(profile.sensitivity_level),
    Boolean(profile.barrier_level),
    Boolean(profile.texture_level),
    Boolean(profile.appearance_level),
    Boolean(profile.characteristics && profile.characteristics.length),
    Boolean(profile.goals && profile.goals.length),
    Boolean(profile.regenerative_context && profile.regenerative_context.length),
  ].some(Boolean);

  if (!hasInformation) {
    warnings.push('Profile does not contain enough information for assessment generation.');
  }

  return new ProfileValidationResult(errors.length === 0, errors, warnings);
}

/** Checagem rápida de validade. */
export function is_profile_valid(profile) {
  return validate_profile(profile).valid;
}
