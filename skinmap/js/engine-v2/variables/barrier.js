import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const BARRIER_LEVELS = { 'balanced': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'secondary', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Equilíbrio percebido da barreira cutânea', 'description': 'Relato de sensação de conforto, adaptação e estabilidade percebida durante os cuidados habituais.', 'behavior_profile': 'Apresenta percepção de equilíbrio dentro do contexto informado.', 'characteristics': ['boa percepção de conforto', 'boa adaptação à rotina atual', 'baixa variação de desconforto percebido'], 'analysis_domains': ['comfort', 'adaptation', 'routine_context'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.ROUTINE] }, 'attention': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'secondary', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Variação de equilíbrio percebido da barreira', 'description': 'Relato de mudanças percebidas no conforto ou adaptação da pele conforme rotina, hábitos ou ambiente.', 'behavior_profile': 'Indica necessidade de compreender melhor os fatores relacionados ao comportamento percebido da pele.', 'characteristics': ['variação de conforto percebido', 'mudanças conforme rotina', 'alterações conforme ambiente'], 'analysis_domains': ['comfort', 'adaptation', 'environment_context'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.ROUTINE] }, 'support_needed': { 'version': '1.0', 'variable_type': 'dimension', 'priority': 'primary', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Necessidade percebida de compreender o equilíbrio da pele', 'description': 'Relato frequente de desconforto ou dificuldade de adaptação percebida durante os cuidados.', 'behavior_profile': 'Representa uma área prioritária para investigação durante a consultoria.', 'characteristics': ['desconforto recorrente relatado', 'variação frequente de conforto', 'necessidade de analisar contexto atual'], 'analysis_domains': ['comfort', 'adaptation', 'consultation_focus'], 'related_dimensions': [SKIN_DIMENSION.SENSITIVITY, SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.REGENERATIVE_CONTEXT] } };

export const BARRIER_CHARACTERISTICS = { 'comfort_variation': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Variação de conforto percebido', 'description': 'Relato de mudanças na sensação de conforto da pele ao longo do tempo.', 'category': 'comfort', 'analysis_domains': ['comfort', 'behavior'], 'related_dimensions': [SKIN_DIMENSION.HYDRATION, SKIN_DIMENSION.SENSITIVITY] }, 'adaptation_variation': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Variação de adaptação percebida', 'description': 'Relato de mudanças na forma como a pele responde aos cuidados habituais.', 'category': 'adaptation', 'analysis_domains': ['adaptation', 'routine_context'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.SENSITIVITY] }, 'environmental_comfort_change': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Influência ambiental percebida no conforto', 'description': 'Relato de mudanças percebidas relacionadas ao ambiente.', 'category': 'environment', 'analysis_domains': ['environment', 'lifestyle'], 'related_dimensions': [SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'cleansing_comfort_change': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Alteração de conforto após limpeza', 'description': 'Relato de mudança percebida após o processo de higienização.', 'category': 'routine_context', 'analysis_domains': ['routine', 'comfort'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.HYDRATION] }, 'routine_adaptation_concern': { 'version': '1.0', 'variable_type': 'characteristic', 'dimension': SKIN_DIMENSION.BARRIER, 'name': 'Interesse em compreender adaptação da rotina', 'description': 'Relato de interesse em compreender como a rotina atual influencia o conforto percebido da pele.', 'category': 'consultation_focus', 'analysis_domains': ['education', 'routine_context'], 'related_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.GOALS] } };


// ---- Funções auxiliares (portadas manualmente, mesmo padrão get/list/has) ----

export function get_barrier_level(key) {
  return BARRIER_LEVELS[key] !== undefined ? BARRIER_LEVELS[key] : null;
}

export function get_barrier_characteristic(key) {
  return BARRIER_CHARACTERISTICS[key] !== undefined ? BARRIER_CHARACTERISTICS[key] : null;
}

export function list_barrier_levels() {
  return Object.keys(BARRIER_LEVELS);
}

export function list_barrier_characteristics() {
  return Object.keys(BARRIER_CHARACTERISTICS);
}

export function has_barrier_level(key) {
  return key in BARRIER_LEVELS;
}
