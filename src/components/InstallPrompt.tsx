import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem('medprep_install_dismissed') === '1') return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (isIos()) {
      const timer = window.setTimeout(() => setVisible(true), 3000)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    localStorage.setItem('medprep_install_dismissed', '1')
    setVisible(false)
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    dismiss()
  }

  if (!visible || isStandalone()) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
      <div className="bg-white border border-orange-200 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <div className="bg-orange-100 rounded-xl p-2 flex-shrink-0">
          <Download className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">添加到主屏幕</p>
          <p className="text-xs text-gray-500 mt-1">
            {isIos()
              ? '点击 Safari 底部分享按钮，选择「添加到主屏幕」，方便查看用药提醒。'
              : '安装到桌面后，可更快打开并接收用药提醒通知。'}
          </p>
          {!isIos() && deferredPrompt && (
            <button
              onClick={() => void handleInstall()}
              className="mt-2 text-sm bg-orange-500 text-white px-4 py-2 rounded-xl font-medium"
            >
              立即安装
            </button>
          )}
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 p-1" aria-label="关闭">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
