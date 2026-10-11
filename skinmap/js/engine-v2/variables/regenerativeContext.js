import { SKIN_DIMENSION } from '../constants/skinDimensions.js';

export const REGENERATIVE_CONTEXT_TYPES = { 'exploration': { 'version': '1.0', 'name': 'Exploração', 'description': 'Contexto inicial onde informações sobre características percebidas, interesses e objetivos começam a ser organizadas.', 'purpose': 'understanding', 'focus_dimensions': [SKIN_DIMENSION.CHARACTERISTICS, SKIN_DIMENSION.SKIN_TYPE, SKIN_DIMENSION.GOALS] }, 'organization': { 'version': '1.0', 'name': 'Organização', 'description': 'Contexto onde informações coletadas são estruturadas considerando rotina, hábitos e comportamento percebido da pele.', 'purpose': 'structuring', 'focus_dimensions': [SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE, SKIN_DIMENSION.BARRIER] }, 'personalization': { 'version': '1.0', 'name': 'Personalização', 'description': 'Contexto onde características individuais, objetivos e interesses são relacionados para construir uma visão personalizada.', 'purpose': 'personalization', 'focus_dimensions': [SKIN_DIMENSION.GOALS, SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.REGENERATIVE_CONTEXT] }, 'evolution': { 'version': '1.0', 'name': 'Evolução', 'description': 'Contexto relacionado ao acompanhamento da jornada e observação de mudanças percebidas ao longo do tempo.', 'purpose': 'continuity', 'focus_dimensions': [SKIN_DIMENSION.APPEARANCE, SKIN_DIMENSION.ROUTINE, SKIN_DIMENSION.LIFESTYLE] } };

export const REGENERATIVE_CONTEXT_SIGNALS = { 'seeking_understanding': { 'name': 'Busca por compreensão', 'description': 'Indica interesse em compreender melhor as características e comportamento percebido da própria pele.', 'context_type': 'exploration' }, 'seeking_structure': { 'name': 'Busca por organização', 'description': 'Indica necessidade percebida de organizar informações relacionadas à rotina e hábitos.', 'context_type': 'organization' }, 'seeking_personalization': { 'name': 'Busca por personalização', 'description': 'Indica interesse em uma abordagem baseada nas características individuais identificadas.', 'context_type': 'personalization' }, 'seeking_continuity': { 'name': 'Busca por continuidade', 'description': 'Indica interesse em acompanhar uma jornada estruturada de evolução da pele.', 'context_type': 'evolution' } };

export const REGENERATIVE_CONTEXT_RELATIONSHIPS = { 'exploration': ['skin_understanding', 'skin_characteristics', 'goal_identification'], 'organization': ['routine_analysis', 'lifestyle_context', 'care_structure'], 'personalization': ['individual_strategy', 'goal_alignment', 'skin_quality_focus'], 'evolution': ['continuity', 'follow_up', 'journey_adjustment'] };

// ---- Funções auxiliares (portadas manualmente) ----

export function get_regenerative_context_type(key) {
  return REGENERATIVE_CONTEXT_TYPES[key] !== undefined ? REGENERATIVE_CONTEXT_TYPES[key] : null;
}

export function get_regenerative_context_signal(key) {
  return REGENERATIVE_CONTEXT_SIGNALS[key] !== undefined ? REGENERATIVE_CONTEXT_SIGNALS[key] : null;
}

export function get_context_relationships(key) {
  return REGENERATIVE_CONTEXT_RELATIONSHIPS[key] !== undefined ? REGENERATIVE_CONTEXT_RELATIONSHIPS[key] : [];
}

export function list_regenerative_context_types() {
  return Object.keys(REGENERATIVE_CONTEXT_TYPES);
}

export function list_regenerative_context_signals() {
  return Object.keys(REGENERATIVE_CONTEXT_SIGNALS);
}
