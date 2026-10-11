import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const BARRIER_RULES = { 'balanced': { 'description': 'Perfil com percepção de conforto e boa adaptação da pele à rotina atual.', 'priority': 'low', 'observations': ['avaliar manutenção do equilíbrio percebido', 'considerar objetivos individuais', 'observar mudanças na rotina de cuidados'], 'consultation_focus': ['manutenção do equilíbrio atual', 'compreensão dos objetivos pessoais', 'organização da rotina preventiva'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.APPEARANCE], 'possible_characteristics': ['balanced_comfort', 'good_tolerance'] }, 'attention': { 'description': 'Perfil com percepção de alterações no conforto ou adaptação da pele à rotina atual.', 'priority': 'medium', 'observations': ['avaliar histórico de cuidados', 'observar relação entre produtos e conforto', 'compreender fatores associados ao comportamento da pele'], 'consultation_focus': ['análise da rotina atual', 'compreensão dos fatores relacionados ao conforto', 'identificação de pontos de melhoria'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.ROUTINE], 'possible_characteristics': ['skin_discomfort', 'routine_variation', 'loss_of_comfort'] }, 'support_needed': { 'description': 'Perfil com maior percepção de desconforto ou baixa tolerância relatada.', 'priority': 'high', 'observations': ['aprofundar contexto individual', 'avaliar consistência da rotina', 'direcionar para consultoria personalizada'], 'consultation_focus': ['análise aprofundada do comportamento da pele', 'compreensão do contexto regenerativo', 'estruturação de estratégia personalizada'], 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.REGENERATIVE_CONTEXT], 'possible_characteristics': ['product_intolerance', 'reactive_behavior', 'skin_discomfort'] } };

export const BARRIER_COMBINATIONS = { 'barrier_with_low_hydration': { 'description': 'Associação entre percepção de suporte reduzido da barreira e baixa hidratação percebida.', 'observations': ['avaliar conforto da pele', 'observar sensação após rotina', 'analisar percepção de textura'], 'consultation_focus': ['integração entre conforto e hidratação', 'compreensão do comportamento da pele'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.TEXTURE] }, 'barrier_with_sensitivity': { 'description': 'Associação entre atenção à barreira e sensibilidade percebida.', 'observations': ['avaliar fatores relacionados ao desconforto', 'compreender comportamento da pele', 'aprofundar informações na consultoria'], 'consultation_focus': ['análise integrada de sensibilidade e conforto', 'compreensão da rotina individual'], 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.ROUTINE] }, 'barrier_with_inconsistent_routine': { 'description': 'Associação entre percepção de barreira e irregularidade na rotina de cuidados.', 'observations': ['analisar organização dos cuidados', 'identificar dificuldades de constância', 'compreender contexto pessoal'], 'consultation_focus': ['organização da rotina', 'adaptação dos cuidados ao cotidiano'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE] }, 'barrier_with_texture_concern': { 'description': 'Associação entre percepção da barreira e preocupação com textura.', 'observations': ['avaliar percepção de suavidade', 'observar relação entre conforto e textura', 'entender objetivo estético da cliente'], 'consultation_focus': ['relação entre conforto e aparência', 'objetivos estéticos personalizados'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.APPEARANCE] } };

/** Recupera uma regra de interpretação de barreira. */
export function get_barrier_rule(barrier_level) {
  return BARRIER_RULES[barrier_level] !== undefined ? BARRIER_RULES[barrier_level] : null;
}

/** Retorna observações relacionadas a um perfil de barreira. */
export function get_barrier_observations(barrier_level) {
  const rule = get_barrier_rule(barrier_level);
  if (!rule) return [];
  return rule.observations || [];
}

/** Retorna o foco de consulta relacionado ao perfil de barreira. */
export function get_barrier_focus(barrier_level) {
  const rule = get_barrier_rule(barrier_level);
  if (!rule) return [];
  return rule.consultation_focus || [];
}

/** Retorna as dimensões relacionadas a um perfil de barreira. */
export function get_barrier_dimensions(barrier_level) {
  const rule = get_barrier_rule(barrier_level);
  if (!rule) return [];
  return rule.related_dimensions || [];
}

/** Recupera uma regra de combinação de barreira. */
export function get_barrier_combination(key) {
  return BARRIER_COMBINATIONS[key] !== undefined ? BARRIER_COMBINATIONS[key] : null;
}
