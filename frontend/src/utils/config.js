const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'); export const API_BASE = isProduction ? '' : '/api'; 
