/** Same-origin ThinkCentre / production hosting (API + WS + static on one host). */
function hostBase(): { api: string; ws: string } {
  if (typeof window === 'undefined' || !window.location?.host) {
    return {
      api: 'http://192.168.1.66:3055',
      ws: 'ws://192.168.1.66:3055',
    };
  }
  const { protocol, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return {
    api: `${protocol}//${host}`,
    ws: `${wsProto}//${host}`,
  };
}

export const environment = {
  production: true,
  get WSS_URL() {
    return hostBase().ws;
  },
  get API_URL() {
    return hostBase().api;
  },
};
