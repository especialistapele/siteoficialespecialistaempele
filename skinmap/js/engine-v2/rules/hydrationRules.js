import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const HYDRATION_RULES = { 'adequate': { 'description': 'Perfil com percepção de conforto e hidratação equilibrada.', 'priority': 'low', 'observations': ['avaliar manutenção do equilíbrio atual', 'considerar objetivos estéticos individuais', 'observar mudanças relacionadas à rotina'], 'consultation_focus': ['manutenção do equilíbrio percebido', 'otimização da rotina de cuidados'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.APPEARANCE], 'possible_characteristics': ['balanced_comfort', 'routine_maintenance'] }, 'low': { 'description': 'Perfil com percepção de menor conforto relacionado à hidratação da pele.', 'priority': 'medium', 'observations': ['avaliar sensação após limpeza', 'observar relação com rotina atual', 'analisar percepção de textura'], 'consultation_focus': ['equilíbrio entre conforto e hidratação', 'organização da rotina atual', 'compreensão do comportamento da pele'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.ROUTINE], 'possible_characteristics': ['tightness_sensation', 'rough_texture', 'loss_of_comfort'] }, 'very_low': { 'description': 'Perfil com maior percepção de desconforto relacionado à hidratação.', 'priority': 'high', 'observations': ['avaliar histórico da rotina de cuidados', 'observar fatores associados ao desconforto', 'aprofundar contexto individual na consultoria'], 'consultation_focus': ['compreensão aprofundada da rotina', 'análise do conforto percebido', 'construção de estratégia personalizada'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.REGENERATIVE_CONTEXT], 'possible_characteristics': ['tightness_sensation', 'skin_discomfort', 'reactive_behavior'] } };

/** Retorna a regra de interpretação de hidratação. */
export function get_hydration_rule(hydration_level) {
  return HYDRATION_RULES[hydration_level] !== undefined ? HYDRATION_RULES[hydration_level] : null;
}

/** Retorna as observações relacionadas a um perfil de hidratação. */
export function get_hydration_observations(hydration_level) {
  const rule = get_hydration_rule(hydration_level);
  if (!rule) return [];
  return rule.observations || [];
}

/** Retorna o foco de consulta relacionado ao perfil de hidratação. */
export function get_hydration_focus(hydration_level) {
  const rule = get_hydration_rule(hydration_level);
  if (!rule) return [];
  return rule.consultation_focus || [];
}

/** Retorna as dimensões relacionadas a um perfil de hidratação. */
export function get_hydration_dimensions(hydration_level) {
  const rule = get_hydration_rule(hydration_level);
  if (!rule) return [];
  return rule.related_dimensions || [];
}
