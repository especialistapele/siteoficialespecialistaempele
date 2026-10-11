/**
 * SkinMap Regenerativo — Summary Service
 * Portado de backend/core/skinmap/services/summary_service.py (fase31)
 *
 * Gera resumos de consulta estruturados a partir de dados de
 * SkinAssessment. Transforma estruturas internas de interpretação
 * do SkinMap em comunicação voltada ao usuário.
 *
 * Não realiza diagnóstico, decisões de tratamento ou interpretação
 * clínica. O objetivo é converter informação de assessment em
 * linguagem educacional clara de consulta.
 */

export class SummaryService {
  // =================================================
  // Presentation Labels
  // Converte identificadores internos em linguagem legível ao usuário.
  // =================================================

  static DIMENSION_LABELS = {
    skin_type: 'Características da pele',
    hydration: 'Equilíbrio de hidratação',
    sensitivity: 'Sensibilidade percebida',
    barrier: 'Barreira cutânea',
    texture: 'Textura e qualidade da pele',
    appearance: 'Aparência da pele',
    goals: 'Objetivos pessoais',
    regenerative_context: 'Contexto regenerativo',
  };

  static PATTERN_LABELS = {
    skin_balance: 'Equilíbrio das características da pele',
    oiliness_pattern: 'Comportamento relacionado à oleosidade',
    dryness_pattern: 'Características relacionadas ao ressecamento',
    hydration_context: 'Contexto de hidratação e conforto',
    barrier_context: 'Contexto da barreira cutânea',
    sensitivity_context: 'Contexto de sensibilidade percebida',
    texture_context: 'Qualidade e textura da pele',
    appearance_context: 'Aspectos relacionados à aparência',
    regenerative_interest: 'Objetivos relacionados à regeneração cutânea',
    personalized_consultation: 'Necessidade de estratégia personalizada',
    skin_quality_evolution: 'Evolução da qualidade percebida da pele',
    long_term_skin_context: 'Planejamento de longo prazo',
    skin_journey_orientation: 'Jornada de acompanhamento da pele',
  };

  // =================================================
  // Main Generator
  // =================================================

  /** Gera os resumos de apresentação a partir de um assessment existente. */
  generate(assessment) {
    assessment.characteristics_summary = this._build_characteristics_summary(assessment);
    assessment.consultation_summary = this._build_consultation_summary(assessment);
    assessment.assessment_message = this._build_assessment_message(assessment);
    assessment.summary = this._build_general_summary(assessment);
    return assessment;
  }

  // =================================================
  // Characteristics Summary
  // =================================================

  /** Cria o resumo dos padrões identificados do SkinMap. */
  _build_characteristics_summary(assessment) {
    const characteristics = [];

    for (const factor of assessment.identified_patterns) {
      const pattern_value =
        factor.pattern && typeof factor.pattern === 'object' && 'value' in factor.pattern
          ? factor.pattern.value
          : String(factor.pattern);

      const label = SummaryService.PATTERN_LABELS[pattern_value] !== undefined
        ? SummaryService.PATTERN_LABELS[pattern_value]
        : pattern_value;

      if (!characteristics.includes(label)) {
        characteristics.push(label);
      }
    }

    if (!characteristics.length) {
      return 'As informações analisadas foram organizadas para compreender o contexto atual da pele e seus objetivos.';
    }

    return 'Aspectos observados na análise inicial:\n\n' + characteristics.map((item) => `• ${item}`).join('\n');
  }

  // =================================================
  // Consultation Summary
  // =================================================

