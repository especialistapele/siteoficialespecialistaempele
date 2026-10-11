import { SchemaBase } from './base.js';
export const ASSESSMENT_STATUS = Object.freeze({ CREATED: 'created', GENERATED: 'generated', REVIEWED: 'reviewed' });
export const ASSESSMENT_SOURCE = Object.freeze({ QUESTIONNAIRE: 'questionnaire', CONSULTATION: 'consultation', MANUAL: 'manual' });
export const SKIN_PATTERN = Object.freeze({ SKIN_BALANCE: 'skin_balance', OILINESS_PATTERN: 'oiliness_pattern', DRYNESS_PATTERN: 'dryness_pattern', HYDRATION_CONTEXT: 'hydration_context', BARRIER_CONTEXT: 'barrier_context', SENSITIVITY_CONTEXT: 'sensitivity_context', TEXTURE_CONTEXT: 'texture_context', APPEARANCE_CONTEXT: 'appearance_context', REGENERATIVE_INTEREST: 'regenerative_interest', PERSONALIZED_CONSULTATION: 'personalized_consultation', SKIN_QUALITY_EVOLUTION: 'skin_quality_evolution', LONG_TERM_SKIN_CONTEXT: 'long_term_skin_context', SKIN_JOURNEY_ORIENTATION: 'skin_journey_orientation' });
export const REGENERATIVE_STAGE = Object.freeze({ INITIALIZATION: 'initialization', DISCOVERY: 'discovery', ANALYSIS: 'analysis', ORIENTATION: 'orientation', CONTINUITY: 'continuity' });
export const ASSESSMENT_CONFIDENCE = Object.freeze({ LOW: 'low', MODERATE: 'moderate', HIGH: 'high' });

export class AssessmentFactor extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.pattern = data.pattern !== undefined ? data.pattern : null;
    this.source_dimension = data.source_dimension !== undefined ? data.source_dimension : 'unknown';
    this.confidence = data.confidence !== undefined ? data.confidence : ASSESSMENT_CONFIDENCE.MODERATE;
    this.description = data.description !== undefined ? data.description : null;
    this.evidence = data.evidence !== undefined ? data.evidence : [];
  }
}

export class SkinAssessment extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.assessment_id = data.assessment_id !== undefined ? data.assessment_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.assessment_version = data.assessment_version !== undefined ? data.assessment_version : '3.0';
    this.created_at = data.created_at !== undefined ? data.created_at : (() => new Date().toISOString())();
    this.updated_at = data.updated_at !== undefined ? data.updated_at : null;
    this.source = data.source !== undefined ? data.source : ASSESSMENT_SOURCE.QUESTIONNAIRE;
    this.status = data.status !== undefined ? data.status : ASSESSMENT_STATUS.CREATED;
    this.profile_id = data.profile_id !== undefined ? data.profile_id : null;
    this.skin_type = data.skin_type !== undefined ? data.skin_type : null;
    this.hydration_level = data.hydration_level !== undefined ? data.hydration_level : null;
    this.sensitivity_level = data.sensitivity_level !== undefined ? data.sensitivity_level : null;
    this.barrier_status = data.barrier_status !== undefined ? data.barrier_status : null;
    this.analysis_dimensions = data.analysis_dimensions !== undefined ? data.analysis_dimensions : [];
    this.reported_characteristics = data.reported_characteristics !== undefined ? data.reported_characteristics : [];
    this.reported_observations = data.reported_observations !== undefined ? data.reported_observations : [];
    this.identified_patterns = data.identified_patterns !== undefined ? data.identified_patterns : [];
    this.interpretation_notes = data.interpretation_notes !== undefined ? data.interpretation_notes : [];
    this.confidence_score = data.confidence_score !== undefined ? data.confidence_score : null;
    this.confidence_level = data.confidence_level !== undefined ? data.confidence_level : null;
    this.attention_points = data.attention_points !== undefined ? data.attention_points : [];
    this.metadata = data.metadata !== undefined ? data.metadata : {};
    this.client_goals = data.client_goals !== undefined ? data.client_goals : [];
    this.profile_context = data.profile_context !== undefined ? data.profile_context : [];
    this.routine_observations = data.routine_observations !== undefined ? data.routine_observations : [];
    this.lifestyle_observations = data.lifestyle_observations !== undefined ? data.lifestyle_observations : [];
    this.consultation_dimensions = data.consultation_dimensions !== undefined ? data.consultation_dimensions : [];
    this.consultation_focus = data.consultation_focus !== undefined ? data.consultation_focus : [];
    this.priority_dimensions = data.priority_dimensions !== undefined ? data.priority_dimensions : [];
    this.consultation_orientation = data.consultation_orientation !== undefined ? data.consultation_orientation : [];
    this.regenerative_context = data.regenerative_context !== undefined ? data.regenerative_context : [];
    this.regenerative_insights = data.regenerative_insights !== undefined ? data.regenerative_insights : [];
    this.consultation_guidance = data.consultation_guidance !== undefined ? data.consultation_guidance : {};
    this.recommendation_context = data.recommendation_context !== undefined ? data.recommendation_context : [];
    this.consultation_path = data.consultation_path !== undefined ? data.consultation_path : null;
    this.consultation_recommendation = data.consultation_recommendation !== undefined ? data.consultation_recommendation : null;
    this.regenerative_stage = data.regenerative_stage !== undefined ? data.regenerative_stage : null;
    this.characteristics_summary = data.characteristics_summary !== undefined ? data.characteristics_summary : null;
    this.consultation_summary = data.consultation_summary !== undefined ? data.consultation_summary : null;
    this.assessment_message = data.assessment_message !== undefined ? data.assessment_message : null;
    this.summary = data.summary !== undefined ? data.summary : null;
  }
}