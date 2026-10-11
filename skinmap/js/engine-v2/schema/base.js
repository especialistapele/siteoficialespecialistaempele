/**
 * SkinMap Regenerativo — Schema Base
 * Portado de backend/core/skinmap/schema/base.py (fase31)
 */

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export class SchemaBase {
  constructor(data = {}) {
    this.id = data.id !== undefined ? data.id : newId();
    this.created_at = data.created_at !== undefined ? data.created_at : new Date().toISOString();
    this.updated_at = data.updated_at !== undefined ? data.updated_at : null;
  }
}

export class SchemaMetadata {
  constructor(data = {}) {
    this.source = data.source !== undefined ? data.source : null;
    this.notes = data.notes !== undefined ? data.notes : null;
    this.version = data.version !== undefined ? data.version : '1.0';
  }
}
