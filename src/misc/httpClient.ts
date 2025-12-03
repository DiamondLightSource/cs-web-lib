export class CsWebLibHttpResponseError extends Error {
  private _responseCode: number;

  constructor(message: string, httpResponseCode: number) {
    super(message);
    this.name = "CsWebLibHttpError";
    this._responseCode = httpResponseCode;
  }

  get responseCode(): number {
    return this._responseCode;
  }
}

export const httpRequest = async (
  url: string,
  init?: RequestInit
): Promise<Response> => {
  const response = init ? await fetch(url, init) : await fetch(url);

  if (response?.status >= 400) {
    const message = `HTTP GET failed for url: ${url}.\nResponse code ${response?.status}\nResponse message ${response?.statusText}\n `;
    throw new CsWebLibHttpResponseError(message, response.status);
  }

  return response;
};
