// src/infrastructure/api/axios.ts
import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://tobarato-api.alirizvi.dev/api/',
    headers: { 'Content-Type': 'application/json' },
});
