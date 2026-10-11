/**
 * SkinMap Regenerativo — Consultation Guidance Builder
 * Portado de backend/core/skinmap/builders/consultation_guidance_builder.py (fase31)
 *
 * Transforma dados de SkinAssessment em orientação de consulta
 * educacional estruturada.
 *
 * Não gera diagnóstico, recomendações clínicas, tratamentos,
 * prescrições ou procedimentos.
 */

export const BUILDER_VERSION = '2.0';

export const DIMENSION_LABELS = {
  skin_type: 'Tipo de pele',
  hydration: 'Hidratação',
  sensitivity: 'Sensibilidade',
  barrier: 'Barreira cutânea',
  texture: 'Textura',
  appearance: 'Aparência',
  goals: 'Objetivos',
  regenerative_context: 'Contexto regenerativo',
  routine: 'Rotina de cuidados',
  lifestyle: 'Estilo de vida',
};

export const DIMENSION_GUIDANCE_MAP = {
  skin_type: 'Organizar informações relacionadas às características gerais do tipo de pele percebido.',
  hydration: 'Explorar informações relacionadas à percepção de hidratação, conforto e rotina de cuidados informada.',
  barrier: 'Considerar informações relacionadas à barreira cutânea percebida e contexto atual de cuidados.',
  sensitivity: 'Considerar relatos relacionados à sensibilidade percebida e fatores associados.',
  texture: 'Explorar características relacionadas à percepção de textura e qualidade visual da pele.',
  appearance: 'Organizar objetivos relacionados à aparência e qualidade percebida da pele.',
  routine: 'Considerar informações relacionadas aos hábitos atuais de cuidados.',
  lifestyle: 'Considerar fatores contextuais relacionados ao estilo de vida.',
};

// ==========================================================
// Utilities
// ==========================================================

/** Remove valores duplicados preservando a ordem. */
function _unique(values) {
  return [...new Set(values)];
}

/** Converte identificadores internos de dimensão em labels de apresentação. */
function _get_dimension_label(dimension) {
  return DIMENSION_LABELS[dimension] !== undefined ? DIMENSION_LABELS[dimension] : dimension;
}

// ==========================================================
// Dimension Extraction
// ==========================================================

function _collect_active_dimensions(assessment) {
  const dimensions = [];
  dimensions.push(...(assessment.consultation_dimensions || []));
  dimensions.push(...(assessment.analysis_dimensions || []));
  if (assessment.skin_type) dimensions.push('skin_type');
  if (assessment.hydration_level) dimensions.push('hydration');
  if (assessment.sensitivity_level) dimensions.push('sensitivity');
  if (assessment.barrier_status) dimensions.push('barrier');
  return _unique(dimensions);
}

function _build_priority_dimensions(assessment) {
  const priorities = [];
  priorities.push(...(assessment.priority_dimensions || []));
  priorities.push(...(assessment.consultation_dimensions || []));
  if (priorities.length === 0) {
    priorities.push(..._collect_active_dimensions(assessment));
  }
  return _unique(priorities);
}

function _build_consultation_focus(assessment) {
  const dimensions = _build_priority_dimensions(assessment);
  return _unique(dimensions.map((d) => _get_dimension_label(d)));
}

function _build_dimension_guidance(assessment) {
  const guidance = [];
  const dimensions = _build_priority_dimensions(assessment);
  for (const dimension of dimensions) {
    if (dimension in DIMENSION_GUIDANCE_MAP) {
      guidance.push(DIMENSION_GUIDANCE_MAP[dimension]);
    }
  }
  return _unique(guidance);
}

function _build_pattern_context(assessment) {
  return _unique(
    (assessment.identified_patterns || [])
      .filter((factor) => factor.description)
      .map((factor) => factor.description),
  );
}

function _build_goal_context(assessment) {
  return _unique(
    (assessment.client_goals || [])
      .filter((goal) => goal)
      .map((goal) => `Objetivo informado: ${goal}`),
  );
}

