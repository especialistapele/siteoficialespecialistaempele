import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const SENSITIVITY_RULES = { 'low': { 'description': 'Perfil com baixa percepção de sensibilidade e boa tolerância relatada durante os cuidados.', 'priority': 'low', 'observations': ['avaliar manutenção do equilíbrio atual', 'considerar objetivos individuais da cliente', 'observar mudanças relacionadas à rotina'], 'consultation_focus': ['manutenção do conforto percebido', 'otimização da rotina atual', 'acompanhamento dos objetivos pessoais'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE], 'possible_characteristics': ['balanced_comfort', 'good_tolerance'] }, 'moderate': { 'description': 'Perfil com variações de conforto ou sensibilidade percebida dependendo do contexto.', 'priority': 'medium', 'observations': ['avaliar produtos e hábitos atuais', 'observar fatores associados ao desconforto', 'considerar relação entre rotina e percepção da pele'], 'consultation_focus': ['compreensão dos fatores relacionados ao conforto', 'análise da rotina atual', 'organização das informações da pele'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE], 'possible_characteristics': ['reactive_behavior', 'discomfort_after_products', 'environmental_reactivity'] }, 'high': { 'description': 'Perfil com maior percepção de sensibilidade e necessidade de compreender melhor o contexto individual da pele.', 'priority': 'high', 'observations': ['aprofundar histórico de cuidados', 'avaliar fatores associados ao desconforto percebido', 'direcionar para análise personalizada na consultoria'], 'consultation_focus': ['compreensão aprofundada do comportamento da pele', 'análise de conforto percebido', 'construção de estratégia personalizada'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.REGENERATIVE_CONTEXT], 'possible_characteristics': ['burning_sensation', 'product_intolerance', 'skin_discomfort'] } };

export const SENSITIVITY_COMBINATIONS = { 'sensitivity_with_low_hydration': { 'description': 'Associação entre sensibilidade percebida e baixa hidratação percebida.', 'observations': ['avaliar conforto da pele', 'observar relação entre hidratação e sensibilidade', 'aprofundar rotina atual'], 'consultation_focus': ['equilíbrio entre conforto e hidratação', 'compreensão do comportamento da pele'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'sensitivity_with_routine_variation': { 'description': 'Associação entre sensibilidade percebida e variações na rotina de cuidados.', 'observations': ['analisar consistência da rotina', 'compreender mudanças frequentes', 'avaliar contexto individual'], 'consultation_focus': ['organização da rotina de cuidados', 'compreensão dos hábitos atuais'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE] }, 'sensitivity_with_barrier_attention': { 'description': 'Associação entre sensibilidade percebida e necessidade de atenção à barreira.', 'observations': ['avaliar percepção de conforto', 'observar tolerância relatada', 'aprofundar estratégia personalizada'], 'consultation_focus': ['análise integrada da pele', 'compreensão do contexto regenerativo'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

/** Recupera uma regra de interpretação de sensibilidade. */
export function get_sensitivity_rule(sensitivity_level) {
  return SENSITIVITY_RULES[sensitivity_level] !== undefined ? SENSITIVITY_RULES[sensitivity_level] : null;
}

/** Retorna observações relacionadas a um perfil de sensibilidade. */
export function get_sensitivity_observations(sensitivity_level) {
  const rule = get_sensitivity_rule(sensitivity_level);
  if (!rule) return [];
  return rule.observations || [];
}

/** Retorna o foco de consulta relacionado ao perfil de sensibilidade. */
export function get_sensitivity_focus(sensitivity_level) {
  const rule = get_sensitivity_rule(sensitivity_level);
  if (!rule) return [];
  return rule.consultation_focus || [];
}

/** Retorna as dimensões relacionadas a um perfil de sensibilidade. */
export function get_sensitivity_dimensions(sensitivity_level) {
  const rule = get_sensitivity_rule(sensitivity_level);
  if (!rule) return [];
  return rule.related_dimensions || [];
}

/** Recupera uma regra de combinação de sensibilidade. */
export function get_sensitivity_combination(key) {
  return SENSITIVITY_COMBINATIONS[key] !== undefined ? SENSITIVITY_COMBINATIONS[key] : null;
}
