const localserver = true;

// const 34.250.162.78
export const environment = {
  production: false,
  SERVER_URL: localserver
    ? 'ws://localhost:3005'
    : 'wss://server.drpjl.com/soclover',
};