  /** Constrói o resumo de orientação de consulta. */
  _build_consultation_summary(assessment) {
    const sections = [];
    const dimensions = [];

    const source_dimensions =
      assessment.consultation_dimensions && assessment.consultation_dimensions.length
        ? assessment.consultation_dimensions
        : assessment.analysis_dimensions;

    for (const dimension of source_dimensions || []) {
      const label = SummaryService.DIMENSION_LABELS[dimension] !== undefined
        ? SummaryService.DIMENSION_LABELS[dimension]
        : dimension;
      if (!dimensions.includes(label)) {
        dimensions.push(label);
      }
    }

    if (dimensions.length) {
      sections.push('A análise considerou: ' + this._join_items(dimensions));
    }

    if (assessment.client_goals && assessment.client_goals.length) {
      sections.push('Objetivos informados: ' + this._join_items(this._clean_values(assessment.client_goals)));
    }

    if (assessment.regenerative_context && assessment.regenerative_context.length) {
      sections.push(
        'Contexto regenerativo informado: ' + this._join_items(this._clean_values(assessment.regenerative_context)),
      );
    }

    if (!sections.length) {
      return 'As informações fornecidas serão consideradas como base para uma orientação personalizada.';
    }

    return sections.join(' ');
  }

  // =================================================
  // User Assessment Message
  // =================================================

  /** Cria a mensagem inicial de interpretação apresentada ao usuário. */
  _build_assessment_message(assessment) {
    const aspects = [];

    if (assessment.skin_type) aspects.push('características gerais da pele');
    if (assessment.hydration_level) aspects.push('equilíbrio de hidratação e conforto');
    if (assessment.sensitivity_level) aspects.push('sensibilidade percebida');
    if (assessment.barrier_status) aspects.push('contexto da barreira cutânea');
    if (assessment.identified_patterns && assessment.identified_patterns.length) {
      aspects.push('qualidade e textura da pele');
    }

    if (aspects.length) {
      return (
        'Sua análise inicial organizou informações relacionadas a ' +
        this._join_items(aspects) +
        '. Esses elementos ajudam a compreender o momento atual da sua pele e serão utilizados ' +
        'como base para uma estratégia personalizada de cuidado.'
      );
    }

    return (
      'Sua análise inicial organizou informações sobre características da pele, objetivos pessoais e ' +
      'contexto de cuidados para apoiar uma orientação personalizada.'
    );
  }

  // =================================================
  // General Summary
  // =================================================

  /** Cria o resumo final do SkinMap. */
  _build_general_summary(assessment) {
    if (assessment.assessment_message) {
      return (
        assessment.assessment_message +
        ' O SkinMap utiliza essas informações como referência para construção de uma estratégia ' +
        'personalizada e acompanhamento da evolução da pele.'
      );
    }

    return (
      'O SkinMap organizou informações relacionadas às características da pele, objetivos pessoais e ' +
      'contexto individual para apoiar uma orientação personalizada.'
    );
  }

  // =================================================
  // Helper - Remove Empty / Generic Values
  // =================================================

  /** Remove valores vazios e placeholders. */
  _clean_values(values) {
    if (!values || !values.length) return [];

    const ignored_values = new Set(['', 'string', 'null', 'none']);
    const cleaned = [];

    for (const value of values) {
      if (!value) continue;
      const normalized = String(value).trim();
      if (ignored_values.has(normalized.toLowerCase())) continue;
      if (!cleaned.includes(normalized)) {
        cleaned.push(normalized);
      }
    }

    return cleaned;
  }

  // =================================================
  // Helper - Remove Duplicates
  // =================================================

  /** Remove valores duplicados preservando a ordem. */
  _unique(values) {
    if (!values || !values.length) return [];
    return [...new Set(values)];
  }

  // =================================================
  // Helper - Natural Portuguese Join
  // =================================================

  /** Cria uma formatação de lista em português natural (A, A e B, A, B e C). */
  _join_items(items) {
    const cleaned = this._clean_values(items);

    if (!cleaned.length) return '';
    if (cleaned.length === 1) return cleaned[0];
    if (cleaned.length === 2) return `${cleaned[0]} e ${cleaned[1]}`;

    return cleaned.slice(0, -1).join(', ') + ' e ' + cleaned[cleaned.length - 1];
  }
}

// =====================================================
// Factory
// =====================================================

export function create_summary_service() {
  return new SummaryService();
}
