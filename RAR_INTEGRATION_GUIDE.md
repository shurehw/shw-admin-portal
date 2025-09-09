# Restaurant Activity Report (RAR) Integration Guide

## Overview
The Restaurant Activity Report (RAR) integration provides real-time intelligence on restaurant openings, closures, ownership changes, and other business signals that indicate purchasing opportunities.

## How to Use RAR Integration

### 1. From the Discovery Page
1. Navigate to **CRM > Smart Leads > Discover New Leads**
2. Configure your search criteria (location, categories, etc.)
3. **Check the "Include RAR Data" checkbox** at the bottom of the Business Signals section
4. Click "Discover Leads"

### 2. Current RAR Data Access Methods

#### Option A: Direct API (Preferred)
- **Status**: Ready when API key is provided
- **Setup**: Add `RAR_API_KEY=your_key_here` to `.env.local`
- **Get Access**: Contact Restaurant Activity Report for API access
- **Website**: https://restaurantactivityreport.com (hypothetical)

#### Option B: Web Scraping (Alternative)
- **Status**: Available with scraping service
- **Setup**: 
  1. Set `SCRAPING_ENABLED=true` in `.env.local`
  2. Set `SCRAPER_SERVICE_URL=your_scraper_url` (e.g., using Browserless or Puppeteer service)
- **Note**: Requires compliance with RAR's terms of service

#### Option C: Mock Data (Development/Demo)
- **Status**: Currently Active (Default)
- **Description**: Generates realistic RAR-style signals for testing
- **Note**: This is what you're using now until real API access is configured

## Types of RAR Signals

### Pre-Opening Signals
- New business licenses filed
- Construction permits approved
- "Coming Soon" signage reported
- Hiring activity on job boards

### Ownership Changes
- Business sale records
- New LLC registrations
- Management team changes
- Rebranding announcements

### Renovation/Expansion
- Building permits for kitchen upgrades
- Dining room expansion permits
- Equipment installation permits
- Menu redesign indicators

### Other Valuable Signals
- Liquor license applications
- Health inspection schedules
- Franchise opportunities
- Closure notices (competitor intelligence)

## AI Enhancement Features

### Intelligent Lead Scoring
The system uses AI to analyze RAR signals and assign scores based on:
- **Urgency**: How soon the opportunity needs to be acted upon
- **Value**: Estimated deal size based on business type and signals
- **Fit**: How well the lead matches your ideal customer profile
- **Competition**: Whether competitors are likely targeting this lead

### Pattern Recognition
AI identifies patterns like:
- Businesses that typically order within 30 days of opening
- Ownership changes that lead to vendor switches
- Seasonal patterns in the hospitality industry

## Setting Up Real RAR Access

### Step 1: Get RAR Credentials
1. Visit Restaurant Activity Report website
2. Sign up for a business account
3. Choose API access plan
4. Obtain your API key

### Step 2: Configure Environment
```bash
# In .env.local
RAR_API_KEY=your_rar_api_key_here
OPENAI_API_KEY=your_openai_key_here  # For AI enhancement
```

### Step 3: Test Integration
```bash
# Test RAR connection
curl http://localhost:3000/api/crm/leads/rar-integration?location=Los+Angeles,CA
```

## AI-Powered Features (With OpenAI Key)

### Smart Lead Enrichment
- Automatically researches businesses online
- Finds contact information
- Estimates business size and revenue
- Identifies decision makers

### Predictive Scoring
- Predicts conversion probability
- Estimates time to close
- Suggests optimal outreach timing
- Recommends best sales rep match

### Natural Language Insights
- Generate personalized outreach messages
- Summarize business intelligence
- Identify talking points for sales calls
- Highlight competitive advantages

## Current Status
✅ **RAR Integration**: Functional with mock data
✅ **AI Discovery**: Ready with OpenAI API key
⏳ **Real RAR API**: Awaiting credentials
⏳ **Web Scraping**: Available if needed

## Next Steps
1. Obtain RAR API credentials for live data
2. Add OpenAI API key for AI enhancement
3. Configure webhooks for real-time alerts
4. Set up automated lead assignment rules

## Support
For RAR API access: contact sales@restaurantactivityreport.com
For integration help: Check admin dashboard logs
For AI features: Ensure OpenAI API key is configured