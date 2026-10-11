/**
 * SkinMap Regenerativo — Result Builder
 * Portado de backend/core/skinmap/engines/result_builder.py (fase31)
 *
 * Helpers de montagem de resultado usados pelo DiagnosticEngine para
 * escrever em um SkinAssessment. São funções puras/utilitárias, sem
 * lógica de decisão clínica.
 */

import { AssessmentFactor } from '../schema/assessment.js';

/** Extrai valores normalizados com segurança (suporta enums, strings, null). */
export function extract_value(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && 'value' in value) return value.value;
  return String(value);
}

/** Adiciona um valor evitando duplicados. */
export function add_unique(collection, value) {
  if (!value) return;
  if (!collection.includes(value)) {
    collection.push(value);
  }
}

/** Registra uma dimensão de consulta. */
export function add_consultation_dimension(assessment, value) {
  add_unique(assessment.consultation_dimensions, value);
}

/** Adiciona uma observação contextual. */
export function add_observation(collection, value) {
  add_unique(collection, value);
}

/** Adiciona um ponto de atenção do SkinMap. */
export function add_attention_point(assessment, value) {
  add_unique(assessment.attention_points, value);
}

/**
 * Adiciona um padrão interpretado do SkinMap.
 * Padrões representam apenas interpretação contextual.
 */
export function add_pattern(assessment, pattern, description, source_dimension, evidence = null) {
  const exists = assessment.identified_patterns.some((item) => item.pattern === pattern);
  if (exists) return;

  assessment.identified_patterns.push(
    new AssessmentFactor({
      pattern,
      source_dimension,
      description,
      evidence: evidence || [],
    }),
  );
}
