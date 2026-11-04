/** Browser-only Keycloak stand-in for deterministic failure/recovery cases. */
export default class MockKeycloak {
  authenticated = true;
  token: string | undefined = 'initial-browser-token';
  onTokenExpired: (() => void) | undefined;
  nextToken: string | undefined;
  failNext = false;
  refreshCalls = 0;

  constructor() {
    (
      window as Window & { __mockKeycloak?: MockKeycloak }
    ).__mockKeycloak = this;
  }

  async init(): Promise<boolean> {
    return true;
  }

  async updateToken(_minValidity: number): Promise<boolean> {
    this.refreshCalls += 1;
    if (this.failNext) {
      this.failNext = false;
      throw new Error('simulated isolated refresh failure');
    }

    if (this.nextToken) {
      this.token = this.nextToken;
      this.nextToken = undefined;
      return true;
    }

    return false;
  }

  async login(): Promise<void> {}

  async logout(): Promise<void> {
    this.authenticated = false;
    this.token = undefined;
  }
}
