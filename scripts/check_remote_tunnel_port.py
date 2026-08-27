import paramiko

host = "31.76.102.23"
user = "root"
password = "Ipyw=Agy7C9)EwW6"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

def run(cmd):
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("[ERR]", err)

run("ss -tlpn | grep 11434")
run("curl -s http://127.0.0.1:11434/api/tags | head -c 300")
run("docker exec artefactory-caddy curl -s http://172.17.0.1:11434/api/tags | head -c 300 || true")
run("docker exec artefactory-caddy ip route | grep default || true")

client.close()
