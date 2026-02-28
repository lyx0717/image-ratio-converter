import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'

/**
 * 平台预设比例配置
 */
interface RatioPreset {
  id: string;
  name: string;
  ratio: number;
  width: number;
  height: number;
  icon: string;
  description: string;
}

const ratioPresets: RatioPreset[] = [
  { id: 'xiaohongshu-cover', name: '小红书封面', ratio: 3/4, width: 1080, height: 1440, icon: '📕', description: '3:4' },
  { id: 'xiaohongshu-square', name: '小红书方形', ratio: 1, width: 1080, height: 1080, icon: '📕', description: '1:1' },
  { id: 'douyin-cover', name: '抖音封面', ratio: 9/16, width: 1080, height: 1920, icon: '🎵', description: '9:16' },
  { id: 'douyin-video', name: '抖音视频', ratio: 16/9, width: 1920, height: 1080, icon: '🎵', description: '16:9' },
  { id: 'weibo-cover', name: '微博封面', ratio: 16/9, width: 1920, height: 1080, icon: '📱', description: '16:9' },
  { id: 'weibo-square', name: '微博方形', ratio: 1, width: 1080, height: 1080, icon: '📱', description: '1:1' },
  { id: 'bilibili-cover', name: 'B站封面', ratio: 16/9, width: 1920, height: 1080, icon: '📺', description: '16:9' },
  { id: 'bilibili-vertical', name: 'B站竖版', ratio: 9/16, width: 1080, height: 1920, icon: '📺', description: '9:16' },
  { id: 'instagram-square', name: 'IG方形', ratio: 1, width: 1080, height: 1080, icon: '📷', description: '1:1' },
  { id: 'instagram-portrait', name: 'IG人像', ratio: 4/5, width: 1080, height: 1350, icon: '📷', description: '4:5' },
  { id: 'youtube-thumbnail', name: 'YouTube', ratio: 16/9, width: 1280, height: 720, icon: '▶️', description: '16:9' },
  { id: 'custom', name: '自定义', ratio: 1, width: 1080, height: 1080, icon: '⚙️', description: '自定义' },
]

/**
 * 创建模糊背景图片
 */
function createBlurredBackground(img: HTMLImageElement, targetWidth: number, targetHeight: number, blurAmount: number): HTMLCanvasElement {
  const blurCanvas = document.createElement('canvas')
  const blurCtx = blurCanvas.getContext('2d')
  if (!blurCtx) return blurCanvas

  const smallSize = Math.max(10, Math.min(50, blurAmount / 2))
  blurCanvas.width = smallSize
  blurCanvas.height = smallSize

  const scale = Math.max(targetWidth / img.width, targetHeight / img.height) * 1.2
  const scaledWidth = img.width * scale
  const scaledHeight = img.height * scale

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = targetWidth
  tempCanvas.height = targetHeight
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return blurCanvas

  tempCtx.drawImage(img, (targetWidth - scaledWidth) / 2, (targetHeight - scaledHeight) / 2, scaledWidth, scaledHeight)

  blurCtx.drawImage(tempCanvas, 0, 0, smallSize, smallSize)

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = targetWidth
  resultCanvas.height = targetHeight
  const resultCtx = resultCanvas.getContext('2d')
  if (!resultCtx) return blurCanvas

  resultCtx.imageSmoothingEnabled = true
  resultCtx.imageSmoothingQuality = 'high'
  resultCtx.drawImage(blurCanvas, 0, 0, targetWidth, targetHeight)

  return resultCanvas
}

/**
 * 图片比例转换工具主组件
 * @returns JSX元素
 */
