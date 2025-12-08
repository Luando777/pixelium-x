
Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\luisq\Desktop\APP_1 Antigravity\pixelium-x\logo.png"
$destPath = "c:\Users\luisq\Desktop\APP_1 Antigravity\pixelium-x\logo_social.png"

$image = [System.Drawing.Image]::FromFile($sourcePath)
$scaleFactor = 0.5 
$newWidth = [int]($image.Width * $scaleFactor)
$newHeight = [int]($image.Height * $scaleFactor)

$destImage = new-object System.Drawing.Bitmap $newWidth, $newHeight
$graphics = [System.Drawing.Graphics]::FromImage($destImage)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
$graphics.Dispose()

$destImage.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$destImage.Dispose()
$image.Dispose()

Write-Host "Image resized successfully to $destPath"
