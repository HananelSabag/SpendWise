import axios from 'axios';

const API_URL = 'https://api.frankfurter.app/latest';

export const fetchExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    console.log(`Fetching ${fromCurrency}->${toCurrency} rate...`);
    const response = await axios.get(API_URL, {
      params: {
        base: fromCurrency,
        symbols: toCurrency
      }
    });

    if (!response.data || !response.data.rates || !response.data.rates[toCurrency]) {
      console.error('Invalid response:', response.data);
      throw new Error('No rate in response');
    }

    return response.data.rates[toCurrency];
  } catch (error) {
    console.error(`Exchange rate fetch failed: ${error.message}`);
    throw error;
  }
};
