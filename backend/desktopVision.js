import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function captureDesktopScreen() {
    if (process.platform !== 'win32') {
        return null;
    }

    try {
        const psScriptPath = path.join(__dirname, 'capture.ps1');
        if (!fs.existsSync(psScriptPath)) {
            const scriptContent = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bytes = $ms.ToArray()
$g.Dispose()
$bmp.Dispose()
$ms.Dispose()
[System.Convert]::ToBase64String($bytes)
`;
            fs.writeFileSync(psScriptPath, scriptContent, 'utf8');
        }

        const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
            maxBuffer: 20 * 1024 * 1024,
            timeout: 5000
        });

        const b64 = out.toString().trim();
        if (b64 && b64.length > 500) {
            return `data:image/jpeg;base64,${b64}`;
        }
    } catch (e) {
        console.error('Desktop screen capture failed:', e.message);
    }
    return null;
}
