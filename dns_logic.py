import socket
from urllib.parse import urlparse

# Perform a real DNS lookup
def resolve_domain(domain):
    try:
        # If the user enters a full URL, extract only the hostname
        if "://" not in domain:
            domain = "https://" + domain

        hostname = urlparse(domain).hostname

        ip = socket.gethostbyname(hostname)

        return {
            "success": True,
            "domain": hostname,
            "ip": ip
        }

    except (socket.gaierror, TypeError):
        return {
            "success": False,
            "domain": domain,
            "ip": None
        }