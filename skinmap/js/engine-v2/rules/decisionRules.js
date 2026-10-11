/**
 * SkinMap Regenerativo — Decision Rules
 * Portado de backend/core/skinmap/rules/decision_rules.py (fase31)
 *
 * Define regras de combinação usadas para organizar a interpretação
 * do SkinMap. Conecta múltiplas dimensões de pele e cria insights
 * estruturados de consulta.
 *
 * Não fornece diagnóstico, tratamento ou prescrições.
 */

import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const DECISION_RULES = {
  oiliness_with_low_hydration: {
    condition: { skin_type: 'oily', hydration_level: 'low' },
    title: 'Equilíbrio entre oleosidade e hidratação percebida',
    insight:
      'A percepção de oleosidade pode coexistir com baixa hidratação percebida. ' +
      'A análise considera o comportamento da pele e a rotina atual.',
    analysis_focus: ['comportamento da pele', 'hidratação percebida', 'rotina atual'],
    related_dimensions: [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE],
  },
  sensitivity_with_barrier_attention: {
    condition: { sensitivity_level: 'high', barrier_level: 'support_needed' },
    title: 'Sensibilidade e conforto percebido',
    insight:
      'A percepção de sensibilidade indica necessidade de compreender melhor ' +
      'o contexto da rotina de cuidados.',
    analysis_focus: ['sensibilidade percebida', 'conforto', 'rotina'],
    related_dimensions: [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.BARRIER],
  },
  dryness_with_texture_variation: {
    condition: { skin_type: 'dry', texture_level: 'moderate_variation' },
    title: 'Conforto e percepção de textura',
    insight: 'A percepção de textura deve ser analisada junto ao contexto de hidratação e rotina.',
    analysis_focus: ['textura percebida', 'hidratação', 'objetivos pessoais'],
    related_dimensions: [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.TEXTURE],
  },
  appearance_goal_alignment: {
    condition: { appearance_level: ['moderate_attention', 'high_attention'] },
    list_condition: { goals: true },
    title: 'Objetivo estético personalizado',
    insight: 'Os objetivos relacionados à aparência são analisados junto às prioridades individuais.',
    analysis_focus: ['aparência percebida', 'objetivos', 'estratégia personalizada'],
    related_dimensions: [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS],
  },
  regenerative_consultation_interest: {
    condition: {
      regenerative_context: [
        'regenerative_consultation_interest',
        'personalized_strategy',
        'skin_journey_orientation',
      ],
    },
    title: 'Interesse em estratégia regenerativa',
    insight:
      'Existe interesse em uma consultoria personalizada baseada na compreensão da pele, ' +
      'objetivos individuais e organização de uma jornada de cuidados.',
    analysis_focus: ['perfil completo', 'objetivos pessoais', 'estratégia regenerativa'],
    related_dimensions: [SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.APPEARANCE],
  },
  skin_quality_evolution_interest: {
    condition: { regenerative_context: ['skin_quality_focus'] },
    title: 'Evolução da qualidade percebida da pele',
    insight:
      'A análise identifica interesse em aprimorar aspectos relacionados à aparência, ' +
      'textura e equilíbrio percebido.',
    analysis_focus: ['qualidade percebida', 'textura', 'aparência'],
    related_dimensions: [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.REGENERATIVE_CONTEXT],
  },
  long_term_skin_strategy_interest: {
    condition: { regenerative_context: ['long_term_care_strategy', 'routine_transformation'] },
    title: 'Construção de estratégia contínua de cuidados',
    insight:
      'Existe interesse em estruturar uma jornada de cuidados baseada em acompanhamento ' +
      'e evolução progressiva.',
    analysis_focus: ['rotina', 'hábitos', 'continuidade'],
    related_dimensions: [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT],
  },
};

export function get_decision_rule(key) {
  return DECISION_RULES[key] !== undefined ? DECISION_RULES[key] : null;
}

export function list_decision_rules() {
  return Object.keys(DECISION_RULES);
}

function _normalize_value(value) {
  // Em JS, os "enums" já são strings simples (sem atributo .value),
  // mas mantemos a função para espelhar a estrutura do Python e por segurança
  // caso um objeto com propriedade `value` seja passado.
  if (value !== null && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
}

/** Avalia se um perfil de dados satisfaz as condições de uma regra de decisão. */
export function evaluate_rule(rule_key, profile_data) {
  const rule = get_decision_rule(rule_key);
  if (!rule) return false;

  for (const [field, expected] of Object.entries(rule.condition || {})) {
    let value = profile_data[field];

    if (Array.isArray(value)) {
      value = value.map((item) => _normalize_value(item));
      if (Array.isArray(expected)) {
        if (!value.some((item) => expected.includes(item))) {
          return false;
        }
      } else {
        if (!value.includes(expected)) {
          return false;
        }
      }
    } else {
      value = _normalize_value(value);
      if (Array.isArray(expected)) {
        if (!expected.includes(value)) {
          return false;
        }
      } else if (value !== expected) {
        return false;
      }
    }
  }

  for (const [field, required] of Object.entries(rule.list_condition || {})) {
    const value = profile_data[field];
    const isEmpty = value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === '' || value === false || value === 0;
    if (required && isEmpty) {
      return false;
    }
  }

  return true;
}
