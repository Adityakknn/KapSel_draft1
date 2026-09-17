import type { WASocket } from "@whiskeysockets/baileys";

let currentSock: WASocket | null = null;

/** Set setiap kali socket Baileys (re)connect, supaya modul lain (mis. server internal) selalu pakai koneksi yang aktif. */
export function setActiveSocket(sock: WASocket | null): void {
  currentSock = sock;
}

export function getActiveSocket(): WASocket | null {
  return currentSock;
}
