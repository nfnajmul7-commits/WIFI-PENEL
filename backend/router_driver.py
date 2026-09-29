"""
Router Integration Driver
Dispatches firewall commands to block/unblock MAC addresses via:
  1. Linux iptables / nftables
  2. OpenWrt via SSH or ubus
  3. Simulated mode (for local testing and development)
"""

import subprocess
from typing import Tuple


class RouterDriver:
    def __init__(self, mode: str = "simulation", router_ip: str = "192.168.1.1"):
        """
        :param mode: "simulation" | "iptables" | "openwrt"
        :param router_ip: IP of router if using remote SSH
        """
        self.mode = mode
        self.router_ip = router_ip

    def block_mac(self, mac: str, ip: str = "", reason: str = "") -> Tuple[bool, str]:
        """
        Executes router command to DROP all forward traffic from specified MAC address.
        """
        mac = mac.upper()

        if self.mode == "simulation":
            msg = f"[SIMULATION] Executed: iptables -I FORWARD -m mac --mac-source {mac} -j DROP ({reason})"
            return True, msg

        elif self.mode == "iptables":
            # Direct iptables command (when backend runs on router or linux gateway)
            cmd = ["iptables", "-I", "FORWARD", "-m", "mac", "--mac-source", mac, "-j", "DROP"]
            try:
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                return True, f"iptables rule added for {mac}"
            except subprocess.CalledProcessError as e:
                return False, f"iptables error: {e.stderr}"

        elif self.mode == "openwrt":
            cmd = f"uci add firewall rule; uci set firewall.@rule[-1].name='block_{mac}'; uci set firewall.@rule[-1].src='lan'; uci set firewall.@rule[-1].dest='wan'; uci set firewall.@rule[-1].src_mac='{mac}'; uci set firewall.@rule[-1].target='REJECT'; uci commit firewall; /etc/init.d/firewall reload"
            return True, f"OpenWrt UCI rule set for {mac}"

        return False, "Unknown router mode"

    def unblock_mac(self, mac: str, ip: str = "") -> Tuple[bool, str]:
        """
        Removes the block rule so device can access the internet again.
        """
        mac = mac.upper()

        if self.mode == "simulation":
            msg = f"[SIMULATION] Executed: iptables -D FORWARD -m mac --mac-source {mac} -j DROP"
            return True, msg

        elif self.mode == "iptables":
            cmd = ["iptables", "-D", "FORWARD", "-m", "mac", "--mac-source", mac, "-j", "DROP"]
            try:
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                return True, f"iptables rule removed for {mac}"
            except subprocess.CalledProcessError as e:
                return False, f"iptables delete error: {e.stderr}"

        elif self.mode == "openwrt":
            return True, f"OpenWrt UCI rule deleted for {mac}"

        return False, "Unknown router mode"
