import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const SKIN_CHARACTERISTICS = { 'oiliness_perception': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'oiliness', 'name': 'Percepção de oleosidade', 'description': 'Relato de percepção relacionada ao brilho ou oleosidade da pele.', 'related_dimensions': [SKIN_DIMENSION.SKIN_TYPE, SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.ROUTINE] }, 'localized_oiliness': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'regional_behavior', 'name': 'Oleosidade localizada percebida', 'description': 'Relato de diferenças percebidas de oleosidade entre regiões da face.', 'related_dimensions': [SKIN_DIMENSION.SKIN_TYPE, SKIN_DIMENSION.TEXTURE] }, 'dryness_feeling': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'comfort', 'name': 'Sensação de ressecamento', 'description': 'Relato de sensação relacionada à perda de conforto percebido.', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.SENSITIVITY] }, 'tight_skin_feeling': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'comfort', 'name': 'Sensação de repuxamento', 'description': 'Relato de sensação de tensão ou desconforto percebido na pele.', 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.BARRIER] }, 'texture_irregularity': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'texture', 'name': 'Variação de textura percebida', 'description': 'Relato de diferenças percebidas na superfície e aparência da pele.', 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.APPEARANCE] }, 'rough_texture': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'texture', 'name': 'Textura áspera percebida', 'description': 'Relato de sensação de superfície menos uniforme.', 'related_dimensions': [SKIN_DIMENSION.TEXTURE, SKIN_DIMENSION.HYDRATION] }, 'dull_appearance': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'appearance', 'name': 'Redução de luminosidade percebida', 'description': 'Relato de percepção de menor viço ou luminosidade.', 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.GOALS] }, 'uneven_appearance': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'appearance', 'name': 'Aspecto irregular percebido', 'description': 'Relato de diferenças percebidas na aparência geral da pele.', 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.GOALS] }, 'skin_discomfort': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'comfort', 'name': 'Desconforto percebido', 'description': 'Relato de sensações desconfortáveis relacionadas à pele.', 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.BARRIER] }, 'skin_comfort': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.CHARACTERISTICS, 'category': 'comfort', 'name': 'Conforto percebido da pele', 'description': 'Relato de sensação positiva relacionada ao conforto cutâneo.', 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.HYDRATION] } };

export const CHARACTERISTIC_CATEGORIES = { 'oiliness': { 'name': 'Oleosidade', 'description': 'Percepções relacionadas ao brilho e oleosidade.' }, 'comfort': { 'name': 'Conforto', 'description': 'Sensações percebidas durante a experiência com a pele.' }, 'texture': { 'name': 'Textura', 'description': 'Percepções relacionadas à superfície da pele.' }, 'appearance': { 'name': 'Aparência', 'description': 'Percepções visuais relacionadas à aparência da pele.' }, 'regional_behavior': { 'name': 'Comportamento regional', 'description': 'Diferenças percebidas entre regiões da face.' } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_characteristic(key) {
  return SKIN_CHARACTERISTICS[key] !== undefined ? SKIN_CHARACTERISTICS[key] : null;
}

export function list_characteristics() {
  return Object.keys(SKIN_CHARACTERISTICS);
}

export function list_characteristic_categories() {
  return Object.keys(CHARACTERISTIC_CATEGORIES);
}

export function has_characteristic(key) {
  return key in SKIN_CHARACTERISTICS;
}
