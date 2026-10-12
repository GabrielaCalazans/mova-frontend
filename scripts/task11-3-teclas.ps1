# Task 11.3 — servidor de teclas REAIS (keybd_event) para o NVDA, uma linha de comando por vez no stdin:
#   ATIVAR                 traz a janela do navegador de teste para o primeiro plano
#   FG                     informa processo e título da janela em primeiro plano
#   TECLA <spec> [nvda]    envia a tecla só se o primeiro plano for o navegador de teste
#                          (ou o NVDA, com "nvda", para a Lista de Elementos); senão ABORTADO
#   SAIR
# Navegador de teste = chrome.exe/firefox.exe cuja linha de comando contém um dos -Perfis.
# Não eleva privilégios: roda em integridade média, como qualquer processo do usuário.
param([Parameter(Mandatory = $true)][string[]]$Perfis)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class MovaTeclas {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint mapType);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static string Titulo(IntPtr h) { var sb = new StringBuilder(300); GetWindowText(h, sb, 300); return sb.ToString(); }
}
"@

function Get-Navegador {
  $alvos = $Perfis | ForEach-Object { $_.ToLowerInvariant().Replace("/", "\") }
  @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='firefox.exe'" |
    Where-Object { $cl = "$($_.CommandLine)".ToLowerInvariant().Replace("/", "\"); ($alvos | Where-Object { $cl.Contains($_) }).Count } |
    ForEach-Object { [uint32]$_.ProcessId })
}
function Get-Primeiro {
  $h = [MovaTeclas]::GetForegroundWindow(); $p = [uint32]0
  [void][MovaTeclas]::GetWindowThreadProcessId($h, [ref]$p)
  $nome = (Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName
  return @{ pid = $p; nome = $nome; titulo = [MovaTeclas]::Titulo($h) }
}
function Responder([string]$linha) { [Console]::Out.WriteLine($linha); [Console]::Out.Flush() }
function Agora { (Get-Date).ToString("HH:mm:ss.fff") }

$CODIGOS = @{ tab = 0x09; enter = 0x0D; escape = 0x1B; space = 0x20; insert = 0x2D; delete = 0x2E; home = 0x24; end = 0x23; pageup = 0x21; pagedown = 0x22
  left = 0x25; up = 0x26; right = 0x27; down = 0x28; f6 = 0x75; f7 = 0x76; shift = 0x10; control = 0x11; alt = 0x12 }
$EXTENDIDAS = @(0x2D, 0x2E, 0x24, 0x23, 0x21, 0x22, 0x25, 0x26, 0x27, 0x28)
function Send-Vk([int]$vk, [bool]$soltar) {
  $flags = 0; if ($EXTENDIDAS -contains $vk) { $flags = $flags -bor 0x1 }; if ($soltar) { $flags = $flags -bor 0x2 }
  [MovaTeclas]::keybd_event([byte]$vk, [byte][MovaTeclas]::MapVirtualKey([uint32]$vk, 0), [uint32]$flags, [UIntPtr]::Zero)
}
function Resolve-Vk([string]$n) {
  if ($n -eq "nvda") { return $CODIGOS.insert }
  if ($CODIGOS.ContainsKey($n)) { return $CODIGOS[$n] }
  if ($n.Length -eq 1) { return [int][char]$n.ToUpperInvariant() }
  throw "tecla desconhecida: $n"
}

$navegador = Get-Navegador
Responder "PRONTO navegador=$($navegador -join ',')"
while ($true) {
  $linha = [Console]::In.ReadLine()
  if ($null -eq $linha -or $linha -eq "SAIR") { break }
  $partes = $linha.Split(" ")
  try {
    switch ($partes[0]) {
      "FG" { $f = Get-Primeiro; Responder "FG $(Agora) $($f.pid) $($f.nome) | $($f.titulo)" }
      "ATIVAR" {
        $navegador = Get-Navegador
        $janela = Get-Process -Id $navegador -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if (-not $janela) { Responder "ERRO sem-janela"; continue }
        $fg = [MovaTeclas]::GetForegroundWindow(); $pfg = [uint32]0
        $tfg = [MovaTeclas]::GetWindowThreadProcessId($fg, [ref]$pfg); $eu = [MovaTeclas]::GetCurrentThreadId()
        [void][MovaTeclas]::AttachThreadInput($eu, $tfg, $true)
        [void][MovaTeclas]::ShowWindow($janela.MainWindowHandle, 9); [void][MovaTeclas]::BringWindowToTop($janela.MainWindowHandle); [void][MovaTeclas]::SetForegroundWindow($janela.MainWindowHandle)
        [void][MovaTeclas]::AttachThreadInput($eu, $tfg, $false)
        Start-Sleep -Milliseconds 500
        $f = Get-Primeiro; Responder "ATIVADO $(Agora) $($f.pid) $($f.nome) | $($f.titulo)"
      }
      "TECLA" {
        $spec = $partes[1].ToLowerInvariant()
        $permitidos = @($navegador)
        if ($partes.Count -gt 2 -and $partes[2] -eq "nvda") { $permitidos += @(Get-Process | Where-Object { $_.ProcessName -like "nvda*" } | ForEach-Object { [uint32]$_.Id }) }
        $f = Get-Primeiro
        if ($permitidos -notcontains $f.pid) { Responder "ABORTADO $(Agora) $($f.pid) $($f.nome) | $($f.titulo)"; continue }
        $vks = @($spec.Split("+") | ForEach-Object { Resolve-Vk $_ })
        $t = Agora
        foreach ($vk in $vks) { Send-Vk $vk $false; Start-Sleep -Milliseconds 25 }
        [array]::Reverse($vks)
        foreach ($vk in $vks) { Send-Vk $vk $true; Start-Sleep -Milliseconds 25 }
        Responder "TECLA $t $spec $($f.nome) | $($f.titulo)"
      }
      default { Responder "ERRO comando $($partes[0])" }
    }
  } catch { Responder "ERRO $($_.Exception.Message)" }
}
