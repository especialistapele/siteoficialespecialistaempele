import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const APPEARANCE_LEVELS = { 'balanced': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Qualidade visual percebida equilibrada', 'description': 'Relato de satisfação com a aparência geral e percepção de equilíbrio visual da pele.', 'characteristics': ['aparência uniforme percebida', 'percepção de luminosidade natural', 'boa relação com a própria aparência'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'moderate_attention': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Aspectos visuais para evolução percebida', 'description': 'Relato de características visuais que a pessoa deseja compreender, organizar ou aprimorar.', 'characteristics': ['percepção de alterações localizadas', 'desejo de melhorar uniformidade visual', 'interesse em compreender fatores relacionados'], 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.ROUTINE] }, 'high_attention': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Maior interesse em evolução da qualidade da pele', 'description': 'Relato de maior interesse em uma análise personalizada da aparência e evolução da pele.', 'characteristics': ['busca por estratégia personalizada', 'interesse em transformação estética', 'desejo de compreender fatores envolvidos'], 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.TEXTURE] } };

export const APPEARANCE_CHARACTERISTICS = { 'low_radiance': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Baixa luminosidade percebida', 'description': 'Percepção de menor luminosidade, viço ou aparência menos revitalizada da pele.', 'category': 'radiance', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'reduced_glow': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Redução do viço percebido', 'description': 'Relato de desejo por uma aparência visualmente mais equilibrada e saudável.', 'category': 'radiance', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.ROUTINE] }, 'uneven_visual_appearance': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Uniformidade visual reduzida', 'description': 'Percepção de diferenças visuais na aparência geral da pele.', 'category': 'uniformity', 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'tired_appearance': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Aparência de cansaço percebida', 'description': 'Relato de aparência menos descansada ou menor percepção de vitalidade visual.', 'category': 'vitality', 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'skin_quality_interest': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Interesse na qualidade global da pele', 'description': 'Desejo relatado de compreender fatores relacionados à qualidade visual e evolução da pele.', 'category': 'overall_quality', 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'aging_perception': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Percepção de mudanças relacionadas ao tempo', 'description': 'Relato de mudanças percebidas na aparência associadas ao processo natural de envelhecimento.', 'category': 'skin_evolution', 'related_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.TEXTURE] }, 'regenerative_interest': { 'dimension': SKIN_DIMENSION.APPEARANCE, 'name': 'Interesse em evolução regenerativa da pele', 'description': 'Interesse relatado em compreender estratégias voltadas à evolução da qualidade da pele.', 'category': 'regenerative', 'related_dimensions': [SKIN_DIMENSION.REGENERATIVE_CONTEXT, SKIN_DIMENSION.GOALS, SKIN_DIMENSION.LIFESTYLE] } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_appearance_level(key) {
  return APPEARANCE_LEVELS[key] !== undefined ? APPEARANCE_LEVELS[key] : null;
}

export function get_appearance_characteristic(key) {
  return APPEARANCE_CHARACTERISTICS[key] !== undefined ? APPEARANCE_CHARACTERISTICS[key] : null;
}

export function list_appearance_levels() {
  return Object.keys(APPEARANCE_LEVELS);
}

export function list_appearance_characteristics() {
  return Object.keys(APPEARANCE_CHARACTERISTICS);
}
