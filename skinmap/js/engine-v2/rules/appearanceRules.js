import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const APPEARANCE_RULES = { 'balanced': { 'description': 'Perfil com percepção positiva da aparência geral e sensação de equilíbrio visual da pele.', 'observations': ['avaliar manutenção da qualidade percebida', 'considerar objetivos individuais', 'observar mudanças relacionadas à rotina'], 'focus': ['manutenção da qualidade percebida', 'objetivos individuais', 'evolução da aparência da pele'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.HYDRATION], 'possible_characteristics': ['visual_balance', 'good_radiance_perception'] }, 'moderate_attention': { 'description': 'Perfil com alguns pontos específicos na aparência percebida que a cliente gostaria de melhorar.', 'observations': ['identificar os pontos específicos de interesse', 'avaliar relação com textura e hidratação percebida', 'compreender prioridades pessoais'], 'focus': ['pontos específicos de aprimoramento', 'objetivos estéticos', 'evolução da aparência da pele'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.HYDRATION], 'possible_characteristics': ['appearance_improvement_interest', 'texture_attention'] }, 'high_attention': { 'description': 'Perfil com maior interesse em evolução da aparência percebida da pele.', 'observations': ['aprofundar expectativa da cliente', 'compreender histórico de cuidados', 'direcionar análise personalizada'], 'focus': ['transformação da qualidade percebida', 'estratégia personalizada', 'objetivos de longo prazo'], 'related_dimensions': [SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.ROUTINE], 'possible_characteristics': ['appearance_priority', 'skin_quality_interest', 'personalized_strategy_interest'] } };

export const APPEARANCE_CHARACTERISTIC_RULES = { 'low_radiance': { 'description': 'Percepção de menor luminosidade ou viço na aparência da pele.', 'observations': ['avaliar relação com hidratação percebida', 'observar percepção de textura', 'compreender objetivo estético'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.TEXTURE] }, 'lack_of_glow': { 'description': 'Relato de interesse em uma aparência mais luminosa e revitalizada.', 'observations': ['identificar expectativa pessoal', 'relacionar com percepção geral da pele', 'avaliar contexto da rotina'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.ROUTINE] }, 'uneven_appearance': { 'description': 'Percepção de menor uniformidade na aparência geral da pele.', 'observations': ['avaliar relação com textura percebida', 'compreender objetivo visual principal', 'aprofundar informações na consultoria'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.GOALS] }, 'tired_appearance': { 'description': 'Relato de aparência percebida como menos revitalizada.', 'observations': ['considerar contexto de rotina', 'avaliar hábitos relatados', 'compreender percepção individual'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'skin_quality_interest': { 'description': 'Interesse em melhorar a percepção global da qualidade da pele.', 'observations': ['identificar objetivos pessoais', 'avaliar prioridades da cliente', 'direcionar aprofundamento da consultoria'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

export const APPEARANCE_COMBINATIONS = { 'appearance_with_texture_concern': { 'description': 'Associação entre preocupação visual e percepção de textura.', 'observations': ['avaliar expectativa estética', 'observar relação visual e tátil', 'compreender objetivo principal'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.GOALS] }, 'appearance_with_low_hydration': { 'description': 'Associação entre aparência percebida e baixa hidratação relatada.', 'observations': ['avaliar conforto percebido', 'observar relação entre hidratação e aparência', 'aprofundar rotina atual'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'appearance_with_regenerative_interest': { 'description': 'Associação entre objetivo visual e interesse em estratégia regenerativa.', 'observations': ['identificar expectativas pessoais', 'compreender objetivos de longo prazo', 'direcionar para consultoria personalizada'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'appearance_with_quality_evolution_interest': { 'description': 'Associação entre interesse em evolução da qualidade percebida da pele e objetivos pessoais.', 'observations': ['compreender expectativa de evolução', 'avaliar objetivos de longo prazo', 'relacionar aparência e estratégia personalizada'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

/** Recupera uma regra de interpretação de aparência. */
export function get_appearance_rule(appearance_level) {
  return APPEARANCE_RULES[appearance_level] !== undefined ? APPEARANCE_RULES[appearance_level] : null;
}

/** Retorna observações relacionadas à percepção de aparência. */
export function get_appearance_observations(appearance_level) {
  const rule = get_appearance_rule(appearance_level);
  if (!rule) return [];
  return rule.observations;
}

/** Retorna as dimensões relacionadas à percepção de aparência. */
export function get_appearance_dimensions(appearance_level) {
  const rule = get_appearance_rule(appearance_level);
  if (!rule) return [];
  return rule.related_dimensions;
}

/** Retorna o foco de consulta relacionado à aparência. */
export function get_appearance_focus(appearance_level) {
  const rule = get_appearance_rule(appearance_level);
  if (!rule) return [];
  return rule.focus || [];
}

/** Recupera uma regra de característica de aparência. */
export function get_appearance_characteristic_rule(key) {
  return APPEARANCE_CHARACTERISTIC_RULES[key] !== undefined ? APPEARANCE_CHARACTERISTIC_RULES[key] : null;
}

/** Recupera uma regra de combinação de aparência. */
export function get_appearance_combination(key) {
  return APPEARANCE_COMBINATIONS[key] !== undefined ? APPEARANCE_COMBINATIONS[key] : null;
}
