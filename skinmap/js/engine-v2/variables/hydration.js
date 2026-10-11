import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const HYDRATION_LEVELS = { 'adequate': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'secondary', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Hidratação percebida equilibrada', 'description': 'Relato de sensação confortável e equilíbrio percebido relacionado à hidratação da pele.', 'behavior_profile': 'Apresenta percepção positiva de conforto dentro da rotina atual informada.', 'characteristics': ['sensação confortável da pele', 'baixa percepção de ressecamento', 'boa adaptação percebida'], 'analysis_domains': ['comfort', 'hydration_perception'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.ROUTINE] }, 'low': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'primary', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Baixa hidratação percebida', 'description': 'Relato de menor conforto ou sensação de necessidade relacionada à hidratação da pele.', 'behavior_profile': 'Indica interesse em compreender fatores relacionados ao conforto e organização dos cuidados atuais.', 'characteristics': ['sensação de ressecamento percebido', 'menor conforto após determinados momentos', 'percepção de necessidade de suporte'], 'analysis_domains': ['comfort', 'hydration_perception', 'routine_context'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.GOALS] }, 'very_low': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'primary', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Muito baixa hidratação percebida', 'description': 'Relato frequente de desconforto associado à percepção reduzida de hidratação.', 'behavior_profile': 'Representa uma área de maior interesse para investigação durante a consultoria.', 'characteristics': ['sensação frequente de repuxamento', 'desconforto relatado', 'alteração percebida no conforto da pele'], 'analysis_domains': ['comfort', 'barrier_context', 'consultation_priority'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS] } };

export const HYDRATION_CHARACTERISTICS = { 'tight_after_cleansing': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Sensação de repuxamento após limpeza', 'description': 'Relato de mudança no conforto percebido após higienização da pele.', 'category': 'comfort', 'analysis_domains': ['routine_behavior', 'comfort'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.BARRIER] }, 'daytime_dryness_feeling': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Sensação de ressecamento durante o dia', 'description': 'Percepção de alteração no conforto da pele ao longo do dia.', 'category': 'comfort', 'analysis_domains': ['daily_behavior', 'environment_context'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.BARRIER] }, 'dehydration_appearance': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Alteração visual relacionada ao conforto', 'description': 'Percepção visual relacionada à aparência e sensação de hidratação da pele.', 'category': 'appearance', 'analysis_domains': ['appearance', 'hydration_perception'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.TEXTURE] }, 'reduced_radiance': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Redução de luminosidade percebida', 'description': 'Relato de menor percepção de viço ou luminosidade visual.', 'category': 'appearance', 'analysis_domains': ['appearance', 'skin_quality'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'hydration_variability': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.HYDRATION, 'name': 'Variação de conforto percebida', 'description': 'Mudanças percebidas no conforto da pele conforme rotina ou ambiente.', 'category': 'behavior', 'analysis_domains': ['lifestyle', 'routine_behavior'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.SENSITIVITY] } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_hydration_level(key) {
  return HYDRATION_LEVELS[key] !== undefined ? HYDRATION_LEVELS[key] : null;
}

export function get_hydration_characteristic(key) {
  return HYDRATION_CHARACTERISTICS[key] !== undefined ? HYDRATION_CHARACTERISTICS[key] : null;
}

export function list_hydration_levels() {
  return Object.keys(HYDRATION_LEVELS);
}

export function list_hydration_characteristics() {
  return Object.keys(HYDRATION_CHARACTERISTICS);
}

export function has_hydration_level(key) {
  return key in HYDRATION_LEVELS;
}