function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [convertedImages, setConvertedImages] = useState<Map<string, string>>(new Map())
  const [selectedPreset, setSelectedPreset] = useState<RatioPreset | null>(null)
  const [customWidth, setCustomWidth] = useState<number>(1080)
  const [customHeight, setCustomHeight] = useState<number>(1080)
  const [blurIntensity, setBlurIntensity] = useState<number>(30)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /**
   * 处理图片上传
   */
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setOriginalFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
        setConvertedImages(new Map())
        setSelectedPreset(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  /**
   * 处理拖拽上传
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setOriginalFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
        setConvertedImages(new Map())
        setSelectedPreset(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  /**
   * 转换图片比例
   */
  const convertImage = useCallback(async (preset: RatioPreset) => {
    if (!originalImage || !canvasRef.current) return

    setSelectedPreset(preset)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    
    img.onload = () => {
      const targetWidth = preset.id === 'custom' ? customWidth : preset.width
      const targetHeight = preset.id === 'custom' ? customHeight : preset.height
      const targetRatio = targetWidth / targetHeight
      const originalRatio = img.width / img.height

      canvas.width = targetWidth
      canvas.height = targetHeight

      if (Math.abs(originalRatio - targetRatio) < 0.01) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      } else {
        const bgCanvas = createBlurredBackground(img, targetWidth, targetHeight, blurIntensity)
        ctx.drawImage(bgCanvas, 0, 0)

        const fitScale = Math.min(targetWidth / img.width, targetHeight / img.height)
        const drawWidth = img.width * fitScale
        const drawHeight = img.height * fitScale
        const drawX = (targetWidth - drawWidth) / 2
        const drawY = (targetHeight - drawHeight) / 2

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      }

      const convertedDataUrl = canvas.toDataURL('image/png', 1.0)
      setConvertedImages(prev => {
        const newMap = new Map(prev)
        newMap.set(preset.id, convertedDataUrl)
        return newMap
      })
    }

    img.src = originalImage
  }, [originalImage, customWidth, customHeight, blurIntensity])

  /**
   * 下载转换后的图片
   */
  const downloadImage = useCallback((presetId: string) => {
    const dataUrl = convertedImages.get(presetId)
    if (!dataUrl) return

    const preset = ratioPresets.find(p => p.id === presetId)
    const link = document.createElement('a')
    link.download = `${originalFileName.split('.')[0]}_${preset?.name || 'converted'}.png`
    link.href = dataUrl
    link.click()
  }, [convertedImages, originalFileName])

  /**
   * 批量转换所有预设
   */
  const convertAllPresets = useCallback(async () => {
    if (!originalImage) return
    
    for (const preset of ratioPresets.slice(0, -1)) {
      await convertImage(preset)
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }, [originalImage, convertImage])

  /**
   * 重置所有状态
   */
  const resetAll = useCallback(() => {
    setOriginalImage(null)
    setOriginalFileName('')
    setConvertedImages(new Map())
    setSelectedPreset(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  useEffect(() => {
    if (selectedPreset && originalImage) {
      convertImage(selectedPreset)
    }
  }, [blurIntensity, customWidth, customHeight])

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          <span className="title-icon">🖼️</span>
          图片比例转换工具
        </h1>
        <p className="subtitle">一键生成多平台封面图，完整保留图片内容</p>
      </header>

      <main className="main-content">
        {!originalImage ? (
          <div className="upload-section glass-card">
            <div 
              className="upload-area"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-placeholder">
                <div className="upload-icon">📁</div>
                <p className="upload-text">拖拽图片到此处或点击上传</p>
                <p className="upload-hint">支持 JPG、PNG、WebP 格式</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="top-section">
              <div className="upload-section glass-card">
                <div 
                  className="upload-area has-image"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="preview-container">
                    <img src={originalImage} alt="原始图片" className="preview-image" />
                    <div className="preview-overlay">
                      <span>更换图片</span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                </div>
                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={resetAll}>
                    重新上传
                  </button>
                  <button className="btn btn-primary" onClick={convertAllPresets}>
                    一键转换全部
                  </button>
                </div>

                <div className="settings-section">
                  <h3 className="section-title">转换设置</h3>
                  <div className="setting-item">
                    <label>背景模糊强度</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={blurIntensity}
                      onChange={(e) => setBlurIntensity(Number(e.target.value))}
                      className="slider"
                    />
                    <span className="setting-value">{blurIntensity}px</span>
                  </div>
                </div>

                {selectedPreset?.id === 'custom' && (
                  <div className="custom-ratio-section">
                    <h3 className="section-title">自定义尺寸</h3>
                    <div className="custom-inputs">
                      <div className="input-group">
                        <label>宽度</label>
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          min="100"
                          max="4096"
                        />
                      </div>
                      <span className="ratio-symbol">×</span>
                      <div className="input-group">
                        <label>高度</label>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          min="100"
                          max="4096"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="presets-section glass-card">
                <h2 className="section-title">选择目标比例</h2>
                <div className="presets-grid">
                  {ratioPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`preset-card ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                      onClick={() => convertImage(preset)}
                    >
                      <div className="preset-icon">{preset.icon}</div>
                      <div className="preset-info">
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-ratio">{preset.description}</span>
                        <span className="preset-size">{preset.width} × {preset.height}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {convertedImages.size > 0 && (
              <div className="results-section glass-card">
                <h2 className="section-title">转换结果 ({convertedImages.size})</h2>
                <div className="results-grid">
                  {Array.from(convertedImages.entries()).map(([presetId, dataUrl]) => {
                    const preset = ratioPresets.find(p => p.id === presetId)
                    return (
                      <div key={presetId} className="result-card">
                        <div className="result-preview">
                          <img src={dataUrl} alt={preset?.name} />
                        </div>
                        <div className="result-info">
                          <span className="result-name">{preset?.name}</span>
                          <span className="result-size">{preset?.width} × {preset?.height}</span>
                        </div>
                        <button 
                          className="btn btn-download"
                          onClick={() => downloadImage(presetId)}
                        >
                          ⬇️ 下载图片
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>

      <footer className="footer">
        <p>支持小红书、抖音、微博、B站等主流平台</p>
      </footer>
    </div>
  )
}

export default App
