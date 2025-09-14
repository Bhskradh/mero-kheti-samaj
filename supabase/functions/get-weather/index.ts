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
    const { city = 'Kathmandu' } = await req.json().catch(() => ({ city: 'Kathmandu' }));
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');

    if (!apiKey) {
      throw new Error('Weather API key not configured');
    }

    console.log(`Fetching weather data for ${city}`);

    // Get current weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},NP&appid=${apiKey}&units=metric`;
    const currentResponse = await fetch(currentWeatherUrl);
    
    if (!currentResponse.ok) {
      throw new Error(`Weather API error: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();

    // Get 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},NP&appid=${apiKey}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();

    // Process the data
    const weatherData = {
      location: `${currentData.name}, Nepal`,
      temperature: Math.round(currentData.main.temp),
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      forecast: generateFarmingForecast(currentData, forecastData),
      lastUpdated: new Date().toISOString()
    };

    console.log('Weather data processed successfully');

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        location: 'Kathmandu, Nepal',
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        condition: 'Unknown',
        description: 'Weather data unavailable',
        forecast: 'Unable to fetch weather forecast'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateFarmingForecast(current: any, forecast: any): string {
  const temp = current.main.temp;
  const humidity = current.main.humidity;
  const condition = current.weather[0].main.toLowerCase();
  
  // Check upcoming rain in next 24 hours
  const nextDayForecast = forecast.list.slice(0, 8); // Next 24 hours (3-hour intervals)
  const willRain = nextDayForecast.some((item: any) => 
    item.weather[0].main.toLowerCase().includes('rain')
  );

  let farmingAdvice = '';

  if (willRain) {
    farmingAdvice = 'Rain expected - postpone irrigation and field work';
  } else if (condition.includes('rain')) {
    farmingAdvice = 'Good for transplanting rice and watering crops';
  } else if (temp > 30) {
    farmingAdvice = 'Hot weather - increase irrigation, work early morning';
  } else if (temp < 15) {
    farmingAdvice = 'Cool weather - protect sensitive crops, reduce watering';
  } else if (humidity > 80) {
    farmingAdvice = 'High humidity - watch for fungal diseases';
  } else {
    farmingAdvice = 'Good weather for most farming activities';
  }

  return farmingAdvice;
}