import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const SENSITIVITY_LEVELS = { 'low': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'secondary', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Baixa sensibilidade percebida', 'description': 'Relato de boa adaptação percebida aos cuidados habituais.', 'behavior_profile': 'Apresenta percepção de conforto e estabilidade dentro do contexto informado.', 'characteristics': ['baixa percepção de desconforto', 'boa adaptação percebida', 'poucas alterações relatadas'], 'analysis_domains': ['comfort', 'tolerance', 'routine_behavior'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.APPEARANCE] }, 'moderate': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'secondary', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Sensibilidade moderada percebida', 'description': 'Relato de variações de conforto dependendo da rotina, ambiente ou hábitos.', 'behavior_profile': 'Apresenta mudanças percebidas no comportamento da pele conforme determinados contextos.', 'characteristics': ['episódios ocasionais de desconforto', 'variação de tolerância percebida', 'mudanças conforme ambiente ou rotina'], 'analysis_domains': ['comfort', 'environment_context', 'routine_behavior'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE] }, 'high': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'primary', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Alta sensibilidade percebida', 'description': 'Relato frequente de desconforto ou menor tolerância percebida durante cuidados.', 'behavior_profile': 'Representa uma área importante para investigação durante a consultoria.', 'characteristics': ['desconforto frequente relatado', 'baixa tolerância percebida', 'dificuldade de adaptação relatada'], 'analysis_domains': ['comfort', 'tolerance', 'consultation_focus'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

export const SENSITIVITY_CHARACTERISTICS = { 'burning_sensation': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Sensação de ardor percebida', 'description': 'Relato de sensação desconfortável durante ou após determinados cuidados.', 'category': 'comfort', 'analysis_domains': ['comfort', 'routine_behavior'], 'related_dimensions': [SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE] }, 'color_change_perception': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Percepção de alteração visual de coloração', 'description': 'Relato de mudança visual percebida na aparência da pele.', 'category': 'appearance', 'analysis_domains': ['appearance', 'skin_behavior'], 'related_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.SENSITIVITY] }, 'low_product_tolerance': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Baixa tolerância percebida a produtos', 'description': 'Relato de dificuldade percebida na adaptação a determinados produtos ou mudanças de rotina.', 'category': 'routine_behavior', 'analysis_domains': ['routine', 'tolerance'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.BARRIER] }, 'environmental_reactivity': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Influência ambiental percebida', 'description': 'Relato de mudanças percebidas associadas ao ambiente.', 'category': 'lifestyle', 'analysis_domains': ['environment', 'lifestyle'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'post_procedure_sensitivity': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Alteração de conforto após procedimentos', 'description': 'Relato de mudança percebida no conforto após procedimentos estéticos.', 'category': 'procedure_context', 'analysis_domains': ['procedure_context', 'comfort'], 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.BARRIER, SKIN_DIMENSION.ROUTINE] }, 'seasonal_variation': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.SENSITIVITY, 'name': 'Variação sazonal percebida', 'description': 'Relato de mudanças percebidas conforme clima ou estação.', 'category': 'environment', 'analysis_domains': ['environment', 'lifestyle'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.BARRIER] } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_sensitivity_level(key) {
  return SENSITIVITY_LEVELS[key] !== undefined ? SENSITIVITY_LEVELS[key] : null;
}

export function get_sensitivity_characteristic(key) {
  return SENSITIVITY_CHARACTERISTICS[key] !== undefined ? SENSITIVITY_CHARACTERISTICS[key] : null;
}

export function list_sensitivity_levels() {
  return Object.keys(SENSITIVITY_LEVELS);
}

export function list_sensitivity_characteristics() {
  return Object.keys(SENSITIVITY_CHARACTERISTICS);
}

export function has_sensitivity_level(key) {
  return key in SENSITIVITY_LEVELS;
}
