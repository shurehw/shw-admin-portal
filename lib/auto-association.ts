import { supabaseDb as db, MinimalCompany, MinimalCompanyService } from './supabase';

// Blocked domains (personal email providers)
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'live.com', 'msn.com',
  'me.com', 'ymail.com', 'gmx.com', 'proton.me', 'mail.ru'
];

export class AutoAssociationService {
  /**
   * Extract domain from email address
   */
  static extractDomain(email: string): string | null {
    if (!email || !email.includes('@')) return null;
    return email.split('@')[1].toLowerCase();
  }

  /**
   * Check if domain is blocked (personal email provider)
   */
  static isDomainBlocked(domain: string): boolean {
    return BLOCKED_DOMAINS.includes(domain.toLowerCase());
  }

  /**
   * Find company by domain (main domain or additional domains)
   */
  static async findCompanyByDomain(domain: string): Promise<MinimalCompany | null> {
    if (!domain || this.isDomainBlocked(domain)) {
      return null;
    }

    try {
      // First, try to find company by main domain
      const { data: companyByDomain, error: domainError } = await db
        .from('companies')
        .select('*')
        .eq('domain', domain)
        .single();

      if (!domainError && companyByDomain) {
        return companyByDomain;
      }

      // Then try company_domains table for additional domains
      const { data: companyDomains, error: domainsError } = await db
        .from('company_domains')
        .select(`
          domain,
          company:companies(*)
        `)
        .eq('domain', domain)
        .single();

      if (!domainsError && companyDomains?.company) {
        return companyDomains.company as MinimalCompany;
      }

    } catch (error) {
      console.error('Error finding company by domain:', error);
    }

    return null;
  }

  /**
   * Create a new company from email domain
   */
  static async createCompanyFromDomain(domain: string): Promise<MinimalCompany | null> {
    if (!domain || this.isDomainBlocked(domain)) {
      return null;
    }

    try {
      // Generate company name from domain (capitalize first part)
      const baseName = domain.split('.')[0];
      const companyName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      const newCompany = await MinimalCompanyService.create({
        name: companyName,
        domain: domain,
        lifecycle_stage: 'Prospect',
        props: {}
      });

      return newCompany;
    } catch (error) {
      console.error('Error creating company from domain:', error);
      return null;
    }
  }

  /**
   * Get or create company for email address
   * This mimics the database trigger functionality on the client side
   */
  static async getOrCreateCompanyForEmail(email: string): Promise<MinimalCompany | null> {
    const domain = this.extractDomain(email);
    if (!domain) return null;

    // Try to find existing company
    let company = await this.findCompanyByDomain(domain);

    // If not found, create new company
    if (!company) {
      company = await this.createCompanyFromDomain(domain);
    }

    return company;
  }

  /**
   * Add additional domain to existing company
   */
  static async addDomainToCompany(companyId: string, domain: string): Promise<boolean> {
    if (!domain || this.isDomainBlocked(domain)) {
      return false;
    }

    try {
      // Check if domain is already associated
      const { data: existingDomain } = await db
        .from('company_domains')
        .select('domain')
        .eq('domain', domain)
        .single();

      if (existingDomain) {
        console.log('Domain already associated with a company');
        return false;
      }

      // Add domain association
      const { error } = await db
        .from('company_domains')
        .insert([{
          domain: domain,
          company_id: companyId
        }]);

      if (error) {
        console.error('Error adding domain to company:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addDomainToCompany:', error);
      return false;
    }
  }

  /**
   * Remove domain from company
   */
  static async removeDomainFromCompany(domain: string): Promise<boolean> {
    try {
      const { error } = await db
        .from('company_domains')
        .delete()
        .eq('domain', domain);

      if (error) {
        console.error('Error removing domain from company:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeDomainFromCompany:', error);
      return false;
    }
  }

  /**
   * Get all domains for a company
   */
  static async getCompanyDomains(companyId: string): Promise<string[]> {
    try {
      // Get main domain from company
      const { data: company } = await db
        .from('companies')
        .select('domain')
        .eq('id', companyId)
        .single();

      // Get additional domains
      const { data: additionalDomains } = await db
        .from('company_domains')
        .select('domain')
        .eq('company_id', companyId);

      const domains: string[] = [];
      
      if (company?.domain) {
        domains.push(company.domain);
      }

      if (additionalDomains) {
        domains.push(...additionalDomains.map(d => d.domain));
      }

      return domains;
    } catch (error) {
      console.error('Error getting company domains:', error);
      return [];
    }
  }

  /**
   * Update blocked domains list
   */
  static async updateBlockedDomains(): Promise<void> {
    try {
      // This would sync with the database blocked_domains table
      const { data: blockedDomains } = await db
        .from('blocked_domains')
        .select('domain');

      if (blockedDomains) {
        // Update the static blocked domains list
        BLOCKED_DOMAINS.length = 0;
        BLOCKED_DOMAINS.push(...blockedDomains.map(d => d.domain));
      }
    } catch (error) {
      console.error('Error updating blocked domains:', error);
    }
  }
}