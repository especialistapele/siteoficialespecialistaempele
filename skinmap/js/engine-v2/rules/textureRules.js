import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const TEXTURE_RULES = { 'smooth': { 'description': 'Perfil com percepção de textura mais uniforme, confortável e equilibrada.', 'observations': ['avaliar manutenção da qualidade percebida', 'considerar objetivos individuais', 'observar mudanças relacionadas à rotina'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER], 'possible_characteristics': ['uniform_texture', 'surface_comfort', 'balanced_appearance'] }, 'moderate_variation': { 'description': 'Perfil com percepção de pequenas variações na superfície ou sensação da pele.', 'observations': ['avaliar percepção de suavidade', 'observar relação com hidratação percebida', 'analisar rotina atual de cuidados', 'compreender objetivo estético principal'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.ROUTINE], 'possible_characteristics': ['uneven_texture', 'surface_variation', 'roughness_perception'] }, 'irregular': { 'description': 'Perfil com maior percepção de irregularidade na textura da pele, com impacto perceptível na experiência diária de cuidado.', 'observations': ['aprofundar expectativas pessoais em relação à textura', 'compreender histórico de cuidados já utilizados', 'avaliar relação entre textura, barreira e conforto', 'direcionar análise personalizada'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS], 'possible_characteristics': ['significant_texture_irregularity', 'comfort_priority', 'personalized_strategy_interest'] } };

export const TEXTURE_CHARACTERISTICS_RULES = { 'rough_texture': { 'description': 'Percepção de aspereza ou menor suavidade na superfície da pele.', 'observations': ['relacionar com hidratação percebida', 'observar conforto da pele', 'avaliar rotina atual'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'uneven_texture': { 'description': 'Percepção de superfície menos uniforme.', 'observations': ['avaliar percepção visual e tátil', 'observar relação com aparência geral', 'compreender objetivo da cliente'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS] }, 'surface_discomfort': { 'description': 'Relato de desconforto associado à percepção da superfície da pele.', 'observations': ['avaliar conforto percebido', 'observar relação com sensibilidade', 'aprofundar contexto individual'], 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.BARRIER] }, 'texture_improvement_interest': { 'description': 'Interesse declarado em melhorar a percepção estética da textura.', 'observations': ['relacionar com objetivos pessoais', 'compreender expectativa estética', 'conectar com estratégia personalizada'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

export const TEXTURE_COMBINATIONS = { 'texture_with_low_hydration': { 'description': 'Associação entre percepção de textura e baixa hidratação percebida.', 'observations': ['avaliar sensação de conforto', 'observar relação entre hidratação e textura', 'compreender rotina atual'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'texture_with_barrier_attention': { 'description': 'Associação entre percepção de textura e necessidade de compreender o contexto da barreira percebida.', 'observations': ['avaliar percepção geral da pele', 'observar tolerância relatada', 'aprofundar análise na consultoria'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.SENSITIVITY] }, 'texture_with_appearance_goal': { 'description': 'Associação entre preocupação com textura e objetivo estético relacionado à aparência.', 'observations': ['avaliar expectativa da cliente', 'entender prioridade estética', 'relacionar com estratégia regenerativa'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

/** Recupera uma regra de interpretação de textura. */
export function get_texture_rule(texture_level) {
  return TEXTURE_RULES[texture_level] !== undefined ? TEXTURE_RULES[texture_level] : null;
}

/** Retorna observações relacionadas à percepção de textura. */
export function get_texture_observations(texture_level) {
  const rule = get_texture_rule(texture_level);
  if (!rule) return [];
  return rule.observations;
}

/** Retorna as dimensões relacionadas à percepção de textura. */
export function get_texture_dimensions(texture_level) {
  const rule = get_texture_rule(texture_level);
  if (!rule) return [];
  return rule.related_dimensions;
}

/** Recupera uma regra de característica de textura. */
export function get_texture_characteristic_rule(key) {
  return TEXTURE_CHARACTERISTICS_RULES[key] !== undefined ? TEXTURE_CHARACTERISTICS_RULES[key] : null;
}

/** Recupera uma regra de combinação de textura. */
export function get_texture_combination(key) {
  return TEXTURE_COMBINATIONS[key] !== undefined ? TEXTURE_COMBINATIONS[key] : null;
}
