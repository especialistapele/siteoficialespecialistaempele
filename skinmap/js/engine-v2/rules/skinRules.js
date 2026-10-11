import { SKIN_DIMENSION } from '../constants/skinDimensions.js';
import { SKIN_PATTERN } from '../schema/assessment.js';

export const SKIN_TYPE_RULES = { 'normal': { 'pattern': SKIN_PATTERN.SKIN_BALANCE, 'description': 'Perfil com percepção de equilíbrio relativo entre conforto, hidratação e oleosidade.', 'observations': ['manutenção do equilíbrio percebido', 'acompanhamento da rotina atual', 'avaliação de objetivos pessoais'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.APPEARANCE], 'focus': ['preservação do equilíbrio', 'qualidade da rotina', 'personalização dos cuidados'] }, 'dry': { 'pattern': SKIN_PATTERN.DRYNESS_PATTERN, 'description': 'Perfil com tendência percebida a menor oleosidade e necessidade de atenção ao conforto.', 'observations': ['avaliar sensação de conforto', 'observar percepção de hidratação', 'compreender contexto da rotina'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.TEXTURE], 'focus': ['hidratação percebida', 'conforto cutâneo', 'textura percebida'] }, 'oily': { 'pattern': SKIN_PATTERN.OILINESS_PATTERN, 'description': 'Perfil com tendência percebida ao aumento de oleosidade e brilho.', 'observations': ['avaliar equilíbrio da oleosidade', 'observar rotina atual', 'analisar relação entre oleosidade e hidratação'], 'related_dimensions': [SKIN_DIMENSION.CHARACTERISTICS, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.ROUTINE], 'focus': ['equilíbrio da aparência', 'comportamento da pele', 'organização da rotina'] }, 'combination': { 'pattern': SKIN_PATTERN.SKIN_BALANCE, 'description': 'Perfil com diferentes comportamentos percebidos em regiões distintas da pele.', 'observations': ['avaliar variações entre regiões', 'observar necessidades diferentes', 'analisar adaptação da rotina'], 'related_dimensions': [SKIN_DIMENSION.CHARACTERISTICS, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.ROUTINE], 'focus': ['equilíbrio entre regiões', 'personalização', 'rotina adaptável'] } };

/** Recupera a regra de interpretação associada a um tipo de pele. */
export function get_skin_rule(skin_type) {
  return SKIN_TYPE_RULES[skin_type] !== undefined ? SKIN_TYPE_RULES[skin_type] : null;
}

/** Retorna o padrão descritivo associado ao tipo de pele. */
export function get_skin_pattern(skin_type) {
  const rule = get_skin_rule(skin_type);
  if (!rule) return null;
  return rule.pattern;
}

/** Retorna as dimensões de análise relacionadas. */
export function get_related_dimensions(skin_type) {
  const rule = get_skin_rule(skin_type);
  if (!rule) return [];
  return rule.related_dimensions;
}

/** Retorna as observações associadas ao perfil de pele. */
export function get_skin_observations(skin_type) {
  const rule = get_skin_rule(skin_type);
  if (!rule) return [];
  return rule.observations;
}

/** Retorna as áreas de foco de consulta. */
export function get_skin_focus(skin_type) {
  const rule = get_skin_rule(skin_type);
  if (!rule) return [];
  return rule.focus;
}
