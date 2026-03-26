import log from "loglevel";

export class PvwsClient {
  private socket: WebSocket;
  private url: string;

  public constructor(
    url: string,
    handleConnection: (event: Event) => void,
    handleMessage: (event: MessageEvent) => void,
    handleClose: (event: CloseEvent) => void,
  ) {
    this.url = url;
    this.socket = new WebSocket(url);
    this.socket.onopen = handleConnection;
    this.socket.onmessage = handleMessage;
    this.socket.onclose = handleClose;
    this.socket.onerror = this.handleError;
  }

  public connectionState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  public sendMessage(message: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Socket is set up, we can send message
      this.socket?.send(message);
    } else if (this.socket?.readyState !== WebSocket.OPEN) {
      // Socket is not set up, wait until open to send message
      this.socket?.addEventListener("open", _ev => {
        this.socket?.send(message);
      });
    }
  }

  public close(code?: number, reason?: string) {
    this.socket?.close(code, reason);
  }

  public getUrl(): string {
    return this.url;
  }

  handleError = (event: Event) => {
    console.log("handleError");
    console.log(event);

    log.error("Error from " + this.getUrl());
    this.close();
  };
}
