/**
 * SkinMap Regenerativo — Report Service
 * Portado de backend/core/skinmap/services/report_service.py (fase31)
 *
 * Constrói relatórios de consulta estruturados a partir de SkinProfile,
 * SkinAssessment e informação de consulta gerada. Prepara informação
 * para as camadas de apresentação.
 *
 * Não executa lógica diagnóstica, regras de interpretação ou recomendações.
 */

export class ReportService {
  // =================================================
  // Main Generator
  // =================================================

  /** Constrói o relatório de consulta completo. */
  generate(profile, assessment) {
    return {
      // Identidade do assessment
      assessment: {
        assessment_id: String(assessment.assessment_id),
        version: assessment.assessment_version,
        status: this._enum_value(assessment.status),
        created_at: assessment.created_at,
        confidence_score: assessment.confidence_score,
      },
      // Contexto do perfil
      profile: {
        profile_id: profile.id ? String(profile.id) : null,
        skin_type: this._enum_value(profile.skin_type),
        goals: this._clean_unique(profile.goals),
        regenerative_context: this._clean_unique(profile.regenerative_context),
      },
      // Contexto de pele
      skin_context: {
        skin_type: assessment.skin_type,
        hydration_level: assessment.hydration_level,
        sensitivity_level: assessment.sensitivity_level,
        barrier_status: assessment.barrier_status,
        characteristics: this._clean_unique(assessment.reported_characteristics),
      },
      // Resumo
      summary: {
        general: assessment.summary,
        assessment_message: assessment.assessment_message,
        consultation: assessment.consultation_summary,
        characteristics: assessment.characteristics_summary,
      },
      // Análise
      analysis: {
        dimensions: this._clean_unique(assessment.analysis_dimensions),
        consultation_dimensions: this._clean_unique(assessment.consultation_dimensions),
        patterns: this._build_patterns(assessment),
        observations: this._clean_unique(assessment.reported_observations),
        attention_points: this._clean_unique(assessment.attention_points),
      },
      // Direção de consulta
      consultation: {
        focus: this._clean_unique(assessment.consultation_focus),
        dimensions: this._clean_unique(assessment.consultation_dimensions),
        priority_dimensions: this._clean_unique(assessment.priority_dimensions),
        orientation: this._clean_unique(assessment.consultation_orientation),
        path: assessment.consultation_path,
        recommendation: assessment.consultation_recommendation,
        guidance: assessment.consultation_guidance,
      },
      // Contexto
      context: {
        profile_context: this._clean_unique(assessment.profile_context),
        routine_observations: this._clean_unique(assessment.routine_observations),
        lifestyle_observations: this._clean_unique(assessment.lifestyle_observations),
      },
      // Contexto regenerativo
      regenerative: {
        context: this._clean_unique(assessment.regenerative_context),
        insights: this._clean_unique(assessment.regenerative_insights),
        stage: this._enum_value(assessment.regenerative_stage),
      },
      // Metadata do relatório
      metadata: {
        report_version: '2.0',
        generated_from: 'skin_assessment',
        presentation_ready: true,
      },
    };
  }

  // =================================================
  // Pattern Builder
  // =================================================

  /** Converte os padrões do assessment em estruturas de apresentação. */
  _build_patterns(assessment) {
    const patterns = [];

    for (const factor of assessment.identified_patterns) {
      patterns.push({
        pattern: this._enum_value(factor.pattern),
        source_dimension: factor.source_dimension,
        confidence: this._enum_value(factor.confidence),
        description: factor.description,
        evidence: this._clean_unique(factor.evidence),
      });
    }

    return patterns;
  }

  // =================================================
  // Helpers
  // =================================================

  /** Remove valores vazios, placeholders e duplicados, preservando a ordem original. */
  static _clean_unique(values) {
    if (!values || !values.length) return [];

    const ignored_values = new Set(['', 'string', 'null', 'none']);
    const cleaned = [];

    for (const value of values) {
      if (value === null || value === undefined) continue;
      const normalized = String(value).trim();
      if (ignored_values.has(normalized.toLowerCase())) continue;
      if (!cleaned.includes(normalized)) {
        cleaned.push(normalized);
      }
    }

    return cleaned;
  }

  /** Converte valores de enum em valores compatíveis com JSON. */
  static _enum_value(value) {
    if (value === null || value === undefined) return null;
    return typeof value === 'object' && 'value' in value ? value.value : value;
  }

  _clean_unique(values) {
    return ReportService._clean_unique(values);
  }

  _enum_value(value) {
    return ReportService._enum_value(value);
  }
}

// =====================================================
// Factory
// =====================================================

export function create_report_service() {
  return new ReportService();
}
