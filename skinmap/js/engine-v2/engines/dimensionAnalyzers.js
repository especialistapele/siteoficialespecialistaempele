/**
 * SkinMap Regenerativo — Dimension Analyzers
 * Portado de backend/core/skinmap/engines/dimension_analyzers.py (fase31)
 *
 * Os 7 analisadores de dimensão usados pelo DiagnosticEngine (tipo de
 * pele, hidratação, sensibilidade, barreira, textura, aparência e
 * contexto geral do questionário). Cada função recebe o `profile` e o
 * `assessment` e escreve nele, usando as regras de `rules/` e os
 * helpers de `result_builder`.
 */

import { get_appearance_rule } from '../rules/appearanceRules.js';
import { get_barrier_rule } from '../rules/barrierRules.js';
import { get_hydration_rule } from '../rules/hydrationRules.js';
import { get_sensitivity_rule } from '../rules/sensitivityRules.js';
import { get_skin_rule } from '../rules/skinRules.js';
import { get_texture_rule } from '../rules/textureRules.js';
import { REGENERATIVE_STAGE, SKIN_PATTERN } from '../schema/assessment.js';
import { get_regenerative_context } from '../variables/regenerative.js';
import * as result_builder from './resultBuilder.js';

// =====================================================
// SKIN TYPE ANALYSIS
// =====================================================

/** Analisa o tipo de pele informado, usando as regras do SkinMap. */
export function analyze_skin_type(profile, assessment) {
  const skin_type = result_builder.extract_value(profile.skin_type);
  if (!skin_type) return;

  const pattern_map = {
    normal: SKIN_PATTERN.SKIN_BALANCE,
    dry: SKIN_PATTERN.DRYNESS_PATTERN,
    oily: SKIN_PATTERN.OILINESS_PATTERN,
    combination: SKIN_PATTERN.SKIN_BALANCE,
  };

  const pattern = pattern_map[skin_type];
  if (!pattern) return;

  const rule = get_skin_rule(skin_type);
  const description = rule ? rule.description || '' : 'Tipo de pele informado no questionário.';
  const evidence = [`Tipo de pele informado: ${skin_type}`];

  result_builder.add_pattern(assessment, pattern, description, 'skin_type', evidence);
  result_builder.add_consultation_dimension(assessment, 'skin_type');
}

// =====================================================
// HYDRATION ANALYSIS
// =====================================================

/** Analisa o contexto de hidratação. */
export function analyze_hydration(profile, assessment) {
  const hydration = result_builder.extract_value(profile.hydration_level);
  if (!hydration) return;

  const rule = get_hydration_rule(hydration);
  if (!rule) return;

  result_builder.add_consultation_dimension(assessment, 'hydration');

  for (const item of rule.observations || []) {
    result_builder.add_observation(assessment.routine_observations, item);
  }

  result_builder.add_pattern(
    assessment,
    SKIN_PATTERN.HYDRATION_CONTEXT,
    rule.description || 'Contexto relacionado à hidratação.',
    'hydration',
    [`Nível de hidratação informado: ${hydration}`],
  );

  result_builder.add_attention_point(
    assessment,
    'A hidratação foi considerada uma dimensão relevante na análise inicial.',
  );
}

// =====================================================
// SENSITIVITY ANALYSIS
// =====================================================

/** Analisa o contexto de sensibilidade. */
export function analyze_sensitivity(profile, assessment) {
  const sensitivity = result_builder.extract_value(profile.sensitivity_level);
  if (!sensitivity) return;

  const rule = get_sensitivity_rule(sensitivity);
  if (!rule) return;

  result_builder.add_consultation_dimension(assessment, 'sensitivity');

  for (const item of rule.observations || []) {
    result_builder.add_observation(assessment.lifestyle_observations, item);
  }

  result_builder.add_pattern(
    assessment,
    SKIN_PATTERN.SENSITIVITY_CONTEXT,
    rule.description || 'Contexto relacionado à sensibilidade.',
    'sensitivity',
    [`Nível de sensibilidade informado: ${sensitivity}`],
  );

  result_builder.add_attention_point(
    assessment,
    'A sensibilidade foi identificada como uma dimensão importante para orientação personalizada.',
  );
}

