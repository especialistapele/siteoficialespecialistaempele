import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const TEXTURE_LEVELS = { 'smooth': { 'version': '1.1', 'analysis_role': 'texture_profile', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Textura percebida uniforme', 'description': 'Percepção de maior uniformidade visual e sensação de suavidade da pele.', 'behavior_profile': 'Indica percepção positiva relacionada à superfície, conforto e aparência.', 'characteristics': ['sensação de superfície uniforme', 'percepção de maciez', 'aparência equilibrada'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'moderate_variation': { 'version': '1.1', 'analysis_role': 'texture_profile', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Variação moderada de textura percebida', 'description': 'Percepção de diferenças na uniformidade visual ou tátil da pele.', 'behavior_profile': 'Pode indicar necessidade de analisar a relação entre textura, hidratação, rotina e conforto percebido.', 'characteristics': ['variação de suavidade', 'irregularidades ocasionais percebidas', 'busca por maior uniformidade'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.GOALS] }, 'irregular': { 'version': '1.1', 'analysis_role': 'texture_profile', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Textura pouco uniforme percebida', 'description': 'Percepção de menor uniformidade na aparência ou sensação da superfície.', 'behavior_profile': 'Requer correlação com outras dimensões antes de definir uma estratégia personalizada.', 'characteristics': ['sensação de superfície irregular', 'percepção de aspereza', 'interesse em melhorar aparência'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS] } };

export const TEXTURE_CHARACTERISTICS = { 'roughness_perception': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Percepção de aspereza', 'description': 'Relato de menor suavidade percebida na superfície da pele.', 'category': 'surface', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'uneven_surface': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Superfície pouco uniforme', 'description': 'Percepção visual ou tátil de diferenças na superfície cutânea.', 'category': 'uniformity', 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS] }, 'loss_of_softness': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Redução de suavidade percebida', 'description': 'Mudança percebida na sensação de maciez e conforto da pele.', 'category': 'comfort', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'visible_pore_concern': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Percepção de poros aparentes', 'description': 'Preocupação estética relacionada à aparência dos poros.', 'category': 'appearance', 'related_dimensions': [SKIN_DIMENSION.SKIN_TYPE, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS] }, 'fine_line_perception': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Percepção de linhas superficiais', 'description': 'Percepção visual relacionada à aparência da superfície da pele.', 'category': 'appearance', 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'skin_uniformity_goal': { 'version': '1.1', 'dimension': SKIN_DIMENSION.TEXTURE, 'name': 'Busca por maior uniformidade percebida', 'description': 'Interesse relatado em melhorar a percepção geral de uniformidade.', 'category': 'goal', 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_texture_level(key) {
  return TEXTURE_LEVELS[key] !== undefined ? TEXTURE_LEVELS[key] : null;
}

export function get_texture_characteristic(key) {
  return TEXTURE_CHARACTERISTICS[key] !== undefined ? TEXTURE_CHARACTERISTICS[key] : null;
}

export function list_texture_levels() {
  return Object.keys(TEXTURE_LEVELS);
}

export function list_texture_characteristics() {
  return Object.keys(TEXTURE_CHARACTERISTICS);
}
