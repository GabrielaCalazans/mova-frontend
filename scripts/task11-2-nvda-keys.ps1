# Task 11.2 — envia teclas REAIS (keybd_event, nível do sistema) para o Chrome do piloto NVDA.
# Teclas sintéticas do Playwright (CDP) não passam pelo hook de teclado do NVDA; estas passam.
# Guarda: só envia enquanto a janela em primeiro plano pertencer ao Chrome do piloto (identificado
# pelo --user-data-dir) ou ao próprio NVDA (Lista de Elementos). Caso contrário, aborta (exit 3).
# Uso: -UserDataDir <dir> -Keys "h,h,shift+tab,nvda+f7,alt+h,escape" [-DelayMs 1100] [-Ativar]
param(
  [Parameter(Mandatory = $true)][string]$UserDataDir,
  [Parameter(Mandatory = $true)][string]$Keys,
  [int]$DelayMs = 1100,
  [switch]$Ativar,
  [switch]$PermitirNvda
)
$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class MovaKeys {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint mapType);
}
"@

$dirNorm = $UserDataDir.ToLowerInvariant().Replace("/", "\")
$chromePids = @(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine.ToLowerInvariant().Replace("/", "\").Contains($dirNorm) } |
  ForEach-Object { [uint32]$_.ProcessId })
if (-not $chromePids.Count) { Write-Output "ERRO chrome-do-piloto-nao-encontrado"; exit 2 }
# Janela do próprio NVDA (Lista de Elementos) só é aceita quando o passo pede (-PermitirNvda).
$permitidos = $chromePids
if ($PermitirNvda) { $permitidos += @(Get-Process | Where-Object { $_.ProcessName -like "nvda*" } | ForEach-Object { [uint32]$_.Id }) }

function Get-DonoForeground {
  $h = [MovaKeys]::GetForegroundWindow()
  $dono = [uint32]0
  [void][MovaKeys]::GetWindowThreadProcessId($h, [ref]$dono)
  return $dono
}

if ($Ativar) {
  $janela = Get-Process -Id $chromePids | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (-not $janela) { Write-Output "ERRO janela-do-chrome-nao-encontrada"; exit 2 }
  $h = $janela.MainWindowHandle
  $fg = [MovaKeys]::GetForegroundWindow()
  $pidFg = [uint32]0
  $tFg = [MovaKeys]::GetWindowThreadProcessId($fg, [ref]$pidFg)
  $tEu = [MovaKeys]::GetCurrentThreadId()
  [void][MovaKeys]::AttachThreadInput($tEu, $tFg, $true)
  [void][MovaKeys]::ShowWindow($h, 9)
  [void][MovaKeys]::BringWindowToTop($h)
  [void][MovaKeys]::SetForegroundWindow($h)
  [void][MovaKeys]::AttachThreadInput($tEu, $tFg, $false)
  Start-Sleep -Milliseconds 600
}

$CODIGOS = @{ tab = 0x09; enter = 0x0D; escape = 0x1B; space = 0x20; insert = 0x2D; down = 0x28; up = 0x26; f7 = 0x76; shift = 0x10; alt = 0x12; control = 0x11 }
$EXTENDIDAS = @(0x2D, 0x28, 0x26)

function Send-Vk([int]$vk, [bool]$soltar) {
  $flags = 0
  if ($EXTENDIDAS -contains $vk) { $flags = $flags -bor 0x1 }
  if ($soltar) { $flags = $flags -bor 0x2 }
  $scan = [byte][MovaKeys]::MapVirtualKey([uint32]$vk, 0)
  [MovaKeys]::keybd_event([byte]$vk, $scan, [uint32]$flags, [UIntPtr]::Zero)
}

function Resolve-Vk([string]$nome) {
  if ($nome -eq "nvda") { return $CODIGOS.insert }
  if ($CODIGOS.ContainsKey($nome)) { return $CODIGOS[$nome] }
  if ($nome.Length -eq 1) { return [int][char]$nome.ToUpperInvariant() }
  throw "Tecla desconhecida: $nome"
}

foreach ($tecla in $Keys.Split(",")) {
  $tecla = $tecla.Trim().ToLowerInvariant()
  if (-not $tecla) { continue }
  if ($tecla -eq "pausa") { Start-Sleep -Milliseconds 2500; continue }
  $dono = Get-DonoForeground
  if ($permitidos -notcontains $dono) {
    Write-Output ("ABORTADO {0:HH:mm:ss.fff} foreground-pid={1} tecla={2}" -f (Get-Date), $dono, $tecla)
    exit 3
  }
  $partes = @($tecla.Split("+") | ForEach-Object { Resolve-Vk $_ })
  Write-Output ("TECLA {0:HH:mm:ss.fff} {1}" -f (Get-Date), $tecla)
  foreach ($vk in $partes) { Send-Vk $vk $false; Start-Sleep -Milliseconds 30 }
  [array]::Reverse($partes)
  foreach ($vk in $partes) { Send-Vk $vk $true; Start-Sleep -Milliseconds 30 }
  Start-Sleep -Milliseconds $DelayMs
}
Write-Output ("FIM {0:HH:mm:ss.fff}" -f (Get-Date))
