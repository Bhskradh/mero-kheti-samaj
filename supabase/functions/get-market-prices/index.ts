import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Scraping market prices from ramropatro.com');

    const fetchWithRetry = async (url: string, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.text();
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error('Failed after retries');
    };

    const html = await fetchWithRetry('https://ramropatro.com/vegetable');

    // Extract prices from HTML table
    const marketPrices = extractPricesFromHTML(html);
    
    if (marketPrices.length === 0) {
      throw new Error('No valid market prices found');
    }

    const marketData = {
      prices: marketPrices.slice(0, 15), // Show top 15 items
      lastUpdated: new Date().toISOString(),
      source: 'Ramro Patro - Kalimati Market',
      total: marketPrices.length,
      success: true
    };

    console.log(`Market data scraped successfully - ${marketPrices.length} items found`);

    return new Response(JSON.stringify(marketData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in get-market-prices function:', errorMessage);
    
    // Fallback data
    const fallbackPrices = [
      { crop: 'Tomato (Big)', price: 'Rs. 55/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Potato (Red)', price: 'Rs. 52/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Onion (Dry)', price: 'Rs. 39/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Carrot (Local)', price: 'Rs. 110/kg', unit: 'kg', change: 'N/A' },
    ];
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        prices: fallbackPrices,
        lastUpdated: new Date().toISOString(),
        source: 'Fallback data'
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractPricesFromHTML(html: string) {
  const prices = [];
  
  try {
    // Find price entries in the format: | Commodity | Unit | Min | Max | Avg |
    const priceRegex = /\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/g;
    let match;
    
    // List of items to exclude (non-vegetables/fruits)
    const excludeItems = [
      'fish', 'download', 'get it on', 'app store', 
      'google play', 'ramro patro', 'contact us', 'features',
      'festivals', 'calendar'
    ];

    // List of valid units
    const validUnits = ['kg', 'doz', '1 pc'];
    
    while ((match = priceRegex.exec(html)) !== null) {
      const [, commodity, unit, min, max, avg] = match;
      const commodityLower = commodity.trim().toLowerCase();
      const unitLower = unit.trim().toLowerCase();
      
      // Skip empty entries, non-vegetable content, and ensure proper formatting
      if (commodity && 
          commodityLower && 
          unit &&
          validUnits.includes(unitLower) &&
          !excludeItems.some(item => commodityLower.includes(item)) &&
          !commodityLower.match(/^\s*$/) && // Skip blank lines
          !commodityLower.match(/^[0-9]+$/) && // Skip numeric-only entries
          unit.trim().length > 0 && // Ensure unit is not empty
          // Validate price ranges
          parseInt(min) > 0 && 
          parseInt(max) >= parseInt(min) &&
          parseInt(avg) >= parseInt(min) &&
          parseInt(avg) <= parseInt(max)
      ) {
        const minPrice = parseInt(min);
        const maxPrice = parseInt(max);
        const avgPrice = parseInt(avg);
        
        if (!isNaN(avgPrice) && avgPrice > 0) {
          prices.push({
            crop: commodity.trim(),
            price: `Rs. ${avgPrice}/${unit.trim().toLowerCase()}`,
            unit: unit.trim().toLowerCase(),
            change: calculateChange(minPrice, maxPrice, avgPrice)
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  // Sort prices by crop name for consistency
  return prices
    .sort((a, b) => a.crop.localeCompare(b.crop))
    .slice(0, 15); // Limit to top 15 items
}

function calculateChange(min: number, max: number, avg: number): string {
  const midPoint = (min + max) / 2;
  const diff = ((avg - midPoint) / midPoint) * 100;
  
  if (Math.abs(diff) < 1) return '0%';
  return diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
}