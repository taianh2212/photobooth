"use client"

import { useState, useCallback, useEffect } from "react"
import type { AppStep, CapturedPhoto, FrameTemplate, FrameDecoration, PhotoboothLayout } from "@/lib/types"
import { defaultFrameTemplates } from "@/lib/frame-templates"
import { LayoutSelector } from "./layout-selector"
import { FrameSelector } from "./frame-selector"
import { FrameCreator } from "./frame-creator"
import { CameraCapture } from "./camera-capture"
import { PhotoUpload } from "./photo-upload"
import { PhotoSelector } from "./photo-selector"
import { FrameDesigner } from "./frame-designer"
import { PhotoPreview } from "./photo-preview"
import { Camera, ImagePlus, Palette, Trash2 } from "lucide-react"

const CUSTOM_FRAMES_KEY = "photobooth-custom-frames"

export function PhotoboothApp() {
  const [step, setStep] = useState<AppStep>("home")
  const [mode, setMode] = useState<"camera" | "upload">("camera")
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<(CapturedPhoto | null)[]>([])
  const [decoration, setDecoration] = useState<FrameDecoration>({ stickers: [], texts: [] })
  const [customFrames, setCustomFrames] = useState<FrameTemplate[]>([])
  const [selectedLayout, setSelectedLayout] = useState<PhotoboothLayout | null>(null)

  // Load custom frames from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FRAMES_KEY)
      if (saved) {
        setCustomFrames(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load custom frames:", e)
    }
  }, [])

  // Save custom frames to localStorage
  const saveCustomFrames = useCallback((frames: FrameTemplate[]) => {
    setCustomFrames(frames)
    try {
      localStorage.setItem(CUSTOM_FRAMES_KEY, JSON.stringify(frames))
    } catch (e) {
      console.error("Failed to save custom frames:", e)
    }
  }, [])

  // All frames including custom ones
  const allFrames = [...defaultFrameTemplates, ...customFrames]

  // Filter frames by layout type
  const getFramesByLayout = useCallback((layout: PhotoboothLayout | null) => {
    if (!layout) return allFrames
    return allFrames.filter((f) => f.layout === layout)
  }, [allFrames])

  const handleSelectMode = useCallback((m: "camera" | "upload") => {
    setMode(m)
    setStep("select-layout")
  }, [])

  const handleCreateFrame = useCallback(() => {
    setStep("create-frame-layout")
  }, [])

  const handleLayoutSelected = useCallback((layout: PhotoboothLayout) => {
    setSelectedLayout(layout)
    setStep("select-frame")
  }, [])

  const handleCreateFrameLayoutSelected = useCallback((layout: PhotoboothLayout) => {
    setSelectedLayout(layout)
    setStep("create-frame-design")
  }, [])

  const handleFrameSelected = useCallback((frame: FrameTemplate) => {
    setSelectedFrame(frame)
    // Reset decoration to frame's built-in decoration or empty
    setDecoration(frame.decoration || { stickers: [], texts: [] })
  }, [])

  const handleFrameContinue = useCallback(() => {
    setStep("capture")
  }, [])

  const handlePhotosComplete = useCallback((photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos)
    setStep("select-photos")
  }, [])

  const handlePhotoSelectionComplete = useCallback((photos: (CapturedPhoto | null)[]) => {
    setSelectedPhotos(photos)
    setStep("design")
  }, [])

  const handleDesignComplete = useCallback((dec: FrameDecoration) => {
    setDecoration(dec)
    setStep("preview")
  }, [])

  const handleFrameSaved = useCallback((frame: FrameTemplate) => {
    const updated = [...customFrames, frame]
    saveCustomFrames(updated)
    setStep("home")
  }, [customFrames, saveCustomFrames])

  const handleDeleteCustomFrame = useCallback((frameId: string) => {
    const updated = customFrames.filter((f) => f.id !== frameId)
    saveCustomFrames(updated)
  }, [customFrames, saveCustomFrames])

  const handleRestart = useCallback(() => {
    setStep("home")
    setSelectedFrame(null)
    setSelectedLayout(null)
    setCapturedPhotos([])
    setSelectedPhotos([])
    setDecoration({ stickers: [], texts: [] })
  }, [])

  // Get layout label for display
  const getLayoutLabel = (layout: PhotoboothLayout) => {
    switch (layout) {
      case 'vertical': return 'Strip Dọc'
      case 'grid-2x2': return 'Lưới 2x2'
      case 'grid-2x3': return 'Lưới 2x3'
      case 'horizontal': return 'Strip Ngang'
      default: return layout
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Photobooth Studio</h1>
          </button>

          {step !== "home" && (
            <div className="flex items-center gap-2">
              {(["select-layout", "select-frame", "capture", "select-photos", "design", "preview"] as AppStep[]).map((s, i) => {
                const steps: AppStep[] = ["select-layout", "select-frame", "capture", "select-photos", "design", "preview"]
                const isCreateFlow = step === "create-frame-layout" || step === "create-frame-design"
                if (isCreateFlow) return null
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-1 ${i > 0 ? "ml-1" : ""}`}
                  >
                    {i > 0 && <div className="w-6 h-px bg-border" />}
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${s === step
                        ? "bg-primary"
                        : steps.indexOf(s) < steps.indexOf(step)
                          ? "bg-primary/40"
                          : "bg-border"
                        }`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {step === "home" && (
          <div className="flex flex-col items-center gap-12 py-16">
            <div className="text-center max-w-lg">
              <h2 className="text-4xl font-bold text-foreground text-balance">
                Photobooth Studio
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Chụp ảnh photobooth trực tuyến. Chọn khung ảnh, chụp hoặc tải ảnh lên và tải về thành phẩm miễn phí.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <button
                type="button"
                onClick={() => handleSelectMode("camera")}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-card-foreground">Chụp ảnh</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sử dụng camera để chụp ảnh
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode("upload")}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all"
              >
                <div className="w-20 h-20 rounded-2xl bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                  <ImagePlus className="w-10 h-10 text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-card-foreground">Tải ảnh lên</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chọn ảnh từ máy của bạn
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCreateFrame}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-green-500 hover:bg-green-500/5 transition-all"
              >
                <div className="w-20 h-20 rounded-2xl bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center transition-colors">
                  <Palette className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-card-foreground">Tạo khung ảnh</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thiết kế khung ảnh tùy chỉnh
                  </p>
                </div>
              </button>
            </div>

            {/* Custom frames preview */}
            {customFrames.length > 0 && (
              <div className="w-full max-w-4xl">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-500" />
                  Khung ảnh đã tạo ({customFrames.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customFrames.map((frame) => (
                    <div
                      key={frame.id}
                      className="relative group rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition-colors"
                    >
                      <div
                        className="aspect-[3/4] rounded-lg mb-2 flex items-center justify-center"
                        style={{ backgroundColor: frame.backgroundColor }}
                      >
                        <span className="text-xs text-muted-foreground/50">
                          {frame.slots.length} ảnh
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{frame.name}</p>
                      <p className="text-xs text-muted-foreground">{getLayoutLabel(frame.layout)}</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomFrame(frame.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa khung"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
              {[
                { title: "Nhiều kiểu khung", desc: "Strip dọc, lưới 2x2, lưới 2x3, strip ngang" },
                { title: "Tùy chỉnh khung", desc: "Tạo khung với sticker, chữ và màu nền riêng" },
                { title: "Tải về miễn phí", desc: "Lưu thành phẩm dạng PNG chất lượng cao" },
              ].map((feature) => (
                <div key={feature.title} className="text-center p-4">
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "select-layout" && (
          <LayoutSelector
            onSelect={handleLayoutSelected}
            onBack={() => setStep("home")}
            title="Chọn kiểu khung photobooth"
            description="Chọn kiểu bố cục khung ảnh, sau đó bạn sẽ thấy các mẫu khung phù hợp"
          />
        )}

        {step === "create-frame-layout" && (
          <LayoutSelector
            onSelect={handleCreateFrameLayoutSelected}
            onBack={() => setStep("home")}
            title="Tạo khung ảnh - Chọn kiểu khung"
            description="Chọn kiểu bố cục cho khung ảnh bạn muốn thiết kế"
          />
        )}

        {step === "create-frame-design" && selectedLayout && (
          <FrameCreator
            layout={selectedLayout}
            onSave={handleFrameSaved}
            onBack={() => setStep("create-frame-layout")}
          />
        )}

        {step === "select-frame" && (
          <FrameSelector
            frames={getFramesByLayout(selectedLayout)}
            selectedFrame={selectedFrame}
            onSelect={handleFrameSelected}
            onBack={() => setStep("select-layout")}
            onContinue={handleFrameContinue}
          />
        )}

        {step === "capture" && mode === "camera" && (
          <CameraCapture
            onComplete={handlePhotosComplete}
            onBack={() => setStep("select-frame")}
            maxPhotos={6}
            intervalSeconds={6}
          />
        )}

        {step === "capture" && mode === "upload" && (
          <PhotoUpload
            onComplete={handlePhotosComplete}
            onBack={() => setStep("select-frame")}
            maxPhotos={6}
          />
        )}

        {step === "select-photos" && selectedFrame && (
          <PhotoSelector
            photos={capturedPhotos}
            frame={selectedFrame}
            onComplete={handlePhotoSelectionComplete}
            onBack={() => setStep("capture")}
          />
        )}

        {step === "design" && selectedFrame && (
          <FrameDesigner
            frame={selectedFrame}
            photos={selectedPhotos}
            onComplete={handleDesignComplete}
            onBack={() => setStep("select-photos")}
            initialDecoration={selectedFrame.decoration}
          />
        )}

        {step === "preview" && selectedFrame && (
          <PhotoPreview
            frame={selectedFrame}
            photos={selectedPhotos}
            decoration={decoration}
            onBack={() => setStep("design")}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}
