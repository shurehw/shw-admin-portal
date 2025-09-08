import { supabaseDb as db } from './supabase';

export interface FieldDefinition {
  id: string;
  entity: 'contact' | 'company';
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'email' | 'phone' | 'url' | 'enum' | 'multiselect' | 'json';
  required: boolean;
  unique: boolean;
  group?: string;
  order: number;
  help_text?: string;
  options?: any;
  default_value?: any;
  visible: boolean;
  editable: boolean;
  system: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldGroup {
  name: string;
  fields: FieldDefinition[];
  order: number;
}

export class FieldDefinitionService {
  // Get field definitions for an entity
  static async getFieldDefinitions(entity: 'contact' | 'company'): Promise<FieldDefinition[]> {
    const { data, error } = await db
      .from('field_definitions')
      .select('*')
      .eq('entity', entity)
      .eq('archived', false)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching field definitions:', error);
      throw error;
    }

    return data || [];
  }

  // Get field definitions grouped by section
  static async getGroupedFieldDefinitions(entity: 'contact' | 'company'): Promise<FieldGroup[]> {
    const fields = await this.getFieldDefinitions(entity);
    const groups: { [key: string]: FieldGroup } = {};

    fields.forEach(field => {
      const groupName = field.group || 'General';
      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName,
          fields: [],
          order: this.getGroupOrder(groupName)
        };
      }
      groups[groupName].fields.push(field);
    });

    // Sort groups by order
    return Object.values(groups).sort((a, b) => a.order - b.order);
  }

  // Get group display order
  private static getGroupOrder(groupName: string): number {
    const orderMap: { [key: string]: number } = {
      'General': 1,
      'Status': 2,
      'Next Steps': 3,
      'Preferences': 4,
      'Commerce': 5,
      'Tags': 6,
      'Custom': 10
    };
    return orderMap[groupName] || 10;
  }

  // Create new field definition
  static async createFieldDefinition(field: Omit<FieldDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<FieldDefinition> {
    const { data, error } = await db
      .from('field_definitions')
      .insert([field])
      .select()
      .single();

    if (error) {
      console.error('Error creating field definition:', error);
      throw error;
    }

    return data;
  }

  // Update field definition
  static async updateFieldDefinition(id: string, updates: Partial<FieldDefinition>): Promise<FieldDefinition> {
    const { data, error } = await db
      .from('field_definitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating field definition:', error);
      throw error;
    }

    return data;
  }

  // Delete field definition (archive it)
  static async archiveFieldDefinition(id: string): Promise<void> {
    const { error } = await db
      .from('field_definitions')
      .update({ archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving field definition:', error);
      throw error;
    }
  }

  // Validate field value against definition
  static validateFieldValue(field: FieldDefinition, value: any): { valid: boolean; error?: string } {
    // Required validation
    if (field.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: `${field.label} is required` };
    }

    // Skip further validation if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: 'Invalid email format' };
        }
        break;

      case 'phone':
        // Basic phone validation - can be enhanced
        const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
        if (!phoneRegex.test(value)) {
          return { valid: false, error: 'Invalid phone format' };
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          return { valid: false, error: 'Invalid URL format' };
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, error: 'Must be a number' };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Must be true or false' };
        }
        break;

      case 'date':
      case 'datetime':
        if (isNaN(Date.parse(value))) {
          return { valid: false, error: 'Invalid date format' };
        }
        break;

      case 'enum':
        if (field.options?.values && !field.options.values.includes(value)) {
          return { valid: false, error: `Must be one of: ${field.options.values.join(', ')}` };
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Must be an array of values' };
        }
        if (field.options?.values) {
          const invalidValues = value.filter(v => !field.options.values.includes(v));
          if (invalidValues.length > 0) {
            return { valid: false, error: `Invalid values: ${invalidValues.join(', ')}` };
          }
        }
        break;
    }

    return { valid: true };
  }

  // Get default value for field
  static getDefaultValue(field: FieldDefinition): any {
    if (field.default_value !== null && field.default_value !== undefined) {
      return field.default_value;
    }

    switch (field.type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'multiselect':
        return [];
      case 'json':
        return {};
      default:
        return '';
    }
  }
}