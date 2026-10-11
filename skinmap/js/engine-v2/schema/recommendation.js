import { SchemaBase } from './base.js';
export const RECOMMENDATION_STATUS = Object.freeze({ CREATED: 'created', GENERATED: 'generated', REVIEWED: 'reviewed' });
export const RECOMMENDATION_SOURCE = Object.freeze({ ASSESSMENT: 'assessment', CONSULTATION: 'consultation', MANUAL: 'manual' });
export const RECOMMENDATION_CATEGORY = Object.freeze({ SKIN_BALANCE: 'skin_balance', HYDRATION_SUPPORT: 'hydration_support', BARRIER_SUPPORT: 'barrier_support', SENSITIVITY_CONTEXT: 'sensitivity_context', TEXTURE_ANALYSIS: 'texture_analysis', APPEARANCE_GOALS: 'appearance_goals', ROUTINE_ORGANIZATION: 'routine_organization', LIFESTYLE_CONTEXT: 'lifestyle_context', REGENERATIVE_STRATEGY: 'regenerative_strategy' });
export const RECOMMENDATION_TYPE = Object.freeze({ EDUCATIONAL: 'educational', CONSULTATION_PREPARATION: 'consultation_preparation', REGENERATIVE_DIRECTION: 'regenerative_direction', FOLLOW_UP: 'follow_up' });
export const RECOMMENDATION_PRIORITY = Object.freeze({ PRIMARY: 'primary', SECONDARY: 'secondary', COMPLEMENTARY: 'complementary' });
export const RECOMMENDATION_CONFIDENCE = Object.freeze({ LOW: 'low', MODERATE: 'moderate', HIGH: 'high' });

export class RecommendationItem extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.category = data.category !== undefined ? data.category : null;
    this.type = data.type !== undefined ? data.type : RECOMMENDATION_TYPE.EDUCATIONAL;
    this.priority = data.priority !== undefined ? data.priority : RECOMMENDATION_PRIORITY.SECONDARY;
    this.confidence = data.confidence !== undefined ? data.confidence : RECOMMENDATION_CONFIDENCE.MODERATE;
    this.title = data.title !== undefined ? data.title : null;
    this.description = data.description !== undefined ? data.description : null;
    this.related_dimensions = data.related_dimensions !== undefined ? data.related_dimensions : [];
    this.evidence_context = data.evidence_context !== undefined ? data.evidence_context : [];
  }
}

export class SkinRecommendation extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.recommendation_id = data.recommendation_id !== undefined ? data.recommendation_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.recommendation_version = data.recommendation_version !== undefined ? data.recommendation_version : '2.1';
    this.created_at = data.created_at !== undefined ? data.created_at : (() => new Date().toISOString())();
    this.updated_at = data.updated_at !== undefined ? data.updated_at : null;
    this.source = data.source !== undefined ? data.source : RECOMMENDATION_SOURCE.ASSESSMENT;
    this.status = data.status !== undefined ? data.status : RECOMMENDATION_STATUS.CREATED;
    this.profile_id = data.profile_id !== undefined ? data.profile_id : null;
    this.assessment_id = data.assessment_id !== undefined ? data.assessment_id : null;
    this.assessment_version = data.assessment_version !== undefined ? data.assessment_version : null;
    this.recommendations = data.recommendations !== undefined ? data.recommendations : [];
    this.priority_areas = data.priority_areas !== undefined ? data.priority_areas : [];
    this.strategic_focus = data.strategic_focus !== undefined ? data.strategic_focus : [];
    this.consultation_directions = data.consultation_directions !== undefined ? data.consultation_directions : [];
    this.insights = data.insights !== undefined ? data.insights : [];
    this.regenerative_focus = data.regenerative_focus !== undefined ? data.regenerative_focus : [];
    this.reported_context = data.reported_context !== undefined ? data.reported_context : [];
    this.recommendation_context = data.recommendation_context !== undefined ? data.recommendation_context : [];
    this.focus_dimensions = data.focus_dimensions !== undefined ? data.focus_dimensions : [];
    this.metadata = data.metadata !== undefined ? data.metadata : {};
    this.long_term_strategy = data.long_term_strategy !== undefined ? data.long_term_strategy : null;
    this.recommendation_message = data.recommendation_message !== undefined ? data.recommendation_message : null;
    this.summary = data.summary !== undefined ? data.summary : null;
  }
}