// =====================================================
// BARRIER ANALYSIS
// =====================================================

/** Analisa o contexto de barreira cutânea. */
export function analyze_barrier(profile, assessment) {
  const barrier = result_builder.extract_value(profile.barrier_level);
  if (!barrier) return;

  const rule = get_barrier_rule(barrier);
  if (!rule) return;

  result_builder.add_consultation_dimension(assessment, 'barrier');

  for (const item of rule.observations || []) {
    result_builder.add_observation(assessment.routine_observations, item);
  }

  result_builder.add_pattern(
    assessment,
    SKIN_PATTERN.BARRIER_CONTEXT,
    rule.description || 'Contexto relacionado à barreira cutânea.',
    'barrier',
    [`Condição de barreira informada: ${barrier}`],
  );

  result_builder.add_attention_point(
    assessment,
    'A barreira cutânea deve ser considerada na construção da estratégia personalizada.',
  );
}

// =====================================================
// TEXTURE ANALYSIS
// =====================================================

/** Analisa o contexto de textura. */
export function analyze_texture(profile, assessment) {
  const texture = result_builder.extract_value(profile.texture_level);
  if (!texture) return;

  const rule = get_texture_rule(texture);
  if (!rule) return;

  result_builder.add_consultation_dimension(assessment, 'texture');

  for (const item of rule.observations || []) {
    result_builder.add_observation(assessment.routine_observations, item);
  }

  result_builder.add_pattern(
    assessment,
    SKIN_PATTERN.TEXTURE_CONTEXT,
    rule.description || 'Contexto relacionado à textura.',
    'texture',
    [`Nível de textura informado: ${texture}`],
  );

  result_builder.add_attention_point(
    assessment,
    'Características relacionadas à textura foram identificadas durante a análise.',
  );
}

// =====================================================
// APPEARANCE ANALYSIS
// =====================================================

/** Analisa o contexto de aparência. */
export function analyze_appearance(profile, assessment) {
  const appearance = result_builder.extract_value(profile.appearance_level);
  if (!appearance) return;

  const rule = get_appearance_rule(appearance);
  if (!rule) return;

  result_builder.add_consultation_dimension(assessment, 'appearance');

  for (const item of rule.focus || []) {
    result_builder.add_observation(assessment.profile_context, item);
  }

  result_builder.add_pattern(
    assessment,
    SKIN_PATTERN.APPEARANCE_CONTEXT,
    rule.description || 'Contexto relacionado à aparência.',
    'appearance',
    [`Percepção de aparência informada: ${appearance}`],
  );
}

// =====================================================
// PROFILE CONTEXT
// =====================================================

/** Transfere o contexto do questionário para a estrutura de assessment. */
export function analyze_context(profile, assessment) {
  if (profile.goals && profile.goals.length) {
    for (const goal of profile.goals) {
      result_builder.add_observation(assessment.client_goals, goal);
    }
  }

  if (profile.characteristics && profile.characteristics.length) {
    for (const item of profile.characteristics) {
      result_builder.add_observation(assessment.reported_characteristics, item);
    }
  }

  if (profile.skin_observations && profile.skin_observations.length) {
    for (const item of profile.skin_observations) {
      result_builder.add_observation(assessment.reported_observations, item);
    }
  }

  if (profile.routine_patterns && profile.routine_patterns.length) {
    for (const item of profile.routine_patterns) {
      result_builder.add_observation(assessment.routine_observations, item);
    }
  }

  if (profile.lifestyle_factors && profile.lifestyle_factors.length) {
    for (const item of profile.lifestyle_factors) {
      result_builder.add_observation(assessment.lifestyle_observations, item);
    }
  }

  for (const item of profile.regenerative_context || []) {
    const context = get_regenerative_context(item);
    if (!context) continue;
    const description = context.description;
    if (description) {
      result_builder.add_observation(assessment.regenerative_context, description);
    }
  }

  if (assessment.regenerative_context && assessment.regenerative_context.length) {
    assessment.regenerative_stage = REGENERATIVE_STAGE.ORIENTATION;
  }
}
