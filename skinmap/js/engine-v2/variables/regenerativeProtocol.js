export const SKINMAP_PROTOCOL_STAGES = { 'initialization': { 'version': '1.0', 'name': 'Inicialização', 'description': 'Preparation stage responsible for organizing the SkinMap experience and collected information context.', 'objective': 'Prepare the discovery journey.', 'order': 1 }, 'discovery': { 'version': '1.0', 'name': 'Descoberta', 'description': 'Stage focused on collecting perceptions, characteristics, goals and skincare context.', 'objective': 'Understand the person\'s perceived skin profile and expectations.', 'order': 2 }, 'mapping': { 'version': '1.0', 'name': 'Mapeamento', 'description': 'Stage where collected answers are organized across SkinMap dimensions.', 'objective': 'Create a structured skin profile map.', 'order': 3 }, 'insight_generation': { 'version': '1.0', 'name': 'Geração de insights', 'description': 'Stage responsible for generating educational insights from the identified patterns.', 'objective': 'Present areas of attention and personalization opportunities.', 'order': 4 }, 'consultation_transition': { 'version': '1.0', 'name': 'Transição para consultoria', 'description': 'Stage that connects the SkinMap experience with personalized consultation.', 'objective': 'Invite deeper analysis through the regenerative consultation.', 'order': 5 } };

export const SKINMAP_PROTOCOL_STEPS = { 'collect_profile_information': { 'stage': 'initialization', 'name': 'Coleta de informações do perfil', 'description': 'Collects information required for SkinMap analysis.' }, 'identify_skin_context': { 'stage': 'discovery', 'name': 'Identificação do contexto da pele', 'description': 'Maps perceived characteristics, behaviors and personal goals.' }, 'organize_skin_dimensions': { 'stage': 'mapping', 'name': 'Organização das dimensões', 'description': 'Groups collected information according to SkinMap dimensions.' }, 'generate_skin_insights': { 'stage': 'insight_generation', 'name': 'Geração de insights', 'description': 'Creates educational observations based on collected patterns.' }, 'invite_consultation': { 'stage': 'consultation_transition', 'name': 'Convite para consultoria', 'description': 'Presents the opportunity for a personalized regenerative consultation.' } };

export const SKINMAP_PROTOCOL_FLOW = { 'initialization': ['collect_profile_information'], 'discovery': ['identify_skin_context'], 'mapping': ['organize_skin_dimensions'], 'insight_generation': ['generate_skin_insights'], 'consultation_transition': ['invite_consultation'] };

// ---- Funções auxiliares (portadas manualmente) ----

export function get_protocol_stage(key) {
  return SKINMAP_PROTOCOL_STAGES[key] !== undefined ? SKINMAP_PROTOCOL_STAGES[key] : null;
}

export function get_protocol_step(key) {
  return SKINMAP_PROTOCOL_STEPS[key] !== undefined ? SKINMAP_PROTOCOL_STEPS[key] : null;
}

export function get_protocol_steps_by_stage(stage) {
  return SKINMAP_PROTOCOL_FLOW[stage] !== undefined ? SKINMAP_PROTOCOL_FLOW[stage] : [];
}

export function list_protocol_stages() {
  return Object.keys(SKINMAP_PROTOCOL_STAGES);
}

export function list_protocol_steps() {
  return Object.keys(SKINMAP_PROTOCOL_STEPS);
}
