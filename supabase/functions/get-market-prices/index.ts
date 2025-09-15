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

    const response = await fetch('https://ramropatro.com/vegetable');
    const html = await response.text();

    // Extract prices from HTML table
    const marketPrices = extractPricesFromHTML(html);
    
    const marketData = {
      prices: marketPrices.slice(0, 8), // Show top 8 items
      lastUpdated: new Date().toISOString(),
      source: 'Ramro Patro - Kalimati Market'
    };

    console.log(`Market data scraped successfully - ${marketPrices.length} items found`);

    return new Response(JSON.stringify(marketData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-market-prices function:', error);
    
    // Fallback data
    const fallbackPrices = [
      { crop: 'Tomato (Big)', price: 'Rs. 55/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Potato (Red)', price: 'Rs. 52/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Onion (Dry)', price: 'Rs. 39/kg', unit: 'kg', change: 'N/A' },
      { crop: 'Carrot (Local)', price: 'Rs. 110/kg', unit: 'kg', change: 'N/A' },
    ];
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
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
    // Split by lines and find table rows
    const lines = html.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip header and empty rows
      if (trimmed.includes('Commodity') || trimmed.includes('---') || !trimmed.includes('|') || trimmed.length < 10) {
        continue;
      }
      
      // Parse table row: | Commodity | Unit | Min | Max | Avg |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const columns = trimmed.split('|').map(col => col.trim()).filter(col => col);
        
        if (columns.length >= 5) {
          const [commodity, unit, min, max, avg] = columns;
          
          if (commodity && unit && avg && !isNaN(parseInt(avg))) {
            prices.push({
              crop: commodity,
              price: `Rs. ${avg}/${unit.toLowerCase()}`,
              unit: unit.toLowerCase(),
              change: calculateChange(parseInt(min), parseInt(max), parseInt(avg))
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return prices;
}

function calculateChange(min: number, max: number, avg: number): string {
  const midPoint = (min + max) / 2;
  const diff = ((avg - midPoint) / midPoint) * 100;
  
  if (Math.abs(diff) < 1) return '0%';
  return diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
}