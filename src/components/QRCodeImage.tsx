import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { Download, Loader2 } from 'lucide-react'

interface QRCodeImageProps {
  value: string
  size?: number
  onSave?: () => void
}

export default function QRCodeImage({ value, size = 240, onSave }: QRCodeImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const generate = async () => {
      try {
        // 使用 canvas 生成二维码
        const canvas = document.createElement('canvas')
        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        })
        if (!cancelled) {
          setDataUrl(canvas.toDataURL('image/png'))
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    generate()
    return () => { cancelled = true }
  }, [value, size])

  const handleDownload = useCallback(() => {
    if (!dataUrl) return
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const link = document.createElement('a')
    link.download = `medprep-qr-${dateStr}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onSave?.()
  }, [dataUrl, onSave])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    )
  }

  if (error || !dataUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ width: size, height: size }}>
        <p className="text-sm text-gray-400">二维码生成失败</p>
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <img
          src={dataUrl}
          alt="分享二维码"
          width={size}
          height={size}
          className="block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 py-1.5 px-3 rounded-lg hover:bg-orange-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        保存二维码
      </button>
    </div>
  )
}