function _build_regenerative_context(assessment) {
  const context = [];
  context.push(...(assessment.regenerative_context || []));
  context.push(...(assessment.regenerative_insights || []));
  if (context.length === 0 && assessment.regenerative_stage) {
    context.push(
      'A consulta considera a evolução das características percebidas da pele ao longo do acompanhamento.',
    );
  }
  return _unique(context);
}

function _build_recommendation_context(assessment) {
  const context = [];
  context.push(...(assessment.profile_context || []));
  context.push(...(assessment.recommendation_context || []));
  context.push(...(assessment.attention_points || []));
  context.push(..._build_pattern_context(assessment));
  return _unique(context.filter((item) => item));
}

function _build_consultation_path(assessment) {
  if (assessment.regenerative_context && assessment.regenerative_context.length) {
    return (
      'Avaliação personalizada das características atuais da pele, objetivos individuais e ' +
      'contexto regenerativo para construção de uma estratégia de acompanhamento.'
    );
  }
  return (
    'Avaliação personalizada das características atuais da pele e objetivos individuais ' +
    'para organização de uma estratégia de cuidado.'
  );
}

function _build_consultation_recommendation(_assessment) {
  return (
    'As informações analisadas pelo SkinMap serão utilizadas como base para uma consulta ' +
    'personalizada, considerando as características percebidas da pele e os objetivos individuais.'
  );
}

function _build_strategic_focus(assessment) {
  return _unique(_build_priority_dimensions(assessment));
}

// ==========================================================
// Main Builder
// ==========================================================

/**
 * Constrói a orientação de consulta estruturada.
 * Transforma informações de assessment em contexto educacional
 * organizado de consulta. Não gera diagnóstico, tratamento ou prescrições.
 */
export function build_guidance(assessment) {
  const guidance = {};

  // Metadata
  guidance.schema_version = BUILDER_VERSION;
  guidance.assessment_id = String(assessment.assessment_id);
  guidance.type = 'consultation_guidance';
  guidance.metadata = {
    builder_version: BUILDER_VERSION,
    generated_from: 'assessment',
    dimensions_count: _collect_active_dimensions(assessment).length,
    patterns_count: (assessment.identified_patterns || []).length,
  };

  // Contrato principal do RecommendationService
  guidance.consultation_directions = _build_dimension_guidance(assessment);
  guidance.strategic_focus = _build_strategic_focus(assessment);
  guidance.insights = _build_goal_context(assessment);
  guidance.regenerative_focus = _build_regenerative_context(assessment);

  // Contexto estendido
  guidance.active_dimensions = _collect_active_dimensions(assessment);
  guidance.presentation_dimensions = _build_consultation_focus(assessment);
  guidance.priority_dimensions = _build_priority_dimensions(assessment);
  guidance.dimension_guidance = _build_dimension_guidance(assessment);
  guidance.pattern_context = _build_pattern_context(assessment);
  guidance.goal_context = _build_goal_context(assessment);
  guidance.regenerative_context = _build_regenerative_context(assessment);
  guidance.recommendation_context = _build_recommendation_context(assessment);

  // Comunicação de consulta
  guidance.consultation_summary = assessment.consultation_summary || '';
  guidance.consultation_path = assessment.consultation_path || _build_consultation_path(assessment);
  guidance.consultation_recommendation =
    assessment.consultation_recommendation || _build_consultation_recommendation(assessment);

  return guidance;
}

// ==========================================================
// Helpers
// ==========================================================

/** Retorna uma seção da orientação de consulta. */
export function get_guidance_section(guidance, section) {
  return guidance[section] !== undefined ? guidance[section] : [];
}

/** Retorna as seções disponíveis de orientação de consulta. */
export function list_guidance_sections() {
  return [
    'consultation_directions', 'strategic_focus', 'insights', 'regenerative_focus',
    'active_dimensions', 'presentation_dimensions', 'priority_dimensions',
    'dimension_guidance', 'pattern_context', 'goal_context', 'regenerative_context',
    'recommendation_context', 'consultation_summary', 'consultation_path',
    'consultation_recommendation', 'metadata',
  ];
}
