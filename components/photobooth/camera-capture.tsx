"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { CapturedPhoto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw, Square, FlipHorizontal2 } from "lucide-react"

interface CameraCaptureProps {
  onComplete: (photos: CapturedPhoto[]) => void
  onBack: () => void
  maxPhotos?: number
  intervalSeconds?: number
}

export function CameraCapture({
  onComplete,
  onBack,
  maxPhotos = 8,
  intervalSeconds = 6,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const [mirrored, setMirrored] = useState(true)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [cameraError, setCameraError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
      } catch (initialErr) {
        console.warn("Initial camera constraints failed, trying fallback...", initialErr)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch (err: any) {
      console.error("Cannot access camera", err)
      let errorMessage = err?.message || "Loi truy cap camera. Vui long cap quyen truy cap camera cho trinh duyet."

      // Specifically handle NotReadableError which is usually caused by another app using the camera
      if (err?.name === "NotReadableError" || errorMessage.includes("Could not start video source")) {
        errorMessage = "Camera dang duoc su dung boi ung dung khac (Zoom, Meet...) hoac bi loi phan cung. Vui long tat cac ung dung do hoac khoi dong lai trinh duyet va thu lai."
      }

      setCameraError(errorMessage)
      setCameraReady(false)
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [startCamera])

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    if (mirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    if (mirrored) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 200)

    const dataUrl = canvas.toDataURL("image/png")
    return {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: Date.now(),
    } as CapturedPhoto
  }, [mirrored])

  const startAutoCapture = useCallback(() => {
    setIsCapturing(true)
    setCurrentPhotoIndex(0)
    setPhotos([])
    setCountdown(3)

    let currentCount = 3
    const firstCountdown = setInterval(() => {
      currentCount--
      setCountdown(currentCount)
      if (currentCount === 0) {
        clearInterval(firstCountdown)
        const photo = takePhoto()
        if (photo) {
          setPhotos([photo])
          setCurrentPhotoIndex(1)
        }
        if (maxPhotos <= 1) {
          setIsCapturing(false)
          setCountdown(null)
          if (photo) onComplete([photo])
          return
        }
        let photosTaken = 1
        setCountdown(intervalSeconds)
        let nextCount = intervalSeconds
        countdownRef.current = setInterval(() => {
          nextCount--
          setCountdown(nextCount)
          if (nextCount === 0) {
            const newPhoto = takePhoto()
            if (newPhoto) {
              photosTaken++
              setPhotos((prev) => {
                const updated = [...prev, newPhoto]
                if (photosTaken >= maxPhotos) {
                  if (countdownRef.current) clearInterval(countdownRef.current)
                  setIsCapturing(false)
                  setCountdown(null)
                  onComplete(updated)
                }
                return updated
              })
              setCurrentPhotoIndex(photosTaken)
            }
            if (photosTaken < maxPhotos) {
              nextCount = intervalSeconds
              setCountdown(intervalSeconds)
            }
          }
        }, 1000)
      }
    }, 1000)
  }, [takePhoto, maxPhotos, intervalSeconds, onComplete])

  const stopCapture = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setIsCapturing(false)
    setCountdown(null)
    if (photos.length > 0) {
      onComplete(photos)
    }
  }, [photos, onComplete])

  const resetCapture = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setIsCapturing(false)
    setCountdown(null)
    setPhotos([])
    setCurrentPhotoIndex(0)
  }, [])

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-secondary">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {flashActive && (
          <div className="absolute inset-0 bg-foreground/90 animate-pulse pointer-events-none" />
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-[10rem] font-black select-none leading-none animate-pulse"
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                textShadow: '0 0 40px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4)',
                WebkitTextStroke: '2px rgba(0,0,0,0.15)'
              }}
            >
              {countdown}
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {currentPhotoIndex}/{maxPhotos}
            </span>
          </div>
        )}

        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-lg">Dang ket noi camera...</div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80">
            <div className="text-destructive mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </div>
            <p className="text-destructive font-semibold mb-2 text-lg">Khong the truy cap camera</p>
            <p className="text-white mb-6 max-w-sm">{cameraError}</p>
            <Button onClick={startCamera} variant="outline" className="bg-white text-black hover:bg-gray-200">
              Thu lai
            </Button>
          </div>
        )}
      </div>

      {/* Recent photos strip */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto w-full pb-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/30"
            >
              <img
                src={photo.dataUrl || "/placeholder.svg"}
                alt={`Anh ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4 w-full justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="sr-only">Quay lai</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setMirrored(!mirrored)}
          className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground"
        >
          <FlipHorizontal2 className="w-5 h-5" />
          <span className="sr-only">Lat anh</span>
        </Button>

        {!isCapturing ? (
          <Button
            onClick={startAutoCapture}
            disabled={!cameraReady}
            className="rounded-full w-20 h-20 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            size="icon"
          >
            <Camera className="w-8 h-8" />
            <span className="sr-only">Bat dau chup</span>
          </Button>
        ) : (
          <Button
            onClick={stopCapture}
            className="rounded-full w-20 h-20 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
            size="icon"
          >
            <Square className="w-8 h-8" />
            <span className="sr-only">Dung lai</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={toggleCamera}
          className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="sr-only">Doi camera</span>
        </Button>

        {photos.length > 0 && !isCapturing && (
          <Button
            variant="outline"
            size="icon"
            onClick={resetCapture}
            className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="sr-only">Chup lai</span>
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {isCapturing
          ? `Dang chup... ${currentPhotoIndex}/${maxPhotos} anh`
          : `An nut chup de bat dau - ${maxPhotos} anh, cach ${intervalSeconds}s`}
      </p>
    </div>
  )
}
