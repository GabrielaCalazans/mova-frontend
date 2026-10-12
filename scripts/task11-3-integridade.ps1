# Task 11.3 (ponto A) — nível de integridade e flag UIAccess dos processos, só leitura.
# Explica por que teclas injetadas (keybd_event/SendInput) não chegam à Lista de Elementos do NVDA:
# o UIPI do Windows só deixa injetar entrada em janelas de integridade igual ou menor.
# Uso: powershell -File scripts/task11-3-integridade.ps1 [-Nomes nvda,powershell,node,chrome,firefox]
param([string[]]$Nomes = @("nvda", "nvda_uiAccess", "nvda_noUIAccess", "nvdaHelperRemoteLoader", "powershell", "node", "chrome", "firefox"))

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class MovaToken {
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  [DllImport("advapi32.dll", SetLastError = true)] static extern bool OpenProcessToken(IntPtr p, uint access, out IntPtr token);
  [DllImport("advapi32.dll", SetLastError = true)] static extern bool GetTokenInformation(IntPtr t, int cls, IntPtr info, int len, out int ret);
  [DllImport("advapi32.dll")] static extern IntPtr GetSidSubAuthority(IntPtr sid, uint i);
  [DllImport("advapi32.dll")] static extern IntPtr GetSidSubAuthorityCount(IntPtr sid);
  const uint QUERY_LIMITED = 0x1000, TOKEN_QUERY = 0x8;
  // Retorna "rid;uiaccess" ou "erro".
  public static string Info(int pid) {
    IntPtr p = OpenProcess(QUERY_LIMITED, false, pid);
    if (p == IntPtr.Zero) return "sem-acesso";
    IntPtr t;
    if (!OpenProcessToken(p, TOKEN_QUERY, out t)) { CloseHandle(p); return "sem-token"; }
    int len; GetTokenInformation(t, 25, IntPtr.Zero, 0, out len); // TokenIntegrityLevel
    IntPtr buf = Marshal.AllocHGlobal(len);
    string rid = "?";
    if (GetTokenInformation(t, 25, buf, len, out len)) {
      IntPtr sid = Marshal.ReadIntPtr(buf);
      int n = Marshal.ReadByte(GetSidSubAuthorityCount(sid));
      rid = "0x" + Marshal.ReadInt32(GetSidSubAuthority(sid, (uint)(n - 1))).ToString("X4");
    }
    Marshal.FreeHGlobal(buf);
    IntPtr ui = Marshal.AllocHGlobal(4);
    string uia = GetTokenInformation(t, 26, ui, 4, out len) ? Marshal.ReadInt32(ui).ToString() : "?"; // TokenUIAccess
    Marshal.FreeHGlobal(ui);
    CloseHandle(t); CloseHandle(p);
    return rid + ";" + uia;
  }
}
"@

$niveis = @{ "0x1000" = "Baixa"; "0x2000" = "Média"; "0x2100" = "Média+ (UIAccess)"; "0x3000" = "Alta"; "0x4000" = "Sistema" }
Get-Process | Where-Object { $Nomes -contains $_.ProcessName } | Sort-Object ProcessName | Select-Object -Unique ProcessName, Id | ForEach-Object {
  $i = [MovaToken]::Info($_.Id).Split(";")
  [pscustomobject]@{ Processo = $_.ProcessName; PID = $_.Id; Integridade = $i[0]; Nivel = $niveis[$i[0]]; UIAccess = if ($i.Count -gt 1) { $i[1] } else { "" } }
} | Format-Table -AutoSize | Out-String -Width 200
