import paramiko
import time

host = "31.76.102.23"
user = "root"
password = "Ipyw=Agy7C9)EwW6"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

def run(cmd):
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print("[ERR]", err)
    return out

# 1. Enable GatewayPorts on VPS sshd
run("echo 'GatewayPorts yes' > /etc/ssh/sshd_config.d/99-gateway-ports.conf")
run("systemctl reload sshd")

# 2. Get Docker bridge gateway IP for artefactory_default network
gateway_ip = run("docker inspect artefactory-caddy -f '{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}'").strip()
print(f"Docker Gateway IP: {gateway_ip}")

# 3. Update Caddyfile with exact Docker Gateway IP
caddy_content = f"""{{
    auto_https disable_redirects
}}

# 000-Mission-Control (Subdomain 03)
http://03.0x101.lol {{
    handle /ollama/* {{
        uri strip_prefix /ollama
        reverse_proxy {gateway_ip}:11434 {{
            flush_interval -1
            header_up Host {{upstream_hostport}}
        }}
    }}
    reverse_proxy 000_standalone_app:80
}}

https://03.0x101.lol {{
    tls internal
    handle /ollama/* {{
        uri strip_prefix /ollama
        reverse_proxy {gateway_ip}:11434 {{
            flush_interval -1
            header_up Host {{upstream_hostport}}
        }}
    }}
    reverse_proxy 000_standalone_app:80
}}

# Artefactory Control Tower (Subdomain 00, 8, Apex)
http://00.0x101.lol, http://0x101.lol, http://8.0x101.lol, http://www.0x101.lol, :80 {{
    reverse_proxy control-tower:4000
}}

https://00.0x101.lol, https://0x101.lol, https://8.0x101.lol, https://www.0x101.lol, https://31.76.102.23.nip.io {{
    tls internal
    reverse_proxy control-tower:4000
}}
"""

run("cat > /tmp/NewCaddyfile << 'EOF'\n" + caddy_content + "\nEOF")
run("cp /tmp/NewCaddyfile /opt/artefactory/Caddyfile")
run("docker restart artefactory-caddy")
time.sleep(2)

client.close()
print("Remote configuration finished!")
