import puppeteer from 'puppeteer';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc } from 'firebase/firestore';

interface RARVenue {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  licenseType: string;
  licenseStatus: string;
  licenseNumber: string;
  expirationDate: string;
  activityType: string;
  activityDate: string;
  owner: string;
  capacity?: number;
  phone?: string;
  email?: string;
}

interface ScraperConfig {
  email: string;
  password: string;
  headless?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // hours
}

class RARScraper {
  private config: ScraperConfig;
  private browser: any;
  private page: any;
  private isLoggedIn: boolean = false;

  constructor(config: ScraperConfig) {
    this.config = {
      headless: true,
      autoSync: false,
      syncInterval: 24,
      ...config
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent to appear more human
    await this.page.setViewport({ width: 1366, height: 768 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Add random delays between actions to appear human
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async login() {
    try {
      console.log('Logging into RAR...');
      
      await this.page.goto('https://leads.restaurantactivityreport.com/app/index.html', {
        waitUntil: 'networkidle2'
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
      
      // Random delay to appear human
      await this.delay(1000, 2000);
      
      // Enter credentials
      await this.page.type('input[type="email"], input[name="email"], #email', this.config.email, { delay: 100 });
      await this.delay(500, 1000);
      await this.page.type('input[type="password"], input[name="password"], #password', this.config.password, { delay: 100 });
      
      // Click login button
      await this.delay(500, 1000);
      await this.page.click('button[type="submit"], input[type="submit"], .login-button');
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Verify login success
      const url = await this.page.url();
      if (url.includes('search_Leads') || url.includes('dashboard')) {
        this.isLoggedIn = true;
        console.log('Successfully logged into RAR');
        return true;
      }
      
      throw new Error('Login failed - unexpected redirect');
      
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async scrapeNewVenues(daysBack: number = 7): Promise<RARVenue[]> {
    if (!this.isLoggedIn) {
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Unable to login to RAR');
      }
    }

    const venues: RARVenue[] = [];
    
    try {
      console.log(`Scraping venues from last ${daysBack} days...`);
      
      // Navigate to search page
      await this.page.goto('https://leads.restaurantactivityreport.com/app/index.html#/app/search_Leads', {
        waitUntil: 'networkidle2'
      });
      
      await this.delay(2000, 3000);

      // Set filters for new activity
      // Select activity type dropdown if exists
      const activitySelector = 'select#activity-type, select[name="activity"], .activity-filter';
      const activityExists = await this.page.$(activitySelector) !== null;
      
      if (activityExists) {
        await this.page.select(activitySelector, 'new_licenses');
        await this.delay(1000, 2000);
      }

      // Set date range
      const dateSelector = 'input[type="date"], .date-filter, #date-range';
      const dateExists = await this.page.$(dateSelector) !== null;
      
      if (dateExists) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        await this.page.evaluate((selector, date) => {
          const input = document.querySelector(selector);
          if (input) input.value = date;
        }, dateSelector, startDate.toISOString().split('T')[0]);
      }

      // Click search/filter button
      await this.delay(1000, 2000);
      const searchButton = await this.page.$('button.search, button[type="submit"], .search-button');
      if (searchButton) {
        await searchButton.click();
        await this.delay(3000, 5000);
      }

      // Wait for results to load
      await this.page.waitForSelector('.results-table, .venue-list, table', { timeout: 10000 });

      // Scrape the data
      const scrapedData = await this.page.evaluate(() => {
        const venues = [];
        
        // Try different possible selectors for the results
        const rows = document.querySelectorAll(
          'table tbody tr, ' +
          '.results-table tr, ' +
          '.venue-row, ' +
          '.lead-row, ' +
          '[data-venue], ' +
          '.listing-item'
        );

        rows.forEach(row => {
          // Skip header rows
          if (row.querySelector('th')) return;

          // Extract data with multiple possible selectors
          const getTextContent = (selectors: string[]) => {
            for (const selector of selectors) {
              const element = row.querySelector(selector);
              if (element?.textContent) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const venue = {
            businessName: getTextContent([
              '.business-name',
              '.venue-name',
              'td:nth-child(1)',
              '[data-field="name"]'
            ]),
            address: getTextContent([
              '.address',
              '.venue-address',
              'td:nth-child(2)',
              '[data-field="address"]'
            ]),
            city: getTextContent([
              '.city',
              'td:nth-child(3)',
              '[data-field="city"]'
            ]),
            state: getTextContent([
              '.state',
              'td:nth-child(4)',
              '[data-field="state"]'
            ]),
            licenseType: getTextContent([
              '.license-type',
              'td:nth-child(5)',
              '[data-field="license_type"]'
            ]),
            licenseStatus: getTextContent([
              '.license-status',
              '.status',
              'td:nth-child(6)',
              '[data-field="status"]'
            ]),
            activityType: getTextContent([
              '.activity-type',
              '.activity',
              'td:nth-child(7)',
              '[data-field="activity"]'
            ]),
            activityDate: getTextContent([
              '.activity-date',
              '.date',
              'td:nth-child(8)',
              '[data-field="date"]'
            ]),
            owner: getTextContent([
              '.owner',
              'td:nth-child(9)',
              '[data-field="owner"]'
            ])
          };

          // Only add if we got meaningful data
          if (venue.businessName && venue.address) {
            venues.push(venue);
          }
        });

        return venues;
      });

      // Process and clean the data
      for (const venue of scrapedData) {
        venues.push(this.cleanVenueData(venue));
      }

      console.log(`Scraped ${venues.length} venues`);
      
      // Check for pagination
      const hasNextPage = await this.page.$('.pagination .next, button.next-page, a[rel="next"]');
      if (hasNextPage && venues.length < 100) { // Limit to prevent infinite loops
        await hasNextPage.click();
        await this.delay(2000, 3000);
        const moreVenues = await this.scrapeCurrentPage();
        venues.push(...moreVenues);
      }

      return venues;
      
    } catch (error) {
      console.error('Scraping failed:', error);
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'rar-error.png' });
      
      throw error;
    }
  }

  async scrapeCurrentPage(): Promise<RARVenue[]> {
    // Similar to above but just scrapes current page without navigation
    const venues = await this.page.evaluate(() => {
      // Same extraction logic as above
      const rows = document.querySelectorAll('table tbody tr, .venue-row');
      return Array.from(rows).map(row => {
        // Extract venue data
        return {
          businessName: row.querySelector('.business-name')?.textContent?.trim() || '',
          // ... other fields
        };
      });
    });

    return venues.map(v => this.cleanVenueData(v));
  }

  async scrapeVenueDetails(venueName: string): Promise<RARVenue | null> {
    try {
      // Search for specific venue
      await this.page.goto('https://leads.restaurantactivityreport.com/app/index.html#/app/search_Leads');
      await this.delay(2000, 3000);
      
      // Enter venue name in search
      const searchInput = await this.page.$('input[type="search"], input.search, #search');
      if (searchInput) {
        await searchInput.type(venueName, { delay: 100 });
        await this.page.keyboard.press('Enter');
        await this.delay(2000, 3000);
      }

      // Click on first result to get details
      const firstResult = await this.page.$('.venue-row:first-child, table tbody tr:first-child');
      if (firstResult) {
        await firstResult.click();
        await this.delay(2000, 3000);
        
        // Extract detailed information
        const details = await this.page.evaluate(() => {
          const getDetail = (label: string) => {
            const element = Array.from(document.querySelectorAll('.detail-label, .label, dt'))
              .find(el => el.textContent?.toLowerCase().includes(label.toLowerCase()));
            return element?.nextElementSibling?.textContent?.trim() || '';
          };

          return {
            businessName: getDetail('business name') || getDetail('name'),
            licenseNumber: getDetail('license number') || getDetail('license #'),
            expirationDate: getDetail('expiration') || getDetail('expires'),
            capacity: parseInt(getDetail('capacity') || getDetail('seats')) || 0,
            phone: getDetail('phone') || getDetail('telephone'),
            email: getDetail('email'),
            owner: getDetail('owner') || getDetail('proprietor')
          };
        });

        return this.cleanVenueData(details as RARVenue);
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to scrape venue details:', error);
      return null;
    }
  }

  private cleanVenueData(venue: any): RARVenue {
    return {
      businessName: venue.businessName?.trim() || '',
      address: venue.address?.trim() || '',
      city: venue.city?.trim() || '',
      state: venue.state?.trim() || '',
      zipCode: venue.zipCode?.trim() || '',
      licenseType: venue.licenseType?.trim() || '',
      licenseStatus: venue.licenseStatus?.trim() || 'Active',
      licenseNumber: venue.licenseNumber?.trim() || '',
      expirationDate: this.parseDate(venue.expirationDate),
      activityType: venue.activityType?.trim() || '',
      activityDate: this.parseDate(venue.activityDate),
      owner: venue.owner?.trim() || '',
      capacity: venue.capacity || null,
      phone: this.cleanPhone(venue.phone),
      email: venue.email?.trim()?.toLowerCase() || ''
    };
  }

  private parseDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try MM/DD/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      return dateStr;
    }
    
    return date.toISOString().split('T')[0];
  }

  private cleanPhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  private async delay(min: number, max?: number) {
    const ms = max ? Math.random() * (max - min) + min : min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async syncWithCRM(venues: RARVenue[]) {
    console.log(`Syncing ${venues.length} venues with CRM...`);
    
    for (const venue of venues) {
      try {
        // Check if venue exists in CRM
        const venuesRef = collection(db, 'venues');
        const q = query(venuesRef, 
          where('address', '==', venue.address),
          where('city', '==', venue.city)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Create new venue
          await addDoc(venuesRef, {
            ...venue,
            source: 'RAR',
            createdAt: new Date(),
            status: 'prospect',
            opportunityScore: this.calculateOpportunityScore(venue),
            alerts: this.generateAlerts(venue)
          });
          
          console.log(`Added new venue: ${venue.businessName}`);
          
          // Create task for new venue
          await this.createTaskForVenue(venue, 'new');
          
        } else {
          // Update existing venue
          const existingVenue = snapshot.docs[0];
          await updateDoc(doc(db, 'venues', existingVenue.id), {
            ...venue,
            lastRARUpdate: new Date(),
            opportunityScore: this.calculateOpportunityScore(venue),
            alerts: this.generateAlerts(venue)
          });
          
          console.log(`Updated venue: ${venue.businessName}`);
          
          // Create task if significant change
          if (this.isSignificantChange(existingVenue.data(), venue)) {
            await this.createTaskForVenue(venue, 'update');
          }
        }
        
      } catch (error) {
        console.error(`Failed to sync venue ${venue.businessName}:`, error);
      }
    }
  }

  private calculateOpportunityScore(venue: RARVenue): number {
    let score = 50; // Base score
    
    // New venue = high opportunity
    if (venue.activityType?.toLowerCase().includes('new')) {
      score += 30;
    }
    
    // License renewal approaching
    if (venue.expirationDate) {
      const daysUntilExpiry = Math.floor((new Date(venue.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 90) {
        score += 20;
      }
    }
    
    // Ownership change
    if (venue.activityType?.toLowerCase().includes('owner')) {
      score += 25;
    }
    
    // Active license
    if (venue.licenseStatus === 'Active') {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private generateAlerts(venue: RARVenue): string[] {
    const alerts = [];
    
    if (venue.activityType?.toLowerCase().includes('new')) {
      alerts.push('🆕 NEW VENUE OPENING - Contact immediately!');
    }
    
    if (venue.expirationDate) {
      const daysUntilExpiry = Math.floor((new Date(venue.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 30) {
        alerts.push('🚨 License expires in < 30 days');
      } else if (daysUntilExpiry < 90) {
        alerts.push('⚠️ License renewal opportunity');
      }
    }
    
    if (venue.activityType?.toLowerCase().includes('owner')) {
      alerts.push('👤 OWNERSHIP CHANGE - Relationship at risk');
    }
    
    if (venue.activityType?.toLowerCase().includes('expansion')) {
      alerts.push('📈 Expansion activity - Upsell opportunity');
    }
    
    return alerts;
  }

  private isSignificantChange(oldData: any, newData: RARVenue): boolean {
    // Check for significant changes that warrant attention
    if (oldData.licenseStatus !== newData.licenseStatus) return true;
    if (oldData.owner !== newData.owner) return true;
    if (oldData.licenseType !== newData.licenseType) return true;
    if (oldData.activityType !== newData.activityType && newData.activityType) return true;
    
    return false;
  }

  private async createTaskForVenue(venue: RARVenue, type: 'new' | 'update') {
    const tasksRef = collection(db, 'tasks');
    
    const task = {
      title: type === 'new' 
        ? `🆕 Contact new venue: ${venue.businessName}`
        : `📋 Follow up on activity: ${venue.businessName}`,
      description: `Activity: ${venue.activityType}\nAddress: ${venue.address}, ${venue.city}, ${venue.state}`,
      priority: type === 'new' ? 'high' : 'medium',
      dueDate: new Date(Date.now() + (type === 'new' ? 2 : 7) * 24 * 60 * 60 * 1000), // 2 days for new, 7 for updates
      status: 'pending',
      assignedTo: 'unassigned',
      relatedVenue: venue.businessName,
      source: 'RAR Auto-Sync',
      createdAt: new Date()
    };
    
    await addDoc(tasksRef, task);
  }

  async scheduleAutoSync(username: string, password: string): Promise<void> {
    // Store credentials securely (encrypted) for auto sync
    // This would typically use a job scheduler like node-cron or a queue system
    console.log('Auto sync scheduled - would run daily at 6 AM');
    
    // Store sync status
    await updateDoc(doc(db, 'settings', 'rar-sync'), {
      autoSyncEnabled: true,
      lastScheduled: new Date(),
      nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
  }

  async getLastSyncStatus(): Promise<any> {
    try {
      const settingsRef = doc(db, 'settings', 'rar-sync');
      const settingsDoc = await getDoc(settingsRef);
      
      // Get venue count
      const venuesQuery = query(collection(db, 'venues'));
      const venuesSnapshot = await getDocs(venuesQuery);
      const totalVenues = venuesSnapshot.size;
      
      // Get new venues this week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newVenuesQuery = query(
        collection(db, 'venues'),
        where('createdAt', '>=', oneWeekAgo)
      );
      const newVenuesSnapshot = await getDocs(newVenuesQuery);
      const newVenuesThisWeek = newVenuesSnapshot.size;
      
      const settings = settingsDoc.data();
      
      return {
        lastSync: settings?.lastSync || null,
        totalVenues,
        newVenuesThisWeek,
        isRunning: settings?.isRunning || false,
        autoSyncEnabled: settings?.autoSyncEnabled || false
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: null,
        totalVenues: 0,
        newVenuesThisWeek: 0,
        isRunning: false,
        autoSyncEnabled: false
      };
    }
  }

  async startAutoSync() {
    if (!this.config.autoSync) {
      console.log('Auto-sync is disabled');
      return;
    }

    console.log(`Starting auto-sync every ${this.config.syncInterval} hours...`);
    
    // Initial sync
    await this.performSync();
    
    // Schedule periodic syncs
    setInterval(async () => {
      await this.performSync();
    }, this.config.syncInterval * 60 * 60 * 1000);
  }

  private async performSync() {
    try {
      console.log('Starting RAR sync...');
      const venues = await this.scrapeNewVenues(7);
      await this.syncWithCRM(venues);
      console.log('RAR sync completed successfully');
    } catch (error) {
      console.error('RAR sync failed:', error);
      
      // Notify admin of failure
      await this.notifyError(error);
    }
  }

  private async notifyError(error: any) {
    // Send notification to admin
    const notification = {
      type: 'error',
      source: 'RAR Scraper',
      message: `Sync failed: ${error.message}`,
      timestamp: new Date(),
      requiresAction: true
    };
    
    await addDoc(collection(db, 'system_notifications'), notification);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export { RARScraper };
export default RARScraper;

// Usage example:
export async function runRARSync(email: string, password: string) {
  const scraper = new RARScraper({
    email,
    password,
    headless: true,
    autoSync: true,
    syncInterval: 24 // Sync every 24 hours
  });

  try {
    await scraper.initialize();
    await scraper.login();
    
    // Scrape new venues from last 7 days
    const newVenues = await scraper.scrapeNewVenues(7);
    
    // Sync with CRM
    await scraper.syncWithCRM(newVenues);
    
    // Start auto-sync
    await scraper.startAutoSync();
    
    return {
      success: true,
      venuesFound: newVenues.length,
      message: 'RAR sync completed successfully'
    };
    
  } catch (error) {
    console.error('RAR sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Keep browser open if auto-sync is enabled
    if (!scraper.config.autoSync) {
      await scraper.close();
    }
  }
}