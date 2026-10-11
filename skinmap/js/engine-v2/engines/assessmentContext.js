/**
 * SkinMap Regenerativo — Assessment Context
 * Portado de backend/core/skinmap/engines/assessment_context.py (fase31)
 *
 * Bookkeeping/orquestração de um SkinAssessment: registro de quais
 * dimensões foram analisadas, anexação de metadados de rastreabilidade
 * do engine, e limpeza final (normalização) do assessment antes de ser
 * retornado. Não contém nenhuma regra de decisão clínica.
 */

import { ASSESSMENT_STATUS, REGENERATIVE_STAGE } from '../schema/assessment.js';
import * as result_builder from './resultBuilder.js';

export const ENGINE_METADATA_FIELDS = [
  'analysis_dimensions',
  'consultation_dimensions',
  'client_goals',
  'reported_characteristics',
  'reported_observations',
  'profile_context',
  'routine_observations',
  'lifestyle_observations',
  'regenerative_context',
  'regenerative_insights',
  'recommendation_context',
  'attention_points',
];

/** Registra dimensões analisadas a partir do SkinProfile. */
export function register_dimensions(profile, assessment) {
  const dimensions = {
    skin_type: profile.skin_type,
    hydration: profile.hydration_level,
    sensitivity: profile.sensitivity_level,
    barrier: profile.barrier_level,
    texture: profile.texture_level,
    appearance: profile.appearance_level,
  };

  for (const [name, value] of Object.entries(dimensions)) {
    if (value !== null && value !== undefined) {
      result_builder.add_unique(assessment.analysis_dimensions, name);
    }
  }

  if (profile.goals && profile.goals.length) {
    result_builder.add_unique(assessment.analysis_dimensions, 'goals');
  }

  if (profile.regenerative_context && profile.regenerative_context.length) {
    result_builder.add_unique(assessment.analysis_dimensions, 'regenerative_context');
  }
}

/** Adiciona informação de rastreabilidade do engine. */
export function attach_metadata(assessment, engine_name, engine_version) {
  const metadata = {
    engine: engine_name,
    engine_version: engine_version,
    generated_at: new Date().toISOString(),
    interpretation_type: 'skinmap_context_analysis',
  };

  if (!assessment.consultation_guidance) {
    assessment.consultation_guidance = {};
  }

  assessment.consultation_guidance = {
    ...assessment.consultation_guidance,
    engine_metadata: metadata,
  };
}

/** Limpeza final do assessment: remove valores duplicados e mantém estrutura consistente. */
export function normalize_assessment(assessment) {
  for (const field of ENGINE_METADATA_FIELDS) {
    const values = assessment[field] !== undefined ? assessment[field] : [];

    if (!values || values.length === 0) continue;

    const cleaned = [];
    for (let item of values) {
      if (!item) continue;
      if (typeof item === 'string') {
        item = item.trim();
      }
      if (item && !cleaned.includes(item)) {
        cleaned.push(item);
      }
    }
    assessment[field] = cleaned;
  }

  if (!assessment.regenerative_stage) {
    assessment.regenerative_stage = REGENERATIVE_STAGE.ANALYSIS;
  }

  if (!assessment.status) {
    assessment.status = ASSESSMENT_STATUS.GENERATED;
  }
}
