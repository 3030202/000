#!/usr/bin/env python3
import socket
import select
import threading
import time
import os
import json
import paramiko

REMOTE_HOST = "31.76.102.23"
REMOTE_USER = "root"
REMOTE_PASSWORD = "Ipyw=Agy7C9)EwW6"
REMOTE_PORT = 11434
LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = 11434

STATUS_FILE = "/home/mx/000/public/ollama_tunnel.json"
os.makedirs("/home/mx/000/public", exist_ok=True)

def forward_tunnel(local_port, local_host, remote_channel):
    sock = socket.socket()
    try:
        sock.connect((local_host, local_port))
    except Exception as e:
        print(f"[TUNNEL] Forwarding request to {local_host}:{local_port} failed: {e}")
        remote_channel.close()
        return

    while True:
        r, w, x = select.select([sock, remote_channel], [], [])
        if sock in r:
            data = sock.recv(1024 * 64)
            if len(data) == 0:
                break
            remote_channel.send(data)
        if remote_channel in r:
            data = remote_channel.recv(1024 * 64)
            if len(data) == 0:
                break
            sock.send(data)
    remote_channel.close()
    sock.close()

def reverse_forward_handler(chan, origin, server):
    t = threading.Thread(target=forward_tunnel, args=(LOCAL_PORT, LOCAL_HOST, chan))
    t.daemon = True
    t.start()

def main():
    print(f"============================================================")
    print(f"🚀 OLLAMA SECURE REVERSE TUNNEL -> 03.0X101.LOL")
    print(f"Local Ollama: http://{LOCAL_HOST}:{LOCAL_PORT}")
    print(f"Public HTTPS Endpoint: https://03.0x101.lol/ollama/v1")
    print(f"Default Model: qwen-coder-32b-abliterated")
    print(f"============================================================")

    while True:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            print(f"[TUNNEL] Connecting to remote VPS {REMOTE_HOST}...")
            client.connect(REMOTE_HOST, username=REMOTE_USER, password=REMOTE_PASSWORD, timeout=15)
            
            transport = client.get_transport()
            transport.set_keepalive(15)
            transport.request_port_forward("0.0.0.0", REMOTE_PORT, reverse_forward_handler)
            print(f"[TUNNEL] ✅ Port {REMOTE_PORT} successfully forwarded from {REMOTE_HOST} -> {LOCAL_HOST}:{LOCAL_PORT}!")
            
            # Save status JSON
            status_data = {
                "active": True,
                "tunnelType": "SSH_REVERSE_CADDY_TUNNEL",
                "tunnelUrl": "https://03.0x101.lol/ollama/v1",
                "openAiEndpoint": "https://03.0x101.lol/ollama/v1",
                "defaultModel": "qwen-coder-32b-abliterated",
                "connectedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "target": f"http://{LOCAL_HOST}:{LOCAL_PORT}"
            }
            with open(STATUS_FILE, "w") as sf:
                json.dump(status_data, sf, indent=2)

            while transport.is_active():
                time.sleep(2)

        except Exception as err:
            print(f"[TUNNEL] Connection dropped or failed: {err}. Reconnecting in 3s...")
            time.sleep(3)
        finally:
            try:
                client.close()
            except:
                pass

if __name__ == "__main__":
    main()
