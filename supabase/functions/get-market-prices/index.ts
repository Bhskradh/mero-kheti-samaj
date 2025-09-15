import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Scraping market prices from nepalicalendar.rat32.com');

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

    const html = await fetchWithRetry('https://nepalicalendar.rat32.com/vegetable/embed.php');

    // Extract prices from HTML table
    const marketPrices = extractPricesFromHTML(html);
    
    if (marketPrices.length === 0) {
      throw new Error('No valid market prices found');
    }

    const marketData = {
      prices: marketPrices.slice(0, 15), // Show top 15 items
      lastUpdated: new Date().toISOString(),
      source: 'Nepali Calendar - Kalimati Market',
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
    // Find table rows with commodity and prices
    const priceRegex = /\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/g;
    let match;
    
    // List of items to exclude (non-vegetables/fruits)
    const excludeItems = [
      'fish', 'expensive', 'empty', 'blank', 'price',
      'daily prices', 'kalimati', 'market', 'rate'
    ];

    // Process HTML to clean up some common issues
    html = html.replace(/\r\n/g, '\n')  // Normalize line endings
             .replace(/\n+/g, '\n')     // Remove multiple line breaks
             .replace(/\|{2,}/g, '|');   // Remove multiple pipes
    
    console.log('Starting to extract prices from HTML');
    
    while ((match = priceRegex.exec(html)) !== null) {
      const [fullMatch, commodity, unit, min, max, avg] = match;
      const commodityLower = commodity.trim().toLowerCase();
      const unitLower = unit.trim().toLowerCase();
      
      // Debug logging
      console.log('Found match:', { commodity: commodity.trim(), unit: unitLower, min, max, avg });
      
      // Skip empty entries, non-vegetable content, and ensure proper formatting
      if (commodity && 
          commodityLower && 
          unit &&
          // Basic validation for commodity name
          commodityLower.length >= 2 &&
          !excludeItems.some(item => commodityLower.includes(item)) &&
          !commodityLower.match(/^\s*$/) && // Skip blank lines
          !commodityLower.match(/^[0-9]+$/) && // Skip numeric-only entries
          // Basic unit validation
          unitLower.length > 0 && 
          (unitLower === 'kg' || unitLower === 'doz' || unitLower === 'pc' || unitLower.includes('kg')) &&
          // Price validation
          parseInt(min) > 0 && 
          parseInt(max) > 0 &&
          parseInt(avg) > 0 &&
          parseInt(max) >= parseInt(min) &&
          parseInt(avg) >= parseInt(min) &&
          parseInt(avg) <= parseInt(max)
      ) {
        const minPrice = parseInt(min);
        const maxPrice = parseInt(max);
        const avgPrice = parseInt(avg);
        
        if (!isNaN(avgPrice) && avgPrice > 0) {
          const priceEntry = {
            crop: commodity.trim(),
            price: `Rs. ${avgPrice}/${unit.trim().toLowerCase()}`,
            unit: unit.trim().toLowerCase(),
            change: calculateChange(minPrice, maxPrice, avgPrice)
          };
          
          console.log('Adding price entry:', priceEntry);
          prices.push(priceEntry);
        } else {
          console.log('Skipping invalid price:', { commodity, unit, min, max, avg });
        }
      } else {
        console.log('Skipping entry due to validation:', { 
          commodity, 
          unit, 
          min, 
          max, 
          avg,
          reason: !commodity ? 'empty commodity' :
                 !unit ? 'empty unit' :
                 commodityLower.length < 2 ? 'commodity too short' :
                 parseInt(min) <= 0 ? 'invalid min price' :
                 parseInt(max) <= 0 ? 'invalid max price' :
                 parseInt(avg) <= 0 ? 'invalid avg price' :
                 'failed validation rules'
        });
      }
    }
    
    console.log(`Found ${prices.length} valid prices before sorting`);
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  // Sort prices by crop name for consistency
  const sortedPrices = prices
    .sort((a, b) => a.crop.localeCompare(b.crop))
    .slice(0, 15); // Limit to top 15 items
    
  console.log(`Returning ${sortedPrices.length} prices after sorting and limiting`);
  return sortedPrices;
}

function calculateChange(min: number, max: number, avg: number): string {
  const midPoint = (min + max) / 2;
  const diff = ((avg - midPoint) / midPoint) * 100;
  
  if (Math.abs(diff) < 1) return '0%';
  return diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
}