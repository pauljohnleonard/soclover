const localserver = true;

// const 34.250.162.78
export const environment = {
  production: false,
  WSS_URL: localserver
    ? 'ws://localhost:3055'
    : 'wss://soclover-server.drpjl.com/soclover',
  API_URL: localserver
    ? 'http://localhost:3055'
    : 'https://soclover-server.drpjl.com/soclover',
};
