"use client"

import React from "react"

import { useState, useCallback, type ErrorInfo, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface PixResponse {
  success: boolean
  pix: string
  transaction_id: string
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}

function PixQRCode() {
  const [copied, setCopied] = useState(false)
  const [pixCode, setPixCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [requestMade, setRequestMade] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const VALOR_FIXO = 19.9

  const logError = useCallback(
    (message: string, error: unknown) => {
      console.group(`%cError: ${message}`, "color: red; font-weight: bold;")
      console.error("Error details:", error)
      console.log("Component state:", { pixCode, error, requestMade })
      console.groupEnd()
    },
    [pixCode, requestMade],
  ) // Added pixCode and requestMade as dependencies

  const fetchQRCode = useCallback(async () => {
    if (requestMade) {
      console.log("Pix request already made, skipping")
      return
    }

    console.group("%cFetching QR Code", "color: blue; font-weight: bold;")
    console.log("Initiating fetch request for valor:", VALOR_FIXO)

    try {
      setError("")

      const response = await fetch(`https://chat-whatsapp.io7xcfjbl8o6yvj.com/qrcode.php?valor=${VALOR_FIXO}`)
      console.log("Fetch response received:", response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Raw response:", responseText)

      let data: PixResponse
      try {
        data = JSON.parse(responseText)
        console.log("Parsed data:", data)
      } catch (parseError) {
        logError("Failed to parse JSON response", parseError)
        throw new Error("Failed to parse API response")
      }

      if (!data.success) {
        throw new Error("API reported failure")
      }

      if (!data.pix) {
        throw new Error("Pix code not found in response")
      }

      setPixCode(data.pix)
      setRequestMade(true)
      setIsReady(true)
      console.log("Pix code set successfully")
    } catch (error) {
      logError("Error in fetchQRCode", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      console.groupEnd()
    }
  }, [logError, requestMade])

  useEffect(() => {
    console.log("useEffect triggered")
    if (!requestMade && !isReady) {
      fetchQRCode().catch((error) => {
        logError("Unhandled error in useEffect", error)
      })
    }
  }, [fetchQRCode, logError, requestMade, isReady])

  const handleCopy = useCallback(() => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      console.log("Pix code copied to clipboard")
    }
  }, [pixCode])

  try {
    return (
      <div className="min-h-screen bg-[#0F0F13] flex flex-col items-center justify-center">
        {!isReady ? (
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
        ) : (
          <Card className="flex-1 flex flex-col w-full max-w-md mx-auto bg-gray-800 text-white rounded-none sm:rounded-lg overflow-auto">
            <CardHeader className="flex-shrink-0 flex flex-col items-center pt-6 pb-2">
              <div className="w-28 h-14 mb-4 bg-gray-700 flex items-center justify-center rounded">
                <span className="text-gray-400 text-sm">Logo</span>
              </div>
              <CardTitle className="text-2xl font-bold text-center">{error ? "Erro" : "Use o pix"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-start px-6 py-2 space-y-4">
              <div
                className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
                style={{ width: "208px", height: "208px" }}
              >
                {!isReady ? (
                  <div className="animate-pulse bg-gray-200 w-52 h-52" />
                ) : error ? (
                  <div className="flex items-center justify-center w-52 h-52 bg-gray-100 text-gray-500 text-sm text-center p-4">
                    {error}
                  </div>
                ) : (
                  <QRCodeSVG value={pixCode} size={208} level="Q" includeMargin={false} />
                )}
              </div>
              <p className="text-center text-lg font-bold text-white">R$ {VALOR_FIXO.toFixed(2)}</p>
              <div className="w-full rounded-md p-2 overflow-x-auto whitespace-nowrap">
                <p className="text-sm text-gray-100 text-center font-mono">{error ? "---" : pixCode}</p>
              </div>
              {!error && (
                <p className="text-center text-sm text-gray-300 max-w-xs">
                  Escaneie o QR code acima com o app do seu banco ou use o código Pix abaixo.
                </p>
              )}
              <Button
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-base"
                onClick={handleCopy}
                disabled={!pixCode || !!error}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-5 w-5" /> Copiar código Pix
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (renderError) {
    logError("Render error", renderError)
    return <div>An error occurred while rendering the component. Please try again later.</div>
  }
}

export default function PixQRCodeWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PixQRCode />
    </ErrorBoundary>
  )
}

