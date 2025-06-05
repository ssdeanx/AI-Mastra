import axios from 'axios';
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';


// Fetch the latest crypto data from CoinMarketCap
// TODO: This is a temporary solution, this is example code from CoinMarketCap https://coinmarketcap.com/api/documentation/v1/#section/Endpoint-Overview
let response = null;
new Promise(async (resolve, reject) => {
    try {
        response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
            },
        });
    } catch (ex) {
        response = null;
        reject(ex);
    }
    if (response) {
        const json = response.data;
        resolve(json);
    }
});
